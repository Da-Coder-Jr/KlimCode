import type { NvidiaModel } from '$types/core';

export const AVAILABLE_MODELS: NvidiaModel[] = [
	// ── Best coding models ──
	{
		id: 'qwen/qwen2.5-coder-32b-instruct',
		name: 'Qwen 2.5 Coder 32B',
		description: 'Best coding model — specialized for code generation and editing',
		maxTokens: 16384,
		supportsTools: true,
		supportsFunctions: true,
		category: 'code'
	},
	{
		id: 'deepseek-ai/deepseek-v3.1-terminus',
		name: 'DeepSeek V3.1 Terminus',
		description: 'Hardened for agents & tool chains, 128K context',
		maxTokens: 32768,
		supportsTools: true,
		supportsFunctions: true,
		category: 'code'
	},
	{
		id: 'qwen/qwen3.5-122b-a10b',
		name: 'Qwen 3.5 122B',
		description: '122B MoE — top GPQA Diamond score, agent-ready',
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
		id: 'mistralai/mistral-small-4-119b-2603',
		name: 'Mistral Small 4',
		description: '119B MoE, switchable thinking mode, native function calling, 262K context',
		maxTokens: 32768,
		supportsTools: true,
		supportsFunctions: true,
		category: 'reasoning'
	},
	{
		id: 'zai-org/glm-5',
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
