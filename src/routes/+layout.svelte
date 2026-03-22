<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { checkAuth, currentUser, authLoading } from '$stores/auth';
	import { loadConversations } from '$stores/chat';
	import { loadSettings } from '$stores/settings';
	import { checkGitHubConnection } from '$stores/github';
	import { initTheme, setTheme, themePreference, resolvedTheme } from '$stores/theme';
	import Sidebar from '$components/layout/Sidebar.svelte';

	let isNavCollapsed = false;
	let mobileSidebarOpen = false;
	let initialized = false;

	onMount(async () => {
		initTheme();

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
	<div class="flex items-center justify-center h-screen" style="background-color: var(--surface)">
		<div class="text-center animate-fade-in">
			<div class="relative">
				<img src="/favicon.svg" alt="KlimCode" class="w-14 h-14 mx-auto rounded-2xl" />
				<div class="absolute inset-0 w-14 h-14 mx-auto rounded-2xl animate-ping opacity-10" style="background-color: var(--content-muted)"></div>
			</div>
			<p class="text-sm mt-4 font-medium" style="color: var(--content-muted)">Loading KlimCode...</p>
		</div>
	</div>
{:else}
	<div
		class="fixed grid h-dvh w-screen overflow-hidden text-[15px]
			{showSidebar
				? isNavCollapsed
					? 'grid-cols-1 md:grid-cols-[0px,1fr]'
					: 'grid-cols-1 md:grid-cols-[272px,1fr]'
				: 'grid-cols-1'}
			transition-[grid-template-columns] duration-300 ease-in-out md:grid-rows-[1fr]"
		style="background-color: var(--surface); color: var(--content)"
	>
		{#if showSidebar}
			<!-- Desktop Sidebar -->
			<nav class="hidden md:grid max-h-dvh grid-cols-1 grid-rows-[1fr] overflow-hidden">
				<div class="w-[272px]">
					<Sidebar onClose={toggleNav} />
				</div>
			</nav>

			<!-- Mobile Sidebar Overlay -->
			{#if mobileSidebarOpen}
				<div class="fixed inset-0 z-50 md:hidden">
					<button
						class="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm"
						on:click={closeMobileSidebar}
						aria-label="Close sidebar"
					></button>
					<div class="absolute left-0 top-0 bottom-0 w-[272px] animate-slide-down">
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
					class="hidden md:flex absolute top-3 left-3 z-20 p-2 rounded-xl transition-all duration-150 btn-icon"
					title="{isNavCollapsed ? 'Open' : 'Close'} sidebar (Ctrl+Shift+O)"
				>
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						{#if isNavCollapsed}
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
						{:else}
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
						{/if}
					</svg>
				</button>
				<!-- Mobile toggle always visible -->
				<button
					on:click={toggleMobileSidebar}
					class="md:hidden absolute top-3 left-3 z-20 p-2 rounded-xl transition-all btn-icon"
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
