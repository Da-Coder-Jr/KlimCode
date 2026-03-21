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
		<div class="text-center">
			<div class="w-8 h-8 rounded-xl bg-zinc-800 flex items-center justify-center mx-auto mb-3">
				<svg class="w-4 h-4 text-zinc-500 animate-spin" fill="none" viewBox="0 0 24 24">
					<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
					<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
				</svg>
			</div>
			<p class="text-zinc-600 text-sm">Loading conversation...</p>
		</div>
	</div>
{/if}
