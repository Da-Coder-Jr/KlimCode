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
const SALT_ROUNDS = 12;

export async function register(username: string, password: string, displayName?: string): Promise<{ user: User; session: Session }> {
	// Sanitize username
	const cleanUsername = username.trim().toLowerCase();

	if (cleanUsername.length < 3 || cleanUsername.length > 32) {
		throw new AuthError('Username must be 3-32 characters', 'INVALID_USERNAME');
	}

	if (!/^[a-z0-9_-]+$/.test(cleanUsername)) {
		throw new AuthError('Username can only contain letters, numbers, hyphens, and underscores', 'INVALID_USERNAME');
	}

	if (password.length < 8) {
		throw new AuthError('Password must be at least 8 characters', 'WEAK_PASSWORD');
	}

	const existing = await getUserByUsername(cleanUsername);
	if (existing) {
		throw new AuthError('Username already taken', 'USERNAME_EXISTS');
	}

	const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
	const user = await createUser(cleanUsername, displayName?.trim() || cleanUsername, passwordHash);
	const session = await createSession(user.id);

	return { user, session };
}

export async function login(username: string, password: string): Promise<{ user: User; session: Session }> {
	const cleanUsername = username.trim().toLowerCase();

	const user = await getUserByUsername(cleanUsername);
	if (!user) {
		// Constant-time delay to prevent username enumeration
		await bcrypt.hash('dummy', SALT_ROUNDS);
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

	// Basic token format validation
	if (token.length < 30 || token.length > 200) return null;

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
