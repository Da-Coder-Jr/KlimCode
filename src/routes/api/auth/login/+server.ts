import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { login, setSessionCookie, AuthError } from '$server/auth/session';

export const POST: RequestHandler = async (event) => {
	try {
		const { username, password } = await event.request.json();

		if (!username || !password) {
			return json({ message: 'Username and password are required' }, { status: 400 });
		}

		const { user, session } = await login(username, password);
		setSessionCookie(event, session);

		return json({
			user: {
				id: user.id,
				username: user.username,
				displayName: user.displayName,
				avatarUrl: user.avatarUrl
			}
		});
	} catch (error) {
		if (error instanceof AuthError) {
			return json({ message: error.message, code: error.code }, { status: 401 });
		}
		return json({ message: 'Login failed' }, { status: 500 });
	}
};
