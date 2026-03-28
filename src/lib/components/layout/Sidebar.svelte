<script lang="ts">
	import { conversations, activeConversationId, selectConversation, deleteConversation, createConversation, renameConversation } from '$stores/chat';
	import { settings } from '$stores/settings';
	import { currentUser, logout } from '$stores/auth';
	import { githubConnected } from '$stores/github';
	import { themePreference, setTheme, resolvedTheme } from '$stores/theme';
	import { formatRelativeTime } from '$utils/formatting';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import ConfirmDialog from './ConfirmDialog.svelte';

	export let onClose: () => void = () => {};

	let showNewMenu = false;
	let showUserMenu = false;
	let searchQuery = '';
	let editingId: string | null = null;
	let editTitle = '';

	// Custom delete confirmation state
	let deleteDialogOpen = false;
	let pendingDeleteId: string | null = null;
	let pendingDeleteTitle = '';

	async function handleNewChat() {
		showNewMenu = false;
		try {
			const model = $settings.defaultModel || 'qwen/qwen3-coder-480b-a35b-instruct';
			const id = await createConversation('chat', model);
			onClose();
			goto(`/chat/${id}`);
		} catch (err) {
			console.error('Failed to create chat:', err);
		}
	}

	async function handleNewAgent() {
		showNewMenu = false;
		try {
			const model = $settings.defaultModel || 'qwen/qwen3-coder-480b-a35b-instruct';
			const id = await createConversation('agent', model);
			onClose();
			goto(`/chat/${id}`);
		} catch (err) {
			console.error('Failed to create agent:', err);
		}
	}

	async function handleSelect(id: string) {
		onClose();
		await selectConversation(id);
		goto(`/chat/${id}`);
	}

	function handleDelete(e: Event, id: string) {
		e.stopPropagation();
		const conv = $conversations.find(c => c.id === id);
		pendingDeleteId = id;
		pendingDeleteTitle = conv?.title || 'this conversation';
		deleteDialogOpen = true;
	}

	async function confirmDelete() {
		if (pendingDeleteId) {
			await deleteConversation(pendingDeleteId);
			if ($activeConversationId === pendingDeleteId) {
				goto('/');
			}
		}
		pendingDeleteId = null;
		pendingDeleteTitle = '';
	}

	function startRename(e: Event, conv: { id: string; title: string }) {
		e.stopPropagation();
		editingId = conv.id;
		editTitle = conv.title;
	}

	async function finishRename() {
		if (editingId && editTitle.trim()) {
			await renameConversation(editingId, editTitle.trim());
		}
		editingId = null;
		editTitle = '';
	}

	function handleRenameKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') finishRename();
		else if (e.key === 'Escape') { editingId = null; editTitle = ''; }
	}

	function handleLogout() {
		logout();
		goto('/');
	}

	function cycleTheme() {
		const order: Array<'light' | 'dark' | 'system'> = ['light', 'dark', 'system'];
		const idx = order.indexOf($themePreference);
		setTheme(order[(idx + 1) % order.length]);
		// Add brief transition class
		document.documentElement.classList.add('theme-transitioning');
		setTimeout(() => document.documentElement.classList.remove('theme-transitioning'), 250);
	}

	$: filteredConversations = searchQuery
		? $conversations.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()))
		: $conversations;

	$: {
		const now = new Date();
		const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
		const yesterdayStart = new Date(todayStart.getTime() - 86400000);
		const weekStart = new Date(todayStart.getTime() - 7 * 86400000);

		todayConvs = filteredConversations.filter(c => new Date(c.updatedAt) >= todayStart);
		yesterdayConvs = filteredConversations.filter(c => {
			const d = new Date(c.updatedAt);
			return d >= yesterdayStart && d < todayStart;
		});
		weekConvs = filteredConversations.filter(c => {
			const d = new Date(c.updatedAt);
			return d >= weekStart && d < yesterdayStart;
		});
		olderConvs = filteredConversations.filter(c => new Date(c.updatedAt) < weekStart);
	}

	let todayConvs: typeof $conversations = [];
	let yesterdayConvs: typeof $conversations = [];
	let weekConvs: typeof $conversations = [];
	let olderConvs: typeof $conversations = [];
</script>

