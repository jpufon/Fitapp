# OWASP MASVS L1 Checklist

Tick these off as you verify each one. Every item has: what it means, how to test, and which phase in the roadmap handles it.

> **L1 = baseline every mobile app should pass.** If you handle money, health, or government data, also do L2 items marked with ⚠️.

---

## MASVS-STORAGE — Data stored on the device

- [ ] **STORAGE-1:** No sensitive data in `AsyncStorage`, `UserDefaults`, or `SharedPreferences`.
  - **Test:** `grep -rn "AsyncStorage\|setItem" src/` — review each call. Inspect app sandbox on a jailbroken/rooted device.
  - **Phase:** 2

- [ ] **STORAGE-2:** Sensitive data uses iOS Keychain / Android Keystore.
  - **Test:** Tokens stored via `react-native-keychain` or `expo-secure-store`.
  - **Phase:** 2

- [ ] **STORAGE-3:** Sensitive data is not exposed via IPC (deep links, intents, share sheets).
  - **Test:** Review `Linking` handlers; check Android `AndroidManifest.xml` for exported activities.
  - **Phase:** 2

- [ ] **STORAGE-4:** No sensitive data in logs.
  - **Test:** `grep -rn "console.log" src/` — remove from release builds. Use a logger that strips in prod.
  - **Phase:** 2

- [ ] **STORAGE-5:** No sensitive data in system screenshots (app switcher thumbnail).
  - **Test:** Put app in background on a sensitive screen, check app switcher thumbnail.
  - **Phase:** 2

- [ ] ⚠️ **STORAGE-L2:** Keychain entries wiped on reinstall (iOS Keychain persists otherwise).
  - **Test:** Install → log in → uninstall → reinstall → verify logged out.

---

## MASVS-CRYPTO — Cryptography

- [ ] **CRYPTO-1:** No deprecated algorithms (MD5, SHA-1, DES, RC4, ECB mode).
  - **Test:** Search codebase; MobSF flags these.
  - **Phase:** 5

- [ ] **CRYPTO-2:** Keys generated with platform-provided secure RNG, stored in Keychain/Keystore.
  - **Test:** Review any `crypto.*` calls; no hardcoded IVs or keys.
  - **Phase:** 5

---

## MASVS-AUTH — Authentication & session management

- [ ] **AUTH-1:** Authentication happens server-side; client only holds a token.
  - **Test:** No password hashing or validation logic in the app itself.

- [ ] **AUTH-2:** Session tokens are invalidated server-side on logout.
  - **Test:** Log in on two devices, log out on one, verify the token no longer works on the backend.

- [ ] **AUTH-3:** Biometric unlock uses platform APIs (Face ID / Touch ID / BiometricPrompt), not a custom implementation.
  - **Test:** Review biometric code; should use `react-native-keychain` with `accessControl` or `expo-local-authentication`.

- [ ] **AUTH-4:** Rate limiting on auth endpoints (server-side).
  - **Test:** Hammer login endpoint with curl; should 429 after a threshold.

---

## MASVS-NETWORK — Network communication

- [ ] **NETWORK-1:** All traffic is HTTPS (no cleartext).
  - **Test:** `Info.plist` has `NSAllowsArbitraryLoads = false`; Android `usesCleartextTraffic="false"`.
  - **Phase:** 3

- [ ] **NETWORK-2:** Certificate validation uses platform defaults (no `TrustAllCerts`-style overrides).
  - **Test:** Grep for `insecureHTTPParser`, `rejectUnauthorized: false`, custom TrustManager.
  - **Phase:** 3

- [ ] **NETWORK-3:** Certificate pinning on high-value endpoints.
  - **Test:** The MITM test (see Phase 3 in README).
  - **Phase:** 3

- [ ] ⚠️ **NETWORK-L2:** Pinning cannot be bypassed with Frida/Objection.
  - **Test:** `objection -g <bundle> explore` then `ios sslpinning disable` or Android equivalent.

---

## MASVS-PLATFORM — Platform interaction

- [ ] **PLATFORM-1:** Only requests permissions actually needed. Each has a clear usage description.
  - **Test:** Review `Info.plist` `*UsageDescription` keys; review `AndroidManifest.xml` `<uses-permission>`.
  - **Phase:** 4

- [ ] **PLATFORM-2:** WebViews disable JavaScript bridges unless needed; `allowFileAccess = false`.
  - **Test:** Review every `<WebView>` usage.

- [ ] **PLATFORM-3:** Deep links validated and don't expose privileged actions.
  - **Test:** Construct a malicious deep link (`yourapp://transfer?amount=9999&to=attacker`), verify it requires auth/confirmation.

- [ ] **PLATFORM-4:** Content providers (Android) not exported unless required.
  - **Test:** Audit `AndroidManifest.xml` for `android:exported="true"`.

---

## MASVS-CODE — Code quality

- [ ] **CODE-1:** App signed with release cert, not debug.
  - **Test:** `codesign -d --verbose=4 /path/to/app.app` (iOS); `apksigner verify -v app.apk` (Android).
  - **Phase:** 4

- [ ] **CODE-2:** Debug symbols / source maps not shipped in release.
  - **Test:** Unzip the `.ipa`/`.apk` — no `.map`, no sourcemaps in `assets/`.
  - **Phase:** 4

- [ ] **CODE-3:** Third-party dependencies patched; no `high`/`critical` CVEs.
  - **Test:** `npm audit --production` and Dependabot alerts clean.
  - **Phase:** 1

- [ ] **CODE-4:** Exception handling doesn't leak stack traces to user or logs in prod.
  - **Test:** Trigger an error; verify user sees a friendly message, not a stack trace.

---

## MASVS-RESILIENCE (⚠️ L2 only — skip unless high-value app)

- [ ] ⚠️ **RESILIENCE-1:** Root/jailbreak detection.
- [ ] ⚠️ **RESILIENCE-2:** Tamper detection (app checks its own signature).
- [ ] ⚠️ **RESILIENCE-3:** Anti-debugging.
- [ ] ⚠️ **RESILIENCE-4:** Obfuscation (R8 + Hermes for RN; ProGuard rules tuned).

These are defense-in-depth — none of them stop a determined attacker, but they raise the cost. Skip if you're a consumer app; implement if you're banking/health/gov.

---

## Final pass before submitting

- [ ] Every unchecked box above has a written justification in `security/exceptions.md` (or is genuinely not applicable).
- [ ] Latest MobSF report saved to `security/reports/`.
- [ ] MITM test passed on current release build.
- [ ] `gitleaks detect` clean on HEAD.
- [ ] `npm audit --production` clean.
