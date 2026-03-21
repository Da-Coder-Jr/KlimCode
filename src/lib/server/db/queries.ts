import { v4 as uuid } from 'uuid';
import { getDb } from './index';
import type { User, Session, Conversation, Message } from '$types/core';

// ── User Queries ──

export function createUser(username: string, displayName: string, passwordHash?: string): User {
	const db = getDb();
	const id = uuid();
	const now = new Date().toISOString();

	db.prepare(
		`INSERT INTO users (id, username, display_name, password_hash, created_at, updated_at)
		 VALUES (?, ?, ?, ?, ?, ?)`
	).run(id, username, displayName, passwordHash || null, now, now);

	return getUserById(id)!;
}

export function getUserById(id: string): User | null {
	const db = getDb();
	const row = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as Record<string, unknown> | undefined;
	return row ? mapUser(row) : null;
}

export function getUserByUsername(username: string): User | null {
	const db = getDb();
	const row = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as Record<string, unknown> | undefined;
	return row ? mapUser(row) : null;
}

export function getUserByGithubId(githubId: string): User | null {
	const db = getDb();
	const row = db.prepare('SELECT * FROM users WHERE github_id = ?').get(githubId) as Record<string, unknown> | undefined;
	return row ? mapUser(row) : null;
}

export function updateUserGithub(userId: string, githubId: string, githubToken: string, avatarUrl?: string): void {
	const db = getDb();
	db.prepare(
		`UPDATE users SET github_id = ?, github_token = ?, avatar_url = COALESCE(?, avatar_url), updated_at = datetime('now')
		 WHERE id = ?`
	).run(githubId, githubToken, avatarUrl || null, userId);
}

export function getPasswordHash(userId: string): string | null {
	const db = getDb();
	const row = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(userId) as { password_hash: string | null } | undefined;
	return row?.password_hash || null;
}

// ── Session Queries ──

export function createSession(userId: string): Session {
	const db = getDb();
	const id = uuid();
	const token = uuid() + '-' + uuid();
	const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days

	db.prepare(
		'INSERT INTO sessions (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)'
	).run(id, userId, token, expiresAt);

	return { id, userId, token, expiresAt, createdAt: new Date().toISOString() };
}

export function getSessionByToken(token: string): Session | null {
	const db = getDb();
	const row = db.prepare(
		"SELECT * FROM sessions WHERE token = ? AND expires_at > datetime('now')"
	).get(token) as Record<string, unknown> | undefined;

	if (!row) return null;

	return {
		id: row.id as string,
		userId: row.user_id as string,
		token: row.token as string,
		expiresAt: row.expires_at as string,
		createdAt: row.created_at as string
	};
}

export function deleteSession(token: string): void {
	const db = getDb();
	db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
}

export function deleteUserSessions(userId: string): void {
	const db = getDb();
	db.prepare('DELETE FROM sessions WHERE user_id = ?').run(userId);
}

// ── Conversation Queries ──

export function createConversation(userId: string, mode: 'chat' | 'agent', model: string, title?: string): Conversation {
	const db = getDb();
	const id = uuid();
	const now = new Date().toISOString();

	db.prepare(
		`INSERT INTO conversations (id, user_id, title, model, mode, created_at, updated_at)
		 VALUES (?, ?, ?, ?, ?, ?, ?)`
	).run(id, userId, title || 'New Conversation', model, mode, now, now);

	return {
		id,
		userId,
		title: title || 'New Conversation',
		model,
		mode,
		createdAt: now,
		updatedAt: now,
		messageCount: 0
	};
}

export function getConversation(id: string, userId: string): Conversation | null {
	const db = getDb();
	const row = db.prepare(
		`SELECT c.*, COUNT(m.id) as message_count, MAX(m.created_at) as last_message_at
		 FROM conversations c
		 LEFT JOIN messages m ON m.conversation_id = c.id
		 WHERE c.id = ? AND c.user_id = ?
		 GROUP BY c.id`
	).get(id, userId) as Record<string, unknown> | undefined;

	return row ? mapConversation(row) : null;
}

export function listConversations(userId: string, limit = 50, offset = 0): Conversation[] {
	const db = getDb();
	const rows = db.prepare(
		`SELECT c.*, COUNT(m.id) as message_count, MAX(m.created_at) as last_message_at
		 FROM conversations c
		 LEFT JOIN messages m ON m.conversation_id = c.id
		 WHERE c.user_id = ?
		 GROUP BY c.id
		 ORDER BY c.updated_at DESC
		 LIMIT ? OFFSET ?`
	).all(userId, limit, offset) as Record<string, unknown>[];

	return rows.map(mapConversation);
}

export function updateConversationTitle(id: string, userId: string, title: string): void {
	const db = getDb();
	db.prepare(
		"UPDATE conversations SET title = ?, updated_at = datetime('now') WHERE id = ? AND user_id = ?"
	).run(title, id, userId);
}

export function updateConversationGithub(id: string, repo: string, branch: string): void {
	const db = getDb();
	db.prepare(
		"UPDATE conversations SET github_repo = ?, github_branch = ?, updated_at = datetime('now') WHERE id = ?"
	).run(repo, branch, id);
}

export function deleteConversation(id: string, userId: string): void {
	const db = getDb();
	db.prepare('DELETE FROM conversations WHERE id = ? AND user_id = ?').run(id, userId);
}

// ── Message Queries ──

