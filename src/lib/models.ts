import type { NvidiaModel } from '$types/core';

export const AVAILABLE_MODELS: NvidiaModel[] = [
	{
		id: 'meta/llama-3.3-70b-instruct',
		name: 'Llama 3.3 70B Instruct',
		description: 'High-performance open model for complex reasoning and code generation',
		maxTokens: 16384,
		supportsTools: true,
		supportsFunctions: true,
		category: 'code'
	},
	{
		id: 'meta/llama-3.1-405b-instruct',
		name: 'Llama 3.1 405B Instruct',
		description: 'Largest open model, best for complex tasks and tool use',
		maxTokens: 16384,
		supportsTools: true,
		supportsFunctions: true,
		category: 'reasoning'
	},
	{
		id: 'meta/llama-3.1-70b-instruct',
		name: 'Llama 3.1 70B Instruct',
		description: 'Strong all-around model for coding and reasoning',
		maxTokens: 16384,
		supportsTools: true,
		supportsFunctions: true,
		category: 'code'
	},
	{
		id: 'nvidia/llama-3.1-nemotron-70b-instruct',
		name: 'Nemotron 70B',
		description: 'NVIDIA-optimized Llama for high quality instruction following',
		maxTokens: 16384,
		supportsTools: true,
		supportsFunctions: true,
		category: 'reasoning'
	},
	{
		id: 'deepseek-ai/deepseek-r1',
		name: 'DeepSeek R1',
		description: 'Advanced reasoning model with chain-of-thought capability',
		maxTokens: 32768,
		supportsTools: false,
		supportsFunctions: false,
		category: 'reasoning'
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
		id: 'microsoft/phi-4',
		name: 'Phi-4',
		description: 'Efficient small model, fast and capable',
		maxTokens: 16384,
		supportsTools: false,
		supportsFunctions: false,
		category: 'chat'
	},
	{
		id: 'google/gemma-2-27b-it',
		name: 'Gemma 2 27B',
		description: 'Balanced model for chat and instruction tasks',
		maxTokens: 8192,
		supportsTools: false,
		supportsFunctions: false,
		category: 'chat'
	}
];
