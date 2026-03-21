<script lang="ts">
	import type { Message } from '$types/core';
	import { renderMarkdown } from '$utils/markdown';
	import { currentUser } from '$stores/auth';
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
	class="group py-5 px-4 sm:px-6 transition-colors {isUser ? '' : 'bg-zinc-900/30'}"
>
	<div class="max-w-3xl mx-auto flex gap-3.5">
		<!-- Avatar -->
		<div class="flex-shrink-0 pt-0.5">
			{#if isUser}
				{#if $currentUser?.avatarUrl}
					<img src={$currentUser.avatarUrl} alt="" class="w-7 h-7 rounded-lg" />
				{:else}
					<div class="w-7 h-7 rounded-lg bg-gradient-to-br from-zinc-600 to-zinc-700 flex items-center justify-center">
						<svg class="w-3.5 h-3.5 text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
						</svg>
					</div>
				{/if}
			{:else}
				<div class="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-sm shadow-blue-500/20">
					<span class="text-white font-bold text-[10px]">K</span>
				</div>
			{/if}
		</div>

		<!-- Content -->
		<div class="flex-1 min-w-0">
			<div class="flex items-center gap-2 mb-1.5">
				<span class="text-[13px] font-semibold {isUser ? 'text-zinc-200' : 'text-zinc-100'}">
					{isUser ? ($currentUser?.displayName || 'You') : 'KlimCode'}
				</span>
				{#if message.model && isAssistant && !isStreaming}
					<span class="text-[11px] text-zinc-600 font-mono">
						{message.model.split('/').pop()}
					</span>
				{/if}
			</div>

			<div class="message-content">
				{#if isUser}
					<p class="text-[15px] text-zinc-300 whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
				{:else}
					<div class="prose-chat">
						{@html renderedContent}
					</div>
				{/if}

				{#if isStreaming}
					<span class="inline-block w-[3px] h-[18px] bg-blue-400 animate-pulse ml-0.5 align-text-bottom rounded-full"></span>
				{/if}
			</div>

			<!-- Actions -->
			{#if !isStreaming && isAssistant}
				<div class="flex items-center gap-1 mt-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
					<button
						on:click={handleCopy}
						class="text-[11px] text-zinc-600 hover:text-zinc-400 flex items-center gap-1 px-2 py-1 rounded-md hover:bg-zinc-800 transition-all"
					>
						{#if copied}
							<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
							</svg>
							Copied
						{:else}
							<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
							</svg>
							Copy
						{/if}
					</button>

					{#if message.tokens}
						<span class="text-[10px] text-zinc-700 ml-1">
							{(message.tokens.prompt || 0) + (message.tokens.completion || 0)} tokens
						</span>
					{/if}
				</div>
			{/if}
		</div>
	</div>
</div>
