<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { fade, fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';

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
		class="fixed inset-0 z-50 flex items-center justify-center p-4"
		on:click={handleBackdrop}
		role="dialog"
		aria-modal="true"
		transition:fade={{ duration: 200, easing: cubicOut }}
	>
		<div class="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm"></div>

		<div
			class="relative rounded-2xl shadow-float w-full {sizeClasses[size]} max-h-[90dvh] overflow-y-auto"
			style="background-color: var(--surface); border: 1px solid var(--border)"
			transition:fly={{ y: 60, duration: 300, easing: cubicOut }}
		>
			{#if title}
				<div class="flex items-center justify-between px-5 py-4 sticky top-0 z-10" style="border-bottom: 1px solid var(--border); background-color: var(--surface)">
					<h2 class="text-[15px] font-semibold" style="color: var(--content)">{title}</h2>
					<button
						on:click={handleClose}
						class="p-1.5 rounded-lg transition-all btn-icon"
					>
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>
			{:else}
				<button
					on:click={handleClose}
					class="absolute right-4 top-4 z-10 p-1.5 rounded-lg transition-all btn-icon"
				>
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			{/if}
			<div class="p-5">
				<slot />
			</div>
		</div>
	</div>
{/if}
