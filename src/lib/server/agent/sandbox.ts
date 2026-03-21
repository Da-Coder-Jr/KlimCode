import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, statSync, unlinkSync, rmSync } from 'fs';
import { join, dirname, relative, extname } from 'path';
import { execSync } from 'child_process';
import { v4 as uuid } from 'uuid';
import type { SandboxFile, SandboxCommand, SandboxState } from '$types/core';

const SANDBOX_ROOT = process.env.KLIMCODE_SANDBOX_DIR || './data/sandboxes';
const MAX_FILE_SIZE = 1024 * 1024; // 1MB
const COMMAND_TIMEOUT = parseInt(process.env.KLIMCODE_SANDBOX_TIMEOUT_MS || '30000', 10);

const BLOCKED_COMMANDS = [
	'rm -rf /',
	'mkfs',
	'dd if=',
	':(){',
	'fork bomb',
	'chmod -R 777 /',
	'wget.*|.*sh',
	'curl.*|.*sh'
];

const LANGUAGE_MAP: Record<string, string> = {
	'.ts': 'typescript',
	'.tsx': 'typescriptreact',
	'.js': 'javascript',
	'.jsx': 'javascriptreact',
	'.py': 'python',
	'.rs': 'rust',
	'.go': 'go',
	'.java': 'java',
	'.rb': 'ruby',
	'.php': 'php',
	'.c': 'c',
	'.cpp': 'cpp',
	'.h': 'c',
	'.hpp': 'cpp',
	'.cs': 'csharp',
	'.swift': 'swift',
	'.kt': 'kotlin',
	'.scala': 'scala',
	'.r': 'r',
	'.sql': 'sql',
	'.sh': 'shell',
	'.bash': 'shell',
	'.zsh': 'shell',
	'.fish': 'shell',
	'.ps1': 'powershell',
	'.yaml': 'yaml',
	'.yml': 'yaml',
	'.json': 'json',
	'.xml': 'xml',
	'.html': 'html',
	'.css': 'css',
	'.scss': 'scss',
	'.less': 'less',
	'.md': 'markdown',
	'.toml': 'toml',
	'.ini': 'ini',
	'.cfg': 'ini',
	'.env': 'dotenv',
	'.dockerfile': 'dockerfile',
	'.svelte': 'svelte',
	'.vue': 'vue'
};

export class Sandbox {
	id: string;
	conversationId: string;
	rootDir: string;
	files: SandboxFile[] = [];
	commands: SandboxCommand[] = [];
	gitBranch?: string;
	gitRepo?: string;
	createdAt: string;

	constructor(conversationId: string, repoCloneUrl?: string) {
		this.id = uuid();
		this.conversationId = conversationId;
		this.rootDir = join(SANDBOX_ROOT, this.id);
		this.createdAt = new Date().toISOString();

		mkdirSync(this.rootDir, { recursive: true });

		if (repoCloneUrl) {
			this.cloneRepo(repoCloneUrl);
		}
	}

