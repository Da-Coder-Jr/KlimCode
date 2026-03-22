<script lang="ts">
	import type { AgentStep } from '$types/core';
	import { formatDuration } from '$utils/formatting';
	import { slide, fade } from 'svelte/transition';

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

	function getStepLabel(type: string): string {
		const labels: Record<string, string> = {
			think: 'Thinking',
			read_file: 'Reading File',
			write_file: 'Writing File',
			edit_file: 'Editing File',
			run_command: 'Running Command',
			search_files: 'Searching Files',
			create_pr: 'Creating PR',
			browse_repo: 'Browsing Repo'
		};
		return labels[type] || type;
	}

	function getStatusColor(status: string): string {
		switch (status) {
			case 'running': return 'text-amber-500 dark:text-amber-400';
			case 'completed': return 'text-emerald-500 dark:text-emerald-400';
			case 'failed': return 'text-red-500 dark:text-red-400';
			default: return '';
		}
	}

	$: completedCount = steps.filter(s => s.status === 'completed').length;
	$: runningStep = steps.find(s => s.status === 'running');
</script>

<div class="h-full flex flex-col overflow-hidden">
	<!-- Header -->
	<div class="px-4 py-3 flex items-center justify-between flex-shrink-0" style="border-bottom: 1px solid var(--border)">
		<h3 class="text-sm font-semibold flex items-center gap-2" style="color: var(--content)">
			<div class="w-5 h-5 rounded-md bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
				<svg class="w-3 h-3 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
				</svg>
			</div>
			Activity
		</h3>
		{#if steps.length > 0}
			<span class="text-[10px] font-medium px-1.5 py-0.5 rounded-md" style="background-color: var(--surface-tertiary); color: var(--content-muted); border: 1px solid var(--border)">
				{completedCount}/{steps.length}
			</span>
		{/if}
	</div>

	<!-- Progress bar -->
	{#if steps.length > 0}
		<div class="px-4 py-2.5 flex-shrink-0" style="border-bottom: 1px solid var(--border)">
			<div class="flex items-center gap-2 mb-1.5">
				{#if runningStep}
					<div class="flex items-center gap-1.5 min-w-0">
						<div class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse flex-shrink-0"></div>
						<span class="text-[11px] font-medium text-amber-600 dark:text-amber-400 truncate">{getStepLabel(runningStep.type)}</span>
					</div>
				{:else}
					<span class="text-[11px] font-medium truncate" style="color: var(--content-muted)">
						{completedCount === steps.length ? 'All steps completed' : 'Waiting...'}
					</span>
				{/if}
			</div>
			<div class="w-full h-1 rounded-full overflow-hidden" style="background-color: var(--surface-tertiary)">
				<div
					class="h-full rounded-full transition-all duration-500 ease-out"
					class:bg-emerald-500={completedCount === steps.length}
					class:bg-amber-500={completedCount !== steps.length}
					style="width: {steps.length > 0 ? (completedCount / steps.length) * 100 : 0}%"
				></div>
			</div>
		</div>
	{/if}

	<!-- Steps list -->
	<div class="flex-1 overflow-y-auto p-3 min-h-0">
		{#if steps.length === 0}
			<div class="text-center py-8 px-4">
				<div class="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3" style="background-color: var(--surface-tertiary); border: 1px solid var(--border)">
					<svg class="w-5 h-5" style="color: var(--content-muted)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
					</svg>
				</div>
				<p class="text-xs font-medium mb-1" style="color: var(--content-secondary)">No activity yet</p>
				<p class="text-[11px]" style="color: var(--content-muted)">Steps appear here as the agent works</p>
			</div>
		{:else}
			<div class="space-y-1.5">
				{#each steps as step (step.id)}
					<div transition:slide={{ duration: 200 }}>
						<!-- Step card -->
						<button
							on:click={() => toggleStep(step.id)}
							class="w-full rounded-xl text-left transition-all duration-150 hover:shadow-soft overflow-hidden"
							style="background-color: var(--surface-secondary); border: 1px solid var(--border)"
						>
							<div class="px-3 py-2.5 flex items-center gap-2">
								<!-- Status dot -->
								<div class="flex-shrink-0">
									{#if step.status === 'running'}
										<div class="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
									{:else if step.status === 'completed'}
										<div class="w-2 h-2 rounded-full bg-emerald-500"></div>
									{:else if step.status === 'failed'}
										<div class="w-2 h-2 rounded-full bg-red-500"></div>
									{:else}
										<div class="w-2 h-2 rounded-full" style="background-color: var(--content-muted)"></div>
									{/if}
								</div>

								<svg class="w-3.5 h-3.5 flex-shrink-0 {getStatusColor(step.status)}" style="{step.status === 'pending' ? 'color: var(--content-muted)' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d={getStepIcon(step.type)} />
								</svg>

								<div class="flex-1 min-w-0">
									<div class="text-[11px] font-medium truncate" style="color: var(--content-secondary)">{step.description}</div>
								</div>

								{#if step.completedAt && step.startedAt}
									<span class="text-[9px] font-mono flex-shrink-0 px-1.5 py-0.5 rounded" style="color: var(--content-muted); background-color: var(--surface-tertiary)">
										{formatDuration(new Date(step.completedAt).getTime() - new Date(step.startedAt).getTime())}
									</span>
								{/if}

								<svg
									class="w-3 h-3 transition-transform duration-150 flex-shrink-0"
									class:rotate-180={expandedSteps.has(step.id)}
									style="color: var(--content-muted)"
									fill="none" stroke="currentColor" viewBox="0 0 24 24"
								>
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
								</svg>
							</div>
						</button>

						{#if expandedSteps.has(step.id) && (step.result || step.error)}
							<div
								class="mt-1 rounded-xl overflow-hidden"
								style="border: 1px solid var(--border)"
								transition:slide={{ duration: 150 }}
							>
								<div class="px-3 py-2" style="background-color: var(--code-bg)">
									{#if step.error}
										<div class="flex items-center gap-1.5 mb-1.5">
											<div class="w-1.5 h-1.5 rounded-full bg-red-500"></div>
											<span class="text-[10px] font-medium text-red-500 dark:text-red-400">Error</span>
										</div>
									{/if}
									<pre class="text-[11px] whitespace-pre-wrap break-all max-h-40 overflow-y-auto font-mono leading-relaxed" style="color: var(--code-text)">{step.error || step.result}</pre>
								</div>
							</div>
						{/if}
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>
