import type { ToolCall, ToolResult } from '$types/core';
import { Workspace, WorkspaceError } from './workspace';

export interface ToolExecutionContext {
	workspace?: Workspace;
}

export async function executeToolCall(
	toolCall: ToolCall,
	context: ToolExecutionContext
): Promise<ToolResult> {
	const { workspace } = context;
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

	try {
		let result: string;

		// web_search works without a workspace
		if (funcName === 'web_search') {
			result = await handleWebSearch(args);
		} else if (!workspace) {
			return {
				toolCallId: toolCall.id,
				content: `Tool '${funcName}' requires a connected GitHub repository. Please connect a repo first.`,
				isError: true
			};
		} else {
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
					result = `Unknown tool: ${funcName}. Available tools are: read_file, write_file, edit_file, search_files, list_files, create_pr, web_search`;
			}
		}

		return { toolCallId: toolCall.id, content: result };
	} catch (error) {
		const errorMsg = error instanceof Error ? error.message : 'Unknown error';
		return { toolCallId: toolCall.id, content: `ERROR: Tool '${funcName}' failed: ${errorMsg}`, isError: true };
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

async function handleWebSearch(args: Record<string, string>): Promise<string> {
	const query = args.query;
	if (!query) return 'ERROR: query parameter is required';

	try {
		// Use DuckDuckGo Lite — no API key, no tracking, scrape-friendly
		const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
		const res = await fetch(url, {
			headers: {
				'User-Agent': 'Mozilla/5.0 (compatible; KlimCode/1.0)'
			}
		});

		if (!res.ok) return `Search failed: HTTP ${res.status}`;

		const html = await res.text();

		// Extract result titles, URLs, and snippets from DuckDuckGo HTML
		const results: string[] = [];

		// Match result blocks: <a class="result__a" href="...">title</a> and <a class="result__snippet">snippet</a>
		const titleRe = /<a[^>]+class="result__a"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g;
		const snippetRe = /<a[^>]+class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;

		const titles: Array<{ url: string; title: string }> = [];
		const snippets: string[] = [];

		let m: RegExpExecArray | null;
		while ((m = titleRe.exec(html)) !== null && titles.length < 8) {
			const href = m[1];
			const title = m[2].replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#x27;/g, "'").replace(/&quot;/g, '"').trim();
			if (title && href) titles.push({ url: href, title });
		}

		while ((m = snippetRe.exec(html)) !== null && snippets.length < 8) {
			const snippet = m[1].replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#x27;/g, "'").replace(/&quot;/g, '"').trim();
			if (snippet) snippets.push(snippet);
		}

		if (titles.length === 0) {
			return `No results found for: ${query}`;
		}

		for (let i = 0; i < Math.min(titles.length, 5); i++) {
			const snippet = snippets[i] ? `\n   ${snippets[i]}` : '';
			results.push(`${i + 1}. ${titles[i].title}${snippet}`);
		}

		return `Search results for "${query}":\n\n${results.join('\n\n')}`;
	} catch (err) {
		return `Search failed: ${err instanceof Error ? err.message : 'Unknown error'}`;
	}
}

async function handleCreatePR(workspace: Workspace, args: Record<string, string>): Promise<string> {
	const changes = workspace.getChangedFiles();
	if (changes.length === 0) {
		return 'No files have been changed. Make some changes first before creating a PR.';
	}

	const branchName = args.branch || `klimcode/${Date.now()}`;
	const pr = await workspace.createPullRequest(
		args.title,
		args.body,
		branchName
	);

	return `PR #${pr.number} created!\nURL: ${pr.url}\nBranch: ${branchName}\nFiles changed: ${changes.map((f) => f.path).join(', ')}`;
}
