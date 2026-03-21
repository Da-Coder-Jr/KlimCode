<script lang="ts">
	import { activeConversation } from '$stores/chat';
	import { settings } from '$stores/settings';
	import { AVAILABLE_MODELS } from '$lib/server/ai/nvidia';

	export let onToggleSidebar: () => void = () => {};
	export let onToggleAgent: () => void = () => {};
	export let showAgentPanel = false;

	$: currentModel = $activeConversation?.model || $settings.defaultModel;
	$: modelInfo = AVAILABLE_MODELS?.find(m => m.id === currentModel);
</script>

<header class="h-14 border-b border-surface-700 bg-surface-900/80 backdrop-blur-sm flex items-center justify-between px-4 flex-shrink-0">
	<div class="flex items-center gap-3">
		<button on:click={onToggleSidebar} class="lg:hidden text-surface-400 hover:text-surface-200 p-1.5 rounded-lg hover:bg-surface-800">
			<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
			</svg>
		</button>

		{#if $activeConversation}
			<div class="flex items-center gap-2">
				{#if $activeConversation.mode === 'agent'}
					<span class="badge-success">Agent</span>
				{:else}
					<span class="badge-klim">Chat</span>
				{/if}
				<h1 class="text-surface-200 font-medium text-sm truncate max-w-md">
					{$activeConversation.title}
				</h1>
			</div>
		{:else}
			<h1 class="text-surface-200 font-medium">KlimCode</h1>
		{/if}
	</div>

	<div class="flex items-center gap-2">
		{#if $activeConversation}
			<div class="hidden sm:flex items-center gap-1.5 text-xs text-surface-400 bg-surface-800 rounded-lg px-3 py-1.5">
				<div class="w-2 h-2 rounded-full bg-emerald-500"></div>
				<span class="truncate max-w-[200px]">{currentModel?.split('/').pop() || 'Unknown'}</span>
			</div>
		{/if}

		{#if $activeConversation?.mode === 'agent'}
			<button
				on:click={onToggleAgent}
				class="p-2 rounded-lg transition-colors {showAgentPanel ? 'bg-klim-600 text-white' : 'text-surface-400 hover:text-surface-200 hover:bg-surface-800'}"
				title="Toggle Agent Panel"
			>
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
				</svg>
			</button>
		{/if}
	</div>
</header>
