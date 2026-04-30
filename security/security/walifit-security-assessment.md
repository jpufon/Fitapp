# waliFit — Security Analysis & Threat Model

**Read this first.** It identifies what's specific to *your* app — beyond the generic MASVS checklist — and prioritizes the work.

---

## What waliFit actually is, from a security lens

You're building a **mobile health & fitness platform** that:

- Stores **health data** (body weight, body measurements, injuries, RPE, sleep signals, HRV in V2.5)
- Stores **menstrual cycle data** in V2 (Feature 23) — extremely sensitive in 2026, US regulatory minefield post-Dobbs
- Captures **GPS routes** (run polylines) — reveals home/work locations
- Stores **progress photos** in V2 — biometric/intimate imagery
- Sends **user health context to third-party AI** (Anthropic + Google) on every chat
- Hosts **social features** with DMs and group messaging
- Integrates with **Apple HealthKit / Google Fit** — Apple scrutinizes these apps heavily
- Has **deep linking** for invites
- Plans to **collect interaction logs for ML fine-tuning** (Section 14 of architecture)

This isn't a fintech app, but it's not a calculator either. **You sit in a heightened-privacy category** and reviewers will treat you that way. Plan accordingly.

---

## Threat model — top 12 risks, prioritized

Ranked by `likelihood × impact`. The first 4 are the ones I'd lose sleep over if this were my app.

### 🔴 Critical

**1. AI context leakage to third parties**
Every Wali AI call sends recent workouts, body weight, injuries, and (in V2) cycle phase to Anthropic and Google. If you're not explicit about this with users, it's a privacy disclosure failure. Reviewers will ask. Mitigations are in `code/ai-pii-stripper.ts`.

**2. GPS route privacy (Strava 2018 problem)**
Run polylines reveal home address, work, daily patterns. Strava exposed US military bases by aggregating "anonymous" running data. Without privacy zones around start/end points and a default "private" share setting, you'll repeat that mistake. Mitigations in `code/gps-privacy-zones.ts`.

**3. Cycle tracking is a regulatory minefield (V2)**
Feature 23 (Female Training Considerations) collects menstrual cycle data. Several US states have subpoenaed this data from period-tracking apps. Even though you're a fitness app, the same legal mechanisms apply. Required treatment: explicit opt-in, encrypted-at-rest with a user-derived key (not just app-managed), never include in AI context unless user re-consents per session, never sync to backend unencrypted, ability to delete with cryptographic erasure.

**4. MMKV is not encrypted by default**
Your architecture doc says "MMKV encrypted wrapper only — never raw MMKV" but the example code in Section 6.2 uses `new MMKV()` with no encryption key. Easy to miss. If a phone is lost/stolen and unlocked, a forensic image will read MMKV as plaintext. See `code/mmkv-encrypted.ts`.

### 🟠 High

**5. Supabase JWT secret rotation**
You correctly use JWT verification in middleware (good — portable, not locked to Supabase RLS). But if `JWT_SECRET` leaks, every session is forgeable. Need rotation runbook + short-lived access tokens + refresh token revocation.

**6. WebSocket auth bypass**
Socket.io is mentioned for plan-ready notifications and badge reveals. Default Socket.io has no auth. Need explicit JWT validation on connection + per-user room enforcement.

**7. Webhook signature verification (V2.5)**
Stripe + RevenueCat webhooks credit subscriptions. Without signature verification, anyone can POST a forged "subscription_active" event and unlock premium features. See `code/webhook-verification.ts`.

**8. Username enumeration / friend search abuse**
Username search for friend discovery (Feature 8.5) lets an attacker enumerate all users. Need rate limiting and ideally fuzzy partial-match only after the requester has ≥3 chars typed.

**9. Deep link squad-join replay**
`walifit://join/SQUAD_CODE` and `https://walifit.app/join/...` — if join codes don't expire and aren't rate-limited, someone can scrape codes and auto-join squads. Squad codes should be: long, random, optionally time-limited, revocable by squad admin.

### 🟡 Medium

**10. Push notification content on lock screen**
Notifications like "PR: 100kg squat — new all-time best" or DM previews can leak on a locked screen. Use `mutable_content` and strip sensitive details by default; let users opt in to detailed previews.

**11. Onboarding image import (Gemini Vision)**
Users upload screenshots from Hevy/MyFitnessPal/Strava. These may contain PII beyond what you want — names, friend lists, location data in EXIF. Process in memory only (you do — good) AND strip EXIF before sending.

**12. AI training data collection consent**
Section 14 plans to log every interaction for future fine-tuning. This is fine *if and only if* it's explicit opt-in with a clear "your conversations may be used to improve Wali AI" notice. Default to opt-out.

---

## Compliance gates specific to waliFit

