<script lang="ts">
	import { currentUser } from '$stores/auth';
	import { goto } from '$app/navigation';
	import { createConversation } from '$stores/chat';
	import { settings } from '$stores/settings';
	import { inputMessage } from '$stores/chat';
	import { AVAILABLE_MODELS } from '$lib/models';
	import LoginForm from '$components/auth/LoginForm.svelte';
	import { onMount } from 'svelte';

	let messageInput = '';
	let isCreating = false;
	let fileInput: HTMLInputElement;
	let attachedFiles: { name: string; content: string; type: string; preview?: string }[] = [];
	let agentMode = false;
	let modelSelectorOpen = false;
	let modelSearchQuery = '';
	let textareaEl: HTMLTextAreaElement;
	let mounted = false;

	onMount(() => { mounted = true; });

	$: selectedModel = AVAILABLE_MODELS.find(m => m.id === $settings.defaultModel) || AVAILABLE_MODELS[0];
	$: filteredModels = modelSearchQuery
		? AVAILABLE_MODELS.filter(m => m.name.toLowerCase().includes(modelSearchQuery.toLowerCase()))
		: AVAILABLE_MODELS;

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
			textareaEl.style.height = Math.min(textareaEl.scrollHeight, 160) + 'px';
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

	function useSuggestion(text: string) {
		messageInput = text;
		textareaEl?.focus();
	}

	const suggestions = [
		{ text: 'Build a REST API with Express', icon: 'server', gradient: 'from-blue-500/10 to-cyan-500/10' },
		{ text: 'Fix a bug in my React component', icon: 'bug', gradient: 'from-rose-500/10 to-orange-500/10' },
		{ text: 'Write unit tests for my code', icon: 'test', gradient: 'from-emerald-500/10 to-teal-500/10' },
		{ text: 'Explain how async/await works', icon: 'learn', gradient: 'from-violet-500/10 to-purple-500/10' }
	];

	const features = [
		{ title: 'AI Chat', desc: 'Get instant coding help with 10+ powerful models', icon: 'chat' },
		{ title: 'Agent Mode', desc: 'Autonomous code editing and PR creation', icon: 'agent' },
		{ title: 'GitHub Integration', desc: 'Read, write, and ship code directly to your repos', icon: 'github' }
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
	<div class="flex-1 flex flex-col items-center h-full overflow-y-auto relative">
		<!-- Ambient background glow -->
		<div class="landing-glow" aria-hidden="true"></div>
		<div class="landing-grid" aria-hidden="true"></div>

		<div class="w-full max-w-3xl mx-auto px-5 py-12 relative z-10"
			class:landing-mounted={mounted}
		>
			<!-- Hero Section -->
			<div class="text-center mb-12">
				<!-- Status badge -->
				<div class="inline-flex items-center gap-2.5 px-4 py-2 rounded-full text-xs font-medium mb-8 landing-badge"
					style="border: 1px solid var(--border)"
				>
					<span class="relative flex h-2 w-2">
						<span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
						<span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
					</span>
					<span style="color: var(--content-tertiary)">Powered by NVIDIA NIM</span>
					<span class="landing-divider"></span>
					<span style="color: var(--content-muted)">{AVAILABLE_MODELS.length} models available</span>
				</div>

				<!-- Main heading -->
				<h1 class="text-5xl sm:text-6xl font-bold tracking-tight mb-5 leading-[1.1]" style="color: var(--content)">
					What can I help
					<br />
					<span class="landing-gradient-text">you build?</span>
				</h1>

				<p class="text-base sm:text-lg max-w-lg mx-auto leading-relaxed" style="color: var(--content-muted)">
					Chat with AI, debug code, generate functions, and create pull requests — all from one place.
				</p>
			</div>

			<!-- Main Input Card -->
			<div class="relative mb-10 landing-input-wrapper">
				<div class="landing-input-card rounded-2xl p-4 transition-all"
					style="background-color: var(--surface-secondary); border: 1px solid var(--border)"
				>
					<!-- Attached files/images preview -->
					{#if attachedFiles.length > 0}
						<div class="flex flex-wrap gap-2 mb-3 px-1">
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
						bind:this={textareaEl}
						bind:value={messageInput}
						on:keydown={handleKeydown}
						on:input={handleInput}
						placeholder="Ask anything about code..."
						rows="3"
						class="w-full bg-transparent resize-none px-2 py-2 focus:outline-none text-[15px] leading-relaxed"
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

					<div class="flex items-center justify-between pt-2" style="border-top: 1px solid var(--border)">
						<div class="flex items-center gap-1.5">
							<!-- Upload button -->
							<button
								type="button"
								on:click={handleUploadClick}
								class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all hover:bg-[var(--surface-hover)]"
								style="color: var(--content-muted)"
								title="Attach files or images"
							>
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
								</svg>
								<span>Attach</span>
							</button>

							<!-- Agent mode toggle -->
							<button
								on:click={() => agentMode = !agentMode}
								class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border"
								style="{agentMode
									? 'color: rgb(5, 150, 105); background-color: rgba(16, 185, 129, 0.12); border-color: rgba(16, 185, 129, 0.25)'
									: 'color: var(--content-muted); border-color: var(--border); background-color: transparent'}"
							>
								<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
								</svg>
								Agent {agentMode ? 'On' : 'Off'}
							</button>

							<!-- Model selector -->
							<div class="relative">
								<button
									on:click={() => modelSelectorOpen = !modelSelectorOpen}
									class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all hover:bg-[var(--surface-hover)]"
									style="color: var(--content-muted); border: 1px solid var(--border)"
								>
									<div class="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
									<span class="truncate max-w-[120px]">{selectedModel.name}</span>
									<svg class="w-3 h-3 transition-transform" class:rotate-180={modelSelectorOpen} fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
									</svg>
								</button>

								{#if modelSelectorOpen}
									<button class="fixed inset-0 z-40" on:click={() => { modelSelectorOpen = false; modelSearchQuery = ''; }} aria-label="Close"></button>
									<div class="absolute bottom-full left-0 mb-1.5 w-80 rounded-2xl shadow-elevated z-50 overflow-hidden animate-slide-up" style="background-color: var(--surface-secondary); border: 1px solid var(--border)">
										<div class="px-3 py-2.5" style="border-bottom: 1px solid var(--border)">
											<input
												bind:value={modelSearchQuery}
												type="text"
												placeholder="Search models..."
												class="w-full rounded-lg px-3 py-2 text-xs focus:outline-none"
												style="background-color: var(--surface-tertiary); color: var(--content-secondary); border: none"
												autofocus
											/>
										</div>
										<div class="max-h-[280px] overflow-y-auto p-1.5">
											{#each filteredModels as model}
												<button
													on:click={() => selectModel(model.id)}
													class="w-full flex items-start gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all text-xs"
													style="{$settings.defaultModel === model.id
														? `background-color: var(--surface-active); color: var(--content)`
														: `color: var(--content-tertiary)`}"
												>
													<div class="flex-1 min-w-0">
														<div class="font-medium truncate" style="color: {$settings.defaultModel === model.id ? 'var(--content)' : 'var(--content-secondary)'}">{model.name}</div>
														<div class="text-[10px] mt-0.5 truncate" style="color: var(--content-muted)">{model.description}</div>
													</div>
													{#if !model.supportsTools}
														<span class="text-[9px] px-1.5 py-0.5 rounded-md flex-shrink-0 mt-0.5" style="background-color: var(--surface-tertiary); color: var(--content-muted)">No tools</span>
													{/if}
													{#if $settings.defaultModel === model.id}
														<svg class="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
							class="landing-send-btn p-2.5 rounded-xl transition-all duration-200"
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
			<div class="grid grid-cols-2 gap-3 mb-12">
				{#each suggestions as s, i}
					<button
						on:click={() => useSuggestion(s.text)}
						class="group relative p-4 rounded-2xl text-left transition-all duration-300 hover:shadow-medium active:scale-[0.98] overflow-hidden landing-suggestion"
						style="border: 1px solid var(--border); background-color: var(--surface-secondary)"
						style:animation-delay="{i * 80}ms"
					>
						<div class="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br {s.gradient}"></div>
						<span class="relative text-[13px] leading-snug font-medium" style="color: var(--content-tertiary)">{s.text}</span>
						<svg class="relative w-3.5 h-3.5 mt-2 opacity-0 group-hover:opacity-60 transition-all duration-300 -translate-x-1 group-hover:translate-x-0" style="color: var(--content-muted)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
						</svg>
					</button>
				{/each}
			</div>

			<!-- Feature Cards -->
			<div class="grid grid-cols-3 gap-3 mb-10">
				{#each features as feat}
					<div class="landing-feature-card p-5 rounded-2xl text-center" style="border: 1px solid var(--border); background-color: var(--surface-secondary)">
						<div class="w-10 h-10 mx-auto mb-3 rounded-xl flex items-center justify-center" style="background-color: var(--surface-tertiary)">
							{#if feat.icon === 'chat'}
								<svg class="w-5 h-5" style="color: var(--content-muted)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
								</svg>
							{:else if feat.icon === 'agent'}
								<svg class="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
								</svg>
							{:else}
								<svg class="w-5 h-5" style="color: var(--content-muted)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.416 22 12c0-5.523-4.477-10-10-10z" />
								</svg>
							{/if}
						</div>
						<h3 class="text-sm font-semibold mb-1" style="color: var(--content)">{feat.title}</h3>
						<p class="text-[11px] leading-relaxed" style="color: var(--content-muted)">{feat.desc}</p>
					</div>
				{/each}
			</div>

			<!-- Quick Actions -->
			<div class="flex items-center justify-center gap-3">
				<button
					on:click={startChat}
					class="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 hover:shadow-soft active:scale-[0.98]"
					style="border: 1px solid var(--border); color: var(--content-secondary); background-color: var(--surface-secondary)"
				>
					<svg class="w-4 h-4" style="color: var(--content-muted)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4.5v15m7.5-7.5h-15" />
					</svg>
					New Chat
				</button>
				<button
					on:click={startAgent}
					class="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 hover:shadow-soft active:scale-[0.98]"
					style="border: 1px solid rgba(16, 185, 129, 0.25); color: rgb(5, 150, 105); background-color: rgba(16, 185, 129, 0.08)"
				>
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
					</svg>
					New Agent
				</button>
				<a
					href="/settings"
					class="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 hover:shadow-soft active:scale-[0.98]"
					style="border: 1px solid var(--border); color: var(--content-tertiary)"
				>
					<svg class="w-4 h-4" style="color: var(--content-muted)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
					</svg>
					Settings
				</a>
			</div>

			<!-- Footer credit -->
			<div class="text-center mt-12 pb-4">
				<p class="text-[11px]" style="color: var(--content-muted)">
					Built with SvelteKit + NVIDIA NIM
				</p>
			</div>
		</div>
	</div>
{/if}

<style>
	/* Ambient background glow */
	.landing-glow {
		position: absolute;
		top: -120px;
		left: 50%;
		transform: translateX(-50%);
		width: 600px;
		height: 400px;
		background: radial-gradient(ellipse at center, rgba(16, 185, 129, 0.06) 0%, rgba(59, 130, 246, 0.04) 40%, transparent 70%);
		pointer-events: none;
		z-index: 0;
	}

	:global(.dark) .landing-glow {
		background: radial-gradient(ellipse at center, rgba(16, 185, 129, 0.08) 0%, rgba(59, 130, 246, 0.05) 40%, transparent 70%);
	}

	/* Subtle grid pattern */
	.landing-grid {
		position: absolute;
		inset: 0;
		background-image:
			linear-gradient(rgba(0, 0, 0, 0.02) 1px, transparent 1px),
			linear-gradient(90deg, rgba(0, 0, 0, 0.02) 1px, transparent 1px);
		background-size: 48px 48px;
		mask-image: radial-gradient(ellipse 60% 50% at 50% 30%, black 20%, transparent 70%);
		pointer-events: none;
		z-index: 0;
	}

	:global(.dark) .landing-grid {
		background-image:
			linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
			linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
	}

	/* Gradient text effect */
	.landing-gradient-text {
		background: linear-gradient(135deg, #10b981 0%, #3b82f6 50%, #8b5cf6 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	/* Badge styling */
	.landing-badge {
		background-color: var(--surface-secondary);
		backdrop-filter: blur(8px);
	}

	.landing-divider {
		width: 1px;
		height: 12px;
		background-color: var(--border);
	}

	/* Input card glow on focus */
	.landing-input-wrapper {
		position: relative;
	}

	.landing-input-card {
		position: relative;
		z-index: 1;
	}

	.landing-input-wrapper::before {
		content: '';
		position: absolute;
		inset: -1px;
		border-radius: 1rem;
		padding: 1px;
		background: linear-gradient(135deg, transparent 40%, rgba(16, 185, 129, 0.2) 50%, rgba(59, 130, 246, 0.2) 60%, transparent 70%);
		mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
		mask-composite: exclude;
		-webkit-mask-composite: xor;
		opacity: 0;
		transition: opacity 0.3s;
		z-index: 0;
		pointer-events: none;
	}

	.landing-input-wrapper:focus-within::before {
		opacity: 1;
	}

	/* Send button hover glow */
	.landing-send-btn:not(:disabled):hover {
		box-shadow: 0 0 20px -4px rgba(16, 185, 129, 0.3);
		transform: translateY(-1px);
	}

	/* Suggestion card animations */
	.landing-suggestion {
		animation: landing-card-in 0.5s ease-out both;
	}

	/* Feature card hover */
	.landing-feature-card {
		transition: all 0.25s ease;
	}

	.landing-feature-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 8px 24px -8px rgba(0, 0, 0, 0.08);
		border-color: var(--border-secondary);
	}

	/* Mount animation */
	.landing-mounted > * {
		animation: landing-fade-up 0.6s ease-out both;
	}

	.landing-mounted > *:nth-child(1) { animation-delay: 0ms; }
	.landing-mounted > *:nth-child(2) { animation-delay: 80ms; }
	.landing-mounted > *:nth-child(3) { animation-delay: 140ms; }
	.landing-mounted > *:nth-child(4) { animation-delay: 200ms; }
	.landing-mounted > *:nth-child(5) { animation-delay: 260ms; }
	.landing-mounted > *:nth-child(6) { animation-delay: 320ms; }
	.landing-mounted > *:nth-child(7) { animation-delay: 380ms; }

	@keyframes landing-fade-up {
		from {
			opacity: 0;
			transform: translateY(12px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@keyframes landing-card-in {
		from {
			opacity: 0;
			transform: translateY(8px) scale(0.98);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}
</style>
