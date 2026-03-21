import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { logout, clearSessionCookie } from '$server/auth/session';

export const POST: RequestHandler = async (event) => {
	const token = event.cookies.get('klimcode_session');
	if (token) {
		await logout(token);
	}
	clearSessionCookie(event);
	return json({ success: true });
};
