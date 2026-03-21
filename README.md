# KlimCode

AI coding assistant web app. Chat with AI, let it write code, and create GitHub pull requests — all free.

Powered by [NVIDIA NIM](https://build.nvidia.com) (free AI models).

## What it does

- **Chat** — Ask coding questions, get help debugging, generate code
- **Agent mode** — AI reads your GitHub repo, writes code, and creates pull requests for you
- **GitHub integration** — Connect your GitHub, pick a repo, and the AI creates PRs you can merge
- **Free** — Uses NVIDIA's free AI API. No paid plans.

## Deploy to Vercel (recommended)

1. **Fork this repo** on GitHub

2. **Go to [vercel.com](https://vercel.com)** and import your forked repo

3. **Add a Postgres database**:
   - In your Vercel project, go to **Storage** > **Create Database** > **Postgres**
   - This is free and sets up automatically

4. **Create a GitHub OAuth App** (for the GitHub login/PR features):
   - Go to [github.com/settings/applications/new](https://github.com/settings/applications/new)
   - **Application name**: KlimCode
   - **Homepage URL**: `https://your-app.vercel.app`
   - **Authorization callback URL**: `https://your-app.vercel.app/api/github/callback`
   - Click **Register application**
   - Copy the **Client ID** and generate a **Client Secret**

5. **Add environment variables** in Vercel:
   - Go to your Vercel project > **Settings** > **Environment Variables**
   - Add these:

   | Name | Value |
   |------|-------|
   | `GITHUB_CLIENT_ID` | *(from step 4)* |
   | `GITHUB_CLIENT_SECRET` | *(from step 4)* |
   | `KLIMCODE_SECRET` | *(any random string)* |

   > The `POSTGRES_URL` is set automatically by Vercel when you add the database.

6. **Deploy!** Vercel builds and deploys automatically.

### Wait, what about the NVIDIA API key?

Each user adds their own free NVIDIA API key in the Settings page after they log in.
Get one at [build.nvidia.com](https://build.nvidia.com) — it's free, no credit card needed.

This way the app is free for you to host (no API costs on your end).

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
