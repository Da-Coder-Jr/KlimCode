<script lang="ts">
	import { conversations, activeConversationId, selectConversation, deleteConversation, createConversation } from '$stores/chat';
	import { settings } from '$stores/settings';
	import { currentUser, logout } from '$stores/auth';
	import { formatRelativeTime } from '$utils/formatting';
	import { goto } from '$app/navigation';

	export let collapsed = false;

	let showNewMenu = false;
	let editingId: string | null = null;
	let editTitle = '';

	function toggleCollapse() {
		collapsed = !collapsed;
	}

	async function handleNewChat() {
		showNewMenu = false;
		const id = await createConversation('chat', $settings.defaultModel);
		goto(`/chat/${id}`);
	}

	async function handleNewAgent() {
		showNewMenu = false;
		const id = await createConversation('agent', $settings.defaultModel);
		goto(`/chat/${id}`);
	}

	async function handleSelect(id: string) {
		await selectConversation(id);
		goto(`/chat/${id}`);
	}

	async function handleDelete(e: Event, id: string) {
		e.stopPropagation();
		if (confirm('Delete this conversation?')) {
			await deleteConversation(id);
		}
	}

	function handleLogout() {
		logout();
		goto('/');
	}

	$: sortedConversations = $conversations;
</script>

<aside
	class="flex flex-col h-full bg-surface-900 border-r border-surface-700 transition-all duration-300"
	class:w-64={!collapsed}
	class:w-16={collapsed}
>
	<!-- Logo / Header -->
	<div class="flex items-center justify-between p-4 border-b border-surface-700">
		{#if !collapsed}
			<a href="/" class="flex items-center gap-2">
				<div class="w-8 h-8 bg-gradient-to-br from-klim-500 to-klim-700 rounded-lg flex items-center justify-center">
					<span class="text-white font-bold text-sm">K</span>
				</div>
				<span class="font-semibold text-surface-100 text-lg">KlimCode</span>
			</a>
		{:else}
			<div class="w-8 h-8 bg-gradient-to-br from-klim-500 to-klim-700 rounded-lg flex items-center justify-center mx-auto">
				<span class="text-white font-bold text-sm">K</span>
			</div>
		{/if}
		<button on:click={toggleCollapse} class="text-surface-400 hover:text-surface-200 p-1 rounded">
			<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				{#if collapsed}
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
				{:else}
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
				{/if}
			</svg>
		</button>
	</div>

	<!-- New Conversation -->
	<div class="p-3">
		{#if !collapsed}
			<div class="relative">
				<button
					on:click={() => showNewMenu = !showNewMenu}
					class="w-full btn-primary flex items-center justify-center gap-2 text-sm"
				>
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
					</svg>
					New Conversation
				</button>

				{#if showNewMenu}
					<div class="absolute top-full left-0 right-0 mt-1 bg-surface-800 border border-surface-600 rounded-lg overflow-hidden z-50 shadow-xl">
						<button
							on:click={handleNewChat}
							class="w-full px-4 py-3 text-left text-sm hover:bg-surface-700 flex items-center gap-3"
						>
							<svg class="w-5 h-5 text-klim-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
							</svg>
							<div>
								<div class="text-surface-100 font-medium">Chat</div>
								<div class="text-surface-400 text-xs">Ask questions, get help with code</div>
							</div>
						</button>
						<button
							on:click={handleNewAgent}
							class="w-full px-4 py-3 text-left text-sm hover:bg-surface-700 flex items-center gap-3 border-t border-surface-700"
						>
							<svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
							</svg>
							<div>
								<div class="text-surface-100 font-medium">Agent</div>
								<div class="text-surface-400 text-xs">AI writes code, runs commands, creates PRs</div>
							</div>
						</button>
					</div>
				{/if}
			</div>
		{:else}
			<button
				on:click={handleNewChat}
				class="w-full p-2 bg-klim-600 hover:bg-klim-700 rounded-lg flex items-center justify-center"
				title="New Conversation"
			>
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
				</svg>
			</button>
		{/if}
	</div>

	<!-- Conversation List -->
	<div class="flex-1 overflow-y-auto px-2 space-y-0.5">
		{#each sortedConversations as conv (conv.id)}
			<button
				on:click={() => handleSelect(conv.id)}
				class="w-full text-left rounded-lg transition-colors duration-100 group
					{$activeConversationId === conv.id ? 'bg-surface-700/70 text-surface-100' : 'hover:bg-surface-800 text-surface-300'}"
			>
				{#if !collapsed}
					<div class="flex items-center gap-2 px-3 py-2.5">
						<div class="flex-shrink-0">
							{#if conv.mode === 'agent'}
								<svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
								</svg>
							{:else}
								<svg class="w-4 h-4 text-klim-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
								</svg>
							{/if}
						</div>
						<div class="flex-1 min-w-0">
							<div class="text-sm truncate">{conv.title}</div>
							<div class="text-xs text-surface-500">{formatRelativeTime(conv.updatedAt)}</div>
						</div>
						<button
							on:click={(e) => handleDelete(e, conv.id)}
							class="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-opacity"
							title="Delete"
						>
							<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
							</svg>
						</button>
					</div>
				{:else}
					<div class="p-2 flex justify-center" title={conv.title}>
						{#if conv.mode === 'agent'}
							<svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
							</svg>
						{:else}
							<svg class="w-5 h-5 text-klim-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
							</svg>
						{/if}
					</div>
				{/if}
			</button>
		{/each}
	</div>

	<!-- Navigation Links -->
	<div class="border-t border-surface-700 p-2 space-y-0.5">
		<a
			href="/github"
			class="flex items-center gap-3 px-3 py-2 rounded-lg text-surface-400 hover:text-surface-200 hover:bg-surface-800 text-sm"
		>
			<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
				<path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
			</svg>
			{#if !collapsed}<span>GitHub</span>{/if}
		</a>
		<a
			href="/settings"
			class="flex items-center gap-3 px-3 py-2 rounded-lg text-surface-400 hover:text-surface-200 hover:bg-surface-800 text-sm"
		>
			<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
			</svg>
			{#if !collapsed}<span>Settings</span>{/if}
		</a>
	</div>

	<!-- User -->
	{#if $currentUser}
		<div class="border-t border-surface-700 p-3">
			{#if !collapsed}
				<div class="flex items-center gap-3">
					<div class="w-8 h-8 rounded-full bg-klim-700 flex items-center justify-center text-sm font-medium text-white flex-shrink-0">
						{$currentUser.displayName.charAt(0).toUpperCase()}
					</div>
					<div class="flex-1 min-w-0">
						<div class="text-sm text-surface-200 truncate">{$currentUser.displayName}</div>
						<button on:click={handleLogout} class="text-xs text-surface-500 hover:text-surface-300">Sign out</button>
					</div>
				</div>
			{:else}
				<div class="flex justify-center">
					<div class="w-8 h-8 rounded-full bg-klim-700 flex items-center justify-center text-sm font-medium text-white" title={$currentUser.displayName}>
						{$currentUser.displayName.charAt(0).toUpperCase()}
					</div>
				</div>
			{/if}
		</div>
	{/if}
</aside>