| Requirement | Why it applies | What to do |
|---|---|---|
| **Apple App Review HealthKit** | You read steps via HealthKit | Justify in `Info.plist`, only request data you actually use, don't send HealthKit data to third parties without explicit consent. **This is the #1 reason fitness apps get rejected.** |
| **Apple AI disclosure (since Nov 2025)** | You send user data to Anthropic + Google | Already planned (Architecture §15.4) — verify the disclosure screen ships in V1, not later |
| **In-app account deletion** | Apple requirement | Already planned (§11.3) — verify it ships in Phase 8 |
| **GDPR data export** | EU users | Already planned (`/api/v1/users/me/export`) — verify it includes everything: workouts, AI logs, messages, photos |
| **GDPR right to erasure** | EU users | 30-day soft delete is good; need to also propagate deletion to Anthropic / Google AI training data exclusion lists |
| **Play Store Data Safety form** | Required | Must declare: location (GPS), health/fitness, photos, messages, contacts (if friend import), email |
| **Play Store sensitive permissions** | Background location (V2) | `ACCESS_BACKGROUND_LOCATION` requires permission declaration form with specific use case |
| **Children's data** | Hybrid athletes — could be 13–17 | Either gate at 18+ or build proper teen flow. Don't just say "13+" without enforcement |

---

## What's already done well in your architecture

Credit where it's due — these are not given:

- ✅ Supabase Auth with **portable JWT pattern** (you can swap providers without rewriting auth logic — §13.2)
- ✅ **Versioned API** (`/api/v1/`) so breaking changes don't strand old clients
- ✅ **Soft delete + 30-day hard delete** pipeline already planned
- ✅ **PP/ToS version tracking** so policy updates re-prompt acceptance
- ✅ **AI compliance test harness** (§12.2) — most apps don't think to do this
- ✅ **AI rate limiting per user with tier-based limits** (§11.2)
- ✅ **PII hashing** in interaction logs (`hashUserId`)
- ✅ **AI processing disclosure screen** planned (§15.4)
- ✅ **Permission timing** is correct: location at "Start Run", push after first workout, both deferred from launch
- ✅ **Plan vs actual immutability** (`plannedData` immutable, edits go to `modifiedFields`)
- ✅ **Idempotent badge awarding** with `awardedAt = workout.completedAt` for offline sync edge case

---

## How this maps to your build phases

Don't bolt security on at the end. Each of your existing 14 phases has security work embedded:

| Build phase | Security work to add (no extra time on critical path) |
|---|---|
| **1 — Foundation** | JWT middleware (portable), MMKV encryption key, secrets in env (not code), gitleaks pre-commit |
| **2 — Training Core** | Input validation on every workout endpoint (Zod), no logging of PII |
| **3 — Calendar + Plans** | Rate limit on plan generation (it's expensive — abuse vector) |
| **4 — Simple Nutrition** | Nothing extra — low-risk surface |
| **5 — Vitality System** | Nothing extra |
| **6 — Wali AI V1** | **AI PII stripper before context injection.** General rate limit + AI-specific rate limit (you've planned the second; add the first) |
| **7 — WaliRun (GPS)** | **GPS privacy zones, route share defaults to private, EXIF strip on any image.** Highest-risk phase |
| **8 — Settings + Account** | Verify in-app deletion works end-to-end. Verify data export is complete |
| **9 — Legal** | PP must mention: AI processors (Anthropic + Google), HealthKit/Google Fit, GPS retention period, AI training opt-out |
| **10 — Offline + Notifications** | Notification content scrubbed for lock screens. Offline queue can't store auth tokens unencrypted |
| **11 — Social** | **Squad code generation, friend search rate limit, message content storage encrypted at rest, WebSocket JWT auth** |
| **12 — Rest Timer** | Nothing extra — local only |
| **13 — OTA + Polish** | EAS Update signing keys protected, OTA channel access controlled |
| **14 — QA + Launch** | **MobSF on release build, MITM test, AI compliance harness pass, Play Data Safety form completed accurately** |

---

## Recommended reading order in this folder

1. **This file** — you've read it ✓
2. **`checklists/walifit-specific.md`** — concrete checkbox list for your app
3. **`code/`** — drop-in TypeScript snippets for the 5 highest-risk items
4. **`README.md`** — the generic phase-by-phase roadmap (still applies)
5. **`checklists/masvs-l1.md`** — generic MASVS baseline
6. **`checklists/ios-submission.md` / `android-submission.md`** — submission gates

---

## Honest expectation-setting

If you do everything in this folder:
- You will pass App Store review (high confidence) for V1
- You will pass Play Store review (high confidence) for V1
- You will be in a defensible posture for an enterprise/B2B audit later
- You will **not** be HIPAA-compliant — that requires backend infrastructure and BAAs you don't have. Don't claim it. Don't market to clinics, hospitals, or insurance.
- You will **not** be ready for SOC 2 — that's a 6-month process. Plan it for the year after launch if a B2B contract demands it.

The gap between "passes app review" and "passes a real security audit" is large. You'll be in the first bucket. That's the right bar for V1.
