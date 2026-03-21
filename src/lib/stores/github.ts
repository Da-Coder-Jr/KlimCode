import { writable, get } from 'svelte/store';
import type { GitHubRepo, GitHubPR } from '$types/core';

export const githubConnected = writable(false);
export const githubUsername = writable<string | null>(null);
export const githubRepos = writable<GitHubRepo[]>([]);
export const selectedRepo = writable<GitHubRepo | null>(null);
export const pullRequests = writable<GitHubPR[]>([]);
export const reposLoading = writable(false);
export const prsLoading = writable(false);

export async function checkGitHubConnection(): Promise<void> {
	try {
		const res = await fetch('/api/github/status');
		if (res.ok) {
			const data = await res.json();
			githubConnected.set(data.connected);
			githubUsername.set(data.username || null);
		}
	} catch {
		githubConnected.set(false);
	}
}

export async function loadRepos(): Promise<void> {
	reposLoading.set(true);
	try {
		const res = await fetch('/api/github/repos');
		if (res.ok) {
			const data = await res.json();
			githubRepos.set(data.repos);
		}
	} catch {
		// ignore
	} finally {
		reposLoading.set(false);
	}
}

export async function selectRepo(repo: GitHubRepo): Promise<void> {
	selectedRepo.set(repo);
	await loadPullRequests(repo.owner, repo.name);
}

export async function loadPullRequests(owner: string, repo: string): Promise<void> {
	prsLoading.set(true);
	try {
		const res = await fetch(`/api/github/pr?owner=${owner}&repo=${repo}`);
		if (res.ok) {
			const data = await res.json();
			pullRequests.set(data.pullRequests);
		}
	} catch {
		// ignore
	} finally {
		prsLoading.set(false);
	}
}

export async function mergePR(
	owner: string,
	repo: string,
	prNumber: number,
	method: 'merge' | 'squash' | 'rebase' = 'squash'
): Promise<{ success: boolean; message: string }> {
	try {
		const res = await fetch(`/api/github/pr/merge`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ owner, repo, prNumber, method })
		});

		const data = await res.json();
		if (res.ok && data.merged) {
			// Refresh PRs
			await loadPullRequests(owner, repo);
			return { success: true, message: 'PR merged successfully' };
		}
		return { success: false, message: data.message || 'Failed to merge' };
	} catch {
		return { success: false, message: 'Network error' };
	}
}

export function getConnectUrl(): string {
	return '/api/github/connect';
}

export async function disconnectGitHub(): Promise<void> {
	try {
		await fetch('/api/github/disconnect', { method: 'POST' });
		githubConnected.set(false);
		githubUsername.set(null);
		githubRepos.set([]);
		selectedRepo.set(null);
		pullRequests.set([]);
	} catch {
		// ignore
	}
}
