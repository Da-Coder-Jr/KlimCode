<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { activeConversationId, changeConversationModel, conversations } from '$stores/chat';
	import { AVAILABLE_MODELS } from '$lib/models';

	export let currentModel = 'meta/llama-3.3-70b-instruct';
	export let open = false;

	const dispatch = createEventDispatcher();

	let searchQuery = '';

	// Build models from the central models list
	$: models = AVAILABLE_MODELS.map(m => ({
		id: m.id,
		name: m.name,
		badge: m.category === 'code' ? 'Code' : m.category === 'reasoning' ? 'Reasoning' : 'Chat',
		category: m.category,
		description: m.description
	}));

	$: selectedModel = models.find(m => m.id === currentModel) || models[0];

	$: filteredModels = searchQuery
		? models.filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()) || m.category.includes(searchQuery.toLowerCase()) || m.description.toLowerCase().includes(searchQuery.toLowerCase()))
		: models;

	async function select(id: string) {
		currentModel = id;
		open = false;
		searchQuery = '';
		dispatch('change', { model: id });

		// Actually update the conversation model in the database
		const convId = $activeConversationId;
		if (convId) {
			await changeConversationModel(convId, id);
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			open = false;
			searchQuery = '';
		}
	}

	function getBadgeClass(category: string): string {
		switch (category) {
			case 'code': return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
			case 'reasoning': return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
			default: return 'border';
		}
	}

	function getCategoryIcon(category: string): string {
		switch (category) {
			case 'code': return 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4';
			case 'reasoning': return 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z';
			default: return 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z';
		}
	}
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="relative">
	<button
		on:click={() => open = !open}
		class="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-sm transition-all hover:opacity-80"
		style="background-color: var(--surface-tertiary); border: 1px solid var(--border)"
	>
		<div class="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
		<span class="text-xs truncate max-w-[130px] font-medium" style="color: var(--content-tertiary)">{selectedModel?.name || 'Select Model'}</span>
		<svg class="w-3 h-3 transition-transform" class:rotate-180={open} style="color: var(--content-muted)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
		</svg>
	</button>

	{#if open}
		<button class="fixed inset-0 z-40" on:click={() => { open = false; searchQuery = ''; }} aria-label="Close"></button>

		<div class="absolute top-full right-0 mt-1.5 w-80 rounded-2xl shadow-elevated z-50 overflow-hidden animate-slide-down" style="background-color: var(--surface-secondary); border: 1px solid var(--border)">
			<div class="px-3 py-2.5" style="border-bottom: 1px solid var(--border)">
				<div class="relative">
					<svg class="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style="color: var(--content-muted)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
					</svg>
					<input
						bind:value={searchQuery}
						type="text"
						placeholder="Search models..."
						class="w-full rounded-lg pl-9 pr-3 py-2 text-xs focus:outline-none"
						style="background-color: var(--surface-tertiary); color: var(--content-secondary); border: 1px solid transparent"
						autofocus
					/>
				</div>
			</div>

			<div class="max-h-[320px] overflow-y-auto p-1.5">
				{#each filteredModels as model}
					<button
						on:click={() => select(model.id)}
						class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-100 hover:opacity-90"
						style="{currentModel === model.id
							? `background-color: var(--surface-active); color: var(--content)`
							: `color: var(--content-tertiary)`}"
					>
						<div class="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
							style="background-color: {model.category === 'code' ? 'rgba(59,130,246,0.1)' : model.category === 'reasoning' ? 'rgba(147,51,234,0.1)' : 'var(--surface-tertiary)'}">
							<svg class="w-3.5 h-3.5 {model.category === 'code' ? 'text-blue-500' : model.category === 'reasoning' ? 'text-purple-500' : ''}" style="{model.category === 'chat' ? 'color: var(--content-muted)' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d={getCategoryIcon(model.category)} />
							</svg>
						</div>

						<div class="flex-1 min-w-0">
							<div class="text-[13px] font-medium truncate">{model.name}</div>
							<div class="text-[11px] truncate" style="color: var(--content-muted)">{model.description}</div>
						</div>

						<span class="text-[10px] font-medium px-1.5 py-0.5 rounded-md border {getBadgeClass(model.category)} flex-shrink-0">
							{model.badge}
						</span>

						{#if currentModel === model.id}
							<svg class="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
							</svg>
						{/if}
					</button>
				{/each}

				{#if filteredModels.length === 0}
					<div class="text-center py-4 text-xs" style="color: var(--content-muted)">No models found</div>
				{/if}
			</div>

			<div class="px-3 py-2" style="border-top: 1px solid var(--border)">
				<div class="text-[10px]" style="color: var(--content-muted)">All models free via NVIDIA NIM</div>
			</div>
		</div>
	{/if}
</div>
