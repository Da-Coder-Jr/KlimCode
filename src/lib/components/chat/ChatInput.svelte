<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import { isStreaming, inputMessage, stopStreaming } from '$stores/chat';

	const dispatch = createEventDispatcher();

	let textarea: HTMLTextAreaElement;
	let pasteGlow = false;

	function handleSubmit() {
		if ($isStreaming || !$inputMessage.trim()) return;
		dispatch('send', { message: $inputMessage });
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
			e.preventDefault();
			handleSubmit();
		}
	}

	function handleInput() {
		if (textarea) {
			textarea.style.height = 'auto';
			textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
		}
	}

	function handlePaste() {
		pasteGlow = true;
		setTimeout(() => { pasteGlow = false; }, 600);
	}

	function handleStop() {
		if (typeof stopStreaming === 'function') {
			stopStreaming();
		}
	}

	export function focus() {
		textarea?.focus();
	}

	onMount(() => {
		if ($inputMessage.trim()) {
			setTimeout(() => {
				handleSubmit();
			}, 100);
		}
	});
</script>

<div class="flex-shrink-0 p-3 sm:p-4" style="border-top: 1px solid var(--border); background-color: var(--surface)">
	<div class="max-w-3xl xl:max-w-4xl mx-auto">
		<form on:submit|preventDefault={handleSubmit}>
			<div
				class="relative rounded-2xl transition-all"
				class:paste-glow={pasteGlow}
				style="background-color: var(--surface-secondary); border: 1px solid var(--border)"
			>
				<textarea
					bind:this={textarea}
					bind:value={$inputMessage}
					on:keydown={handleKeydown}
					on:input={handleInput}
					on:paste={handlePaste}
					placeholder={$isStreaming ? 'AI is generating...' : 'Message KlimCode...'}
					disabled={$isStreaming}
					rows="1"
					class="scrollbar-custom w-full bg-transparent resize-none px-4 py-3 focus:outline-none text-[15px] leading-relaxed max-h-[4lh] sm:max-h-[8lh] disabled:opacity-40"
					style="color: var(--content)"
				></textarea>

				<div class="flex items-center justify-between px-3 pb-2.5">
					<div class="flex items-center gap-2">
						<button
							type="button"
							class="p-1.5 rounded-lg transition-all btn-icon"
							title="Attach file"
							disabled={$isStreaming}
						>
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4v16m8-8H4" />
							</svg>
						</button>

						{#if $isStreaming}
							<div class="flex items-center gap-2 text-xs" style="color: var(--content-muted)">
								<div class="flex gap-1">
									<span class="thinking-dot w-1 h-1 rounded-full" style="background-color: var(--content-muted)"></span>
									<span class="thinking-dot w-1 h-1 rounded-full" style="background-color: var(--content-muted)"></span>
									<span class="thinking-dot w-1 h-1 rounded-full" style="background-color: var(--content-muted)"></span>
								</div>
								<span class="text-[11px]">Generating...</span>
							</div>
						{/if}
					</div>

					<div class="flex items-center gap-1.5">
						{#if $isStreaming}
							<button
								type="button"
								on:click={handleStop}
								class="stop-btn p-2 rounded-xl transition-all"
								style="background-color: var(--surface-tertiary); color: var(--content-tertiary)"
								title="Stop generating"
							>
								<svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
									<rect x="6" y="6" width="12" height="12" rx="1" />
								</svg>
							</button>
						{:else}
							<button
								type="submit"
								disabled={!$inputMessage.trim()}
								class="p-2 rounded-xl transition-all duration-150"
								style="{$inputMessage.trim()
									? 'background-color: var(--content); color: var(--surface)'
									: 'background-color: var(--surface-tertiary); color: var(--content-muted); cursor: not-allowed'}"
								title="Send message (Enter)"
							>
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
								</svg>
							</button>
						{/if}
					</div>
				</div>
			</div>
		</form>

		<div class="flex items-center justify-center mt-2">
			<span class="text-[11px]" style="color: var(--content-muted)">
				Free AI by <a href="https://build.nvidia.com" target="_blank" rel="noopener" class="transition-colors" style="color: var(--content-tertiary)">NVIDIA NIM</a>
				&middot; Enter to send, Shift+Enter for new line
			</span>
		</div>
	</div>
</div>
