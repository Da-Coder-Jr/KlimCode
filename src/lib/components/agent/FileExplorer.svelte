<script lang="ts">
	import { getFileIcon } from '$utils/formatting';
	import { createEventDispatcher } from 'svelte';

	export let files: Array<{ name: string; path: string; type: 'file' | 'dir'; size?: number }> = [];
	export let loading = false;

	const dispatch = createEventDispatcher();

	interface TreeNode {
		name: string;
		path: string;
		type: 'file' | 'dir';
		size?: number;
		children: TreeNode[];
		expanded: boolean;
	}

	function buildTree(flatFiles: typeof files): TreeNode[] {
		const root: TreeNode[] = [];

		for (const file of flatFiles) {
			const parts = file.path.split('/');
			let current = root;

			for (let i = 0; i < parts.length; i++) {
				const part = parts[i];
				const isLast = i === parts.length - 1;
				const existing = current.find((n) => n.name === part);

				if (existing) {
					current = existing.children;
				} else {
					const node: TreeNode = {
						name: part,
						path: parts.slice(0, i + 1).join('/'),
						type: isLast ? file.type : 'dir',
						size: isLast ? file.size : undefined,
						children: [],
						expanded: false
					};
					current.push(node);
					current = node.children;
				}
			}
		}

		return sortTree(root);
	}

	function sortTree(nodes: TreeNode[]): TreeNode[] {
		return nodes.sort((a, b) => {
			if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
			return a.name.localeCompare(b.name);
		});
	}

	function toggleDir(node: TreeNode) {
		node.expanded = !node.expanded;
		tree = tree;
	}

	function selectFile(node: TreeNode) {
		dispatch('select', { path: node.path });
	}

	$: tree = buildTree(files);
</script>

<div class="h-full flex flex-col">
	<div class="px-4 py-3 flex items-center justify-between" style="border-bottom: 1px solid var(--border)">
		<h3 class="text-sm font-medium flex items-center gap-2" style="color: var(--content-secondary)">
			<svg class="w-4 h-4" style="color: var(--content-tertiary)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
			</svg>
			Files
		</h3>
	</div>

	<div class="flex-1 overflow-y-auto p-2">
		{#if loading}
			<div class="text-center text-sm py-4" style="color: var(--content-muted)">Loading files...</div>
		{:else if tree.length === 0}
			<div class="text-center text-sm py-4" style="color: var(--content-muted)">No files in workspace</div>
		{:else}
			<div class="space-y-0.5">
				{#each tree as node}
					<svelte:self files={[]} />
					{#if node.type === 'dir'}
						<button
							on:click={() => toggleDir(node)}
							class="w-full flex items-center gap-1.5 px-2 py-1 text-left text-sm rounded transition-colors"
							style="color: var(--content-secondary)"
						>
							<svg class="w-3.5 h-3.5 transition-transform" class:rotate-90={node.expanded} style="color: var(--content-muted)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
							</svg>
							<svg class="w-4 h-4" style="color: var(--content-tertiary)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
							</svg>
							<span class="truncate">{node.name}</span>
						</button>

						{#if node.expanded}
							<div class="ml-4">
								{#each node.children as child}
									{#if child.type === 'dir'}
										<button
											on:click={() => toggleDir(child)}
											class="w-full flex items-center gap-1.5 px-2 py-1 text-left text-sm rounded transition-colors"
											style="color: var(--content-secondary)"
										>
											<svg class="w-3.5 h-3.5 transition-transform" class:rotate-90={child.expanded} style="color: var(--content-muted)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
											</svg>
											<svg class="w-4 h-4" style="color: var(--content-tertiary)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
											</svg>
											<span class="truncate">{child.name}</span>
										</button>
									{:else}
										<button
											on:click={() => selectFile(child)}
											class="w-full flex items-center gap-1.5 px-2 py-1 text-left text-sm rounded transition-colors"
											style="color: var(--content-secondary)"
										>
											<span class="text-sm flex-shrink-0">{getFileIcon(child.name)}</span>
											<span class="truncate">{child.name}</span>
										</button>
									{/if}
								{/each}
							</div>
						{/if}
					{:else}
						<button
							on:click={() => selectFile(node)}
							class="w-full flex items-center gap-1.5 px-2 py-1 text-left text-sm rounded transition-colors"
							style="color: var(--content-secondary)"
						>
							<span class="text-sm flex-shrink-0 ml-5">{getFileIcon(node.name)}</span>
							<span class="truncate">{node.name}</span>
						</button>
					{/if}
				{/each}
			</div>
		{/if}
	</div>
</div>
