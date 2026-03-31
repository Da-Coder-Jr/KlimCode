import type { Message, ToolCall, AgentStep, StreamChunk } from '$types/core';
import {
	callNvidia,
	callNvidiaNonStreaming,
	streamNvidiaResponse,
	buildSystemPrompt,
	getAgentTools,
	getModelById
} from '$server/ai/nvidia';
import { executeToolCall, type ToolExecutionContext } from './tools';
import { createWorkspace, getWorkspace, type Workspace } from './workspace';

// No hard cap — the model decides when it's done.
// The system prompt mandates create_pr as the final step which naturally
// terminates the loop. Infinite is intentional so large projects can
// write many files without being cut off.
const MAX_TOOL_ROUNDS = Infinity;

interface AgentExecutionOptions {
	apiKey: string;
	model: string;
	conversationId: string;
	messages: Message[];
	repoOwner?: string;
	repoName?: string;
	githubToken?: string;
	baseBranch?: string;
	onStep?: (step: AgentStep) => void;
}

export async function* executeAgent(
	options: AgentExecutionOptions
): AsyncGenerator<StreamChunk> {
	const {
		apiKey, model, conversationId, messages,
		repoOwner, repoName, githubToken, baseBranch,
		onStep
	} = options;

	// Get or create workspace (no visible step — this is internal setup)
	let workspace: Workspace | undefined;

	if (repoOwner && repoName && githubToken) {
		workspace = getWorkspace(conversationId);
		if (!workspace) {
			workspace = createWorkspace(conversationId, repoOwner, repoName, githubToken, baseBranch);
		}
	}

	const systemPrompt = buildSystemPrompt('agent', {
		repo: repoOwner && repoName ? `${repoOwner}/${repoName}` : undefined,
		branch: baseBranch
	});

	const modelDef = getModelById(model);
	const modelSupportsTools = modelDef?.supportsTools !== false;

	const apiMessages = buildAPIMessages(systemPrompt, messages);
	const tools = getAgentTools();

	// Repo tools self-report an error if workspace is missing.
	const toolContext: ToolExecutionContext | undefined = modelSupportsTools
		? { workspace }
		: undefined;

	let round = 0;
	let currentMessages = [...apiMessages];
	let totalTextEmitted = 0;  // cumulative text length across all rounds

	while (round < MAX_TOOL_ROUNDS) {
		round++;

		let fullContent = '';
		let toolCalls: ToolCall[] = [];

		try {
			// Stream the response so text appears progressively
			const response = await callNvidia({
				apiKey,
				model,
				messages: currentMessages,
				tools: toolContext ? tools : undefined,
				toolChoice: toolContext ? 'auto' : undefined,
				stream: true,
				maxTokens: 8192
			});

			if (!response.body) throw new Error('No response body');

			const reader = response.body.getReader();
			const decoder = new TextDecoder();
			let buffer = '';
			const tcMap = new Map<number, { id: string; name: string; args: string }>();

			while (true) {
				const { done, value } = await reader.read();
				if (done) break;

				buffer += decoder.decode(value, { stream: true });
				const lines = buffer.split('\n');
				buffer = lines.pop() || '';

				for (const line of lines) {
					const trimmed = line.trim();
					if (!trimmed.startsWith('data: ')) continue;
					const data = trimmed.slice(6);
					if (data === '[DONE]') break;

					try {
						const parsed = JSON.parse(data);
						const choice = parsed.choices?.[0];
						if (!choice) continue;

						const delta = choice.delta;

						if (delta?.content) {
							fullContent += delta.content;
							yield { type: 'text', content: delta.content };
						}

						if (delta?.tool_calls) {
							for (const tc of delta.tool_calls) {
								const idx = tc.index ?? 0;
								if (!tcMap.has(idx)) tcMap.set(idx, { id: '', name: '', args: '' });
								const entry = tcMap.get(idx)!;
								if (tc.id) entry.id = tc.id;
								if (tc.function?.name) entry.name = tc.function.name;
								if (tc.function?.arguments) entry.args += tc.function.arguments;
							}
						}
					} catch {
						// Skip malformed chunks
					}
				}
			}

			reader.releaseLock();

			// Convert streaming tool call deltas to ToolCall objects
			for (const [, tc] of Array.from(tcMap.entries()).sort(([a], [b]) => a - b)) {
				toolCalls.push({
					id: tc.id || crypto.randomUUID(),
					type: 'function',
					function: { name: tc.name, arguments: tc.args }
				});
			}

			// If the model didn't use the tool calling API but instead output
			// tool calls as raw JSON text, parse them out and fix the display
			if (toolCalls.length === 0 && fullContent && toolContext) {
				const parsed = parseTextToolCalls(fullContent);
				if (parsed.toolCalls.length > 0) {
					toolCalls = parsed.toolCalls;
					fullContent = parsed.cleanText;
					yield { type: 'text_replace', content: fullContent };
				}
			}
		} catch (error) {
			yield { type: 'error', error: error instanceof Error ? error.message : 'NVIDIA API error' };
			return;
		}

		if (toolCalls.length === 0 || !toolContext) {
			yield { type: 'done' };
			return;
		}

		currentMessages.push({
			role: 'assistant',
			content: fullContent || '',
			tool_calls: toolCalls.map((tc) => ({
				id: tc.id, type: 'function' as const,
				function: { name: tc.function.name, arguments: tc.function.arguments }
			}))
		});

		// Track cumulative text so tool steps get correct inline position
		const stepContentOffset = totalTextEmitted + fullContent.length;
		totalTextEmitted += fullContent.length;

		for (const toolCall of toolCalls) {
			const stepDescription = buildStepDescription(toolCall.function.name, toolCall.function.arguments);
			const step: AgentStep = {
				id: toolCall.id,
				type: mapToolToStep(toolCall.function.name),
				status: 'running',
				description: stepDescription,
				startedAt: new Date().toISOString(),
				toolArgs: toolCall.function.arguments,
				contentOffset: stepContentOffset
			};

			yield { type: 'agent_step', agentStep: step };

			const result = await executeToolCall(toolCall, toolContext);

			step.status = result.isError ? 'failed' : 'completed';
			step.result = result.content;
			step.error = result.isError ? result.content : undefined;
			step.completedAt = new Date().toISOString();

			yield { type: 'agent_step', agentStep: step };
			yield { type: 'tool_result', toolResult: result };

			currentMessages.push({
				role: 'tool', content: result.content, tool_call_id: toolCall.id
			});
		}
	}

	yield { type: 'done' };
}

