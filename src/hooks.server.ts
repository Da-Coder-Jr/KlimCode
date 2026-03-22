import type { Handle } from '@sveltejs/kit';
import { getSessionFromRequest } from '$server/auth/session';
import { ensureDb } from '$server/db/index';

// Initialize database tables on first request
let dbReady = false;

// Simple in-memory rate limiter for auth endpoints
const authAttempts = new Map<string, { count: number; resetAt: number }>();
const AUTH_RATE_LIMIT = 10; // max attempts per window
const AUTH_RATE_WINDOW = 60_000; // 1 minute

function isRateLimited(ip: string): boolean {
	const now = Date.now();
	const entry = authAttempts.get(ip);
	if (!entry || now > entry.resetAt) {
		authAttempts.set(ip, { count: 1, resetAt: now + AUTH_RATE_WINDOW });
		return false;
	}
	entry.count++;
	return entry.count > AUTH_RATE_LIMIT;
}

// Periodically clean up expired entries
setInterval(() => {
	const now = Date.now();
	for (const [ip, entry] of authAttempts) {
		if (now > entry.resetAt) authAttempts.delete(ip);
	}
}, 60_000);

export const handle: Handle = async ({ event, resolve }) => {
	// Ensure database is initialized
	if (!dbReady) {
		try {
			await ensureDb();
			dbReady = true;
		} catch (err) {
			console.error('[KlimCode] Database initialization failed:', err);
		}
	}

	// Rate limit auth endpoints
	const path = event.url.pathname;
	if (path.startsWith('/api/auth/login') || path.startsWith('/api/auth/register')) {
		const ip = event.getClientAddress();
		if (isRateLimited(ip)) {
			return new Response(JSON.stringify({ message: 'Too many requests. Please try again later.' }), {
				status: 429,
				headers: { 'Content-Type': 'application/json', 'Retry-After': '60' }
			});
		}
	}

	// Authenticate session
	try {
		const session = await getSessionFromRequest(event);
		if (session) {
			event.locals.user = session.user;
			event.locals.session = session.session;
		}
	} catch (err) {
		console.error('[KlimCode] Session auth error:', err);
		event.cookies.delete('klimcode_session', { path: '/' });
	}

	const response = await resolve(event);

	// Add security headers
	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('X-Frame-Options', 'DENY');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

	// Prevent sensitive API data from being cached
	if (path.startsWith('/api/')) {
		response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
		response.headers.set('Pragma', 'no-cache');
	}

	return response;
};
