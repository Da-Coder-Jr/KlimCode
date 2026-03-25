import type { Message, ToolCall, AgentStep, StreamChunk } from '$types/core';
import {
	callNvidia,
	streamNvidiaResponse,
	buildSystemPrompt,
	getAgentTools
} from '$server/ai/nvidia';
import { executeToolCall, type ToolExecutionContext } from './tools';
import { createWorkspace, getWorkspace, type Workspace } from './workspace';

const MAX_TOOL_ROUNDS = 15;

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

	// Get or create workspace
	let workspace: Workspace | undefined;

	if (repoOwner && repoName && githubToken) {
		workspace = getWorkspace(conversationId);
		if (!workspace) {
			workspace = createWorkspace(conversationId, repoOwner, repoName, githubToken, baseBranch);
			yield {
				type: 'agent_step',
				agentStep: {
					id: 'workspace-init',
					type: 'think',
					status: 'completed',
					description: `Connected to ${repoOwner}/${repoName}`,
					completedAt: new Date().toISOString()
				}
			};
		}
	}

	const systemPrompt = buildSystemPrompt('agent', {
		repo: repoOwner && repoName ? `${repoOwner}/${repoName}` : undefined,
		branch: baseBranch
	});

	const apiMessages = buildAPIMessages(systemPrompt, messages);
	const tools = getAgentTools();

	const toolContext: ToolExecutionContext | undefined = workspace
		? { workspace, onStep }
		: undefined;

	let round = 0;
	let currentMessages = [...apiMessages];

	while (round < MAX_TOOL_ROUNDS) {
		round++;

		let fullContent = '';
		const toolCalls: ToolCall[] = [];

		try {
			// Stream the response so text appears progressively in the UI
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
			// Accumulate tool_call deltas by index (they arrive as chunks)
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
								if (tc.function?.name) entry.name += tc.function.name;
								if (tc.function?.arguments) entry.args += tc.function.arguments;
							}
						}
					} catch {
						// Skip malformed chunks
					}
				}
			}

			reader.releaseLock();

			// Convert accumulated deltas to proper ToolCall objects
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
			const step: AgentStep = {
				id: toolCall.id,
				type: mapToolToStep(toolCall.function.name),
				status: 'running',
				description: buildStepDescription(toolCall.function.name, toolCall.function.arguments),
				startedAt: new Date().toISOString()
			};

			yield { type: 'agent_step', agentStep: step };

			const result = await executeToolCall(toolCall, toolContext);

			step.status = result.isError ? 'failed' : 'completed';
			step.result = result.content;
			step.completedAt = new Date().toISOString();

			yield { type: 'agent_step', agentStep: step };
			yield { type: 'tool_result', toolResult: result };

			currentMessages.push({
				role: 'tool', content: result.content, tool_call_id: toolCall.id
			});
		}
	}

	yield { type: 'text', content: '\n\n*Reached maximum tool rounds. Continue the conversation if more work is needed.*' };
	yield { type: 'done' };
}

export async function* executeChat(options: {
	apiKey: string; model: string; messages: Message[];
}): AsyncGenerator<StreamChunk> {
	const systemPrompt = buildSystemPrompt('chat');
	const apiMessages = buildAPIMessages(systemPrompt, options.messages);

	yield* streamNvidiaResponse({
		apiKey: options.apiKey, model: options.model,
		messages: apiMessages, maxTokens: 4096
	});
}

function buildAPIMessages(
	systemPrompt: string,
	messages: Message[]
): Array<{ role: string; content: string; tool_call_id?: string; tool_calls?: ToolCall[] }> {
	return [
		{ role: 'system', content: systemPrompt },
		...messages.map((msg) => ({ role: msg.role, content: msg.content }))
	];
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
