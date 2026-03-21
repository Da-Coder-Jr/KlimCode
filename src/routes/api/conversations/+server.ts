import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createConversation, listConversations } from '$server/db/queries';

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) return json({ conversations: [] }, { status: 401 });

	const conversations = listConversations(locals.user.id);
	return json({ conversations });
};

export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) return json({ message: 'Not authenticated' }, { status: 401 });

	const { mode, model, title } = await request.json();
	const conversation = createConversation(
		locals.user.id,
		mode || 'chat',
		model || 'meta/llama-3.3-70b-instruct',
		title
	);

	return json({ conversation });
};
