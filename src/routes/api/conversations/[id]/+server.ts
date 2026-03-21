import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getConversation, updateConversationTitle, deleteConversation } from '$server/db/queries';

export const GET: RequestHandler = async ({ locals, params }) => {
	if (!locals.user) return json({ message: 'Not authenticated' }, { status: 401 });
	const conversation = await getConversation(params.id, locals.user.id);
	if (!conversation) return json({ message: 'Conversation not found' }, { status: 404 });
	return json({ conversation });
};

export const PATCH: RequestHandler = async ({ locals, params, request }) => {
	if (!locals.user) return json({ message: 'Not authenticated' }, { status: 401 });
	const { title } = await request.json();
	if (title) await updateConversationTitle(params.id, locals.user.id, title);
	return json({ success: true });
};

export const DELETE: RequestHandler = async ({ locals, params }) => {
	if (!locals.user) return json({ message: 'Not authenticated' }, { status: 401 });
	await deleteConversation(params.id, locals.user.id);
	return json({ success: true });
};
