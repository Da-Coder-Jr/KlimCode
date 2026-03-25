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
				<button class="code-copy-btn" data-code="${escapeAttr(text)}" title="Copy code"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;margin-right:3px"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg><span class="code-copy-label">Copy</span></button>
			</div>
		</div>
		<pre class="code-block"><code class="hljs language-${escapeHtml(language)}">${highlighted}</code></pre>
	</div>`;
};

renderer.link = function ({ href, text }: { href: string; text: string }) {
	return `<a href="${escapeAttr(href)}" target="_blank" rel="noopener noreferrer">${text}</a>`;
};

renderer.table = function ({ header, body }: { header: string; body: string }) {
	return `<div class="table-wrapper"><table><thead>${header}</thead><tbody>${body}</tbody></table></div>`;
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
