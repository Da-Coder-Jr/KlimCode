import { writable, get } from 'svelte/store';
import type { AppSettings } from '$types/core';

const DEFAULT_SETTINGS: AppSettings = {
	nvidiaApiKey: '',
	defaultModel: 'meta/llama-3.3-70b-instruct',
	theme: 'dark',
	github: {
		connected: false
	},
	agent: {
		autoApproveReads: true,
		autoApproveCommands: false,
		sandboxTimeout: 30000,
		maxFileSize: 1048576
	}
};

export const settings = writable<AppSettings>(DEFAULT_SETTINGS);
export const settingsLoaded = writable(false);

export async function loadSettings(): Promise<void> {
	try {
		const res = await fetch('/api/settings');
		if (res.ok) {
			const data = await res.json();
			settings.set({ ...DEFAULT_SETTINGS, ...data });
		}
	} catch {
		// Use defaults
	}
	settingsLoaded.set(true);
}

export async function saveSettings(updates: Partial<AppSettings>): Promise<boolean> {
	try {
		const current = get(settings);
		const merged = { ...current, ...updates };

		const res = await fetch('/api/settings', {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(merged)
		});

		if (res.ok) {
			settings.set(merged);
			return true;
		}
		return false;
	} catch {
		return false;
	}
}

export async function saveApiKey(apiKey: string): Promise<boolean> {
	try {
		const res = await fetch('/api/settings/api-key', {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ apiKey })
		});

		if (res.ok) {
			settings.update((s) => ({ ...s, nvidiaApiKey: apiKey }));
			return true;
		}
		return false;
	} catch {
		return false;
	}
}

export async function testApiKey(apiKey: string): Promise<{ success: boolean; message: string }> {
	try {
		const res = await fetch('/api/settings/test-key', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ apiKey })
		});

		return await res.json();
	} catch {
		return { success: false, message: 'Network error' };
	}
}
