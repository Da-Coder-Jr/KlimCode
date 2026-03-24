import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getConversation, updateConversationTitle, updateConversationModel, deleteConversation } from '$server/db/queries';
import { destroyWorkspace } from '$server/agent/workspace';

export const GET: RequestHandler = async ({ locals, params }) => {
	if (!locals.user) return json({ message: 'Not authenticated' }, { status: 401 });
	const conversation = await getConversation(params.id, locals.user.id);
	if (!conversation) return json({ message: 'Conversation not found' }, { status: 404 });
	return json({ conversation });
};

export const PATCH: RequestHandler = async ({ locals, params, request }) => {
	if (!locals.user) return json({ message: 'Not authenticated' }, { status: 401 });
	const body = await request.json();
	if (body.title) await updateConversationTitle(params.id, locals.user.id, body.title);
	if (body.model) await updateConversationModel(params.id, locals.user.id, body.model);
	return json({ success: true });
};

export const DELETE: RequestHandler = async ({ locals, params }) => {
	if (!locals.user) return json({ message: 'Not authenticated' }, { status: 401 });
	destroyWorkspace(params.id);
	await deleteConversation(params.id, locals.user.id);
	return json({ success: true });
};
