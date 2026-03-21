import type { Message, ToolCall, ToolResult, AgentStep, StreamChunk } from '$types/core';
import {
	streamNvidiaResponse,
	callNvidiaNonStreaming,
	buildSystemPrompt,
	getAgentTools,
	type NvidiaAPIError
} from '$server/ai/nvidia';
import { mergeToolCallChunks } from '$server/ai/streaming';
import { executeToolCall, type ToolExecutionContext } from './tools';
import { createSandbox, getSandbox, type Sandbox } from './sandbox';

const MAX_TOOL_ROUNDS = 15;

interface AgentExecutionOptions {
	apiKey: string;
	model: string;
	conversationId: string;
	messages: Message[];
	repoCloneUrl?: string;
	repoFullName?: string;
	githubToken?: string;
	onStep?: (step: AgentStep) => void;
}

export async function* executeAgent(
	options: AgentExecutionOptions
): AsyncGenerator<StreamChunk> {
	const {
		apiKey,
		model,
		conversationId,
		messages,
		repoCloneUrl,
		repoFullName,
		githubToken,
		onStep
	} = options;

	// Get or create sandbox
	let sandbox = getSandbox(conversationId);
	if (!sandbox) {
		sandbox = createSandbox(conversationId, repoCloneUrl);
		yield {
			type: 'agent_step',
			agentStep: {
				id: 'sandbox-init',
				type: 'think',
				status: 'completed',
				description: repoCloneUrl ? `Cloned repository into sandbox` : 'Created sandbox environment',
				completedAt: new Date().toISOString()
			}
		};
	}

	const systemPrompt = buildSystemPrompt('agent', {
		repo: repoFullName,
		branch: sandbox.gitBranch
	});

	// Build message history for the API
	const apiMessages = buildAPIMessages(systemPrompt, messages);
	const tools = getAgentTools();

	const toolContext: ToolExecutionContext = {
		sandbox,
		githubToken,
		repoFullName,
		onStep
	};

	// Agent loop: let the model call tools iteratively
	let round = 0;
	let currentMessages = [...apiMessages];

	while (round < MAX_TOOL_ROUNDS) {
		round++;

		// Call the model
		let fullContent = '';
		const toolCalls: ToolCall[] = [];

		try {
			// Use non-streaming for tool-use rounds to simplify parsing
			const result = await callNvidiaNonStreaming({
				apiKey,
				model,
				messages: currentMessages,
				tools,
				toolChoice: 'auto',
				maxTokens: 8192
			});

			fullContent = result.content;

			if (result.toolCalls) {
				toolCalls.push(...result.toolCalls);
			}
		} catch (error) {
			yield {
				type: 'error',
				error: error instanceof Error ? error.message : 'NVIDIA API error'
			};
			return;
		}

		// Stream any text content
		if (fullContent) {
			yield { type: 'text', content: fullContent };
		}

		// If no tool calls, we're done
		if (toolCalls.length === 0) {
			yield { type: 'done' };
			return;
		}

		// Add assistant message with tool calls
		currentMessages.push({
			role: 'assistant',
			content: fullContent || '',
			tool_calls: toolCalls.map((tc) => ({
				id: tc.id,
				type: 'function' as const,
				function: {
					name: tc.function.name,
					arguments: tc.function.arguments
				}
			}))
		});

		// Execute each tool call
		for (const toolCall of toolCalls) {
			const step: AgentStep = {
				id: toolCall.id,
				type: mapToolToStep(toolCall.function.name),
				status: 'running',
				description: `Executing: ${toolCall.function.name}`,
				startedAt: new Date().toISOString()
			};

			yield { type: 'agent_step', agentStep: step };

			const result = await executeToolCall(toolCall, toolContext);

			step.status = result.isError ? 'failed' : 'completed';
			step.result = result.content;
			step.completedAt = new Date().toISOString();

			yield { type: 'agent_step', agentStep: step };
			yield { type: 'tool_result', toolResult: result };

			// Add tool result to messages
			currentMessages.push({
				role: 'tool',
				content: result.content,
				tool_call_id: toolCall.id
			});
		}
	}

	yield { type: 'text', content: '\n\n*Reached maximum tool execution rounds. Please continue the conversation if more work is needed.*' };
	yield { type: 'done' };
}

export async function* executeChat(options: {
	apiKey: string;
	model: string;
	messages: Message[];
}): AsyncGenerator<StreamChunk> {
	const { apiKey, model, messages } = options;

	const systemPrompt = buildSystemPrompt('chat');
	const apiMessages = buildAPIMessages(systemPrompt, messages);

	yield* streamNvidiaResponse({
		apiKey,
		model,
		messages: apiMessages,
		maxTokens: 4096
	});
}

function buildAPIMessages(
	systemPrompt: string,
	messages: Message[]
): Array<{ role: string; content: string; tool_call_id?: string; tool_calls?: ToolCall[] }> {
	const apiMessages: Array<{ role: string; content: string; tool_call_id?: string; tool_calls?: ToolCall[] }> = [
		{ role: 'system', content: systemPrompt }
	];

	for (const msg of messages) {
		apiMessages.push({
			role: msg.role,
			content: msg.content
		});
	}

	return apiMessages;
}

function mapToolToStep(toolName: string): AgentStep['type'] {
	const map: Record<string, AgentStep['type']> = {
		read_file: 'read_file',
		write_file: 'write_file',
		edit_file: 'edit_file',
		run_command: 'run_command',
		search_files: 'search_files',
		create_pr: 'create_pr'
	};
	return map[toolName] || 'think';
}
