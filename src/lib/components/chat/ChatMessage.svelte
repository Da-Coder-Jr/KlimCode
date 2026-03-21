<script lang="ts">
	import type { Message } from '$types/core';
	import { renderMarkdown } from '$utils/markdown';
	import { formatRelativeTime } from '$utils/formatting';
	import { onMount } from 'svelte';

	export let message: Message;
	export let isStreaming = false;

	let messageEl: HTMLDivElement;
	let copied = false;

	$: renderedContent = message.role === 'assistant'
		? renderMarkdown(message.content)
		: message.content;

	$: isUser = message.role === 'user';
	$: isAssistant = message.role === 'assistant';

	function handleCopy() {
		navigator.clipboard.writeText(message.content);
		copied = true;
		setTimeout(() => { copied = false; }, 2000);
	}

	onMount(() => {
		// Attach copy handlers to code blocks
		if (messageEl) {
			messageEl.querySelectorAll('.code-copy-btn').forEach((btn) => {
				btn.addEventListener('click', () => {
					const code = (btn as HTMLElement).dataset.code || '';
					navigator.clipboard.writeText(code);
					btn.textContent = 'Copied!';
					setTimeout(() => { btn.textContent = 'Copy'; }, 2000);
				});
			});
		}
	});
</script>

<div
	bind:this={messageEl}
	class="group px-4 py-5 transition-colors duration-100
		{isUser ? 'bg-transparent' : 'bg-surface-800/30'}"
>
	<div class="max-w-4xl mx-auto flex gap-4">
		<!-- Avatar -->
		<div class="flex-shrink-0 mt-0.5">
			{#if isUser}
				<div class="w-8 h-8 rounded-lg bg-klim-700 flex items-center justify-center">
					<svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
					</svg>
				</div>
			{:else}
				<div class="w-8 h-8 rounded-lg bg-gradient-to-br from-klim-500 to-klim-700 flex items-center justify-center glow-klim">
					<span class="text-white font-bold text-xs">K</span>
				</div>
			{/if}
		</div>

		<!-- Content -->
		<div class="flex-1 min-w-0">
			<div class="flex items-center gap-2 mb-1">
				<span class="text-sm font-medium {isUser ? 'text-klim-300' : 'text-surface-200'}">
					{isUser ? 'You' : 'KlimCode'}
				</span>
				<span class="text-xs text-surface-500">
					{formatRelativeTime(message.createdAt)}
				</span>
				{#if message.model && isAssistant}
					<span class="text-xs text-surface-600 hidden sm:inline">
						{message.model.split('/').pop()}
					</span>
				{/if}
			</div>

			<div class="message-content">
				{#if isUser}
					<p class="text-surface-200 whitespace-pre-wrap break-words">{message.content}</p>
				{:else}
					<div class="prose-klim">
						{@html renderedContent}
					</div>
				{/if}

				{#if isStreaming}
					<span class="inline-block w-2 h-4 bg-klim-400 animate-pulse ml-0.5 align-text-bottom"></span>
				{/if}
			</div>

			<!-- Actions -->
			{#if !isStreaming}
				<div class="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
					<button
						on:click={handleCopy}
						class="text-xs text-surface-500 hover:text-surface-300 flex items-center gap-1 px-2 py-1 rounded hover:bg-surface-700"
					>
						<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							{#if copied}
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
							{:else}
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
							{/if}
						</svg>
						{copied ? 'Copied' : 'Copy'}
					</button>

					{#if message.tokens}
						<span class="text-xs text-surface-600">
							{(message.tokens.prompt || 0) + (message.tokens.completion || 0)} tokens
						</span>
					{/if}
				</div>
			{/if}
		</div>
	</div>
</div>

<style>
	:global(.code-block-wrapper) {
		margin: 1rem 0;
		border-radius: 0.75rem;
		overflow: hidden;
		border: 1px solid theme('colors.surface.700');
	}

	:global(.code-block-header) {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.5rem 1rem;
		background: theme('colors.surface.800');
		border-bottom: 1px solid theme('colors.surface.700');
	}

	:global(.code-block-lang) {
		font-size: 0.75rem;
		color: theme('colors.surface.400');
		font-family: theme('fontFamily.mono');
	}

	:global(.code-copy-btn) {
		font-size: 0.75rem;
		color: theme('colors.surface.400');
		cursor: pointer;
		background: none;
		border: none;
		padding: 0.25rem 0.5rem;
		border-radius: 0.375rem;
		transition: all 0.15s;
	}

	:global(.code-copy-btn:hover) {
		color: theme('colors.surface.200');
		background: theme('colors.surface.700');
	}

	:global(.code-block) {
		margin: 0 !important;
		border: none !important;
		border-radius: 0 !important;
		padding: 1rem !important;
		background: theme('colors.surface.900') !important;
		overflow-x: auto;
	}

	:global(.table-wrapper) {
		overflow-x: auto;
		margin: 1rem 0;
		border-radius: 0.5rem;
		border: 1px solid theme('colors.surface.700');
	}
</style>
