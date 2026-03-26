<script lang="ts">
	import { afterUpdate, tick, onMount, onDestroy, createEventDispatcher } from 'svelte';
	import type { Message } from '$types/core';
	import ChatMessage from './ChatMessage.svelte';
	import ModelSelector from './ModelSelector.svelte';
	import { isStreaming, streamingContent, inputMessage, agentSteps, activeConversation } from '$stores/chat';
	import { fade } from 'svelte/transition';

	export let messages: Message[] = [];

	const dispatch = createEventDispatcher();

	let scrollContainer: HTMLDivElement;
	let shouldAutoScroll = true;
	let showScrollBtn = false;
	let resizeObserver: ResizeObserver | null = null;
	let modelSelectorOpen = false;

	afterUpdate(async () => {
		if (shouldAutoScroll && scrollContainer) {
			await tick();
			scrollContainer.scrollTo({ top: scrollContainer.scrollHeight, behavior: 'smooth' });
		}
	});

	onMount(() => {
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

	function handleEdit(e: CustomEvent<{ messageId: string; content: string }>) {
		dispatch('edit', e.detail);
	}

	function handleRegenerate(e: CustomEvent<{ messageId: string }>) {
		dispatch('regenerate', e.detail);
	}

	$: streamingMsg = $isStreaming && $streamingContent ? {
		id: 'streaming',
		conversationId: '',
		role: 'assistant' as const,
		content: $streamingContent,
		createdAt: new Date().toISOString()
	} : null;

	// Show thinking state when streaming but no content yet
	$: thinkingMsg = $isStreaming && !$streamingContent ? {
		id: 'thinking',
		conversationId: '',
		role: 'assistant' as const,
		content: '',
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
	{#if messages.length === 0 && !streamingMsg && !thinkingMsg}
		<!-- Open WebUI-style empty state with prominent model selector -->
		<div class="flex items-center justify-center h-full p-4">
			<div class="text-center max-w-lg">
				<div class="mb-4">
					<img src="/favicon.svg" alt="KlimCode" class="w-12 h-12 mx-auto rounded-2xl shadow-soft" />
				</div>

				<!-- Prominent model selector like Open WebUI -->
				{#if $activeConversation}
					<div class="flex justify-center mb-2">
						<ModelSelector
							currentModel={$activeConversation.model}
							bind:open={modelSelectorOpen}
							variant="hero"
						/>
					</div>
					<p class="text-[13px] mb-1" style="color: var(--content-muted)">
						{#if $activeConversation.mode === 'agent'}
							Agent mode — can read, write, and search files in your repo
						{:else}
							How can I help you today?
						{/if}
					</p>
				{:else}
					<h2 class="text-xl font-semibold mb-2" style="color: var(--content)">How can I help?</h2>
				{/if}

				<div class="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-6">
					{#each quickSuggestions as suggestion}
						<button
							on:click={() => useSuggestion(suggestion.text)}
							class="group px-4 py-3.5 rounded-xl text-left transition-all duration-200 hover:bg-[var(--surface-hover)]"
							style="border: 1px solid var(--border)"
						>
							<span class="text-[13px] transition-colors leading-snug" style="color: var(--content-tertiary)">{suggestion.text}</span>
						</button>
					{/each}
				</div>
			</div>
		</div>
	{:else}
		<div class="pb-4">
			{#each messages as message (message.id)}
				<ChatMessage {message} on:edit={handleEdit} on:regenerate={handleRegenerate} />
			{/each}

			{#if streamingMsg}
				<ChatMessage message={streamingMsg} isStreaming={true} liveAgentSteps={$agentSteps} />
			{:else if thinkingMsg}
				<ChatMessage message={thinkingMsg} isStreaming={true} liveAgentSteps={$agentSteps} />
			{/if}
		</div>
	{/if}

	<!-- Scroll to bottom button -->
	{#if showScrollBtn}
		<button
			transition:fade={{ duration: 150 }}
			on:click={scrollToBottom}
			class="fixed bottom-32 right-6 lg:right-10 z-10 flex items-center justify-center w-10 h-10 rounded-full shadow-elevated transition-all"
			style="background-color: var(--surface-secondary); border: 1px solid var(--border); color: var(--content-tertiary)"
			title="Scroll to bottom"
		>
			<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
			</svg>
		</button>
	{/if}
</div>
