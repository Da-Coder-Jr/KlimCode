<script lang="ts">
	import { activeConversation } from '$stores/chat';
	import ModelSelector from '$components/chat/ModelSelector.svelte';

	export let onToggleSidebar: () => void = () => {};
	export let onToggleAgent: () => void = () => {};
	export let showAgentPanel = false;

	let modelSelectorOpen = false;
</script>

<header class="h-12 border-b border-zinc-800/60 bg-zinc-950/90 backdrop-blur-xl flex items-center justify-between px-4 flex-shrink-0 z-10">
	<div class="flex items-center gap-3 min-w-0">
		{#if $activeConversation}
			<div class="flex items-center gap-2.5 min-w-0">
				{#if $activeConversation.mode === 'agent'}
					<span class="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 flex-shrink-0">
						<div class="w-1 h-1 rounded-full bg-emerald-400 animate-pulse-slow"></div>
						Agent
					</span>
				{:else}
					<span class="inline-flex items-center gap-1.5 text-[11px] font-medium text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20 flex-shrink-0">
						Chat
					</span>
				{/if}
				<h1 class="text-zinc-400 text-sm truncate">
					{$activeConversation.title}
				</h1>
			</div>
		{:else}
			<div class="flex items-center gap-2">
				<span class="text-zinc-300 font-medium text-sm">KlimCode</span>
			</div>
		{/if}
	</div>

	<div class="flex items-center gap-1.5">
		{#if $activeConversation}
			<ModelSelector
				currentModel={$activeConversation.model}
				bind:open={modelSelectorOpen}
			/>
		{/if}

		{#if $activeConversation?.mode === 'agent'}
			<button
				on:click={onToggleAgent}
				class="p-2 rounded-lg transition-all duration-150
					{showAgentPanel
						? 'bg-blue-600 text-white'
						: 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'}"
				title="Toggle Agent Panel"
			>
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
				</svg>
			</button>
		{/if}
	</div>
</header>
