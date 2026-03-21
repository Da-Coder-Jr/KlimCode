<script lang="ts">
	import { githubConnected, githubUsername, disconnectGitHub } from '$stores/github';

	export let compact = false;

	function handleConnect() {
		// Navigate directly to the OAuth endpoint - don't use fetch
		window.location.href = '/api/github/connect';
	}

	async function handleDisconnect() {
		if (confirm('Disconnect your GitHub account?')) {
			await disconnectGitHub();
		}
	}
</script>

{#if $githubConnected}
	<div class="flex items-center gap-3 {compact ? '' : 'p-4 rounded-xl border border-emerald-500/15 bg-emerald-500/5'}">
		<div class="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
			<svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
			</svg>
		</div>
		<div class="flex-1">
			<div class="text-sm text-surface-200 font-medium">Connected to GitHub</div>
			<div class="text-xs text-surface-400">@{$githubUsername}</div>
		</div>
		<button on:click={handleDisconnect} class="text-xs text-surface-500 hover:text-red-400 px-3 py-1.5 rounded-lg hover:bg-red-500/10 transition-all">
			Disconnect
		</button>
	</div>
{:else}
	<div class="{compact ? '' : 'p-6 rounded-xl border border-surface-700/40 bg-surface-800/20 text-center'}">
		{#if !compact}
			<div class="w-12 h-12 rounded-xl bg-surface-800/60 border border-surface-700/40 flex items-center justify-center mx-auto mb-4">
				<svg class="w-6 h-6 text-surface-400" fill="currentColor" viewBox="0 0 24 24">
					<path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
				</svg>
			</div>
			<h3 class="text-base font-semibold text-surface-200 mb-1.5">Connect GitHub</h3>
			<p class="text-sm text-surface-400 mb-5 max-w-sm mx-auto leading-relaxed">
				Connect your GitHub account to let KlimCode create pull requests and manage code.
			</p>
		{/if}
		<button
			on:click={handleConnect}
			class="inline-flex items-center gap-2.5 py-2.5 px-5 rounded-xl
				bg-surface-100 hover:bg-white text-surface-900
				font-semibold text-sm
				transition-all duration-200 shadow-lg shadow-black/10
				hover:shadow-xl active:scale-[0.98]"
		>
			<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
				<path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
			</svg>
			Connect with GitHub
		</button>
	</div>
{/if}