export async function* executeChat(options: {
	apiKey: string; model: string; messages: Message[];
}): AsyncGenerator<StreamChunk> {
	const systemPrompt = buildSystemPrompt('chat');
	const apiMessages = buildAPIMessages(systemPrompt, options.messages);

	let currentMessages = [...apiMessages];

	// Single-pass — no tool loop needed now that web_search is removed
	{
		let fullContent = '';
		let toolCalls: ToolCall[] = [];

		try {
			const response = await callNvidia({
				apiKey: options.apiKey,
				model: options.model,
				messages: currentMessages,
				stream: true,
				maxTokens: 4096
			});

			if (!response.body) throw new Error('No response body');

			const reader = response.body.getReader();
			const decoder = new TextDecoder();
			let buffer = '';
			const tcMap = new Map<number, { id: string; name: string; args: string }>();

			while (true) {
				const { done, value } = await reader.read();
				if (done) break;

				buffer += decoder.decode(value, { stream: true });
				const lines = buffer.split('\n');
				buffer = lines.pop() || '';

				for (const line of lines) {
					const trimmed = line.trim();
					if (!trimmed.startsWith('data: ')) continue;
					const data = trimmed.slice(6);
					if (data === '[DONE]') break;

					try {
						const parsed = JSON.parse(data);
						const choice = parsed.choices?.[0];
						if (!choice) continue;

						const delta = choice.delta;
						if (delta?.content) {
							fullContent += delta.content;
							yield { type: 'text', content: delta.content };
						}

						if (delta?.tool_calls) {
							for (const tc of delta.tool_calls) {
								const idx = tc.index ?? 0;
								if (!tcMap.has(idx)) tcMap.set(idx, { id: '', name: '', args: '' });
								const entry = tcMap.get(idx)!;
								if (tc.id) entry.id = tc.id;
								if (tc.function?.name) entry.name = tc.function.name;
								if (tc.function?.arguments) entry.args += tc.function.arguments;
							}
						}
					} catch { /* skip malformed chunks */ }
				}
			}
			reader.releaseLock();

			for (const [, tc] of Array.from(tcMap.entries()).sort(([a], [b]) => a - b)) {
				toolCalls.push({
					id: tc.id || crypto.randomUUID(),
					type: 'function',
					function: { name: tc.name, arguments: tc.args }
				});
			}

			// Fallback: some models output tool calls as raw JSON text instead of
			// using the API — parse them out so they actually get executed.
			if (toolCalls.length === 0 && fullContent) {
				const parsed = parseTextToolCalls(fullContent);
				if (parsed.toolCalls.length > 0) {
					toolCalls = parsed.toolCalls;
					fullContent = parsed.cleanText;
					yield { type: 'text_replace', content: fullContent };
				}
			}
		} catch (error) {
			yield { type: 'error', error: error instanceof Error ? error.message : 'NVIDIA API error' };
			return;
		}

		// toolCalls is intentionally unused — chat mode has no tools
		void toolCalls;

		// Strip any residual tool call syntax that leaked through
		const cleaned = cleanChatResponse(fullContent);
		if (cleaned !== fullContent) {
			yield { type: 'text_replace', content: cleaned };
		}
	}

	yield { type: 'done' };
}

