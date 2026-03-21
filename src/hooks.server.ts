import type { Handle } from '@sveltejs/kit';
import { getSessionFromRequest } from '$server/auth/session';

export const handle: Handle = async ({ event, resolve }) => {
	// Attach user to locals if authenticated
	const session = getSessionFromRequest(event);
	if (session) {
		event.locals.user = session.user;
		event.locals.session = session.session;
	}

	const response = await resolve(event);
	return response;
};
