<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { isStreaming, inputMessage } from '$stores/chat';

	const dispatch = createEventDispatcher();

	let textarea: HTMLTextAreaElement;

	function handleSubmit() {
		if ($isStreaming || !$inputMessage.trim()) return;
		dispatch('send', { message: $inputMessage });
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
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

	export function focus() {
		textarea?.focus();
	}
</script>

<div class="border-t border-surface-700/30 bg-surface-950/90 backdrop-blur-xl px-4 py-3">
	<div class="max-w-3xl mx-auto">
		<div class="relative flex items-end gap-2 bg-surface-800/60 border border-surface-700/50 rounded-2xl p-2.5
			focus-within:ring-2 focus-within:ring-klim-500/30 focus-within:border-klim-500/30
			transition-all duration-200 hover:border-surface-600/60 shadow-lg shadow-black/5">

			<textarea
				bind:this={textarea}
				bind:value={$inputMessage}
				on:keydown={handleKeydown}
				on:input={handleInput}
				placeholder={$isStreaming ? 'AI is thinking...' : 'Message KlimCode...'}
				disabled={$isStreaming}
				rows="1"
				class="flex-1 bg-transparent text-surface-100 placeholder-surface-500 resize-none px-2 py-1.5
					focus:outline-none text-sm max-h-[200px] disabled:opacity-50 leading-relaxed"
			/>

			<div class="flex items-center gap-1.5 flex-shrink-0">
				{#if $isStreaming}
					<div class="flex items-center gap-1.5 text-surface-500 text-xs px-2 py-1">
						<div class="flex gap-1">
							<span class="w-1.5 h-1.5 bg-klim-400 rounded-full animate-bounce" style="animation-delay: 0ms"></span>
							<span class="w-1.5 h-1.5 bg-klim-400 rounded-full animate-bounce" style="animation-delay: 150ms"></span>
							<span class="w-1.5 h-1.5 bg-klim-400 rounded-full animate-bounce" style="animation-delay: 300ms"></span>
						</div>
					</div>
				{/if}

				<button
					on:click={handleSubmit}
					disabled={$isStreaming || !$inputMessage.trim()}
					class="p-2 rounded-xl transition-all duration-200
						{$inputMessage.trim() && !$isStreaming
							? 'bg-klim-600 hover:bg-klim-500 text-white shadow-lg shadow-klim-600/30 active:scale-95'
							: 'bg-surface-700/50 text-surface-500 cursor-not-allowed'}"
					title="Send message"
				>
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 12L3 21l18-9L3 3l3 9zm0 0h6" />
					</svg>
				</button>
			</div>
		</div>

		<div class="flex items-center justify-between mt-1.5 px-2">
			<span class="text-2xs text-surface-600">
				Powered by <a href="https://build.nvidia.com" target="_blank" rel="noopener" class="text-klim-500/70 hover:text-klim-400 transition-colors">NVIDIA NIM</a>
				&middot; Shift+Enter for new line
			</span>
		</div>
	</div>
</div>
