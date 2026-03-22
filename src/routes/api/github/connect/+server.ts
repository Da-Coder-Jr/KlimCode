import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getGitHubAuthUrl } from '$server/auth/github-oauth';
import { env } from '$env/dynamic/private';

export const GET: RequestHandler = async ({ url, cookies }) => {
	const clientId = env.GITHUB_CLIENT_ID;

	if (!clientId) {
		console.error('[KlimCode] GitHub OAuth not configured: GITHUB_CLIENT_ID is not set');
		return new Response(
			JSON.stringify({
				error: 'GitHub OAuth not configured',
				message: 'The GITHUB_CLIENT_ID environment variable is not set. Please configure it in your Vercel project settings.'
			}),
			{
				status: 500,
				headers: { 'Content-Type': 'application/json' }
			}
		);
	}

	const redirectUri = `${url.origin}/api/github/callback`;
	const state = crypto.randomUUID();

	// Store state in a secure cookie for CSRF validation on callback
	cookies.set('klimcode_oauth_state', state, {
		path: '/',
		httpOnly: true,
		secure: true,
		sameSite: 'lax',
		maxAge: 600 // 10 minutes - enough time for OAuth flow
	});

	const authUrl = getGitHubAuthUrl(clientId, redirectUri, state);
	throw redirect(302, authUrl);
};
