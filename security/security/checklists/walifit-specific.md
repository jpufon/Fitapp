# waliFit Security Checklist (App-Specific)

The MASVS-L1 list applies to every mobile app. **This list is the stuff that's specific to waliFit.** Tick these off in addition to MASVS-L1.

---

## Phase 1 — Foundation

- [ ] `JWT_SECRET` is ≥ 32 random bytes, set in Railway env (not in repo).
- [ ] JWT verification uses `jsonwebtoken` directly — **never** `supabase.auth.getUser()` in middleware (locks you to Supabase forever — see `code/jwt-middleware.ts`).
- [ ] Access token TTL ≤ 1 hour. Refresh token TTL ≤ 30 days.
- [ ] Refresh token revocation works on logout (verify in test).
- [ ] MMKV instance is encrypted with a per-install key from Keychain/Keystore (see `code/mmkv-encrypted.ts`).
- [ ] No secrets in `apps/mobile/app.json` `extra` field — anything bundled is readable.
- [ ] `EXPO_PUBLIC_*` env vars contain only public data (API base URL is fine; API keys are not).
- [ ] Server-only secrets (`ANTHROPIC_API_KEY`, `GEMINI_API_KEY`, `FIREBASE_SERVICE_ACCOUNT`, `STRIPE_SECRET_KEY`) live only on Railway.
- [ ] `gitleaks` runs in pre-commit hook AND CI.
- [ ] GitHub Dependabot + secret scanning + push protection all enabled.

## Phase 2 — Training Core

- [ ] Every Fastify route has a Zod schema on `body`, `params`, AND `querystring`.
- [ ] Workout log mutations check `userId === request.user.id` server-side — never trust the body.
- [ ] No `console.log(workoutLog)` in production paths — use `request.log.info` with redaction.
- [ ] Body weight, measurements, injuries are never logged or sent to error trackers (Sentry, etc.) without redaction.

## Phase 6 — Wali AI

- [ ] AI context builder runs **PII stripper** before sending (see `code/ai-pii-stripper.ts`):
  - User's display name → "the athlete"
  - Email, phone → removed entirely
  - Cycle phase data → removed unless user explicitly enabled "AI cycle awareness"
