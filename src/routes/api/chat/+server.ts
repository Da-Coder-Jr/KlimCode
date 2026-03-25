import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { createMessage, getMessages, getConversation, getApiKey } from '$server/db/queries';
import { executeChat } from '$server/agent/executor';
import { createSSEStream, sseResponse } from '$server/ai/streaming';
import type { StreamChunk } from '$types/core';

export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) return json({ message: 'Not authenticated' }, { status: 401 });

	const { conversationId, message, model } = await request.json();
	if (!conversationId || !message) {
		return json({ message: 'conversationId and message are required' }, { status: 400 });
	}

	const conversation = await getConversation(conversationId, locals.user.id);
	if (!conversation) return json({ message: 'Conversation not found' }, { status: 404 });

	const apiKeyResult = await getApiKey(locals.user.id);
	if (!apiKeyResult) {
		return json({ message: 'No NVIDIA API key configured. Add one in Settings.' }, { status: 400 });
	}

	const resolvedApiKey: string = apiKeyResult;
	const resolvedModel: string = model || conversation.model;

	await createMessage(conversationId, 'user', message);
	const history = await getMessages(conversationId);

	let fullContent = '';
	let totalTokens = { prompt: 0, completion: 0 };

	async function* wrappedGenerator(): AsyncGenerator<StreamChunk> {
		const generator = executeChat({ apiKey: resolvedApiKey, model: resolvedModel, messages: history });
		for await (const chunk of generator) {
			if (chunk.type === 'text' && chunk.content) fullContent += chunk.content;
			if (chunk.type === 'done' && chunk.usage) {
				totalTokens = { prompt: chunk.usage.promptTokens, completion: chunk.usage.completionTokens };
			}
			yield chunk;
		}

		if (fullContent) {
			await createMessage(conversationId, 'assistant', fullContent, {
				model: resolvedModel,
				tokensPrompt: totalTokens.prompt,
				tokensCompletion: totalTokens.completion
			});
		}
	}

	return sseResponse(createSSEStream(wrappedGenerator()));
};
