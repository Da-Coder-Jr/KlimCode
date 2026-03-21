import bcrypt from 'bcryptjs';
import type { RequestEvent } from '@sveltejs/kit';
import type { User, Session } from '$types/core';
import {
	createUser,
	getUserById,
	getUserByUsername,
	getPasswordHash,
	createSession,
	getSessionByToken,
	deleteSession
} from '$server/db/queries';

const SESSION_COOKIE = 'klimcode_session';
const SALT_ROUNDS = 10;

export async function register(username: string, password: string, displayName?: string): Promise<{ user: User; session: Session }> {
	const existing = await getUserByUsername(username);
	if (existing) {
		throw new AuthError('Username already taken', 'USERNAME_EXISTS');
	}

	if (username.length < 3 || username.length > 32) {
		throw new AuthError('Username must be 3-32 characters', 'INVALID_USERNAME');
	}

	if (password.length < 6) {
		throw new AuthError('Password must be at least 6 characters', 'WEAK_PASSWORD');
	}

	const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
	const user = await createUser(username, displayName || username, passwordHash);
	const session = await createSession(user.id);

	return { user, session };
}

export async function login(username: string, password: string): Promise<{ user: User; session: Session }> {
	const user = await getUserByUsername(username);
	if (!user) {
		throw new AuthError('Invalid username or password', 'INVALID_CREDENTIALS');
	}

	const hash = await getPasswordHash(user.id);
	if (!hash) {
		throw new AuthError('Invalid username or password', 'INVALID_CREDENTIALS');
	}

	const valid = await bcrypt.compare(password, hash);
	if (!valid) {
		throw new AuthError('Invalid username or password', 'INVALID_CREDENTIALS');
	}

	const session = await createSession(user.id);
	return { user, session };
}

export async function logout(token: string): Promise<void> {
	await deleteSession(token);
}

export async function getSessionFromRequest(event: RequestEvent): Promise<{ user: User; session: Session } | null> {
	const token = event.cookies.get(SESSION_COOKIE);
	if (!token) return null;

	const session = await getSessionByToken(token);
	if (!session) return null;

	const user = await getUserById(session.userId);
	if (!user) return null;

	return { user, session };
}

export function setSessionCookie(event: RequestEvent, session: Session): void {
	event.cookies.set(SESSION_COOKIE, session.token, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: true,
		maxAge: 30 * 24 * 60 * 60
	});
}

export function clearSessionCookie(event: RequestEvent): void {
	event.cookies.delete(SESSION_COOKIE, { path: '/' });
}

export async function requireAuth(event: RequestEvent): Promise<{ user: User; session: Session }> {
	const result = await getSessionFromRequest(event);
	if (!result) {
		throw new AuthError('Not authenticated', 'NOT_AUTHENTICATED');
	}
	return result;
}

export class AuthError extends Error {
	code: string;
	constructor(message: string, code: string) {
		super(message);
		this.name = 'AuthError';
		this.code = code;
	}
}
