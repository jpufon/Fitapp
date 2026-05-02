# waliFit — Product & Technical Decisions Log

Every decision that was debated and resolved. Claude Code reads this to avoid
re-opening closed questions. Add new decisions at the top.

---

## 2026-04-18 — Full document reconciliation

**All four documents compared and conflicts resolved:**

### Colors — zip file is the truth (v1) → superseded by production palette v3.0
Originally emerald `#10b981`. Replaced by teal `#0BBFBD` per
`docs/waliFit_Design_Tokens.md`, then refined into the v3.0 production
fitness palette with structured token groups.

Final palette (v3.0):
- Background:      `#0a0f0f`
- Background alt:  `#050A0A`
- Surface:         `#161b1b`
- Popover:         `#1a1f1f`
- Border:          `#2f3636`
- Primary:         `#0BBFBD` (teal)
- Primary dark:    `#0D6D6B`
- Primary light:   `#3FD9D7`
- Text on primary: `#002f2f` (never white on teal)
- Steps:           `#0BBFBD`
- Protein/Energy:  `#f59e0b`
- Hydration:       `#60a5fa`
- Growth:          `#84cc16`
- Accent blue:     `#3b82f6`
- Accent purple:   `#8b5cf6`
- Destructive:     `#ef4444`
- Foreground:      `#ececec`
- Badge tiers:     Iron `#6b7280` · Bronze `#c2410c` · Silver `#94a3b8` · Gold `#fbbf24` · Legendary `#a78bfa`

### Bottom navigation tabs — V1 Brief wins
Tabs: **Home · Train · Calendar · Coach · Arena** (in this order)
- Run is inside the Train tab (not its own tab)
- AI tab is renamed Coach (more human)
- Calendar is tab 3
Source: V1 Frontend Brief v2 (most recent implementation spec)

### AI service folder — waliAI
Path: `apps/backend/src/waliAI/` — NOT `questai`
Source: Roadmap and V1 Brief both say waliAI. Setup Guide had a typo (questai). Fixed.

### Vitality Tree states — 6 states merged from both documents
1. Wilted (0–15)
2. Recovering (16–35)
3. Sprout (36–55) — new users start here
4. Growing (56–75)
5. Thriving (76–90)
6. Full Vitality (91–100)
Source: Merged roadmap (5 states) and brief (6 states) into one authoritative list.

### Vitality Tree pillars — steps replaces workout completion
- Steps: 40% (auto from Apple Health / Google Fit)
- Protein: 30% (manual)
- Hydration: 30% (manual)
Workout completion was the old pillar. Removed. The tree reflects how you
live, not whether you hit the gym. Rest days still produce a healthy tree.

### Navigation library — React Navigation only
expo-router removed. `"main": "App.tsx"` in package.json.
Source: V1 Brief approved stack. expo-router was a Stitch artifact.

### Icons — lucide-react-native
Ionicons removed. All icons use lucide-react-native.
Source: V1 Brief approved stack.

### Monetization — V2.5
V1 and V2 are 100% free. Paywall introduced at V2.5 only.
The roadmap strategy table had a typo saying V2 — the pricing section (more
detailed, more deliberate) says V2.5. The detailed section wins.

### Design tool — Figma Make
Stitch was explored but Figma Make + Figma MCP is the correct workflow.
Founder generates screens in Figma Make. Figma MCP feeds designs to Claude Code.
No Stitch → React Native conversion needed.

---

## 2026-04-15 — Tree simplified (no Garden)
Removed the full Vitality Garden concept. The tree is a health mirror on
the Home screen only. No biomes in V1, no species selection, no seed economy,
no Squad Forests in V1.

Rationale: simpler is more emotional. A mirror is stronger than a game mechanic.
Biomes and Squad Forests move to V2.

---

## 2026-04-15 — Steps replaces workout completion as pillar
Tree reflects how you live, not whether you hit the gym. Someone on a rest day
who ate well, stayed hydrated, and walked 8k steps has a healthy tree.
Keeps the tree alive on rest days. Prevents the guilt spiral.

---

## 2026-04-15 — No Docker
Supabase + Upstash handle all database and cache needs in the cloud.
No docker-compose.yml. No local Postgres or Redis.

---

## Standing decisions

### Units
- DB stores weight in kg always. UI converts via displayWeight()
- DB stores duration in seconds always. UI formats on display
- Default: detect from device locale (US → lbs, elsewhere → kg)

### Offline
- Every mutation queues locally if offline
- Sync on reconnect via queueOrSend()
- Last-write-wins for V1 conflict resolution (documented, acceptable)

### Auth
- Supabase Auth + PKCE
- Tokens in iOS Keychain / Android Keystore via MMKV + expo-secure-store
- Never AsyncStorage for auth or sensitive data

### Steps source
- iOS: Apple Health via expo-health or react-native-health
- Android: Google Fit / Health Connect
- Steps sync passively — user never enters steps manually
- Permission priming screen required before showing OS prompt

### Notification permission timing
- Request AFTER first completed workout — never at app launch
- Priming screen gates the OS prompt

### Account deletion
- Hard requirement for both App Store and Play Store
- Two-step confirmation with typed 'DELETE'
- 30-day soft delete pipeline via BullMQ

### Apple Sign In
- Mandatory if Google Sign In is offered (App Store requirement)
- Both must be implemented

### AI disclaimer
- Shown in Settings AND as a banner in the Coach tab
- Required before any AI feature is used (AI consent modal)
- Since Nov 2025 App Store requirement
