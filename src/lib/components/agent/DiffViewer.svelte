<script lang="ts">
	export let diff = '';
	export let filename = '';

	interface DiffLine {
		type: 'added' | 'removed' | 'context' | 'header';
		content: string;
		oldLineNumber?: number;
		newLineNumber?: number;
	}

	function parseDiff(rawDiff: string): DiffLine[] {
		if (!rawDiff) return [];

		const lines: DiffLine[] = [];
		let oldLine = 0;
		let newLine = 0;

		for (const line of rawDiff.split('\n')) {
			if (line.startsWith('@@')) {
				const match = line.match(/@@ -(\d+)/);
				if (match) {
					oldLine = parseInt(match[1], 10) - 1;
					newLine = parseInt(match[1], 10) - 1;
				}
				lines.push({ type: 'header', content: line });
			} else if (line.startsWith('+')) {
				newLine++;
				lines.push({ type: 'added', content: line.slice(1), newLineNumber: newLine });
			} else if (line.startsWith('-')) {
				oldLine++;
				lines.push({ type: 'removed', content: line.slice(1), oldLineNumber: oldLine });
			} else {
				oldLine++;
				newLine++;
				lines.push({
					type: 'context',
					content: line.startsWith(' ') ? line.slice(1) : line,
					oldLineNumber: oldLine,
					newLineNumber: newLine
				});
			}
		}

		return lines;
	}

	$: diffLines = parseDiff(diff);
</script>

<div class="rounded-lg border border-surface-700 overflow-hidden">
	{#if filename}
		<div class="px-4 py-2 bg-surface-800 border-b border-surface-700 text-sm text-surface-300 font-mono">
			{filename}
		</div>
	{/if}

	<div class="overflow-x-auto">
		<table class="w-full text-xs font-mono">
			<tbody>
				{#each diffLines as line}
					<tr class="
						{line.type === 'added' ? 'bg-emerald-950/30' : ''}
						{line.type === 'removed' ? 'bg-red-950/30' : ''}
						{line.type === 'header' ? 'bg-klim-950/30' : ''}
					">
						<td class="select-none text-right px-2 py-0.5 text-surface-600 w-12 border-r border-surface-800">
							{line.oldLineNumber || ''}
						</td>
						<td class="select-none text-right px-2 py-0.5 text-surface-600 w-12 border-r border-surface-800">
							{line.newLineNumber || ''}
						</td>
						<td class="select-none px-2 py-0.5 w-4
							{line.type === 'added' ? 'text-emerald-400' : ''}
							{line.type === 'removed' ? 'text-red-400' : ''}
							{line.type === 'header' ? 'text-klim-400' : 'text-surface-600'}
						">
							{line.type === 'added' ? '+' : line.type === 'removed' ? '-' : line.type === 'header' ? '@' : ' '}
						</td>
						<td class="px-2 py-0.5 whitespace-pre
							{line.type === 'added' ? 'text-emerald-200' : ''}
							{line.type === 'removed' ? 'text-red-200' : ''}
							{line.type === 'header' ? 'text-klim-300' : 'text-surface-300'}
						">
							{line.content}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>
