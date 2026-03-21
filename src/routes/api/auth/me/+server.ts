import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) {
		return json({ user: null }, { status: 401 });
	}

	return json({
		user: {
			id: locals.user.id,
			username: locals.user.username,
			displayName: locals.user.displayName,
			avatarUrl: locals.user.avatarUrl,
			githubId: locals.user.githubId,
			githubUsername: locals.user.githubUsername
		}
	});
};
