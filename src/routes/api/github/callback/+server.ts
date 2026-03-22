import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { authenticateWithGitHub } from '$server/auth/github-oauth';
import { setSessionCookie } from '$server/auth/session';
import { env } from '$env/dynamic/private';

export const GET: RequestHandler = async (event) => {
	const code = event.url.searchParams.get('code');
	const state = event.url.searchParams.get('state');
	const error = event.url.searchParams.get('error');

	// Handle GitHub OAuth errors (user denied, etc.)
	if (error) {
		console.error('[KlimCode] GitHub OAuth error:', error, event.url.searchParams.get('error_description'));
		throw redirect(302, '/?error=github_denied');
	}

	if (!code) {
		console.error('[KlimCode] GitHub callback: no authorization code');
		throw redirect(302, '/?error=no_code');
	}

	// Validate OAuth state parameter to prevent CSRF attacks
	const storedState = event.cookies.get('klimcode_oauth_state');
	if (!state || !storedState || state !== storedState) {
		console.error('[KlimCode] GitHub OAuth state mismatch - possible CSRF attack');
		// Clear the state cookie
		event.cookies.delete('klimcode_oauth_state', { path: '/' });
		throw redirect(302, '/?error=invalid_state');
	}

	// Clear the state cookie after validation
	event.cookies.delete('klimcode_oauth_state', { path: '/' });

	const clientId = env.GITHUB_CLIENT_ID;
	const clientSecret = env.GITHUB_CLIENT_SECRET;

	if (!clientId || !clientSecret) {
		console.error('[KlimCode] GitHub OAuth not configured: missing GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET');
		throw redirect(302, '/?error=oauth_not_configured');
	}

	try {
		// Pass existing user ID if user is already logged in (linking GitHub to existing account)
		const existingUserId = event.locals.user?.id;
		const { user, session } = await authenticateWithGitHub(code, clientId, clientSecret, existingUserId);
		setSessionCookie(event, session);
		console.log('[KlimCode] GitHub auth success for user:', user.username);
		throw redirect(302, '/');
	} catch (err: unknown) {
		// Re-throw SvelteKit redirects
		if (err && typeof err === 'object' && 'status' in err && 'location' in err) {
			throw err;
		}
		console.error('[KlimCode] GitHub auth failed:', err instanceof Error ? err.message : err);
		throw redirect(302, '/?error=github_auth_failed');
	}
};
