import type { Message, ToolCall, AgentStep, StreamChunk } from '$types/core';
import {
	streamNvidiaResponse,
	callNvidiaNonStreaming,
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
			const result = await callNvidiaNonStreaming({
				apiKey, model, messages: currentMessages,
				tools: toolContext ? tools : undefined,
				toolChoice: toolContext ? 'auto' : undefined,
				maxTokens: 8192
			});

			fullContent = result.content;
			if (result.toolCalls) toolCalls.push(...result.toolCalls);
		} catch (error) {
			yield { type: 'error', error: error instanceof Error ? error.message : 'NVIDIA API error' };
			return;
		}

		if (fullContent) {
			yield { type: 'text', content: fullContent };
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
