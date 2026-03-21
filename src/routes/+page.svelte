<script lang="ts">
	import { currentUser } from '$stores/auth';
	import { goto } from '$app/navigation';
	import { createConversation } from '$stores/chat';
	import { settings } from '$stores/settings';
	import LoginForm from '$components/auth/LoginForm.svelte';

	async function startChat() {
		const id = await createConversation('chat', $settings.defaultModel);
		goto(`/chat/${id}`);
	}

	async function startAgent() {
		const id = await createConversation('agent', $settings.defaultModel);
		goto(`/chat/${id}`);
	}

	const suggestions = [
		{ title: 'Build a REST API', desc: 'with auth, validation, and error handling', icon: 'M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2' },
		{ title: 'Fix a bug', desc: 'debug errors and find root causes', icon: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
		{ title: 'Write tests', desc: 'unit tests, integration tests, mocks', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
		{ title: 'Refactor code', desc: 'clean up, optimize, add types', icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' }
	];
</script>

<svelte:head>
	<title>KlimCode — AI Agent Web UI</title>
</svelte:head>

{#if !$currentUser}
	<div class="flex items-center justify-center h-full bg-mesh p-4">
		<LoginForm />
	</div>
{:else}
	<div class="flex items-center justify-center h-full bg-mesh overflow-y-auto">
		<div class="text-center px-4 py-12 max-w-3xl mx-auto w-full">
			<!-- Hero -->
			<div class="relative mb-10">
				<div class="absolute inset-0 flex justify-center -top-8">
					<div class="w-64 h-64 bg-klim-500/10 rounded-full blur-3xl"></div>
				</div>
				<div class="relative">
					<div class="w-20 h-20 bg-gradient-to-br from-klim-400 via-klim-600 to-klim-800 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-klim-500/30 rotate-3 hover:rotate-0 transition-transform duration-500">
						<span class="text-white font-black text-3xl -rotate-3 hover:rotate-0 transition-transform duration-500">K</span>
					</div>

					<h1 class="text-5xl font-black text-surface-100 mb-3 tracking-tight">
						Klim<span class="text-gradient-klim">Code</span>
					</h1>
					<p class="text-xl text-surface-400 max-w-lg mx-auto leading-relaxed">
						Your AI coding assistant. Write code, create pull requests,
						and ship faster — powered by free NVIDIA AI.
					</p>
				</div>
			</div>

			<!-- Action Cards -->
			<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto mb-12">
				<button on:click={startChat} class="group relative overflow-hidden rounded-2xl border border-surface-700 bg-surface-800/50 p-6 text-left hover:border-klim-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-klim-500/10">
					<div class="absolute top-0 right-0 w-32 h-32 bg-klim-500/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-klim-500/10 transition-colors duration-300"></div>
					<div class="relative">
						<div class="w-12 h-12 rounded-xl bg-gradient-to-br from-klim-500/20 to-klim-700/20 flex items-center justify-center mb-4 group-hover:from-klim-500/30 group-hover:to-klim-700/30 transition-colors">
							<svg class="w-6 h-6 text-klim-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
							</svg>
						</div>
						<h3 class="text-xl font-bold text-surface-100 mb-1">Chat</h3>
						<p class="text-sm text-surface-400">Ask questions, debug code, get explanations</p>
					</div>
				</button>

				<button on:click={startAgent} class="group relative overflow-hidden rounded-2xl border border-surface-700 bg-surface-800/50 p-6 text-left hover:border-emerald-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/10">
					<div class="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-emerald-500/10 transition-colors duration-300"></div>
					<div class="relative">
						<div class="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-700/20 flex items-center justify-center mb-4 group-hover:from-emerald-500/30 group-hover:to-emerald-700/30 transition-colors">
							<svg class="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
							</svg>
						</div>
						<h3 class="text-xl font-bold text-surface-100 mb-1">Agent</h3>
						<p class="text-sm text-surface-400">AI writes code and creates GitHub PRs for you</p>
					</div>
				</button>
			</div>

			<!-- Suggestions -->
			<div class="mb-12">
				<h2 class="text-sm font-medium text-surface-500 uppercase tracking-wider mb-4">Try asking</h2>
				<div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
					{#each suggestions as s}
						<button on:click={startChat} class="p-4 rounded-xl border border-surface-800 hover:border-surface-600 bg-surface-900/50 hover:bg-surface-800/50 text-left transition-all duration-200 group">
							<svg class="w-5 h-5 text-surface-500 group-hover:text-klim-400 mb-2 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d={s.icon} />
							</svg>
							<div class="text-sm font-medium text-surface-300 group-hover:text-surface-100 mb-0.5 transition-colors">{s.title}</div>
							<div class="text-xs text-surface-600">{s.desc}</div>
						</button>
					{/each}
				</div>
			</div>

			<!-- Bottom Links -->
			<div class="flex items-center justify-center gap-8 text-sm text-surface-600">
				<a href="/settings" class="hover:text-surface-300 flex items-center gap-1.5 transition-colors">
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
					</svg>
					Settings
				</a>
				<a href="/github" class="hover:text-surface-300 flex items-center gap-1.5 transition-colors">
					<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
						<path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
					</svg>
					GitHub
				</a>
				<span class="text-surface-700">|</span>
				<span class="text-surface-600">
					Free AI by <a href="https://build.nvidia.com" target="_blank" rel="noopener" class="text-klim-500 hover:text-klim-400 transition-colors">NVIDIA</a>
				</span>
			</div>
		</div>
	</div>
{/if}
