# waliFit — Claude Code Plugins: API Keys & Wiring Checklist

Tracker for the 10 plugins installed from `claude-plugins-official` on 2026-05-01.
Each row lists what's needed to actually use the plugin, how to get it, and where it goes.

Install scope: **user** (`~/.claude/plugins/`) — applies to every project for this user, not just waliFit.
List installed plugins anytime with: `claude plugin list`.

---

## TL;DR — what actually needs a credential

| Plugin             | Needs key? | How auth works                                                  |
| ------------------ | ---------- | --------------------------------------------------------------- |
| github             | YES        | `GITHUB_PERSONAL_ACCESS_TOKEN` env var                          |
| supabase           | OAuth      | Sign in to Supabase via MCP on first tool call                  |
| sentry             | OAuth      | Sign in to Sentry via MCP on first tool call                    |
| posthog            | OAuth      | Sign in to PostHog via MCP on first tool call                   |
| prisma             | OAuth      | Sign in to Prisma Data Platform via MCP (only for Prisma-Remote)|
| railway            | CLI login  | `railway login` in shell                                        |
| expo               | CLI login  | `npx expo login` (only when running EAS / publishing)           |
| commit-commands    | none       | Pure slash commands                                             |
| pr-review-toolkit  | none       | Uses GitHub plugin's auth                                       |
| claude-md-management | none      | Local-only                                                      |

OAuth-based MCP plugins prompt automatically the first time Claude Code calls one of their tools — no manual env work needed.

---

## 1. github

**What it does:** Issues, PRs, reviews, search via the official GitHub MCP server.

**Credential:** GitHub Personal Access Token (fine-grained recommended).

**Get it:**
1. https://github.com/settings/personal-access-tokens/new
2. Scope to repos you want Claude to touch (waliFit repo).
3. Permissions: `Contents` (RW), `Pull requests` (RW), `Issues` (RW), `Metadata` (R).

**Wire it up:** export in shell rc (`~/.zshrc`):
```bash
export GITHUB_PERSONAL_ACCESS_TOKEN="ghp_..."
```
Then `source ~/.zshrc` and restart Claude Code.

**Verify:** ask Claude "list my open PRs on the waliFit repo".

---

## 2. supabase

**What it does:** Run SQL, manage auth/storage/RLS on your Supabase projects from Claude.

**Credential:** OAuth — signs into the Supabase account that owns the project.

**Wire it up:** nothing manual. First time Claude calls a Supabase MCP tool, it prints an auth URL → log in to https://app.supabase.com → done.

**NOTE — separate from backend creds:** the MCP login is for *managing* Supabase from Claude. The backend's runtime creds (already in `backend/.env`) are independent:
- `SUPABASE_URL` ✅ filled
- `SUPABASE_SERVICE_ROLE_KEY` ✅ filled
- `SUPABASE_ANON_KEY` ✅ filled
- `SUPABASE_JWT_SECRET` ✅ filled

**Verify:** "list my Supabase projects".

---

## 3. sentry

**What it does:** Read errors, stack traces, issue search from your Sentry org.

**Credential:** OAuth via MCP.

**Get an org first:** if no Sentry org yet → https://sentry.io/signup/ (free tier covers waliFit dev).

**Wire it up:** OAuth on first tool call.

**Also needed for runtime instrumentation (separate from MCP):**
- Mobile DSN: add to `react-native/` via `@sentry/react-native` → `SENTRY_DSN` (public — can ship in app)
- Backend DSN: add to `backend/.env` → `SENTRY_DSN`
- `SENTRY_AUTH_TOKEN` (sourcemaps upload) → only needed in CI/EAS build env, not local

**Verify:** "show me the latest 5 errors in my Sentry project".

---

## 4. posthog

**What it does:** Analytics, feature flags, experiments, error tracking, insights.

**Credential:** OAuth via MCP.

**Wire it up:** OAuth on first tool call.

**Also needed for runtime instrumentation (separate from MCP):**
- `POSTHOG_PROJECT_API_KEY` (public, ships in app) — `react-native/` Vitality Tree / Arena event tracking
- `POSTHOG_HOST` (default `https://us.i.posthog.com`)
- Backend can re-use `POSTHOG_PROJECT_API_KEY` for server-side events.

Add to `backend/.env` and `react-native/.env` when you start instrumenting.

**Verify:** "show my PostHog projects".

---

## 5. prisma

**What it does:** Two MCP servers ship together —
- **Prisma-Local** — runs `prisma mcp` against your local schema. NO auth needed.
- **Prisma-Remote** — Prisma Data Platform / Prisma Postgres provisioning. OAuth.

**Wire it up:**
- Local: nothing — works against `backend/prisma/schema.prisma` immediately.
- Remote: only needed if you provision Prisma Postgres or use Accelerate. Skip for now (we're on Supabase Postgres directly).

**Verify:** "show me my Prisma schema models".

---

## 6. railway

**What it does:** Project setup, deploys, env vars, logs, networking for the Fastify backend.

**Credential:** Railway CLI login.

**Get it:**
```bash
brew install railway      # one-time
railway login             # opens browser
```

Then link the local backend dir to a project:
```bash
cd backend && railway link
```

**Verify:** "show my Railway projects".

---

## 7. expo

**What it does:** Skills for Expo Router, EAS builds, Tailwind setup, debugging RN, etc.

**Credential:** Expo account login (only when publishing / running EAS).

**Get it:**
```bash
cd react-native && npx expo login
```

For EAS builds you'll also want:
- `EXPO_TOKEN` (CI / scripted builds) — generate at https://expo.dev/accounts/[user]/settings/access-tokens

**Verify:** ask "what Expo SDK 54 patterns should I use for this screen?" — most skills are docs/guides and don't need auth.

---

## 8. commit-commands

**What it does:** Adds `/commit`, `/commit-push-pr`, `/clean_gone` slash commands.

**Credential:** none (uses local git + the `github` plugin if pushing/PR'ing).

**Verify:** type `/commit` in chat.

---

## 9. pr-review-toolkit

**What it does:** Multi-agent PR review (comments, tests, error handling, types, code quality, simplification).

**Credential:** none directly — it reads PRs via the `github` plugin, so the github PAT (#1) is the prerequisite.

**Verify:** "review PR #N on the waliFit repo".

---

## 10. claude-md-management

**What it does:** Audits and updates `CLAUDE.md` quality, captures session learnings.

**Credential:** none, fully local.

**Verify:** "audit my CLAUDE.md".

---

## Setup order (fastest path to working)

1. **GitHub PAT** → unblocks `github` + `pr-review-toolkit` (5 min)
2. **Railway login** → so `cd backend && railway link` works when ready to deploy (2 min)
3. **Sentry signup + DSNs** → instrument mobile and backend (15 min, do once before first prod deploy)
4. **PostHog signup + project keys** → ready to instrument when Vitality Tree analytics go in (10 min)
5. **OAuth-only plugins (supabase / sentry / posthog / prisma-remote)** → just trigger them in Claude when needed; auth pops automatically.

---

## Uninstall a plugin if needed

```bash
claude plugin uninstall <name>
```

E.g. `claude plugin uninstall posthog`.
