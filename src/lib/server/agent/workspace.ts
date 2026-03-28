import type { AgentStep } from '$types/core';

/**
 * Serverless workspace — stores file changes in memory and commits
 * them to GitHub via the API. No local filesystem needed.
 */

export interface WorkspaceFile {
	path: string;
	content: string;
	originalContent?: string;
	status: 'added' | 'modified' | 'deleted';
}

export class Workspace {
	repoOwner: string;
	repoName: string;
	branch: string;
	baseBranch: string;
	githubToken: string;

	files: Map<string, WorkspaceFile> = new Map();
	fileCache: Map<string, string> = new Map();
	commands: Array<{ command: string; output: string; exitCode: number }> = [];

	private _defaultBranchResolved = false;

	constructor(
		repoOwner: string,
		repoName: string,
		githubToken: string,
		baseBranch = 'main'
	) {
		this.repoOwner = repoOwner;
		this.repoName = repoName;
		this.githubToken = githubToken;
		this.baseBranch = baseBranch;
		this.branch = baseBranch;
	}

	/** Auto-detect the repo's default branch from GitHub API */
	async resolveDefaultBranch(): Promise<void> {
		if (this._defaultBranchResolved) return;
		try {
			const res = await fetch(
				`https://api.github.com/repos/${this.repoOwner}/${this.repoName}`,
				{ headers: this.githubHeaders() }
			);
			if (res.ok) {
				const data = await res.json();
				if (data.default_branch) {
					this.baseBranch = data.default_branch;
					this.branch = data.default_branch;
				}
			}
		} catch {
			// Keep the provided baseBranch as fallback
		}
		this._defaultBranchResolved = true;
	}

	async readFile(path: string): Promise<string> {
		// Check local changes first
		const local = this.files.get(path);
		if (local && local.status !== 'deleted') {
			return local.content;
		}

		// Check cache
		const cached = this.fileCache.get(path);
		if (cached !== undefined) return cached;

		// Fetch from GitHub
		const response = await fetch(
			`https://api.github.com/repos/${this.repoOwner}/${this.repoName}/contents/${encodeURIComponent(path)}?ref=${this.baseBranch}`,
			{
				headers: {
					Authorization: `Bearer ${this.githubToken}`,
					Accept: 'application/vnd.github.v3+json'
				}
			}
		);

		if (!response.ok) {
			if (response.status === 404) {
				throw new WorkspaceError(`File not found: ${path}`);
			}
			throw new WorkspaceError(`Failed to read ${path}: ${response.status}`);
		}

		const data = await response.json();
		const content = Buffer.from(data.content, 'base64').toString('utf-8');
		this.fileCache.set(path, content);
		return content;
	}

	writeFile(path: string, content: string): void {
		const existing = this.fileCache.get(path);
		this.files.set(path, {
			path,
			content,
			originalContent: existing,
			status: existing !== undefined ? 'modified' : 'added'
		});
	}

	editFile(path: string, oldText: string, newText: string): void {
		const local = this.files.get(path);
		const content = local ? local.content : this.fileCache.get(path);

		if (!content) {
			throw new WorkspaceError(`File not loaded: ${path}. Read it first.`);
		}

		if (!content.includes(oldText)) {
			throw new WorkspaceError(`Text not found in ${path}`);
		}

		const newContent = content.replace(oldText, newText);
		this.writeFile(path, newContent);
	}

	deleteFile(path: string): void {
		this.files.set(path, {
			path,
			content: '',
			status: 'deleted'
		});
	}

