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
			class="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all"
			style="background-color: var(--surface-secondary); border: 1px solid var(--border)"
		>
			<svg class="w-4 h-4" style="color: var(--content-muted)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
			</svg>
			<div class="flex-1 min-w-0">
				<div class="text-sm font-medium truncate" style="color: var(--content-secondary)">{$selectedRepo.fullName}</div>
				{#if $selectedRepo.description}
					<div class="text-xs truncate" style="color: var(--content-muted)">{$selectedRepo.description}</div>
				{/if}
			</div>
			<svg class="w-4 h-4" style="color: var(--content-muted)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
			</svg>
		</button>
	{:else}
		<button
			on:click={() => showDropdown = !showDropdown}
			class="w-full flex items-center gap-3 p-3 rounded-xl border-dashed text-left transition-all"
			style="border: 1px dashed var(--border-secondary)"
		>
			<svg class="w-4 h-4" style="color: var(--content-muted)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
			</svg>
			<span class="text-sm" style="color: var(--content-muted)">Select a repository</span>
		</button>
	{/if}

	{#if showDropdown}
		<div class="absolute top-full left-0 right-0 mt-1.5 rounded-xl shadow-elevated z-50 max-h-80 overflow-hidden animate-slide-down" style="background-color: var(--surface-secondary); border: 1px solid var(--border)">
			<div class="p-2" style="border-bottom: 1px solid var(--border)">
				<input
					bind:value={searchQuery}
					placeholder="Search repositories..."
					class="input-field text-sm"
				/>
			</div>

			<div class="overflow-y-auto max-h-60">
				{#if $reposLoading}
					<div class="text-center py-4 text-sm" style="color: var(--content-muted)">Loading repositories...</div>
				{:else if filteredRepos.length === 0}
					<div class="text-center py-4 text-sm" style="color: var(--content-muted)">No repositories found</div>
				{:else}
					{#each filteredRepos as repo}
						<button
							on:click={() => handleSelect(repo)}
							class="w-full flex items-center gap-3 px-3 py-2.5 text-left transition-all duration-100 hover:bg-[var(--surface-hover)]"
						>
							<svg class="w-4 h-4 flex-shrink-0" style="color: var(--content-muted)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
							</svg>
							<div class="flex-1 min-w-0">
								<div class="text-sm truncate" style="color: var(--content-secondary)">{repo.fullName}</div>
								{#if repo.description}
									<div class="text-xs truncate" style="color: var(--content-muted)">{repo.description}</div>
								{/if}
							</div>
							{#if repo.isPrivate}
								<span class="text-[10px] px-1.5 py-0.5 rounded" style="color: var(--content-muted); background-color: var(--surface-tertiary)">Private</span>
							{/if}
						</button>
					{/each}
				{/if}
			</div>
		</div>
	{/if}
</div>