function buildAPIMessages(
	systemPrompt: string,
	messages: Message[]
): Array<{ role: string; content: string; tool_call_id?: string; tool_calls?: ToolCall[] }> {
	return [
		{ role: 'system', content: systemPrompt },
		...messages.map((msg) => {
			const mapped: { role: string; content: string; tool_call_id?: string; tool_calls?: ToolCall[] } = {
				role: msg.role,
				content: msg.content
			};
			if ((msg as any).tool_call_id) mapped.tool_call_id = (msg as any).tool_call_id;
			if ((msg as any).tool_calls) mapped.tool_calls = (msg as any).tool_calls;
			return mapped;
		})
	];
}

const KNOWN_TOOLS = new Set([
	'read_file', 'write_file', 'edit_file', 'search_files',
	'list_files', 'create_pr', 'clone_repo', 'run_command', 'merge_pr'
]);

/**
 * Extract all top-level JSON objects from arbitrary text using bracket matching.
 * This is more robust than regex for nested objects (e.g. write_file content).
 */
function extractJsonObjects(text: string): Array<{ start: number; end: number; obj: Record<string, unknown> }> {
	const results: Array<{ start: number; end: number; obj: Record<string, unknown> }> = [];
	let i = 0;
	while (i < text.length) {
		if (text[i] !== '{') { i++; continue; }
		let depth = 0;
		let inStr = false;
		let esc = false;
		let j = i;
		while (j < text.length) {
			const ch = text[j];
			if (esc) { esc = false; j++; continue; }
			if (ch === '\\' && inStr) { esc = true; j++; continue; }
			if (ch === '"') { inStr = !inStr; j++; continue; }
			if (!inStr) {
				if (ch === '{') depth++;
				else if (ch === '}') { depth--; if (depth === 0) { j++; break; } }
			}
			j++;
		}
		if (depth === 0 && j > i) {
			try {
				const obj = JSON.parse(text.slice(i, j)) as Record<string, unknown>;
				results.push({ start: i, end: j, obj });
			} catch { /* not valid JSON */ }
			i = j;
		} else {
			i++;
		}
	}
	return results;
}

/**
 * Parse tool calls that some models output as raw JSON text instead of using the API.
 * Handles JSON formats:
 *   {"name": "tool", "parameters": {...}}
 *   {"type": "function", "name": "tool", "parameters": {...}}
 *   {"type": "function", "function": {"name": "tool", "arguments": "{...}"}}
 * And XML/parameter-tag formats some NVIDIA NIM models emit:
 *   <invoke name="tool"><parameter name="key">value</parameter></invoke>
 *   <parameter=key>\nvalue  (broken/partial format — infers tool from param set)
 */
