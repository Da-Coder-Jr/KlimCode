<script lang="ts">
	import { settings, saveSettings, saveApiKey, testApiKey } from '$stores/settings';
	import { AVAILABLE_MODELS } from '$lib/server/ai/nvidia';
	import GitHubConnect from '$components/github/GitHubConnect.svelte';

	let apiKeyInput = '';
	let apiKeyVisible = false;
	let testResult: { success: boolean; message: string } | null = null;
	let testing = false;
	let saving = false;
	let saved = false;

	$: hasApiKey = $settings.nvidiaApiKey.length > 0;

	async function handleTestKey() {
		if (!apiKeyInput) return;
		testing = true;
		testResult = await testApiKey(apiKeyInput);
		testing = false;
	}

	async function handleSaveKey() {
		if (!apiKeyInput) return;
		saving = true;
		const success = await saveApiKey(apiKeyInput);
		saving = false;
		if (success) {
			saved = true;
			setTimeout(() => { saved = false; }, 3000);
		}
	}

	async function handleModelChange(e: Event) {
		const target = e.target as HTMLSelectElement;
		await saveSettings({ defaultModel: target.value });
	}
</script>

<div class="max-w-2xl mx-auto space-y-8">
	<!-- NVIDIA API Key -->
	<section class="card p-6">
		<h2 class="text-lg font-semibold text-surface-100 mb-1 flex items-center gap-2">
			<svg class="w-5 h-5 text-klim-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
			</svg>
			NVIDIA NIM API Key
		</h2>
		<p class="text-sm text-surface-400 mb-4">
			Get your free API key from <a href="https://build.nvidia.com" target="_blank" rel="noopener" class="text-klim-400 hover:text-klim-300">build.nvidia.com</a>
		</p>

		<div class="space-y-3">
			<div class="relative">
				<input
					bind:value={apiKeyInput}
					type={apiKeyVisible ? 'text' : 'password'}
					placeholder={hasApiKey ? '••••••••••••••••••••' : 'nvapi-xxxxxxxxxxxxxxxxxx'}
					class="input-field w-full pr-10"
				/>
				<button
					on:click={() => apiKeyVisible = !apiKeyVisible}
					class="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-200"
				>
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						{#if apiKeyVisible}
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
						{:else}
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
						{/if}
					</svg>
				</button>
			</div>

			{#if testResult}
				<div class="p-3 rounded-lg text-sm {testResult.success ? 'bg-emerald-900/30 text-emerald-300 border border-emerald-700/50' : 'bg-red-900/30 text-red-300 border border-red-700/50'}">
					{testResult.message}
				</div>
			{/if}

			<div class="flex gap-2">
				<button on:click={handleTestKey} disabled={!apiKeyInput || testing} class="btn-secondary text-sm">
					{testing ? 'Testing...' : 'Test Key'}
				</button>
				<button on:click={handleSaveKey} disabled={!apiKeyInput || saving} class="btn-primary text-sm">
					{saved ? 'Saved!' : saving ? 'Saving...' : 'Save Key'}
				</button>
			</div>
		</div>
	</section>

	<!-- Model Selection -->
	<section class="card p-6">
		<h2 class="text-lg font-semibold text-surface-100 mb-1">Default Model</h2>
		<p class="text-sm text-surface-400 mb-4">Choose which NVIDIA NIM model to use for conversations</p>

		<select
			value={$settings.defaultModel}
			on:change={handleModelChange}
			class="input-field w-full"
		>
			{#each AVAILABLE_MODELS || [] as model}
				<option value={model.id}>
					{model.name} — {model.description}
				</option>
			{/each}
		</select>
	</section>

	<!-- GitHub -->
	<section class="card p-6">
		<h2 class="text-lg font-semibold text-surface-100 mb-1 flex items-center gap-2">
			<svg class="w-5 h-5 text-surface-300" fill="currentColor" viewBox="0 0 24 24">
				<path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
			</svg>
			GitHub Integration
		</h2>
		<p class="text-sm text-surface-400 mb-4">Connect GitHub to enable PR creation and repository browsing</p>
		<GitHubConnect />
	</section>

	<!-- Agent Settings -->
	<section class="card p-6">
		<h2 class="text-lg font-semibold text-surface-100 mb-4">Agent Settings</h2>

		<div class="space-y-4">
			<label class="flex items-center justify-between">
				<div>
					<div class="text-sm text-surface-200">Auto-approve file reads</div>
					<div class="text-xs text-surface-400">Allow agent to read files without confirmation</div>
				</div>
				<input
					type="checkbox"
					checked={$settings.agent.autoApproveReads}
					on:change={(e) => saveSettings({ agent: { ...$settings.agent, autoApproveReads: (e.target as HTMLInputElement).checked } })}
					class="w-5 h-5 rounded bg-surface-700 border-surface-600 text-klim-600 focus:ring-klim-500"
				/>
			</label>

			<label class="flex items-center justify-between">
				<div>
					<div class="text-sm text-surface-200">Auto-approve commands</div>
					<div class="text-xs text-surface-400">Allow agent to run shell commands without confirmation</div>
				</div>
				<input
					type="checkbox"
					checked={$settings.agent.autoApproveCommands}
					on:change={(e) => saveSettings({ agent: { ...$settings.agent, autoApproveCommands: (e.target as HTMLInputElement).checked } })}
					class="w-5 h-5 rounded bg-surface-700 border-surface-600 text-klim-600 focus:ring-klim-500"
				/>
			</label>

			<div>
				<label class="text-sm text-surface-200 block mb-1">Sandbox timeout (seconds)</label>
				<input
					type="number"
					value={$settings.agent.sandboxTimeout / 1000}
					on:change={(e) => saveSettings({ agent: { ...$settings.agent, sandboxTimeout: parseInt((e.target as HTMLInputElement).value) * 1000 } })}
					class="input-field w-32"
					min="5"
					max="300"
				/>
			</div>
		</div>
	</section>
</div>
