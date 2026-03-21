import Database from 'better-sqlite3';
import { existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';

const DB_PATH = process.env.KLIMCODE_DB_PATH || './data/klimcode.db';

let db: Database.Database | null = null;

export function getDb(): Database.Database {
	if (!db) {
		const dir = dirname(DB_PATH);
		if (!existsSync(dir)) {
			mkdirSync(dir, { recursive: true });
		}

		db = new Database(DB_PATH);
		db.pragma('journal_mode = WAL');
		db.pragma('foreign_keys = ON');
		db.pragma('busy_timeout = 5000');

		initializeSchema(db);
	}
	return db;
}

function initializeSchema(db: Database.Database): void {
	db.exec(`
		CREATE TABLE IF NOT EXISTS users (
			id TEXT PRIMARY KEY,
			username TEXT UNIQUE NOT NULL,
			display_name TEXT NOT NULL,
			avatar_url TEXT,
			password_hash TEXT,
			github_id TEXT UNIQUE,
			github_token TEXT,
			settings_json TEXT DEFAULT '{}',
			created_at TEXT NOT NULL DEFAULT (datetime('now')),
			updated_at TEXT NOT NULL DEFAULT (datetime('now'))
		);

		CREATE TABLE IF NOT EXISTS sessions (
			id TEXT PRIMARY KEY,
			user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			token TEXT UNIQUE NOT NULL,
			expires_at TEXT NOT NULL,
			created_at TEXT NOT NULL DEFAULT (datetime('now'))
		);

		CREATE TABLE IF NOT EXISTS conversations (
			id TEXT PRIMARY KEY,
			user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			title TEXT NOT NULL DEFAULT 'New Conversation',
			model TEXT NOT NULL DEFAULT 'meta/llama-3.3-70b-instruct',
			mode TEXT NOT NULL DEFAULT 'chat' CHECK (mode IN ('chat', 'agent')),
			github_repo TEXT,
			github_branch TEXT,
			metadata_json TEXT DEFAULT '{}',
			created_at TEXT NOT NULL DEFAULT (datetime('now')),
			updated_at TEXT NOT NULL DEFAULT (datetime('now'))
		);

		CREATE TABLE IF NOT EXISTS messages (
			id TEXT PRIMARY KEY,
			conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
			role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system', 'tool')),
			content TEXT NOT NULL,
			model TEXT,
			tool_calls_json TEXT,
			tool_results_json TEXT,
			metadata_json TEXT DEFAULT '{}',
			tokens_prompt INTEGER DEFAULT 0,
			tokens_completion INTEGER DEFAULT 0,
			created_at TEXT NOT NULL DEFAULT (datetime('now'))
		);

		CREATE TABLE IF NOT EXISTS api_keys (
			id TEXT PRIMARY KEY,
			user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			provider TEXT NOT NULL DEFAULT 'nvidia',
			api_key_encrypted TEXT NOT NULL,
			label TEXT,
			created_at TEXT NOT NULL DEFAULT (datetime('now'))
		);

		CREATE TABLE IF NOT EXISTS github_repos (
			id TEXT PRIMARY KEY,
			user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			full_name TEXT NOT NULL,
			name TEXT NOT NULL,
			owner TEXT NOT NULL,
			description TEXT,
			default_branch TEXT DEFAULT 'main',
			is_private INTEGER DEFAULT 0,
			clone_url TEXT,
			created_at TEXT NOT NULL DEFAULT (datetime('now'))
		);

		CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
		CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
		CREATE INDEX IF NOT EXISTS idx_conversations_user ON conversations(user_id);
		CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
		CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at);
		CREATE INDEX IF NOT EXISTS idx_api_keys_user ON api_keys(user_id);
		CREATE INDEX IF NOT EXISTS idx_github_repos_user ON github_repos(user_id);
	`);
}

export function closeDb(): void {
	if (db) {
		db.close();
		db = null;
	}
}
