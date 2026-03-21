import type { Handle } from '@sveltejs/kit';
import { getSessionFromRequest } from '$server/auth/session';

export const handle: Handle = async ({ event, resolve }) => {
	// Skip auth check for static assets
	if (event.url.pathname.startsWith('/_app/') || event.url.pathname.startsWith('/favicon')) {
		return resolve(event);
	}

	try {
		const session = await getSessionFromRequest(event);
		if (session) {
			event.locals.user = session.user;
			event.locals.session = session.session;
		}
	} catch (error) {
		// Log but don't crash on auth errors (e.g., DB cold start)
		console.error('Auth check failed:', error);
	}

	const response = await resolve(event);

	// Security headers
	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('X-Frame-Options', 'DENY');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

	return response;
};
