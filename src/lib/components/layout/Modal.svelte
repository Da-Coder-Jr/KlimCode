<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let open = false;
	export let title = '';
	export let size: 'sm' | 'md' | 'lg' | 'xl' = 'md';

	const dispatch = createEventDispatcher();

	function handleClose() {
		open = false;
		dispatch('close');
	}

	function handleBackdrop(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			handleClose();
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') handleClose();
	}

	const sizeClasses = {
		sm: 'max-w-sm',
		md: 'max-w-lg',
		lg: 'max-w-2xl',
		xl: 'max-w-4xl'
	};
</script>

<svelte:window on:keydown={handleKeydown} />

{#if open}
	<div
		class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
		on:click={handleBackdrop}
		role="dialog"
		aria-modal="true"
	>
		<div class="bg-surface-800 border border-surface-600 rounded-xl shadow-2xl w-full {sizeClasses[size]} animate-slide-up">
			{#if title}
				<div class="flex items-center justify-between px-6 py-4 border-b border-surface-700">
					<h2 class="text-lg font-semibold text-surface-100">{title}</h2>
					<button on:click={handleClose} class="text-surface-400 hover:text-surface-200 p-1 rounded-lg hover:bg-surface-700">
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>
			{/if}
			<div class="p-6">
				<slot />
			</div>
		</div>
	</div>
{/if}
