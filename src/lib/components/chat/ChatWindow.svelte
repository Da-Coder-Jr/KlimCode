<script lang="ts">
	import MessageList from './MessageList.svelte';
	import ChatInput from './ChatInput.svelte';
	import { messages, sendMessage, editAndResend, regenerateLastResponse } from '$stores/chat';

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
</script>

<div class="flex h-full w-full overflow-hidden">
	<div class="flex-1 flex flex-col min-w-0">
		<MessageList messages={$messages} on:edit={handleEdit} on:regenerate={handleRegenerate} />
		<ChatInput on:send={handleSend} bind:this={chatInput} />
	</div>
</div>
