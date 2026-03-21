import type { ToolCall, ToolResult, AgentStep } from '$types/core';
import { Sandbox, SandboxError } from './sandbox';

export interface ToolExecutionContext {
	sandbox: Sandbox;
	githubToken?: string;
	repoFullName?: string;
	onStep?: (step: AgentStep) => void;
}

export async function executeToolCall(
	toolCall: ToolCall,
	context: ToolExecutionContext
): Promise<ToolResult> {
	const { sandbox, onStep } = context;
	const funcName = toolCall.function.name;
	let args: Record<string, string>;

	try {
		args = JSON.parse(toolCall.function.arguments);
	} catch {
		return {
			toolCallId: toolCall.id,
			content: `Failed to parse tool arguments: ${toolCall.function.arguments}`,
			isError: true
		};
	}

	const step: AgentStep = {
		id: toolCall.id,
		type: mapFunctionToStepType(funcName),
		status: 'running',
		description: describeToolCall(funcName, args),
		startedAt: new Date().toISOString()
	};

	onStep?.(step);

	try {
		let result: string;

		switch (funcName) {
			case 'read_file':
				result = handleReadFile(sandbox, args);
				break;
			case 'write_file':
				result = handleWriteFile(sandbox, args);
				break;
			case 'edit_file':
				result = handleEditFile(sandbox, args);
				break;
			case 'run_command':
				result = handleRunCommand(sandbox, args);
				break;
			case 'search_files':
				result = handleSearchFiles(sandbox, args);
				break;
			case 'create_pr':
				result = await handleCreatePR(sandbox, args, context);
				break;
			default:
				result = `Unknown tool: ${funcName}`;
		}

		step.status = 'completed';
		step.result = result;
		step.completedAt = new Date().toISOString();
		onStep?.(step);

		return { toolCallId: toolCall.id, content: result };
	} catch (error) {
		const errorMsg = error instanceof Error ? error.message : 'Unknown error';
		step.status = 'failed';
		step.error = errorMsg;
		step.completedAt = new Date().toISOString();
		onStep?.(step);

		return { toolCallId: toolCall.id, content: `Error: ${errorMsg}`, isError: true };
	}
}

function handleReadFile(sandbox: Sandbox, args: Record<string, string>): string {
	const content = sandbox.readFile(args.path);
	const lines = content.split('\n');

	if (lines.length > 500) {
		return `File: ${args.path} (${lines.length} lines, showing first 500)\n\n${lines.slice(0, 500).join('\n')}\n\n... (${lines.length - 500} more lines)`;
	}

	return `File: ${args.path}\n\n${content}`;
}

function handleWriteFile(sandbox: Sandbox, args: Record<string, string>): string {
	sandbox.writeFile(args.path, args.content);
	return `Successfully wrote ${args.content.split('\n').length} lines to ${args.path}`;
}

function handleEditFile(sandbox: Sandbox, args: Record<string, string>): string {
	sandbox.editFile(args.path, args.old_text, args.new_text);
	return `Successfully edited ${args.path}`;
}

function handleRunCommand(sandbox: Sandbox, args: Record<string, string>): string {
	const result = sandbox.runCommand(args.command, args.working_directory);
	const status = result.exitCode === 0 ? 'succeeded' : `failed (exit code ${result.exitCode})`;
	return `Command ${status} in ${result.duration}ms:\n$ ${args.command}\n\n${result.output}`;
}

function handleSearchFiles(sandbox: Sandbox, args: Record<string, string>): string {
	const results = sandbox.searchFiles(
		args.pattern,
		args.search_type as 'filename' | 'content',
		args.directory
	);

	if (results.length === 0) {
		return `No matches found for pattern: ${args.pattern}`;
	}

	return `Found ${results.length} match(es):\n${results.map((r) => `  ${r}`).join('\n')}`;
}

async function handleCreatePR(
	sandbox: Sandbox,
	args: Record<string, string>,
	context: ToolExecutionContext
): Promise<string> {
	if (!context.githubToken || !context.repoFullName) {
		// Draft the PR locally
		const diff = sandbox.getDiff();
		const files = sandbox.files.map((f) => f.path);

		return `PR Draft Created (GitHub not connected):
Title: ${args.title}
Branch: ${args.branch}
Base: ${args.base_branch || 'main'}
Files changed: ${files.join(', ')}

Description:
${args.body}

Diff preview:
${diff.slice(0, 3000)}${diff.length > 3000 ? '\n... (truncated)' : ''}

To submit this PR, connect your GitHub account in Settings.`;
	}

	// Submit PR via GitHub API
	try {
		const branchName = args.branch;
		sandbox.createBranch(branchName);
		sandbox.commitChanges(`${args.title}\n\n${args.body}`);

		// Push and create PR
		sandbox.runCommand(`git push origin ${branchName}`);

		const [owner, repo] = context.repoFullName.split('/');
		const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls`, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${context.githubToken}`,
				Accept: 'application/vnd.github.v3+json',
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				title: args.title,
				body: args.body,
				head: branchName,
				base: args.base_branch || 'main'
			})
		});

		if (!response.ok) {
			const error = await response.text();
			return `Failed to create PR: ${error}`;
		}

		const pr = await response.json();
		return `PR #${pr.number} created successfully!\nURL: ${pr.html_url}\nTitle: ${pr.title}`;
	} catch (error) {
		return `Failed to create PR: ${error instanceof Error ? error.message : 'Unknown error'}`;
	}
}

function mapFunctionToStepType(funcName: string): AgentStep['type'] {
	const mapping: Record<string, AgentStep['type']> = {
		read_file: 'read_file',
		write_file: 'write_file',
		edit_file: 'edit_file',
		run_command: 'run_command',
		search_files: 'search_files',
		create_pr: 'create_pr'
	};
	return mapping[funcName] || 'think';
}

function describeToolCall(funcName: string, args: Record<string, string>): string {
	switch (funcName) {
		case 'read_file':
			return `Reading ${args.path}`;
		case 'write_file':
			return `Writing to ${args.path}`;
		case 'edit_file':
			return `Editing ${args.path}`;
		case 'run_command':
			return `Running: ${args.command}`;
		case 'search_files':
			return `Searching for ${args.pattern}`;
		case 'create_pr':
			return `Creating PR: ${args.title}`;
		default:
			return `Executing ${funcName}`;
	}
}
