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
	let mobileSidebarOpen = false;
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

	function closeMobileSidebar() {
		mobileSidebarOpen = false;
	}

	// Close mobile sidebar on navigation
	$: if ($page.url.pathname) {
		mobileSidebarOpen = false;
	}
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com">
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous">
	<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
</svelte:head>

{#if !initialized}
	<div class="flex items-center justify-center h-screen bg-surface-950">
		<div class="text-center animate-fade-in">
			<div class="relative inline-flex mb-5">
				<div class="w-14 h-14 bg-gradient-to-br from-klim-400 via-klim-600 to-klim-800 rounded-2xl flex items-center justify-center shadow-glow animate-pulse-slow">
					<span class="text-white font-bold text-xl">K</span>
				</div>
			</div>
			<div class="flex items-center justify-center gap-1.5 text-surface-500 text-sm">
				<svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
					<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
					<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
				</svg>
				Loading...
			</div>
		</div>
	</div>
{:else}
	<div class="h-screen h-[100dvh] flex overflow-hidden bg-surface-950">
		{#if showSidebar}
			<!-- Desktop sidebar -->
			<div class="hidden lg:block flex-shrink-0">
				<Sidebar bind:collapsed={sidebarCollapsed} />
			</div>

			<!-- Mobile sidebar overlay -->
			{#if mobileSidebarOpen}
				<div class="lg:hidden fixed inset-0 z-50 flex">
					<!-- Backdrop -->
					<button
						class="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
						on:click={closeMobileSidebar}
						tabindex="-1"
						aria-label="Close sidebar"
					></button>
					<!-- Sidebar -->
					<div class="relative w-72 animate-slide-up">
						<Sidebar collapsed={false} on:close={closeMobileSidebar} />
					</div>
				</div>
			{/if}
		{/if}

		<main class="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
			<slot />
		</main>
	</div>
{/if}
