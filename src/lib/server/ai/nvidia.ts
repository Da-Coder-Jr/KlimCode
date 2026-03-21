import type { Message, NvidiaModel, ToolCall, StreamChunk } from '$types/core';

const NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com/v1';

export const AVAILABLE_MODELS: NvidiaModel[] = [
	{
		id: 'meta/llama-3.3-70b-instruct',
		name: 'Llama 3.3 70B Instruct',
		description: 'High-performance open model for complex reasoning and code generation',
		maxTokens: 16384,
		supportsTools: true,
		supportsFunctions: true,
		category: 'code'
	},
	{
		id: 'meta/llama-3.1-405b-instruct',
		name: 'Llama 3.1 405B Instruct',
		description: 'Largest open model, best for complex tasks and tool use',
		maxTokens: 16384,
		supportsTools: true,
		supportsFunctions: true,
		category: 'reasoning'
	},
	{
		id: 'meta/llama-3.1-70b-instruct',
		name: 'Llama 3.1 70B Instruct',
		description: 'Strong all-around model for coding and reasoning',
		maxTokens: 16384,
		supportsTools: true,
		supportsFunctions: true,
		category: 'code'
	},
	{
		id: 'nvidia/llama-3.1-nemotron-70b-instruct',
		name: 'Nemotron 70B',
		description: 'NVIDIA-optimized Llama for high quality instruction following',
		maxTokens: 16384,
		supportsTools: true,
		supportsFunctions: true,
		category: 'reasoning'
	},
	{
		id: 'deepseek-ai/deepseek-r1',
		name: 'DeepSeek R1',
		description: 'Advanced reasoning model with chain-of-thought capability',
		maxTokens: 32768,
		supportsTools: false,
		supportsFunctions: false,
		category: 'reasoning'
	},
	{
		id: 'qwen/qwen2.5-coder-32b-instruct',
		name: 'Qwen 2.5 Coder 32B',
		description: 'Specialized coding model with strong code generation',
		maxTokens: 16384,
		supportsTools: true,
		supportsFunctions: true,
		category: 'code'
	},
	{
		id: 'microsoft/phi-4',
		name: 'Phi-4',
		description: 'Efficient small model, fast and capable',
		maxTokens: 16384,
		supportsTools: false,
		supportsFunctions: false,
		category: 'chat'
	},
	{
		id: 'google/gemma-2-27b-it',
		name: 'Gemma 2 27B',
		description: 'Balanced model for chat and instruction tasks',
		maxTokens: 8192,
		supportsTools: false,
		supportsFunctions: false,
		category: 'chat'
	}
];

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
		return `You are KlimCode, an AI assistant specialized in software engineering. You help users write code, debug issues, explain concepts, and solve programming problems. Be concise, accurate, and helpful. When writing code, use best practices and modern patterns. Format responses with markdown.`;
	}

	return `You are KlimCode Agent, an autonomous AI coding assistant. You can read files, write files, edit files, run commands, search codebases, and create GitHub pull requests.

## Your Capabilities
- **read_file**: Read the contents of any file in the workspace
- **write_file**: Create or overwrite a file with new content
- **edit_file**: Make targeted edits to existing files
- **run_command**: Execute shell commands in a sandboxed environment
- **search_files**: Search for files or content in the workspace
- **create_pr**: Draft a GitHub pull request with your changes

## Guidelines
1. Always read and understand existing code before making changes
2. Make minimal, targeted changes — avoid unnecessary modifications
3. Test your changes by running relevant commands when possible
4. Write clear commit messages and PR descriptions
5. Ask for clarification if the task is ambiguous
${context?.repo ? `\n## Context\n- Repository: ${context.repo}\n- Branch: ${context.branch || 'main'}` : ''}

When you need to take an action, use the provided tool functions. Think step by step about what needs to be done, then execute the necessary actions.`;
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
				name: 'run_command',
				description: 'Execute a shell command in the sandbox environment. Use for running tests, installing packages, building, etc.',
				parameters: {
					type: 'object',
					properties: {
						command: {
							type: 'string',
							description: 'The shell command to execute'
						},
						working_directory: {
							type: 'string',
							description: 'Working directory for the command (relative to workspace root)'
						}
					},
					required: ['command']
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
