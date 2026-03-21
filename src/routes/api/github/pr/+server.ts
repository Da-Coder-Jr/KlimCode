import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { listPullRequests } from '$server/github/client';

export const GET: RequestHandler = async ({ locals, url }) => {
	if (!locals.user || !locals.user.githubToken) {
		return json({ pullRequests: [] }, { status: 401 });
	}

	const owner = url.searchParams.get('owner');
	const repo = url.searchParams.get('repo');

	if (!owner || !repo) {
		return json({ message: 'owner and repo are required' }, { status: 400 });
	}

	try {
		const pullRequests = await listPullRequests(locals.user.githubToken, owner, repo);
		return json({ pullRequests });
	} catch (error) {
		return json({
			pullRequests: [],
			error: error instanceof Error ? error.message : 'Failed to fetch PRs'
		});
	}
};