	async searchFiles(pattern: string, searchType: 'filename' | 'content'): Promise<string[]> {
		await this.resolveDefaultBranch();
		if (searchType === 'content') {
			// Use GitHub search API
			const response = await fetch(
				`https://api.github.com/search/code?q=${encodeURIComponent(pattern)}+repo:${this.repoOwner}/${this.repoName}`,
				{
					headers: {
						Authorization: `Bearer ${this.githubToken}`,
						Accept: 'application/vnd.github.v3+json'
					}
				}
			);

			if (!response.ok) {
				const msg = await response.text().catch(() => '');
				throw new Error(`GitHub search API error ${response.status}: ${msg || response.statusText}`);
			}
			const data = await response.json();
			return (data.items || []).map((item: { path: string }) => item.path).slice(0, 50);
		}

		// For filename search, list repo contents
		const response = await fetch(
			`https://api.github.com/repos/${this.repoOwner}/${this.repoName}/git/trees/${this.baseBranch}?recursive=1`,
			{
				headers: {
					Authorization: `Bearer ${this.githubToken}`,
					Accept: 'application/vnd.github.v3+json'
				}
			}
		);

		if (!response.ok) {
			const msg = await response.text().catch(() => '');
			throw new Error(`GitHub API error ${response.status}: ${msg || response.statusText}`);
		}
		const data = await response.json();
		const tree = data.tree || [];

		const blobs = tree.filter((item: { path: string; type: string }) => item.type === 'blob');

		// Handle catch-all patterns: return all files
		if (!pattern || pattern === '*' || pattern === '**' || pattern === '**/*' || pattern === '.') {
			return blobs.map((item: { path: string }) => item.path).slice(0, 200);
		}

		const regex = new RegExp(
			pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*'),
			'i'
		);

		return blobs
			.filter((item: { path: string }) => regex.test(item.path))
			.map((item: { path: string }) => item.path)
			.slice(0, 100);
	}

	async listFiles(directory = ''): Promise<string[]> {
		await this.resolveDefaultBranch();
		const response = await fetch(
			`https://api.github.com/repos/${this.repoOwner}/${this.repoName}/git/trees/${this.baseBranch}?recursive=1`,
			{
				headers: {
					Authorization: `Bearer ${this.githubToken}`,
					Accept: 'application/vnd.github.v3+json'
				}
			}
		);

		if (!response.ok) return [];
		const data = await response.json();

		return (data.tree || [])
			.filter((item: { type: string; path: string }) =>
				item.type === 'blob' && (!directory || item.path.startsWith(directory))
			)
			.map((item: { path: string }) => item.path)
			.slice(0, 200);
	}

	getChangedFiles(): WorkspaceFile[] {
		return Array.from(this.files.values());
	}

	getDiff(): string {
		const lines: string[] = [];

		for (const file of this.files.values()) {
			lines.push(`--- a/${file.path}`);
			lines.push(`+++ b/${file.path}`);

			if (file.status === 'added') {
				for (const line of file.content.split('\n')) {
					lines.push(`+${line}`);
				}
			} else if (file.status === 'deleted') {
				for (const line of (file.originalContent || '').split('\n')) {
					lines.push(`-${line}`);
				}
			} else {
				// Simple diff for modified files
				const oldLines = (file.originalContent || '').split('\n');
				const newLines = file.content.split('\n');
				for (const line of oldLines) {
					if (!newLines.includes(line)) lines.push(`-${line}`);
				}
				for (const line of newLines) {
					if (!oldLines.includes(line)) lines.push(`+${line}`);
				}
			}
			lines.push('');
		}

		return lines.join('\n');
	}

