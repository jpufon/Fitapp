# Google Play Submission Checklist

---

## Build & targeting

- [ ] `targetSdkVersion` ≥ 34 (required; bumps annually — check Play Console for current minimum).
- [ ] `compileSdkVersion` matches latest stable.
- [ ] `minSdkVersion` ≥ 23 (Android 6.0) recommended for RN.
- [ ] Built as `.aab` (App Bundle), not `.apk`.
- [ ] Signed with **Play App Signing** enabled (Google manages the signing key).
- [ ] Release keystore stored securely (password manager, NOT in the repo).

---

## Release build hardening (`android/app/build.gradle`)

- [ ] `minifyEnabled true` in release buildType.
- [ ] `shrinkResources true`.
- [ ] `proguard-rules.pro` includes RN-specific rules (check `node_modules/react-native/proguard-rules.pro`).
- [ ] Hermes enabled: `hermesEnabled=true` in `gradle.properties`.
- [ ] `android:debuggable="false"` in release manifest (default, but verify).

---

## Manifest hygiene (`AndroidManifest.xml`)

- [ ] `android:allowBackup="false"` (or a proper `backup_rules.xml` if you need backup).
- [ ] `android:usesCleartextTraffic="false"`.
- [ ] No `android:exported="true"` on activities/services unless intentional. (Targeting API 31+ forces you to declare this explicitly.)
- [ ] `network_security_config.xml` disallows cleartext and (for L2) pins certs.
- [ ] No unused permissions — every `<uses-permission>` is actually used.

---

## Permissions — every one needs justification

Sensitive permissions require a **Permissions Declaration** form in Play Console:

- [ ] `READ_SMS` / `RECEIVE_SMS` — very hard to justify, almost always rejected.
- [ ] `CALL_LOG` — same.
- [ ] `ACCESS_BACKGROUND_LOCATION` — requires a specific use case doc.
- [ ] `MANAGE_EXTERNAL_STORAGE` — restricted; prefer scoped storage.
- [ ] `QUERY_ALL_PACKAGES` — requires declaration with justification.
- [ ] `SYSTEM_ALERT_WINDOW` — restricted.

For each one you keep, write the justification BEFORE submitting. Saves rejection ping-pong.

---

## Data Safety form (Play Console)

This is the single biggest cause of rejections in 2025–2026. It must match reality.

- [ ] Declared every data type the app collects.
- [ ] Declared every data type the app shares.
- [ ] Declared whether data is encrypted in transit.
- [ ] Declared whether users can request deletion.
- [ ] Every third-party SDK's data practices included (not just your own code).

**Test:** Google runs automated checks that compare your declaration to detected SDK behavior. Mismatches trigger a policy violation.

---

## Privacy policy

- [ ] URL works (Play Console will reject `example.com`-style placeholders).
- [ ] Policy mentions every data type from the Data Safety form.
- [ ] Policy specifies retention and deletion process.
- [ ] Policy hosted on a stable domain you control.

---

## Content rating & target audience

- [ ] Content rating questionnaire completed honestly (false answers = permanent ban risk).
- [ ] Target audience age matches actual audience. If you allow children, additional rules (COPPA, Families policy) apply.

---

## Functional

- [ ] No crashes on first launch on a clean device (Pre-Launch Report catches this automatically — enable it).
- [ ] App handles notification permission denial (required on API 33+).
- [ ] Back gesture works everywhere (Android 13+ gesture nav).
- [ ] Dark mode doesn't make text unreadable.

---

## React Native specific

- [ ] Hermes enabled.
- [ ] `__DEV__` false in release.
- [ ] Flipper disabled in release.
- [ ] `android/app/src/main/assets/index.android.bundle` is the only bundle; no dev bundle.
- [ ] Source maps NOT inside the `.aab` (should be uploaded separately for crash symbolication).
- [ ] ProGuard rules cover every native RN module you use (many libs provide their own — check each).

---

## Pre-Launch Report (free, built into Play Console)

- [ ] Uploaded build to **Internal Testing** track first.
- [ ] Pre-Launch Report ran — no crashes, no security warnings.
- [ ] Accessibility issues reviewed (not blocking, but good to address).

---

## Useful links

- Play policy: https://support.google.com/googleplay/android-developer/topic/9858052
- Target API requirement: https://support.google.com/googleplay/android-developer/answer/11926878
- Data safety form: https://support.google.com/googleplay/android-developer/answer/10787469
