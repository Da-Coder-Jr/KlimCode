<script lang="ts">
	import type { GitHubPR } from '$types/core';
	import { pullRequests, prsLoading, mergePR, selectedRepo } from '$stores/github';
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

	function getStateColor(state: string): string {
		switch (state) {
			case 'open': return 'text-emerald-400 bg-emerald-900/30';
			case 'merged': return 'text-purple-400 bg-purple-900/30';
			case 'closed': return 'text-red-400 bg-red-900/30';
			default: return 'text-surface-400 bg-surface-800';
		}
	}
</script>

<div>
	{#if $prsLoading}
		<div class="text-center py-8 text-surface-500 text-sm">Loading pull requests...</div>
	{:else if $pullRequests.length === 0}
		<div class="text-center py-8 text-surface-500">
			<svg class="w-12 h-12 mx-auto mb-3 text-surface-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
			</svg>
			<p class="text-sm">No pull requests found</p>
			<p class="text-xs text-surface-600 mt-1">PRs created by the agent will appear here</p>
		</div>
	{:else}
		<div class="space-y-2">
			{#each $pullRequests as pr (pr.id)}
				<div class="card p-4">
					<div class="flex items-start justify-between gap-3">
						<div class="flex-1 min-w-0">
							<div class="flex items-center gap-2 mb-1">
								<span class="badge text-xs {getStateColor(pr.state)}">{pr.state}</span>
								<span class="text-xs text-surface-500">#{pr.number}</span>
							</div>
							<a href={pr.url} target="_blank" rel="noopener" class="text-sm font-medium text-surface-200 hover:text-klim-300 truncate block">
								{pr.title}
							</a>
							<div class="flex items-center gap-3 mt-2 text-xs text-surface-400">
								<span>{pr.author}</span>
								<span>{pr.branch} → {pr.baseBranch}</span>
								<span>{formatRelativeTime(pr.updatedAt)}</span>
							</div>
						</div>

						{#if pr.state === 'open'}
							<button
								on:click={() => openMerge(pr)}
								class="btn-primary text-xs px-3 py-1.5 flex-shrink-0"
							>
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
			<div>
				<div class="text-sm font-medium text-surface-200 mb-1">#{selectedPR.number} {selectedPR.title}</div>
				<div class="text-xs text-surface-400">{selectedPR.branch} → {selectedPR.baseBranch}</div>
			</div>

			<div>
				<label class="text-sm text-surface-300 block mb-2">Merge method</label>
				<div class="space-y-2">
					{#each [
						{ value: 'squash', label: 'Squash and merge', desc: 'Combine all commits into one' },
						{ value: 'merge', label: 'Merge commit', desc: 'Create a merge commit' },
						{ value: 'rebase', label: 'Rebase and merge', desc: 'Rebase commits onto base' }
					] as option}
						<label class="flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors
							{mergeMethod === option.value ? 'border-klim-500 bg-klim-950/30' : 'border-surface-700 hover:border-surface-600'}">
							<input type="radio" bind:group={mergeMethod} value={option.value} class="mt-0.5" />
							<div>
								<div class="text-sm text-surface-200">{option.label}</div>
								<div class="text-xs text-surface-400">{option.desc}</div>
							</div>
						</label>
					{/each}
				</div>
			</div>

			{#if mergeResult}
				<div class="p-3 rounded-lg text-sm {mergeResult.success ? 'bg-emerald-900/30 text-emerald-300' : 'bg-red-900/30 text-red-300'}">
					{mergeResult.message}
				</div>
			{/if}

			<div class="flex justify-end gap-2">
				<button on:click={() => showMergeModal = false} class="btn-secondary text-sm">Cancel</button>
				<button on:click={handleMerge} disabled={merging} class="btn-primary text-sm">
					{merging ? 'Merging...' : 'Confirm Merge'}
				</button>
			</div>
		</div>
	{/if}
</Modal>
