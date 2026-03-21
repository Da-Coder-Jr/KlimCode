import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { fetchUserRepos } from '$server/auth/github-oauth';
import { saveGithubRepo, getUserGithubRepos } from '$server/db/queries';

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) return json({ repos: [] }, { status: 401 });

	if (!locals.user.githubToken) {
		// Return cached repos if any
		const cached = getUserGithubRepos(locals.user.id);
		return json({
			repos: cached.map((r) => ({
				...r,
				id: 0,
				url: `https://github.com/${r.fullName}`
			}))
		});
	}

	try {
		const ghRepos = await fetchUserRepos(locals.user.githubToken);
		const repos = ghRepos.map((r) => ({
			id: r.id,
			fullName: r.full_name,
			name: r.name,
			owner: r.owner.login,
			description: r.description,
			defaultBranch: r.default_branch,
			isPrivate: r.private,
			url: r.html_url,
			cloneUrl: r.clone_url
		}));

		// Cache repos
		for (const repo of repos.slice(0, 50)) {
			saveGithubRepo(locals.user.id, {
				fullName: repo.fullName,
				name: repo.name,
				owner: repo.owner,
				description: repo.description || undefined,
				defaultBranch: repo.defaultBranch,
				isPrivate: repo.isPrivate,
				cloneUrl: repo.cloneUrl
			});
		}

		return json({ repos });
	} catch (error) {
		return json({
			repos: [],
			error: error instanceof Error ? error.message : 'Failed to fetch repos'
		});
	}
};
