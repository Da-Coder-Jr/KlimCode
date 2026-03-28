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

	// Get active steps (live or saved)
	$: activeSteps = isStreaming ? liveAgentSteps : (message.metadata?.agentSteps || []);

	// Build interleaved segments: [{type: 'text', html}, {type: 'steps', steps}]
	$: segments = buildSegments(message.content, activeSteps, renderedContent);

	/**
	 * Find a safe split point near `offset` that doesn't break markdown structures.
	 * Looks for a double-newline (paragraph break) near the offset.
	 * Never splits inside a fenced code block.
	 */
	function findSafeSplitPoint(content: string, offset: number): number {
		if (offset <= 0) return 0;
		if (offset >= content.length) return content.length;

		// Check if we're inside a fenced code block at this offset
		const before = content.slice(0, offset);
		const fenceCount = (before.match(/^```/gm) || []).length;
		const insideCodeBlock = fenceCount % 2 === 1;

		if (insideCodeBlock) {
			// Find the closing ``` after the offset
			const closingFence = content.indexOf('\n```', offset);
			if (closingFence !== -1) {
				// Split after the closing fence line
				const afterFence = content.indexOf('\n', closingFence + 4);
				return afterFence !== -1 ? afterFence + 1 : closingFence + 4;
			}
			// No closing fence found — don't split here
			return content.length;
		}

		// Look for a double-newline (paragraph boundary) near the offset
		// Search backwards first (within 200 chars)
		const searchStart = Math.max(0, offset - 200);
		const searchRegion = content.slice(searchStart, offset);
		const lastParaBreak = searchRegion.lastIndexOf('\n\n');
		if (lastParaBreak !== -1) {
			return searchStart + lastParaBreak + 2;
		}

		// Search forwards (within 200 chars)
		const forwardRegion = content.slice(offset, offset + 200);
		const nextParaBreak = forwardRegion.indexOf('\n\n');
		if (nextParaBreak !== -1) {
			return offset + nextParaBreak + 2;
		}

		// Fallback: split at a newline near the offset
		const lastNewline = content.lastIndexOf('\n', offset);
		if (lastNewline > 0) return lastNewline + 1;

		return offset;
	}

	function buildSegments(content: string, steps: AgentStep[], rendered: string): Array<{type: 'text', html: string} | {type: 'steps', steps: AgentStep[]}> {
		if (!steps || steps.length === 0 || !content) {
			return [{ type: 'text', html: rendered }];
		}

		// Check if any steps have contentOffset
		const stepsWithOffset = steps.filter(s => s.contentOffset !== undefined && s.contentOffset !== null);
		if (stepsWithOffset.length === 0) {
			// No offsets — show text first, then all steps at bottom
			return [
				{ type: 'text', html: rendered },
				{ type: 'steps', steps }
			];
		}

		// Sort steps by contentOffset
		const sortedSteps = [...steps].sort((a, b) => (a.contentOffset ?? Infinity) - (b.contentOffset ?? Infinity));

		// Get unique offsets and group steps by offset
		const offsetGroups = new Map<number, AgentStep[]>();
		for (const step of sortedSteps) {
			const offset = step.contentOffset ?? content.length;
			if (!offsetGroups.has(offset)) offsetGroups.set(offset, []);
			offsetGroups.get(offset)!.push(step);
		}

		const offsets = [...offsetGroups.keys()].sort((a, b) => a - b);
		const result: Array<{type: 'text', html: string} | {type: 'steps', steps: AgentStep[]}> = [];

		let lastOffset = 0;
		for (const offset of offsets) {
			// Find a safe split point that doesn't break markdown
			const safeOffset = findSafeSplitPoint(content, offset);
			const textSlice = content.slice(lastOffset, safeOffset);
			if (textSlice.trim()) {
				result.push({ type: 'text', html: renderMarkdown(textSlice) });
			}
			result.push({ type: 'steps', steps: offsetGroups.get(offset)! });
			lastOffset = safeOffset;
		}

		// Render remaining text after last offset
		const remaining = content.slice(lastOffset);
		if (remaining.trim()) {
			result.push({ type: 'text', html: renderMarkdown(remaining) });
		}

		return result;
	}

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

	// Use event delegation so copy buttons work even after streaming updates
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
							class="w-full rounded-xl px-4 py-3 text-[15px] resize-y focus:outline-none leading-relaxed input-field"
						></textarea>
						<div class="flex items-center gap-2 mt-2">
							<button on:click={saveEdit} class="btn-primary text-xs py-1.5 px-3">
								Save & Submit
							</button>
							<button on:click={cancelEdit} class="text-xs font-medium py-1.5 px-3 transition-colors" style="color: var(--content-muted)">
								Cancel
							</button>
							<span class="text-[10px] ml-auto" style="color: var(--content-muted)">Ctrl+Enter to save</span>
						</div>
					{:else}
						<p class="text-[15px] whitespace-pre-wrap break-words leading-relaxed" style="color: var(--content-secondary)">{message.content}</p>
					{/if}
				</div>
			{:else}
				<!-- Assistant message with bubble -->
				<div class="message-content relative rounded-2xl px-5 py-3.5" style="background-color: var(--chat-bubble-bg); border: 1px solid var(--chat-bubble-border); overflow: hidden; min-width: 0;">
					<!-- Thinking dots: only when no text yet -->
					{#if isStreaming && !message.content && activeSteps.length === 0}
						<span class="inline-flex gap-1 ml-1 align-text-bottom">
							<span class="thinking-dot w-1.5 h-1.5 rounded-full" style="background-color: var(--content-muted)"></span>
							<span class="thinking-dot w-1.5 h-1.5 rounded-full" style="background-color: var(--content-muted)"></span>
							<span class="thinking-dot w-1.5 h-1.5 rounded-full" style="background-color: var(--content-muted)"></span>
						</span>
					{:else}
						<!-- Interleaved text and tool steps -->
						{#each segments as segment}
							{#if segment.type === 'text'}
								<div class="prose-chat">
									{@html segment.html}
								</div>
							{:else if segment.type === 'steps'}
								<div class="space-y-0">
									{#each segment.steps as step (step.id)}
										<InlineToolStep {step} />
									{/each}
								</div>
							{/if}
						{/each}
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

					{#if isAssistant}
						<button
							on:click={handleRegenerate}
							class="p-1.5 rounded-lg transition-all btn-icon"
							title="Regenerate response"
						>
							<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
							</svg>
						</button>
					{/if}

				</div>
			{/if}
		</div>
	</div>
</div>
