import type { Message, NvidiaModel, ToolCall, StreamChunk } from '$types/core';
export { AVAILABLE_MODELS } from '$lib/models';

const NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com/v1';

export function getModelById(modelId: string): NvidiaModel | undefined {
	return AVAILABLE_MODELS.find((m) => m.id === modelId);
}

export function getModelsByCategory(category: NvidiaModel['category']): NvidiaModel[] {
	return AVAILABLE_MODELS.filter((m) => m.category === category);
}

interface NvidiaRequestOptions {
	apiKey: string;
	model: string;
	messages: Array<{ role: string; content: string; tool_call_id?: string; tool_calls?: ToolCall[] }>;
	temperature?: number;
	maxTokens?: number;
	stream?: boolean;
	tools?: NvidiaTool[];
	toolChoice?: 'auto' | 'none' | { type: 'function'; function: { name: string } };
}

interface NvidiaTool {
	type: 'function';
	function: {
		name: string;
		description: string;
		parameters: Record<string, unknown>;
	};
}

export async function callNvidia(options: NvidiaRequestOptions): Promise<Response> {
	const {
		apiKey,
		model,
		messages,
		temperature = 0.6,
		maxTokens = 4096,
		stream = false,
		tools,
		toolChoice
	} = options;

	const body: Record<string, unknown> = {
		model,
		messages,
		temperature,
		max_tokens: maxTokens,
		stream
	};

	if (tools && tools.length > 0) {
		body.tools = tools;
		body.tool_choice = toolChoice || 'auto';
	}

	if (stream) {
		body.stream_options = { include_usage: true };
	}

	const response = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${apiKey}`
		},
		body: JSON.stringify(body)
	});

	if (!response.ok) {
		const errorBody = await response.text();
		throw new NvidiaAPIError(
			`NVIDIA API error: ${response.status} ${response.statusText}`,
			response.status,
			errorBody
		);
	}

	return response;
}

export async function* streamNvidiaResponse(
	options: NvidiaRequestOptions
): AsyncGenerator<StreamChunk> {
	const response = await callNvidia({ ...options, stream: true });

	if (!response.body) {
		throw new NvidiaAPIError('No response body from NVIDIA API', 500, '');
	}

	const reader = response.body.getReader();
	const decoder = new TextDecoder();
	let buffer = '';

	try {
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;

			buffer += decoder.decode(value, { stream: true });
			const lines = buffer.split('\n');
			buffer = lines.pop() || '';

			for (const line of lines) {
				const trimmed = line.trim();
				if (!trimmed || !trimmed.startsWith('data: ')) continue;

				const data = trimmed.slice(6);
				if (data === '[DONE]') {
					yield { type: 'done' };
					return;
				}

				try {
					const parsed = JSON.parse(data);
					const choice = parsed.choices?.[0];

					if (!choice) {
						if (parsed.usage) {
							yield {
								type: 'done',
								usage: {
									promptTokens: parsed.usage.prompt_tokens,
									completionTokens: parsed.usage.completion_tokens
								}
							};
						}
						continue;
					}

					const delta = choice.delta;

					if (delta?.content) {
						yield { type: 'text', content: delta.content };
					}

					if (delta?.tool_calls) {
						for (const tc of delta.tool_calls) {
							yield {
								type: 'tool_call',
								toolCall: {
									id: tc.id || '',
									type: tc.type || 'function',
									function: {
										name: tc.function?.name || '',
										arguments: tc.function?.arguments || ''
									}
								}
							};
						}
					}

					if (choice.finish_reason === 'stop' || choice.finish_reason === 'tool_calls') {
						yield {
							type: 'done',
							usage: parsed.usage
								? {
										promptTokens: parsed.usage.prompt_tokens,
										completionTokens: parsed.usage.completion_tokens
									}
								: undefined
						};
					}
				} catch {
					// Skip malformed JSON chunks
				}
			}
		}
	} finally {
		reader.releaseLock();
	}
}

export async function callNvidiaNonStreaming(
	options: NvidiaRequestOptions
): Promise<{ content: string; toolCalls?: ToolCall[]; usage?: { promptTokens: number; completionTokens: number } }> {
	const response = await callNvidia({ ...options, stream: false });
	const data = await response.json();
	const choice = data.choices?.[0];

	let content: string = choice?.message?.content || '';
	let toolCalls: ToolCall[] | undefined = choice?.message?.tool_calls;

	// Some models output tool calls as raw text (e.g. DeepSeek DSML format, XML format).
	// Parse and strip them if the API didn't return structured tool_calls.
	if ((!toolCalls || toolCalls.length === 0) && content) {
		const parsed = parseTextToolCalls(content);
		if (parsed.toolCalls.length > 0) {
			content = parsed.cleanText;
			toolCalls = parsed.toolCalls;
		}
	}

	return {
		content,
		toolCalls,
		usage: data.usage
			? {
					promptTokens: data.usage.prompt_tokens,
					completionTokens: data.usage.completion_tokens
				}
			: undefined
	};
}

/**
 * Parse tool calls embedded as raw text in a model response.
 * Handles DeepSeek DSML format and generic XML function_calls format.
 */
function parseTextToolCalls(text: string): { cleanText: string; toolCalls: ToolCall[] } {
	const toolCalls: ToolCall[] = [];
	let cleanText = text;

	// DeepSeek uses U+FF5C (｜) as a delimiter: <｜DSML｜function_calls>
	const PIPE = '\uFF5C';
	const dsmlFcOpen = `<${PIPE}DSML${PIPE}function_calls>`;
	const dsmlFcClose = `</${PIPE}DSML${PIPE}function_calls>`;

	let startIdx = cleanText.indexOf(dsmlFcOpen);
	let endIdx = cleanText.indexOf(dsmlFcClose);

	if (startIdx !== -1 && endIdx !== -1) {
		const block = cleanText.slice(startIdx + dsmlFcOpen.length, endIdx);
		// Parse each <｜DSML｜invoke name="...">...</｜DSML｜invoke>
		const invokeRe = new RegExp(
			`<${PIPE}DSML${PIPE}invoke name="([^"]+)">((?:.|\\n)*?)<\\/${PIPE}DSML${PIPE}invoke>`,
			'g'
		);
		let m: RegExpExecArray | null;
		while ((m = invokeRe.exec(block)) !== null) {
			const toolName = m[1];
			const invokeBody = m[2];
			const args: Record<string, string> = {};
			const paramRe = new RegExp(
				`<${PIPE}DSML${PIPE}parameter name="([^"]+)"[^>]*>((?:.|\\n)*?)<\\/${PIPE}DSML${PIPE}parameter>`,
				'g'
			);
			let p: RegExpExecArray | null;
			while ((p = paramRe.exec(invokeBody)) !== null) {
				args[p[1]] = p[2].trim();
			}
			toolCalls.push({
				id: `tc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
				type: 'function',
				function: { name: toolName, arguments: JSON.stringify(args) }
			});
		}
		cleanText = (cleanText.slice(0, startIdx) + cleanText.slice(endIdx + dsmlFcClose.length)).trim();
	}

	// Generic XML format: <function_calls><invoke name="..."><parameter name="...">val</parameter></invoke></function_calls>
	if (toolCalls.length === 0) {
		startIdx = cleanText.indexOf('<function_calls>');
		endIdx = cleanText.indexOf('</function_calls>');
		if (startIdx !== -1 && endIdx !== -1) {
			const block = cleanText.slice(startIdx + '<function_calls>'.length, endIdx);
			const invokeRe = /<invoke name="([^"]+)">([\s\S]*?)<\/invoke>/g;
			let m: RegExpExecArray | null;
			while ((m = invokeRe.exec(block)) !== null) {
				const toolName = m[1];
				const invokeBody = m[2];
				const args: Record<string, string> = {};
				const paramRe = /<parameter name="([^"]+)"[^>]*>([\s\S]*?)<\/parameter>/g;
				let p: RegExpExecArray | null;
				while ((p = paramRe.exec(invokeBody)) !== null) {
					args[p[1]] = p[2].trim();
				}
				toolCalls.push({
					id: `tc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
					type: 'function',
					function: { name: toolName, arguments: JSON.stringify(args) }
				});
			}
			cleanText = (cleanText.slice(0, startIdx) + cleanText.slice(endIdx + '</function_calls>'.length)).trim();
		}
	}

	return { cleanText, toolCalls };
}

