import type { Handle } from '@sveltejs/kit';
import { getSessionFromRequest } from '$server/auth/session';
import { ensureDb } from '$server/db/index';

// Initialize database tables on first request
let dbReady = false;

export const handle: Handle = async ({ event, resolve }) => {
	// Ensure database is initialized
	if (!dbReady) {
		try {
			await ensureDb();
			dbReady = true;
		} catch (err) {
			console.error('[KlimCode] Database initialization failed:', err);
			// Continue anyway - individual queries will retry
		}
	}

	// Authenticate session
	try {
		const session = await getSessionFromRequest(event);
		if (session) {
			event.locals.user = session.user;
			event.locals.session = session.session;
		}
	} catch (err) {
		console.error('[KlimCode] Session auth error:', err);
		// Clear potentially corrupted session cookie
		event.cookies.delete('klimcode_session', { path: '/' });
	}

	const response = await resolve(event);
	return response;
};
