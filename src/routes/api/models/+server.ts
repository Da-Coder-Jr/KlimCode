import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { AVAILABLE_MODELS } from '$server/ai/nvidia';

export const GET: RequestHandler = async () => {
	return json({ models: AVAILABLE_MODELS });
};
