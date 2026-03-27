<script lang="ts">
	import { afterUpdate, tick, onMount, onDestroy, createEventDispatcher } from 'svelte';
	import type { Message } from '$types/core';
	import ChatMessage from './ChatMessage.svelte';
	import ModelSelector from './ModelSelector.svelte';
	import { isStreaming, streamingContent, inputMessage, agentSteps, activeConversation } from '$stores/chat';
	import { githubConnected, selectedRepo } from '$stores/github';
	import RepoSelector from '$components/github/RepoSelector.svelte';
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
					{#if $activeConversation.mode === 'agent'}
						<div class="mt-3 max-w-xs mx-auto">
							{#if $githubConnected}
								<RepoSelector />
							{:else}
								<a
									href="/api/github/connect"
									class="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
									style="background-color: var(--surface-secondary); border: 1px solid var(--border); color: var(--content-secondary)"
								>
									<svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
									Connect GitHub
								</a>
							{/if}
						</div>
					{/if}
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
