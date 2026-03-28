import type { NvidiaModel } from '$types/core';

export const AVAILABLE_MODELS: NvidiaModel[] = [
	// ── Reliable free-tier models ──
	{
		id: 'meta/llama-3.3-70b-instruct',
		name: 'Llama 3.3 70B',
		description: 'Meta Llama 3.3 70B — reliable free tier, great for chat and code',
		maxTokens: 32768,
		supportsTools: true,
		supportsFunctions: true,
		category: 'chat'
	},
	{
		id: 'nvidia/llama-3.1-nemotron-70b-instruct',
		name: 'Nemotron 70B',
		description: 'NVIDIA-tuned Llama 70B — strong reasoning, free tier',
		maxTokens: 32768,
		supportsTools: true,
		supportsFunctions: true,
		category: 'chat'
	},

	// ── Best coding models ──
	{
		id: 'qwen/qwen3-coder-480b-a35b-instruct',
		name: 'Qwen3 Coder 480B',
		description: 'Best coding model — 480B MoE, native function calling, 262K context',
		maxTokens: 32768,
		supportsTools: true,
		supportsFunctions: true,
		category: 'code'
	},
	{
		id: 'qwen/qwen2.5-coder-32b-instruct',
		name: 'Qwen2.5 Coder 32B',
		description: 'Qwen 2.5 Coder 32B — excellent for code, widely available',
		maxTokens: 32768,
		supportsTools: true,
		supportsFunctions: true,
		category: 'code'
	},
	{
		id: 'deepseek-ai/deepseek-v3.1-terminus',
		name: 'DeepSeek V3.1 Terminus',
		description: 'Hardened for agents & tool chains, Think/Non-Think modes, 128K context',
		maxTokens: 32768,
		supportsTools: true,
		supportsFunctions: true,
		category: 'code'
	},

	// ── Reasoning models ──
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
		id: 'deepseek-ai/deepseek-v3.2',
		name: 'DeepSeek V3.2',
		description: 'State-of-the-art 685B MoE — gold-medal IMO/IOI performance',
		maxTokens: 32768,
		supportsTools: true,
		supportsFunctions: true,
		category: 'reasoning'
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
		id: 'qwen/qwen3.5-122b-a10b',
		name: 'Qwen 3.5 122B',
		description: '122B MoE — strong reasoning and coding, agent-ready',
		maxTokens: 32768,
		supportsTools: true,
		supportsFunctions: true,
		category: 'reasoning'
	},
	{
		id: 'mistralai/mistral-small-4-119b-2603',
		name: 'Mistral Small 4',
		description: '119B MoE, switchable thinking mode, native function calling, 262K context',
		maxTokens: 32768,
		supportsTools: true,
		supportsFunctions: true,
		category: 'reasoning'
	},
	{
		id: 'z-ai/glm5',
		name: 'GLM-5 744B',
		description: '744B MoE — top SWE-bench & BrowseComp scores',
		maxTokens: 32768,
		supportsTools: true,
		supportsFunctions: true,
		category: 'reasoning'
	},
	{
		id: 'openai/gpt-oss-120b',
		name: 'GPT-OSS 120B',
		description: 'OpenAI open-weight 120B MoE reasoning model',
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
