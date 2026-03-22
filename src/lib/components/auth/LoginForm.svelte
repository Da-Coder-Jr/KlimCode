<script lang="ts">
	import { login, register, authError } from '$stores/auth';
	import { goto } from '$app/navigation';

	let mode: 'login' | 'register' = 'login';
	let username = '';
	let password = '';
	let displayName = '';
	let loading = false;

	async function handleSubmit() {
		if (!username || !password) return;
		loading = true;

		let success: boolean;
		if (mode === 'register') {
			success = await register(username, password, displayName || username);
		} else {
			success = await login(username, password);
		}

		loading = false;
		if (success) {
			goto('/');
		}
	}

	function toggleMode() {
		mode = mode === 'login' ? 'register' : 'login';
		authError.set(null);
	}

	function handleGitHubLogin() {
		window.location.href = '/api/github/connect';
	}
</script>

<div class="w-full max-w-[400px] mx-auto px-4">
	<!-- Logo & Title -->
	<div class="text-center mb-8">
		<img src="/favicon.svg" alt="KlimCode" class="w-16 h-16 mx-auto mb-5 rounded-2xl shadow-medium" />
		<h1 class="text-2xl font-bold tracking-tight" style="color: var(--content)">
			{mode === 'login' ? 'Welcome back' : 'Create your account'}
		</h1>
		<p class="text-sm mt-2" style="color: var(--content-muted)">
			{mode === 'login' ? 'Sign in to continue to KlimCode' : 'Get started with AI-powered coding'}
		</p>
	</div>

	<!-- GitHub OAuth -->
	<button
		on:click={handleGitHubLogin}
		class="w-full btn-github mb-5"
	>
		<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
			<path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
		</svg>
		Continue with GitHub
	</button>

	<!-- Divider -->
	<div class="relative mb-5">
		<div class="absolute inset-0 flex items-center">
			<div class="w-full" style="border-top: 1px solid var(--border)"></div>
		</div>
		<div class="relative flex justify-center text-xs">
			<span class="px-3" style="background-color: var(--surface); color: var(--content-muted)">or continue with email</span>
		</div>
	</div>

	<!-- Form -->
	<form on:submit|preventDefault={handleSubmit} class="space-y-3.5">
		{#if mode === 'register'}
			<div>
				<label for="displayName" class="block text-[13px] font-medium mb-1.5" style="color: var(--content-tertiary)">Display Name</label>
				<input
					id="displayName"
					bind:value={displayName}
					type="text"
					placeholder="Your name"
					class="input-field"
				/>
			</div>
		{/if}

		<div>
			<label for="username" class="block text-[13px] font-medium mb-1.5" style="color: var(--content-tertiary)">Username</label>
			<input
				id="username"
				bind:value={username}
				type="text"
				placeholder="Enter your username"
				required
				class="input-field"
				autocomplete="username"
			/>
		</div>

		<div>
			<label for="password" class="block text-[13px] font-medium mb-1.5" style="color: var(--content-tertiary)">Password</label>
			<input
				id="password"
				bind:value={password}
				type="password"
				placeholder="Enter your password"
				required
				minlength="6"
				class="input-field"
				autocomplete={mode === 'login' ? 'current-password' : 'new-password'}
			/>
		</div>

		{#if $authError}
			<div class="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm flex items-start gap-2">
				<svg class="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
				</svg>
				{$authError}
			</div>
		{/if}

		<button
			type="submit"
			disabled={loading || !username || !password}
			class="btn-primary w-full"
		>
			{#if loading}
				<svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
					<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
					<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
				</svg>
				{mode === 'login' ? 'Signing in...' : 'Creating account...'}
			{:else}
				{mode === 'login' ? 'Sign In' : 'Create Account'}
			{/if}
		</button>
	</form>

	<!-- Toggle Mode -->
	<div class="mt-6 text-center">
		<button on:click={toggleMode} class="text-sm transition-colors" style="color: var(--content-muted)">
			{mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
			<span class="font-medium" style="color: var(--content)">{mode === 'login' ? 'Sign up' : 'Sign in'}</span>
		</button>
	</div>

	<!-- Footer -->
	<div class="mt-8 text-center">
		<p class="text-xs" style="color: var(--content-muted)">
			Powered by free AI models from <a href="https://build.nvidia.com" target="_blank" rel="noopener" class="transition-colors" style="color: var(--content-tertiary)">NVIDIA NIM</a>
		</p>
	</div>
</div>
