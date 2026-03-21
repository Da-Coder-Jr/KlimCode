<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let currentModel = 'meta/llama-3.3-70b-instruct';
	export let open = false;

	const dispatch = createEventDispatcher();

	const models = [
		{ id: 'meta/llama-3.3-70b-instruct', name: 'Llama 3.3 70B', badge: 'Best', color: 'klim' },
		{ id: 'meta/llama-3.1-405b-instruct', name: 'Llama 3.1 405B', badge: 'Largest', color: 'purple' },
		{ id: 'nvidia/llama-3.1-nemotron-70b-instruct', name: 'Nemotron 70B', badge: 'NVIDIA', color: 'green' },
		{ id: 'deepseek-ai/deepseek-r1', name: 'DeepSeek R1', badge: 'Reasoning', color: 'amber' },
		{ id: 'qwen/qwen2.5-coder-32b-instruct', name: 'Qwen Coder 32B', badge: 'Code', color: 'cyan' },
		{ id: 'microsoft/phi-4', name: 'Phi-4', badge: 'Fast', color: 'emerald' },
		{ id: 'google/gemma-2-27b-it', name: 'Gemma 2 27B', badge: 'Chat', color: 'rose' }
	];

	$: selectedModel = models.find(m => m.id === currentModel) || models[0];

	function select(id: string) {
		currentModel = id;
		open = false;
		dispatch('change', { model: id });
	}
</script>

<div class="relative">
	<button
		on:click={() => open = !open}
		class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-800 border border-surface-700 hover:border-surface-500 text-sm transition-colors"
	>
		<div class="w-2 h-2 rounded-full bg-emerald-500"></div>
		<span class="text-surface-300 truncate max-w-[160px]">{selectedModel.name}</span>
		<svg class="w-3 h-3 text-surface-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
		</svg>
	</button>

	{#if open}
		<div class="absolute top-full right-0 mt-2 w-72 bg-surface-800 border border-surface-600 rounded-xl shadow-2xl z-50 overflow-hidden">
			<div class="p-2 border-b border-surface-700">
				<div class="text-xs text-surface-500 px-2 py-1">Select Model</div>
			</div>
			<div class="max-h-80 overflow-y-auto p-1">
				{#each models as model}
					<button
						on:click={() => select(model.id)}
						class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors
							{currentModel === model.id ? 'bg-klim-900/40 text-klim-200' : 'hover:bg-surface-700 text-surface-300'}"
					>
						<div class="flex-1">
							<div class="text-sm font-medium">{model.name}</div>
						</div>
						<span class="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-surface-700 text-surface-400">{model.badge}</span>
						{#if currentModel === model.id}
							<svg class="w-4 h-4 text-klim-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
							</svg>
						{/if}
					</button>
				{/each}
			</div>
			<div class="p-2 border-t border-surface-700">
				<div class="text-xs text-surface-600 px-2">All models free via NVIDIA NIM</div>
			</div>
		</div>
	{/if}
</div>
