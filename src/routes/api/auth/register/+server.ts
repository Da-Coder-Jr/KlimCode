import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { register, setSessionCookie, AuthError } from '$server/auth/session';

export const POST: RequestHandler = async (event) => {
	try {
		const body = await event.request.json().catch(() => null);
		if (!body) {
			return json({ message: 'Invalid request body' }, { status: 400 });
		}

		const { username, password, displayName } = body;
		if (!username || !password || typeof username !== 'string' || typeof password !== 'string') {
			return json({ message: 'Username and password are required' }, { status: 400 });
		}

		if (username.length > 100 || password.length > 200) {
			return json({ message: 'Input too long' }, { status: 400 });
		}

		if (displayName && (typeof displayName !== 'string' || displayName.length > 100)) {
			return json({ message: 'Display name too long' }, { status: 400 });
		}

		const { user, session } = await register(username, password, displayName);
		setSessionCookie(event, session);
		return json({
			user: {
				id: user.id,
				username: user.username,
				displayName: user.displayName,
				githubId: user.githubId
			}
		});
	} catch (error) {
		if (error instanceof AuthError) {
			return json({ message: error.message, code: error.code }, { status: 400 });
		}
		console.error('Registration error:', error);
		return json({ message: 'Registration failed. Please try again.' }, { status: 500 });
	}
};
