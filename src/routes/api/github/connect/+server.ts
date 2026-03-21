import { redirect, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getGitHubAuthUrl } from '$server/auth/github-oauth';
import { env } from '$env/dynamic/private';

export const GET: RequestHandler = async ({ url }) => {
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
	const authUrl = getGitHubAuthUrl(clientId, redirectUri, state);

	console.log('[KlimCode] GitHub OAuth redirect:', { clientId: clientId.slice(0, 4) + '...', redirectUri });

	throw redirect(302, authUrl);
};