export class NvidiaAPIError extends Error {
	status: number;
	body: string;

	constructor(message: string, status: number, body: string) {
		super(message);
		this.name = 'NvidiaAPIError';
		this.status = status;
		this.body = body;
	}
}

export function buildSystemPrompt(mode: 'chat' | 'agent', context?: { repo?: string; branch?: string }): string {
	if (mode === 'chat') {
		return `You are KlimCode, an expert AI coding assistant powered by NVIDIA NIM. You help users write code, debug issues, explain concepts, and solve programming problems.

Be concise, accurate, and practical. Format responses with markdown. When writing code, use best practices and modern patterns. Always explain what your code does and why.`;
	}

	return `You are KlimCode Agent, an autonomous AI coding assistant with access to a GitHub repository. You have exactly 5 tools available:

## Available Tools (use ONLY these)
- **read_file(path)**: Read a file's contents. Always read files before editing them.
- **write_file(path, content)**: Create or fully overwrite a file.
- **edit_file(path, old_text, new_text)**: Replace specific text in a file. The old_text must match exactly.
- **search_files(pattern, search_type, directory?)**: Search files. Use search_type="filename" to find files by name pattern, or search_type="content" to search file contents. For listing all files use search_type="filename" with pattern="." — do NOT use "*" as a pattern.
- **list_files(directory?)**: List all files in a directory. Use list_files("") to list all repository files, or list_files("src") for a subdirectory.
- **create_pr(title, body, branch)**: Create a GitHub PR with your changes.

## IMPORTANT Rules
1. ONLY call tools that are listed above. Do NOT call run_command or any other tool — it will fail.
2. To explore the repo, call list_files("") first to see all files.
3. Always read_file before edit_file — you need the exact text to replace.
4. When edit_file fails, use write_file to rewrite the whole file instead.
5. Make minimal targeted changes. Don't rewrite files unless necessary.
6. After making changes, summarize what you did clearly.
${context?.repo ? `\n## Repository\n- Repo: ${context.repo}\n- Branch: ${context.branch || 'main'}` : '\n## Note\nNo GitHub repository connected. You can only analyze and discuss code — file operations require a connected repo.'}

## Response Style
1. ALWAYS respond with a brief text message FIRST before using any tools. For example: "Sure, let me take a look at that file." or "I'll fix that for you. Let me read the current code first."
2. Never jump straight into tool calls without a text response — the user should see your acknowledgement first.
3. Use tools one at a time. Explain your reasoning before each tool call.
4. Think step by step.`;
}

export function getAgentTools(): NvidiaTool[] {
	return [
		{
			type: 'function',
			function: {
				name: 'read_file',
				description: 'Read the contents of a file at the given path',
				parameters: {
					type: 'object',
					properties: {
						path: {
							type: 'string',
							description: 'The file path relative to the workspace root'
						}
					},
					required: ['path']
				}
			}
		},
		{
			type: 'function',
			function: {
				name: 'write_file',
				description: 'Write content to a file, creating it if it does not exist or overwriting if it does',
				parameters: {
					type: 'object',
					properties: {
						path: {
							type: 'string',
							description: 'The file path relative to the workspace root'
						},
						content: {
							type: 'string',
							description: 'The full content to write to the file'
						}
					},
					required: ['path', 'content']
				}
			}
		},
		{
			type: 'function',
			function: {
				name: 'edit_file',
				description: 'Make a targeted edit to an existing file by replacing specific text',
				parameters: {
					type: 'object',
					properties: {
						path: {
							type: 'string',
							description: 'The file path relative to the workspace root'
						},
						old_text: {
							type: 'string',
							description: 'The exact text to find and replace'
						},
						new_text: {
							type: 'string',
							description: 'The replacement text'
						}
					},
					required: ['path', 'old_text', 'new_text']
				}
			}
		},
		{
			type: 'function',
			function: {
				name: 'search_files',
				description: 'Search for files by name pattern or search file contents with a regex pattern',
				parameters: {
					type: 'object',
					properties: {
						pattern: {
							type: 'string',
							description: 'The search pattern (glob for file names, regex for content)'
						},
						search_type: {
							type: 'string',
							enum: ['filename', 'content'],
							description: 'Whether to search file names or file contents'
						},
						directory: {
							type: 'string',
							description: 'Directory to search in (relative to workspace root)'
						}
					},
					required: ['pattern', 'search_type']
				}
			}
		},
		{
			type: 'function',
			function: {
				name: 'create_pr',
				description: 'Create a GitHub pull request with the changes made in the sandbox',
				parameters: {
					type: 'object',
					properties: {
						title: {
							type: 'string',
							description: 'The PR title'
						},
						body: {
							type: 'string',
							description: 'The PR description in markdown'
						},
						branch: {
							type: 'string',
							description: 'The branch name for the PR'
						},
						base_branch: {
							type: 'string',
							description: 'The target branch to merge into (defaults to main)'
						}
					},
					required: ['title', 'body', 'branch']
				}
			}
		}
	];
}
