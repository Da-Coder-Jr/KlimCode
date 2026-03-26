<script lang="ts">
	import { activeConversation, messages } from '$stores/chat';
	import { currentUser } from '$stores/auth';
	import { githubConnected, githubRepos, selectedRepo, loadRepos, selectRepo } from '$stores/github';
	import ModelSelector from '$components/chat/ModelSelector.svelte';

	export let onToggleSidebar: () => void = () => {};

	let modelSelectorOpen = false;
	let repoSelectorOpen = false;
	let reposLoaded = false;

	async function openRepoSelector() {
		repoSelectorOpen = !repoSelectorOpen;
		if (repoSelectorOpen && !reposLoaded) {
			await loadRepos();
			reposLoaded = true;
		}
	}

	function closeRepoSelector() {
		repoSelectorOpen = false;
	}

	async function handleSelectRepo(repo: typeof $githubRepos[0]) {
		await selectRepo(repo);
		repoSelectorOpen = false;
	}
</script>

<header class="sticky top-0 z-30 w-full flex-shrink-0">
	<div class="navbar-gradient pb-3">
		<div class="flex items-center justify-between px-4 h-11">
			<div class="flex items-center gap-2.5 min-w-0 ml-10 md:ml-10">
				{#if $activeConversation}
					{#if $activeConversation.mode === 'agent'}
						<span class="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 flex-shrink-0">
							<div class="w-1 h-1 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse-slow"></div>
							Agent
						</span>
					{/if}
					<h1 class="text-sm truncate" style="color: var(--content-tertiary)">
						{$activeConversation.title}
					</h1>
				{:else}
					<span class="font-medium text-sm" style="color: var(--content-secondary)">KlimCode</span>
				{/if}
			</div>

			<div class="flex items-center gap-1.5 flex-shrink-0">
				{#if $activeConversation}
					<ModelSelector
						currentModel={$activeConversation.model}
						bind:open={modelSelectorOpen}
						variant="header"
					/>
				{/if}

				<!-- Repo/Workspace selector for agent mode -->
				{#if $activeConversation?.mode === 'agent'}
					{#if $githubConnected}
						<div class="relative">
							<button
								on:click={openRepoSelector}
								class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-80 max-w-[140px]"
								style="background-color: var(--surface-tertiary); border: 1px solid var(--border); color: var(--content-tertiary)"
								title="Select repository"
							>
								<svg class="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
									<path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
								</svg>
								<span class="truncate">{$selectedRepo ? $selectedRepo.name : 'Select Repo'}</span>
								<svg class="w-3 h-3 flex-shrink-0 transition-transform" class:rotate-180={repoSelectorOpen} fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
								</svg>
							</button>

							{#if repoSelectorOpen}
								<button class="fixed inset-0 z-40" on:click={closeRepoSelector} aria-label="Close"></button>
								<div class="absolute top-full right-0 mt-1.5 w-72 rounded-2xl shadow-elevated z-50 overflow-hidden animate-slide-down" style="background-color: var(--surface-secondary); border: 1px solid var(--border)">
									<div class="px-3 py-2.5" style="border-bottom: 1px solid var(--border)">
										<span class="text-[11px] font-semibold uppercase tracking-wider" style="color: var(--content-muted)">Select Repository</span>
									</div>
									<div class="max-h-[260px] overflow-y-auto p-1.5">
										{#if $githubRepos.length === 0}
											<div class="text-center py-6 px-3">
												<p class="text-xs" style="color: var(--content-muted)">Loading repos...</p>
											</div>
										{:else}
											{#each $githubRepos as repo}
												<button
													on:click={() => handleSelectRepo(repo)}
													class="w-full flex items-start gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all"
													style="{$selectedRepo?.id === repo.id
														? 'background-color: var(--surface-active); color: var(--content)'
														: 'color: var(--content-tertiary)'}"
												>
													<svg class="w-3.5 h-3.5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
														<path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
													</svg>
													<div class="flex-1 min-w-0">
														<div class="text-[13px] font-medium truncate">{repo.name}</div>
														<div class="text-[11px] truncate" style="color: var(--content-muted)">{repo.owner}/{repo.name} · {repo.defaultBranch}</div>
													</div>
													{#if $selectedRepo?.id === repo.id}
														<svg class="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
															<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
														</svg>
													{/if}
												</button>
											{/each}
										{/if}
									</div>
									{#if $selectedRepo}
										<div class="px-3 py-2 flex items-center gap-1.5" style="border-top: 1px solid var(--border)">
											<div class="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
											<span class="text-[11px]" style="color: var(--content-muted)">Working on <strong style="color: var(--content-tertiary)">{$selectedRepo.owner}/{$selectedRepo.name}</strong> · {$selectedRepo.defaultBranch}</span>
										</div>
									{/if}
								</div>
							{/if}
						</div>
					{:else}
						<a
							href="/github"
							class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-80"
							style="background-color: var(--surface-tertiary); border: 1px solid var(--border); color: var(--content-muted)"
							title="Connect GitHub to use Agent mode"
						>
							<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
							</svg>
							Connect GitHub
						</a>
					{/if}
				{/if}
			</div>
		</div>
	</div>
</header>
