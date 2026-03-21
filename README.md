# KlimCode

AI coding assistant web app. Chat with AI, let it write code, and create GitHub pull requests — all free.

Powered by [NVIDIA NIM](https://build.nvidia.com) (free AI models).

## What it does

- **Chat** — Ask coding questions, get help debugging, generate code
- **Agent mode** — AI reads your GitHub repo, writes code, and creates pull requests for you
- **GitHub integration** — Connect your GitHub, pick a repo, and the AI creates PRs you can merge
- **Free** — Uses NVIDIA's free AI API. No paid plans.


### Wait, what about the NVIDIA API key?

Each user adds their own free NVIDIA API key in the Settings page after they log in.
Get one at [build.nvidia.com](https://build.nvidia.com) — it's free, no credit card needed.

## Run locally

```bash
git clone https://github.com/Da-Coder-Jr/KlimCode.git
cd KlimCode
npm install
npm run klimcode
```

For local dev you'll need a Postgres database. Set `POSTGRES_URL` in a `.env` file.

## How the AI agent creates PRs

1. You start an **Agent** conversation and connect a GitHub repo
2. Tell the AI what you want ("add dark mode to the settings page")
3. The AI reads your repo files via the GitHub API
4. It writes new code and edits files
5. When done, it creates a pull request on your repo
6. You review the PR and merge it from the KlimCode UI (or on GitHub)

## Tech stack

- **Frontend**: SvelteKit + Tailwind CSS
- **Backend**: SvelteKit API routes
- **Database**: Vercel Postgres
- **AI**: NVIDIA NIM API (free tier)
- **Auth**: GitHub OAuth + password accounts
- **Hosting**: Vercel (free tier)

## Credits

Architecture inspired by [Open WebUI](https://github.com/open-webui/open-webui) and [HuggingFace Chat UI](https://github.com/huggingface/chat-ui).

## License

MIT
