import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { register, setSessionCookie, AuthError } from '$server/auth/session';

export const POST: RequestHandler = async (event) => {
	try {
		const { username, password, displayName } = await event.request.json();
		if (!username || !password) {
			return json({ message: 'Username and password are required' }, { status: 400 });
		}

		const { user, session } = await register(username, password, displayName);
		setSessionCookie(event, session);
		return json({ user: { id: user.id, username: user.username, displayName: user.displayName } });
	} catch (error) {
		if (error instanceof AuthError) {
			return json({ message: error.message, code: error.code }, { status: 400 });
		}
		return json({ message: 'Registration failed' }, { status: 500 });
	}
};
