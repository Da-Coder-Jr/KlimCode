<script lang="ts">
	import { afterUpdate, tick } from 'svelte';
	import type { Message } from '$types/core';
	import ChatMessage from './ChatMessage.svelte';
	import { isStreaming, streamingContent, inputMessage } from '$stores/chat';
	import { createEventDispatcher } from 'svelte';

	export let messages: Message[] = [];

	const dispatch = createEventDispatcher();
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

	function useSuggestion(text: string) {
		inputMessage.set(text);
	}

	$: streamingMsg = $isStreaming && $streamingContent ? {
		id: 'streaming',
		conversationId: '',
		role: 'assistant' as const,
		content: $streamingContent,
		createdAt: new Date().toISOString()
	} : null;

	const quickSuggestions = [
		'Write a function that validates email addresses',
		'Explain how async/await works in JavaScript',
		'Create a React component with TypeScript',
		'Help me write unit tests for my API'
	];
</script>

<div
	bind:this={scrollContainer}
	on:scroll={handleScroll}
	class="flex-1 overflow-y-auto"
>
	{#if messages.length === 0 && !streamingMsg}
		<div class="flex items-center justify-center h-full p-4">
			<div class="text-center max-w-xl">
				<div class="relative mb-8">
					<div class="w-16 h-16 bg-gradient-to-br from-klim-400 via-klim-600 to-klim-800 rounded-2xl flex items-center justify-center mx-auto shadow-xl shadow-klim-500/20">
						<span class="text-white font-black text-2xl">K</span>
					</div>
					<div class="absolute -bottom-1 -right-1 left-1/2 ml-3">
						<div class="w-5 h-5 bg-emerald-500 rounded-full border-2 border-surface-950 flex items-center justify-center">
							<svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
							</svg>
						</div>
					</div>
				</div>

				<h2 class="text-2xl font-bold text-surface-100 mb-2">What can I help you build?</h2>
				<p class="text-surface-400 mb-8">
					I can write code, debug issues, explain concepts, and in Agent mode — create GitHub PRs.
				</p>

				<div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
					{#each quickSuggestions as suggestion}
						<button
							on:click={() => useSuggestion(suggestion)}
							class="px-4 py-3 rounded-xl border border-surface-800 hover:border-surface-600 bg-surface-900/30 hover:bg-surface-800/50 text-left transition-all duration-200 group"
						>
							<span class="text-sm text-surface-400 group-hover:text-surface-200 transition-colors">{suggestion}</span>
						</button>
					{/each}
				</div>
			</div>
		</div>
	{:else}
		<div class="divide-y divide-surface-800/30">
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
