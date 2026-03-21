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

	// Paste glow effect - inspired by chat-ui
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

<div class="border-t border-zinc-800/60 bg-zinc-950/90 backdrop-blur-xl p-3 sm:p-4">
	<div class="max-w-3xl xl:max-w-4xl mx-auto">
		<form on:submit|preventDefault={handleSubmit}>
			<div
				class="relative bg-zinc-900 border border-zinc-800 rounded-2xl focus-within:border-zinc-700 focus-within:ring-1 focus-within:ring-zinc-700 transition-all"
				class:paste-glow={pasteGlow}
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
					class="scrollbar-custom w-full bg-transparent text-zinc-100 placeholder-zinc-600 resize-none px-4 py-3 focus:outline-none text-[15px] leading-relaxed max-h-[4lh] sm:max-h-[8lh] disabled:opacity-40"
				></textarea>

				<div class="flex items-center justify-between px-3 pb-2.5">
					<div class="flex items-center gap-2">
						<!-- File upload button - inspired by chat-ui attachment dropdown -->
						<button
							type="button"
							class="p-1.5 rounded-lg text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800 transition-all"
							title="Attach file"
							disabled={$isStreaming}
						>
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4v16m8-8H4" />
							</svg>
						</button>

						{#if $isStreaming}
							<div class="flex items-center gap-2 text-zinc-500 text-xs">
								<div class="flex gap-1">
									<span class="thinking-dot w-1 h-1 bg-blue-400 rounded-full"></span>
									<span class="thinking-dot w-1 h-1 bg-blue-400 rounded-full"></span>
									<span class="thinking-dot w-1 h-1 bg-blue-400 rounded-full"></span>
								</div>
								<span class="text-[11px]">Generating...</span>
							</div>
						{/if}
					</div>

					<div class="flex items-center gap-1.5">
						{#if $isStreaming}
							<!-- Stop button with spinning ring animation - from chat-ui -->
							<button
								type="button"
								on:click={handleStop}
								class="stop-btn p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-all"
								title="Stop generating"
							>
								<svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
									<rect x="6" y="6" width="12" height="12" rx="1" />
								</svg>
							</button>
						{:else}
							<!-- Send button - rounded like chat-ui -->
							<button
								type="submit"
								disabled={!$inputMessage.trim()}
								class="p-2 rounded-xl transition-all duration-150
									{$inputMessage.trim()
										? 'bg-blue-600 hover:bg-blue-500 text-white shadow-sm shadow-blue-500/20'
										: 'bg-zinc-800 text-zinc-600 cursor-not-allowed'}"
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
			<span class="text-[11px] text-zinc-700">
				Free AI by <a href="https://build.nvidia.com" target="_blank" rel="noopener" class="text-zinc-600 hover:text-zinc-500 transition-colors">NVIDIA NIM</a>
				&middot; Enter to send, Shift+Enter for new line
			</span>
		</div>
	</div>
</div>
