export function formatRelativeTime(dateString: string): string {
	const date = new Date(dateString);
	const now = new Date();
	const diffMs = now.getTime() - date.getTime();
	const diffSeconds = Math.floor(diffMs / 1000);
	const diffMinutes = Math.floor(diffSeconds / 60);
	const diffHours = Math.floor(diffMinutes / 60);
	const diffDays = Math.floor(diffHours / 24);

	if (diffSeconds < 60) return 'just now';
	if (diffMinutes < 60) return `${diffMinutes}m ago`;
	if (diffHours < 24) return `${diffHours}h ago`;
	if (diffDays < 7) return `${diffDays}d ago`;
	if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;

	return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatFileSize(bytes: number): string {
	if (bytes === 0) return '0 B';
	const units = ['B', 'KB', 'MB', 'GB'];
	const i = Math.floor(Math.log(bytes) / Math.log(1024));
	return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}

export function formatDuration(ms: number): string {
	if (ms < 1000) return `${ms}ms`;
	if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
	const mins = Math.floor(ms / 60000);
	const secs = Math.floor((ms % 60000) / 1000);
	return `${mins}m ${secs}s`;
}

export function formatNumber(num: number): string {
	if (num < 1000) return String(num);
	if (num < 1000000) return `${(num / 1000).toFixed(1)}K`;
	return `${(num / 1000000).toFixed(1)}M`;
}

export function getFileIcon(filename: string): string {
	const ext = filename.split('.').pop()?.toLowerCase() || '';
	const iconMap: Record<string, string> = {
		ts: '🔷',
		tsx: '🔷',
		js: '🟡',
		jsx: '🟡',
		py: '🐍',
		rs: '🦀',
		go: '🔵',
		java: '☕',
		rb: '💎',
		html: '🌐',
		css: '🎨',
		scss: '🎨',
		json: '📋',
		yaml: '📋',
		yml: '📋',
		md: '📝',
		svg: '🖼️',
		png: '🖼️',
		jpg: '🖼️',
		sh: '⚡',
		dockerfile: '🐳',
		sql: '🗃️',
		svelte: '🔶',
		vue: '💚'
	};

	return iconMap[ext] || '📄';
}

export function getLanguageName(lang: string): string {
	const names: Record<string, string> = {
		ts: 'TypeScript',
		tsx: 'TypeScript React',
		js: 'JavaScript',
		jsx: 'JavaScript React',
		py: 'Python',
		rs: 'Rust',
		go: 'Go',
		java: 'Java',
		rb: 'Ruby',
		html: 'HTML',
		css: 'CSS',
		scss: 'SCSS',
		json: 'JSON',
		yaml: 'YAML',
		md: 'Markdown',
		sh: 'Shell',
		sql: 'SQL',
		svelte: 'Svelte',
		vue: 'Vue'
	};

	return names[lang] || lang;
}

export function classNames(...classes: (string | boolean | undefined | null)[]): string {
	return classes.filter(Boolean).join(' ');
}
