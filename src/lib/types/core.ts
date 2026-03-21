export interface User {
	id: string;
	username: string;
	displayName: string;
	avatarUrl?: string;
	githubId?: string;
	githubToken?: string;
	githubUsername?: string;
	createdAt: string;
	updatedAt: string;
}

export interface Session {
	id: string;
	userId: string;
	token: string;
	expiresAt: string;
	createdAt: string;
}

export interface Conversation {
	id: string;
	userId: string;
	title: string;
	model: string;
	mode: ConversationMode;
	createdAt: string;
	updatedAt: string;
	messageCount: number;
	lastMessageAt?: string;
	metadata?: Record<string, unknown>;
}

export type ConversationMode = 'chat' | 'agent';

export interface Message {
	id: string;
	conversationId: string;
	role: MessageRole;
	content: string;
	model?: string;
	toolCalls?: ToolCall[];
	toolResults?: ToolResult[];
	metadata?: MessageMetadata;
	createdAt: string;
	tokens?: { prompt: number; completion: number };
}

export type MessageRole = 'user' | 'assistant' | 'system' | 'tool';

export interface MessageMetadata {
	filesModified?: string[];
	commandsRun?: string[];
	prDrafted?: PRDraft;
	agentSteps?: AgentStep[];
	error?: string;
}

export interface ToolCall {
	id: string;
	type: string;
	function: {
		name: string;
		arguments: string;
	};
}

export interface ToolResult {
	toolCallId: string;
	content: string;
	isError?: boolean;
}

export interface AgentStep {
	id: string;
	type: AgentStepType;
	status: 'pending' | 'running' | 'completed' | 'failed';
	description: string;
	result?: string;
	error?: string;
	startedAt?: string;
	completedAt?: string;
}

export type AgentStepType =
	| 'think'
	| 'read_file'
	| 'write_file'
	| 'edit_file'
	| 'run_command'
	| 'search_files'
	| 'create_pr'
	| 'browse_repo';

export interface NvidiaModel {
	id: string;
	name: string;
	description: string;
	maxTokens: number;
	supportsTools: boolean;
	supportsFunctions: boolean;
	category: 'chat' | 'code' | 'reasoning';
}

export interface PRDraft {
	title: string;
	body: string;
	branch: string;
	baseBranch: string;
	files: PRFile[];
	repo: string;
	status: 'draft' | 'ready' | 'submitted' | 'merged';
}

export interface PRFile {
	path: string;
	content: string;
	status: 'added' | 'modified' | 'deleted';
	diff?: string;
}

export interface GitHubRepo {
	id: number;
	fullName: string;
	name: string;
	owner: string;
	description?: string;
	defaultBranch: string;
	isPrivate: boolean;
	url: string;
	cloneUrl: string;
}

export interface GitHubPR {
	id: number;
	number: number;
	title: string;
	body: string;
	state: 'open' | 'closed' | 'merged';
	author: string;
	branch: string;
	baseBranch: string;
	createdAt: string;
	updatedAt: string;
	url: string;
	mergeable?: boolean;
	reviewStatus?: string;
}

export interface SandboxState {
	id: string;
	conversationId: string;
	rootDir: string;
	files: SandboxFile[];
	commands: SandboxCommand[];
	gitBranch?: string;
	gitRepo?: string;
	createdAt: string;
}

export interface SandboxFile {
	path: string;
	content: string;
	language: string;
	lastModified: string;
}

export interface SandboxCommand {
	id: string;
	command: string;
	output: string;
	exitCode: number;
	executedAt: string;
	duration: number;
}

export interface AppSettings {
	nvidiaApiKey: string;
	defaultModel: string;
	theme: 'dark' | 'light';
	github: {
		connected: boolean;
		username?: string;
		token?: string;
	};
	agent: {
		autoApproveReads: boolean;
		autoApproveCommands: boolean;
		sandboxTimeout: number;
		maxFileSize: number;
	};
}

export interface StreamChunk {
	type: 'text' | 'tool_call' | 'tool_result' | 'agent_step' | 'error' | 'done';
	content?: string;
	toolCall?: ToolCall;
	toolResult?: ToolResult;
	agentStep?: AgentStep;
	error?: string;
	usage?: { promptTokens: number; completionTokens: number };
}

export interface APIError {
	code: string;
	message: string;
	status: number;
	details?: Record<string, unknown>;
}
