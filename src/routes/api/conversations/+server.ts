import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createConversation, listConversations } from '$server/db/queries';
import { AVAILABLE_MODELS } from '$lib/models';

const DEFAULT_MODEL = AVAILABLE_MODELS[0]?.id || 'qwen/qwen3-coder-480b-a35b-instruct';

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) return json({ conversations: [] }, { status: 401 });
	const conversations = await listConversations(locals.user.id);
	return json({ conversations });
};

export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) return json({ message: 'Not authenticated' }, { status: 401 });
	const { mode, model, title } = await request.json();
	const conversation = await createConversation(locals.user.id, mode || 'chat', model || DEFAULT_MODEL, title);
	return json({ conversation });
};
