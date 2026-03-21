<script lang="ts">
	import MessageList from './MessageList.svelte';
	import ChatInput from './ChatInput.svelte';
	import AgentStepsPanel from '../agent/AgentStepsPanel.svelte';
	import { messages, sendMessage, activeConversation, agentSteps } from '$stores/chat';

	export let showAgentPanel = false;

	let chatInput: ChatInput;

	async function handleSend(e: CustomEvent<{ message: string }>) {
		await sendMessage(e.detail.message);
	}

	$: isAgent = $activeConversation?.mode === 'agent';
</script>

<div class="flex h-full">
	<!-- Main Chat -->
	<div class="flex-1 flex flex-col min-w-0">
		<MessageList messages={$messages} />
		<ChatInput on:send={handleSend} bind:this={chatInput} />
	</div>

	<!-- Agent Side Panel -->
	{#if isAgent && showAgentPanel}
		<div class="w-80 xl:w-96 border-l border-surface-700 flex-shrink-0 overflow-hidden">
			<AgentStepsPanel steps={$agentSteps} />
		</div>
	{/if}
</div>
