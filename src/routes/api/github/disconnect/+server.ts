import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { query } from '$server/db/index';

export const POST: RequestHandler = async ({ locals }) => {
	if (!locals.user) return json({ message: 'Not authenticated' }, { status: 401 });
	await query('UPDATE users SET github_id = NULL, github_token = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = $1', [locals.user.id]);
	return json({ success: true });
};
