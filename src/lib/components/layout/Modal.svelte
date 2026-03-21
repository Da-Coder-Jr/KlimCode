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
	<!-- Backdrop with fade - inspired by chat-ui Modal -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center p-4"
		on:click={handleBackdrop}
		role="dialog"
		aria-modal="true"
		transition:fade={{ duration: 200, easing: cubicOut }}
	>
		<div class="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>

		<!-- Modal with fly-in animation - from chat-ui -->
		<div
			class="relative bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl shadow-black/30 w-full {sizeClasses[size]} max-h-[90dvh] overflow-y-auto"
			transition:fly={{ y: 60, duration: 300, easing: cubicOut }}
		>
			{#if title}
				<div class="flex items-center justify-between px-5 py-4 border-b border-zinc-800 sticky top-0 bg-zinc-900 z-10">
					<h2 class="text-[15px] font-semibold text-zinc-100">{title}</h2>
					<button
						on:click={handleClose}
						class="text-zinc-500 hover:text-zinc-300 p-1.5 rounded-lg hover:bg-zinc-800 transition-all"
					>
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>
			{:else}
				<!-- Close button without title bar -->
				<button
					on:click={handleClose}
					class="absolute right-4 top-4 z-10 text-zinc-500 hover:text-zinc-300 p-1.5 rounded-lg hover:bg-zinc-800 transition-all"
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
