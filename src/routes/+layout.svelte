<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { checkAuth, currentUser, authLoading } from '$stores/auth';
	import { loadConversations } from '$stores/chat';
	import { loadSettings } from '$stores/settings';
	import { checkGitHubConnection } from '$stores/github';
	import Sidebar from '$components/layout/Sidebar.svelte';

	let sidebarCollapsed = false;
	let initialized = false;

	onMount(async () => {
		await checkAuth();
		if ($currentUser) {
			await Promise.all([
				loadConversations(),
				loadSettings(),
				checkGitHubConnection()
			]);
		}
		initialized = true;
	});

	$: isAuthPage = $page.url.pathname === '/login';
	$: showSidebar = $currentUser && !isAuthPage;
</script>

{#if !initialized}
	<div class="flex items-center justify-center h-screen bg-surface-950">
		<div class="text-center">
			<div class="w-12 h-12 bg-gradient-to-br from-klim-500 to-klim-700 rounded-xl flex items-center justify-center mx-auto mb-4 animate-pulse">
				<span class="text-white font-bold text-lg">K</span>
			</div>
			<p class="text-surface-400 text-sm">Loading KlimCode...</p>
		</div>
	</div>
{:else}
	<div class="h-screen flex overflow-hidden bg-surface-950">
		{#if showSidebar}
			<div class="hidden lg:block flex-shrink-0">
				<Sidebar bind:collapsed={sidebarCollapsed} />
			</div>
		{/if}

		<main class="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
			<slot />
		</main>
	</div>
{/if}
