<script lang="ts">
	import { currentUser } from '$stores/auth';
	import { goto } from '$app/navigation';
	import { createConversation } from '$stores/chat';
	import { settings } from '$stores/settings';
	import { inputMessage } from '$stores/chat';
	import LoginForm from '$components/auth/LoginForm.svelte';

	let messageInput = '';
	let isCreating = false;

	async function startChatWithMessage() {
		if (!messageInput.trim() || isCreating) return;
		isCreating = true;
		const id = await createConversation('chat', $settings.defaultModel);
		inputMessage.set(messageInput);
		goto(`/chat/${id}`);
	}

	async function startChat() {
		const id = await createConversation('chat', $settings.defaultModel);
		goto(`/chat/${id}`);
	}

	async function startAgent() {
		const id = await createConversation('agent', $settings.defaultModel);
		goto(`/chat/${id}`);
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			startChatWithMessage();
		}
	}

	const suggestions = [
		{ text: 'Build a REST API with Express', icon: 'server' },
		{ text: 'Fix a bug in my React component', icon: 'bug' },
		{ text: 'Write unit tests for my code', icon: 'test' },
		{ text: 'Explain how async/await works', icon: 'learn' }
	];
</script>

<svelte:head>
	<title>KlimCode — AI Coding Assistant</title>
</svelte:head>

{#if !$currentUser}
	<div class="flex items-center justify-center h-full" style="background-color: var(--surface)">
		<LoginForm />
	</div>
{:else}
	<div class="flex-1 flex flex-col items-center justify-center h-full overflow-y-auto">
		<div class="w-full max-w-2xl mx-auto px-4 py-8">
			<!-- Hero -->
			<div class="text-center mb-10">
				<div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-6" style="background-color: var(--accent-subtle); color: var(--content-tertiary); border: 1px solid var(--border)">
					<div class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
					Powered by NVIDIA NIM
				</div>
				<h1 class="text-4xl sm:text-5xl font-bold tracking-tight mb-3" style="color: var(--content)">
					What can I help<br />you build?
				</h1>
				<p class="text-base max-w-md mx-auto" style="color: var(--content-muted)">
					Chat with AI, debug code, generate functions, and create GitHub pull requests.
				</p>
			</div>

			<!-- Main Input -->
			<div class="relative mb-8">
				<div class="rounded-2xl p-3 transition-all shadow-soft" style="background-color: var(--surface-secondary); border: 1px solid var(--border)">
					<textarea
						bind:value={messageInput}
						on:keydown={handleKeydown}
						placeholder="Ask anything about code..."
						rows="3"
						class="w-full bg-transparent resize-none px-1 py-1 focus:outline-none text-[15px] leading-relaxed"
						style="color: var(--content)"
					></textarea>
					<div class="flex items-center justify-between pt-1">
						<div class="flex items-center gap-2">
							<button
								on:click={startAgent}
								class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/20 transition-all"
							>
								<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
								</svg>
								Agent Mode
							</button>
						</div>
						<button
							on:click={startChatWithMessage}
							disabled={!messageInput.trim() || isCreating}
							class="p-2.5 rounded-xl transition-all duration-150"
							style="{messageInput.trim()
								? 'background-color: var(--content); color: var(--surface)'
								: 'background-color: var(--surface-tertiary); color: var(--content-muted); cursor: not-allowed'}"
						>
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
							</svg>
						</button>
					</div>
				</div>
			</div>

			<!-- Suggestion Cards -->
			<div class="grid grid-cols-2 gap-2.5 mb-10">
				{#each suggestions as s}
					<button
						on:click={() => { messageInput = s.text; }}
						class="group p-3.5 rounded-xl text-left transition-all duration-200"
						style="border: 1px solid var(--border); background-color: transparent"
					>
						<span class="text-[13px] leading-snug transition-colors" style="color: var(--content-tertiary)">{s.text}</span>
					</button>
				{/each}
			</div>

			<!-- Quick Actions -->
			<div class="flex items-center justify-center gap-3">
				<button
					on:click={startChat}
					class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm transition-all"
					style="border: 1px solid var(--border); color: var(--content-tertiary)"
				>
					<svg class="w-4 h-4" style="color: var(--content-muted)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
					</svg>
					New Chat
				</button>
				<button
					on:click={startAgent}
					class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm transition-all"
					style="border: 1px solid var(--border); color: var(--content-tertiary)"
				>
					<svg class="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
					</svg>
					New Agent
				</button>
				<a
					href="/settings"
					class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm transition-all"
					style="border: 1px solid var(--border); color: var(--content-tertiary)"
				>
					<svg class="w-4 h-4" style="color: var(--content-muted)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
					</svg>
					Settings
				</a>
			</div>
		</div>
	</div>
{/if}
