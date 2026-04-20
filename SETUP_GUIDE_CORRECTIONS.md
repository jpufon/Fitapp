# waliFit Setup Guide — Phase 1 Updates

Copy these corrected config blocks into your setup.
These replace the conflicting versions in the original Setup Guide.

---

## Corrected CLAUDE.md content (replaces Step 1.4)

Paste this exactly into your project CLAUDE.md:

```
## Project: waliFit — Hybrid Athlete OS

## Stack
- Mobile: React Native + Expo SDK 53, TypeScript, NativeWind, gluestack UI
- Backend: Fastify + TypeScript, Prisma ORM
- Database: Supabase PostgreSQL (cloud — NO Docker)
- Cache: Upstash Redis (cloud — NO Docker)
- Auth: Supabase Auth + PKCE
- AI: Claude Sonnet 4.6 (complex), Gemini Flash (volume), Gemini Vision (images)
- Hosting: Railway (backend), EAS (mobile builds)
- Icons: lucide-react-native (no Ionicons)
- Navigation: React Navigation — NO expo-router

## Hard Rules
- NEVER import Anthropic/Google SDKs directly in routes — use src/waliAI/ only
- ALL weights stored in kg — UI converts using unitSystem field
- ALL times stored in seconds — UI formats on display
- Run test:ai before every commit
- MMKV always encrypted via getEncryptionKey()
- NO Docker — Supabase + Upstash are the databases
- NEVER AsyncStorage — always MMKV encrypted wrapper
- Steps data auto-synced from HealthKit/Google Fit — never manual entry
- Dark text (#000000) on primary (#10b981) backgrounds
- Touch targets: 44px min, 48px primary, 56px workout CTAs

## Key Paths
- AI service:    apps/backend/src/waliAI/     ← NOT questai
- Schema:        apps/backend/prisma/schema.prisma
- Shared types:  packages/shared/src/types/
- Design system: .stitch/DESIGN.md
- Tokens:        apps/mobile/theme.ts

## Commands
- pnpm dev:mobile    # start Expo
- pnpm dev:backend   # start Fastify
- pnpm db:migrate    # run Prisma migration against Supabase
- pnpm db:studio     # open Prisma Studio
- pnpm test:ai       # run AI compliance tests

## Compact Instructions
When compacting, focus on code changes and schema state.
```

---

## Corrected folder structure (replaces Step 1.2)

```bash
mkdir -p apps/mobile
mkdir -p apps/backend/src/{routes,waliAI/{providers,prompts},services,middleware,scripts,jobs}
mkdir -p packages/shared/src/{types,schemas}
mkdir -p .claude/commands
mkdir -p .stitch
mkdir -p docs
```

Note: `waliAI` not `questai`. This is the AI service folder name throughout.

---

## Corrected tailwind.config.js (replaces Step 2.3)

```js
module.exports = {
  content: ['./App.{ts,tsx}', './screens/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        background:  '#0a0f0f',
        card:        '#141818',
        secondary:   '#1a1f1f',
        muted:       '#1f2525',
        border:      '#2a2f2f',
        foreground:  '#e5e7eb',
        'muted-foreground': '#9ca3af',
        primary: {
          DEFAULT: '#10b981',
          light:   '#34d399',
          dark:    '#059669',
          fg:      '#000000',
        },
        pillar: {
          steps:     '#10b981',
          protein:   '#f59e0b',
          hydration: '#60a5fa',
        },
        energy:      '#fbbf24',
        blue:        '#60a5fa',
        purple:      '#a78bfa',
        destructive: '#ef4444',
      }
    }
  },
  plugins: []
}
```

---

## Corrected app.json additions (replaces Step 2.3 app.json)

Add these two fields to the existing app.json expo block:
```json
"scheme": "walifit",
"newArchEnabled": true
```

---

## Backend folder structure correction

In Step 1.2 and Step 3, wherever you see `questai` — change it to `waliAI`.

The AI service lives at: `apps/backend/src/waliAI/`

This affects:
- mkdir command in Step 1.2
- CLAUDE.md in Step 1.4
- Any route files that import from questai
- The monorepo diagram
