import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { fetchUserRepos } from '$server/auth/github-oauth';
import { saveGithubRepo, getUserGithubRepos } from '$server/db/queries';

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) return json({ repos: [] }, { status: 401 });

	if (!locals.user.githubToken) {
		const cached = await getUserGithubRepos(locals.user.id);
		return json({
			repos: cached.map((r) => ({
				...r, fullName: r.full_name, defaultBranch: r.default_branch,
				isPrivate: r.is_private, cloneUrl: r.clone_url,
				id: 0, url: `https://github.com/${r.full_name}`
			}))
		});
	}

	try {
		const ghRepos = await fetchUserRepos(locals.user.githubToken);
		const repos = (ghRepos as Array<Record<string, unknown>>).map((r: Record<string, unknown>) => ({
			id: r.id, fullName: r.full_name as string, name: r.name as string,
			owner: (r.owner as { login: string }).login,
			description: r.description as string | null,
			defaultBranch: r.default_branch as string,
			isPrivate: r.private as boolean,
			url: r.html_url as string, cloneUrl: r.clone_url as string
		}));

		for (const repo of repos.slice(0, 50)) {
			await saveGithubRepo(locals.user.id, {
				fullName: repo.fullName, name: repo.name, owner: repo.owner,
				description: repo.description || undefined,
				defaultBranch: repo.defaultBranch,
				isPrivate: repo.isPrivate, cloneUrl: repo.cloneUrl
			});
		}

		return json({ repos });
	} catch (error) {
		return json({ repos: [], error: error instanceof Error ? error.message : 'Failed to fetch repos' });
	}
};
