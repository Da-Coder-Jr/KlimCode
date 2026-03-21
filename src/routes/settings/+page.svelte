<script lang="ts">
	import Header from '$components/layout/Header.svelte';
	import SettingsPanel from '$components/settings/SettingsPanel.svelte';
</script>

<svelte:head>
	<title>Settings — KlimCode</title>
</svelte:head>

<Header />

<div class="flex-1 overflow-y-auto p-6">
	<div class="mb-8">
		<h1 class="text-2xl font-bold text-surface-100">Settings</h1>
		<p class="text-surface-400 text-sm mt-1">Configure KlimCode to your preferences</p>
	</div>
	<SettingsPanel />
</div>
