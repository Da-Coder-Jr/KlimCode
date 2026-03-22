# KlimCode

AI coding assistant web app. Chat with AI, let it write code, and create GitHub pull requests — all free.

Powered by [NVIDIA NIM](https://build.nvidia.com) (free AI models).

## What it does

- **Chat** — Ask coding questions, get help debugging, generate code
- **Agent mode** — AI reads your GitHub repo, writes code, and creates pull requests for you
- **GitHub integration** — Connect your GitHub, pick a repo, and the AI creates PRs you can merge
- **Dark & Light mode** — Clean, polished UI with full theme support
- **Free** — Uses NVIDIA's free AI API. No paid plans.

### Wait, what about the NVIDIA API key?

Each user adds their own free NVIDIA API key in the Settings page after they log in.
Get one at [build.nvidia.com](https://build.nvidia.com) — it's free, no credit card needed.

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
- **Auth**: GitHub OAuth + password accounts (bcrypt-hashed)
- **Hosting**: Vercel (free tier)

## Security

KlimCode is open source and takes security seriously:

- **Password hashing**: All passwords are hashed with bcrypt (12 salt rounds)
- **Session management**: HttpOnly, SameSite, Secure cookies with 30-day expiration
- **XSS protection**: All user-generated HTML is sanitized with DOMPurify before rendering
- **CSRF protection**: GitHub OAuth uses state parameter validation
- **Input validation**: Strict username/password validation with constant-time comparison
- **API keys**: Stored server-side only, never exposed to the client
- **Environment variables**: All secrets stored in environment variables, never committed to code
- **Content Security**: Markdown rendered through marked + highlight.js with sanitization

### Reporting vulnerabilities

If you find a security issue, please open an issue on GitHub or contact the maintainers directly.

## Local development

> **Note**: Local development support may be added in a future release. Currently, KlimCode is designed to run on Vercel.

## Credits

Architecture inspired by [Open WebUI](https://github.com/open-webui/open-webui) and [HuggingFace Chat UI](https://github.com/huggingface/chat-ui).

## License

MIT
