import { writable, get } from 'svelte/store';
import type { User } from '$types/core';

export const currentUser = writable<User | null>(null);
export const authLoading = writable(true);
export const authError = writable<string | null>(null);

export async function checkAuth(): Promise<User | null> {
	authLoading.set(true);
	try {
		const res = await fetch('/api/auth/me');
		if (res.ok) {
			const data = await res.json();
			currentUser.set(data.user);
			return data.user;
		}
		currentUser.set(null);
		return null;
	} catch {
		currentUser.set(null);
		return null;
	} finally {
		authLoading.set(false);
	}
}

export async function login(username: string, password: string): Promise<boolean> {
	authError.set(null);
	try {
		const res = await fetch('/api/auth/login', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ username, password })
		});

		if (res.ok) {
			const data = await res.json();
			currentUser.set(data.user);
			return true;
		}

		const err = await res.json().catch(() => ({ message: 'Login failed' }));
		authError.set(err.message);
		return false;
	} catch {
		authError.set('Network error');
		return false;
	}
}

export async function register(username: string, password: string, displayName?: string): Promise<boolean> {
	authError.set(null);
	try {
		const res = await fetch('/api/auth/register', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ username, password, displayName })
		});

		if (res.ok) {
			const data = await res.json();
			currentUser.set(data.user);
			return true;
		}

		const err = await res.json().catch(() => ({ message: 'Registration failed' }));
		authError.set(err.message);
		return false;
	} catch {
		authError.set('Network error');
		return false;
	}
}

export async function logout(): Promise<void> {
	try {
		await fetch('/api/auth/logout', { method: 'POST' });
	} catch {
		// ignore
	}
	currentUser.set(null);
}
