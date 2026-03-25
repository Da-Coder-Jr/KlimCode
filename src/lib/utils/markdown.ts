import { marked } from 'marked';
import hljs from 'highlight.js';

const renderer = new marked.Renderer();

// Enhanced code blocks with sticky header and preview support - inspired by chat-ui CodeBlock
renderer.code = function ({ text, lang }: { text: string; lang?: string }) {
	const language = lang && hljs.getLanguage(lang) ? lang : 'plaintext';
	let highlighted: string;

	try {
		highlighted = hljs.highlight(text, { language }).value;
	} catch {
		highlighted = hljs.highlightAuto(text).value;
	}

	const langLabel = lang || 'text';

	// Detect HTML/SVG for potential preview - from chat-ui
	const isPreviewable = lang === 'html' || lang === 'svg' ||
		text.trimStart().startsWith('<!DOCTYPE') ||
		text.trimStart().startsWith('<svg');

	return `<div class="code-block-wrapper">
		<div class="code-block-header">
			<span class="code-block-lang">${escapeHtml(langLabel)}</span>
			<div style="display:flex;align-items:center;gap:4px">
				${isPreviewable ? '<span class="code-preview-badge">Preview</span>' : ''}
				<button class="code-copy-btn" data-code="${escapeAttr(text)}">Copy</button>
			</div>
		</div>
		<pre class="code-block"><code class="hljs language-${escapeHtml(language)}">${highlighted}</code></pre>
	</div>`;
};

renderer.link = function ({ href, text }: { href: string; text: string }) {
	return `<a href="${escapeAttr(href)}" target="_blank" rel="noopener noreferrer">${text}</a>`;
};

renderer.table = function ({ header, rows }: { header: Array<{ text: string; align: string | null }>; rows: Array<Array<{ text: string; align: string | null }>> }) {
	const headerHtml = header.map((cell) =>
		`<th${cell.align ? ` style="text-align:${cell.align}"` : ''}>${cell.text}</th>`
	).join('');
	const bodyHtml = rows.map((row) =>
		`<tr>${row.map((cell) =>
			`<td${cell.align ? ` style="text-align:${cell.align}"` : ''}>${cell.text}</td>`
		).join('')}</tr>`
	).join('');
	return `<div class="table-wrapper"><table><thead><tr>${headerHtml}</tr></thead><tbody>${bodyHtml}</tbody></table></div>`;
};

// Enhanced image rendering with lightbox-ready styling
renderer.image = function ({ href, text }: { href: string; text: string }) {
	return `<img src="${escapeAttr(href)}" alt="${escapeAttr(text || '')}" loading="lazy" class="rounded-xl max-w-full" />`;
};

marked.setOptions({
	renderer,
	gfm: true,
	breaks: true
});

export function renderMarkdown(text: string): string {
	if (!text) return '';

	try {
		const result = marked.parse(text);
		return typeof result === 'string' ? result : '';
	} catch {
		return escapeHtml(text);
	}
}

export function extractCodeBlocks(text: string): Array<{ language: string; code: string }> {
	const blocks: Array<{ language: string; code: string }> = [];
	const regex = /```(\w*)\n([\s\S]*?)```/g;
	let match;

	while ((match = regex.exec(text)) !== null) {
		blocks.push({
			language: match[1] || 'plaintext',
			code: match[2].trim()
		});
	}

	return blocks;
}

export function truncateText(text: string, maxLength: number): string {
	if (text.length <= maxLength) return text;
	return text.slice(0, maxLength - 3) + '...';
}

function escapeHtml(text: string): string {
	return text
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#039;');
}

function escapeAttr(text: string): string {
	return text
		.replace(/&/g, '&amp;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#039;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;');
}
