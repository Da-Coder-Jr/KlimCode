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
			class="w-full flex items-center gap-3 p-3 card-hover text-left"
		>
			<svg class="w-5 h-5 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
			</svg>
			<div class="flex-1 min-w-0">
				<div class="text-sm font-medium text-surface-200 truncate">{$selectedRepo.fullName}</div>
				{#if $selectedRepo.description}
					<div class="text-xs text-surface-400 truncate">{$selectedRepo.description}</div>
				{/if}
			</div>
			<svg class="w-4 h-4 text-surface-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
			</svg>
		</button>
	{:else}
		<button
			on:click={() => showDropdown = !showDropdown}
			class="w-full flex items-center gap-3 p-3 card-hover text-left"
		>
			<svg class="w-5 h-5 text-surface-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
			</svg>
			<span class="text-sm text-surface-400">Select a repository</span>
		</button>
	{/if}

	{#if showDropdown}
		<div class="absolute top-full left-0 right-0 mt-1 bg-surface-800 border border-surface-600 rounded-xl shadow-2xl z-50 max-h-80 overflow-hidden">
			<div class="p-2 border-b border-surface-700">
				<input
					bind:value={searchQuery}
					placeholder="Search repositories..."
					class="input-field w-full text-sm"
				/>
			</div>

			<div class="overflow-y-auto max-h-60">
				{#if $reposLoading}
					<div class="text-center py-4 text-surface-500 text-sm">Loading repositories...</div>
				{:else if filteredRepos.length === 0}
					<div class="text-center py-4 text-surface-500 text-sm">No repositories found</div>
				{:else}
					{#each filteredRepos as repo}
						<button
							on:click={() => handleSelect(repo)}
							class="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-surface-700 text-left"
						>
							<svg class="w-4 h-4 text-surface-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
							</svg>
							<div class="flex-1 min-w-0">
								<div class="text-sm text-surface-200 truncate">{repo.fullName}</div>
								{#if repo.description}
									<div class="text-xs text-surface-500 truncate">{repo.description}</div>
								{/if}
							</div>
							{#if repo.isPrivate}
								<span class="badge text-xs bg-surface-700 text-surface-400">Private</span>
							{/if}
						</button>
					{/each}
				{/if}
			</div>
		</div>
	{/if}
</div>
