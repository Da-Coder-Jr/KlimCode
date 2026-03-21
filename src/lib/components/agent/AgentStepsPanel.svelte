<script lang="ts">
	import type { AgentStep } from '$types/core';
	import { formatDuration } from '$utils/formatting';
	import { slide } from 'svelte/transition';

	export let steps: AgentStep[] = [];

	let expandedSteps = new Set<string>();

	function toggleStep(id: string) {
		if (expandedSteps.has(id)) {
			expandedSteps.delete(id);
		} else {
			expandedSteps.add(id);
		}
		expandedSteps = new Set(expandedSteps);
	}

	function getStepIcon(type: string): string {
		const icons: Record<string, string> = {
			think: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z',
			read_file: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
			write_file: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
			edit_file: 'M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z',
			run_command: 'M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
			search_files: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
			create_pr: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12',
			browse_repo: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z'
		};
		return icons[type] || icons.think;
	}

	function getStatusColor(status: string): string {
		switch (status) {
			case 'running': return 'text-amber-400';
			case 'completed': return 'text-emerald-400';
			case 'failed': return 'text-red-400';
			default: return 'text-surface-400';
		}
	}

	function getStatusBg(status: string): string {
		switch (status) {
			case 'running': return 'bg-amber-500/10 border-amber-500/20';
			case 'completed': return 'bg-emerald-500/10 border-emerald-500/20';
			case 'failed': return 'bg-red-500/10 border-red-500/20';
			default: return 'bg-surface-800 border-surface-700';
		}
	}
</script>

<div class="h-full flex flex-col bg-surface-900">
	<div class="px-4 py-3 border-b border-surface-700 flex items-center justify-between">
		<h3 class="text-sm font-medium text-surface-200 flex items-center gap-2">
			<svg class="w-4 h-4 text-klim-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
			</svg>
			Agent Activity
		</h3>
		{#if steps.length > 0}
			<span class="text-xs text-surface-500">{steps.length} steps</span>
		{/if}
	</div>

	<div class="flex-1 overflow-y-auto p-3 space-y-2">
		{#if steps.length === 0}
			<div class="text-center text-surface-500 text-sm py-8">
				<svg class="w-8 h-8 mx-auto mb-3 text-surface-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
				</svg>
				Agent steps will appear here as the AI works
			</div>
		{:else}
			{#each steps as step (step.id)}
				<div
					class="rounded-lg border {getStatusBg(step.status)} overflow-hidden"
					transition:slide={{ duration: 200 }}
				>
					<button
						on:click={() => toggleStep(step.id)}
						class="w-full px-3 py-2 flex items-center gap-2 text-left"
					>
						<!-- Status Indicator -->
						{#if step.status === 'running'}
							<div class="w-4 h-4 flex-shrink-0">
								<svg class="w-4 h-4 text-amber-400 animate-spin" fill="none" viewBox="0 0 24 24">
									<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
									<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
								</svg>
							</div>
						{:else}
							<svg class="w-4 h-4 flex-shrink-0 {getStatusColor(step.status)}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={getStepIcon(step.type)} />
							</svg>
						{/if}

						<span class="text-xs text-surface-200 flex-1 truncate">{step.description}</span>

						{#if step.completedAt && step.startedAt}
							<span class="text-xs text-surface-500">
								{formatDuration(new Date(step.completedAt).getTime() - new Date(step.startedAt).getTime())}
							</span>
						{/if}

						<svg
							class="w-3 h-3 text-surface-500 transition-transform"
							class:rotate-180={expandedSteps.has(step.id)}
							fill="none" stroke="currentColor" viewBox="0 0 24 24"
						>
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
						</svg>
					</button>

					{#if expandedSteps.has(step.id) && (step.result || step.error)}
						<div class="px-3 pb-3 border-t border-surface-700/50" transition:slide={{ duration: 150 }}>
							<pre class="text-xs text-surface-400 whitespace-pre-wrap break-all mt-2 max-h-48 overflow-y-auto font-mono leading-relaxed">{step.error || step.result}</pre>
						</div>
					{/if}
				</div>
			{/each}
		{/if}
	</div>
</div>
