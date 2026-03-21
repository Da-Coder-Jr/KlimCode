<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { checkAuth, currentUser, authLoading } from '$stores/auth';
	import { loadConversations } from '$stores/chat';
	import { loadSettings } from '$stores/settings';
	import { checkGitHubConnection } from '$stores/github';
	import Sidebar from '$components/layout/Sidebar.svelte';

	let sidebarOpen = true;
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

		// Restore sidebar state
		const saved = localStorage.getItem('klimcode_sidebar');
		if (saved !== null) sidebarOpen = saved === 'true';
	});

	function toggleSidebar() {
		sidebarOpen = !sidebarOpen;
		localStorage.setItem('klimcode_sidebar', String(sidebarOpen));
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
	<div class="h-screen h-[100dvh] flex overflow-hidden bg-zinc-950">
		{#if showSidebar}
			<!-- Desktop Sidebar -->
			<div
				class="hidden md:flex flex-shrink-0 transition-all duration-300 ease-in-out"
				style="width: {sidebarOpen ? '260px' : '0px'}"
			>
				{#if sidebarOpen}
					<Sidebar onClose={toggleSidebar} />
				{/if}
			</div>

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

		<main class="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
			{#if showSidebar}
				<!-- Sidebar toggle buttons -->
				{#if !sidebarOpen}
					<button
						on:click={toggleSidebar}
						class="hidden md:flex absolute top-3 left-3 z-20 p-2 rounded-xl text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/80 transition-all"
						title="Open sidebar"
					>
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
						</svg>
					</button>
				{/if}
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
