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
	<section class="card p-5">
		<div class="flex items-start gap-3 mb-4">
			<div class="w-9 h-9 rounded-xl bg-green-500/10 flex items-center justify-center flex-shrink-0 border border-green-500/20">
				<svg class="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
				</svg>
			</div>
			<div>
				<h2 class="text-[15px] font-semibold text-zinc-100">NVIDIA NIM API Key</h2>
				<p class="text-xs text-zinc-500 mt-0.5">
					Get your free API key from <a href="https://build.nvidia.com" target="_blank" rel="noopener" class="text-blue-400 hover:text-blue-300 transition-colors">build.nvidia.com</a>
				</p>
			</div>
		</div>

		<div class="space-y-3">
			<div class="relative">
				{#if apiKeyVisible}
					<input
						bind:value={apiKeyInput}
						type="text"
						placeholder={hasApiKey ? 'Key saved - enter new key to update' : 'nvapi-xxxxxxxxxxxxxxxxxx'}
						class="input-field pr-10"
					/>
				{:else}
					<input
						bind:value={apiKeyInput}
						type="password"
						placeholder={hasApiKey ? 'Key saved - enter new key to update' : 'nvapi-xxxxxxxxxxxxxxxxxx'}
						class="input-field pr-10"
					/>
				{/if}
				<button
					on:click={() => apiKeyVisible = !apiKeyVisible}
					class="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
				>
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						{#if apiKeyVisible}
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
						{:else}
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
						{/if}
					</svg>
				</button>
			</div>

			{#if testResult}
				<div class="p-3 rounded-xl text-sm {testResult.success ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}">
					{testResult.message}
				</div>
			{/if}

			<div class="flex gap-2">
				<button on:click={handleTestKey} disabled={!apiKeyInput || testing} class="btn-secondary text-sm py-2">
					{testing ? 'Testing...' : 'Test Key'}
				</button>
				<button on:click={handleSaveKey} disabled={!apiKeyInput || saving} class="btn-primary text-sm py-2">
					{#if saved}
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
						</svg>
						Saved!
					{:else}
						{saving ? 'Saving...' : 'Save Key'}
					{/if}
				</button>
			</div>
		</div>
	</section>

	<!-- Model Selection -->
	<section class="card p-5">
		<div class="flex items-start gap-3 mb-4">
			<div class="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0 border border-blue-500/20">
				<svg class="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
				</svg>
			</div>
			<div>
				<h2 class="text-[15px] font-semibold text-zinc-100">Default Model</h2>
				<p class="text-xs text-zinc-500 mt-0.5">Choose which model to use for new conversations</p>
			</div>
		</div>

		<select
			value={$settings.defaultModel}
			on:change={handleModelChange}
			class="input-field"
		>
			{#each AVAILABLE_MODELS || [] as model}
				<option value={model.id}>
					{model.name} — {model.description}
				</option>
			{/each}
		</select>
	</section>

	<!-- GitHub -->
	<section class="card p-5">
		<div class="flex items-start gap-3 mb-4">
			<div class="w-9 h-9 rounded-xl bg-zinc-800 flex items-center justify-center flex-shrink-0 border border-zinc-700">
				<svg class="w-4 h-4 text-zinc-300" fill="currentColor" viewBox="0 0 24 24">
					<path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
				</svg>
			</div>
			<div>
				<h2 class="text-[15px] font-semibold text-zinc-100">GitHub Integration</h2>
				<p class="text-xs text-zinc-500 mt-0.5">Connect GitHub to enable PR creation and repo browsing</p>
			</div>
		</div>
		<GitHubConnect />
	</section>

	<!-- Agent Settings -->
	<section class="card p-5">
		<div class="flex items-start gap-3 mb-5">
			<div class="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0 border border-emerald-500/20">
				<svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
				</svg>
			</div>
			<div>
				<h2 class="text-[15px] font-semibold text-zinc-100">Agent Settings</h2>
				<p class="text-xs text-zinc-500 mt-0.5">Configure how the coding agent operates</p>
			</div>
		</div>

		<div class="space-y-4">
			<label class="flex items-center justify-between py-1 cursor-pointer group">
				<div>
					<div class="text-sm text-zinc-300 group-hover:text-zinc-100 transition-colors">Auto-approve file reads</div>
					<div class="text-xs text-zinc-600">Let agent read files without confirmation</div>
				</div>
				<div class="relative">
					<input
						type="checkbox"
						checked={$settings.agent.autoApproveReads}
						on:change={(e) => { const el = /** @type {HTMLInputElement} */ (e.target); saveSettings({ agent: { ...$settings.agent, autoApproveReads: el.checked } }); }}
						class="sr-only peer"
					/>
					<div class="w-9 h-5 bg-zinc-700 rounded-full peer-checked:bg-blue-600 peer-focus-visible:ring-2 peer-focus-visible:ring-blue-500 transition-colors"></div>
					<div class="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4 shadow-sm"></div>
				</div>
			</label>

			<div class="h-px bg-zinc-800"></div>

			<label class="flex items-center justify-between py-1 cursor-pointer group">
				<div>
					<div class="text-sm text-zinc-300 group-hover:text-zinc-100 transition-colors">Auto-approve commands</div>
					<div class="text-xs text-zinc-600">Let agent run shell commands without confirmation</div>
				</div>
				<div class="relative">
					<input
						type="checkbox"
						checked={$settings.agent.autoApproveCommands}
						on:change={(e) => { const el = /** @type {HTMLInputElement} */ (e.target); saveSettings({ agent: { ...$settings.agent, autoApproveCommands: el.checked } }); }}
						class="sr-only peer"
					/>
					<div class="w-9 h-5 bg-zinc-700 rounded-full peer-checked:bg-blue-600 peer-focus-visible:ring-2 peer-focus-visible:ring-blue-500 transition-colors"></div>
					<div class="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4 shadow-sm"></div>
				</div>
			</label>

			<div class="h-px bg-zinc-800"></div>

			<div class="py-1">
				<label class="text-sm text-zinc-300 block mb-2">Sandbox timeout</label>
				<div class="flex items-center gap-3">
					<input
						type="number"
						value={$settings.agent.sandboxTimeout / 1000}
						on:change={(e) => { const el = /** @type {HTMLInputElement} */ (e.target); saveSettings({ agent: { ...$settings.agent, sandboxTimeout: parseInt(el.value) * 1000 } }); }}
						class="input-field w-24 text-sm"
						min="5"
						max="300"
					/>
					<span class="text-xs text-zinc-600">seconds</span>
				</div>
			</div>
		</div>
	</section>
</div>
