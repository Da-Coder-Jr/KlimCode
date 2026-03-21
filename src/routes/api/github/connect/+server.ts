import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getGitHubAuthUrl } from '$server/auth/github-oauth';
import { env } from '$env/dynamic/private';

export const GET: RequestHandler = async ({ url }) => {
	const clientId = env.KLIMCODE_GITHUB_CLIENT_ID;

	if (!clientId) {
		return new Response('GitHub OAuth not configured. Set KLIMCODE_GITHUB_CLIENT_ID in .env', {
			status: 500
		});
	}

	const redirectUri = `${url.origin}/api/github/callback`;
	const authUrl = getGitHubAuthUrl(clientId, redirectUri);

	throw redirect(302, authUrl);
};
