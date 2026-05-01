# waliFit — App Store Submission Checklist

> Living doc. Update as items are completed. iOS-first; Android (Play Store) checklist lives at the bottom.

This is the punch list for going from "TestFlight-ready build" to "live in the App Store." Read top to bottom before submitting — most rejections come from skipping items in §3 (privacy) or §4 (V1 blockers).

---

## 1. Apple Developer Program ($99/year)

- [ ] Enroll at [developer.apple.com/programs](https://developer.apple.com/programs/) — individual OR organization. Pick organization if you have an LLC; needs a D-U-N-S number (free, ~5 day wait). Individual is faster.
- [ ] Verify Apple ID has 2FA enabled. Required.
- [ ] Add tax + banking info in App Store Connect → Agreements, Tax, and Banking. Until these are signed, paid apps can't ship and even free apps can't be reviewed.

## 2. App Store Connect setup

- [ ] Create app record at [appstoreconnect.apple.com](https://appstoreconnect.apple.com) → My Apps → "+"
  - Name: `waliFit`
  - Primary Language: English (U.S.)
  - Bundle ID: `com.walifit.app` (match `app.json`'s `ios.bundleIdentifier` exactly)
  - SKU: `walifit-ios` (internal, never shown)
- [ ] Invite contractor: Users and Access → "+" → use *their* Apple ID, role: **Developer** (build/TestFlight only — no account/billing access).
- [ ] **Do not** add the contractor under the Apple Developer Program "Account Holder" role. Ever.

## 3. Privacy — Apple's strictest area, biggest cause of rejection

### 3.1 `Info.plist` usage descriptions

Every permission your app requests needs a real, specific description. Apple rejects boilerplate. Edit `react-native/app.json` `ios.infoPlist`:

```jsonc
"ios": {
  "infoPlist": {
    "NSMotionUsageDescription":
      "waliFit reads your step count to calculate your daily Vitality Tree activity score. Steps are read on-device and never shared.",
    "NSHealthShareUsageDescription":
      "waliFit reads your daily step count from Apple Health to power the Steps pillar of your Vitality Tree. We never write to Apple Health.",
    "NSLocationWhenInUseUsageDescription":
      "WaliRun uses your location during a run to track distance, pace, and route. Location is only read while the run is active and is never tracked in the background.",
    "NSCameraUsageDescription":
      "waliFit uses the camera to scan barcodes (V2) and capture progress photos for your check-ins.",
    "NSPhotoLibraryUsageDescription":
      "waliFit accesses your photo library when you import a workout screenshot from another fitness app, or upload a profile photo.",
    "NSUserTrackingUsageDescription":
      "waliFit does not track you across other apps or websites."
  }
}
```

- [ ] Each description references a specific feature, not "improve your experience"
- [ ] If a key isn't actually used, remove it — unused descriptions are a rejection signal

### 3.2 Privacy Manifest (`PrivacyInfo.xcprivacy`)

Required for all apps as of 2024. Declare:
- API categories your app uses (`NSPrivacyAccessedAPICategoryFileTimestamp`, etc.)
- Tracking domains (we don't track — leave empty)
- Data types collected

EAS Build with `expo` SDK 54 generates a basic one — verify it's there in the build artifact.

- [ ] `npx expo prebuild --platform ios && grep -r "PrivacyInfo" ios/` returns the file
- [ ] If you add Anthropic, Google AI SDKs, or any analytics — re-check their privacy manifest contributions

### 3.3 Privacy Nutrition Labels (App Store Connect questionnaire)

The most under-prepared step. App Store Connect → your app → App Privacy → answer truthfully. waliFit collects:

| Data | Linked to user | Used for tracking | Why |
|---|---|---|---|
| Email | Yes | No | Account creation |
| Name (display name) | Yes | No | Personalization |
| Workout data, run data, body weight | Yes | No | App functionality |
| Photos (avatar, progress, meal scan V2) | Yes | No | App functionality |
| Coarse location | Yes | No | WaliRun GPS — only during active run |
| Health data (steps) | Yes | No | Vitality Tree |
| Coaching messages (sent to Anthropic) | Yes | No | App functionality |
| Crash logs | Yes | No | App diagnostics |

- [ ] Answer "No" to "tracking" for every data type — you don't sell data, don't share with ad networks, don't link with third-party data
- [ ] Required documentation lives in `Settings → AI Processing Disclosure` (you have to build that — see §4.3)

## 4. V1 hard blockers — these *will* cause rejection

### 4.1 In-app account deletion (App Store Review Guideline 5.1.1(v))

> "Apps that support account creation must let users initiate deletion of their account from within the app."

- [ ] Delete account button visible in `Settings`
- [ ] Two-step confirmation (modal + typed "DELETE")
- [ ] Soft-delete immediately: `User.deletedAt = now()`, `User.deletionDueAt = now() + 30 days`, sign out
- [ ] BullMQ job hard-deletes all user data after 30 days
- [ ] Confirmation email at both stages
- [ ] **Status: schema fields exist (item 1), pipeline + UI not built yet — Phase 2.5 work**

### 4.2 Apple Sign In if Google Sign In offered (Guideline 4.8)

> If your app uses any third-party sign-in services, it must also offer Sign in with Apple.

- [ ] Apple Sign In implemented in `AuthScreen` via `expo-apple-authentication`
- [ ] Apple Sign In button **at least as prominent** as Google Sign In button
- [ ] Apple Sign In sends user to the same onboarding flow as email/Google
- [ ] **Status: AuthScreen UI shells exist; neither sign-in actually wired**

### 4.3 AI Processing Disclosure (new 2026 requirement)

- [ ] Settings screen has a clear "AI & Data" section explaining:
  - **On-device** (never leaves phone): GPS, rest timer, tree state, exercise library
  - **Sent to Anthropic** (Claude): Wali AI chat messages, training context
  - **Sent to Google** (Gemini): nutrition parsing, food photos (V2), onboarding screenshot import
  - **Sent to waliFit servers** (Railway): workout logs, run data, squad activity
- [ ] AI training data opt-out toggle (`User.aiTrainingOptOut` exists in schema — needs UI)
- [ ] AI disclaimer banner persistently visible in Coach screen ("Not medical advice — consult a professional")
- [ ] **Status: schema field exists; UI not built**

### 4.4 Privacy Policy + Terms of Service URLs (live, public)

- [ ] Privacy Policy hosted at `https://walifit.app/privacy` (or temp on iubenda/Notion if domain isn't ready)
- [ ] Terms of Service hosted at `https://walifit.app/terms`
- [ ] Both linked from `Settings → Legal`
- [ ] App Store Connect → App Information → Privacy Policy URL filled in
- [ ] **Status: User schema tracks `privacyAcceptedAt` and `termsAcceptedAt`; URLs not yet hosted**

### 4.5 GDPR data export (GDPR Article 15, also Apple-recommended)

- [ ] `GET /api/v1/users/me/export` returns full user data as downloadable JSON
- [ ] "Export my data" button in Settings → Account
- [ ] **Status: route not built**

## 5. App Store listing content

### 5.1 Required text

- [ ] **App name** (30 chars max): `waliFit`
- [ ] **Subtitle** (30 chars): something like `Hybrid Athlete OS` or `Train. Grow. Compete.`
- [ ] **Promotional text** (170 chars, editable without resubmit): launch hook
- [ ] **Description** (4000 chars): feature list, value prop, target user. Write in plain English, not marketing jargon. No false claims.
- [ ] **Keywords** (100 chars total, comma-separated): `hybrid athlete, hyrox, crossfit, gps run, workout tracker, vitality tree, fitness coach`
- [ ] **Support URL**: `https://walifit.app/support` (required — must work)
- [ ] **Marketing URL** (optional): `https://walifit.app`
- [ ] **Copyright**: `© 2026 <Your Legal Name or LLC>`

### 5.2 Visuals

- [ ] **App icon**: 1024×1024px PNG, no transparency, no alpha, no rounded corners (Apple rounds for you)
- [ ] **Screenshots** — required sizes for current devices:
  - 6.9" (iPhone 16 Pro Max): 1320×2868 — **6 required**
  - 6.5" (iPhone 11 Pro Max): 1242×2688 — **6 required**
  - 5.5" (iPhone 8 Plus, legacy): 1242×2208 — **6 required if supporting older devices**
  - iPad 13" (if supporting iPad): 2064×2752
- [ ] Screenshots show real screens, not mockups. No "Coming Soon." First screenshot is the hero.
- [ ] **Optional but recommended**: 1 preview video per size (15–30 sec, .mov or .mp4, no audio narration unless captioned)

### 5.3 Categorization

- [ ] **Primary category**: Health & Fitness
- [ ] **Secondary category**: Lifestyle (or Sports)
- [ ] **Age rating**: 4+ (no offensive content). Confirmed by completing the rating questionnaire.

### 5.4 Content rights

- [ ] Confirm you own / have rights to all visuals, fonts, and any music in preview videos
- [ ] If using anyone's name (testimonials, etc.), have written consent

## 6. Build + delivery

### 6.1 EAS Build setup

- [ ] `eas.json` configured with `production` profile
- [ ] Bundle identifier matches App Store Connect record exactly (`com.walifit.app`)
- [ ] Build version + version code increments per submission (`expo-build-properties` or manual in `app.json`)
- [ ] iOS distribution certificate + provisioning profile auto-managed by EAS (don't manually provision unless you must)

```bash
# Build for App Store
eas build --platform ios --profile production

# Submit to App Store Connect (uploads to TestFlight)
eas submit --platform ios --latest
```

### 6.2 TestFlight (internal + external testing)

- [ ] Build appears in App Store Connect → TestFlight after `eas submit`
- [ ] Internal testers (up to 100) — your team. No Apple review needed.
- [ ] External testers (up to 10,000) — public-ish beta. Requires Apple's "TestFlight review" (~24h, lighter than full App Store review)
- [ ] At minimum, run the app on **3 real devices** before submitting:
  - One older iPhone (iPhone 11 / SE 2nd gen)
  - One current iPhone
  - One device on the oldest iOS version you claim to support
- [ ] Verify the full happy path: sign up → onboarding → log a workout → finish → see tree update → log out → log back in

## 7. Pricing + availability

- [ ] **Price**: Free (V1 is 100% free per spec)
- [ ] **Availability**: All countries (or at minimum US + your home country)
- [ ] No in-app purchases yet (V2.5 only — RevenueCat integration)

## 8. Submit + post-submit

- [ ] App Store Connect → your app → "Add for Review"
- [ ] Answer Export Compliance: yes if app uses HTTPS (almost all apps), select "exempt" for standard encryption
- [ ] Answer Content Rights, Advertising Identifier (no, you don't use IDFA)
- [ ] **Submit**
- [ ] Check email + App Store Connect daily during review (1–3 days typical)
- [ ] If rejected: read message carefully, fix specific items, resubmit. Don't argue unless they're factually wrong.

## 9. Common waliFit-specific rejection risks

| Risk | How to avoid |
|---|---|
| HealthKit description too generic | Be specific: "reads daily step count for Vitality Tree" |
| Apple Sign In missing while Google offered | Implement Apple Sign In before submission |
| Account deletion missing | Build the pipeline (§4.1) |
| AI safety language insufficient | Disclaimer banner in Coach must be visible, not collapsible |
| Health claims in app description | Don't say "burn fat", "build muscle", "improve health" — Apple is allergic. Say "track workouts", "log activity" |
| No privacy policy URL or 404 | Verify URL is live + has content before submitting |
| Permissions requested at launch | Move all permission prompts behind first-use (steps after first day, location after first run, notifications after first workout) |
| Empty app on first launch | Onboarding must show a populated home screen — never blank state |

## 10. Android (Play Store) — different rules

Quick differences vs iOS, full checklist later when iOS is shipping:

- $25 one-time fee (vs $99/year), enroll at [play.google.com/console](https://play.google.com/console)
- No Apple Sign In requirement — Google Sign In + email is fine
- No Privacy Manifest, but **Data Safety form** is the equivalent
- Account deletion required (same as Apple, since 2023)
- AI disclosure required (same as Apple, since 2024)
- Foreground service permission for run tracking — declare in `app.json` `android.permissions`
- Internal testing track → Closed testing → Open testing → Production. Faster review than Apple (often <12h).

---

## What's already built vs what blocks submission today

✅ **Built**: Schema fields for soft-delete, AI opt-out, legal timestamps · Theme tokens · Backend infrastructure
⚠️ **Partially built**: AuthScreen UI shells (no actual sign-in wiring) · Onboarding UI (no server persistence)
❌ **Blockers — must build before submission**:
1. Account deletion pipeline (§4.1)
2. Apple Sign In implementation (§4.2)
3. Settings → AI Processing Disclosure UI (§4.3)
4. Privacy Policy + ToS hosted URLs (§4.4)
5. GDPR data export route (§4.5)
6. Real screenshots from final UI (§5.2)
7. Live `walifit.app` domain with /privacy, /terms, /support pages (§4.4 + §5.1)

These are the non-skip items. Estimate ~5–7 days of focused work to clear all 7 once features stabilize.
