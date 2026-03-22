<script lang="ts">
	import { githubConnected, githubUsername, getConnectUrl, disconnectGitHub } from '$stores/github';

	export let compact = false;

	function handleConnect() {
		window.location.href = getConnectUrl();
	}

	async function handleDisconnect() {
		if (confirm('Disconnect your GitHub account?')) {
			await disconnectGitHub();
		}
	}
</script>

{#if $githubConnected}
	<div class="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/15">
		<div class="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
			<svg class="w-4 h-4 text-emerald-500 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
			</svg>
		</div>
		<div class="flex-1 min-w-0">
			<div class="text-sm font-medium" style="color: var(--content-secondary)">Connected to GitHub</div>
			<div class="text-xs" style="color: var(--content-muted)">@{$githubUsername}</div>
		</div>
		<button on:click={handleDisconnect} class="text-xs px-2 py-1 rounded-lg hover:bg-red-500/10 text-red-500 transition-all">
			Disconnect
		</button>
	</div>
{:else}
	<div class="{compact ? '' : 'text-center'}">
		{#if !compact}
			<div class="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3" style="background-color: var(--surface-tertiary); border: 1px solid var(--border)">
				<svg class="w-6 h-6" style="color: var(--content-tertiary)" fill="currentColor" viewBox="0 0 24 24">
					<path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
				</svg>
			</div>
			<p class="text-sm mb-4 max-w-xs mx-auto" style="color: var(--content-muted)">
				Connect GitHub to let KlimCode create pull requests and browse repositories.
			</p>
		{/if}
		<button on:click={handleConnect} class="btn-github {compact ? 'text-sm' : ''}">
			<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
				<path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
			</svg>
			Connect with GitHub
		</button>
	</div>
{/if}
