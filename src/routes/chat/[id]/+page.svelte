<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { selectConversation, activeConversation } from '$stores/chat';
	import ChatWindow from '$components/chat/ChatWindow.svelte';
	import Header from '$components/layout/Header.svelte';

	let showAgentPanel = false;

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
	<title>{$activeConversation?.title || 'Chat'} — KlimCode</title>
</svelte:head>

<Header
	onToggleAgent={() => showAgentPanel = !showAgentPanel}
	{showAgentPanel}
/>

{#if $activeConversation}
	<ChatWindow {showAgentPanel} />
{:else}
	<div class="flex-1 flex items-center justify-center">
		<p class="text-surface-500">Loading conversation...</p>
	</div>
{/if}
