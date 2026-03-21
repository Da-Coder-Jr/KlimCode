import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { storeApiKey, deleteApiKeys } from '$server/db/queries';

export const PUT: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) return json({ message: 'Not authenticated' }, { status: 401 });

	const { apiKey } = await request.json();

	if (!apiKey || !apiKey.startsWith('nvapi-')) {
		return json({ message: 'Invalid NVIDIA API key format. Key should start with nvapi-' }, { status: 400 });
	}

	// Replace existing key
	deleteApiKeys(locals.user.id);
	storeApiKey(locals.user.id, apiKey);

	return json({ success: true });
};
