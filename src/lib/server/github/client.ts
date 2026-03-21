import type { GitHubRepo, GitHubPR } from '$types/core';

const GITHUB_API = 'https://api.github.com';

async function githubFetch(path: string, token: string, options?: RequestInit): Promise<Response> {
	const response = await fetch(`${GITHUB_API}${path}`, {
		...options,
		headers: {
			Authorization: `Bearer ${token}`,
			Accept: 'application/vnd.github.v3+json',
			'Content-Type': 'application/json',
			...options?.headers
		}
	});

	if (!response.ok) {
		const body = await response.text();
		throw new GitHubAPIError(`GitHub API error: ${response.status}`, response.status, body);
	}

	return response;
}

export async function getRepo(token: string, owner: string, repo: string): Promise<GitHubRepo> {
	const response = await githubFetch(`/repos/${owner}/${repo}`, token);
	const data = await response.json();

	return {
		id: data.id,
		fullName: data.full_name,
		name: data.name,
		owner: data.owner.login,
		description: data.description,
		defaultBranch: data.default_branch,
		isPrivate: data.private,
		url: data.html_url,
		cloneUrl: data.clone_url
	};
}

export async function getRepoBranches(token: string, owner: string, repo: string): Promise<string[]> {
	const response = await githubFetch(`/repos/${owner}/${repo}/branches?per_page=100`, token);
	const data = await response.json();
	return data.map((b: { name: string }) => b.name);
}

export async function getRepoFiles(
	token: string,
	owner: string,
	repo: string,
	path = '',
	ref = 'main'
): Promise<Array<{ name: string; path: string; type: 'file' | 'dir'; size?: number }>> {
	const response = await githubFetch(
		`/repos/${owner}/${repo}/contents/${path}?ref=${ref}`,
		token
	);
	const data = await response.json();

	if (!Array.isArray(data)) {
		return [{ name: data.name, path: data.path, type: 'file', size: data.size }];
	}

	return data.map((item: { name: string; path: string; type: string; size?: number }) => ({
		name: item.name,
		path: item.path,
		type: item.type === 'dir' ? 'dir' : 'file',
		size: item.size
	}));
}

export async function getFileContent(
	token: string,
	owner: string,
	repo: string,
	path: string,
	ref = 'main'
): Promise<string> {
	const response = await githubFetch(
		`/repos/${owner}/${repo}/contents/${path}?ref=${ref}`,
		token
	);
	const data = await response.json();

	if (data.encoding === 'base64') {
		return Buffer.from(data.content, 'base64').toString('utf-8');
	}

	return data.content;
}

export async function createPullRequest(
	token: string,
	owner: string,
	repo: string,
	params: {
		title: string;
		body: string;
		head: string;
		base: string;
		draft?: boolean;
	}
): Promise<GitHubPR> {
	const response = await githubFetch(`/repos/${owner}/${repo}/pulls`, token, {
		method: 'POST',
		body: JSON.stringify(params)
	});
	const data = await response.json();

	return mapPR(data);
}

export async function listPullRequests(
	token: string,
	owner: string,
	repo: string,
	state: 'open' | 'closed' | 'all' = 'open'
): Promise<GitHubPR[]> {
	const response = await githubFetch(
		`/repos/${owner}/${repo}/pulls?state=${state}&per_page=30&sort=updated`,
		token
	);
	const data = await response.json();
	return data.map(mapPR);
}

export async function getPullRequest(
	token: string,
	owner: string,
	repo: string,
	prNumber: number
): Promise<GitHubPR> {
	const response = await githubFetch(`/repos/${owner}/${repo}/pulls/${prNumber}`, token);
	const data = await response.json();
	return mapPR(data);
}

export async function mergePullRequest(
	token: string,
	owner: string,
	repo: string,
	prNumber: number,
	method: 'merge' | 'squash' | 'rebase' = 'squash'
): Promise<{ merged: boolean; message: string }> {
	const response = await githubFetch(`/repos/${owner}/${repo}/pulls/${prNumber}/merge`, token, {
		method: 'PUT',
		body: JSON.stringify({ merge_method: method })
	});
	const data = await response.json();
	return { merged: data.merged, message: data.message };
}

export async function createBranch(
	token: string,
	owner: string,
	repo: string,
	branchName: string,
	fromRef: string
): Promise<void> {
	// Get the SHA of the source ref
	const refResponse = await githubFetch(`/repos/${owner}/${repo}/git/ref/heads/${fromRef}`, token);
	const refData = await refResponse.json();
	const sha = refData.object.sha;

	// Create new branch
	await githubFetch(`/repos/${owner}/${repo}/git/refs`, token, {
		method: 'POST',
		body: JSON.stringify({
			ref: `refs/heads/${branchName}`,
			sha
		})
	});
}

export async function createOrUpdateFile(
	token: string,
	owner: string,
	repo: string,
	path: string,
	content: string,
	message: string,
	branch: string,
	sha?: string
): Promise<void> {
	const body: Record<string, unknown> = {
		message,
		content: Buffer.from(content).toString('base64'),
		branch
	};

	if (sha) {
		body.sha = sha;
	}

	await githubFetch(`/repos/${owner}/${repo}/contents/${path}`, token, {
		method: 'PUT',
		body: JSON.stringify(body)
	});
}

export async function deleteFile(
	token: string,
	owner: string,
	repo: string,
	path: string,
	message: string,
	branch: string,
	sha: string
): Promise<void> {
	await githubFetch(`/repos/${owner}/${repo}/contents/${path}`, token, {
		method: 'DELETE',
		body: JSON.stringify({ message, sha, branch })
	});
}

function mapPR(data: Record<string, unknown>): GitHubPR {
	const user = data.user as { login: string };
	const head = data.head as { ref: string };
	const base = data.base as { ref: string };

	return {
		id: data.id as number,
		number: data.number as number,
		title: data.title as string,
		body: (data.body as string) || '',
		state: data.merged_at ? 'merged' : (data.state as 'open' | 'closed'),
		author: user.login,
		branch: head.ref,
		baseBranch: base.ref,
		createdAt: data.created_at as string,
		updatedAt: data.updated_at as string,
		url: data.html_url as string,
		mergeable: data.mergeable as boolean | undefined
	};
}

export class GitHubAPIError extends Error {
	status: number;
	body: string;

	constructor(message: string, status: number, body: string) {
		super(message);
		this.name = 'GitHubAPIError';
		this.status = status;
		this.body = body;
	}
}
