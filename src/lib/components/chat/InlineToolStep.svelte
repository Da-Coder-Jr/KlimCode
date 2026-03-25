<script lang="ts">
	import type { AgentStep } from '$types/core';
	import { slide } from 'svelte/transition';

	export let step: AgentStep;

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

	function getStatusText(step: AgentStep): string {
		const desc = step.description;
		const isGeneric = !desc || desc.startsWith('Executing:') || desc.startsWith('Running ');

		if (step.status === 'running') {
			if (!isGeneric) return desc + '...';
			const t: Record<string, string> = {
				think: 'Thinking...', read_file: 'Reading file...', write_file: 'Writing file...',
				edit_file: 'Editing file...', run_command: 'Running command...', search_files: 'Searching files...',
				create_pr: 'Creating pull request...', browse_repo: 'Browsing repository...'
			};
			return t[step.type] || 'Working...';
		}

		if (step.status === 'completed') {
			if (!isGeneric) {
				if (desc.startsWith('Reading ')) return desc.replace('Reading ', 'Read ') + '.';
				if (desc.startsWith('Writing ')) return desc.replace('Writing ', 'Wrote ') + '.';
				if (desc.startsWith('Editing ')) return desc.replace('Editing ', 'Edited ') + '.';
				if (desc.startsWith('Searching')) return 'Search complete.';
				if (desc.startsWith('Listing ')) return desc.replace('Listing ', 'Listed ') + '.';
				if (desc.startsWith('Creating PR')) return 'Pull request created.';
			}
			const t: Record<string, string> = {
				think: 'Done thinking.', read_file: 'File read.', write_file: 'File written.',
				edit_file: 'File edited.', run_command: 'Command done.', search_files: 'Search complete.',
				create_pr: 'Pull request created.', browse_repo: 'Repository browsed.'
			};
			return t[step.type] || 'Done.';
		}

		if (step.status === 'failed') {
			if (!isGeneric) return 'Failed: ' + desc + '.';
			const t: Record<string, string> = {
				read_file: 'Failed to read file.', write_file: 'Failed to write file.',
				edit_file: 'Failed to edit file.', run_command: 'Command failed.',
				search_files: 'Search failed.', create_pr: 'Failed to create PR.'
			};
			return t[step.type] || 'Step failed.';
		}

		return desc;
	}

	$: statusText = getStatusText(step);
	$: isActive = step.status === 'running' || step.status === 'pending';
</script>

<div class="flex items-center gap-2 py-0.5" transition:slide={{ duration: 200 }}>
	<svg
		class="w-3.5 h-3.5 flex-shrink-0"
		class:animate-pulse={step.status === 'running'}
		style="color: {step.status === 'running' ? '#f59e0b' : step.status === 'failed' ? '#ef4444' : 'var(--content-muted)'}"
		fill="none" stroke="currentColor" viewBox="0 0 24 24"
	>
		<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d={getStepIcon(step.type)} />
	</svg>

	<span
		class="text-[13px] font-medium shimmer-text"
		class:shimmer-active={isActive}
		class:shimmer-done={step.status === 'completed'}
		class:shimmer-failed={step.status === 'failed'}
	>
		{statusText}
	</span>
</div>

<style>
	.shimmer-text {
		background-clip: text;
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-size: 200% 100%;
	}

	.shimmer-active {
		background-image: linear-gradient(
			110deg,
			var(--content-muted) 0%,
			var(--content-muted) 35%,
			var(--content) 50%,
			var(--content-muted) 65%,
			var(--content-muted) 100%
		);
		animation: shimmer 3s linear infinite;
	}

	.shimmer-done {
		background-image: linear-gradient(110deg, var(--content-muted) 0%, var(--content-muted) 100%);
		animation: shimmer-settle 0.6s ease-out forwards;
	}

	.shimmer-failed {
		background-image: linear-gradient(110deg, #ef4444 0%, #ef4444 100%);
	}

	@keyframes shimmer {
		0% { background-position: 200% 0; }
		100% { background-position: -200% 0; }
	}

	@keyframes shimmer-settle {
		0% { background-position: -200% 0; }
		100% { background-position: 0% 0; }
	}
</style>
