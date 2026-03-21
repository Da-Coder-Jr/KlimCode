<script lang="ts">
	import { conversations, activeConversationId, selectConversation, deleteConversation, createConversation } from '$stores/chat';
	import { settings } from '$stores/settings';
	import { currentUser, logout } from '$stores/auth';
	import { githubConnected } from '$stores/github';
	import { formatRelativeTime } from '$utils/formatting';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	export let onClose: () => void = () => {};

	let showNewMenu = false;
	let showUserMenu = false;
	let searchQuery = '';

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

	// Group conversations by time
	$: filteredConversations = searchQuery
		? $conversations.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()))
		: $conversations;

	$: todayConvs = filteredConversations.filter(c => {
		const d = new Date(c.updatedAt);
		const now = new Date();
		return d.toDateString() === now.toDateString();
	});

	$: yesterdayConvs = filteredConversations.filter(c => {
		const d = new Date(c.updatedAt);
		const yesterday = new Date();
		yesterday.setDate(yesterday.getDate() - 1);
		return d.toDateString() === yesterday.toDateString();
	});

	$: olderConvs = filteredConversations.filter(c => {
		const d = new Date(c.updatedAt);
		const yesterday = new Date();
		yesterday.setDate(yesterday.getDate() - 1);
		return d < yesterday && d.toDateString() !== new Date().toDateString();
	});
</script>

