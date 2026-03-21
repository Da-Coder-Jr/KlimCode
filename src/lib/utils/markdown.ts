import { marked } from 'marked';
import hljs from 'highlight.js';

const renderer = new marked.Renderer();

renderer.code = function ({ text, lang }: { text: string; lang?: string }) {
	const language = lang && hljs.getLanguage(lang) ? lang : 'plaintext';
	let highlighted: string;

	try {
		highlighted = hljs.highlight(text, { language }).value;
	} catch {
		highlighted = hljs.highlightAuto(text).value;
	}

	const langLabel = lang || 'text';

	return `<div class="code-block-wrapper">
		<div class="code-block-header">
			<span class="code-block-lang">${escapeHtml(langLabel)}</span>
			<button class="code-copy-btn" data-code="${escapeAttr(text)}">Copy</button>
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
