<script lang="ts">
	import { activeConversation } from '$stores/chat';
	import ModelSelector from '$components/chat/ModelSelector.svelte';

	export let onToggleSidebar: () => void = () => {};
	export let onToggleAgent: () => void = () => {};
	export let showAgentPanel = false;

	let modelSelectorOpen = false;
</script>

<header class="h-14 border-b border-surface-700/50 bg-surface-950/80 backdrop-blur-xl flex items-center justify-between px-4 flex-shrink-0 z-10">
	<div class="flex items-center gap-3">
		<button on:click={onToggleSidebar} class="lg:hidden text-surface-400 hover:text-surface-200 p-1.5 rounded-lg hover:bg-surface-800">
			<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
			</svg>
		</button>

		{#if $activeConversation}
			<div class="flex items-center gap-2.5">
				{#if $activeConversation.mode === 'agent'}
					<div class="flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md">
						<div class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-slow"></div>
						Agent
					</div>
				{:else}
					<div class="flex items-center gap-1.5 text-xs font-medium text-klim-400 bg-klim-500/10 px-2 py-1 rounded-md">
						<div class="w-1.5 h-1.5 rounded-full bg-klim-400"></div>
						Chat
					</div>
				{/if}
				<h1 class="text-surface-300 text-sm truncate max-w-[300px]">
					{$activeConversation.title}
				</h1>
			</div>
		{:else}
			<div class="flex items-center gap-2">
				<div class="w-6 h-6 bg-gradient-to-br from-klim-500 to-klim-700 rounded-md flex items-center justify-center">
					<span class="text-white font-bold text-[10px]">K</span>
				</div>
				<span class="text-surface-200 font-semibold text-sm">KlimCode</span>
			</div>
		{/if}
	</div>

	<div class="flex items-center gap-2">
		{#if $activeConversation}
			<ModelSelector
				currentModel={$activeConversation.model}
				bind:open={modelSelectorOpen}
			/>
		{/if}

		{#if $activeConversation?.mode === 'agent'}
			<button
				on:click={onToggleAgent}
				class="p-2 rounded-lg transition-all duration-200
					{showAgentPanel
						? 'bg-klim-600 text-white shadow-lg shadow-klim-500/20'
						: 'text-surface-400 hover:text-surface-200 hover:bg-surface-800'}"
				title="Toggle Agent Panel"
			>
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
				</svg>
			</button>
		{/if}
	</div>
</header>
