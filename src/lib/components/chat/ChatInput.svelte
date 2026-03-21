<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
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

	onMount(() => {
		// Auto-send if input was set from the home page
		if ($inputMessage.trim()) {
			setTimeout(() => {
				handleSubmit();
			}, 100);
		}
	});
</script>

<div class="border-t border-zinc-800/60 bg-zinc-950/90 backdrop-blur-xl p-3 sm:p-4">
	<div class="max-w-3xl mx-auto">
		<div class="relative bg-zinc-900 border border-zinc-800 rounded-2xl focus-within:border-zinc-700 focus-within:ring-1 focus-within:ring-zinc-700 transition-all">
			<textarea
				bind:this={textarea}
				bind:value={$inputMessage}
				on:keydown={handleKeydown}
				on:input={handleInput}
				placeholder={$isStreaming ? 'AI is thinking...' : 'Message KlimCode...'}
				disabled={$isStreaming}
				rows="1"
				class="w-full bg-transparent text-zinc-100 placeholder-zinc-600 resize-none px-4 py-3 focus:outline-none text-[15px] leading-relaxed max-h-[200px] disabled:opacity-40"
			/>

			<div class="flex items-center justify-between px-3 pb-2.5">
				<div class="flex items-center gap-2">
					{#if $isStreaming}
						<div class="flex items-center gap-2 text-zinc-500 text-xs">
							<div class="flex gap-0.5">
								<span class="w-1 h-1 bg-blue-400 rounded-full animate-bounce" style="animation-delay: 0ms"></span>
								<span class="w-1 h-1 bg-blue-400 rounded-full animate-bounce" style="animation-delay: 150ms"></span>
								<span class="w-1 h-1 bg-blue-400 rounded-full animate-bounce" style="animation-delay: 300ms"></span>
							</div>
							<span class="text-[11px]">Generating...</span>
						</div>
					{/if}
				</div>

				<button
					on:click={handleSubmit}
					disabled={$isStreaming || !$inputMessage.trim()}
					class="p-2 rounded-xl transition-all duration-150
						{$inputMessage.trim() && !$isStreaming
							? 'bg-blue-600 hover:bg-blue-500 text-white shadow-sm shadow-blue-500/20'
							: 'bg-zinc-800 text-zinc-600 cursor-not-allowed'}"
					title="Send message"
				>
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
					</svg>
				</button>
			</div>
		</div>

		<div class="flex items-center justify-center mt-2">
			<span class="text-[11px] text-zinc-700">
				Free AI by <a href="https://build.nvidia.com" target="_blank" rel="noopener" class="text-zinc-600 hover:text-zinc-500 transition-colors">NVIDIA NIM</a>
				&middot; Shift+Enter for new line
			</span>
		</div>
	</div>
</div>
