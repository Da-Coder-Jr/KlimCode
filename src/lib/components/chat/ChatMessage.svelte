<script lang="ts">
	import type { Message } from '$types/core';
	import { renderMarkdown } from '$utils/markdown';
	import { currentUser } from '$stores/auth';
	import { createEventDispatcher, onMount } from 'svelte';

	export let message: Message;
	export let isStreaming = false;

	const dispatch = createEventDispatcher();

	let messageEl: HTMLDivElement;
	let copied = false;
	let editMode = false;
	let editText = '';

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

	function startEdit() {
		editMode = true;
		editText = message.content;
	}

	function cancelEdit() {
		editMode = false;
		editText = '';
	}

	function saveEdit() {
		if (editText.trim() && editText.trim() !== message.content) {
			dispatch('edit', { messageId: message.id, content: editText.trim() });
		}
		editMode = false;
		editText = '';
	}

	function handleEditKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') cancelEdit();
		if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
			e.preventDefault();
			saveEdit();
		}
	}

	function handleRegenerate() {
		dispatch('regenerate', { messageId: message.id });
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
	class="group relative flex w-full items-start gap-4 px-4 sm:px-6 py-5 transition-colors"
>
	<div class="max-w-3xl xl:max-w-4xl mx-auto flex gap-3.5 w-full">
		<!-- Avatar -->
		<div class="flex-shrink-0 mt-1">
			{#if isUser}
				{#if $currentUser?.avatarUrl}
					<img src={$currentUser.avatarUrl} alt="" class="w-7 h-7 rounded-full shadow-soft" />
				{:else}
					<div class="w-7 h-7 rounded-full flex items-center justify-center shadow-soft" style="background-color: var(--surface-tertiary)">
						<svg class="w-3.5 h-3.5" style="color: var(--content-tertiary)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
						</svg>
					</div>
				{/if}
			{:else}
				<img src="/favicon.svg" alt="KlimCode" class="w-7 h-7 rounded-lg shadow-soft" />
			{/if}
		</div>

		<!-- Content -->
		<div class="flex-1 min-w-0">
			<!-- Name + model label -->
			<div class="flex items-center gap-2 mb-1.5">
				<span class="text-[13px] font-semibold" style="color: var(--content)">
					{isUser ? ($currentUser?.displayName || 'You') : 'KlimCode'}
				</span>
				{#if message.model && isAssistant && !isStreaming}
					<span class="text-[11px] font-mono" style="color: var(--content-muted)">
						{message.model.split('/').pop()}
					</span>
				{/if}
			</div>

			<!-- Message content -->
			{#if isUser}
				<div class="message-content">
					{#if editMode}
						<textarea
							bind:value={editText}
							on:keydown={handleEditKeydown}
							rows="5"
							class="w-full rounded-xl bg-zinc-800 border border-zinc-700 px-4 py-3 text-[15px] text-zinc-200 resize-y focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 leading-relaxed"
						></textarea>
						<div class="flex items-center gap-2 mt-2">
							<button on:click={saveEdit} class="btn-primary text-xs py-1.5 px-3">
								Save & Submit
							</button>
							<button on:click={cancelEdit} class="text-xs font-medium py-1.5 px-3 transition-colors" style="color: var(--content-muted)">
								Cancel
							</button>
							<span class="text-[10px] text-zinc-600 ml-auto">Ctrl+Enter to save</span>
						</div>
					{:else}
						<p class="text-[15px] whitespace-pre-wrap break-words leading-relaxed" style="color: var(--content-secondary)">{message.content}</p>
					{/if}
				</div>
			{:else}
				<!-- Assistant message with bubble -->
				<div class="message-content relative rounded-2xl px-5 py-3.5" style="background-color: var(--chat-bubble-bg); border: 1px solid var(--chat-bubble-border)">
					<div class="prose-chat">
						{@html renderedContent}
					</div>

					{#if isStreaming}
						<span class="inline-flex gap-1 ml-1 align-text-bottom">
							<span class="thinking-dot w-1.5 h-1.5 rounded-full" style="background-color: var(--content-muted)"></span>
							<span class="thinking-dot w-1.5 h-1.5 rounded-full" style="background-color: var(--content-muted)"></span>
							<span class="thinking-dot w-1.5 h-1.5 rounded-full" style="background-color: var(--content-muted)"></span>
						</span>
					{/if}
				</div>
			{/if}

			<!-- Action buttons -->
			{#if !isStreaming}
				<div class="flex items-center gap-0.5 mt-2 invisible group-hover:visible transition-all duration-150">
					<button
						on:click={handleCopy}
						class="p-1.5 rounded-lg transition-all btn-icon"
						title="Copy message"
					>
						{#if copied}
							<svg class="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
							</svg>
						{:else}
							<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
							</svg>
						{/if}
					</button>

					{#if isUser && !editMode}
						<button
							on:click={startEdit}
							class="p-1.5 rounded-lg transition-all btn-icon"
							title="Edit message"
						>
							<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
							</svg>
						</button>
					{/if}

					<!-- Retry/Regenerate button (for assistant messages) - inspired by chat-ui -->
					{#if isAssistant}
						<button
							on:click={handleRegenerate}
							class="p-1.5 rounded-lg text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800/60 transition-all"
							title="Regenerate response"
						>
							<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
							</svg>
						</button>
					{/if}

					{#if message.tokens && isAssistant}
						<span class="text-[10px] ml-1.5 font-mono" style="color: var(--content-muted)">
							{(message.tokens.prompt || 0) + (message.tokens.completion || 0)} tokens
						</span>
					{/if}
				</div>
			{/if}
		</div>
	</div>
</div>
