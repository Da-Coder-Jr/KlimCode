import { redirect, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getGitHubAuthUrl } from '$server/auth/github-oauth';
import { env } from '$env/dynamic/private';

export const GET: RequestHandler = async ({ url }) => {
	const clientId = env.GITHUB_CLIENT_ID;
	if (!clientId) {
		return json(
			{ message: 'GitHub OAuth not configured. Set GITHUB_CLIENT_ID in Vercel environment variables.' },
			{ status: 500 }
		);
	}

	const redirectUri = `${url.origin}/api/github/callback`;
	const state = crypto.randomUUID();
	const authUrl = getGitHubAuthUrl(clientId, redirectUri, state);

	// Use 302 redirect response instead of throw to avoid SvelteKit error handling issues
	return new Response(null, {
		status: 302,
		headers: {
			Location: authUrl,
			'Cache-Control': 'no-store'
		}
	});
};
