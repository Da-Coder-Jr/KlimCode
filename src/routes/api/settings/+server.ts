import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getApiKey } from '$server/db/queries';

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) return json({}, { status: 401 });

	const apiKey = getApiKey(locals.user.id);

	return json({
		nvidiaApiKey: apiKey ? '••••••••' + apiKey.slice(-4) : '',
		defaultModel: 'meta/llama-3.3-70b-instruct',
		github: {
			connected: !!locals.user.githubId,
			username: locals.user.githubId ? locals.user.username : undefined
		}
	});
};

export const PUT: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) return json({ message: 'Not authenticated' }, { status: 401 });

	// Settings are stored per-user; for now just acknowledge
	return json({ success: true });
};
