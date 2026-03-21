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

<div class="min-h-screen flex items-center justify-center p-4 bg-mesh relative overflow-hidden">
	<!-- Background decoration -->
	<div class="absolute inset-0 pointer-events-none">
		<div class="absolute top-1/4 left-1/4 w-96 h-96 bg-klim-600/5 rounded-full blur-3xl animate-float"></div>
		<div class="absolute bottom-1/4 right-1/4 w-80 h-80 bg-klim-500/5 rounded-full blur-3xl animate-float" style="animation-delay: -3s"></div>
		<div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-klim-950/30 rounded-full blur-3xl"></div>
	</div>

	<div class="w-full max-w-[420px] relative z-10 animate-fade-in-up">
		<!-- Logo + Branding -->
		<div class="text-center mb-10">
			<div class="relative inline-flex mb-6">
				<div class="w-20 h-20 bg-gradient-to-br from-klim-400 via-klim-600 to-klim-800 rounded-2xl flex items-center justify-center shadow-glow-lg rotate-3 hover:rotate-0 transition-transform duration-500 cursor-default">
					<span class="text-white font-black text-3xl -rotate-3 hover:rotate-0 transition-transform duration-500">K</span>
				</div>
				<div class="absolute -bottom-1 -right-1">
					<div class="w-6 h-6 bg-emerald-500 rounded-full border-[3px] border-surface-950 flex items-center justify-center shadow-lg">
						<svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
						</svg>
					</div>
				</div>
			</div>

			<h1 class="text-3xl font-black text-surface-100 tracking-tight mb-1">
				{mode === 'login' ? 'Welcome back' : 'Get started'}
			</h1>
			<p class="text-surface-400 text-sm">
				{mode === 'login' ? 'Sign in to your KlimCode account' : 'Create your KlimCode account'}
			</p>
		</div>

		<!-- Login Card -->
		<div class="card p-8 shadow-2xl shadow-black/20">
			<!-- GitHub OAuth Button -->
			<a
				href="/api/github/connect"
				class="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl
					bg-surface-100 hover:bg-white text-surface-900
					font-semibold text-sm
					transition-all duration-200 shadow-lg shadow-black/10
					hover:shadow-xl hover:shadow-black/15
					active:scale-[0.98]"
			>
				<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
					<path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
				</svg>
				Continue with GitHub
			</a>

			<!-- Divider -->
			<div class="relative my-7">
				<div class="absolute inset-0 flex items-center">
					<div class="w-full border-t border-surface-700/60"></div>
				</div>
				<div class="relative flex justify-center text-xs">
					<span class="px-4 bg-surface-800/40 text-surface-500 backdrop-blur-sm rounded-full">or continue with email</span>
				</div>
			</div>

			<!-- Form -->
			<form on:submit|preventDefault={handleSubmit} class="space-y-4">
				{#if mode === 'register'}
					<div class="animate-slide-down">
						<label for="displayName" class="block text-sm font-medium text-surface-300 mb-1.5">Display Name</label>
						<input
							id="displayName"
							bind:value={displayName}
							type="text"
							placeholder="Your Name"
							class="input-field w-full"
							autocomplete="name"
						/>
					</div>
				{/if}

				<div>
					<label for="username" class="block text-sm font-medium text-surface-300 mb-1.5">Username</label>
					<input
						id="username"
						bind:value={username}
						type="text"
						placeholder="Enter your username"
						required
						class="input-field w-full"
						autocomplete="username"
					/>
				</div>

				<div>
					<label for="password" class="block text-sm font-medium text-surface-300 mb-1.5">Password</label>
					<input
						id="password"
						bind:value={password}
						type="password"
						placeholder="Enter your password"
						required
						minlength="6"
						class="input-field w-full"
						autocomplete={mode === 'login' ? 'current-password' : 'new-password'}
					/>
				</div>

				{#if $authError}
					<div class="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm flex items-start gap-2 animate-scale-in">
						<svg class="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
						{$authError}
					</div>
				{/if}

				<button
					type="submit"
					disabled={loading || !username || !password}
					class="btn-primary w-full !py-3 text-sm font-semibold mt-2"
				>
					{#if loading}
						<div class="flex items-center justify-center gap-2">
							<svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
								<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
								<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
							</svg>
							{mode === 'login' ? 'Signing in...' : 'Creating account...'}
						</div>
					{:else}
						{mode === 'login' ? 'Sign In' : 'Create Account'}
					{/if}
				</button>
			</form>
		</div>

		<!-- Toggle mode -->
		<div class="mt-6 text-center">
			<button on:click={toggleMode} class="text-sm text-surface-400 hover:text-surface-200 transition-colors">
				{mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
				<span class="text-klim-400 hover:text-klim-300 font-medium ml-1">
					{mode === 'login' ? 'Create one' : 'Sign in'}
				</span>
			</button>
		</div>

		<!-- Footer -->
		<div class="mt-8 text-center text-xs text-surface-600">
			Free AI powered by <a href="https://build.nvidia.com" target="_blank" rel="noopener" class="text-klim-500 hover:text-klim-400 transition-colors">NVIDIA NIM</a>
		</div>
	</div>
</div>
