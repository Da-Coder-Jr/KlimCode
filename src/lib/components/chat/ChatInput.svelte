<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import { isStreaming, inputMessage, stopStreaming, activeConversation } from '$stores/chat';
	import { githubConnected, githubRepos, selectedRepo, selectRepo, loadRepos, reposLoading } from '$stores/github';
	import type { GitHubRepo } from '$types/core';

	const dispatch = createEventDispatcher();

	let textarea: HTMLTextAreaElement;
	let pasteGlow = false;

	function handleSubmit() {
		if ($isStreaming || !$inputMessage.trim()) return;
		dispatch('send', { message: $inputMessage });
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
			e.preventDefault();
			handleSubmit();
		}
	}

	function handleInput() {
		if (textarea) {
			textarea.style.height = 'auto';
			textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
		}
	}

	function handlePaste() {
		pasteGlow = true;
		setTimeout(() => { pasteGlow = false; }, 600);
	}

	function handleStop() {
		if (typeof stopStreaming === 'function') {
			stopStreaming();
		}
	}

	export function focus() {
		textarea?.focus();
	}

	let repoDropdownOpen = false;
	let repoSearchQuery = '';

	$: filteredRepos = $githubRepos.filter((r: GitHubRepo) =>
		r.fullName.toLowerCase().includes(repoSearchQuery.toLowerCase())
	);

	function handleRepoSelect(repo: GitHubRepo) {
		selectRepo(repo);
		repoDropdownOpen = false;
		repoSearchQuery = '';
	}

	function toggleRepoDropdown() {
		if ($githubRepos.length === 0) loadRepos();
		repoDropdownOpen = !repoDropdownOpen;
	}

	$: showRepoSelector = !!$activeConversation && $activeConversation.mode === 'agent' && !!$githubConnected;

	onMount(() => {
		if ($inputMessage.trim()) {
			setTimeout(() => {
				handleSubmit();
			}, 100);
		}
	});
</script>

<div class="flex-shrink-0 px-3 sm:px-4 pb-3 sm:pb-4 pt-2" style="background-color: var(--surface)">
	<div class="max-w-3xl xl:max-w-4xl mx-auto">
		<!-- Generating indicator bar - prominent, above the input -->
		{#if $isStreaming}
			<div class="flex items-center justify-center gap-3 mb-2 py-2">
				<button
					on:click={handleStop}
					class="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all hover:opacity-90 active:scale-[0.97]"
					style="background-color: var(--surface-tertiary); border: 1px solid var(--border); color: var(--content-secondary)"
				>
					<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
						<rect x="6" y="6" width="12" height="12" rx="2" />
					</svg>
					Stop generating
				</button>
			</div>
		{/if}

		<form on:submit|preventDefault={handleSubmit}>
			<div
				class="relative rounded-2xl transition-all"
				class:paste-glow={pasteGlow}
				class:generating-border={$isStreaming}
				style="background-color: var(--surface-secondary); border: 1px solid var(--border)"
			>
				<textarea
					bind:this={textarea}
					bind:value={$inputMessage}
					on:keydown={handleKeydown}
					on:input={handleInput}
					on:paste={handlePaste}
					placeholder={$isStreaming ? 'Wait for response...' : 'Message KlimCode...'}
					disabled={$isStreaming}
					rows="1"
					class="scrollbar-custom w-full bg-transparent resize-none px-4 py-3 focus:outline-none text-[15px] leading-relaxed max-h-[200px] disabled:opacity-40"
					style="color: var(--content)"
				></textarea>

				<div class="flex items-center justify-between px-3 pb-2.5">
					<div class="flex items-center gap-1">
						<!-- Repo selector (agent mode only) -->
						{#if showRepoSelector}
							<div class="relative">
								<button
									type="button"
									on:click={toggleRepoDropdown}
									class="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs transition-all btn-icon"
									style="background-color: var(--surface-tertiary); border: 1px solid var(--border); color: var(--content-secondary)"
									title="Select repository"
									disabled={$isStreaming}
								>
									<svg class="w-3.5 h-3.5 flex-shrink-0" style="color: var(--content-muted)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
									</svg>
									<span class="truncate max-w-[120px]">{$selectedRepo ? $selectedRepo.fullName.split('/')[1] : 'Pick repo'}</span>
									<svg class="w-3 h-3 flex-shrink-0 transition-transform {repoDropdownOpen ? 'rotate-180' : ''}" style="color: var(--content-muted)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
									</svg>
								</button>

								{#if repoDropdownOpen}
									<button class="fixed inset-0 z-40" on:click={() => { repoDropdownOpen = false; repoSearchQuery = ''; }} aria-label="Close" type="button"></button>
									<div class="absolute bottom-full mb-1.5 left-0 w-64 rounded-xl shadow-elevated z-50 overflow-hidden animate-slide-up" style="background-color: var(--surface-secondary); border: 1px solid var(--border)">
										<div class="p-2" style="border-bottom: 1px solid var(--border)">
											<input
												bind:value={repoSearchQuery}
												placeholder="Search repositories..."
												class="w-full rounded-lg px-3 py-1.5 text-xs focus:outline-none"
												style="background-color: var(--surface-tertiary); color: var(--content-secondary); border: 1px solid transparent"
												autofocus
											/>
										</div>
										<div class="overflow-y-auto max-h-52">
											{#if $reposLoading}
												<div class="text-center py-3 text-xs" style="color: var(--content-muted)">Loading...</div>
											{:else if filteredRepos.length === 0}
												<div class="text-center py-3 text-xs" style="color: var(--content-muted)">No repositories found</div>
											{:else}
												{#each filteredRepos as repo}
													<button
														type="button"
														on:click={() => handleRepoSelect(repo)}
														class="w-full flex items-center gap-2 px-3 py-2 text-left transition-all duration-100 hover:bg-[var(--surface-hover)]"
													>
														<svg class="w-3.5 h-3.5 flex-shrink-0" style="color: var(--content-muted)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
															<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
														</svg>
														<div class="flex-1 min-w-0">
															<div class="text-xs truncate" style="color: var(--content-secondary)">{repo.fullName}</div>
														</div>
														{#if $selectedRepo?.fullName === repo.fullName}
															<svg class="w-3 h-3 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
															</svg>
														{/if}
													</button>
												{/each}
											{/if}
										</div>
									</div>
								{/if}
							</div>
						{/if}
					</div>

					<div class="flex items-center gap-1.5">
						{#if !$isStreaming}
							<button
								type="submit"
								disabled={!$inputMessage.trim()}
								class="p-2 rounded-full transition-all duration-150"
								style="{$inputMessage.trim()
									? 'background-color: var(--content); color: var(--surface)'
									: 'background-color: var(--surface-tertiary); color: var(--content-muted); cursor: not-allowed'}"
								title="Send message (Enter)"
							>
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
								</svg>
							</button>
						{/if}
					</div>
				</div>
			</div>
		</form>

		<div class="flex items-center justify-center mt-1.5">
			<span class="text-[11px]" style="color: var(--content-muted)">
				Free AI by <a href="https://build.nvidia.com" target="_blank" rel="noopener" class="transition-colors" style="color: var(--content-tertiary)">NVIDIA NIM</a>
				&middot; Enter to send
			</span>
		</div>
	</div>
</div>

<style>
	.generating-border {
		border-color: var(--content-muted) !important;
		animation: border-pulse 2s ease-in-out infinite;
	}

	@keyframes border-pulse {
		0%, 100% { border-color: var(--border); }
		50% { border-color: var(--content-muted); }
	}
</style>
