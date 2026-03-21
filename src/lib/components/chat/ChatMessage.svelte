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
	class="group px-4 py-6 transition-colors duration-150
		{isUser ? 'bg-transparent' : 'bg-surface-800/15'}"
>
	<div class="max-w-3xl mx-auto flex gap-3.5">
		<!-- Avatar -->
		<div class="flex-shrink-0 mt-1">
			{#if isUser}
				<div class="w-8 h-8 rounded-xl bg-gradient-to-br from-surface-600 to-surface-700 flex items-center justify-center shadow-sm">
					<svg class="w-4 h-4 text-surface-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
					</svg>
				</div>
			{:else}
				<div class="w-8 h-8 rounded-xl bg-gradient-to-br from-klim-500 to-klim-700 flex items-center justify-center shadow-glow-sm">
					<span class="text-white font-bold text-xs">K</span>
				</div>
			{/if}
		</div>

		<!-- Content -->
		<div class="flex-1 min-w-0">
			<div class="flex items-center gap-2 mb-1.5">
				<span class="text-sm font-semibold {isUser ? 'text-surface-200' : 'text-surface-100'}">
					{isUser ? 'You' : 'KlimCode'}
				</span>
				<span class="text-2xs text-surface-500">
					{formatRelativeTime(message.createdAt)}
				</span>
				{#if message.model && isAssistant}
					<span class="text-2xs text-surface-600 hidden sm:inline bg-surface-800/50 px-1.5 py-0.5 rounded-md">
						{message.model.split('/').pop()}
					</span>
				{/if}
			</div>

			<div class="message-content">
				{#if isUser}
					<p class="text-surface-200 whitespace-pre-wrap break-words leading-7">{message.content}</p>
				{:else}
					<div class="prose-klim">
						{@html renderedContent}
					</div>
				{/if}

				{#if isStreaming}
					<span class="inline-block w-2 h-5 bg-klim-400 animate-pulse ml-0.5 align-text-bottom rounded-full"></span>
				{/if}
			</div>

			<!-- Actions -->
			{#if !isStreaming}
				<div class="flex items-center gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
					<button
						on:click={handleCopy}
						class="text-xs text-surface-500 hover:text-surface-300 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-surface-800/60 transition-all"
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
						<span class="text-2xs text-surface-600 bg-surface-800/40 px-2 py-1 rounded-md">
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
		border-radius: 0.875rem;
		overflow: hidden;
		border: 1px solid rgba(51, 65, 85, 0.5);
	}

	:global(.code-block-header) {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.625rem 1rem;
		background: rgba(30, 41, 59, 0.8);
		border-bottom: 1px solid rgba(51, 65, 85, 0.4);
	}

	:global(.code-block-lang) {
		font-size: 0.7rem;
		color: rgba(148, 163, 184, 0.8);
		font-family: 'JetBrains Mono', monospace;
		text-transform: lowercase;
	}

	:global(.code-copy-btn) {
		font-size: 0.7rem;
		color: rgba(148, 163, 184, 0.7);
		cursor: pointer;
		background: none;
		border: none;
		padding: 0.25rem 0.625rem;
		border-radius: 0.5rem;
		transition: all 0.15s;
	}

	:global(.code-copy-btn:hover) {
		color: rgba(226, 232, 240, 1);
		background: rgba(51, 65, 85, 0.5);
	}

	:global(.code-block) {
		margin: 0 !important;
		border: none !important;
		border-radius: 0 !important;
		padding: 1rem 1.25rem !important;
		background: rgba(15, 23, 42, 0.95) !important;
		overflow-x: auto;
		font-size: 0.8125rem;
		line-height: 1.6;
	}

	:global(.table-wrapper) {
		overflow-x: auto;
		margin: 1rem 0;
		border-radius: 0.75rem;
		border: 1px solid rgba(51, 65, 85, 0.5);
	}
</style>
