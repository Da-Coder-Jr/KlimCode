import type { ToolCall, ToolResult, AgentStep } from '$types/core';
import { Workspace, WorkspaceError } from './workspace';

export interface ToolExecutionContext {
	workspace: Workspace;
	onStep?: (step: AgentStep) => void;
}

export async function executeToolCall(
	toolCall: ToolCall,
	context: ToolExecutionContext
): Promise<ToolResult> {
	const { workspace, onStep } = context;
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
				result = await handleReadFile(workspace, args);
				break;
			case 'write_file':
				result = handleWriteFile(workspace, args);
				break;
			case 'edit_file':
				result = handleEditFile(workspace, args);
				break;
			case 'search_files':
				result = await handleSearchFiles(workspace, args);
				break;
			case 'list_files':
				result = await handleListFiles(workspace, args);
				break;
			case 'create_pr':
				result = await handleCreatePR(workspace, args);
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

async function handleReadFile(workspace: Workspace, args: Record<string, string>): Promise<string> {
	const content = await workspace.readFile(args.path);
	const lines = content.split('\n');

	if (lines.length > 500) {
		return `File: ${args.path} (${lines.length} lines, showing first 500)\n\n${lines.slice(0, 500).join('\n')}\n\n... (${lines.length - 500} more lines)`;
	}

	return `File: ${args.path}\n\n${content}`;
}

function handleWriteFile(workspace: Workspace, args: Record<string, string>): string {
	workspace.writeFile(args.path, args.content);
	return `Wrote ${args.content.split('\n').length} lines to ${args.path}`;
}

function handleEditFile(workspace: Workspace, args: Record<string, string>): string {
	workspace.editFile(args.path, args.old_text, args.new_text);
	return `Edited ${args.path}`;
}

async function handleSearchFiles(workspace: Workspace, args: Record<string, string>): Promise<string> {
	const results = await workspace.searchFiles(
		args.pattern,
		args.search_type as 'filename' | 'content'
	);

	if (results.length === 0) return `No matches found for: ${args.pattern}`;
	return `Found ${results.length} match(es):\n${results.map((r) => `  ${r}`).join('\n')}`;
}

async function handleListFiles(workspace: Workspace, args: Record<string, string>): Promise<string> {
	const files = await workspace.listFiles(args.directory);
	if (files.length === 0) return 'No files found';
	return `Files:\n${files.map((f) => `  ${f}`).join('\n')}`;
}

async function handleCreatePR(workspace: Workspace, args: Record<string, string>): Promise<string> {
	const changes = workspace.getChangedFiles();
	if (changes.length === 0) {
		return 'No files have been changed. Make some changes first before creating a PR.';
	}

	try {
		const branchName = args.branch || `klimcode/${Date.now()}`;
		const pr = await workspace.createPullRequest(
			args.title,
			args.body,
			branchName
		);

		return `PR #${pr.number} created!\nURL: ${pr.url}\nBranch: ${branchName}\nFiles changed: ${changes.map((f) => f.path).join(', ')}`;
	} catch (error) {
		return `Failed to create PR: ${error instanceof Error ? error.message : 'Unknown error'}`;
	}
}

function mapFunctionToStepType(funcName: string): AgentStep['type'] {
	const mapping: Record<string, AgentStep['type']> = {
		read_file: 'read_file',
		write_file: 'write_file',
		edit_file: 'edit_file',
		search_files: 'search_files',
		list_files: 'browse_repo',
		create_pr: 'create_pr'
	};
	return mapping[funcName] || 'think';
}

function describeToolCall(funcName: string, args: Record<string, string>): string {
	switch (funcName) {
		case 'read_file': return `Reading ${args.path}`;
		case 'write_file': return `Writing to ${args.path}`;
		case 'edit_file': return `Editing ${args.path}`;
		case 'search_files': return `Searching for ${args.pattern}`;
		case 'list_files': return `Listing files${args.directory ? ` in ${args.directory}` : ''}`;
		case 'create_pr': return `Creating PR: ${args.title}`;
		default: return `Executing ${funcName}`;
	}
}
