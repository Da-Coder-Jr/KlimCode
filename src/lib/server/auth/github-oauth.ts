import { v4 as uuid } from 'uuid';
import type { User, Session } from '$types/core';
import {
	getUserByGithubId,
	createUser,
	updateUserGithub,
	createSession
} from '$server/db/queries';

const GITHUB_AUTHORIZE_URL = 'https://github.com/login/oauth/authorize';
const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token';
const GITHUB_USER_URL = 'https://api.github.com/user';

interface GitHubUserInfo {
	id: number;
	login: string;
	name: string | null;
	avatar_url: string;
	email: string | null;
}

export function getGitHubAuthUrl(clientId: string, redirectUri: string, state?: string): string {
	const params = new URLSearchParams({
		client_id: clientId,
		redirect_uri: redirectUri,
		scope: 'repo read:user user:email',
		state: state || uuid()
	});

	return `${GITHUB_AUTHORIZE_URL}?${params.toString()}`;
}

export async function exchangeGitHubCode(
	code: string,
	clientId: string,
	clientSecret: string
): Promise<string> {
	const response = await fetch(GITHUB_TOKEN_URL, {
		method: 'POST',
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			client_id: clientId,
			client_secret: clientSecret,
			code
		})
	});

	if (!response.ok) {
		throw new Error(`GitHub token exchange failed: ${response.status}`);
	}

	const data = await response.json();

	if (data.error) {
		throw new Error(`GitHub OAuth error: ${data.error_description || data.error}`);
	}

	return data.access_token;
}

export async function getGitHubUser(accessToken: string): Promise<GitHubUserInfo> {
	const response = await fetch(GITHUB_USER_URL, {
		headers: {
			Authorization: `Bearer ${accessToken}`,
			Accept: 'application/vnd.github.v3+json'
		}
	});

	if (!response.ok) {
		throw new Error(`GitHub user API failed: ${response.status}`);
	}

	return response.json();
}

export async function authenticateWithGitHub(
	code: string,
	clientId: string,
	clientSecret: string
): Promise<{ user: User; session: Session; isNew: boolean }> {
	const accessToken = await exchangeGitHubCode(code, clientId, clientSecret);
	const ghUser = await getGitHubUser(accessToken);
	const githubId = String(ghUser.id);

	let user = getUserByGithubId(githubId);
	let isNew = false;

	if (!user) {
		// Create new user from GitHub
		user = createUser(
			ghUser.login,
			ghUser.name || ghUser.login
		);
		isNew = true;
	}

	// Update GitHub details (token may have changed)
	updateUserGithub(user.id, githubId, accessToken, ghUser.avatar_url);
	user = { ...user, githubId, githubToken: accessToken, avatarUrl: ghUser.avatar_url };

	const session = createSession(user.id);

	return { user, session, isNew };
}

export async function fetchUserRepos(accessToken: string): Promise<Array<{
	id: number;
	full_name: string;
	name: string;
	owner: { login: string };
	description: string | null;
	default_branch: string;
	private: boolean;
	clone_url: string;
	html_url: string;
}>> {
	const repos: Array<Record<string, unknown>> = [];
	let page = 1;
	const perPage = 100;

	while (true) {
		const response = await fetch(
			`https://api.github.com/user/repos?per_page=${perPage}&page=${page}&sort=updated&affiliation=owner,collaborator`,
			{
				headers: {
					Authorization: `Bearer ${accessToken}`,
					Accept: 'application/vnd.github.v3+json'
				}
			}
		);

		if (!response.ok) break;

		const data = await response.json();
		if (!Array.isArray(data) || data.length === 0) break;

		repos.push(...data);
		if (data.length < perPage) break;
		page++;

		// Safety limit
		if (page > 10) break;
	}

	return repos as Array<{
		id: number;
		full_name: string;
		name: string;
		owner: { login: string };
		description: string | null;
		default_branch: string;
		private: boolean;
		clone_url: string;
		html_url: string;
	}>;
}