- [ ] User can review what gets sent to AI (Settings → AI Processing screen — already planned in §15.4).
- [ ] **Default opt-out** for AI training data collection — `aiTrainingOptOut` defaults to `true` in DB until user opts in via Settings. (Architecture says opt-out, but means "can opt out". Make it explicit opt-in.)
- [ ] General rate limit on `/api/v1/ai/*` routes (e.g., 60 req/min per user) on top of the daily AI message limit.
- [ ] Plan generation rate limit: max 3 generations per hour per user (it's expensive).
- [ ] AI provider API keys never returned in any HTTP response, even in error paths.
- [ ] Compliance test harness (§12.2) runs in CI on every PR that touches `src/waliAI/prompts/`.

## Phase 7 — WaliRun (GPS) — highest-risk phase

- [ ] GPS permission requested at "Start Run" tap only — never at app launch or during onboarding.
- [ ] `Info.plist` has clear `NSLocationWhenInUseUsageDescription`: e.g., "waliFit uses your location to track distance and pace during your runs. Your routes are private by default."
- [ ] **Privacy zones**: when displaying a run's route map, blur or trim the first 200m and last 200m if the start/end is at the user's home (configurable in Settings — see `code/gps-privacy-zones.ts`).
- [ ] Run share defaults to **stats only**, not route map. User must explicitly enable route sharing per-run.
- [ ] Squad/friend leaderboards show **time and distance only**, never route coordinates.
- [ ] `runRoutePolyline` field has retention policy: auto-delete after 90 days unless user opts in to keep.
- [ ] Route polylines never appear in Wali AI context (you don't need GPS coords to coach pace).
- [ ] If background GPS ships in V2: requires separate permission, separate justification in Play Console permissions declaration form.

## Phase 8 — Settings & Account

- [ ] In-app account deletion is reachable in ≤ 3 taps from Settings.
- [ ] Confirmation requires typing "DELETE" or holding a button — not a single tap.
- [ ] Soft delete is immediate (user can't log in); hard delete runs 30 days later.
- [ ] Hard delete propagates to:
  - PostgreSQL (verified by foreign key cascade)
  - Supabase Storage (avatars + progress photos)
  - Redis (cached user data)
  - **Anthropic + Google AI training opt-out lists** (file a deletion request with each provider)
  - Firebase FCM token registry
- [ ] Data export (`/api/v1/users/me/export`) includes:
  - All workout logs, run logs, nutrition logs
  - Vitality state + daily scores
  - All AI conversation history
  - All squad memberships and messages sent
  - Body metrics, progress photo URLs
  - Settings and preferences
- [ ] Data export is generated as a background job (not synchronous) and emailed via signed link.

## Phase 9 — Legal

- [ ] Privacy Policy mentions, by name:
  - Anthropic (Claude) and Google (Gemini) as AI sub-processors
  - Apple HealthKit / Google Fit data access
  - GPS data, retention period (90 days default), and how to delete
  - Supabase as auth + storage provider
  - Firebase FCM for push notifications
  - Open Food Facts and Nutritionix as nutrition data sources (V2)
- [ ] Privacy Policy version field tracked per user (`ppVersionAccepted`, already planned).
- [ ] AI disclaimer banner is present in:
  - Wali AI chat screen (always visible above input)
  - Onboarding before first AI interaction
  - Settings → AI Processing
- [ ] Terms of Service includes assumption-of-risk clauses for fitness training.
- [ ] If under-18 users are allowed: explicit COPPA flow OR enforced 18+ minimum at signup.

## Phase 10 — Offline & Notifications

- [ ] MMKV offline queue contains workout/run data only — **never auth tokens**.
- [ ] Auth tokens stored in `react-native-keychain` (or `expo-secure-store`), not MMKV.
- [ ] Push notification payloads are scrubbed for lock screen by default:
  - PR notifications show "New PR! Open waliFit" not "100kg squat"
  - DM notifications show "[Username] sent you a message" not message content
- [ ] User can opt in to detailed previews in Settings.
- [ ] FCM token rotation handled on app open (avoids stale tokens leaking).

## Phase 11 — Social (highest social-attack-surface phase)

- [ ] Squad invite codes:
  - 12+ characters, cryptographically random
  - Can be regenerated by squad admin (revokes old code)
  - Optional expiry (24h, 7d, never)
- [ ] Friend username search:
  - Rate limited to 30 searches per minute per user
  - Requires ≥ 3 characters typed (no enumerating with "a")
  - Returns max 20 results
- [ ] DMs and squad messages are encrypted at rest in PostgreSQL (column-level via `pgcrypto`, OR row-level via app-side encryption with key in env).
- [ ] WebSocket connections (Socket.io for `plan:ready`, `badge:awarded`):
  - Require JWT in handshake (`io.use((socket, next) => verify(socket.handshake.auth.token))`)
  - Each user joins only `user:{their-id}` and `squad:{squads-they-belong-to}` rooms
  - Server validates room membership on every emit
- [ ] Profile photo / progress photo URLs:
  - Avatars: public-readable but rate-limited at CDN
  - Progress photos: signed URLs only, max 1-hour expiry (already planned), bound to requesting user ID
- [ ] Reaction abuse: rate limit on `/feed/events/:id/reactions` to prevent spam.
- [ ] Squad message rate limit: 60 messages per minute per user per squad.
- [ ] Block / unblock flow: blocked users cannot see *anything* (profile, posts, leaderboard position).

## Phase 13 — OTA + Polish

- [ ] EAS Update signing key stored only in Expo's EAS account — not in repo, not in CI secrets.
- [ ] Only specific GitHub Actions runners can publish OTA updates (use environment protection rules).
- [ ] OTA updates are reviewed by ≥ 2 people before publishing to `production` channel.
- [ ] Code changes that affect AI prompts, payment logic, or data deletion **cannot ship as OTA-only** — they need a full App Store build for compliance.

## Phase 14 — QA + Launch

- [ ] MobSF scan run on release `.ipa` and release `.aab` — zero High findings.
- [ ] MITM test with mitmproxy on release build — pinning prevents interception (or, if no pinning, ATS-protected HTTPS prevents it).
- [ ] AI compliance harness passes (`npx ts-node src/scripts/testAICompliance.ts` exits 0).
- [ ] Play Data Safety form filled out and accurate. Specifically declared:
  - **Location** (precise, GPS) — yes, used and shared (with user's squad if route shared)
  - **Health & fitness** — yes (workouts, body weight, measurements)
  - **Photos** (avatars, progress photos) — yes
  - **Messages** — yes (DMs, squad messages)
  - **Audio** — no
  - **Contacts** — no (you don't import device contacts)
- [ ] Apple App Privacy nutrition labels match Privacy Policy.
- [ ] App Review Notes include:
  - Demo account credentials (required — login-gated app)
  - "AI features connect to Anthropic and Google. Disclosure is in Settings → AI Processing."
  - "Health data is read-only from HealthKit/Google Fit, used only for the in-app Vitality Tree, and never shared with AI providers."
  - "Account deletion is in Settings → Account → Delete Account."

---

## V2-specific items (don't ship in V1, but plan now)

- [ ] **Cycle tracking (Feature 23)** — encrypt at rest with user-derived key, never sent to AI by default, optional client-only mode.
- [ ] **Progress photos** — client-side encryption before upload OR access-controlled signed URLs with very short TTL (5 min).
- [ ] **Background GPS** — separate permission flow, separate justification, Apple "Always" location reviews are strict.
- [ ] **HRV / wearable data** — same sensitivity as cycle data; treat as health data Tier 1.
- [ ] **Stripe / RevenueCat webhooks** — signature verification on every webhook (see `code/webhook-verification.ts`).
- [ ] **Plan sharing** — when one user imports another's plan, sharing user's PII (name, weights) must be stripped from the imported plan structure.

---

## What we explicitly do NOT need

To avoid scope creep:

- ❌ HIPAA compliance — you're not a covered entity. Don't claim it. Don't market to clinics.
- ❌ SOC 2 — needed only if a B2B customer demands it. Year-2 problem.
- ❌ End-to-end encrypted DMs with key exchange — V1 doesn't need it. Encryption-at-rest is sufficient.
- ❌ Custom certificate pinning for AI APIs — your *backend* talks to Anthropic/Google, not the app. The app talks to your backend (where pinning is appropriate but L2-tier).
- ❌ Root/jailbreak detection — MASVS-R, optional. Skip for V1.
- ❌ Anti-tampering / RASP — same. Skip for V1.
