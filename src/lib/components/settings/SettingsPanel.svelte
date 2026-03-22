<script lang="ts">
	import { settings, saveSettings, saveApiKey, testApiKey } from '$stores/settings';
	import { themePreference, setTheme } from '$stores/theme';
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

	function handleThemeChange(theme: string) {
		setTheme(theme as 'light' | 'dark' | 'system');
		document.documentElement.classList.add('theme-transitioning');
		setTimeout(() => document.documentElement.classList.remove('theme-transitioning'), 250);
	}
</script>

<div class="space-y-6">
	<!-- Appearance / Theme -->
	<section class="card p-5">
		<div class="flex items-start gap-3 mb-4">
			<div class="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style="background-color: var(--accent-subtle); border: 1px solid var(--border)">
				<svg class="w-4 h-4" style="color: var(--content-tertiary)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
				</svg>
			</div>
			<div>
				<h2 class="text-[15px] font-semibold" style="color: var(--content)">Appearance</h2>
				<p class="text-xs mt-0.5" style="color: var(--content-muted)">Choose your preferred theme</p>
			</div>
		</div>

		<div class="flex gap-2">
			{#each [
				{ value: 'light', label: 'Light' },
				{ value: 'dark', label: 'Dark' },
				{ value: 'system', label: 'System' }
			] as option}
				<button
					on:click={() => { handleThemeChange(option.value); }}
					class="flex-1 py-2.5 px-3 rounded-xl text-sm font-medium transition-all"
					style="{$themePreference === option.value
						? `background-color: var(--content); color: var(--surface)`
						: `background-color: var(--surface-tertiary); color: var(--content-tertiary); border: 1px solid var(--border)`}"
				>
					{option.label}
				</button>
			{/each}
		</div>
	</section>

	<!-- NVIDIA API Key -->
	<section class="card p-5">
		<div class="flex items-start gap-3 mb-4">
			<div class="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0 border border-emerald-500/20">
				<svg class="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
				</svg>
			</div>
			<div>
				<h2 class="text-[15px] font-semibold" style="color: var(--content)">NVIDIA NIM API Key</h2>
				<p class="text-xs mt-0.5" style="color: var(--content-muted)">
					Get your free API key from <a href="https://build.nvidia.com" target="_blank" rel="noopener" class="underline transition-colors" style="color: var(--content-tertiary)">build.nvidia.com</a>
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
					class="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
					style="color: var(--content-muted)"
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
				<div class="p-3 rounded-xl text-sm {testResult.success ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'}">
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

			<!-- Security info -->
			<div class="flex items-start gap-2 p-3 rounded-xl" style="background-color: var(--surface-tertiary); border: 1px solid var(--border)">
				<svg class="w-4 h-4 text-emerald-500 dark:text-emerald-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
				</svg>
				<div class="text-[11px] leading-relaxed" style="color: var(--content-muted)">
					Your API key is encrypted with <span style="color: var(--content-tertiary)">AES-256-GCM</span> before storage. It is never exposed in the browser or logs. Set <code class="px-1 rounded text-[10px]" style="color: var(--content-tertiary); background-color: var(--code-bg)">ENCRYPTION_SECRET</code> env var for production.
				</div>
			</div>
		</div>
	</section>

	<!-- Model Selection -->
	<section class="card p-5">
		<div class="flex items-start gap-3 mb-4">
			<div class="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style="background-color: var(--accent-subtle); border: 1px solid var(--border)">
				<svg class="w-4 h-4" style="color: var(--content-tertiary)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
				</svg>
			</div>
			<div>
				<h2 class="text-[15px] font-semibold" style="color: var(--content)">Default Model</h2>
				<p class="text-xs mt-0.5" style="color: var(--content-muted)">Choose which model to use for new conversations</p>
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
			<div class="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style="background-color: var(--surface-tertiary); border: 1px solid var(--border)">
				<svg class="w-4 h-4" style="color: var(--content-secondary)" fill="currentColor" viewBox="0 0 24 24">
					<path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
				</svg>
			</div>
			<div>
				<h2 class="text-[15px] font-semibold" style="color: var(--content)">GitHub Integration</h2>
				<p class="text-xs mt-0.5" style="color: var(--content-muted)">Connect GitHub to enable PR creation and repo browsing</p>
			</div>
		</div>
		<GitHubConnect />
	</section>

	<!-- Agent Settings -->
	<section class="card p-5">
		<div class="flex items-start gap-3 mb-5">
			<div class="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0 border border-emerald-500/20">
				<svg class="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
				</svg>
			</div>
			<div>
				<h2 class="text-[15px] font-semibold" style="color: var(--content)">Agent Settings</h2>
				<p class="text-xs mt-0.5" style="color: var(--content-muted)">Configure how the coding agent operates</p>
			</div>
		</div>

		<div class="space-y-4">
			<label class="flex items-center justify-between py-1 cursor-pointer group">
				<div>
					<div class="text-sm transition-colors" style="color: var(--content-secondary)">Auto-approve file reads</div>
					<div class="text-xs" style="color: var(--content-muted)">Let agent read files without confirmation</div>
				</div>
				<div class="relative">
					<input
						type="checkbox"
						checked={$settings.agent.autoApproveReads}
						on:change={(e) => { saveSettings({ agent: { ...$settings.agent, autoApproveReads: (e.currentTarget).checked } }); }}
						class="sr-only peer"
					/>
					<div class="w-9 h-5 rounded-full peer-focus-visible:ring-2 transition-colors" style="background-color: var(--surface-active)" class:!bg-emerald-500={$settings.agent.autoApproveReads}></div>
					<div class="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow-sm" class:translate-x-4={$settings.agent.autoApproveReads}></div>
				</div>
			</label>

			<div style="height: 1px; background-color: var(--border)"></div>

			<label class="flex items-center justify-between py-1 cursor-pointer group">
				<div>
					<div class="text-sm transition-colors" style="color: var(--content-secondary)">Auto-approve commands</div>
					<div class="text-xs" style="color: var(--content-muted)">Let agent run shell commands without confirmation</div>
				</div>
				<div class="relative">
					<input
						type="checkbox"
						checked={$settings.agent.autoApproveCommands}
						on:change={(e) => { saveSettings({ agent: { ...$settings.agent, autoApproveCommands: (e.currentTarget).checked } }); }}
						class="sr-only peer"
					/>
					<div class="w-9 h-5 rounded-full peer-focus-visible:ring-2 transition-colors" style="background-color: var(--surface-active)" class:!bg-emerald-500={$settings.agent.autoApproveCommands}></div>
					<div class="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow-sm" class:translate-x-4={$settings.agent.autoApproveCommands}></div>
				</div>
			</label>

			<div style="height: 1px; background-color: var(--border)"></div>

			<div class="py-1">
				<label class="text-sm block mb-2" style="color: var(--content-secondary)">Sandbox timeout</label>
				<div class="flex items-center gap-3">
					<input
						type="number"
						value={$settings.agent.sandboxTimeout / 1000}
						on:change={(e) => { saveSettings({ agent: { ...$settings.agent, sandboxTimeout: parseInt(e.currentTarget.value) * 1000 } }); }}
						class="input-field w-24 text-sm"
						min="5"
						max="300"
					/>
					<span class="text-xs" style="color: var(--content-muted)">seconds</span>
				</div>
			</div>
		</div>
	</section>
</div>
