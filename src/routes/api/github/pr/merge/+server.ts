import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { mergePullRequest } from '$server/github/client';

export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.user || !locals.user.githubToken) {
		return json({ message: 'Not authenticated with GitHub' }, { status: 401 });
	}

	const { owner, repo, prNumber, method } = await request.json();

	if (!owner || !repo || !prNumber) {
		return json({ message: 'owner, repo, and prNumber are required' }, { status: 400 });
	}

	try {
		const result = await mergePullRequest(
			locals.user.githubToken,
			owner,
			repo,
			prNumber,
			method || 'squash'
		);
		return json(result);
	} catch (error) {
		return json(
			{ merged: false, message: error instanceof Error ? error.message : 'Merge failed' },
			{ status: 500 }
		);
	}
};
