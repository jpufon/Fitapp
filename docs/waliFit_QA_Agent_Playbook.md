# waliFit — QA Agent Playbook (V1)

This document turns a generic “mobile QA agency” checklist into something **actionable for waliFit**: Expo/React Native client, Fastify + Prisma backend, Supabase auth, MMKV offline queue, Wali AI (Claude + Gemini), Vitality Tree, WaliRun (GPS), and Arena social.

Use it four ways:

1. **QA architect** — **§2** owns pyramid, gates, environments, tooling bets, observability, budgets, a11y/compliance framework, security posture, test data, and how QA scales with the team.
2. **Human QA** — matrix per screen + device (**§3**, **§5**).
3. **Automation owner** — extend `react-native/scripts/ui-smoke.cjs`, Maestro/Detox, k6 (**§3**, **§9**).
4. **AI QA agent (Cursor / CI)** — paste the [Agent brief](#agent-brief-paste-into-cursor-or-ci) into a rule or job so every run checks the same pillars.

---

## 1. Product context (what “correct” means)

| Area | waliFit specifics |
|------|-------------------|
| Core loop | Train → Log → Progress → Compete → Repeat |
| Tabs | Home, Train, Calendar, Coach, Arena (`App.tsx` + `react-native/README.md`) |
| Stack screens | Auth, OnboardingFlow, ActiveWorkout, WorkoutComplete, NutritionLog, Coach, WaliRun, Settings, Profile, Friends, Badges, TreeDetail, WorkoutBuilder, Dev (strip Dev for store builds) |
| Offline | Workout logging, rest timer, exercise catalog, GPS capture, vitality display, calendar, nutrition — MMKV + `syncQueue` on reconnect; **no lost sets after kill** |
| AI | Wali AI — disclose in Settings; label AI-generated plans/messages in-product where required |
| Monetization | **V1 is 100% free** (roadmap). IAP / restore flows are **future (V2.5+)** — still run “no paywall trap” sanity if any billing UI appears early |

---

## 2. QA architect ownership (top 10)

These are the decisions a **QA architect** owns so quality stays fast at scale. Below each item: what it means for **waliFit** today and what to enforce next.

### 1) Test pyramid and strategy

| Layer | waliFit today | Target ratio (guidance) |
|-------|---------------|-------------------------|
| **Unit** | `walifit-shared` pure logic (plates, scoring helpers); backend Zod parsers | Many, fast — no device |
| **Integration** | Backend + Prisma against Docker sandbox; HTTP contract tests for critical routes | Medium — bounded DB fixtures |
| **Component smoke** | `react-native/scripts/ui-smoke.cjs` (`npm run smoke:ui`) | Small — high-value screens only |
| **E2E (device)** | Not wired yet — Maestro/Detox on **critical path** (auth → home → log set) | **Few** — CI budget killer if overused |
| **Manual** | Interrupts, GPS field runs, store compliance, “does it feel right” | Targeted matrix, not every PR |

**Wrong ratio:** dozens of flaky E2E on every PR. **Right ratio:** typecheck + smoke + a handful of stable device flows on `main` / nightly.

### 2) CI/CD quality gates (enforceable, not wiki)

Define what **blocks merge** vs **warns**:

| Gate | Repo / command | Merge blocker? |
|------|----------------|----------------|
| Typecheck | `Fitapp/backend`: `npm run typecheck`; `react-native`: `tsc` when scripted | Yes |
| Lint | ESLint when introduced for RN + backend | Yes |
| Unit / smoke | `react-native`: `npm run smoke:ui` | Yes, for PRs touching `screens/`, `hooks/`, `lib/` |
| E2E critical | Maestro (future): login + MainTabs | `main` / nightly first |
| A11y | axe/Detox a11y checks (future) | Start as report-only |
| Security | `Fitapp/security/.github/workflows/security.yml` (gitleaks, pnpm audit, CodeQL, waliFit patterns) | Yes — keep green |

**Next step:** add a root or `Fitapp/.github/workflows/ci.yml` that runs `typecheck`, `smoke:ui`, and `secretlint` on PRs (pnpm vs npm: align lockfiles per package manager you standardize on).

### 3) Test environment architecture

| Concern | waliFit approach |
|---------|------------------|
| **Staging vs prod** | `backend` sandbox: `dev:sandbox` + `sandbox/docker-compose.yml` + `sandbox/backend.env` — same migrations as prod; different secrets |
| **Seeding** | Prisma seed or SQL snapshots for integration tests; **synthetic users** with no real PII |
| **Third parties** | **Supabase:** real project for staging only; **Claude/Gemini:** mock or recorded fixtures in CI for plan JSON tests; **no prod keys** in Actions logs |
| **Snapshots** | DB reset between integration test files or transactional tests where Prisma supports it |

### 4) Tooling selection (multi-year bet)

| Need | Recommendation for waliFit | Rationale |
|------|---------------------------|-----------|
| Mobile E2E | **Maestro** first (YAML, Expo-friendly) or Detox if you need deep JS hooks | Speed to first green path |
| Web (Expo web admin later) | **Playwright** if you ship meaningful web surfaces | Cypress fine; Playwright dominates CI |
| Load | **k6** (scriptable, CI-friendly) or `autocannon` for quick API spikes | `/home`, `/calendar`, `/feed` |
| Visual | **Chromatic** or **Percy** once UI stabilizes | Tree + Arena feed are visual-regression candidates |

Document the **chosen stack** in this file when you pick one; avoid running two E2E frameworks.

### 5) Observability + production monitoring

| Signal | Action |
|--------|--------|
| **Errors** | Sentry (or Expo) with release + environment; **hash user ids** in breadcrumbs |
| **Traces** | OpenTelemetry on Fastify for slow routes (optional V1.5+) |
| **Alerts** | Error rate spike, AI job queue depth, 5xx on `/home` |
| **Mindset** | Production is the final test environment — QA architect owns **what** gets alerted, not only pre-release tests |

### 6) Performance and reliability budgets

Align with **§7** (Data & API response-time budgets). Add **product-level** budgets the architect owns:

| Budget | Target | Measurement |
|--------|--------|---------------|
| Cached / warm shell | Interactive Home under **~2s** after warm start | RN perf / manual stopwatch |
| API p95 (key routes) | **under 800 ms** warm (see table in §7) | k6 or server metrics |
| Error rate | **under 1%** of sessions without user-visible failure | Sentry session or backend ratio |
| Cold start | **under ~3s** to first meaningful paint on reference mid-tier Android | Baseline artifact per release |

**When a budget breaks:** block RC or file a P0; allow waive only with written risk acceptance.

### 7) Accessibility + compliance framework

| Area | Automation | Manual |
|------|------------|--------|
| WCAG-oriented | Add eslint-plugin-react-native-a11y or axe where applicable | VoiceOver / TalkBack on primary flows in **§3** (screen map) and **§5** (Pillar B) |
| Store policy | Checklist in **§6** (Pillar C — compliance) | Human sign-off each submission |
| HIG / Material | Tab bar, sheets, modals match platform patterns | iPad + smallest phone |

### 8) Security testing posture

| Practice | waliFit |
|----------|---------|
| **SAST / secrets** | Existing: gitleaks, CodeQL, custom MMKV patterns (`security/.github/workflows/security.yml`) |
| **Dependencies** | pnpm audit in that workflow — extend **npm** workspaces if root uses npm |
| **DAST** | Optional staging pass with OWASP ZAP baseline post-MVP |
| **Pen test** | Before major public launch or when handling payments (V2.5+) |
| **Disclosure** | `SECURITY.md` + monitored security@ inbox |

### 9) Test data + secrets management

| Rule | Detail |
|------|--------|
| Synthetic users | Created only in staging DB; credentials in GitHub **encrypted secrets**, rotated |
| PII | No exports from prod to dev laptops; scrub dumps |
| Isolation | `.env` / EAS secrets per env; CI uses **OIDC** or scoped tokens where possible |
| Mobile | `EXPO_PUBLIC_*` is client-visible — **never** put secrets there |

### 10) QA process and scaling plan

| Stage | Who owns what |
|-------|----------------|
| **Now (small team)** | Engineers run smoke + manual matrix; one **release QA** name on RC checklist |
| **Flaky tests** | **Engineering owns fix or quarantine** within one sprint; no infinite “skip” |
| **Handoff** | Manual finds → ticket with repro → automation candidate for smoke/Maestro |
| **Hire signal** | When E2E + release regression consumes **>1 day/week** of eng time, add dedicated QA or SDET |

---

## 3. Screen → feature → automation map

| Surface | Primary risks | Automated today | Extend with |
|---------|---------------|-----------------|-------------|
| Boot / Auth / Onboarding | Session, timezone, step persistence | Onboarding timezone in `npm run smoke:ui` | Maestro: full onboarding; token refresh after 401 |
| Home + Vitality Tree | Score math, rest-day neutrality, streak | — | E2E pillar toggles; screenshot diff for tree stage |
| Train + WorkoutBuilder | Navigation, templates, intervals/rounds | Smoke: Train → Builder, builder CRUD, modes | More `testID`s on list rows |
| ActiveWorkout + plates | Payload shape, unit system, data loss | Smoke: sets + plate calc | Interrupt + kill during set |
| Calendar | Rest vs training, streak TZ, 2am window | Smoke: rest-day badge | Device TZ change test |
| NutritionLog | Protein/water → tree | — | Quick log + offline queue |
| Coach (Wali AI) | Latency, streaming errors, JSON plan validity | — | Contract tests on plan JSON; AI disclosure copy |
| WaliRun | GPS permission, foreground, battery | — | Field test + handoff 5G/Wi‑Fi; background policy |
| Arena / Friends / Badges | Feed, squads, DMs | — | API integration + Maestro smoke on feed |
| Settings | Delete account, export, legal, notifications | — | Typed DELETE flow; deep link return |
| Notifications / Rest timer | Permission timing (after first workout), background fire | — | Per roadmap: never ask at launch |

**Existing command:** from `Fitapp/react-native`:

```bash
npm install
npm run smoke:ui
```

Component-level smoke (mocked RN) covers Train, WorkoutBuilder, ActiveWorkout, plates, onboarding timezone, calendar rest day — keep this **green on every PR** that touches those areas.

---

## 4. Pillar A — Technical health (waliFit)

### Performance

- **RAM / process:** Track Hermes heap + native footprint on mid Android after opening Home → ActiveWorkout → WaliRun (no universal “under 100MB” rule for all devices; compare build-to-build regression).
- **Battery:** Long **WaliRun** session + screen on; note GPS + wake locks. Compare to baseline Strava-like session.
- **UI thread:** Scroll Train exercise list, Arena feed, calendar month view — target **stable 60fps** on reference devices (Reanimated worklets already in stack).

### Network resilience

- **Handoff:** Start workout on cellular, toggle Wi‑Fi mid-set; verify `apiMutate` → `syncQueue` and no duplicate ghost sets after sync.
- **Dead zone:** Airplane mode during ActiveWorkout and NutritionLog; queue drains on reconnect; Vitality reads cached values.
- **401 path:** Force expired token; verify refresh + single retry (`lib/api.ts`).

### Crash / stress

- Rapid tab switching while queries loading.
- Open WorkoutBuilder with large template list (when seeded).
- Kill app during rest timer and mid-workout; relaunch — **must resume or safely reconcile** per product rules.

---

## 5. Pillar B — UI/UX & visuals

- **Touch targets:** Primary actions (log set, start run, save nutrition) ≥ 44×44 pt effective area; tab bar items readable on smallest supported phone.
- **Screen matrix:** Smallest Android phone (e.g. narrow width class) + **largest iPad** (Arena two-column assumptions, calendar month grid).
- **Design system:** Tokens in `theme.ts` / NativeWind — no random hex drift on Coach or Tree.
- **Accessibility:** VoiceOver / TalkBack on Auth, Home (tree description), ActiveWorkout (set fields announced), Settings legal links; focus order in modals (rest sheet, exercise picker).

---

## 6. Pillar C — Compliance (2026 store posture)

| Check | waliFit action |
|-------|----------------|
| Privacy / Data Safety | Map actual collection: health-ish data (workouts, runs, nutrition), location **when WaliRun active**, social handles, AI prompts. Labels must match code + backend retention. |
| Permissions | Location: **foreground run only**; photos: multimodal import; notifications: post–first-workout. Reject “ask everything at launch.” |
| Account deletion / export | Settings: type DELETE, soft-delete window, GDPR export — **must match shipped UI**. |
| AI disclosure | Settings + any coach surface: clear that content is AI-generated / model-backed where required. |
| IAP (future) | When premium ships: restore purchases, exit without purchase, no dead-end modals. **V1:** confirm no accidental StoreKit/RevenueCat hooks in release build. |

---

## 7. Data & API response-time budgets (SLOs)

Measure **p95** from device or `curl` with prod-like latency. Adjust per environment; use **regression** more than absolute numbers.

| Client hook / area | Typical route | p95 target (warm) | Notes |
|--------------------|---------------|-------------------|--------|
| Home shell | `GET /home` | under 800 ms p95 | Vitality + pillars + today workout |
| Train | `GET /workouts/today`, `GET /workouts` | under 800 ms p95 | Cache + skeleton first paint |
| Calendar range | `GET /calendar` | under 1.2 s p95 | Wider ranges cost more — paginate |
| Arena | `GET /feed`, squads, leaderboard | under 1 s p95 | Watch N+1 on backend |
| Exercise catalog | `GET /exercises/catalog`, deltas | First sync may be slow; **subsequent** under 400 ms from MMKV |
| AI plan job | async job + notification | UX: show pending; **no silent hang** |

**Screen perceived latency:** Time from tap to interactive UI — log in dev builds or React Native perf monitor; fail builds if Home cold start regresses beyond agreed ms vs baseline artifact.

---

## 8. Ten-point checklist — waliFit edition

1. **Environment mirroring** — Sandbox: `backend` `dev:sandbox` + `sandbox/docker-compose.yml`; same Prisma migrations as prod; **never** prod Supabase keys in CI logs.
2. **Smoke testing** — `npm run smoke:ui` + **device smoke:** app opens past Boot, reaches MainTabs with test account.
3. **Cross-platform parity** — Same flows on iOS/Android for Auth, ActiveWorkout, Calendar streak copy, Tree stage art.
4. **Interrupt testing** — Incoming call / switch to camera during ActiveWorkout and WaliRun; app resumes without corrupted set rows.
5. **Data transparency** — Permission prompts match real usage (location, photos, notifications).
6. **AI disclosure** — Any new coach UI reviewed for labels; Program Architect output identifiable as AI-assisted where policy requires.
7. **Regression suite** — Nightly: `smoke:ui` + (when added) Maestro critical path + backend `npm run typecheck` / minimal HTTP contract suite.
8. **Beta lab** — TestFlight / Play internal: hybrid athletes + one “low-spec Android” tester.
9. **Metadata validation** — Store screenshots = actual tree palette, dark theme, tabs; no features shown that V1 does not ship.
10. **RC sign-off** — **Bug density by module:** Auth, Sync, Tree, AI, Run, Arena — block release if P0 open in Auth/Sync/Tree. Respect sprint **Vitality gate** (Sprint 3) as permanent precedent for any cross-pillar feature.

---

## 9. Tooling roadmap (make the “agent” real)

| Layer | Tool | Next step |
|-------|------|-----------|
| Component smoke | `scripts/ui-smoke.cjs` | Add cases for NutritionLog quick-add, Settings delete flow stubs |
| E2E device | [Maestro](https://maestro.mobile.dev/) or Detox | YAML flows per tab; run on CI Mac + Android runner |
| API load | k6 or `autocannon` against staging | `/home`, `/calendar`, `/feed` at concurrent users |
| Backend | Fastify routes | Golden JSON tests for plan shape from AI worker |
| Observability | Sentry / Expo | Symbolicate; tag release + `userId` hash only |

---

## Agent brief (paste into Cursor or CI)

You are the **waliFit QA agent**. For every change or release candidate:

1. Run **`npm run smoke:ui`** in `Fitapp/react-native` after `npm install`. If it fails, stop and report the failing scenario.
2. Check **diff against** `docs/waliFit_Roadmap.md` and `docs/waliFit_V1_Sprint_Plan.md` for permission, AI, offline, or tree logic.
3. For UI changes, list **affected screens** from `App.tsx` `RootStackParamList` and verify **touch targets**, **loading/error/empty** states, and **accessibility** for primary path.
4. For API changes, identify hooks in `react-native/README.md` table and note **latency / cache / offline** behavior.
5. Flag **compliance** gaps: Data Safety mismatch, missing AI disclosure, onboarding permission timing, IAP dead-ends (when billing exists).
6. If the change touches **CI gates, secrets, staging data, or observability**, cross-check **§2** (QA architect ownership) for gaps vs written policy.
7. Output a **short report**: Pass/Fail smoke, manual matrix items still required, and **p95 concern** if any network path was touched.

---

## Document control

- **Owner:** Engineering + one designated release QA.
- **Review:** Before TestFlight / Play internal promotion and again at RC.
- **Related:** `docs/waliFit_Roadmap.md`, `docs/waliFit_V1_Sprint_Plan.md`, `react-native/README.md`.

### Sprint enforcement (delivery)

Every sprint close-out must run the **Sprint delivery QA gate** in `docs/waliFit_V1_Sprint_Plan.md` (table + sign-off line). That gate is how §2–§8 are **enforced on a fixed cadence**, not only at launch. If CI is added later (typecheck + `smoke:ui` on PR), wire those checks to the same rows 1–3 in the gate table.
