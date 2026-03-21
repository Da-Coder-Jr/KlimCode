<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { isStreaming, inputMessage } from '$stores/chat';

	const dispatch = createEventDispatcher();

	let textarea: HTMLTextAreaElement;
	let files: FileList | null = null;

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

<div class="border-t border-surface-700 bg-surface-900/90 backdrop-blur-sm p-4">
	<div class="max-w-4xl mx-auto">
		<div class="relative flex items-end gap-2 bg-surface-800 border border-surface-600 rounded-xl p-2 focus-within:ring-2 focus-within:ring-klim-500 focus-within:border-transparent transition-all">
			<textarea
				bind:this={textarea}
				bind:value={$inputMessage}
				on:keydown={handleKeydown}
				on:input={handleInput}
				placeholder={$isStreaming ? 'AI is responding...' : 'Type your message... (Shift+Enter for new line)'}
				disabled={$isStreaming}
				rows="1"
				class="flex-1 bg-transparent text-surface-100 placeholder-surface-500 resize-none px-2 py-1.5 focus:outline-none text-sm max-h-[200px] disabled:opacity-50"
			/>

			<div class="flex items-center gap-1.5 flex-shrink-0">
				{#if $isStreaming}
					<div class="flex items-center gap-2 text-surface-400 text-xs px-2">
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
					class="p-2 rounded-lg transition-colors duration-150
						{$inputMessage.trim() && !$isStreaming
							? 'bg-klim-600 hover:bg-klim-700 text-white'
							: 'bg-surface-700 text-surface-500 cursor-not-allowed'}"
					title="Send message"
				>
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
					</svg>
				</button>
			</div>
		</div>

		<div class="flex items-center justify-between mt-2 px-1">
			<span class="text-xs text-surface-500">
				Powered by <a href="https://build.nvidia.com" target="_blank" rel="noopener" class="text-klim-400 hover:text-klim-300">NVIDIA NIM</a>
			</span>
			<span class="text-xs text-surface-600">
				{$inputMessage.length} chars
			</span>
		</div>
	</div>
</div>
