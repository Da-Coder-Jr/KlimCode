<script lang="ts">
	import { afterUpdate, tick } from 'svelte';
	import type { Message } from '$types/core';
	import ChatMessage from './ChatMessage.svelte';
	import { isStreaming, streamingContent, inputMessage } from '$stores/chat';

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
			<div class="text-center max-w-lg">
				<div class="mb-6">
					<div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center mx-auto shadow-lg shadow-blue-500/15">
						<span class="text-white font-bold text-lg">K</span>
					</div>
				</div>

				<h2 class="text-xl font-semibold text-zinc-100 mb-2">How can I help?</h2>
				<p class="text-zinc-500 text-sm mb-8 max-w-sm mx-auto">
					I can write code, debug issues, explain concepts, and create GitHub PRs in Agent mode.
				</p>

				<div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
					{#each quickSuggestions as suggestion}
						<button
							on:click={() => useSuggestion(suggestion)}
							class="px-4 py-3 rounded-xl border border-zinc-800 hover:border-zinc-700 bg-zinc-900/30 hover:bg-zinc-900/60 text-left transition-all duration-150 group"
						>
							<span class="text-[13px] text-zinc-500 group-hover:text-zinc-300 transition-colors leading-snug">{suggestion}</span>
						</button>
					{/each}
				</div>
			</div>
		</div>
	{:else}
		<div>
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
