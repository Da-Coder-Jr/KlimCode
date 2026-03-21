<script lang="ts">
	import { afterUpdate, tick } from 'svelte';
	import type { Message } from '$types/core';
	import ChatMessage from './ChatMessage.svelte';
	import { isStreaming, streamingContent } from '$stores/chat';

	export let messages: Message[] = [];

	let scrollContainer: HTMLDivElement;
	let shouldAutoScroll = true;

	afterUpdate(async () => {
		if (shouldAutoScroll && scrollContainer) {
			await tick();
			scrollContainer.scrollTop = scrollContainer.scrollHeight;
		}
	});

	function handleScroll() {
		if (!scrollContainer) return;
		const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
		shouldAutoScroll = scrollHeight - scrollTop - clientHeight < 100;
	}

	$: streamingMsg = $isStreaming && $streamingContent ? {
		id: 'streaming',
		conversationId: '',
		role: 'assistant' as const,
		content: $streamingContent,
		createdAt: new Date().toISOString()
	} : null;
</script>

<div
	bind:this={scrollContainer}
	on:scroll={handleScroll}
	class="flex-1 overflow-y-auto"
>
	{#if messages.length === 0 && !streamingMsg}
		<div class="flex items-center justify-center h-full">
			<div class="text-center px-4">
				<div class="w-16 h-16 bg-gradient-to-br from-klim-500 to-klim-700 rounded-2xl flex items-center justify-center mx-auto mb-6 glow-klim-lg">
					<span class="text-white font-bold text-2xl">K</span>
				</div>
				<h2 class="text-2xl font-semibold text-surface-200 mb-2">Welcome to KlimCode</h2>
				<p class="text-surface-400 max-w-md mx-auto mb-8">
					AI-powered coding assistant with agent capabilities. Ask questions, write code, or let the agent build features and create pull requests.
				</p>
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto">
					<button class="card-hover p-4 text-left" on:click={() => {}}>
						<div class="text-sm font-medium text-surface-200 mb-1">Write a function</div>
						<div class="text-xs text-surface-400">that validates email addresses with RFC 5322</div>
					</button>
					<button class="card-hover p-4 text-left" on:click={() => {}}>
						<div class="text-sm font-medium text-surface-200 mb-1">Debug this error</div>
						<div class="text-xs text-surface-400">TypeError: Cannot read property of undefined</div>
					</button>
					<button class="card-hover p-4 text-left" on:click={() => {}}>
						<div class="text-sm font-medium text-surface-200 mb-1">Refactor a component</div>
						<div class="text-xs text-surface-400">to use composition pattern instead of inheritance</div>
					</button>
					<button class="card-hover p-4 text-left" on:click={() => {}}>
						<div class="text-sm font-medium text-surface-200 mb-1">Create a REST API</div>
						<div class="text-xs text-surface-400">with authentication and CRUD operations</div>
					</button>
				</div>
			</div>
		</div>
	{:else}
		<div class="divide-y divide-surface-800/50">
			{#each messages as message (message.id)}
				<ChatMessage {message} />
			{/each}

			{#if streamingMsg}
				<ChatMessage message={streamingMsg} isStreaming={true} />
			{/if}
		</div>
		<div class="h-4" />
	{/if}
</div>
