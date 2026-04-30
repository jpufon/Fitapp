# waliFit — Security Workbench

Drop this `security/` folder into the root of your monorepo. Read in this order:

1. **`walifit-security-assessment.md`** ← start here. Threat model + what's specific to your app.
2. **`checklists/walifit-specific.md`** ← concrete checkboxes mapped to your 14 build phases.
3. **`code/`** ← drop-in TypeScript for the 5 highest-leverage controls.
4. **`checklists/masvs-l1.md`** ← generic MASVS-L1 baseline.
5. **`checklists/ios-submission.md`** & **`android-submission.md`** ← submission gates.
6. **`scripts/run-local-scans.sh`** ← run before every PR.

The CI workflow is in `.github/workflows/security.yml` (already wired for your pnpm monorepo).

---

## Layout

```
security/
├── README.md                              ← you are here
├── walifit-security-assessment.md         ← threat model, 12 risks, mapped to your phases
├── checklists/
│   ├── walifit-specific.md                ← THE list to work through, app-specific
│   ├── masvs-l1.md                        ← generic mobile baseline
│   ├── ios-submission.md                  ← App Store gates
│   └── android-submission.md              ← Play Store gates
├── code/
│   ├── mmkv-encrypted.ts                  ← encrypted MMKV + Keychain auth tokens
│   ├── jwt-middleware.ts                  ← portable Fastify auth (drop-in replacement)
│   ├── ai-pii-stripper.ts                 ← strip PII from AI context before send
│   ├── gps-privacy-zones.ts               ← Strava-style route privacy
│   └── webhook-verification.ts            ← Stripe + RevenueCat signature verification
└── scripts/
    └── run-local-scans.sh                 ← gitleaks + audit + grep checks

.github/workflows/
└── security.yml                           ← runs on every push
```

---

## How to actually use this with your build phases

Don't try to do this all at once. The assessment doc maps each security task to one of your existing build phases. The pattern is: **add ~1 day of security work per phase** rather than ~2 weeks of security work at the end.

A practical week-by-week:

- **Week 1 (foundation):** drop in `jwt-middleware.ts` and `mmkv-encrypted.ts`. Wire gitleaks. Enable Dependabot + secret scanning + push protection on GitHub.
- **Week 2–3 (training core):** Zod schemas everywhere. Verify no PII in logs.
- **Week 6 (Wali AI):** drop in `ai-pii-stripper.ts`. Make sure `aiTrainingOptIn` defaults to `false`.
- **Week 7 (WaliRun):** drop in `gps-privacy-zones.ts`. Default `runShareRoute` to `false`.
- **Week 8 (account):** verify in-app deletion + data export work end-to-end.
- **Week 9 (legal):** privacy policy mentions every sub-processor by name.
- **Week 11 (social):** WebSocket JWT auth. Squad code rotation. Friend search rate limit.
- **Week 14 (QA):** MobSF on release build. MITM test. AI compliance harness in CI.

V2.5: drop in `webhook-verification.ts` when you wire RevenueCat + Stripe.

---

## Honest expectation

If you do the assessment + checklist + code drop-ins, you'll pass App Review and Play Review with high confidence and be in a defensible posture. You will NOT be HIPAA-compliant or SOC 2 audited — those are different exercises. The assessment doc explains the gap.
