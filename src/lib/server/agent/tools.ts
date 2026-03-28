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
	const query = args.query?.trim();
	if (!query) return 'ERROR: query parameter is required';

	const browserHeaders = {
		'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
		'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
		'Accept-Language': 'en-US,en;q=0.9'
	};

	function strip(s: string) {
		return s
			.replace(/<[^>]+>/g, ' ')
			.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
			.replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&#39;/g, "'")
			.replace(/\s+/g, ' ').trim();
	}

	// Strategy 1: Jina AI Search — free, no API key, designed for AI agents,
	// not blocked by bot-detection unlike DDG/Bing HTML scraping.
	try {
		const jinaRes = await fetch(
			`https://s.jina.ai/${encodeURIComponent(query)}`,
			{ headers: { ...browserHeaders, Accept: 'text/plain' } }
		);
		if (jinaRes.ok) {
			const text = await jinaRes.text();
			const trimmed = text.trim().slice(0, 3000);
			if (trimmed.length > 100) {
				return `Search results for "${query}":\n\n${trimmed}`;
			}
		}
	} catch { /* fall through */ }

	// Strategy 2: DuckDuckGo Instant Answer API (good for tech/factual queries)
	try {
		const ddgRes = await fetch(
			`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`,
			{ headers: { ...browserHeaders, Accept: 'application/json' } }
		);
		if (ddgRes.ok) {
			const text = await ddgRes.text();
			if (text.trim()) {
				const data = JSON.parse(text) as Record<string, unknown>;
				const parts: string[] = [];
				if (data.AbstractText) {
					parts.push(`Summary: ${data.AbstractText}`);
					if (data.AbstractURL) parts.push(`Source: ${data.AbstractURL}`);
				}
				if (data.Answer) parts.push(`Answer: ${data.Answer}`);
				const topics = (data.RelatedTopics as Array<{ Text?: string; FirstURL?: string }> || [])
					.filter(t => t.Text && t.FirstURL).slice(0, 5)
					.map((t, i) => `${i + 1}. ${t.Text}\n   ${t.FirstURL}`);
				if (topics.length > 0) parts.push(`Related:\n${topics.join('\n')}`);
				if (parts.length > 0) return `Search results for "${query}":\n\n${parts.join('\n\n')}`;
			}
		}
	} catch { /* fall through */ }

	// Strategy 3: Bing HTML search
	try {
		const bingRes = await fetch(
			`https://www.bing.com/search?q=${encodeURIComponent(query)}&setlang=en&cc=US`,
			{ headers: browserHeaders }
		);
		if (bingRes.ok) {
			const html = await bingRes.text();
			const results: string[] = [];
			const algoRe = /<li[^>]+class="[^"]*\bb_algo\b[^"]*"[^>]*>([\s\S]*?)<\/li>/g;
			let m: RegExpExecArray | null;
			while ((m = algoRe.exec(html)) !== null && results.length < 5) {
				const block = m[1];
				const titleM = /<h2[^>]*>\s*<a[^>]+href="(https?:\/\/[^"]*)"[^>]*>([\s\S]*?)<\/a>/i.exec(block);
				if (!titleM) continue;
				const href = titleM[1];
				const title = strip(titleM[2]);
				const snipM =
					/<p[^>]+class="[^"]*b_lineclamp[^"]*"[^>]*>([\s\S]*?)<\/p>/i.exec(block) ||
					/<div[^>]+class="[^"]*b_caption[^"]*"[^>]*>[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/i.exec(block);
				const snippet = snipM ? strip(snipM[1]).slice(0, 200) : '';
				if (title && href) {
					results.push(`${results.length + 1}. ${title}${snippet ? `\n   ${snippet}` : ''}\n   ${href}`);
				}
			}
			if (results.length > 0) return `Search results for "${query}":\n\n${results.join('\n\n')}`;
		}
	} catch { /* fall through */ }

	// Strategy 4: DuckDuckGo HTML endpoint
	try {
		const ddgHtmlRes = await fetch(
			`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`,
			{ headers: browserHeaders }
		);
		if (ddgHtmlRes.ok) {
			const html = await ddgHtmlRes.text();
			const titles: Array<{ url: string; title: string }> = [];
			const snippets: string[] = [];
			// href here is the real URL (DDG HTML uses direct links, not redirects)
			const linkRe = /<a[^>]+class="[^"]*result__a[^"]*"[^>]*href="(https?:\/\/[^"]*)"[^>]*>([\s\S]*?)<\/a>/g;
			const snipRe = /<[a-z]+[^>]+class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/[a-z]+>/g;
			let m: RegExpExecArray | null;
			while ((m = linkRe.exec(html)) !== null && titles.length < 6) {
				const title = strip(m[2]);
				if (title && m[1]) titles.push({ url: m[1], title });
			}
			while ((m = snipRe.exec(html)) !== null && snippets.length < 6) {
				const s = strip(m[1]);
				if (s) snippets.push(s);
			}
			if (titles.length > 0) {
				const results = Array.from({ length: Math.min(titles.length, 5) }, (_, i) => {
					const snippet = snippets[i] ? `\n   ${snippets[i]}` : '';
					return `${i + 1}. ${titles[i].title}${snippet}\n   ${titles[i].url}`;
				});
				return `Search results for "${query}":\n\n${results.join('\n\n')}`;
			}
		}
	} catch { /* fall through */ }

	return `Web search for "${query}" returned no results. Answer from your training knowledge and mention that live search was unavailable.`;
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
