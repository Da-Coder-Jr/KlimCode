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

	return {
		content: choice?.message?.content || '',
		toolCalls: choice?.message?.tool_calls,
		usage: data.usage
			? {
					promptTokens: data.usage.prompt_tokens,
					completionTokens: data.usage.completion_tokens
				}
			: undefined
	};
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

	return `You are KlimCode Agent, an autonomous AI coding assistant with access to a GitHub repository. You have 6 tools available.

## Available Tools (use ONLY these — nothing else exists)
1. **read_file(path)** — Read a file's contents. Always read before editing.
2. **write_file(path, content)** — Create or fully overwrite a file.
3. **edit_file(path, old_text, new_text)** — Replace specific text in a file. The old_text must match exactly (including whitespace).
4. **search_files(pattern, search_type)** — Search by filename (glob pattern) or file contents (text query). Use search_type="filename" or search_type="content".
5. **list_files(directory)** — List all files in a directory. Use list_files("") to see the entire repo, or list_files("src") for a subdirectory.
6. **create_pr(title, body, branch)** — Create a GitHub PR with all your changes.

## Rules
1. ONLY call the 6 tools listed above. Do NOT invent tools like run_command — they don't exist and will fail.
2. Start by calling list_files("") to understand the repo structure.
3. Always read_file before edit_file so you have the exact text to match.
4. If edit_file fails (text not found), re-read the file and try again with the correct text, or use write_file to rewrite the entire file.
5. Make minimal, targeted changes. Prefer edit_file over write_file when possible.
6. After completing changes, summarize exactly what you modified and why.
${context?.repo ? `\n## Repository\n- Repo: ${context.repo}\n- Branch: ${context.branch || 'main'}` : '\n## Note\nNo GitHub repository connected. You can only analyze and discuss code — file operations require a connected repo.'}

Think step by step. Explain your reasoning before each tool call.`;
}

export function getAgentTools(): NvidiaTool[] {
	return [
		{
			type: 'function',
			function: {
				name: 'read_file',
				description: 'Read the contents of a file at the given path. Always read a file before editing it.',
				parameters: {
					type: 'object',
					properties: {
						path: {
							type: 'string',
							description: 'The file path relative to the repository root'
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
				description: 'Write content to a file, creating it if it does not exist or fully overwriting if it does',
				parameters: {
					type: 'object',
					properties: {
						path: {
							type: 'string',
							description: 'The file path relative to the repository root'
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
				description: 'Make a targeted edit to an existing file by replacing specific text. The old_text must match exactly (including whitespace and indentation).',
				parameters: {
					type: 'object',
					properties: {
						path: {
							type: 'string',
							description: 'The file path relative to the repository root'
						},
						old_text: {
							type: 'string',
							description: 'The exact text to find and replace (must be unique in the file)'
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
				description: 'Search for files by name pattern (glob) or search file contents with a text query',
				parameters: {
					type: 'object',
					properties: {
						pattern: {
							type: 'string',
							description: 'The search pattern — glob for filenames (e.g. "*.ts", "src/**/*.js") or text query for content search'
						},
						search_type: {
							type: 'string',
							enum: ['filename', 'content'],
							description: 'Whether to search file names or file contents'
						},
						directory: {
							type: 'string',
							description: 'Optional directory to narrow the search'
						}
					},
					required: ['pattern', 'search_type']
				}
			}
		},
		{
			type: 'function',
			function: {
				name: 'list_files',
				description: 'List all files in a directory. Use an empty string to list all files in the repository root.',
				parameters: {
					type: 'object',
					properties: {
						directory: {
							type: 'string',
							description: 'The directory path relative to the repository root. Use "" for the entire repo.'
						}
					},
					required: []
				}
			}
		},
		{
			type: 'function',
			function: {
				name: 'create_pr',
				description: 'Create a GitHub pull request with all the file changes made so far',
				parameters: {
					type: 'object',
					properties: {
						title: {
							type: 'string',
							description: 'The PR title (concise summary of changes)'
						},
						body: {
							type: 'string',
							description: 'The PR description in markdown format'
						},
						branch: {
							type: 'string',
							description: 'The branch name for the PR (e.g. "fix/login-bug")'
						}
					},
					required: ['title', 'body', 'branch']
				}
			}
		}
	];
}
