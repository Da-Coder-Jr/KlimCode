<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';
	import { selectConversation, activeConversation, activeConversationId, messages, agentSteps } from '$stores/chat';
	import ChatWindow from '$components/chat/ChatWindow.svelte';
	import Header from '$components/layout/Header.svelte';

	// Track which ID we're currently loading to avoid duplicate fetches
	let loadingId: string | null = null;

	async function loadIfNeeded(id: string) {
		if (!id || loadingId === id || get(activeConversationId) === id) return;
		loadingId = id;
		messages.set([]);
		agentSteps.set([]);
		await selectConversation(id);
		loadingId = null;
	}

	onMount(() => {
		loadIfNeeded($page.params.id);
	});

	// Fires when the URL changes (navigating between chats)
	$: loadIfNeeded($page.params.id);
</script>

<svelte:head>
	<title>{$activeConversation?.title || 'Chat'} — KlimCode</title>
</svelte:head>

<div class="flex flex-col flex-1 min-h-0 overflow-hidden">
	<Header />

	{#if $activeConversation}
		<div class="flex-1 min-h-0 overflow-hidden">
			<ChatWindow />
		</div>
	{:else}
		<div class="flex-1 flex items-center justify-center">
			<div class="text-center">
				<div class="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3" style="background-color: var(--surface-secondary)">
					<svg class="w-5 h-5 animate-spin" style="color: var(--content-muted)" fill="none" viewBox="0 0 24 24">
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
						<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
					</svg>
				</div>
				<p class="text-sm" style="color: var(--content-muted)">Loading conversation...</p>
			</div>
		</div>
	{/if}
</div>
