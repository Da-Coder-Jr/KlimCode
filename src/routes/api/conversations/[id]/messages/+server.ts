import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getMessages, getConversation } from '$server/db/queries';

export const GET: RequestHandler = async ({ locals, params, url }) => {
	if (!locals.user) return json({ messages: [] }, { status: 401 });

	const conversation = getConversation(params.id, locals.user.id);
	if (!conversation) return json({ message: 'Conversation not found' }, { status: 404 });

	const limit = parseInt(url.searchParams.get('limit') || '100', 10);
	const offset = parseInt(url.searchParams.get('offset') || '0', 10);
	const messages = getMessages(params.id, limit, offset);

	return json({ messages });
};
