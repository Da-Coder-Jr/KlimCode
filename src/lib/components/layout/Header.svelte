<script lang="ts">
	import { activeConversation, messages } from '$stores/chat';
	import { currentUser } from '$stores/auth';
	import ModelSelector from '$components/chat/ModelSelector.svelte';

	export let onToggleSidebar: () => void = () => {};
	export let onToggleAgent: () => void = () => {};
	export let showAgentPanel = false;

	let modelSelectorOpen = false;
</script>

<header class="sticky top-0 z-30 w-full pt-0.5 pb-1 flex-shrink-0">
	<div class="navbar-gradient pb-4">
		<div class="flex items-center justify-between px-4 h-12">
			<div class="flex items-center gap-3 min-w-0">
				{#if $activeConversation}
					<div class="flex items-center gap-2.5 min-w-0 ml-10 md:ml-10">
						{#if $activeConversation.mode === 'agent'}
							<span class="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 flex-shrink-0">
								<div class="w-1 h-1 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse-slow"></div>
								Agent
							</span>
						{:else}
							<span class="inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-md flex-shrink-0" style="color: var(--content-tertiary); background-color: var(--surface-tertiary); border: 1px solid var(--border)">
								Chat
							</span>
						{/if}
						<h1 class="text-sm truncate" style="color: var(--content-tertiary)">
							{$activeConversation.title}
						</h1>
					</div>
				{:else}
					<div class="flex items-center gap-2 ml-10 md:ml-10">
						<span class="font-medium text-sm" style="color: var(--content-secondary)">KlimCode</span>
					</div>
				{/if}
			</div>

			<div class="flex items-center gap-1.5 flex-shrink-0">
				{#if $activeConversation}
					<ModelSelector
						currentModel={$activeConversation.model}
						bind:open={modelSelectorOpen}
					/>
				{/if}

				{#if $activeConversation?.mode === 'agent'}
					<button
						on:click={onToggleAgent}
						class="p-2 rounded-lg transition-all duration-150"
						class:bg-emerald-500={showAgentPanel}
						class:text-white={showAgentPanel}
						style="{!showAgentPanel ? 'color: var(--content-muted)' : ''}"
						title="Toggle Agent Panel"
					>
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
						</svg>
					</button>
				{/if}
			</div>
		</div>
	</div>
</header>
