import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { createMessage, getMessages, getConversation } from '$server/db/queries';
import { getApiKey } from '$server/db/queries';
import { executeChat } from '$server/agent/executor';
import { createSSEStream, sseResponse } from '$server/ai/streaming';
import type { StreamChunk } from '$types/core';

export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) return json({ message: 'Not authenticated' }, { status: 401 });

	const { conversationId, message, model } = await request.json();

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

	// Stream response
	const generator = executeChat({
		apiKey,
		model: model || conversation.model,
		messages: history
	});

	// Collect content for saving
	let fullContent = '';
	let totalTokens = { prompt: 0, completion: 0 };

	async function* wrappedGenerator(): AsyncGenerator<StreamChunk> {
		for await (const chunk of generator) {
			if (chunk.type === 'text' && chunk.content) {
				fullContent += chunk.content;
			}
			if (chunk.type === 'done' && chunk.usage) {
				totalTokens = {
					prompt: chunk.usage.promptTokens,
					completion: chunk.usage.completionTokens
				};
			}
			yield chunk;
		}

		// Save assistant message after streaming completes
		if (fullContent) {
			createMessage(conversationId, 'assistant', fullContent, {
				model: model || conversation.model,
				tokensPrompt: totalTokens.prompt,
				tokensCompletion: totalTokens.completion
			});
		}
	}

	const stream = createSSEStream(wrappedGenerator());
	return sseResponse(stream);
};