<aside class="flex flex-col h-full w-full bg-zinc-900 border-r border-zinc-800/80">
	<!-- Header -->
	<div class="flex items-center justify-between px-3 py-3">
		<a href="/" class="flex items-center gap-2.5 group">
			<div class="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-sm">
				<span class="text-white font-bold text-sm">K</span>
			</div>
			<span class="font-semibold text-zinc-100 text-[15px] group-hover:text-white transition-colors">KlimCode</span>
		</a>
		<button on:click={onClose} class="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-all" title="Close sidebar">
			<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
			</svg>
		</button>
	</div>

	<!-- New Conversation -->
	<div class="px-3 pb-2">
		<div class="relative">
			<button
				on:click={() => showNewMenu = !showNewMenu}
				class="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-750 border border-zinc-700/50 hover:border-zinc-600 text-zinc-200 text-sm font-medium transition-all duration-150"
			>
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
				</svg>
				New Chat
			</button>

			{#if showNewMenu}
				<div class="absolute top-full left-0 right-0 mt-1.5 bg-zinc-800 border border-zinc-700 rounded-xl overflow-hidden z-50 shadow-xl shadow-black/20 animate-slide-down">
					<button
						on:click={handleNewChat}
						class="w-full px-3.5 py-3 text-left text-sm hover:bg-zinc-700/60 flex items-center gap-3 transition-colors"
					>
						<div class="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
							<svg class="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
							</svg>
						</div>
						<div>
							<div class="text-zinc-100 font-medium text-[13px]">Chat</div>
							<div class="text-zinc-500 text-xs">Ask questions, get help</div>
						</div>
					</button>
					<div class="h-px bg-zinc-700/60 mx-3"></div>
					<button
						on:click={handleNewAgent}
						class="w-full px-3.5 py-3 text-left text-sm hover:bg-zinc-700/60 flex items-center gap-3 transition-colors"
					>
						<div class="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
							<svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
							</svg>
						</div>
						<div>
							<div class="text-zinc-100 font-medium text-[13px]">Agent</div>
							<div class="text-zinc-500 text-xs">Write code, create PRs</div>
						</div>
					</button>
				</div>
			{/if}
		</div>
	</div>

	<!-- Search -->
	{#if $conversations.length > 5}
		<div class="px-3 pb-2">
			<div class="relative">
				<svg class="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
				</svg>
				<input
					bind:value={searchQuery}
					type="text"
					placeholder="Search chats..."
					class="w-full bg-zinc-800/50 border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-xs text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors"
				/>
			</div>
		</div>
	{/if}

	<!-- Conversation List -->
	<div class="flex-1 overflow-y-auto px-2 space-y-0.5">
		{#if todayConvs.length > 0}
			<div class="px-2 pt-3 pb-1.5">
				<span class="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider">Today</span>
			</div>
			{#each todayConvs as conv (conv.id)}
				<button
					on:click={() => handleSelect(conv.id)}
					class="w-full text-left rounded-lg transition-all duration-100 group relative
						{$activeConversationId === conv.id ? 'bg-zinc-800 text-zinc-100' : 'hover:bg-zinc-800/50 text-zinc-400 hover:text-zinc-200'}"
				>
					<div class="flex items-center gap-2.5 px-3 py-2">
						<div class="flex-shrink-0">
							{#if conv.mode === 'agent'}
								<div class="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
							{:else}
								<div class="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
							{/if}
						</div>
						<span class="flex-1 text-[13px] truncate">{conv.title}</span>
						<button
							on:click={(e) => handleDelete(e, conv.id)}
							class="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-all flex-shrink-0"
							title="Delete"
						>
							<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>
					</div>
				</button>
			{/each}
		{/if}

		{#if yesterdayConvs.length > 0}
			<div class="px-2 pt-4 pb-1.5">
				<span class="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider">Yesterday</span>
			</div>
			{#each yesterdayConvs as conv (conv.id)}
				<button
					on:click={() => handleSelect(conv.id)}
					class="w-full text-left rounded-lg transition-all duration-100 group relative
						{$activeConversationId === conv.id ? 'bg-zinc-800 text-zinc-100' : 'hover:bg-zinc-800/50 text-zinc-400 hover:text-zinc-200'}"
				>
					<div class="flex items-center gap-2.5 px-3 py-2">
						<div class="flex-shrink-0">
							{#if conv.mode === 'agent'}
								<div class="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
							{:else}
								<div class="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
							{/if}
						</div>
						<span class="flex-1 text-[13px] truncate">{conv.title}</span>
						<button
							on:click={(e) => handleDelete(e, conv.id)}
							class="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-all flex-shrink-0"
							title="Delete"
						>
							<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>
					</div>
				</button>
			{/each}
		{/if}

		{#if olderConvs.length > 0}
			<div class="px-2 pt-4 pb-1.5">
				<span class="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider">Previous</span>
			</div>
			{#each olderConvs as conv (conv.id)}
				<button
					on:click={() => handleSelect(conv.id)}
					class="w-full text-left rounded-lg transition-all duration-100 group relative
						{$activeConversationId === conv.id ? 'bg-zinc-800 text-zinc-100' : 'hover:bg-zinc-800/50 text-zinc-400 hover:text-zinc-200'}"
				>
					<div class="flex items-center gap-2.5 px-3 py-2">
						<div class="flex-shrink-0">
							{#if conv.mode === 'agent'}
								<div class="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
							{:else}
								<div class="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
							{/if}
						</div>
						<span class="flex-1 text-[13px] truncate">{conv.title}</span>
						<button
							on:click={(e) => handleDelete(e, conv.id)}
							class="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-all flex-shrink-0"
							title="Delete"
						>
							<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>
					</div>
				</button>
			{/each}
		{/if}

		{#if filteredConversations.length === 0}
			<div class="px-3 py-8 text-center">
				<p class="text-xs text-zinc-600">{searchQuery ? 'No matching chats' : 'No conversations yet'}</p>
			</div>
		{/if}
	</div>

	<!-- Bottom Nav -->
	<div class="border-t border-zinc-800/80 p-2 space-y-0.5">
		<a
			href="/github"
			class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all
				{$page.url.pathname === '/github' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'}"
		>
			<svg class="w-[18px] h-[18px]" fill="currentColor" viewBox="0 0 24 24">
				<path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
			</svg>
			<span>GitHub</span>
			{#if $githubConnected}
				<div class="w-1.5 h-1.5 rounded-full bg-emerald-400 ml-auto"></div>
			{/if}
		</a>
		<a
			href="/settings"
			class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all
				{$page.url.pathname === '/settings' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'}"
		>
			<svg class="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
			</svg>
			<span>Settings</span>
		</a>
	</div>

	<!-- User -->
	{#if $currentUser}
		<div class="border-t border-zinc-800/80 p-2 relative">
			<button
				on:click={() => showUserMenu = !showUserMenu}
				class="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-zinc-800/50 transition-all"
			>
				{#if $currentUser.avatarUrl}
					<img src={$currentUser.avatarUrl} alt="" class="w-8 h-8 rounded-full" />
				{:else}
					<div class="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-xs font-semibold text-white flex-shrink-0">
						{$currentUser.displayName.charAt(0).toUpperCase()}
					</div>
				{/if}
				<div class="flex-1 min-w-0 text-left">
					<div class="text-[13px] text-zinc-200 truncate font-medium">{$currentUser.displayName}</div>
					<div class="text-[11px] text-zinc-600 truncate">@{$currentUser.username}</div>
				</div>
				<svg class="w-4 h-4 text-zinc-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
				</svg>
			</button>

			{#if showUserMenu}
				<div class="absolute bottom-full left-2 right-2 mb-1 bg-zinc-800 border border-zinc-700 rounded-xl shadow-xl shadow-black/20 overflow-hidden z-50 animate-slide-up">
					<button
						on:click={handleLogout}
						class="w-full px-4 py-2.5 text-left text-sm text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/50 flex items-center gap-2.5 transition-colors"
					>
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
						</svg>
						Sign out
					</button>
				</div>
			{/if}
		</div>
	{/if}
</aside>
