---
name: walifit-auditor
description: Use when auditing the waliFit repository for bugs, architecture drift, security issues, performance problems, missing tests, data contract mismatches, mobile UX gaps, backend/API risks, or optimization opportunities. This skill defines a practical code-review workflow for Fitapp.
---

# waliFit Auditor

## Audit Stance

Prioritize concrete risks over broad advice. Findings should name the affected file or command, explain the impact, and propose a specific fix. Separate confirmed issues from recommendations.

Do not print secrets from `.env` files. It is acceptable to report that env files exist, are tracked/untracked, or are referenced incorrectly.

## Baseline Context

Read these first:

- `docs/MEMORY.md`
- `docs/ai-coding-rules.md`
- `docs/engineering-principles.md`
- Root `README.md`
- `backend/package.json`
- `react-native/package.json`
- `packages/shared/package.json`

Then inspect only the areas relevant to the audit request.

## Core Audit Checklist

- Repo drift: docs vs actual layout, stale paths, planned systems described as implemented.
- Mobile app: navigation wiring, initial route, loading/error/empty states, offline behavior, hardcoded styling, token usage, duplicated UI patterns, expensive renders.
- API/backend: route validation, auth boundaries, CORS configuration, error handling, logging, schema/contract alignment, build output.
- Database: Prisma schema constraints, missing indexes, nullable fields, cascade behavior, migration readiness, unit conventions.
- Shared package: Zod/schema version alignment, export shape, duplicated contracts.
- Security/privacy: env handling, exposed service keys, unsafe logs, broad CORS, auth bypasses, sensitive health data paths.
- Reliability: absent tests, failing type checks, missing scripts, dev-only routes enabled by default.
- Performance: unnecessary network calls, cache invalidation gaps, heavy screen work, database N+1 risks.

## Validation Commands

Prefer commands that do not mutate external systems:

```bash
git status --short
git ls-files '*env*'
npm --prefix packages/shared run typecheck
npm --prefix backend run typecheck
npm --prefix backend run build
cd react-native && npx tsc --noEmit
```

Use Prisma commands only when the environment is configured for them. Do not run migrations during an audit unless explicitly asked.

## Reporting Format

Lead with findings ordered by severity:

- `High`: likely production breakage, data loss, security/privacy exposure, or app-blocking behavior.
- `Medium`: correctness, maintainability, or performance issue with realistic user or developer impact.
- `Low`: cleanup, consistency, or future-risk item.

For each finding include:

- File/area.
- Evidence.
- Impact.
- Recommended change.

After findings, include:

- Checks run.
- Checks blocked or skipped.
- Short prioritized next steps.
