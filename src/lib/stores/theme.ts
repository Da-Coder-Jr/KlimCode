import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';

export type ThemePreference = 'light' | 'dark' | 'system';

function getStoredTheme(): ThemePreference {
	if (!browser) return 'system';
	const stored = localStorage.getItem('klimcode_theme');
	if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
	return 'system';
}

function getSystemTheme(): 'light' | 'dark' {
	if (!browser) return 'light';
	return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export const themePreference = writable<ThemePreference>(getStoredTheme());

export const resolvedTheme = derived(themePreference, ($pref) => {
	if ($pref === 'system') return getSystemTheme();
	return $pref;
});

export function setTheme(theme: ThemePreference) {
	themePreference.set(theme);
	if (browser) {
		localStorage.setItem('klimcode_theme', theme);
		applyTheme(theme === 'system' ? getSystemTheme() : theme);
	}
}

export function applyTheme(resolved: 'light' | 'dark') {
	if (!browser) return;
	const root = document.documentElement;
	if (resolved === 'dark') {
		root.classList.add('dark');
	} else {
		root.classList.remove('dark');
	}
	// Update meta theme-color
	const meta = document.querySelector('meta[name="theme-color"]');
	if (meta) {
		meta.setAttribute('content', resolved === 'dark' ? '#0a0a0b' : '#ffffff');
	}
	const schemeMeta = document.querySelector('meta[name="color-scheme"]');
	if (schemeMeta) {
		schemeMeta.setAttribute('content', resolved);
	}
}

export function initTheme() {
	if (!browser) return;
	const pref = getStoredTheme();
	const resolved = pref === 'system' ? getSystemTheme() : pref;
	applyTheme(resolved);

	// Listen for system theme changes
	const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
	mediaQuery.addEventListener('change', (e) => {
		const currentPref = localStorage.getItem('klimcode_theme') || 'system';
		if (currentPref === 'system') {
			applyTheme(e.matches ? 'dark' : 'light');
			// Force reactivity
			themePreference.set('system');
		}
	});
}