export function parseTextToolCalls(text: string): { cleanText: string; toolCalls: ToolCall[] } {
	const toolCalls: ToolCall[] = [];
	const regions: Array<[number, number]> = [];

	// ── JSON formats ──────────────────────────────────────────────────────────
	for (const { start, end, obj } of extractJsonObjects(text)) {
		let toolName: string | undefined;
		let argsStr: string | undefined;

		// Format 1: {"name": "tool", "parameters": {...}}
		if (typeof obj.name === 'string' && KNOWN_TOOLS.has(obj.name) && obj.parameters && typeof obj.parameters === 'object') {
			toolName = obj.name;
			argsStr = JSON.stringify(obj.parameters);
		}
		// Format 2: {"type": "function", "name": "tool", "parameters": {...}}
		else if (obj.type === 'function' && typeof obj.name === 'string' && KNOWN_TOOLS.has(obj.name) && obj.parameters) {
			toolName = obj.name;
			argsStr = JSON.stringify(obj.parameters);
		}
		// Format 3: {"type": "function", "function": {"name": "tool", "arguments": "..."}}
		else if (obj.type === 'function' && obj.function && typeof obj.function === 'object') {
			const fn = obj.function as Record<string, unknown>;
			if (typeof fn.name === 'string' && KNOWN_TOOLS.has(fn.name)) {
				toolName = fn.name;
				argsStr = typeof fn.arguments === 'string' ? fn.arguments : JSON.stringify(fn.arguments ?? {});
			}
		}
		// Format 4: {"tool": "name", "parameters": {...}} or {"tool_name": "name", ...}
		else {
			const nameVal = obj.tool ?? obj.tool_name;
			if (typeof nameVal === 'string' && KNOWN_TOOLS.has(nameVal) && obj.parameters) {
				toolName = nameVal;
				argsStr = JSON.stringify(obj.parameters);
			}
		}

		if (toolName && argsStr) {
			try {
				JSON.parse(argsStr); // validate
				toolCalls.push({
					id: `tc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
					type: 'function',
					function: { name: toolName, arguments: argsStr }
				});
				regions.push([start, end]);
			} catch { /* skip */ }
		}
	}

	// ── XML / parameter-tag formats ──────────────────────────────────────────
	// Format 5: <invoke name="tool_name"><parameter name="key">value</parameter></invoke>
	// Also handles wrapping <function_calls> tag some models add.
	const invokeRe = /<invoke\s+name="([^"]+)"[^>]*>([\s\S]*?)<\/invoke>/g;
	let m: RegExpExecArray | null;
	while ((m = invokeRe.exec(text)) !== null) {
		const toolName = m[1];
		if (!KNOWN_TOOLS.has(toolName)) continue;
		const body = m[2];
		const params: Record<string, string> = {};
		const paramRe = /<parameter\s+name="([^"]+)"[^>]*>([\s\S]*?)<\/parameter>/g;
		let pm: RegExpExecArray | null;
		while ((pm = paramRe.exec(body)) !== null) {
			params[pm[1]] = pm[2].trim();
		}
		if (Object.keys(params).length > 0) {
			toolCalls.push({
				id: `tc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
				type: 'function',
				function: { name: toolName, arguments: JSON.stringify(params) }
			});
			regions.push([m.index, m.index + m[0].length]);
		}
	}

	// Format 6: Broken partial format — model outputs PR/file content as text
	// then appends <parameter=key>\nvalue lines without a wrapping invoke tag.
	// Infer the tool from which parameters are present.
	// e.g. "# My PR body...\n<parameter=branch>\nmain"
	const looseParamRe = /(?:<parameter=(\w+)>\n?([\s\S]*?)(?=\n?<parameter=|\s*$))/g;
	const looseParams: Record<string, string> = {};
	let looseStart = text.length;
	let looseEnd = 0;
	let lm: RegExpExecArray | null;
	while ((lm = looseParamRe.exec(text)) !== null) {
		looseParams[lm[1]] = lm[2].trim();
		looseStart = Math.min(looseStart, lm.index);
		looseEnd = Math.max(looseEnd, lm.index + lm[0].length);
	}
	if (Object.keys(looseParams).length > 0) {
		// Infer tool name from which parameters are present
		let inferredTool: string | undefined;
		const keys = new Set(Object.keys(looseParams));
		if (keys.has('branch') || keys.has('title') || keys.has('body')) {
			inferredTool = 'create_pr';
			// If body is missing, use the text before the first <parameter= tag as the body
			if (!looseParams.body && looseStart > 0) {
				looseParams.body = text.slice(0, looseStart).trim();
				looseStart = 0;
			}
			// Default title from first heading if missing
			if (!looseParams.title) {
				const h1 = /^#+ (.+)/m.exec(looseParams.body || '');
				looseParams.title = h1 ? h1[1].trim() : 'Agent changes';
			}
		} else if (keys.has('path') && keys.has('content')) {
			inferredTool = 'write_file';
		} else if (keys.has('path') && keys.has('old_text') && keys.has('new_text')) {
			inferredTool = 'edit_file';
		}
		if (inferredTool) {
			toolCalls.push({
				id: `tc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
				type: 'function',
				function: { name: inferredTool, arguments: JSON.stringify(looseParams) }
			});
			regions.push([looseStart, looseEnd]);
		}
	}

	// Format 7: <tool_call>\n<function=tool_name>\n<parameter=key>\nvalue\n</tool_call>
	// Some models emit this non-standard format. Strip it even if unparseable.
	const toolCallTagRe = /<tool_call>([\s\S]*?)(?:<\/tool_call>|(?=<tool_call>))/g;
	let tcm: RegExpExecArray | null;
	while ((tcm = toolCallTagRe.exec(text)) !== null) {
		const body = tcm[1];
		const funcMatch = /<function=([^>\s]+)>/.exec(body);
		if (funcMatch && KNOWN_TOOLS.has(funcMatch[1])) {
			const params: Record<string, string> = {};
			const pRe = /<parameter=(\w+)>\n?([\s\S]*?)(?=\n?<(?:parameter|\/tool_call))/g;
			let pm: RegExpExecArray | null;
			while ((pm = pRe.exec(body)) !== null) params[pm[1]] = pm[2].trim();
			if (Object.keys(params).length > 0) {
				toolCalls.push({
					id: `tc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
					type: 'function',
					function: { name: funcMatch[1], arguments: JSON.stringify(params) }
				});
			}
		}
		regions.push([tcm.index, tcm.index + tcm[0].length]);
	}
	// Strip unterminated <tool_call> block at end of text
	const lastTc = text.lastIndexOf('<tool_call>');
	if (lastTc !== -1 && !text.slice(lastTc).includes('</tool_call>')) {
		if (!regions.some(([s, e]) => s <= lastTc && lastTc < e)) {
			regions.push([lastTc, text.length]);
		}
	}

	// Remove matched regions from text (reverse order to preserve indices)
	let cleanText = text;
	const sortedRegions = [...regions].sort((a, b) => b[0] - a[0]);
	for (const [s, e] of sortedRegions) {
		cleanText = cleanText.slice(0, s) + cleanText.slice(e);
	}

	return { cleanText: cleanText.trim(), toolCalls };
}

