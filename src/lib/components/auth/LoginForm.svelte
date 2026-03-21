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
</script>

<div class="w-full max-w-sm mx-auto">
	<div class="text-center mb-8">
		<div class="w-16 h-16 bg-gradient-to-br from-klim-500 to-klim-700 rounded-2xl flex items-center justify-center mx-auto mb-4 glow-klim-lg">
			<span class="text-white font-bold text-2xl">K</span>
		</div>
		<h1 class="text-2xl font-bold text-surface-100">
			{mode === 'login' ? 'Welcome back' : 'Create account'}
		</h1>
		<p class="text-surface-400 text-sm mt-1">
			{mode === 'login' ? 'Sign in to KlimCode' : 'Get started with KlimCode'}
		</p>
	</div>

	<form on:submit|preventDefault={handleSubmit} class="space-y-4">
		{#if mode === 'register'}
			<div>
				<label for="displayName" class="block text-sm font-medium text-surface-300 mb-1">Display Name</label>
				<input
					id="displayName"
					bind:value={displayName}
					type="text"
					placeholder="Your Name"
					class="input-field w-full"
				/>
			</div>
		{/if}

		<div>
			<label for="username" class="block text-sm font-medium text-surface-300 mb-1">Username</label>
			<input
				id="username"
				bind:value={username}
				type="text"
				placeholder="username"
				required
				class="input-field w-full"
				autocomplete="username"
			/>
		</div>

		<div>
			<label for="password" class="block text-sm font-medium text-surface-300 mb-1">Password</label>
			<input
				id="password"
				bind:value={password}
				type="password"
				placeholder="••••••••"
				required
				minlength="6"
				class="input-field w-full"
				autocomplete={mode === 'login' ? 'current-password' : 'new-password'}
			/>
		</div>

		{#if $authError}
			<div class="p-3 rounded-lg bg-red-900/30 border border-red-700/50 text-red-300 text-sm">
				{$authError}
			</div>
		{/if}

		<button
			type="submit"
			disabled={loading || !username || !password}
			class="btn-primary w-full"
		>
			{loading ? (mode === 'login' ? 'Signing in...' : 'Creating account...') : (mode === 'login' ? 'Sign In' : 'Create Account')}
		</button>
	</form>

	<div class="mt-6 text-center">
		<button on:click={toggleMode} class="text-sm text-klim-400 hover:text-klim-300">
			{mode === 'login' ? "Don't have an account? Create one" : 'Already have an account? Sign in'}
		</button>
	</div>

	<div class="mt-4">
		<div class="relative">
			<div class="absolute inset-0 flex items-center">
				<div class="w-full border-t border-surface-700"></div>
			</div>
			<div class="relative flex justify-center text-xs">
				<span class="px-2 bg-surface-950 text-surface-500">or</span>
			</div>
		</div>

		<a
			href="/api/github/connect"
			class="mt-4 w-full flex items-center justify-center gap-2 btn-secondary"
		>
			<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
				<path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
			</svg>
			Continue with GitHub
		</a>
	</div>
</div>
