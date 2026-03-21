<script lang="ts">
	import { onMount } from 'svelte';
	import Header from '$components/layout/Header.svelte';
	import GitHubConnect from '$components/github/GitHubConnect.svelte';
	import RepoSelector from '$components/github/RepoSelector.svelte';
	import PRList from '$components/github/PRList.svelte';
	import { githubConnected, checkGitHubConnection, selectedRepo } from '$stores/github';

	onMount(() => {
		checkGitHubConnection();
	});
</script>

<svelte:head>
	<title>GitHub — KlimCode</title>
</svelte:head>

<Header />

<div class="flex-1 overflow-y-auto">
	<div class="max-w-2xl mx-auto px-4 py-8">
		<div class="mb-8">
			<div class="flex items-center gap-3 mb-1">
				<svg class="w-6 h-6 text-zinc-300" fill="currentColor" viewBox="0 0 24 24">
					<path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
				</svg>
				<h1 class="text-xl font-semibold text-zinc-50">GitHub</h1>
			</div>
			<p class="text-zinc-500 text-sm">Manage repositories and pull requests</p>
		</div>

		<div class="space-y-6">
			<GitHubConnect />

			{#if $githubConnected}
				<section class="card p-5">
					<h2 class="text-[15px] font-semibold text-zinc-100 mb-4">Repository</h2>
					<RepoSelector />
				</section>

				{#if $selectedRepo}
					<section class="card p-5">
						<div class="flex items-center justify-between mb-4">
							<h2 class="text-[15px] font-semibold text-zinc-100">Pull Requests</h2>
							<span class="text-xs text-zinc-500 font-mono">{$selectedRepo.fullName}</span>
						</div>
						<PRList />
					</section>
				{/if}

				<section class="card p-5">
					<h2 class="text-[15px] font-semibold text-zinc-100 mb-4">How Agent Creates PRs</h2>
					<div class="space-y-3">
						{#each [
							{ step: '1', title: 'Start an Agent conversation', desc: 'Select a repo and describe the changes' },
							{ step: '2', title: 'Agent works autonomously', desc: 'Reads files, writes code, runs analysis' },
							{ step: '3', title: 'Review and merge', desc: 'Agent creates a PR draft for your review' }
						] as item}
							<div class="flex gap-3 items-start">
								<div class="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0 border border-blue-500/20">
									<span class="text-blue-400 font-bold text-xs">{item.step}</span>
								</div>
								<div>
									<div class="text-sm text-zinc-200 font-medium">{item.title}</div>
									<div class="text-xs text-zinc-500">{item.desc}</div>
								</div>
							</div>
						{/each}
					</div>
				</section>
			{/if}
		</div>
	</div>
</div>