/**
 * Strip tool call syntax patterns from chat responses.
 * Some models emit <tool_call> and similar tags even without tools.
 */
function cleanChatResponse(text: string): string {
	let result = text;
	result = result.replace(/<tool_call>[\s\S]*?<\/tool_call>/g, '');
	result = result.replace(/<tool_call>[\s\S]*/g, '');
	result = result.replace(/<function_calls>[\s\S]*?<\/function_calls>/g, '');
	result = result.replace(/\n?<function=[^>]*>[^\n]*/g, '');
	result = result.replace(/\n?<parameter=[^>]*>[^\n]*/g, '');
	// DeepSeek DSML blocks
	result = result.replace(/<\uFF5CDSML\uFF5Cfunction_calls>[\s\S]*?<\/\uFF5CDSML\uFF5Cfunction_calls>/g, '');
	return result.trim();
}

function buildStepDescription(toolName: string, argsJson: string): string {
	try {
		const args = JSON.parse(argsJson);
		const path = args.path || args.directory || '';
		const shortPath = path ? path.split('/').pop() || path : '';

		switch (toolName) {
			case 'read_file': return shortPath ? `Reading ${shortPath}` : 'Reading file';
			case 'write_file': return shortPath ? `Writing ${shortPath}` : 'Writing file';
			case 'edit_file': return shortPath ? `Editing ${shortPath}` : 'Editing file';
			case 'search_files': return args.pattern ? `Searching for "${args.pattern}"` : 'Searching files';
			case 'list_files': return path ? `Listing ${path}` : 'Listing files';
			case 'create_pr': return args.title ? `Creating PR: ${args.title}` : 'Creating pull request';
			case 'clone_repo': return args.name ? `Cloning ${args.owner || ''}/${args.name}` : 'Cloning repository';
			case 'run_command': return args.command ? `$ ${args.command.slice(0, 60)}` : 'Running command';
			case 'merge_pr': return args.pr_number ? `Merging PR #${args.pr_number}` : 'Merging pull request';
			default: return `Running ${toolName}`;
		}
	} catch {
		return `Running ${toolName}`;
	}
}

function mapToolToStep(toolName: string): AgentStep['type'] {
	const map: Record<string, AgentStep['type']> = {
		read_file: 'read_file', write_file: 'write_file', edit_file: 'edit_file',
		search_files: 'search_files', list_files: 'browse_repo', create_pr: 'create_pr',
		clone_repo: 'browse_repo', run_command: 'think', merge_pr: 'create_pr'
	};
	return map[toolName] || 'think';
}
