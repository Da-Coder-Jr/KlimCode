import { redirect, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { authenticateWithGitHub } from '$server/auth/github-oauth';
import { setSessionCookie } from '$server/auth/session';
import { env } from '$env/dynamic/private';

export const GET: RequestHandler = async (event) => {
	const code = event.url.searchParams.get('code');

	if (!code) {
		return json({ message: 'No authorization code provided' }, { status: 400 });
	}

	const clientId = env.KLIMCODE_GITHUB_CLIENT_ID;
	const clientSecret = env.KLIMCODE_GITHUB_CLIENT_SECRET;

	if (!clientId || !clientSecret) {
		return json({ message: 'GitHub OAuth not configured' }, { status: 500 });
	}

	try {
		const { user, session } = await authenticateWithGitHub(code, clientId, clientSecret);
		setSessionCookie(event, session);
		throw redirect(302, '/github');
	} catch (error) {
		if (error instanceof Response) throw error;
		// Check if it's a redirect
		if (error && typeof error === 'object' && 'status' in error) throw error;

		return json(
			{ message: `GitHub authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}` },
			{ status: 500 }
		);
	}
};