	private cloneRepo(cloneUrl: string): void {
		try {
			execSync(`git clone --depth 1 ${cloneUrl} .`, {
				cwd: this.rootDir,
				timeout: 60000,
				stdio: 'pipe'
			});
			this.gitRepo = cloneUrl;
			this.gitBranch = this.getCurrentBranch();
		} catch (error) {
			throw new SandboxError(`Failed to clone repository: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	private getCurrentBranch(): string {
		try {
			return execSync('git rev-parse --abbrev-ref HEAD', {
				cwd: this.rootDir,
				encoding: 'utf-8'
			}).trim();
		} catch {
			return 'main';
		}
	}

	readFile(filePath: string): string {
		const absPath = this.resolvePath(filePath);
		if (!existsSync(absPath)) {
			throw new SandboxError(`File not found: ${filePath}`);
		}

		const stats = statSync(absPath);
		if (stats.size > MAX_FILE_SIZE) {
			throw new SandboxError(`File too large: ${filePath} (${Math.round(stats.size / 1024)}KB, max ${MAX_FILE_SIZE / 1024}KB)`);
		}

		const content = readFileSync(absPath, 'utf-8');
		return content;
	}

	writeFile(filePath: string, content: string): void {
		const absPath = this.resolvePath(filePath);
		const dir = dirname(absPath);
		mkdirSync(dir, { recursive: true });
		writeFileSync(absPath, content, 'utf-8');

		const ext = extname(filePath).toLowerCase();
		const existing = this.files.findIndex((f) => f.path === filePath);
		const fileEntry: SandboxFile = {
			path: filePath,
			content,
			language: LANGUAGE_MAP[ext] || 'plaintext',
			lastModified: new Date().toISOString()
		};

		if (existing >= 0) {
			this.files[existing] = fileEntry;
		} else {
			this.files.push(fileEntry);
		}
	}

	editFile(filePath: string, oldText: string, newText: string): string {
		const content = this.readFile(filePath);
		if (!content.includes(oldText)) {
			throw new SandboxError(`Text not found in ${filePath}. Make sure the old_text matches exactly.`);
		}

		const newContent = content.replace(oldText, newText);
		this.writeFile(filePath, newContent);
		return newContent;
	}

	deleteFile(filePath: string): void {
		const absPath = this.resolvePath(filePath);
		if (existsSync(absPath)) {
			unlinkSync(absPath);
			this.files = this.files.filter((f) => f.path !== filePath);
		}
	}

	runCommand(command: string, workingDir?: string): SandboxCommand {
		if (BLOCKED_COMMANDS.some((blocked) => command.includes(blocked))) {
			throw new SandboxError(`Command blocked for safety: ${command}`);
		}

		const cwd = workingDir ? this.resolvePath(workingDir) : this.rootDir;
		const cmdId = uuid();
		const startTime = Date.now();

		let output: string;
		let exitCode: number;

		try {
			output = execSync(command, {
				cwd,
				timeout: COMMAND_TIMEOUT,
				encoding: 'utf-8',
				maxBuffer: 5 * 1024 * 1024,
				env: {
					...process.env,
					HOME: this.rootDir,
					PATH: process.env.PATH
				}
			});
			exitCode = 0;
		} catch (error: unknown) {
			const execError = error as { stdout?: string; stderr?: string; status?: number };
			output = (execError.stdout || '') + (execError.stderr || '');
			exitCode = execError.status || 1;
		}

		const cmd: SandboxCommand = {
			id: cmdId,
			command,
			output: output.slice(0, 50000), // Limit output size
			exitCode,
			executedAt: new Date().toISOString(),
			duration: Date.now() - startTime
		};

		this.commands.push(cmd);
		return cmd;
	}

	searchFiles(pattern: string, searchType: 'filename' | 'content', directory?: string): string[] {
		const searchDir = directory ? this.resolvePath(directory) : this.rootDir;
		const results: string[] = [];

		if (searchType === 'filename') {
			this.walkDir(searchDir, (filePath) => {
				const relPath = relative(this.rootDir, filePath);
				if (this.matchGlob(relPath, pattern)) {
					results.push(relPath);
				}
			});
		} else {
			try {
				const grepOutput = execSync(
					`grep -r -l --include='*' -E ${JSON.stringify(pattern)} . 2>/dev/null || true`,
					{ cwd: searchDir, encoding: 'utf-8', timeout: 10000 }
				);
				for (const line of grepOutput.split('\n').filter(Boolean)) {
					results.push(line.replace(/^\.\//, ''));
				}
			} catch {
				// grep failed, return empty
			}
		}

		return results.slice(0, 100);
	}

	listFiles(directory?: string): string[] {
		const dir = directory ? this.resolvePath(directory) : this.rootDir;
		const results: string[] = [];

		this.walkDir(dir, (filePath) => {
			results.push(relative(this.rootDir, filePath));
		}, 3); // Max depth of 3

		return results.slice(0, 200);
	}

	createBranch(branchName: string): void {
		this.runCommand(`git checkout -b ${branchName}`);
		this.gitBranch = branchName;
	}

	commitChanges(message: string): void {
		this.runCommand('git add -A');
		this.runCommand(`git commit -m "${message.replace(/"/g, '\\"')}"`);
	}

	getDiff(): string {
		try {
			const result = this.runCommand('git diff HEAD');
			return result.output;
		} catch {
			return '';
		}
	}

	getState(): SandboxState {
		return {
			id: this.id,
			conversationId: this.conversationId,
			rootDir: this.rootDir,
			files: this.files,
			commands: this.commands,
			gitBranch: this.gitBranch,
			gitRepo: this.gitRepo,
			createdAt: this.createdAt
		};
	}

	destroy(): void {
		try {
			rmSync(this.rootDir, { recursive: true, force: true });
		} catch {
			// Best effort cleanup
		}
	}

	private resolvePath(filePath: string): string {
		const resolved = join(this.rootDir, filePath);
		if (!resolved.startsWith(this.rootDir)) {
			throw new SandboxError(`Path traversal attempt blocked: ${filePath}`);
		}
		return resolved;
	}

	private walkDir(dir: string, callback: (path: string) => void, maxDepth = 10, currentDepth = 0): void {
		if (currentDepth > maxDepth) return;
		if (!existsSync(dir)) return;

		try {
			const entries = readdirSync(dir);
			for (const entry of entries) {
				if (entry.startsWith('.') || entry === 'node_modules' || entry === '__pycache__') continue;

				const fullPath = join(dir, entry);
				try {
					const stats = statSync(fullPath);
					if (stats.isDirectory()) {
						this.walkDir(fullPath, callback, maxDepth, currentDepth + 1);
					} else if (stats.isFile()) {
						callback(fullPath);
					}
				} catch {
					// Skip inaccessible files
				}
			}
		} catch {
			// Skip inaccessible directories
		}
	}

	private matchGlob(path: string, pattern: string): boolean {
		const regexStr = pattern
			.replace(/\./g, '\\.')
			.replace(/\*\*/g, '{{DOUBLESTAR}}')
			.replace(/\*/g, '[^/]*')
			.replace(/\?/g, '[^/]')
			.replace(/{{DOUBLESTAR}}/g, '.*');
		return new RegExp(`^${regexStr}$`).test(path);
	}
}

export class SandboxError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'SandboxError';
	}
}

// Sandbox pool for managing active sandboxes
const activeSandboxes = new Map<string, Sandbox>();

export function getSandbox(conversationId: string): Sandbox | undefined {
	return activeSandboxes.get(conversationId);
}

export function createSandbox(conversationId: string, repoCloneUrl?: string): Sandbox {
	const existing = activeSandboxes.get(conversationId);
	if (existing) return existing;

	const sandbox = new Sandbox(conversationId, repoCloneUrl);
	activeSandboxes.set(conversationId, sandbox);
	return sandbox;
}

export function destroySandbox(conversationId: string): void {
	const sandbox = activeSandboxes.get(conversationId);
	if (sandbox) {
		sandbox.destroy();
		activeSandboxes.delete(conversationId);
	}
}
