<script lang="ts">
	import type { Message, AgentStep } from '$types/core';
	import { renderMarkdown } from '$utils/markdown';
	import { currentUser } from '$stores/auth';
	import { createEventDispatcher } from 'svelte';
	import InlineToolStep from './InlineToolStep.svelte';

	export let message: Message;
	export let isStreaming = false;
	export let liveAgentSteps: AgentStep[] = [];

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

	function handleMessageClick(e: MouseEvent) {
		const target = e.target as HTMLElement;
		const btn = target.closest('.code-copy-btn') as HTMLElement | null;
		if (btn) {
			e.preventDefault();
			const code = btn.dataset.code || '';
			navigator.clipboard.writeText(code);
			const label = btn.querySelector('.code-copy-label');
			if (label) {
				label.textContent = 'Copied!';
				setTimeout(() => { if (label) label.textContent = 'Copy'; }, 2000);
			}
		}
	}
</script>

<div
	bind:this={messageEl}
	on:click={handleMessageClick}
	class="group relative w-full px-4 sm:px-6 py-3"
>
	<div class="max-w-3xl xl:max-w-4xl mx-auto">
		{#if isUser}
			<!-- User message: right-aligned bubble -->
			<div class="flex justify-end">
				<div class="max-w-[85%]">
					{#if editMode}
						<div class="rounded-3xl px-5 py-3" style="background-color: var(--chat-bubble-bg)">
							<textarea
								bind:value={editText}
								on:keydown={handleEditKeydown}
								rows="5"
								class="w-full bg-transparent rounded-xl px-0 py-0 text-[15px] resize-y focus:outline-none leading-relaxed"
								style="color: var(--content)"
							></textarea>
							<div class="flex items-center gap-2 mt-2">
								<button on:click={cancelEdit} class="text-xs font-medium py-1.5 px-3 rounded-lg transition-colors" style="color: var(--content-muted)">
									Cancel
								</button>
								<button on:click={saveEdit} class="text-xs font-medium py-1.5 px-3 rounded-lg transition-all" style="background-color: var(--content); color: var(--surface)">
									Save & Submit
								</button>
							</div>
						</div>
					{:else}
						<div class="rounded-3xl px-4 py-2.5" style="background-color: var(--chat-bubble-bg)">
							<p class="text-[15px] whitespace-pre-wrap break-words leading-relaxed" style="color: var(--content)">{message.content}</p>
						</div>
					{/if}

					<!-- User action buttons -->
					{#if !isStreaming && !editMode}
						<div class="flex items-center justify-end gap-0.5 mt-1 invisible group-hover:visible transition-all">
							<button on:click={startEdit} class="p-1.5 rounded-lg transition-all hover:bg-black/5 dark:hover:bg-white/5" title="Edit">
								<svg class="w-3.5 h-3.5" style="color: var(--content-muted)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
								</svg>
							</button>
							<button on:click={handleCopy} class="p-1.5 rounded-lg transition-all hover:bg-black/5 dark:hover:bg-white/5" title="Copy">
								{#if copied}
									<svg class="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
									</svg>
								{:else}
									<svg class="w-3.5 h-3.5" style="color: var(--content-muted)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
									</svg>
								{/if}
							</button>
						</div>
					{/if}
				</div>
			</div>
		{:else}
			<!-- Assistant message: left-aligned, no bubble, with avatar -->
			<div class="flex gap-3.5 w-full">
				<!-- Avatar -->
				<div class="flex-shrink-0 mt-0.5">
					<img src="/favicon.svg" alt="KlimCode" class="w-8 h-8 rounded-full" />
				</div>

				<!-- Content -->
				<div class="flex-1 min-w-0">
					<!-- Name + model -->
					<div class="flex items-center gap-2 mb-1">
						<span class="text-sm font-medium" style="color: var(--content)">KlimCode</span>
						{#if message.model && !isStreaming}
							<span class="text-[11px] font-mono invisible group-hover:visible transition-all" style="color: var(--content-muted)">
								{message.model.split('/').pop()}
							</span>
						{/if}
					</div>

					<!-- Message body -->
					<div class="prose-chat">
						{@html renderedContent}
					</div>

					<!-- Thinking dots -->
					{#if isStreaming && !message.content && liveAgentSteps.length === 0}
						<div class="flex items-center gap-1 py-2">
							<span class="thinking-dot w-1.5 h-1.5 rounded-full" style="background-color: var(--content-muted)"></span>
							<span class="thinking-dot w-1.5 h-1.5 rounded-full" style="background-color: var(--content-muted)"></span>
							<span class="thinking-dot w-1.5 h-1.5 rounded-full" style="background-color: var(--content-muted)"></span>
						</div>
					{/if}

					<!-- Inline tool steps (live) -->
					{#if liveAgentSteps.length > 0}
						<div class="mt-2 space-y-0">
							{#each liveAgentSteps as step (step.id)}
								<InlineToolStep {step} />
							{/each}
						</div>
					{/if}

					<!-- Inline tool steps (saved) -->
					{#if !isStreaming && message.metadata?.agentSteps && message.metadata.agentSteps.length > 0}
						<div class="mt-2 space-y-0">
							{#each message.metadata.agentSteps as step (step.id)}
								<InlineToolStep {step} />
							{/each}
						</div>
					{/if}

					<!-- Action buttons -->
					{#if !isStreaming}
						<div class="flex items-center gap-0.5 mt-2 invisible group-hover:visible transition-all">
							<button on:click={handleCopy} class="p-1.5 rounded-lg transition-all hover:bg-black/5 dark:hover:bg-white/5" title="Copy">
								{#if copied}
									<svg class="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
									</svg>
								{:else}
									<svg class="w-3.5 h-3.5" style="color: var(--content-muted)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
									</svg>
								{/if}
							</button>
							<button on:click={handleRegenerate} class="p-1.5 rounded-lg transition-all hover:bg-black/5 dark:hover:bg-white/5" title="Regenerate">
								<svg class="w-3.5 h-3.5" style="color: var(--content-muted)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
								</svg>
							</button>
							{#if message.tokens}
								<span class="text-[10px] ml-1.5 font-mono invisible group-hover:visible" style="color: var(--content-muted)">
									{(message.tokens.prompt || 0) + (message.tokens.completion || 0)} tokens
								</span>
							{/if}
						</div>
					{/if}
				</div>
			</div>
		{/if}
	</div>
</div>
