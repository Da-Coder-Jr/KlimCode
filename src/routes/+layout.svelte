<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { checkAuth, currentUser, authLoading } from '$stores/auth';
	import { loadConversations } from '$stores/chat';
	import { loadSettings, settings } from '$stores/settings';
	import { checkGitHubConnection } from '$stores/github';
	import { initTheme, setTheme, themePreference, resolvedTheme } from '$stores/theme';
	import Sidebar from '$components/layout/Sidebar.svelte';

	let isNavCollapsed = false;
	let mobileSidebarOpen = false;
	let initialized = false;

	// Global error/notification banners
	let globalError = '';
	let showApiKeyPrompt = false;

	const ERROR_MESSAGES: Record<string, string> = {
		'github_auth_failed': 'GitHub authentication failed. Please try again.',
		'github_denied': 'GitHub login was cancelled or denied.',
		'no_code': 'GitHub did not return an authorization code.',
		'invalid_state': 'GitHub login session expired. Please try again.',
		'oauth_not_configured': 'GitHub OAuth is not configured on this server.'
	};

	onMount(async () => {
		initTheme();

		// Check for error params in URL (e.g. from GitHub OAuth callback)
		const urlError = $page.url.searchParams.get('error');
		if (urlError) {
			globalError = ERROR_MESSAGES[urlError] || `An error occurred: ${urlError}`;
			// Clean the URL without reloading
			const cleanUrl = new URL(window.location.href);
			cleanUrl.searchParams.delete('error');
			window.history.replaceState({}, '', cleanUrl.toString());
		}

		await checkAuth();
		if ($currentUser) {
			await Promise.all([
				loadConversations(),
				loadSettings(),
				checkGitHubConnection()
			]);
			// Show API key prompt if user has no API key set
			if (!$settings.nvidiaApiKey) {
				showApiKeyPrompt = true;
			}
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
				<!-- Desktop: Only show open button when sidebar is collapsed -->
				{#if isNavCollapsed}
					<button
						on:click={toggleNav}
						class="hidden md:flex absolute top-3 left-3 z-20 p-2 rounded-xl transition-all duration-150 btn-icon"
						title="Open sidebar (Ctrl+Shift+O)"
					>
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
						</svg>
					</button>
				{/if}
				<!-- Mobile toggle -->
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

			<!-- Global error banner -->
			{#if globalError}
				<div class="absolute top-0 left-0 right-0 z-50 flex items-center justify-center px-4 py-3" style="background-color: rgba(239, 68, 68, 0.1); border-bottom: 1px solid rgba(239, 68, 68, 0.2)">
					<div class="flex items-center gap-3 max-w-xl">
						<svg class="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
						</svg>
						<span class="text-sm font-medium text-red-600 dark:text-red-400">{globalError}</span>
						<button on:click={() => globalError = ''} class="p-1 rounded-lg hover:bg-red-500/10 text-red-500 transition-colors flex-shrink-0">
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>
					</div>
				</div>
			{/if}

			<slot />
		</main>
	</div>

	<!-- API Key Required Prompt -->
	{#if showApiKeyPrompt}
		<div class="fixed inset-0 z-[60] flex items-center justify-center p-4">
			<button class="absolute inset-0 bg-black/50 backdrop-blur-sm" on:click={() => showApiKeyPrompt = false} aria-label="Close"></button>
			<div class="relative w-full max-w-md rounded-2xl p-6 shadow-elevated animate-slide-down" style="background-color: var(--surface-secondary); border: 1px solid var(--border)">
				<div class="text-center mb-5">
					<div class="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
						<svg class="w-7 h-7 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
						</svg>
					</div>
					<h2 class="text-lg font-semibold" style="color: var(--content)">API Key Required</h2>
					<p class="text-sm mt-2 leading-relaxed" style="color: var(--content-muted)">
						To start chatting, you need a free NVIDIA NIM API key. Get one from <a href="https://build.nvidia.com" target="_blank" rel="noopener" class="underline font-medium" style="color: var(--content-tertiary)">build.nvidia.com</a>
					</p>
				</div>
				<div class="flex gap-3">
					<button on:click={() => showApiKeyPrompt = false} class="btn-secondary flex-1">Later</button>
					<a href="/settings" on:click={() => showApiKeyPrompt = false} class="btn-primary flex-1 text-center">Go to Settings</a>
				</div>
			</div>
		</div>
	{/if}
{/if}
