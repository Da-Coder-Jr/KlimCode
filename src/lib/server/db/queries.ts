import crypto from 'crypto';
import { query, queryOne, queryMany, ensureDb } from './index';
import type { User, Session, Conversation, Message } from '$types/core';

// ── User Queries ──

export async function createUser(username: string, displayName: string, passwordHash?: string): Promise<User> {
	await ensureDb();
	const id = crypto.randomUUID();
	const now = new Date().toISOString();

	await query(
		`INSERT INTO users (id, username, display_name, password_hash, created_at, updated_at)
		 VALUES ($1, $2, $3, $4, $5, $6)`,
		[id, username, displayName, passwordHash || null, now, now]
	);

	return (await getUserById(id))!;
}

export async function getUserById(id: string): Promise<User | null> {
	await ensureDb();
	const row = await queryOne<Record<string, unknown>>(
		'SELECT * FROM users WHERE id = $1', [id]
	);
	return row ? mapUser(row) : null;
}

export async function getUserByUsername(username: string): Promise<User | null> {
	await ensureDb();
	const row = await queryOne<Record<string, unknown>>(
		'SELECT * FROM users WHERE username = $1', [username]
	);
	return row ? mapUser(row) : null;
}

export async function getUserByGithubId(githubId: string): Promise<User | null> {
	await ensureDb();
	const row = await queryOne<Record<string, unknown>>(
		'SELECT * FROM users WHERE github_id = $1', [githubId]
	);
	return row ? mapUser(row) : null;
}

export async function updateUserGithub(userId: string, githubId: string, githubToken: string, avatarUrl?: string): Promise<void> {
	await ensureDb();
	await query(
		`UPDATE users SET github_id = $1, github_token = $2, avatar_url = COALESCE($3, avatar_url), updated_at = CURRENT_TIMESTAMP
		 WHERE id = $4`,
		[githubId, githubToken, avatarUrl || null, userId]
	);
}

export async function getPasswordHash(userId: string): Promise<string | null> {
	await ensureDb();
	const row = await queryOne<{ password_hash: string | null }>(
		'SELECT password_hash FROM users WHERE id = $1', [userId]
	);
	return row?.password_hash || null;
}

// ── Session Queries ──

export async function createSession(userId: string): Promise<Session> {
	await ensureDb();
	const id = crypto.randomUUID();
	// Use crypto.randomBytes for a secure session token
	const token = crypto.randomBytes(32).toString('hex');
	const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

	await query(
		'INSERT INTO sessions (id, user_id, token, expires_at) VALUES ($1, $2, $3, $4)',
		[id, userId, token, expiresAt]
	);

	return { id, userId, token, expiresAt, createdAt: new Date().toISOString() };
}

export async function getSessionByToken(token: string): Promise<Session | null> {
	await ensureDb();
	const row = await queryOne<Record<string, unknown>>(
		'SELECT * FROM sessions WHERE token = $1 AND expires_at > CURRENT_TIMESTAMP',
		[token]
	);
	if (!row) return null;

	return {
		id: row.id as string,
		userId: row.user_id as string,
		token: row.token as string,
		expiresAt: String(row.expires_at),
		createdAt: String(row.created_at)
	};
}

export async function deleteSession(token: string): Promise<void> {
	await ensureDb();
	await query('DELETE FROM sessions WHERE token = $1', [token]);
}

// ── Conversation Queries ──

export async function createConversation(userId: string, mode: 'chat' | 'agent', model: string, title?: string): Promise<Conversation> {
	await ensureDb();
	const id = crypto.randomUUID();
	const now = new Date().toISOString();

	await query(
		`INSERT INTO conversations (id, user_id, title, model, mode, created_at, updated_at)
		 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
		[id, userId, title || 'New Conversation', model, mode, now, now]
	);

	return {
		id, userId, title: title || 'New Conversation', model, mode,
		createdAt: now, updatedAt: now, messageCount: 0
	};
}

export async function getConversation(id: string, userId: string): Promise<Conversation | null> {
	await ensureDb();
	const row = await queryOne<Record<string, unknown>>(
		`SELECT c.*, COUNT(m.id) as message_count, MAX(m.created_at) as last_message_at
		 FROM conversations c
		 LEFT JOIN messages m ON m.conversation_id = c.id
		 WHERE c.id = $1 AND c.user_id = $2
		 GROUP BY c.id`,
		[id, userId]
	);
	return row ? mapConversation(row) : null;
}

export async function listConversations(userId: string, limit = 50, offset = 0): Promise<Conversation[]> {
	await ensureDb();
	const rows = await queryMany<Record<string, unknown>>(
		`SELECT c.*, COUNT(m.id) as message_count, MAX(m.created_at) as last_message_at
		 FROM conversations c
		 LEFT JOIN messages m ON m.conversation_id = c.id
		 WHERE c.user_id = $1
		 GROUP BY c.id
		 ORDER BY c.updated_at DESC
		 LIMIT $2 OFFSET $3`,
		[userId, limit, offset]
	);
	return rows.map(mapConversation);
}

export async function updateConversationTitle(id: string, userId: string, title: string): Promise<void> {
	await ensureDb();
	await query(
		'UPDATE conversations SET title = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND user_id = $3',
		[title, id, userId]
	);
}

export async function updateConversationGithub(id: string, repo: string, branch: string): Promise<void> {
	await ensureDb();
	await query(
		'UPDATE conversations SET github_repo = $1, github_branch = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
		[repo, branch, id]
	);
}

export async function deleteConversation(id: string, userId: string): Promise<void> {
	await ensureDb();
	await query('DELETE FROM conversations WHERE id = $1 AND user_id = $2', [id, userId]);
}

// ── Message Queries ──

export async function createMessage(
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
): Promise<Message> {
	await ensureDb();
	const id = crypto.randomUUID();
	const now = new Date().toISOString();

	await query(
		`INSERT INTO messages (id, conversation_id, role, content, model, tool_calls_json, tool_results_json, metadata_json, tokens_prompt, tokens_completion, created_at)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
		[
			id, conversationId, role, content,
			options?.model || null,
			options?.toolCalls ? JSON.stringify(options.toolCalls) : null,
			options?.toolResults ? JSON.stringify(options.toolResults) : null,
			options?.metadata ? JSON.stringify(options.metadata) : '{}',
			options?.tokensPrompt || 0,
			options?.tokensCompletion || 0,
			now
		]
	);

	await query('UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = $1', [conversationId]);

	return {
		id, conversationId, role: role as Message['role'], content,
		model: options?.model, createdAt: now
	};
}

