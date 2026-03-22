<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { checkAuth, currentUser, authLoading } from '$stores/auth';
	import { loadConversations } from '$stores/chat';
	import { loadSettings } from '$stores/settings';
	import { checkGitHubConnection } from '$stores/github';
	import Sidebar from '$components/layout/Sidebar.svelte';

	let isNavCollapsed = false;
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

		const saved = localStorage.getItem('klimcode_sidebar');
		if (saved !== null) isNavCollapsed = saved === 'true';

		// Global keyboard shortcuts (inspired by chat-ui)
		function handleGlobalKeys(e: KeyboardEvent) {
			if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'o') {
				e.preventDefault();
				toggleNav();
			}
		}
		window.addEventListener('keydown', handleGlobalKeys);
		return () => window.removeEventListener('keydown', handleGlobalKeys);
	});

	function toggleNav() {
		isNavCollapsed = !isNavCollapsed;
		localStorage.setItem('klimcode_sidebar', String(isNavCollapsed));
	}

	function toggleMobileSidebar() {
		mobileSidebarOpen = !mobileSidebarOpen;
	}

	function closeMobileSidebar() {
		mobileSidebarOpen = false;
	}

	$: showSidebar = !!$currentUser;
</script>

{#if !initialized}
	<!-- Loading screen -->
	<div class="flex items-center justify-center h-screen bg-zinc-950">
		<div class="text-center animate-fade-in">
			<div class="relative">
				<div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center mx-auto shadow-lg shadow-blue-500/20">
					<span class="text-white font-bold text-xl">K</span>
				</div>
				<div class="absolute inset-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 mx-auto animate-ping opacity-20"></div>
			</div>
			<p class="text-zinc-500 text-sm mt-4 font-medium">Loading KlimCode...</p>
		</div>
	</div>
{:else}
	<!-- Grid-based layout inspired by HuggingFace chat-ui -->
	<div
		class="fixed grid h-dvh w-screen overflow-hidden text-[15px] dark:text-zinc-300 bg-zinc-950
			{showSidebar
				? isNavCollapsed
					? 'grid-cols-1 md:grid-cols-[0px,1fr]'
					: 'grid-cols-1 md:grid-cols-[280px,1fr]'
				: 'grid-cols-1'}
			transition-[grid-template-columns] duration-300 ease-in-out md:grid-rows-[1fr]"
	>
		{#if showSidebar}
			<!-- Desktop Sidebar - grid-based collapse -->
			<nav class="hidden md:grid max-h-dvh grid-cols-1 grid-rows-[1fr] overflow-hidden">
				<div class="w-[280px]">
					<Sidebar onClose={toggleNav} />
				</div>
			</nav>

			<!-- Mobile Sidebar Overlay -->
			{#if mobileSidebarOpen}
				<div class="fixed inset-0 z-50 md:hidden">
					<button
						class="absolute inset-0 bg-black/60 backdrop-blur-sm"
						on:click={closeMobileSidebar}
						aria-label="Close sidebar"
					></button>
					<div class="absolute left-0 top-0 bottom-0 w-[280px] animate-slide-down">
						<Sidebar onClose={closeMobileSidebar} />
					</div>
				</div>
			{/if}
		{/if}

		<!-- Main content area -->
		<main class="flex flex-col min-w-0 h-full overflow-hidden relative">
			{#if showSidebar}
				<!-- Desktop sidebar toggle - ALWAYS visible so sidebar can always be re-opened -->
				<button
					on:click={toggleNav}
					class="hidden md:flex absolute top-3 left-3 z-20 p-2 rounded-xl text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/80 transition-all"
					title="{isNavCollapsed ? 'Open' : 'Close'} sidebar (Ctrl+Shift+O)"
				>
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						{#if isNavCollapsed}
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
						{:else}
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M11 19l-7-7 7-7" />
						{/if}
					</svg>
				</button>
				<!-- Mobile toggle always visible -->
				<button
					on:click={toggleMobileSidebar}
					class="md:hidden absolute top-3 left-3 z-20 p-2 rounded-xl text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/80 transition-all"
					title="Open sidebar"
				>
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
					</svg>
				</button>
			{/if}
			<slot />
		</main>
	</div>
{/if}
