<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let currentModel = 'meta/llama-3.3-70b-instruct';
	export let open = false;

	const dispatch = createEventDispatcher();

	let searchQuery = '';

	const models = [
		{ id: 'meta/llama-3.3-70b-instruct', name: 'Llama 3.3 70B', badge: 'Best', category: 'code', description: 'Best overall coding model' },
		{ id: 'meta/llama-3.1-405b-instruct', name: 'Llama 3.1 405B', badge: 'Largest', category: 'reasoning', description: 'Most powerful reasoning' },
		{ id: 'nvidia/llama-3.1-nemotron-70b-instruct', name: 'Nemotron 70B', badge: 'NVIDIA', category: 'reasoning', description: 'NVIDIA optimized model' },
		{ id: 'deepseek-ai/deepseek-r1', name: 'DeepSeek R1', badge: 'Reasoning', category: 'reasoning', description: 'Chain-of-thought reasoning' },
		{ id: 'qwen/qwen2.5-coder-32b-instruct', name: 'Qwen Coder 32B', badge: 'Code', category: 'code', description: 'Specialized code generation' },
		{ id: 'microsoft/phi-4', name: 'Phi-4', badge: 'Fast', category: 'chat', description: 'Lightweight and fast' },
		{ id: 'google/gemma-2-27b-it', name: 'Gemma 2 27B', badge: 'Chat', category: 'chat', description: 'Conversational AI' }
	];

	$: selectedModel = models.find(m => m.id === currentModel) || models[0];

	$: filteredModels = searchQuery
		? models.filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()) || m.category.includes(searchQuery.toLowerCase()))
		: models;

	function select(id: string) {
		currentModel = id;
		open = false;
		searchQuery = '';
		dispatch('change', { model: id });
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			open = false;
			searchQuery = '';
		}
	}

	function getBadgeClass(category: string): string {
		switch (category) {
			case 'code': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
			case 'reasoning': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
			default: return 'bg-zinc-700/50 text-zinc-400 border-zinc-600/50';
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
		class="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-zinc-800/50 border border-zinc-800 hover:border-zinc-700 text-sm transition-all"
	>
		<div class="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
		<span class="text-zinc-400 text-xs truncate max-w-[130px] font-medium">{selectedModel.name}</span>
		<svg class="w-3 h-3 text-zinc-600 transition-transform" class:rotate-180={open} fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
		</svg>
	</button>

	{#if open}
		<!-- Backdrop to close on click outside -->
		<button class="fixed inset-0 z-40" on:click={() => { open = false; searchQuery = ''; }} aria-label="Close"></button>

		<div class="absolute top-full right-0 mt-1.5 w-80 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl shadow-black/30 z-50 overflow-hidden animate-slide-down">
			<!-- Search in dropdown - inspired by open-webui Selector -->
			<div class="px-3 py-2.5 border-b border-zinc-800">
				<input
					bind:value={searchQuery}
					type="text"
					placeholder="Search models..."
					class="w-full bg-zinc-800/50 border-none rounded-lg px-3 py-1.5 text-xs text-zinc-300 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600"
					autofocus
				/>
			</div>

			<div class="max-h-80 overflow-y-auto p-1.5">
				{#each filteredModels as model}
					<button
						on:click={() => select(model.id)}
						class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-100
							{currentModel === model.id ? 'bg-zinc-800 text-zinc-100' : 'hover:bg-zinc-800/50 text-zinc-400 hover:text-zinc-200'}"
					>
						<!-- Category icon -->
						<div class="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0
							{model.category === 'code' ? 'bg-blue-500/10' : model.category === 'reasoning' ? 'bg-purple-500/10' : 'bg-zinc-800'}">
							<svg class="w-3.5 h-3.5 {model.category === 'code' ? 'text-blue-400' : model.category === 'reasoning' ? 'text-purple-400' : 'text-zinc-500'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d={getCategoryIcon(model.category)} />
							</svg>
						</div>

						<div class="flex-1 min-w-0">
							<div class="text-[13px] font-medium truncate">{model.name}</div>
							<div class="text-[11px] text-zinc-600 truncate">{model.description}</div>
						</div>

						<span class="text-[10px] font-medium px-1.5 py-0.5 rounded-md border {getBadgeClass(model.category)} flex-shrink-0">
							{model.badge}
						</span>

						{#if currentModel === model.id}
							<svg class="w-3.5 h-3.5 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
							</svg>
						{/if}
					</button>
				{/each}

				{#if filteredModels.length === 0}
					<div class="text-center py-4 text-zinc-600 text-xs">No models found</div>
				{/if}
			</div>

			<div class="px-3 py-2 border-t border-zinc-800">
				<div class="text-[10px] text-zinc-600">All models free via NVIDIA NIM</div>
			</div>
		</div>
	{/if}
</div>
