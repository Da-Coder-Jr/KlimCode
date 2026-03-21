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
		<div class="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl shadow-black/30 w-full {sizeClasses[size]} animate-slide-up">
			{#if title}
				<div class="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
					<h2 class="text-[15px] font-semibold text-zinc-100">{title}</h2>
					<button on:click={handleClose} class="text-zinc-500 hover:text-zinc-300 p-1 rounded-lg hover:bg-zinc-800 transition-all">
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>
			{/if}
			<div class="p-5">
				<slot />
			</div>
		</div>
	</div>
{/if}
