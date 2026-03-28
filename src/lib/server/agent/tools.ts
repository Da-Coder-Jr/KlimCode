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
		// DuckDuckGo Instant Answer JSON API — no API key needed, no bot blocking
		const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
		const res = await fetch(url, {
			headers: {
				'Accept': 'application/json',
				'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
			}
		});

		if (!res.ok) return `Search failed: HTTP ${res.status}`;

		const rawText = await res.text();
		if (!rawText.trim()) return await webSearchFallback(query);

		let data: Record<string, unknown>;
		try {
			data = JSON.parse(rawText);
		} catch {
			return await webSearchFallback(query);
		}

		const results: string[] = [];

		// Abstract (direct answer / topic summary)
		if (data.AbstractText) {
			results.push(`Summary: ${data.AbstractText}`);
			if (data.AbstractURL) results.push(`Source: ${data.AbstractURL}`);
		}

		// Answer (calculator, conversions, etc.)
		if (data.Answer) {
			results.push(`Answer: ${data.Answer}`);
		}

		// Related topics
		if (data.RelatedTopics && data.RelatedTopics.length > 0) {
			const topics = data.RelatedTopics
				.filter((t: { Text?: string; FirstURL?: string }) => t.Text && t.FirstURL)
				.slice(0, 6)
				.map((t: { Text: string; FirstURL: string }, i: number) => `${i + 1}. ${t.Text}\n   ${t.FirstURL}`);
			if (topics.length > 0) {
				if (results.length > 0) results.push('');
				results.push('Related results:');
				results.push(...topics);
			}
		}

		if (results.length === 0) {
			// Fallback: try DuckDuckGo HTML with browser UA
			return await webSearchFallback(query);
		}

		return `Search results for "${query}":\n\n${results.join('\n')}`;
	} catch (err) {
		return `Search failed: ${err instanceof Error ? err.message : 'Unknown error'}`;
	}
}

async function webSearchFallback(query: string): Promise<string> {
	const headers = {
		'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
		'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
		'Accept-Language': 'en-US,en;q=0.5'
	};

	function stripTags(s: string) {
		return s.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#x27;/g, "'").replace(/&quot;/g, '"').trim();
	}

	// Strategy 1: DDG Lite (simpler, more stable table-based HTML)
	try {
		const liteRes = await fetch(`https://lite.duckduckgo.com/lite/?q=${encodeURIComponent(query)}`, { headers });
		if (liteRes.ok) {
			const html = await liteRes.text();
			const titles: Array<{ url: string; title: string }> = [];
			const snippets: string[] = [];
			// DDG Lite: result links have class "result-link", snippets in class "result-snippet"
			const linkRe = /<a[^>]+class="result-link"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g;
			const snipRe = /<td[^>]+class="result-snippet"[^>]*>([\s\S]*?)<\/td>/g;
			let m: RegExpExecArray | null;
			while ((m = linkRe.exec(html)) !== null && titles.length < 6) {
				const title = stripTags(m[2]);
				if (title && m[1]) titles.push({ url: m[1], title });
			}
			while ((m = snipRe.exec(html)) !== null && snippets.length < 6) {
				const s = stripTags(m[1]);
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

	// Strategy 2: DDG HTML endpoint with both old and new CSS class patterns
	try {
		const htmlRes = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, { headers });
		if (htmlRes.ok) {
			const html = await htmlRes.text();
			const titles: Array<{ url: string; title: string }> = [];
			const snippets: string[] = [];
			// Try both class="result__a" (older) and class="result__url" patterns
			const linkRe = /<a[^>]+class="[^"]*result__a[^"]*"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g;
			const snipRe = /<(?:a|span)[^>]+class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/(?:a|span)>/g;
			let m: RegExpExecArray | null;
			while ((m = linkRe.exec(html)) !== null && titles.length < 6) {
				const title = stripTags(m[2]);
				if (title && m[1] && !m[1].startsWith('//duckduckgo')) titles.push({ url: m[1], title });
			}
			while ((m = snipRe.exec(html)) !== null && snippets.length < 6) {
				const s = stripTags(m[1]);
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

	return `Search returned no results for: "${query}". Answer from your own knowledge.`;
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
