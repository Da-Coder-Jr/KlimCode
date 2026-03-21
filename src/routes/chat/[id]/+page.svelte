<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { selectConversation, activeConversation } from '$stores/chat';
	import ChatWindow from '$components/chat/ChatWindow.svelte';
	import Header from '$components/layout/Header.svelte';

	let showAgentPanel = false;
	let mobileSidebarOpen = false;

	onMount(async () => {
		const id = $page.params.id;
		if (id) {
			await selectConversation(id);
		}
	});

	$: if ($page.params.id && $activeConversation?.id !== $page.params.id) {
		selectConversation($page.params.id);
	}
</script>

<svelte:head>
	<title>{$activeConversation?.title || 'Chat'} - KlimCode</title>
</svelte:head>

<Header
	onToggleSidebar={() => {
		// Dispatch event to parent layout
		const event = new CustomEvent('toggleMobileSidebar', { bubbles: true });
		document.dispatchEvent(event);
	}}
	onToggleAgent={() => showAgentPanel = !showAgentPanel}
	{showAgentPanel}
/>

{#if $activeConversation}
	<ChatWindow {showAgentPanel} />
{:else}
	<div class="flex-1 flex items-center justify-center bg-mesh-subtle">
		<div class="text-center animate-fade-in">
			<div class="w-10 h-10 bg-gradient-to-br from-klim-500 to-klim-700 rounded-xl flex items-center justify-center mx-auto mb-3 animate-pulse-slow">
				<span class="text-white font-bold text-sm">K</span>
			</div>
			<p class="text-surface-500 text-sm">Loading conversation...</p>
		</div>
	</div>
{/if}
