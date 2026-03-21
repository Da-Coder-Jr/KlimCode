import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { authenticateWithGitHub } from '$server/auth/github-oauth';
import { setSessionCookie } from '$server/auth/session';
import { env } from '$env/dynamic/private';

export const GET: RequestHandler = async (event) => {
	const code = event.url.searchParams.get('code');
	if (!code) {
		return new Response(null, {
			status: 302,
			headers: { Location: '/?error=no_code' }
		});
	}

	const clientId = env.GITHUB_CLIENT_ID;
	const clientSecret = env.GITHUB_CLIENT_SECRET;
	if (!clientId || !clientSecret) {
		return json({ message: 'GitHub OAuth not configured on server' }, { status: 500 });
	}

	try {
		const { user, session } = await authenticateWithGitHub(code, clientId, clientSecret);
		setSessionCookie(event, session);

		// Use direct Response redirect instead of throw redirect
		return new Response(null, {
			status: 302,
			headers: {
				Location: '/',
				'Cache-Control': 'no-store'
			}
		});
	} catch (error) {
		// Don't catch redirect errors
		if (error && typeof error === 'object' && 'status' in error && (error as { status: number }).status >= 300 && (error as { status: number }).status < 400) {
			throw error;
		}

		console.error('GitHub auth failed:', error);

		// Redirect back to login with error message instead of JSON error
		return new Response(null, {
			status: 302,
			headers: {
				Location: '/?error=github_auth_failed'
			}
		});
	}
};
