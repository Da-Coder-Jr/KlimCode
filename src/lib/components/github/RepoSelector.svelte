<script lang="ts">
	import { githubRepos, selectedRepo, selectRepo, loadRepos, reposLoading } from '$stores/github';
	import type { GitHubRepo } from '$types/core';
	import { onMount } from 'svelte';

	let searchQuery = '';
	let showDropdown = false;

	onMount(() => {
		if ($githubRepos.length === 0) {
			loadRepos();
		}
	});

	$: filteredRepos = $githubRepos.filter((repo) =>
		repo.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
		(repo.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
	);

	function handleSelect(repo: GitHubRepo) {
		selectRepo(repo);
		showDropdown = false;
		searchQuery = '';
	}
</script>

<div class="relative">
	{#if $selectedRepo}
		<button
			on:click={() => showDropdown = !showDropdown}
			class="w-full flex items-center gap-3 p-3 rounded-xl border border-zinc-800 hover:border-zinc-700 bg-zinc-900/50 text-left transition-all"
		>
			<svg class="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
			</svg>
			<div class="flex-1 min-w-0">
				<div class="text-sm font-medium text-zinc-200 truncate">{$selectedRepo.fullName}</div>
				{#if $selectedRepo.description}
					<div class="text-xs text-zinc-500 truncate">{$selectedRepo.description}</div>
				{/if}
			</div>
			<svg class="w-4 h-4 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
			</svg>
		</button>
	{:else}
		<button
			on:click={() => showDropdown = !showDropdown}
			class="w-full flex items-center gap-3 p-3 rounded-xl border border-zinc-800 border-dashed hover:border-zinc-700 text-left transition-all"
		>
			<svg class="w-4 h-4 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
			</svg>
			<span class="text-sm text-zinc-500">Select a repository</span>
		</button>
	{/if}

	{#if showDropdown}
		<div class="absolute top-full left-0 right-0 mt-1.5 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl shadow-black/30 z-50 max-h-80 overflow-hidden animate-slide-down">
			<div class="p-2 border-b border-zinc-800">
				<input
					bind:value={searchQuery}
					placeholder="Search repositories..."
					class="input-field text-sm"
				/>
			</div>

			<div class="overflow-y-auto max-h-60">
				{#if $reposLoading}
					<div class="text-center py-4 text-zinc-500 text-sm">Loading repositories...</div>
				{:else if filteredRepos.length === 0}
					<div class="text-center py-4 text-zinc-600 text-sm">No repositories found</div>
				{:else}
					{#each filteredRepos as repo}
						<button
							on:click={() => handleSelect(repo)}
							class="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-zinc-800/60 text-left transition-colors"
						>
							<svg class="w-4 h-4 text-zinc-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
							</svg>
							<div class="flex-1 min-w-0">
								<div class="text-sm text-zinc-200 truncate">{repo.fullName}</div>
								{#if repo.description}
									<div class="text-xs text-zinc-600 truncate">{repo.description}</div>
								{/if}
							</div>
							{#if repo.isPrivate}
								<span class="text-[10px] text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded">Private</span>
							{/if}
						</button>
					{/each}
				{/if}
			</div>
		</div>
	{/if}
</div>
