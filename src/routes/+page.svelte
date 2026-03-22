<script lang="ts">
	import { currentUser } from '$stores/auth';
	import { goto } from '$app/navigation';
	import { createConversation } from '$stores/chat';
	import { settings } from '$stores/settings';
	import { inputMessage } from '$stores/chat';
	import LoginForm from '$components/auth/LoginForm.svelte';

	let messageInput = '';
	let isCreating = false;
	let fileInput: HTMLInputElement;
	let attachedFiles: { name: string; content: string; type: string; preview?: string }[] = [];

	async function startChatWithMessage() {
		if ((!messageInput.trim() && attachedFiles.length === 0) || isCreating) return;
		isCreating = true;

		// Build final message with file contents
		let finalMessage = messageInput;
		for (const file of attachedFiles) {
			if (file.type.startsWith('image/')) {
				finalMessage += `\n\n[Attached image: ${file.name}]`;
			} else {
				finalMessage += `\n\n--- File: ${file.name} ---\n${file.content}\n--- End of ${file.name} ---`;
			}
		}

		const id = await createConversation('chat', $settings.defaultModel);
		inputMessage.set(finalMessage);
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

	function handleUploadClick() {
		fileInput?.click();
	}

	async function handleFileChange() {
		const files = fileInput?.files;
		if (!files || files.length === 0) return;

		for (const file of Array.from(files)) {
			const maxSize = 5 * 1024 * 1024; // 5MB for images
			if (file.size > maxSize) {
				attachedFiles = [...attachedFiles, {
					name: file.name,
					content: `[File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB - max 5MB]`,
					type: file.type
				}];
				continue;
			}

			if (file.type.startsWith('image/')) {
				// Create a preview URL for images
				const preview = URL.createObjectURL(file);
				const reader = new FileReader();
				reader.onload = () => {
					attachedFiles = [...attachedFiles, {
						name: file.name,
						content: reader.result as string,
						type: file.type,
						preview
					}];
				};
				reader.readAsDataURL(file);
			} else {
				try {
					const text = await file.text();
					attachedFiles = [...attachedFiles, {
						name: file.name,
						content: text,
						type: file.type || 'text/plain'
					}];
				} catch {
					attachedFiles = [...attachedFiles, {
						name: file.name,
						content: '[Could not read file]',
						type: file.type
					}];
				}
			}
		}

		if (fileInput) fileInput.value = '';
	}

	function removeFile(index: number) {
		const file = attachedFiles[index];
		if (file.preview) URL.revokeObjectURL(file.preview);
		attachedFiles = attachedFiles.filter((_, i) => i !== index);
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
				<div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-6 animate-fade-in" style="background-color: var(--accent-subtle); color: var(--content-tertiary); border: 1px solid var(--border)">
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
				<div class="rounded-2xl p-3 transition-all shadow-soft hover:shadow-medium" style="background-color: var(--surface-secondary); border: 1px solid var(--border)">
					<!-- Attached files/images preview -->
					{#if attachedFiles.length > 0}
						<div class="flex flex-wrap gap-2 mb-2 px-1">
							{#each attachedFiles as file, i}
								{#if file.preview}
									<!-- Image preview -->
									<div class="relative group">
										<img src={file.preview} alt={file.name} class="w-16 h-16 rounded-lg object-cover" style="border: 1px solid var(--border)" />
										<button
											on:click={() => removeFile(i)}
											class="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-white bg-red-500 hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
										>
											<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
											</svg>
										</button>
									</div>
								{:else}
									<!-- File preview -->
									<div class="relative group flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs" style="background-color: var(--surface-tertiary); border: 1px solid var(--border); color: var(--content-secondary)">
										<svg class="w-3 h-3 flex-shrink-0" style="color: var(--content-muted)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
										</svg>
										<span class="truncate max-w-[100px]">{file.name}</span>
										<button
											on:click={() => removeFile(i)}
											class="transition-colors" style="color: var(--content-muted)"
										>
											<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
											</svg>
										</button>
									</div>
								{/if}
							{/each}
						</div>
					{/if}

					<textarea
						bind:value={messageInput}
						on:keydown={handleKeydown}
						placeholder="Ask anything about code..."
						rows="3"
						class="w-full bg-transparent resize-none px-1 py-1 focus:outline-none text-[15px] leading-relaxed"
						style="color: var(--content)"
					></textarea>

					<!-- Hidden file input -->
					<input
						bind:this={fileInput}
						type="file"
						multiple
						accept=".txt,.md,.js,.ts,.py,.json,.csv,.html,.css,.jsx,.tsx,.go,.rs,.java,.c,.cpp,.h,.yml,.yaml,.toml,.xml,.sql,.sh,.bash,.env,.gitignore,.svelte,.vue,image/*"
						class="hidden"
						on:change={handleFileChange}
					/>

					<div class="flex items-center justify-between pt-1">
						<div class="flex items-center gap-2">
							<!-- Upload button -->
							<button
								type="button"
								on:click={handleUploadClick}
								class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all btn-icon"
								title="Attach files or images"
							>
								<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
								</svg>
								<span>Attach</span>
							</button>

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
							disabled={(!messageInput.trim() && attachedFiles.length === 0) || isCreating}
							class="p-2.5 rounded-xl transition-all duration-150"
							style="{messageInput.trim() || attachedFiles.length > 0
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
						class="group p-3.5 rounded-xl text-left transition-all duration-200 hover:shadow-soft active:scale-[0.98]"
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
					class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm transition-all hover:shadow-soft active:scale-[0.98]"
					style="border: 1px solid var(--border); color: var(--content-tertiary)"
				>
					<svg class="w-4 h-4" style="color: var(--content-muted)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
					</svg>
					New Chat
				</button>
				<button
					on:click={startAgent}
					class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm transition-all hover:shadow-soft active:scale-[0.98]"
					style="border: 1px solid var(--border); color: var(--content-tertiary)"
				>
					<svg class="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
					</svg>
					New Agent
				</button>
				<a
					href="/settings"
					class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm transition-all hover:shadow-soft active:scale-[0.98]"
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