<aside class="flex flex-col h-full w-full" style="background-color: var(--sidebar-bg); border-right: 1px solid var(--sidebar-border)">
	<!-- Header -->
	<div class="flex items-center px-3.5 py-3.5">
		<a href="/" class="flex items-center gap-2.5 group hover:opacity-80 transition-opacity">
			<img src="/favicon.svg" alt="KlimCode" class="w-7 h-7 rounded-lg shadow-soft" />
			<span class="font-semibold text-[15px] tracking-tight" style="color: var(--content)">KlimCode</span>
		</a>
	</div>

	<!-- New Conversation -->
	<div class="px-3 pb-2">
		<div class="relative">
			<button
				on:click={() => showNewMenu = !showNewMenu}
				class="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 hover:shadow-soft active:scale-[0.98]"
				style="background-color: var(--surface-tertiary); color: var(--content-secondary); border: 1px solid var(--border)"
			>
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
				</svg>
				New Chat
			</button>

			{#if showNewMenu}
				<div class="absolute top-full left-0 right-0 mt-1.5 rounded-xl overflow-hidden z-50 shadow-elevated animate-slide-down" style="background-color: var(--surface-secondary); border: 1px solid var(--border)">
					<button
						on:click={handleNewChat}
						class="w-full px-3.5 py-3 text-left text-sm flex items-center gap-3 transition-colors"
						style="color: var(--content)"
					>
						<div class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style="background-color: var(--accent-subtle)">
							<svg class="w-4 h-4" style="color: var(--content-tertiary)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
							</svg>
						</div>
						<div>
							<div class="font-medium text-[13px]">Chat</div>
							<div class="text-xs" style="color: var(--content-muted)">Ask questions, get help</div>
						</div>
					</button>
					<div class="mx-3" style="height: 1px; background-color: var(--border)"></div>
					<button
						on:click={handleNewAgent}
						class="w-full px-3.5 py-3 text-left text-sm flex items-center gap-3 transition-colors"
						style="color: var(--content)"
					>
						<div class="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
							<svg class="w-4 h-4 text-emerald-500 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
							</svg>
						</div>
						<div>
							<div class="font-medium text-[13px]">Agent</div>
							<div class="text-xs" style="color: var(--content-muted)">Write code, create PRs</div>
						</div>
					</button>
				</div>
			{/if}
		</div>
	</div>

	<!-- Search -->
	{#if $conversations.length > 3}
		<div class="px-3 pb-2">
			<div class="relative">
				<svg class="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style="color: var(--content-muted)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
				</svg>
				<input
					bind:value={searchQuery}
					type="text"
					placeholder="Search chats..."
					class="w-full rounded-lg pl-9 pr-3 py-2 text-xs focus:outline-none transition-colors"
					style="background-color: var(--surface-tertiary); border: 1px solid transparent; color: var(--content-secondary)"
				/>
				{#if searchQuery}
					<button
						on:click={() => searchQuery = ''}
						class="absolute right-2 top-1/2 -translate-y-1/2 transition-colors"
						style="color: var(--content-muted)"
					>
						<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				{/if}
			</div>
		</div>
	{/if}

	<!-- Conversation List -->
	<div class="flex-1 overflow-y-auto px-2 space-y-0.5">
		{#each [
			{ label: 'Today', items: todayConvs },
			{ label: 'Yesterday', items: yesterdayConvs },
			{ label: 'This Week', items: weekConvs },
			{ label: 'Previous', items: olderConvs }
		] as group}
			{#if group.items.length > 0}
				<div class="px-2 pt-3.5 pb-1.5">
					<span class="text-[10px] font-semibold uppercase tracking-wider" style="color: var(--content-muted)">{group.label}</span>
				</div>
				{#each group.items as conv (conv.id)}
					<a
						href="/chat/{conv.id}"
						on:click|preventDefault={() => handleSelect(conv.id)}
						class="group flex h-[2.25rem] items-center gap-2 rounded-lg pl-2.5 pr-2 transition-all duration-150"
						style="{$activeConversationId === conv.id
							? `background-color: var(--sidebar-active); color: var(--content)`
							: `color: var(--content-tertiary)`}"
					>
						<div class="flex-shrink-0">
							{#if conv.mode === 'agent'}
								<div class="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400"></div>
							{:else}
								<div class="w-1.5 h-1.5 rounded-full" style="background-color: var(--content-muted)"></div>
							{/if}
						</div>

						{#if editingId === conv.id}
							<input
								type="text"
								bind:value={editTitle}
								on:keydown={handleRenameKeydown}
								on:blur={finishRename}
								class="flex-1 min-w-0 bg-transparent border-none p-0 text-[13px] text-inherit outline-none focus:ring-0 truncate"
								autofocus
							/>
						{:else}
							<span class="flex-1 text-[13px] truncate first-letter:uppercase">{conv.title}</span>
						{/if}

						<div class="hidden group-hover:flex items-center gap-0.5 flex-shrink-0">
							<button
								on:click|preventDefault|stopPropagation={(e) => startRename(e, conv)}
								class="p-1 rounded transition-colors"
								style="color: var(--content-muted)"
								title="Rename"
							>
								<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
								</svg>
							</button>
							<button
								on:click|preventDefault|stopPropagation={(e) => handleDelete(e, conv.id)}
								class="p-1 rounded text-red-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
								title="Delete"
							>
								<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
								</svg>
							</button>
						</div>
					</a>
				{/each}
			{/if}
		{/each}

		{#if filteredConversations.length === 0}
			<div class="px-3 py-8 text-center">
				<svg class="w-8 h-8 mx-auto mb-3" style="color: var(--border)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
				</svg>
				<p class="text-xs" style="color: var(--content-muted)">{searchQuery ? 'No matching chats' : 'No conversations yet'}</p>
				{#if !searchQuery}
					<p class="text-[11px] mt-1" style="color: var(--content-muted)">Start a new chat to get going</p>
				{/if}
			</div>
		{/if}
	</div>

	<!-- Bottom Nav -->
	<div class="p-2 space-y-0.5" style="border-top: 1px solid var(--sidebar-border)">
		<!-- Theme Toggle -->
		<button
			on:click={cycleTheme}
			class="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150 hover:bg-[var(--sidebar-hover)]"
			style="color: var(--content-tertiary)"
			title="Toggle theme: {$themePreference}"
		>
			{#if $resolvedTheme === 'dark'}
				<svg class="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
				</svg>
			{:else}
				<svg class="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
				</svg>
			{/if}
			<span>{$themePreference === 'system' ? 'System' : $themePreference === 'dark' ? 'Dark' : 'Light'}</span>
		</button>

		<a
			href="/github"
			class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150 hover:bg-[var(--sidebar-hover)]"
			style="{$page.url.pathname === '/github'
				? `background-color: var(--sidebar-active); color: var(--content)`
				: `color: var(--content-tertiary)`}"
		>
			<svg class="w-[18px] h-[18px]" fill="currentColor" viewBox="0 0 24 24">
				<path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
			</svg>
			<span>GitHub</span>
			{#if $githubConnected}
				<div class="w-1.5 h-1.5 rounded-full bg-emerald-500 ml-auto"></div>
			{/if}
		</a>
		<a
			href="/settings"
			class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150 hover:bg-[var(--sidebar-hover)]"
			style="{$page.url.pathname === '/settings'
				? `background-color: var(--sidebar-active); color: var(--content)`
				: `color: var(--content-tertiary)`}"
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
		<div class="p-2 relative" style="border-top: 1px solid var(--sidebar-border)">
			<button
				on:click={() => showUserMenu = !showUserMenu}
				class="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all"
			>
				{#if $currentUser.avatarUrl}
					<img src={$currentUser.avatarUrl} alt="" class="w-8 h-8 rounded-full" />
				{:else}
					<div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0" style="background-color: var(--surface-tertiary); color: var(--content-secondary)">
						{$currentUser.displayName.charAt(0).toUpperCase()}
					</div>
				{/if}
				<div class="flex-1 min-w-0 text-left">
					<div class="text-[13px] truncate font-medium" style="color: var(--content)">{$currentUser.displayName}</div>
					<div class="text-[11px] truncate" style="color: var(--content-muted)">@{$currentUser.username}</div>
				</div>
				<svg class="w-4 h-4 flex-shrink-0" style="color: var(--content-muted)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
				</svg>
			</button>

			{#if showUserMenu}
				<div class="absolute bottom-full left-2 right-2 mb-1 rounded-xl shadow-elevated overflow-hidden z-50 animate-slide-up" style="background-color: var(--surface-secondary); border: 1px solid var(--border)">
					<button
						on:click={handleLogout}
						class="w-full px-4 py-2.5 text-left text-sm flex items-center gap-2.5 transition-colors"
						style="color: var(--content-tertiary)"
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

<!-- Custom Delete Confirmation Dialog -->
<ConfirmDialog
	bind:open={deleteDialogOpen}
	title="Delete conversation"
	message="Are you sure you want to delete &quot;{pendingDeleteTitle}&quot;? This action cannot be undone."
	confirmText="Delete"
	cancelText="Cancel"
	variant="danger"
	on:confirm={confirmDelete}
/>
