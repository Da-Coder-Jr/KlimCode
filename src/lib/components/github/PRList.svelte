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
			case 'open': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
			case 'merged': return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
			case 'closed': return 'text-red-400 bg-red-500/10 border-red-500/20';
			default: return 'text-zinc-400 bg-zinc-800 border-zinc-700';
		}
	}
</script>

<div>
	{#if $prsLoading}
		<div class="text-center py-8 text-zinc-600 text-sm">Loading pull requests...</div>
	{:else if $pullRequests.length === 0}
		<div class="text-center py-8">
			<svg class="w-10 h-10 mx-auto mb-3 text-zinc-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
			</svg>
			<p class="text-sm text-zinc-500">No pull requests found</p>
			<p class="text-xs text-zinc-700 mt-1">PRs created by the agent will appear here</p>
		</div>
	{:else}
		<div class="space-y-2">
			{#each $pullRequests as pr (pr.id)}
				<div class="p-3.5 rounded-xl border border-zinc-800 hover:border-zinc-700 transition-all">
					<div class="flex items-start justify-between gap-3">
						<div class="flex-1 min-w-0">
							<div class="flex items-center gap-2 mb-1.5">
								<span class="text-[10px] font-medium px-1.5 py-0.5 rounded-md border {getStateColor(pr.state)}">{pr.state}</span>
								<span class="text-xs text-zinc-600">#{pr.number}</span>
							</div>
							<a href={pr.url} target="_blank" rel="noopener" class="text-sm font-medium text-zinc-200 hover:text-blue-400 truncate block transition-colors">
								{pr.title}
							</a>
							<div class="flex items-center gap-3 mt-2 text-[11px] text-zinc-600">
								<span>{pr.author}</span>
								<span class="font-mono">{pr.branch} → {pr.baseBranch}</span>
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
				<div class="text-sm font-medium text-zinc-200 mb-1">#{selectedPR.number} {selectedPR.title}</div>
				<div class="text-xs text-zinc-500 font-mono">{selectedPR.branch} → {selectedPR.baseBranch}</div>
			</div>

			<div>
				<label class="text-sm text-zinc-300 block mb-2">Merge method</label>
				<div class="space-y-2">
					{#each [
						{ value: 'squash', label: 'Squash and merge', desc: 'Combine all commits into one' },
						{ value: 'merge', label: 'Merge commit', desc: 'Create a merge commit' },
						{ value: 'rebase', label: 'Rebase and merge', desc: 'Rebase commits onto base' }
					] as option}
						<label class="flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors
							{mergeMethod === option.value ? 'border-blue-500/50 bg-blue-500/5' : 'border-zinc-800 hover:border-zinc-700'}">
							<input type="radio" bind:group={mergeMethod} value={option.value} class="mt-0.5" />
							<div>
								<div class="text-sm text-zinc-200">{option.label}</div>
								<div class="text-xs text-zinc-500">{option.desc}</div>
							</div>
						</label>
					{/each}
				</div>
			</div>

			{#if mergeResult}
				<div class="p-3 rounded-xl text-sm {mergeResult.success ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}">
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