export function createMessage(
	conversationId: string,
	role: string,
	content: string,
	options?: {
		model?: string;
		toolCalls?: unknown[];
		toolResults?: unknown[];
		metadata?: Record<string, unknown>;
		tokensPrompt?: number;
		tokensCompletion?: number;
	}
): Message {
	const db = getDb();
	const id = uuid();
	const now = new Date().toISOString();

	db.prepare(
		`INSERT INTO messages (id, conversation_id, role, content, model, tool_calls_json, tool_results_json, metadata_json, tokens_prompt, tokens_completion, created_at)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
	).run(
		id,
		conversationId,
		role,
		content,
		options?.model || null,
		options?.toolCalls ? JSON.stringify(options.toolCalls) : null,
		options?.toolResults ? JSON.stringify(options.toolResults) : null,
		options?.metadata ? JSON.stringify(options.metadata) : '{}',
		options?.tokensPrompt || 0,
		options?.tokensCompletion || 0,
		now
	);

	// Update conversation timestamp
	db.prepare("UPDATE conversations SET updated_at = datetime('now') WHERE id = ?").run(conversationId);

	return {
		id,
		conversationId,
		role: role as Message['role'],
		content,
		model: options?.model,
		createdAt: now
	};
}

export function getMessages(conversationId: string, limit = 100, offset = 0): Message[] {
	const db = getDb();
	const rows = db.prepare(
		`SELECT * FROM messages WHERE conversation_id = ?
		 ORDER BY created_at ASC
		 LIMIT ? OFFSET ?`
	).all(conversationId, limit, offset) as Record<string, unknown>[];

	return rows.map(mapMessage);
}

export function deleteMessage(id: string): void {
	const db = getDb();
	db.prepare('DELETE FROM messages WHERE id = ?').run(id);
}

// ── API Key Queries ──

export function storeApiKey(userId: string, apiKey: string, label?: string): void {
	const db = getDb();
	const id = uuid();
	// In production, encrypt this. For now, simple base64 encoding
	const encrypted = Buffer.from(apiKey).toString('base64');

	db.prepare(
		'INSERT INTO api_keys (id, user_id, api_key_encrypted, label) VALUES (?, ?, ?, ?)'
	).run(id, userId, encrypted, label || 'NVIDIA NIM');
}

export function getApiKey(userId: string): string | null {
	const db = getDb();
	const row = db.prepare(
		"SELECT api_key_encrypted FROM api_keys WHERE user_id = ? AND provider = 'nvidia' ORDER BY created_at DESC LIMIT 1"
	).get(userId) as { api_key_encrypted: string } | undefined;

	if (!row) return null;
	return Buffer.from(row.api_key_encrypted, 'base64').toString('utf-8');
}

export function deleteApiKeys(userId: string): void {
	const db = getDb();
	db.prepare("DELETE FROM api_keys WHERE user_id = ? AND provider = 'nvidia'").run(userId);
}

// ── GitHub Repo Queries ──

export function saveGithubRepo(userId: string, repo: {
	fullName: string;
	name: string;
	owner: string;
	description?: string;
	defaultBranch: string;
	isPrivate: boolean;
	cloneUrl: string;
}): void {
	const db = getDb();
	const id = uuid();

	db.prepare(
		`INSERT OR REPLACE INTO github_repos (id, user_id, full_name, name, owner, description, default_branch, is_private, clone_url)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
	).run(id, userId, repo.fullName, repo.name, repo.owner, repo.description || null, repo.defaultBranch, repo.isPrivate ? 1 : 0, repo.cloneUrl);
}

export function getUserGithubRepos(userId: string): Array<{
	fullName: string;
	name: string;
	owner: string;
	description: string | null;
	defaultBranch: string;
	isPrivate: boolean;
	cloneUrl: string;
}> {
	const db = getDb();
	const rows = db.prepare('SELECT * FROM github_repos WHERE user_id = ? ORDER BY full_name').all(userId) as Record<string, unknown>[];

	return rows.map((r) => ({
		fullName: r.full_name as string,
		name: r.name as string,
		owner: r.owner as string,
		description: r.description as string | null,
		defaultBranch: r.default_branch as string,
		isPrivate: Boolean(r.is_private),
		cloneUrl: r.clone_url as string
	}));
}

// ── Mappers ──

function mapUser(row: Record<string, unknown>): User {
	return {
		id: row.id as string,
		username: row.username as string,
		displayName: row.display_name as string,
		avatarUrl: row.avatar_url as string | undefined,
		githubId: row.github_id as string | undefined,
		githubToken: row.github_token as string | undefined,
		createdAt: row.created_at as string,
		updatedAt: row.updated_at as string
	};
}

function mapConversation(row: Record<string, unknown>): Conversation {
	return {
		id: row.id as string,
		userId: row.user_id as string,
		title: row.title as string,
		model: row.model as string,
		mode: row.mode as 'chat' | 'agent',
		createdAt: row.created_at as string,
		updatedAt: row.updated_at as string,
		messageCount: (row.message_count as number) || 0,
		lastMessageAt: row.last_message_at as string | undefined
	};
}

function mapMessage(row: Record<string, unknown>): Message {
	return {
		id: row.id as string,
		conversationId: row.conversation_id as string,
		role: row.role as Message['role'],
		content: row.content as string,
		model: row.model as string | undefined,
		toolCalls: row.tool_calls_json ? JSON.parse(row.tool_calls_json as string) : undefined,
		toolResults: row.tool_results_json ? JSON.parse(row.tool_results_json as string) : undefined,
		metadata: row.metadata_json ? JSON.parse(row.metadata_json as string) : undefined,
		createdAt: row.created_at as string,
		tokens: {
			prompt: (row.tokens_prompt as number) || 0,
			completion: (row.tokens_completion as number) || 0
		}
	};
}
