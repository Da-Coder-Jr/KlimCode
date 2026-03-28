<script lang="ts">
	import { currentUser } from '$stores/auth';
	import { goto } from '$app/navigation';
	import { createConversation } from '$stores/chat';
	import { settings } from '$stores/settings';
	import { inputMessage } from '$stores/chat';
	import { AVAILABLE_MODELS } from '$lib/models';
	import LoginForm from '$components/auth/LoginForm.svelte';
	import { githubConnected, githubRepos, selectedRepo, selectRepo, loadRepos, reposLoading } from '$stores/github';
	import type { GitHubRepo } from '$types/core';

	let messageInput = '';
	let isCreating = false;
	let fileInput: HTMLInputElement;
	let attachedFiles: { name: string; content: string; type: string; preview?: string }[] = [];
	let agentMode = false;
	let modelSelectorOpen = false;
	let modelSearchQuery = '';
	let textareaEl: HTMLTextAreaElement;
	let repoDropdownOpen = false;
	let repoSearchQuery = '';

	$: selectedModel = AVAILABLE_MODELS.find(m => m.id === $settings.defaultModel) || AVAILABLE_MODELS[0];
	$: filteredModels = modelSearchQuery
		? AVAILABLE_MODELS.filter(m => m.name.toLowerCase().includes(modelSearchQuery.toLowerCase()))
		: AVAILABLE_MODELS;
	$: filteredRepos = repoSearchQuery
		? $githubRepos.filter((r: GitHubRepo) => r.fullName.toLowerCase().includes(repoSearchQuery.toLowerCase()))
		: $githubRepos;

	function toggleRepoDropdown() {
		if ($githubRepos.length === 0 && !$reposLoading) loadRepos();
		repoDropdownOpen = !repoDropdownOpen;
	}

	async function startChatWithMessage() {
		if ((!messageInput.trim() && attachedFiles.length === 0) || isCreating) return;
		isCreating = true;

		try {
			let finalMessage = messageInput;
			for (const file of attachedFiles) {
				if (file.type.startsWith('image/')) {
					finalMessage += `\n\n[Attached image: ${file.name}]`;
				} else {
					finalMessage += `\n\n--- File: ${file.name} ---\n${file.content}\n--- End of ${file.name} ---`;
				}
			}

			const mode = agentMode ? 'agent' : 'chat';
			const id = await createConversation(mode, $settings.defaultModel);
			inputMessage.set(finalMessage);
			messageInput = '';
			attachedFiles = [];
			await goto(`/chat/${id}`);
		} catch (err) {
			console.error('Failed to start chat:', err);
		} finally {
			isCreating = false;
		}
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

	function handleInput() {
		if (textareaEl) {
			textareaEl.style.height = 'auto';
			textareaEl.style.height = Math.min(textareaEl.scrollHeight, 200) + 'px';
		}
	}

	function handleUploadClick() {
		fileInput?.click();
	}

	async function handleFileChange() {
		const files = fileInput?.files;
		if (!files || files.length === 0) return;

		for (const file of Array.from(files)) {
			const maxSize = 5 * 1024 * 1024;
			if (file.size > maxSize) {
				attachedFiles = [...attachedFiles, {
					name: file.name,
					content: `[File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB - max 5MB]`,
					type: file.type
				}];
				continue;
			}

			if (file.type.startsWith('image/')) {
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

	function selectModel(modelId: string) {
		settings.update(s => ({ ...s, defaultModel: modelId }));
		modelSelectorOpen = false;
		modelSearchQuery = '';
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
		<div class="w-full max-w-2xl mx-auto px-4 py-8 animate-fade-in">
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
				<!-- Attached files/images preview — outside wrapper to match ChatInput -->
				{#if attachedFiles.length > 0}
					<div class="flex flex-wrap gap-2 mb-2">
						{#each attachedFiles as file, i}
							{#if file.preview}
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
								<div class="relative group flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs" style="background-color: var(--surface-tertiary); border: 1px solid var(--border); color: var(--content-secondary)">
									<svg class="w-3 h-3 flex-shrink-0" style="color: var(--content-muted)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
									</svg>
									<span class="truncate max-w-[120px]">{file.name}</span>
									<button on:click={() => removeFile(i)} class="transition-colors" style="color: var(--content-muted)">
										<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
										</svg>
									</button>
								</div>
							{/if}
						{/each}
					</div>
				{/if}

				<!-- Wrapper matches ChatInput exactly: no inner padding, border only -->
				<div class="rounded-2xl transition-all" style="background-color: var(--surface-secondary); border: 1px solid var(--border)">
					<textarea
						bind:this={textareaEl}
						bind:value={messageInput}
						on:keydown={handleKeydown}
						on:input={handleInput}
						placeholder="Message KlimCode..."
						rows="1"
						class="scrollbar-custom w-full bg-transparent resize-none px-4 py-3 focus:outline-none text-[15px] leading-relaxed max-h-[200px]"
						style="color: var(--content)"
					></textarea>

					<!-- Hidden file input -->
					<input
						bind:this={fileInput}
						type="file"
						multiple
						accept=".txt,.md,.js,.ts,.py,.json,.csv,.html,.css,.jsx,.tsx,.go,.rs,.java,.c,.cpp,.h,.yml,.yaml,.toml,.xml,.sql,.sh,.bash,.svelte,.vue,image/*"
						class="hidden"
						on:change={handleFileChange}
					/>

					<div class="flex items-center justify-between px-3 pb-2.5">
						<div class="flex items-center gap-2">
							<!-- Upload button -->
							<button
								type="button"
								on:click={handleUploadClick}
								class="p-1.5 rounded-lg transition-all btn-icon"
								title="Attach files or images"
							>
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4v16m8-8H4" />
								</svg>
							</button>

							<!-- Agent mode toggle -->
							<button
								on:click={() => agentMode = !agentMode}
								class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border"
								style="{agentMode
									? 'color: rgb(5, 150, 105); background-color: rgba(16, 185, 129, 0.15); border-color: rgba(16, 185, 129, 0.3)'
									: 'color: var(--content-muted); border-color: var(--border); background-color: transparent'}"
							>
								<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
								</svg>
								Agent {agentMode ? 'On' : 'Off'}
							</button>

							<!-- Repo selector (agent mode only) -->
							{#if agentMode && $githubConnected}
								<div class="relative">
									<button
										on:click={toggleRepoDropdown}
										class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
										style="color: var(--content-muted); border: 1px solid var(--border)"
									>
										<svg class="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 3h18v6H3V3zM3 15h18v6H3v-6z" />
										</svg>
										<span class="truncate max-w-[120px]">{$selectedRepo ? $selectedRepo.name : 'Pick repo'}</span>
										<svg class="w-3 h-3 transition-transform" class:rotate-180={repoDropdownOpen} fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
										</svg>
									</button>

									{#if repoDropdownOpen}
										<button class="fixed inset-0 z-40" on:click={() => { repoDropdownOpen = false; repoSearchQuery = ''; }} aria-label="Close"></button>
										<div class="absolute bottom-full left-0 mb-1.5 w-64 rounded-2xl shadow-elevated z-50 overflow-hidden animate-slide-up" style="background-color: var(--surface-secondary); border: 1px solid var(--border)">
											<div class="px-3 py-2" style="border-bottom: 1px solid var(--border)">
												<input
													bind:value={repoSearchQuery}
													type="text"
													placeholder="Search repos..."
													class="w-full rounded-lg px-3 py-1.5 text-xs focus:outline-none"
													style="background-color: var(--surface-tertiary); color: var(--content-secondary); border: none"
												/>
											</div>
											<div class="max-h-[200px] overflow-y-auto p-1.5">
												{#if $reposLoading}
													<div class="px-3 py-2 text-xs text-center" style="color: var(--content-muted)">Loading...</div>
												{:else if filteredRepos.length === 0}
													<div class="px-3 py-2 text-xs text-center" style="color: var(--content-muted)">No repos found</div>
												{:else}
													{#each filteredRepos as repo (repo.fullName)}
														<button
															on:click={() => { selectRepo(repo); repoDropdownOpen = false; repoSearchQuery = ''; }}
															class="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all text-xs"
															style="{$selectedRepo?.fullName === repo.fullName
																? 'background-color: var(--surface-active); color: var(--content)'
																: 'color: var(--content-tertiary)'}"
														>
															<span class="flex-1 font-medium truncate">{repo.fullName}</span>
															{#if $selectedRepo?.fullName === repo.fullName}
																<svg class="w-3 h-3 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																	<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
																</svg>
															{/if}
														</button>
													{/each}
												{/if}
											</div>
										</div>
									{/if}
								</div>
							{/if}

							<!-- Model selector -->
							<div class="relative">
								<button
									on:click={() => modelSelectorOpen = !modelSelectorOpen}
									class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
									style="color: var(--content-muted); border: 1px solid var(--border)"
								>
									<div class="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
									<span class="truncate max-w-[100px]">{selectedModel.name}</span>
									<svg class="w-3 h-3 transition-transform" class:rotate-180={modelSelectorOpen} fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
									</svg>
								</button>

								{#if modelSelectorOpen}
									<button class="fixed inset-0 z-40" on:click={() => { modelSelectorOpen = false; modelSearchQuery = ''; }} aria-label="Close"></button>
									<div class="absolute bottom-full left-0 mb-1.5 w-72 rounded-2xl shadow-elevated z-50 overflow-hidden animate-slide-up" style="background-color: var(--surface-secondary); border: 1px solid var(--border)">
										<div class="px-3 py-2" style="border-bottom: 1px solid var(--border)">
											<input
												bind:value={modelSearchQuery}
												type="text"
												placeholder="Search models..."
												class="w-full rounded-lg px-3 py-1.5 text-xs focus:outline-none"
												style="background-color: var(--surface-tertiary); color: var(--content-secondary); border: none"
												autofocus
											/>
										</div>
										<div class="max-h-[240px] overflow-y-auto p-1.5">
											{#each filteredModels as model}
												<button
													on:click={() => selectModel(model.id)}
													class="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all text-xs"
													style="{$settings.defaultModel === model.id
														? `background-color: var(--surface-active); color: var(--content)`
														: `color: var(--content-tertiary)`}"
												>
													<span class="flex-1 font-medium truncate">{model.name}</span>
													{#if $settings.defaultModel === model.id}
														<svg class="w-3 h-3 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
															<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
														</svg>
													{/if}
												</button>
											{/each}
										</div>
									</div>
								{/if}
							</div>
						</div>
						<button
							on:click={startChatWithMessage}
							disabled={(!messageInput.trim() && attachedFiles.length === 0) || isCreating}
							class="p-2 rounded-full transition-all duration-150"
							style="{messageInput.trim() || attachedFiles.length > 0
								? 'background-color: var(--content); color: var(--surface)'
								: 'background-color: var(--surface-tertiary); color: var(--content-muted); cursor: not-allowed'}"
						>
							{#if isCreating}
								<svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
									<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
									<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
								</svg>
							{:else}
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
								</svg>
							{/if}
						</button>
					</div>
				</div>
			</div>

			<!-- Suggestion Cards -->
			<div class="grid grid-cols-2 gap-2.5 mb-10">
				{#each suggestions as s}
					<button
						on:click={() => { messageInput = s.text; textareaEl?.focus(); }}
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
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
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
