<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let currentModel = 'meta/llama-3.3-70b-instruct';
	export let open = false;

	const dispatch = createEventDispatcher();

	const models = [
		{ id: 'meta/llama-3.3-70b-instruct', name: 'Llama 3.3 70B', badge: 'Best', category: 'code' },
		{ id: 'meta/llama-3.1-405b-instruct', name: 'Llama 3.1 405B', badge: 'Largest', category: 'reasoning' },
		{ id: 'nvidia/llama-3.1-nemotron-70b-instruct', name: 'Nemotron 70B', badge: 'NVIDIA', category: 'reasoning' },
		{ id: 'deepseek-ai/deepseek-r1', name: 'DeepSeek R1', badge: 'Reasoning', category: 'reasoning' },
		{ id: 'qwen/qwen2.5-coder-32b-instruct', name: 'Qwen Coder 32B', badge: 'Code', category: 'code' },
		{ id: 'microsoft/phi-4', name: 'Phi-4', badge: 'Fast', category: 'chat' },
		{ id: 'google/gemma-2-27b-it', name: 'Gemma 2 27B', badge: 'Chat', category: 'chat' }
	];

	$: selectedModel = models.find(m => m.id === currentModel) || models[0];

	function select(id: string) {
		currentModel = id;
		open = false;
		dispatch('change', { model: id });
	}

	function getBadgeClass(category: string): string {
		switch (category) {
			case 'code': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
			case 'reasoning': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
			default: return 'bg-zinc-700/50 text-zinc-400 border-zinc-600/50';
		}
	}
</script>

<div class="relative">
	<button
		on:click={() => open = !open}
		class="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-zinc-800/50 border border-zinc-800 hover:border-zinc-700 text-sm transition-all"
	>
		<div class="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
		<span class="text-zinc-400 text-xs truncate max-w-[130px] font-medium">{selectedModel.name}</span>
		<svg class="w-3 h-3 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
		</svg>
	</button>

	{#if open}
		<div class="absolute top-full right-0 mt-1.5 w-72 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl shadow-black/30 z-50 overflow-hidden animate-slide-down">
			<div class="px-3 py-2.5 border-b border-zinc-800">
				<div class="text-[11px] text-zinc-500 font-medium uppercase tracking-wider">Select Model</div>
			</div>
			<div class="max-h-80 overflow-y-auto p-1.5">
				{#each models as model}
					<button
						on:click={() => select(model.id)}
						class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-100
							{currentModel === model.id ? 'bg-zinc-800 text-zinc-100' : 'hover:bg-zinc-800/50 text-zinc-400 hover:text-zinc-200'}"
					>
						<div class="flex-1 min-w-0">
							<div class="text-[13px] font-medium truncate">{model.name}</div>
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
			</div>
			<div class="px-3 py-2 border-t border-zinc-800">
				<div class="text-[10px] text-zinc-600">All models free via NVIDIA NIM</div>
			</div>
		</div>
	{/if}
</div>
