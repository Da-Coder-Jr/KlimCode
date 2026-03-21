<script lang="ts">
	import Header from '$components/layout/Header.svelte';
	import SettingsPanel from '$components/settings/SettingsPanel.svelte';
</script>

<svelte:head>
	<title>Settings - KlimCode</title>
</svelte:head>

<Header />

<div class="flex-1 overflow-y-auto bg-mesh-subtle">
	<div class="max-w-2xl mx-auto px-4 sm:px-6 py-8">
		<div class="mb-8">
			<div class="flex items-center gap-3 mb-2">
				<div class="w-10 h-10 rounded-xl bg-surface-800/60 border border-surface-700/40 flex items-center justify-center">
					<svg class="w-5 h-5 text-surface-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
					</svg>
				</div>
				<div>
					<h1 class="text-xl font-bold text-surface-100">Settings</h1>
					<p class="text-sm text-surface-400">Configure your KlimCode preferences</p>
				</div>
			</div>
		</div>
		<SettingsPanel />
	</div>
</div>
