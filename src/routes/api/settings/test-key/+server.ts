import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { callNvidiaNonStreaming } from '$server/ai/nvidia';

export const POST: RequestHandler = async ({ request }) => {
	const { apiKey } = await request.json();

	if (!apiKey) {
		return json({ success: false, message: 'No API key provided' });
	}

	try {
		const result = await callNvidiaNonStreaming({
			apiKey,
			model: 'qwen/qwen2.5-coder-32b-instruct',
			messages: [{ role: 'user', content: 'Say "API key verified" and nothing else.' }],
			maxTokens: 20
		});

		if (result.content) {
			return json({ success: true, message: 'API key is valid! Connected to NVIDIA NIM.' });
		}

		return json({ success: false, message: 'Unexpected response from NVIDIA API' });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		return json({ success: false, message: `Connection failed: ${message}` });
	}
};
