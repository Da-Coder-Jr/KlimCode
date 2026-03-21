<script lang="ts">
	import { settings, saveSettings, saveApiKey, testApiKey } from '$stores/settings';
	import { AVAILABLE_MODELS } from '$lib/models';
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

<div class="space-y-6">
	<!-- NVIDIA API Key -->
	<section class="card p-6">
		<div class="flex items-start gap-3 mb-4">
			<div class="w-9 h-9 rounded-xl bg-klim-500/10 border border-klim-500/15 flex items-center justify-center flex-shrink-0">
				<svg class="w-4 h-4 text-klim-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
				</svg>
			</div>
			<div>
				<h2 class="text-base font-semibold text-surface-100">NVIDIA NIM API Key</h2>
				<p class="text-sm text-surface-400 mt-0.5">
					Get your free key from <a href="https://build.nvidia.com" target="_blank" rel="noopener" class="text-klim-400 hover:text-klim-300 transition-colors">build.nvidia.com</a>
				</p>
			</div>
		</div>

		<div class="space-y-3">
			<div class="relative">
				{#if apiKeyVisible}
					<input
						bind:value={apiKeyInput}
						type="text"
						placeholder={hasApiKey ? 'Key saved. Enter new key to update.' : 'nvapi-xxxxxxxxxxxxxxxxxx'}
						class="input-field w-full pr-10 text-sm"
					/>
				{:else}
					<input
						bind:value={apiKeyInput}
						type="password"
						placeholder={hasApiKey ? 'Key saved. Enter new key to update.' : 'nvapi-xxxxxxxxxxxxxxxxxx'}
						class="input-field w-full pr-10 text-sm"
					/>
				{/if}
				<button
					on:click={() => apiKeyVisible = !apiKeyVisible}
					class="absolute right-3 top-1/2 -translate-y-1/2 text-surface-500 hover:text-surface-300 transition-colors"
				>
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						{#if apiKeyVisible}
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
						{:else}
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
						{/if}
					</svg>
				</button>
			</div>

			{#if testResult}
				<div class="p-3 rounded-xl text-sm flex items-center gap-2 animate-scale-in
					{testResult.success
						? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
						: 'bg-red-500/10 text-red-300 border border-red-500/20'}">
					<svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						{#if testResult.success}
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
						{:else}
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
						{/if}
					</svg>
					{testResult.message}
				</div>
			{/if}

			{#if hasApiKey && !apiKeyInput}
				<div class="flex items-center gap-2 text-sm text-emerald-400">
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
					</svg>
					API key is saved and active
				</div>
			{/if}

			<div class="flex gap-2">
				<button on:click={handleTestKey} disabled={!apiKeyInput || testing} class="btn-secondary text-sm !py-2">
					{#if testing}
						<span class="flex items-center gap-1.5">
							<svg class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
							Testing...
						</span>
					{:else}
						Test Key
					{/if}
				</button>
				<button on:click={handleSaveKey} disabled={!apiKeyInput || saving} class="btn-primary text-sm !py-2">
					{saved ? 'Saved!' : saving ? 'Saving...' : 'Save Key'}
				</button>
			</div>
		</div>
	</section>

	<!-- Model Selection -->
	<section class="card p-6">
		<div class="flex items-start gap-3 mb-4">
			<div class="w-9 h-9 rounded-xl bg-surface-800/60 border border-surface-700/40 flex items-center justify-center flex-shrink-0">
				<svg class="w-4 h-4 text-surface-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
				</svg>
			</div>
			<div>
				<h2 class="text-base font-semibold text-surface-100">Default Model</h2>
				<p class="text-sm text-surface-400 mt-0.5">Choose your preferred NVIDIA NIM model</p>
			</div>
		</div>

		<select
			value={$settings.defaultModel}
			on:change={handleModelChange}
			class="input-field w-full text-sm"
		>
			{#each AVAILABLE_MODELS || [] as model}
				<option value={model.id}>
					{model.name} - {model.description}
				</option>
			{/each}
		</select>
	</section>

	<!-- GitHub Integration -->
	<section class="card p-6">
		<div class="flex items-start gap-3 mb-4">
			<div class="w-9 h-9 rounded-xl bg-surface-800/60 border border-surface-700/40 flex items-center justify-center flex-shrink-0">
				<svg class="w-4 h-4 text-surface-300" fill="currentColor" viewBox="0 0 24 24">
					<path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
				</svg>
			</div>
			<div>
				<h2 class="text-base font-semibold text-surface-100">GitHub Integration</h2>
				<p class="text-sm text-surface-400 mt-0.5">Connect to enable PR creation and repo browsing</p>
			</div>
		</div>
		<GitHubConnect />
	</section>

	<!-- Agent Settings -->
	<section class="card p-6">
		<div class="flex items-start gap-3 mb-5">
			<div class="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/15 flex items-center justify-center flex-shrink-0">
				<svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
				</svg>
			</div>
			<div>
				<h2 class="text-base font-semibold text-surface-100">Agent Settings</h2>
				<p class="text-sm text-surface-400 mt-0.5">Configure agent behavior and permissions</p>
			</div>
		</div>

		<div class="space-y-5">
			<label class="flex items-center justify-between p-3 rounded-xl hover:bg-surface-800/30 transition-colors cursor-pointer -mx-3">
				<div>
					<div class="text-sm font-medium text-surface-200">Auto-approve file reads</div>
					<div class="text-xs text-surface-500 mt-0.5">Allow agent to read files without confirmation</div>
				</div>
				<input
					type="checkbox"
					checked={$settings.agent.autoApproveReads}
					on:change={(e) => { const el = /** @type {HTMLInputElement} */ (e.target); saveSettings({ agent: { ...$settings.agent, autoApproveReads: el.checked } }); }}
					class="w-5 h-5 rounded-md bg-surface-700 border-surface-600 text-klim-600 focus:ring-klim-500 cursor-pointer"
				/>
			</label>

			<label class="flex items-center justify-between p-3 rounded-xl hover:bg-surface-800/30 transition-colors cursor-pointer -mx-3">
				<div>
					<div class="text-sm font-medium text-surface-200">Auto-approve commands</div>
					<div class="text-xs text-surface-500 mt-0.5">Allow agent to run shell commands without confirmation</div>
				</div>
				<input
					type="checkbox"
					checked={$settings.agent.autoApproveCommands}
					on:change={(e) => { const el = /** @type {HTMLInputElement} */ (e.target); saveSettings({ agent: { ...$settings.agent, autoApproveCommands: el.checked } }); }}
					class="w-5 h-5 rounded-md bg-surface-700 border-surface-600 text-klim-600 focus:ring-klim-500 cursor-pointer"
				/>
			</label>

			<div class="p-3 -mx-3">
				<label class="text-sm font-medium text-surface-200 block mb-2">Sandbox timeout (seconds)</label>
				<input
					type="number"
					value={$settings.agent.sandboxTimeout / 1000}
					on:change={(e) => { const el = /** @type {HTMLInputElement} */ (e.target); saveSettings({ agent: { ...$settings.agent, sandboxTimeout: parseInt(el.value) * 1000 } }); }}
					class="input-field w-32 text-sm"
					min="5"
					max="300"
				/>
			</div>
		</div>
	</section>
</div>
