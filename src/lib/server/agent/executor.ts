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

// No hard cap — the model decides when it's done. The system prompt enforces a
// create_pr final step which naturally terminates the loop.
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

	// Always provide a tool context — web_search works without a workspace.
	// Repo tools will self-report an error if workspace is missing.
	const toolContext: ToolExecutionContext | undefined = modelSupportsTools
		? { workspace }
		: undefined;

	let round = 0;
	let currentMessages = [...apiMessages];

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

		for (const toolCall of toolCalls) {
			const stepDescription = buildStepDescription(toolCall.function.name, toolCall.function.arguments);
			const step: AgentStep = {
				id: toolCall.id,
				type: mapToolToStep(toolCall.function.name),
				status: 'running',
				description: stepDescription,
				startedAt: new Date().toISOString(),
				toolArgs: toolCall.function.arguments
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

	const modelDef = getModelById(options.model);
	const modelSupportsTools = modelDef?.supportsTools !== false;

	// Give chat mode the web_search tool so the AI can look things up
	const chatTools = modelSupportsTools
		? [{ type: 'function' as const, function: {
				name: 'web_search',
				description: 'Search the web using DuckDuckGo. No API key required.',
				parameters: {
					type: 'object',
					properties: { query: { type: 'string', description: 'The search query' } },
					required: ['query']
				}
		  } }]
		: undefined;

	let currentMessages = [...apiMessages];

	// Allow up to 5 search rounds so the AI can refine and follow up
	for (let round = 0; round < 5; round++) {
		let fullContent = '';
		let toolCalls: ToolCall[] = [];

		try {
			const response = await callNvidia({
				apiKey: options.apiKey,
				model: options.model,
				messages: currentMessages,
				tools: chatTools,
				toolChoice: chatTools ? 'auto' : undefined,
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
		} catch (error) {
			yield { type: 'error', error: error instanceof Error ? error.message : 'NVIDIA API error' };
			return;
		}

		if (toolCalls.length === 0) {
			yield { type: 'done' };
			return;
		}

		// Execute web_search tool calls and feed results back
		currentMessages.push({
			role: 'assistant',
			content: fullContent || '',
			tool_calls: toolCalls.map((tc) => ({
				id: tc.id, type: 'function' as const,
				function: { name: tc.function.name, arguments: tc.function.arguments }
			}))
		});

		for (const toolCall of toolCalls) {
			if (toolCall.function.name !== 'web_search') continue;

			// Emit a lightweight step so the user sees "Searching…"
			const step: AgentStep = {
				id: toolCall.id,
				type: 'search_files',
				status: 'running',
				description: (() => {
					try { return `Searching "${JSON.parse(toolCall.function.arguments).query}"`; }
					catch { return 'Searching the web'; }
				})(),
				startedAt: new Date().toISOString(),
				toolArgs: toolCall.function.arguments,
				contentOffset: fullContent.length
			};
			yield { type: 'agent_step', agentStep: step };

			const result = await executeToolCall(toolCall, {});
			step.status = result.isError ? 'failed' : 'completed';
			step.result = result.content;
			step.completedAt = new Date().toISOString();
			yield { type: 'agent_step', agentStep: step };

			currentMessages.push({ role: 'tool', content: result.content, tool_call_id: toolCall.id });
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

/**
 * Parse tool calls that some models output as raw JSON text instead of using the API.
 * Handles formats like: {"name": "read_file", "parameters": {"path": "..."}}
 * and: {"type": "function", "name": "...", "parameters": {...}}
 */
function parseTextToolCalls(text: string): { cleanText: string; toolCalls: ToolCall[] } {
	const toolCalls: ToolCall[] = [];
	let cleanText = text;

	// Match JSON objects that look like tool calls on their own lines
	const jsonToolPattern = /\n?\s*\{[\s]*"(?:type"\s*:\s*"function"\s*,\s*")?name"\s*:\s*"(\w+)"\s*,\s*"parameters"\s*:\s*(\{[^}]*(?:\{[^}]*\}[^}]*)?\})\s*\}\s*\n?/g;
	let match: RegExpExecArray | null;
	const regions: Array<[number, number]> = [];

	while ((match = jsonToolPattern.exec(text)) !== null) {
		const toolName = match[1];
		const argsStr = match[2];

		try {
			JSON.parse(argsStr); // validate it's valid JSON
			toolCalls.push({
				id: `tc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
				type: 'function',
				function: { name: toolName, arguments: argsStr }
			});
			regions.push([match.index, match.index + match[0].length]);
		} catch {
			// Not valid JSON, skip
		}
	}

	// Remove matched regions from text (in reverse to preserve indices)
	if (regions.length > 0) {
		for (let i = regions.length - 1; i >= 0; i--) {
			cleanText = cleanText.slice(0, regions[i][0]) + cleanText.slice(regions[i][1]);
		}
		cleanText = cleanText.trim();
	}

	return { cleanText, toolCalls };
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
			default: return `Running ${toolName}`;
		}
	} catch {
		return `Running ${toolName}`;
	}
}

function mapToolToStep(toolName: string): AgentStep['type'] {
	const map: Record<string, AgentStep['type']> = {
		read_file: 'read_file', write_file: 'write_file', edit_file: 'edit_file',
		search_files: 'search_files', list_files: 'browse_repo', create_pr: 'create_pr'
	};
	return map[toolName] || 'think';
}
