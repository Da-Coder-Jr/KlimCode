import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { createMessage, getMessages, getConversation, getApiKey } from '$server/db/queries';
import { executeAgent } from '$server/agent/executor';
import { createSSEStream, sseResponse } from '$server/ai/streaming';
import type { StreamChunk, AgentStep } from '$types/core';

export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) return json({ message: 'Not authenticated' }, { status: 401 });

	const { conversationId, message, model, repoOwner, repoName, baseBranch } = await request.json();
	if (!conversationId || !message) {
		return json({ message: 'conversationId and message are required' }, { status: 400 });
	}

	const conversation = await getConversation(conversationId, locals.user.id);
	if (!conversation) return json({ message: 'Conversation not found' }, { status: 404 });

	const apiKey = await getApiKey(locals.user.id);
	if (!apiKey) {
		return json({ message: 'No NVIDIA API key configured. Add one in Settings.' }, { status: 400 });
	}

	await createMessage(conversationId, 'user', message);
	const history = await getMessages(conversationId);

	let fullContent = '';
	const agentSteps: AgentStep[] = [];

	async function* wrappedGenerator(): AsyncGenerator<StreamChunk> {
		const generator = executeAgent({
			apiKey,
			model: model || conversation.model,
			conversationId,
			messages: history,
			repoOwner,
			repoName,
			githubToken: locals.user?.githubToken,
			baseBranch
		});

		for await (const chunk of generator) {
			if (chunk.type === 'text' && chunk.content) fullContent += chunk.content;
			if (chunk.type === 'text_replace' && chunk.content !== undefined) fullContent = chunk.content;
			if (chunk.type === 'agent_step' && chunk.agentStep) {
				const idx = agentSteps.findIndex((s) => s.id === chunk.agentStep!.id);
				if (idx >= 0) agentSteps[idx] = chunk.agentStep;
				else agentSteps.push(chunk.agentStep);
			}
			yield chunk;
		}

		if (fullContent) {
			await createMessage(conversationId, 'assistant', fullContent, {
				model: model || conversation.model,
				metadata: { agentSteps }
			});
		}
	}

	return sseResponse(createSSEStream(wrappedGenerator()));
};
