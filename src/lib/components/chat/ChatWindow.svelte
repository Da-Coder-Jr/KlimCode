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

<!-- Main chat layout with resizable agent panel -->
<div class="flex h-full overflow-hidden">
	<!-- Main Chat Area -->
	<div class="flex-1 flex flex-col min-w-0">
		<MessageList messages={$messages} />
		<ChatInput on:send={handleSend} bind:this={chatInput} />
	</div>

	<!-- Agent Side Panel - slides in with transition -->
	{#if isAgent && showAgentPanel}
		<div class="w-80 xl:w-96 border-l border-zinc-800 flex-shrink-0 overflow-hidden bg-zinc-900/50 transition-all duration-300">
			<AgentStepsPanel steps={$agentSteps} />
		</div>
	{/if}
</div>
