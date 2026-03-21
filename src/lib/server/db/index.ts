import { createPool } from '@vercel/postgres';

let pool: ReturnType<typeof createPool> | null = null;

export function getPool() {
	if (!pool) {
		pool = createPool();
	}
	return pool;
}

export async function query(text: string, params: unknown[] = []) {
	const p = getPool();
	try {
		return await p.query(text, params);
	} catch (error) {
		// Re-throw with more context
		const msg = error instanceof Error ? error.message : String(error);
		console.error(`DB query failed: ${msg}\nQuery: ${text.slice(0, 200)}`);
		throw error;
	}
}

export async function queryOne<T = Record<string, unknown>>(
	text: string,
	params: unknown[] = []
): Promise<T | null> {
	const result = await query(text, params);
	return (result.rows[0] as T) || null;
}

export async function queryMany<T = Record<string, unknown>>(
	text: string,
	params: unknown[] = []
): Promise<T[]> {
	const result = await query(text, params);
	return result.rows as T[];
}

export async function initializeDatabase(): Promise<void> {
	const p = getPool();

	// Create all tables in a single connection
	await p.query(`
		CREATE TABLE IF NOT EXISTS users (
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
		)
	`);

	await p.query(`
		CREATE TABLE IF NOT EXISTS sessions (
			id TEXT PRIMARY KEY,
			user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			token TEXT UNIQUE NOT NULL,
			expires_at TIMESTAMP NOT NULL,
			created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
		)
	`);

	await p.query(`
		CREATE TABLE IF NOT EXISTS conversations (
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
		)
	`);

	await p.query(`
		CREATE TABLE IF NOT EXISTS messages (
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
		)
	`);

	await p.query(`
		CREATE TABLE IF NOT EXISTS api_keys (
			id TEXT PRIMARY KEY,
			user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			provider TEXT NOT NULL DEFAULT 'nvidia',
			api_key_encrypted TEXT NOT NULL,
			label TEXT,
			created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
		)
	`);

	await p.query(`
		CREATE TABLE IF NOT EXISTS github_repos (
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
		)
	`);

	// Create indexes
	await p.query(`CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token)`);
	await p.query(`CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at)`);
	await p.query(`CREATE INDEX IF NOT EXISTS idx_conversations_user ON conversations(user_id)`);
	await p.query(`CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id)`);
	await p.query(`CREATE INDEX IF NOT EXISTS idx_api_keys_user ON api_keys(user_id)`);
	await p.query(`CREATE INDEX IF NOT EXISTS idx_users_github_id ON users(github_id)`);
}

// Run migrations on first request
let initialized = false;
let initPromise: Promise<void> | null = null;

export async function ensureDb(): Promise<void> {
	if (initialized) return;

	// Prevent concurrent initialization attempts
	if (initPromise) {
		await initPromise;
		return;
	}

	initPromise = initializeDatabase()
		.then(() => {
			initialized = true;
		})
		.catch((error) => {
			initPromise = null;
			console.error('Database initialization failed:', error);
			throw error;
		});

	await initPromise;
}