export async function getMessages(conversationId: string, limit = 100, offset = 0): Promise<Message[]> {
	await ensureDb();
	const rows = await queryMany<Record<string, unknown>>(
		`SELECT * FROM messages WHERE conversation_id = $1
		 ORDER BY created_at ASC LIMIT $2 OFFSET $3`,
		[conversationId, limit, offset]
	);
	return rows.map(mapMessage);
}

// ── API Key Queries ──

export async function storeApiKey(userId: string, apiKey: string, label?: string): Promise<void> {
	await ensureDb();
	const id = crypto.randomUUID();
	// Base64 encode - note: this is encoding, not encryption
	// For production, use proper encryption with a secret key
	const encrypted = Buffer.from(apiKey).toString('base64');

	// Delete old keys first to avoid accumulation
	await query("DELETE FROM api_keys WHERE user_id = $1 AND provider = 'nvidia'", [userId]);

	await query(
		'INSERT INTO api_keys (id, user_id, api_key_encrypted, label) VALUES ($1, $2, $3, $4)',
		[id, userId, encrypted, label || 'NVIDIA NIM']
	);
}

export async function getApiKey(userId: string): Promise<string | null> {
	await ensureDb();
	const row = await queryOne<{ api_key_encrypted: string }>(
		"SELECT api_key_encrypted FROM api_keys WHERE user_id = $1 AND provider = 'nvidia' ORDER BY created_at DESC LIMIT 1",
		[userId]
	);
	if (!row) return null;
	return Buffer.from(row.api_key_encrypted, 'base64').toString('utf-8');
}

export async function deleteApiKeys(userId: string): Promise<void> {
	await ensureDb();
	await query("DELETE FROM api_keys WHERE user_id = $1 AND provider = 'nvidia'", [userId]);
}

// ── GitHub Repo Queries ──

export async function saveGithubRepo(userId: string, repo: {
	fullName: string; name: string; owner: string; description?: string;
	defaultBranch: string; isPrivate: boolean; cloneUrl: string;
}): Promise<void> {
	await ensureDb();
	const id = crypto.randomUUID();
	await query(
		`INSERT INTO github_repos (id, user_id, full_name, name, owner, description, default_branch, is_private, clone_url)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		 ON CONFLICT (id) DO UPDATE SET full_name = $3, clone_url = $9`,
		[id, userId, repo.fullName, repo.name, repo.owner, repo.description || null, repo.defaultBranch, repo.isPrivate, repo.cloneUrl]
	);
}

export async function getUserGithubRepos(userId: string) {
	await ensureDb();
	return queryMany<{
		full_name: string; name: string; owner: string; description: string | null;
		default_branch: string; is_private: boolean; clone_url: string;
	}>('SELECT * FROM github_repos WHERE user_id = $1 ORDER BY full_name', [userId]);
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
		createdAt: String(row.created_at),
		updatedAt: String(row.updated_at)
	};
}

function mapConversation(row: Record<string, unknown>): Conversation {
	return {
		id: row.id as string,
		userId: row.user_id as string,
		title: row.title as string,
		model: row.model as string,
		mode: row.mode as 'chat' | 'agent',
		createdAt: String(row.created_at),
		updatedAt: String(row.updated_at),
		messageCount: Number(row.message_count) || 0,
		lastMessageAt: row.last_message_at ? String(row.last_message_at) : undefined
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
		createdAt: String(row.created_at),
		tokens: {
			prompt: Number(row.tokens_prompt) || 0,
			completion: Number(row.tokens_completion) || 0
		}
	};
}
