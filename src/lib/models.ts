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
	},

	// ── New Frontier Models (2025-2026) ──
	{
		id: 'deepseek-ai/deepseek-v3.2',
		name: 'DeepSeek V3.2',
		description: 'State-of-the-art 685B MoE — gold-medal IMO/IOI performance, comparable to GPT-5',
		maxTokens: 32768,
		supportsTools: true,
		supportsFunctions: true,
		category: 'reasoning'
	},
	{
		id: 'deepseek-ai/deepseek-v3.1-terminus',
		name: 'DeepSeek V3.1 Terminus',
		description: 'Hybrid think/non-think, hardened for agents & tool chains, 128K context',
		maxTokens: 32768,
		supportsTools: true,
		supportsFunctions: true,
		category: 'code'
	},
	{
		id: 'qwen/qwen3.5-122b-a10b',
		name: 'Qwen 3.5 122B',
		description: '122B MoE (10B active) — top GPQA Diamond score, vision + video, agent-ready',
		maxTokens: 32768,
		supportsTools: true,
		supportsFunctions: true,
		category: 'code'
	},
	{
		id: 'qwen/qwen3.5-397b-a17b',
		name: 'Qwen 3.5 397B',
		description: 'Flagship 397B MoE with 1M context and native multimodal reasoning',
		maxTokens: 32768,
		supportsTools: true,
		supportsFunctions: true,
		category: 'reasoning'
	},
	{
		id: 'mistralai/mistral-small-4-119b-2603',
		name: 'Mistral Small 4',
		description: '119B MoE (6.5B active), switchable thinking mode, native function calling, 262K context',
		maxTokens: 32768,
		supportsTools: true,
		supportsFunctions: true,
		category: 'reasoning'
	},
	{
		id: 'zai-org/glm-5',
		name: 'GLM-5 744B',
		description: 'ZhipuAI 744B MoE with DeepSeek Sparse Attention — top SWE-bench & BrowseComp scores',
		maxTokens: 32768,
		supportsTools: true,
		supportsFunctions: true,
		category: 'reasoning'
	},
	{
		id: 'openai/gpt-oss-120b',
		name: 'GPT-OSS 120B',
		description: 'OpenAI open-weight 120B MoE reasoning model with configurable reasoning effort',
		maxTokens: 32768,
		supportsTools: true,
		supportsFunctions: true,
		category: 'reasoning'
	},
	{
		id: 'moonshotai/kimi-k2.5',
		name: 'Kimi K2.5',
		description: 'Moonshot AI 1T-param MoE (32B active) — top open-source on Artificial Analysis',
		maxTokens: 32768,
		supportsTools: true,
		supportsFunctions: true,
		category: 'reasoning'
	}
];
