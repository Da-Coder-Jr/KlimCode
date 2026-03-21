<script lang="ts">
	import { afterUpdate, tick, onMount, onDestroy } from 'svelte';
	import type { Message } from '$types/core';
	import ChatMessage from './ChatMessage.svelte';
	import { isStreaming, streamingContent, inputMessage } from '$stores/chat';
	import { fade } from 'svelte/transition';

	export let messages: Message[] = [];

	let scrollContainer: HTMLDivElement;
	let shouldAutoScroll = true;
	let showScrollBtn = false;
	let resizeObserver: ResizeObserver | null = null;

	afterUpdate(async () => {
		if (shouldAutoScroll && scrollContainer) {
			await tick();
			scrollContainer.scrollTo({ top: scrollContainer.scrollHeight, behavior: 'smooth' });
		}
	});

	onMount(() => {
		// ResizeObserver for dynamic content changes - inspired by chat-ui
		if (scrollContainer) {
			resizeObserver = new ResizeObserver(() => {
				checkScrollPosition();
			});
			resizeObserver.observe(scrollContainer);
		}
	});

	onDestroy(() => {
		resizeObserver?.disconnect();
	});

	function checkScrollPosition() {
		if (!scrollContainer) return;
		const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
		const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
		shouldAutoScroll = distanceFromBottom < 100;
		showScrollBtn = distanceFromBottom > 200;
	}

	function handleScroll() {
		checkScrollPosition();
	}

	function scrollToBottom() {
		if (scrollContainer) {
			scrollContainer.scrollTo({ top: scrollContainer.scrollHeight, behavior: 'smooth' });
		}
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
		{ text: 'Write a function that validates email addresses', icon: 'code' },
		{ text: 'Explain how async/await works in JavaScript', icon: 'learn' },
		{ text: 'Create a React component with TypeScript', icon: 'component' },
		{ text: 'Help me write unit tests for my API', icon: 'test' }
	];
</script>

<div
	bind:this={scrollContainer}
	on:scroll={handleScroll}
	class="flex-1 overflow-y-auto relative"
>
	{#if messages.length === 0 && !streamingMsg}
		<!-- Empty state - polished landing inspired by both chat-ui and open-webui -->
		<div class="flex items-center justify-center h-full p-4">
			<div class="text-center max-w-lg">
				<div class="mb-6">
					<div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center mx-auto shadow-lg shadow-blue-500/15">
						<span class="text-white font-bold text-xl">K</span>
					</div>
				</div>

				<h2 class="text-xl font-semibold text-zinc-100 mb-2">How can I help?</h2>
				<p class="text-zinc-500 text-sm mb-8 max-w-sm mx-auto">
					I can write code, debug issues, explain concepts, and create GitHub PRs in Agent mode.
				</p>

				<div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
					{#each quickSuggestions as suggestion}
						<button
							on:click={() => useSuggestion(suggestion.text)}
							class="group px-4 py-3.5 rounded-xl border border-zinc-800 hover:border-zinc-700 bg-zinc-900/30 hover:bg-zinc-900/60 text-left transition-all duration-200"
						>
							<span class="text-[13px] text-zinc-500 group-hover:text-zinc-300 transition-colors leading-snug">{suggestion.text}</span>
						</button>
					{/each}
				</div>
			</div>
		</div>
	{:else}
		<div class="pb-4">
			{#each messages as message (message.id)}
				<ChatMessage {message} />
			{/each}

			{#if streamingMsg}
				<ChatMessage message={streamingMsg} isStreaming={true} />
			{/if}
		</div>
	{/if}

	<!-- Scroll to bottom button - inspired by chat-ui ScrollToBottomBtn -->
	{#if showScrollBtn}
		<button
			transition:fade={{ duration: 150 }}
			on:click={scrollToBottom}
			class="fixed bottom-32 right-6 lg:right-10 z-10 flex items-center justify-center w-10 h-10 rounded-full border border-zinc-700 bg-zinc-800 shadow-lg hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-all"
			title="Scroll to bottom"
		>
			<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
			</svg>
		</button>
	{/if}
</div>
