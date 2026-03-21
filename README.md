# KlimCode

**AI Agent Web UI powered by NVIDIA NIM**

KlimCode is a self-hosted AI coding assistant with autonomous agent capabilities. Chat with AI models, let the agent write code, run commands in a sandboxed environment, and create GitHub pull requests — all from a beautiful web interface.

## Features

- **AI Chat** — Conversational coding assistant powered by NVIDIA NIM models (Llama 3.3, Nemotron, DeepSeek R1, Qwen Coder, and more)
- **Agent Mode** — Autonomous AI agent that can read/write files, run commands, search codebases, and create pull requests
- **GitHub Integration** — Connect your GitHub account to browse repos, draft PRs, review diffs, and merge changes directly from the UI
- **Sandboxed Execution** — Agent actions run in isolated sandboxes with safety guardrails
- **Streaming Responses** — Real-time SSE streaming with live agent activity panel
- **100% Free** — Uses NVIDIA's free NIM API tier. No paid subscriptions required.

## Quick Start

### Prerequisites

- **Node.js 20+**
- **NVIDIA NIM API Key** — Get one free at [build.nvidia.com](https://build.nvidia.com)

### Install & Run

```bash
# Clone the repository
git clone https://github.com/Da-Coder-Jr/KlimCode.git
cd KlimCode

# Install dependencies
npm install

# Copy environment file and add your NVIDIA API key
cp .env.example .env
# Edit .env and set KLIMCODE_NVIDIA_API_KEY=nvapi-xxxxx

# Start KlimCode
npm run klimcode
# or
node bin/klimcode.js
```

KlimCode will start at [http://localhost:7700](http://localhost:7700).

### Docker

```bash
# Using docker compose
docker compose up -d

# Or build and run directly
docker build -t klimcode .
docker run -p 7700:7700 -v klimcode-data:/app/data -e KLIMCODE_NVIDIA_API_KEY=nvapi-xxx klimcode
```

## Architecture

```
KlimCode
├── bin/klimcode.js              # CLI entry point
├── src/
│   ├── lib/
│   │   ├── components/          # Svelte UI components
│   │   │   ├── chat/            # Chat window, messages, input
│   │   │   ├── agent/           # Agent steps, diff viewer, file explorer
│   │   │   ├── github/          # GitHub connect, repo selector, PR list
│   │   │   ├── settings/        # Settings panel
│   │   │   ├── auth/            # Login/register forms
│   │   │   └── layout/          # Sidebar, header, modal
│   │   ├── server/
│   │   │   ├── ai/              # NVIDIA NIM API client, streaming
│   │   │   ├── agent/           # Sandbox, tool execution, agent loop
│   │   │   ├── auth/            # Session management, GitHub OAuth
│   │   │   ├── db/              # SQLite database, queries
│   │   │   └── github/          # GitHub API client, webhooks
│   │   ├── stores/              # Svelte stores (chat, settings, auth, github)
│   │   ├── types/               # TypeScript type definitions
│   │   └── utils/               # Markdown rendering, formatting
│   └── routes/
│       ├── api/                 # REST API endpoints
│       │   ├── auth/            # Register, login, logout, session
│       │   ├── chat/            # Chat completion streaming
│       │   ├── agent/           # Agent execution streaming
│       │   ├── conversations/   # CRUD for conversations and messages
│       │   ├── github/          # OAuth, repos, PRs, webhooks, merge
│       │   ├── models/          # Available NVIDIA models
│       │   └── settings/        # User settings, API key management
│       ├── chat/[id]/           # Conversation view
│       ├── github/              # GitHub management page
│       └── settings/            # Settings page
├── static/                      # SVG logo, favicon
├── Dockerfile                   # Production container
└── docker-compose.yml           # Docker Compose config
```

## Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `KLIMCODE_NVIDIA_API_KEY` | Yes | Your NVIDIA NIM API key from [build.nvidia.com](https://build.nvidia.com) |
| `KLIMCODE_PORT` | No | Server port (default: 7700) |
| `KLIMCODE_HOST` | No | Bind address (default: 0.0.0.0) |
| `KLIMCODE_SECRET` | No | Session encryption secret |
| `KLIMCODE_GITHUB_CLIENT_ID` | No | GitHub OAuth App client ID |
| `KLIMCODE_GITHUB_CLIENT_SECRET` | No | GitHub OAuth App client secret |
| `KLIMCODE_GITHUB_WEBHOOK_SECRET` | No | GitHub webhook verification secret |
| `KLIMCODE_DB_PATH` | No | SQLite database path (default: ./data/klimcode.db) |
| `KLIMCODE_SANDBOX_DIR` | No | Agent sandbox directory (default: ./data/sandboxes) |

### GitHub Integration Setup

1. Create a [GitHub OAuth App](https://github.com/settings/developers)
2. Set the callback URL to `http://localhost:7700/api/github/callback`
3. Add the client ID and secret to your `.env`
4. Optionally configure a webhook pointing to `http://your-host:7700/api/github/webhook`

## Available Models

All models are available for free through NVIDIA's NIM API:

| Model | Category | Best For |
|-------|----------|----------|
| Llama 3.3 70B | Code | Code generation, complex reasoning |
| Llama 3.1 405B | Reasoning | Complex multi-step tasks |
| Nemotron 70B | Reasoning | High-quality instruction following |
| DeepSeek R1 | Reasoning | Chain-of-thought reasoning |
| Qwen 2.5 Coder 32B | Code | Specialized code generation |
| Phi-4 | Chat | Fast, efficient general tasks |
| Gemma 2 27B | Chat | Balanced chat conversations |

## How the Agent Works

1. **User sends a request** — "Add input validation to the login form"
2. **Agent plans** — Thinks through the approach step by step
3. **Agent executes** — Reads files, writes code, runs tests in a sandbox
4. **Agent reports** — Shows each step in real-time with the activity panel
5. **PR creation** — When ready, the agent drafts a GitHub PR with the changes
6. **User merges** — Review the diff and merge from the KlimCode UI

## Tech Stack

- **Frontend**: SvelteKit, Tailwind CSS
- **Backend**: SvelteKit API routes, SQLite (better-sqlite3)
- **AI**: NVIDIA NIM API (OpenAI-compatible)
- **GitHub**: Octokit, OAuth, Webhooks
- **Deployment**: Docker, Node.js

## Credits

KlimCode's architecture draws inspiration from:
- [Open WebUI](https://github.com/open-webui/open-webui) — Self-hosted AI interface
- [HuggingFace Chat UI](https://github.com/huggingface/chat-ui) — Open-source chat interface

## License

MIT
