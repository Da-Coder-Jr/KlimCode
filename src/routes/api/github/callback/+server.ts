import { redirect, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { authenticateWithGitHub } from '$server/auth/github-oauth';
import { setSessionCookie } from '$server/auth/session';
import { env } from '$env/dynamic/private';

export const GET: RequestHandler = async (event) => {
	const code = event.url.searchParams.get('code');
	if (!code) return json({ message: 'No authorization code' }, { status: 400 });

	const clientId = env.GITHUB_CLIENT_ID;
	const clientSecret = env.GITHUB_CLIENT_SECRET;
	if (!clientId || !clientSecret) return json({ message: 'GitHub OAuth not configured' }, { status: 500 });

	try {
		const { user, session } = await authenticateWithGitHub(code, clientId, clientSecret);
		setSessionCookie(event, session);
		throw redirect(302, '/github');
	} catch (error) {
		if (error && typeof error === 'object' && 'status' in error) throw error;
		return json({ message: `GitHub auth failed: ${error instanceof Error ? error.message : 'Unknown'}` }, { status: 500 });
	}
};
