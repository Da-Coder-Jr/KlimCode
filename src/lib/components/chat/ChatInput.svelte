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

	$: hasContent = $inputMessage.trim() || attachedFiles.length > 0;
</script>

<div class="flex-shrink-0 w-full pb-3 pt-1">
	<div class="max-w-3xl xl:max-w-4xl mx-auto px-2.5">
		<!-- Stop generating button -->
		{#if $isStreaming}
			<div class="flex justify-center mb-2">
				<button
					on:click={handleStop}
					class="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all hover:opacity-90 active:scale-[0.97] shadow-sm"
					style="background-color: var(--surface); border: 1px solid var(--border); color: var(--content-secondary)"
				>
					<svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
						<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm3 13H9c-.55 0-1-.45-1-1V10c0-.55.45-1 1-1h6c.55 0 1 .45 1 1v4c0 .55-.45 1-1 1z"/>
					</svg>
					Stop generating
				</button>
			</div>
		{/if}

		<!-- Attached files -->
		{#if attachedFiles.length > 0}
			<div class="flex flex-wrap gap-2 mb-2 mx-2">
				{#each attachedFiles as file, i}
					{#if file.preview}
						<div class="relative group">
							<img src={file.preview} alt={file.name} class="w-14 h-14 rounded-xl object-cover" style="border: 1px solid var(--border)" />
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

		<!-- Main input container -->
		<form on:submit|preventDefault={handleSubmit}>
			<div
				class="relative flex flex-col rounded-3xl shadow-lg transition px-1"
				class:paste-glow={pasteGlow}
				style="background-color: color-mix(in srgb, var(--surface) 95%, transparent); border: 1px solid var(--border); backdrop-filter: blur(8px)"
			>
				<!-- Textarea -->
				<div class="px-2.5">
					<textarea
						bind:this={textarea}
						bind:value={$inputMessage}
						on:keydown={handleKeydown}
						on:input={handleInput}
						on:paste={handlePaste}
						placeholder={$isStreaming ? 'Wait for response...' : 'How can I help you today?'}
						disabled={$isStreaming}
						rows="1"
						class="scrollbar-hidden w-full bg-transparent resize-none px-1 pt-3 pb-1 focus:outline-none text-[15px] leading-relaxed max-h-[200px] disabled:opacity-40"
						style="color: var(--content)"
					></textarea>
				</div>

				<!-- Hidden file input -->
				<input
					bind:this={fileInput}
					type="file"
					multiple
					accept=".txt,.md,.js,.ts,.py,.json,.csv,.html,.css,.jsx,.tsx,.go,.rs,.java,.c,.cpp,.h,.yml,.yaml,.toml,.xml,.sql,.sh,.bash,.svelte,.vue,image/*"
					class="hidden"
					on:change={handleFileChange}
				/>

				<!-- Bottom toolbar -->
				<div class="flex items-center justify-between mt-0.5 mb-2 mx-1">
					<!-- Left: attachment button -->
					<div class="flex items-center">
						<button
							type="button"
							on:click={handleUploadClick}
							class="p-2 rounded-full transition-all hover:bg-black/5 dark:hover:bg-white/5"
							title="Attach file"
							disabled={$isStreaming}
						>
							<svg class="w-4.5 h-4.5" style="color: var(--content-muted)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4v16m8-8H4" />
							</svg>
						</button>
					</div>

					<!-- Right: send/stop button -->
					<div class="flex items-center gap-1.5">
						{#if $isStreaming}
							<button
								type="button"
								on:click={handleStop}
								class="p-1.5 rounded-full transition-all"
								style="background-color: var(--surface-secondary); color: var(--content-tertiary)"
								title="Stop"
							>
								<svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
									<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm3 13H9c-.55 0-1-.45-1-1V10c0-.55.45-1 1-1h6c.55 0 1 .45 1 1v4c0 .55-.45 1-1 1z"/>
								</svg>
							</button>
						{:else}
							<button
								type="submit"
								disabled={!hasContent}
								class="p-1.5 rounded-full transition-all duration-150"
								style="{hasContent
									? 'background-color: var(--content); color: var(--surface)'
									: 'background-color: var(--surface-tertiary); color: var(--content-muted); cursor: not-allowed'}"
								title="Send message (Enter)"
							>
								<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
								</svg>
							</button>
						{/if}
					</div>
				</div>
			</div>
		</form>

		<div class="flex items-center justify-center mt-1.5">
			<span class="text-[11px]" style="color: var(--content-muted)">
				Free AI &middot; <a href="https://build.nvidia.com" target="_blank" rel="noopener" class="transition-colors hover:underline" style="color: var(--content-tertiary)">NVIDIA NIM</a>
			</span>
		</div>
	</div>
</div>
