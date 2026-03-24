import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getApiKey } from '$server/db/queries';

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) return json({}, { status: 401 });
	const apiKey = await getApiKey(locals.user.id);

	return json({
		nvidiaApiKey: apiKey ? '••••••••' + apiKey.slice(-4) : '',
		defaultModel: 'qwen/qwen2.5-coder-32b-instruct',
		github: {
			connected: !!locals.user.githubId,
			username: locals.user.githubUsername || (locals.user.githubId ? locals.user.username : undefined)
		}
	});
};

export const PUT: RequestHandler = async ({ locals }) => {
	if (!locals.user) return json({ message: 'Not authenticated' }, { status: 401 });
	return json({ success: true });
};
