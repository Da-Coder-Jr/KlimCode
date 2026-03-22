<script lang="ts">
	import { activeConversation, messages } from '$stores/chat';
	import { currentUser } from '$stores/auth';
	import ModelSelector from '$components/chat/ModelSelector.svelte';

	export let onToggleSidebar: () => void = () => {};
	export let onToggleAgent: () => void = () => {};
	export let showAgentPanel = false;

	let modelSelectorOpen = false;
	let shareCopied = false;

	async function handleShare() {
		const conv = $activeConversation;
		const msgs = $messages;
		if (!conv || msgs.length === 0) return;

		// Build a shareable markdown text of the conversation
		const lines: string[] = [];
		lines.push(`# ${conv.title}`);
		lines.push(`*${conv.mode === 'agent' ? 'Agent' : 'Chat'} mode | ${new Date(conv.createdAt).toLocaleDateString()}*`);
		lines.push('');
		lines.push('---');
		lines.push('');

		for (const msg of msgs) {
			const name = msg.role === 'user'
				? ($currentUser?.displayName || 'User')
				: 'KlimCode';
			lines.push(`**${name}:**`);
			lines.push('');
			lines.push(msg.content);
			lines.push('');
			lines.push('---');
			lines.push('');
		}

		try {
			await navigator.clipboard.writeText(lines.join('\n'));
			shareCopied = true;
			setTimeout(() => { shareCopied = false; }, 2500);
		} catch {
			// Fallback: create a blob and download
			const blob = new Blob([lines.join('\n')], { type: 'text/markdown' });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `${conv.title.replace(/[^a-z0-9]/gi, '_')}.md`;
			a.click();
			URL.revokeObjectURL(url);
			shareCopied = true;
			setTimeout(() => { shareCopied = false; }, 2500);
		}
	}
</script>

<header class="sticky top-0 z-30 w-full pt-0.5 pb-1 flex-shrink-0">
	<div class="navbar-gradient pb-4">
		<div class="flex items-center justify-between px-4 h-12">
			<div class="flex items-center gap-3 min-w-0">
				{#if $activeConversation}
					<div class="flex items-center gap-2.5 min-w-0 ml-10 md:ml-10">
						{#if $activeConversation.mode === 'agent'}
							<span class="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 flex-shrink-0">
								<div class="w-1 h-1 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse-slow"></div>
								Agent
							</span>
						{:else}
							<span class="inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-md flex-shrink-0" style="color: var(--content-tertiary); background-color: var(--surface-tertiary); border: 1px solid var(--border)">
								Chat
							</span>
						{/if}
						<h1 class="text-sm truncate" style="color: var(--content-tertiary)">
							{$activeConversation.title}
						</h1>
					</div>
				{:else}
					<div class="flex items-center gap-2 ml-10 md:ml-10">
						<span class="text-zinc-300 font-medium text-sm">KlimCode</span>
					</div>
				{/if}
			</div>

			<div class="flex items-center gap-1.5">
				{#if $activeConversation}
					<ModelSelector
						currentModel={$activeConversation.model}
						bind:open={modelSelectorOpen}
					/>

					<!-- Share button - copies conversation as markdown -->
					<button
						on:click={handleShare}
						class="p-2 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/60 transition-all relative"
						title={shareCopied ? 'Copied to clipboard!' : 'Share conversation'}
					>
						{#if shareCopied}
							<svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
							</svg>
						{:else}
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
							</svg>
						{/if}
					</button>
				{/if}

				{#if $activeConversation?.mode === 'agent'}
					<button
						on:click={onToggleAgent}
						class="p-2 rounded-lg transition-all duration-150"
						class:bg-emerald-500={showAgentPanel}
						class:text-white={showAgentPanel}
						style="{!showAgentPanel ? 'color: var(--content-muted)' : ''}"
						title="Toggle Agent Panel"
					>
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
						</svg>
					</button>
				{/if}
			</div>
		</div>
	</div>
</header>
