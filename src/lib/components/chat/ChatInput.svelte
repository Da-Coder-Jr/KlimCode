<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import { isStreaming, inputMessage, stopStreaming } from '$stores/chat';

	const dispatch = createEventDispatcher();

	let textarea: HTMLTextAreaElement;
	let fileInput: HTMLInputElement;
	let pasteGlow = false;
	let attachedFiles: { name: string; content: string; type: string; preview?: string }[] = [];

	function handleSubmit() {
		if ($isStreaming || (!$inputMessage.trim() && attachedFiles.length === 0)) return;

		// Build final message with file contents appended
		let finalMessage = $inputMessage;
		for (const file of attachedFiles) {
			if (file.type.startsWith('image/')) {
				finalMessage += `\n\n[Attached image: ${file.name}]`;
			} else {
				finalMessage += `\n\n--- File: ${file.name} ---\n${file.content}\n--- End of ${file.name} ---`;
			}
		}

		dispatch('send', { message: finalMessage, files: attachedFiles });
		attachedFiles = [];
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
			e.preventDefault();
			handleSubmit();
		}
	}

	function handleInput() {
		if (textarea) {
			textarea.style.height = 'auto';
			textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
		}
	}

	function handlePaste() {
		pasteGlow = true;
		setTimeout(() => { pasteGlow = false; }, 600);
	}

	function handleStop() {
		if (typeof stopStreaming === 'function') {
			stopStreaming();
		}
	}

	function handleUploadClick() {
		fileInput?.click();
	}

	async function handleFileChange() {
		const files = fileInput?.files;
		if (!files || files.length === 0) return;

		for (const file of Array.from(files)) {
			const maxSize = 5 * 1024 * 1024; // 5MB
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

		// Reset file input
		if (fileInput) fileInput.value = '';
	}

	function removeFile(index: number) {
		const file = attachedFiles[index];
		if (file.preview) URL.revokeObjectURL(file.preview);
		attachedFiles = attachedFiles.filter((_, i) => i !== index);
	}

	export function focus() {
		textarea?.focus();
	}

	onMount(() => {
		if ($inputMessage.trim()) {
			setTimeout(() => {
				handleSubmit();
			}, 100);
		}
	});
</script>

<div class="flex-shrink-0 p-3 sm:p-4" style="border-top: 1px solid var(--border); background-color: var(--surface)">
	<div class="max-w-3xl xl:max-w-4xl mx-auto">
		<!-- Attached files preview -->
		{#if attachedFiles.length > 0}
			<div class="flex flex-wrap gap-2 mb-2">
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
							<span class="truncate max-w-[120px]">{file.name}</span>
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

		<form on:submit|preventDefault={handleSubmit}>
			<div
				class="relative rounded-2xl transition-all"
				class:paste-glow={pasteGlow}
				style="background-color: var(--surface-secondary); border: 1px solid var(--border)"
			>
				<textarea
					bind:this={textarea}
					bind:value={$inputMessage}
					on:keydown={handleKeydown}
					on:input={handleInput}
					on:paste={handlePaste}
					placeholder={$isStreaming ? 'AI is generating...' : 'Message KlimCode...'}
					disabled={$isStreaming}
					rows="1"
					class="scrollbar-custom w-full bg-transparent resize-none px-4 py-3 focus:outline-none text-[15px] leading-relaxed max-h-[200px] disabled:opacity-40"
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
						<!-- File upload button -->
						<button
							type="button"
							on:click={handleUploadClick}
							class="p-1.5 rounded-lg transition-all btn-icon"
							title="Attach file"
							disabled={$isStreaming}
						>
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
							</svg>
						</button>

						{#if $isStreaming}
							<div class="flex items-center gap-2 text-xs" style="color: var(--content-muted)">
								<div class="flex gap-1">
									<span class="thinking-dot w-1 h-1 rounded-full" style="background-color: var(--content-muted)"></span>
									<span class="thinking-dot w-1 h-1 rounded-full" style="background-color: var(--content-muted)"></span>
									<span class="thinking-dot w-1 h-1 rounded-full" style="background-color: var(--content-muted)"></span>
								</div>
								<span class="text-[11px]">Generating...</span>
							</div>
						{/if}
					</div>

					<div class="flex items-center gap-1.5">
						{#if $isStreaming}
							<button
								type="button"
								on:click={handleStop}
								class="stop-btn p-2 rounded-xl transition-all"
								style="background-color: var(--surface-tertiary); color: var(--content-tertiary)"
								title="Stop generating"
							>
								<svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
									<rect x="6" y="6" width="12" height="12" rx="1" />
								</svg>
							</button>
						{:else}
							<button
								type="submit"
								disabled={!$inputMessage.trim() && attachedFiles.length === 0}
								class="p-2 rounded-xl transition-all duration-150"
								style="{$inputMessage.trim() || attachedFiles.length > 0
									? 'background-color: var(--content); color: var(--surface)'
									: 'background-color: var(--surface-tertiary); color: var(--content-muted); cursor: not-allowed'}"
								title="Send message (Enter)"
							>
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
								</svg>
							</button>
						{/if}
					</div>
				</div>
			</div>
		</form>

		<div class="flex items-center justify-center mt-2">
			<span class="text-[11px]" style="color: var(--content-muted)">
				Free AI by <a href="https://build.nvidia.com" target="_blank" rel="noopener" class="transition-colors" style="color: var(--content-tertiary)">NVIDIA NIM</a>
				&middot; Enter to send, Shift+Enter for new line
			</span>
		</div>
	</div>
</div>
