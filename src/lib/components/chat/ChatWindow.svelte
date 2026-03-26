<script lang="ts">
	import MessageList from './MessageList.svelte';
	import ChatInput from './ChatInput.svelte';
	import { messages, sendMessage, editAndResend, regenerateLastResponse, error } from '$stores/chat';

	let chatInput: ChatInput;

	async function handleSend(e: CustomEvent<{ message: string }>) {
		await sendMessage(e.detail.message);
	}

	async function handleEdit(e: CustomEvent<{ messageId: string; content: string }>) {
		await editAndResend(e.detail.messageId, e.detail.content);
	}

	async function handleRegenerate(e: CustomEvent<{ messageId: string }>) {
		await regenerateLastResponse();
	}

	function dismissError() {
		error.set(null);
	}
</script>

<div class="flex h-full w-full overflow-hidden">
	<div class="flex-1 flex flex-col min-w-0">
		{#if $error}
			<div class="flex-shrink-0 px-4 pt-2">
				<div class="max-w-3xl xl:max-w-4xl mx-auto">
					<div class="flex items-center gap-2 px-4 py-3 rounded-xl text-sm" style="background-color: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); color: var(--content)">
						<svg class="w-4 h-4 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
						</svg>
						<span class="flex-1">{$error}</span>
						<button on:click={dismissError} class="p-1 rounded transition-colors" style="color: var(--content-muted)">
							<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>
					</div>
				</div>
			</div>
		{/if}
		<MessageList messages={$messages} on:edit={handleEdit} on:regenerate={handleRegenerate} />
		<ChatInput on:send={handleSend} bind:this={chatInput} />
	</div>
</div>
