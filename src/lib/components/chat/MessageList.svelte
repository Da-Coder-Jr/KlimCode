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
		{ text: 'Write a function that validates email addresses', icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
		{ text: 'Explain how async/await works in JavaScript', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
		{ text: 'Create a React component with TypeScript', icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4' },
		{ text: 'Help me write unit tests for my API', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' }
	];
</script>

<div
	bind:this={scrollContainer}
	on:scroll={handleScroll}
	class="flex-1 overflow-y-auto"
>
	{#if messages.length === 0 && !streamingMsg}
		<div class="flex items-center justify-center h-full p-6">
			<div class="text-center max-w-lg animate-fade-in">
				<div class="relative mb-8 inline-flex">
					<div class="w-16 h-16 bg-gradient-to-br from-klim-400 via-klim-600 to-klim-800 rounded-2xl flex items-center justify-center shadow-glow">
						<span class="text-white font-black text-2xl">K</span>
					</div>
					<div class="absolute -bottom-1 -right-1">
						<div class="w-5 h-5 bg-emerald-500 rounded-full border-2 border-surface-950 flex items-center justify-center">
							<svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
							</svg>
						</div>
					</div>
				</div>

				<h2 class="text-xl font-bold text-surface-100 mb-2">What can I help you build?</h2>
				<p class="text-surface-400 text-sm mb-8 leading-relaxed">
					I can write code, debug issues, explain concepts, and create GitHub PRs.
				</p>

				<div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
					{#each quickSuggestions as suggestion}
						<button
							on:click={() => useSuggestion(suggestion.text)}
							class="flex items-start gap-3 px-4 py-3 rounded-xl border border-surface-800/50 hover:border-surface-700/60 bg-surface-900/20 hover:bg-surface-800/30 text-left transition-all duration-200 group active:scale-[0.98]"
						>
							<svg class="w-4 h-4 text-surface-600 group-hover:text-klim-400 mt-0.5 flex-shrink-0 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d={suggestion.icon} />
							</svg>
							<span class="text-sm text-surface-400 group-hover:text-surface-200 transition-colors leading-relaxed">{suggestion.text}</span>
						</button>
					{/each}
				</div>
			</div>
		</div>
	{:else}
		<div class="divide-y divide-surface-800/20">
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
