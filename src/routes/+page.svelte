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
</script>

<svelte:head>
	<title>KlimCode — AI Agent Web UI</title>
</svelte:head>

{#if !$currentUser}
	<div class="flex items-center justify-center h-full bg-mesh">
		<LoginForm />
	</div>
{:else}
	<div class="flex items-center justify-center h-full bg-mesh">
		<div class="text-center px-4 max-w-2xl mx-auto">
			<div class="w-20 h-20 bg-gradient-to-br from-klim-500 to-klim-700 rounded-2xl flex items-center justify-center mx-auto mb-8 glow-klim-lg">
				<span class="text-white font-bold text-3xl">K</span>
			</div>

			<h1 class="text-4xl font-bold text-surface-100 mb-3">
				Welcome to <span class="text-gradient-klim">KlimCode</span>
			</h1>
			<p class="text-lg text-surface-400 mb-10">
				AI-powered coding assistant with autonomous agent capabilities.
				Write code, create PRs, and ship faster.
			</p>

			<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto">
				<button on:click={startChat} class="card-hover p-6 text-left group">
					<div class="w-10 h-10 rounded-xl bg-klim-900/50 flex items-center justify-center mb-3 group-hover:bg-klim-800/50 transition-colors">
						<svg class="w-5 h-5 text-klim-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
						</svg>
					</div>
					<h3 class="text-lg font-semibold text-surface-200 mb-1">Start Chat</h3>
					<p class="text-sm text-surface-400">Ask questions, get code help, debug issues</p>
				</button>

				<button on:click={startAgent} class="card-hover p-6 text-left group">
					<div class="w-10 h-10 rounded-xl bg-emerald-900/50 flex items-center justify-center mb-3 group-hover:bg-emerald-800/50 transition-colors">
						<svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
						</svg>
					</div>
					<h3 class="text-lg font-semibold text-surface-200 mb-1">Start Agent</h3>
					<p class="text-sm text-surface-400">AI writes code, runs commands, creates PRs</p>
				</button>
			</div>

			<div class="mt-12 flex items-center justify-center gap-6 text-sm text-surface-500">
				<a href="/settings" class="hover:text-surface-300 flex items-center gap-1.5">
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
					</svg>
					Settings
				</a>
				<a href="/github" class="hover:text-surface-300 flex items-center gap-1.5">
					<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
						<path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
					</svg>
					GitHub
				</a>
			</div>
		</div>
	</div>
{/if}
