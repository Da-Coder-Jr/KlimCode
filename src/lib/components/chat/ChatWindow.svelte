<script lang="ts">
	import MessageList from './MessageList.svelte';
	import ChatInput from './ChatInput.svelte';
	import AgentStepsPanel from '../agent/AgentStepsPanel.svelte';
	import { messages, sendMessage, activeConversation, agentSteps, editAndResend, regenerateLastResponse } from '$stores/chat';

	export let showAgentPanel = false;

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

	$: isAgent = $activeConversation?.mode === 'agent';
</script>

<div class="flex h-full w-full overflow-hidden">
	<!-- Main Chat Area -->
	<div class="flex-1 flex flex-col min-w-0">
		<MessageList messages={$messages} on:edit={handleEdit} on:regenerate={handleRegenerate} />
		<ChatInput on:send={handleSend} bind:this={chatInput} />
	</div>

	<!-- Agent Side Panel -->
	{#if isAgent && showAgentPanel}
		<div class="w-80 xl:w-96 flex-shrink-0 overflow-hidden transition-all duration-300" style="border-left: 1px solid var(--border); background-color: var(--surface-secondary)">
			<AgentStepsPanel steps={$agentSteps} />
		</div>
	{/if}
</div>
