<script lang="ts">
	import type { GitHubPR } from '$types/core';
	import { pullRequests, prsLoading, mergePR, selectedRepo, loadPullRequests } from '$stores/github';
	import { formatRelativeTime } from '$utils/formatting';
	import Modal from '$components/layout/Modal.svelte';

	let selectedPR: GitHubPR | null = null;
	let showMergeModal = false;
	let mergeMethod: 'merge' | 'squash' | 'rebase' = 'squash';
	let merging = false;
	let mergeResult: { success: boolean; message: string } | null = null;

	function openMerge(pr: GitHubPR) {
		selectedPR = pr;
		showMergeModal = true;
		mergeResult = null;
	}

	async function handleMerge() {
		if (!selectedPR || !$selectedRepo) return;
		merging = true;

		mergeResult = await mergePR(
			$selectedRepo.owner,
			$selectedRepo.name,
			selectedPR.number,
			mergeMethod
		);

		merging = false;
		if (mergeResult.success) {
			setTimeout(() => {
				showMergeModal = false;
				selectedPR = null;
			}, 1500);
		}
	}

	async function handleRefresh() {
		if ($selectedRepo) {
			await loadPullRequests($selectedRepo.owner, $selectedRepo.name);
		}
	}

	function getStateColor(state: string): string {
		switch (state) {
			case 'open': return 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
			case 'merged': return 'text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-500/20';
			case 'closed': return 'text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/20';
			default: return '';
		}
	}
</script>

<div>
	<!-- Header with refresh -->
	<div class="flex items-center justify-between mb-3">
		<span class="text-xs font-medium" style="color: var(--content-muted)">
			{$pullRequests.length} pull request{$pullRequests.length === 1 ? '' : 's'}
		</span>
		<button
			on:click={handleRefresh}
			disabled={$prsLoading}
			class="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg transition-all"
			style="color: var(--content-muted); background-color: var(--surface-tertiary); border: 1px solid var(--border)"
			title="Refresh pull requests"
		>
			<svg
				class="w-3 h-3"
				class:animate-spin={$prsLoading}
				fill="none" stroke="currentColor" viewBox="0 0 24 24"
			>
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
			</svg>
			Refresh
		</button>
	</div>

	{#if $prsLoading}
		<div class="text-center py-8 text-sm" style="color: var(--content-muted)">Loading pull requests...</div>
	{:else if $pullRequests.length === 0}
		<div class="text-center py-8">
			<svg class="w-10 h-10 mx-auto mb-3" style="color: var(--border)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
			</svg>
			<p class="text-sm" style="color: var(--content-muted)">No pull requests found</p>
			<p class="text-xs mt-1" style="color: var(--content-muted)">PRs created by the agent will appear here</p>
		</div>
	{:else}
		<div class="space-y-2">
			{#each $pullRequests as pr (pr.id)}
				<div class="p-3.5 rounded-xl transition-all" style="border: 1px solid var(--border)">
					<div class="flex items-start justify-between gap-3">
						<div class="flex-1 min-w-0">
							<div class="flex items-center gap-2 mb-1.5">
								<span class="text-[10px] font-medium px-1.5 py-0.5 rounded-md border {getStateColor(pr.state)}">{pr.state}</span>
								<span class="text-xs" style="color: var(--content-muted)">#{pr.number}</span>
							</div>
							<a href={pr.url} target="_blank" rel="noopener" class="text-sm font-medium truncate block transition-colors underline-offset-2" style="color: var(--content-secondary)">
								{pr.title}
							</a>
							<div class="flex items-center gap-3 mt-2 text-[11px]" style="color: var(--content-muted)">
								<span>{pr.author}</span>
								<span class="font-mono">{pr.branch} → {pr.baseBranch}</span>
								<span>{formatRelativeTime(pr.updatedAt)}</span>
							</div>
						</div>

						{#if pr.state === 'open'}
							<button
								on:click={() => openMerge(pr)}
								class="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-all flex-shrink-0"
								style="background-color: #10b981; color: #fff; border: 1px solid #059669;"
							>
								<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
								</svg>
								Merge
							</button>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<Modal bind:open={showMergeModal} title="Merge Pull Request" size="sm">
	{#if selectedPR}
		<div class="space-y-4">
			<!-- PR info -->
			<div class="p-3 rounded-xl" style="background-color: var(--surface-tertiary); border: 1px solid var(--border)">
				<div class="text-sm font-medium mb-0.5" style="color: var(--content)">#{selectedPR.number} {selectedPR.title}</div>
				<div class="text-xs font-mono" style="color: var(--content-muted)">{selectedPR.branch} → {selectedPR.baseBranch}</div>
			</div>

			<!-- Merge method -->
			<div>
				<p class="text-xs font-semibold uppercase tracking-wider mb-2" style="color: var(--content-muted)">Merge method</p>
				<div class="space-y-1.5">
					{#each [
						{ value: 'squash', label: 'Squash and merge', desc: 'Combine all commits into one' },
						{ value: 'merge', label: 'Merge commit', desc: 'Create a merge commit' },
						{ value: 'rebase', label: 'Rebase and merge', desc: 'Rebase commits onto base' }
					] as option}
						<label
							class="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all"
							style="border: 1px solid {mergeMethod === option.value ? '#10b981' : 'var(--border)'}; background-color: {mergeMethod === option.value ? 'rgba(16,185,129,0.06)' : 'var(--surface-tertiary)'}"
						>
							<div class="relative flex-shrink-0">
								<input type="radio" bind:group={mergeMethod} value={option.value} class="sr-only" />
								<div class="w-4 h-4 rounded-full flex items-center justify-center" style="border: 2px solid {mergeMethod === option.value ? '#10b981' : 'var(--border-secondary)'}; background: {mergeMethod === option.value ? '#10b981' : 'transparent'}">
									{#if mergeMethod === option.value}
										<div class="w-1.5 h-1.5 rounded-full bg-white"></div>
									{/if}
								</div>
							</div>
							<div>
								<div class="text-sm font-medium" style="color: var(--content)">{option.label}</div>
								<div class="text-xs" style="color: var(--content-muted)">{option.desc}</div>
							</div>
						</label>
					{/each}
				</div>
			</div>

			{#if mergeResult}
				<div
					class="p-3 rounded-xl text-sm flex items-center gap-2"
					style="{mergeResult.success
						? 'background-color: rgba(16,185,129,0.08); color: #10b981; border: 1px solid rgba(16,185,129,0.2)'
						: 'background-color: rgba(239,68,68,0.08); color: #ef4444; border: 1px solid rgba(239,68,68,0.2)'}"
				>
					{#if mergeResult.success}
						<svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
						</svg>
					{:else}
						<svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
					{/if}
					{mergeResult.message}
				</div>
			{/if}

			<!-- Actions -->
			<div class="flex items-center justify-end gap-2 pt-1" style="border-top: 1px solid var(--border)">
				<button
					on:click={() => showMergeModal = false}
					class="px-4 py-2 text-sm font-medium rounded-xl transition-all"
					style="color: var(--content-secondary); background-color: var(--surface-tertiary); border: 1px solid var(--border)"
				>
					Cancel
				</button>
				<button
					on:click={handleMerge}
					disabled={merging || !!mergeResult?.success}
					class="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
					style="background-color: #10b981; color: #fff; border: 1px solid #059669"
				>
					{#if merging}
						<svg class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
							<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
							<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
						</svg>
						Merging...
					{:else if mergeResult?.success}
						<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
						</svg>
						Merged!
					{:else}
						<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
						</svg>
						Confirm Merge
					{/if}
				</button>
			</div>
		</div>
	{/if}
</Modal>
