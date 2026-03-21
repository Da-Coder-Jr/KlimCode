import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { createMessage, getMessages, getConversation } from '$server/db/queries';
import { getApiKey } from '$server/db/queries';
import { executeAgent } from '$server/agent/executor';
import { createSSEStream, sseResponse } from '$server/ai/streaming';
import type { StreamChunk, AgentStep } from '$types/core';

export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) return json({ message: 'Not authenticated' }, { status: 401 });

	const { conversationId, message, model, repoCloneUrl, repoFullName } = await request.json();

	if (!conversationId || !message) {
		return json({ message: 'conversationId and message are required' }, { status: 400 });
	}

	const conversation = getConversation(conversationId, locals.user.id);
	if (!conversation) return json({ message: 'Conversation not found' }, { status: 404 });

	const apiKey = getApiKey(locals.user.id);
	if (!apiKey) {
		return json({ message: 'No NVIDIA API key configured. Please add one in Settings.' }, { status: 400 });
	}

	// Save user message
	createMessage(conversationId, 'user', message);

	// Get conversation history
	const history = getMessages(conversationId);

	// Track agent steps and content
	let fullContent = '';
	const agentSteps: AgentStep[] = [];

	const generator = executeAgent({
		apiKey,
		model: model || conversation.model,
		conversationId,
		messages: history,
		repoCloneUrl,
		repoFullName,
		githubToken: locals.user.githubToken,
		onStep: (step) => {
			const existing = agentSteps.findIndex((s) => s.id === step.id);
			if (existing >= 0) {
				agentSteps[existing] = step;
			} else {
				agentSteps.push(step);
			}
		}
	});

	async function* wrappedGenerator(): AsyncGenerator<StreamChunk> {
		for await (const chunk of generator) {
			if (chunk.type === 'text' && chunk.content) {
				fullContent += chunk.content;
			}
			yield chunk;
		}

		// Save assistant message
		if (fullContent) {
			createMessage(conversationId, 'assistant', fullContent, {
				model: model || conversation.model,
				metadata: { agentSteps }
			});
		}
	}

	const stream = createSSEStream(wrappedGenerator());
	return sseResponse(stream);
};
