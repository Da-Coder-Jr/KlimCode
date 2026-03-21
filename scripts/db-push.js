#!/usr/bin/env node

/**
 * Run this to create the database tables.
 * Usage: npm run db:push
 *
 * Requires POSTGRES_URL environment variable.
 */

import 'dotenv/config';
import { createPool } from '@vercel/postgres';

async function main() {
	console.log('Connecting to database...');
	const pool = createPool();

	const tables = [
		`CREATE TABLE IF NOT EXISTS users (
			id TEXT PRIMARY KEY,
			username TEXT UNIQUE NOT NULL,
			display_name TEXT NOT NULL,
			avatar_url TEXT,
			password_hash TEXT,
			github_id TEXT UNIQUE,
			github_token TEXT,
			settings_json TEXT DEFAULT '{}',
			created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
		)`,
		`CREATE TABLE IF NOT EXISTS sessions (
			id TEXT PRIMARY KEY,
			user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			token TEXT UNIQUE NOT NULL,
			expires_at TIMESTAMP NOT NULL,
			created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
		)`,
		`CREATE TABLE IF NOT EXISTS conversations (
			id TEXT PRIMARY KEY,
			user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			title TEXT NOT NULL DEFAULT 'New Conversation',
			model TEXT NOT NULL DEFAULT 'meta/llama-3.3-70b-instruct',
			mode TEXT NOT NULL DEFAULT 'chat',
			github_repo TEXT,
			github_branch TEXT,
			metadata_json TEXT DEFAULT '{}',
			created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
		)`,
		`CREATE TABLE IF NOT EXISTS messages (
			id TEXT PRIMARY KEY,
			conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
			role TEXT NOT NULL,
			content TEXT NOT NULL,
			model TEXT,
			tool_calls_json TEXT,
			tool_results_json TEXT,
			metadata_json TEXT DEFAULT '{}',
			tokens_prompt INTEGER DEFAULT 0,
			tokens_completion INTEGER DEFAULT 0,
			created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
		)`,
		`CREATE TABLE IF NOT EXISTS api_keys (
			id TEXT PRIMARY KEY,
			user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			provider TEXT NOT NULL DEFAULT 'nvidia',
			api_key_encrypted TEXT NOT NULL,
			label TEXT,
			created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
		)`,
		`CREATE TABLE IF NOT EXISTS github_repos (
			id TEXT PRIMARY KEY,
			user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			full_name TEXT NOT NULL,
			name TEXT NOT NULL,
			owner TEXT NOT NULL,
			description TEXT,
			default_branch TEXT DEFAULT 'main',
			is_private BOOLEAN DEFAULT false,
			clone_url TEXT,
			created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
		)`
	];

	const indexes = [
		'CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token)',
		'CREATE INDEX IF NOT EXISTS idx_conversations_user ON conversations(user_id)',
		'CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id)',
		'CREATE INDEX IF NOT EXISTS idx_api_keys_user ON api_keys(user_id)'
	];

	for (const sql of [...tables, ...indexes]) {
		await pool.query(sql);
	}

	console.log('Database tables created successfully!');
	process.exit(0);
}

main().catch((err) => {
	console.error('Failed:', err.message);
	process.exit(1);
});
