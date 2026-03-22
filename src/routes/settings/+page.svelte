<script lang="ts">
	import Header from '$components/layout/Header.svelte';
	import SettingsPanel from '$components/settings/SettingsPanel.svelte';
</script>

<svelte:head>
	<title>Settings — KlimCode</title>
</svelte:head>

<Header />

<div class="flex-1 overflow-y-auto">
	<div class="max-w-2xl mx-auto px-4 py-8">
		<div class="mb-8">
			<h1 class="text-xl font-semibold" style="color: var(--content)">Settings</h1>
			<p class="text-sm mt-1" style="color: var(--content-muted)">Configure your KlimCode experience</p>
		</div>
		<SettingsPanel />
	</div>
</div>
