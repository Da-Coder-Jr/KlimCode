<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { fade, fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';

	export let open = false;
	export let title = 'Are you sure?';
	export let message = '';
	export let confirmText = 'Delete';
	export let cancelText = 'Cancel';
	export let variant: 'danger' | 'warning' | 'info' = 'danger';

	const dispatch = createEventDispatcher();

	function handleConfirm() {
		open = false;
		dispatch('confirm');
	}

	function handleCancel() {
		open = false;
		dispatch('cancel');
	}

	function handleBackdrop(e: MouseEvent) {
		if (e.target === e.currentTarget) handleCancel();
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') handleCancel();
	}

	$: variantStyles = {
		danger: {
			icon: 'text-red-400 bg-red-500/10',
			btn: 'bg-red-600 hover:bg-red-500 active:bg-red-700'
		},
		warning: {
			icon: 'text-amber-400 bg-amber-500/10',
			btn: 'bg-amber-600 hover:bg-amber-500 active:bg-amber-700'
		},
		info: {
			icon: 'text-blue-400 bg-blue-500/10',
			btn: 'bg-blue-600 hover:bg-blue-500 active:bg-blue-700'
		}
	}[variant];
</script>

<svelte:window on:keydown={handleKeydown} />

{#if open}
	<div
		class="fixed inset-0 z-[60] flex items-center justify-center p-4"
		on:click={handleBackdrop}
		role="dialog"
		aria-modal="true"
		transition:fade={{ duration: 150, easing: cubicOut }}
	>
		<div class="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>

		<div
			class="relative bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl shadow-black/40 w-full max-w-sm overflow-hidden"
			transition:fly={{ y: 40, duration: 250, easing: cubicOut }}
		>
			<div class="p-5">
				<!-- Icon -->
				<div class="w-11 h-11 rounded-xl {variantStyles.icon} flex items-center justify-center mx-auto mb-4">
					{#if variant === 'danger'}
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
						</svg>
					{:else if variant === 'warning'}
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
						</svg>
					{:else}
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
						</svg>
					{/if}
				</div>

				<!-- Title -->
				<h3 class="text-[15px] font-semibold text-zinc-100 text-center mb-1.5">{title}</h3>

				<!-- Message -->
				{#if message}
					<p class="text-sm text-zinc-400 text-center leading-relaxed">{message}</p>
				{/if}
			</div>

			<!-- Actions -->
			<div class="flex gap-2.5 px-5 pb-5">
				<button
					on:click={handleCancel}
					class="flex-1 py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-zinc-600 text-zinc-300 text-sm font-medium transition-all"
				>
					{cancelText}
				</button>
				<button
					on:click={handleConfirm}
					class="flex-1 py-2.5 px-4 rounded-xl {variantStyles.btn} text-white text-sm font-medium transition-all"
				>
					{confirmText}
				</button>
			</div>
		</div>
	</div>
{/if}
