import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { storeApiKey, deleteApiKeys } from '$server/db/queries';

export const PUT: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) return json({ message: 'Not authenticated' }, { status: 401 });
	const { apiKey } = await request.json();

	if (!apiKey || !apiKey.startsWith('nvapi-')) {
		return json({ message: 'Invalid key format. Should start with nvapi-' }, { status: 400 });
	}

	await deleteApiKeys(locals.user.id);
	await storeApiKey(locals.user.id, apiKey);
	return json({ success: true });
};
