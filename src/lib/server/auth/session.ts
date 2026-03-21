import { v4 as uuid } from 'uuid';
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
	const existing = getUserByUsername(username);
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
	const user = createUser(username, displayName || username, passwordHash);
	const session = createSession(user.id);

	return { user, session };
}

export async function login(username: string, password: string): Promise<{ user: User; session: Session }> {
	const user = getUserByUsername(username);
	if (!user) {
		throw new AuthError('Invalid username or password', 'INVALID_CREDENTIALS');
	}

	const hash = getPasswordHash(user.id);
	if (!hash) {
		throw new AuthError('Invalid username or password', 'INVALID_CREDENTIALS');
	}

	const valid = await bcrypt.compare(password, hash);
	if (!valid) {
		throw new AuthError('Invalid username or password', 'INVALID_CREDENTIALS');
	}

	const session = createSession(user.id);
	return { user, session };
}

export function logout(token: string): void {
	deleteSession(token);
}

export function getSessionFromRequest(event: RequestEvent): { user: User; session: Session } | null {
	const token = event.cookies.get(SESSION_COOKIE);
	if (!token) return null;

	const session = getSessionByToken(token);
	if (!session) return null;

	const user = getUserById(session.userId);
	if (!user) return null;

	return { user, session };
}

export function setSessionCookie(event: RequestEvent, session: Session): void {
	event.cookies.set(SESSION_COOKIE, session.token, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: false, // Set to true in production with HTTPS
		maxAge: 30 * 24 * 60 * 60 // 30 days
	});
}

export function clearSessionCookie(event: RequestEvent): void {
	event.cookies.delete(SESSION_COOKIE, { path: '/' });
}

export function requireAuth(event: RequestEvent): { user: User; session: Session } {
	const result = getSessionFromRequest(event);
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
