import type { NvidiaModel } from '$types/core';

export const AVAILABLE_MODELS: NvidiaModel[] = [
	// ── Code Models ──
	{
		id: 'meta/llama-3.3-70b-instruct',
		name: 'Llama 3.3 70B',
		description: 'Best overall model for code generation and reasoning',
		maxTokens: 16384,
		supportsTools: true,
		supportsFunctions: true,
		category: 'code'
	},
	{
		id: 'qwen/qwen2.5-coder-32b-instruct',
		name: 'Qwen 2.5 Coder 32B',
		description: 'Specialized coding model with strong code generation',
		maxTokens: 16384,
		supportsTools: true,
		supportsFunctions: true,
		category: 'code'
	},
	{
		id: 'meta/codellama-70b-instruct',
		name: 'Code Llama 70B',
		description: 'Meta code-focused model for programming tasks',
		maxTokens: 16384,
		supportsTools: false,
		supportsFunctions: false,
		category: 'code'
	},
	{
		id: 'meta/llama-3.1-70b-instruct',
		name: 'Llama 3.1 70B',
		description: 'Strong all-around model for coding and reasoning',
		maxTokens: 16384,
		supportsTools: true,
		supportsFunctions: true,
		category: 'code'
	},

	// ── Reasoning Models ──
	{
		id: 'meta/llama-3.1-405b-instruct',
		name: 'Llama 3.1 405B',
		description: 'Largest open model for complex reasoning and analysis',
		maxTokens: 16384,
		supportsTools: true,
		supportsFunctions: true,
		category: 'reasoning'
	},
	{
		id: 'nvidia/llama-3.1-nemotron-70b-instruct',
		name: 'Nemotron 70B',
		description: 'NVIDIA-optimized for high quality instruction following',
		maxTokens: 16384,
		supportsTools: true,
		supportsFunctions: true,
		category: 'reasoning'
	},
	{
		id: 'deepseek-ai/deepseek-r1',
		name: 'DeepSeek R1',
		description: 'Advanced chain-of-thought reasoning model',
		maxTokens: 32768,
		supportsTools: false,
		supportsFunctions: false,
		category: 'reasoning'
	},
	{
		id: 'meta/llama-3.1-8b-instruct',
		name: 'Llama 3.1 8B',
		description: 'Compact and efficient reasoning model',
		maxTokens: 16384,
		supportsTools: true,
		supportsFunctions: true,
		category: 'reasoning'
	},

	// ── Chat Models ──
	{
		id: 'microsoft/phi-4',
		name: 'Phi-4',
		description: 'Lightweight and fast, great for quick tasks',
		maxTokens: 16384,
		supportsTools: false,
		supportsFunctions: false,
		category: 'chat'
	},
	{
		id: 'google/gemma-2-27b-it',
		name: 'Gemma 2 27B',
		description: 'Balanced model for conversational tasks',
		maxTokens: 8192,
		supportsTools: false,
		supportsFunctions: false,
		category: 'chat'
	},
	{
		id: 'mistralai/mixtral-8x22b-instruct-v0.1',
		name: 'Mixtral 8x22B',
		description: 'Mixture of experts model with broad capabilities',
		maxTokens: 32768,
		supportsTools: true,
		supportsFunctions: true,
		category: 'chat'
	},
	{
		id: 'mistralai/mistral-large-2-instruct',
		name: 'Mistral Large 2',
		description: 'Powerful Mistral model for complex tasks',
		maxTokens: 16384,
		supportsTools: true,
		supportsFunctions: true,
		category: 'chat'
	},
	{
		id: 'google/gemma-2-9b-it',
		name: 'Gemma 2 9B',
		description: 'Compact Google model for quick responses',
		maxTokens: 8192,
		supportsTools: false,
		supportsFunctions: false,
		category: 'chat'
	},
	{
		id: 'mistralai/mistral-7b-instruct-v0.3',
		name: 'Mistral 7B v0.3',
		description: 'Fast lightweight model for simple tasks',
		maxTokens: 8192,
		supportsTools: false,
		supportsFunctions: false,
		category: 'chat'
	}
];