	async createPullRequest(
		title: string,
		body: string,
		branchName: string
	): Promise<{ number: number; url: string }> {
		// Auto-detect the default branch if not already resolved
		await this.resolveDefaultBranch();

		// 1. Get the base branch SHA (initialize repo first if empty)
		let baseRef = await fetch(
			`https://api.github.com/repos/${this.repoOwner}/${this.repoName}/git/ref/heads/${this.baseBranch}`,
			{ headers: this.githubHeaders() }
		);

		if (!baseRef.ok && (baseRef.status === 404 || baseRef.status === 409)) {
			// Repository is empty — seed it with an initial commit via the Contents API
			await fetch(
				`https://api.github.com/repos/${this.repoOwner}/${this.repoName}/contents/README.md`,
				{
					method: 'PUT',
					headers: this.githubHeaders(),
					body: JSON.stringify({
						message: 'Initial commit',
						content: Buffer.from(`# ${this.repoName}\n`).toString('base64'),
						branch: this.baseBranch
					})
				}
			);
			// Re-fetch after initialization
			baseRef = await fetch(
				`https://api.github.com/repos/${this.repoOwner}/${this.repoName}/git/ref/heads/${this.baseBranch}`,
				{ headers: this.githubHeaders() }
			);
		}

		if (!baseRef.ok) {
			const errBody = await baseRef.text().catch(() => '');
			throw new WorkspaceError(`Failed to get base branch '${this.baseBranch}' (HTTP ${baseRef.status}): ${errBody}`);
		}
		const baseData = await baseRef.json();
		const baseSha = baseData.object.sha;

		// 2. Create new branch
		const createBranchRes = await fetch(
			`https://api.github.com/repos/${this.repoOwner}/${this.repoName}/git/refs`,
			{
				method: 'POST',
				headers: this.githubHeaders(),
				body: JSON.stringify({ ref: `refs/heads/${branchName}`, sha: baseSha })
			}
		);

		if (!createBranchRes.ok) {
			const err = await createBranchRes.text();
			throw new WorkspaceError(`Failed to create branch: ${err}`);
		}

		// 3. Commit files to the new branch
		for (const file of this.files.values()) {
			if (file.status === 'deleted') {
				// Get file SHA for deletion
				const fileRes = await fetch(
					`https://api.github.com/repos/${this.repoOwner}/${this.repoName}/contents/${encodeURIComponent(file.path)}?ref=${branchName}`,
					{ headers: this.githubHeaders() }
				);

				if (fileRes.ok) {
					const fileData = await fileRes.json();
					await fetch(
						`https://api.github.com/repos/${this.repoOwner}/${this.repoName}/contents/${encodeURIComponent(file.path)}`,
						{
							method: 'DELETE',
							headers: this.githubHeaders(),
							body: JSON.stringify({
								message: `Delete ${file.path}`,
								sha: fileData.sha,
								branch: branchName
							})
						}
					);
				}
			} else {
				// Create or update file
				const body: Record<string, unknown> = {
					message: `${file.status === 'added' ? 'Add' : 'Update'} ${file.path}`,
					content: Buffer.from(file.content).toString('base64'),
					branch: branchName
				};

				// If updating, we need the current SHA
				if (file.status === 'modified') {
					const fileRes = await fetch(
						`https://api.github.com/repos/${this.repoOwner}/${this.repoName}/contents/${encodeURIComponent(file.path)}?ref=${branchName}`,
						{ headers: this.githubHeaders() }
					);
					if (fileRes.ok) {
						const fileData = await fileRes.json();
						body.sha = fileData.sha;
					}
				}

				await fetch(
					`https://api.github.com/repos/${this.repoOwner}/${this.repoName}/contents/${encodeURIComponent(file.path)}`,
					{
						method: 'PUT',
						headers: this.githubHeaders(),
						body: JSON.stringify(body)
					}
				);
			}
		}

		// 4. Create the PR
		const prRes = await fetch(
			`https://api.github.com/repos/${this.repoOwner}/${this.repoName}/pulls`,
			{
				method: 'POST',
				headers: this.githubHeaders(),
				body: JSON.stringify({
					title,
					body,
					head: branchName,
					base: this.baseBranch
				})
			}
		);

		if (!prRes.ok) {
			const err = await prRes.text();
			throw new WorkspaceError(`Failed to create PR: ${err}`);
		}

		const prData = await prRes.json();
		return { number: prData.number, url: prData.html_url };
	}

	private githubHeaders() {
		return {
			Authorization: `Bearer ${this.githubToken}`,
			Accept: 'application/vnd.github.v3+json',
			'Content-Type': 'application/json'
		};
	}
}

export class WorkspaceError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'WorkspaceError';
	}
}

// Active workspaces keyed by conversationId
const activeWorkspaces = new Map<string, Workspace>();

export function getWorkspace(conversationId: string): Workspace | undefined {
	return activeWorkspaces.get(conversationId);
}

export function createWorkspace(
	conversationId: string,
	repoOwner: string,
	repoName: string,
	githubToken: string,
	baseBranch = 'main'
): Workspace {
	const existing = activeWorkspaces.get(conversationId);
	if (existing) return existing;

	const workspace = new Workspace(repoOwner, repoName, githubToken, baseBranch);
	activeWorkspaces.set(conversationId, workspace);
	return workspace;
}

export function destroyWorkspace(conversationId: string): void {
	activeWorkspaces.delete(conversationId);
}
