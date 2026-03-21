import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDb } from '$server/db/index';

export const POST: RequestHandler = async ({ locals }) => {
	if (!locals.user) return json({ message: 'Not authenticated' }, { status: 401 });

	const db = getDb();
	db.prepare(
		"UPDATE users SET github_id = NULL, github_token = NULL, updated_at = datetime('now') WHERE id = ?"
	).run(locals.user.id);

	return json({ success: true });
};
