# iOS App Store Submission Checklist

The rules that actually get apps rejected. Ordered roughly by rejection frequency.

---

## Build & SDK

- [ ] Built with **Xcode 26 / iOS 26 SDK** (enforced by App Store from April 2026).
- [ ] Deployment target ≥ iOS 15 (most apps; check your minimum).
- [ ] Release build (not debug).
- [ ] Bitcode disabled (Apple removed bitcode; leaving it on is a warning).
- [ ] dSYMs uploaded for crash symbolication.

---

## Privacy manifest (`PrivacyInfo.xcprivacy`) — **required**

- [ ] File exists in `ios/YourApp/PrivacyInfo.xcprivacy`.
- [ ] `NSPrivacyTracking` set correctly (true only if you track across apps).
- [ ] `NSPrivacyTrackingDomains` lists every tracking domain you connect to.
- [ ] `NSPrivacyCollectedDataTypes` covers every data type you collect.
- [ ] `NSPrivacyAccessedAPITypes` lists every "required reason API" you use:
  - File timestamps (`NSPrivacyAccessedAPICategoryFileTimestamp`)
  - System boot time
  - Disk space
  - Active keyboard
  - User defaults
- [ ] Every third-party SDK / CocoaPod has its own `PrivacyInfo.xcprivacy`. (Most major RN libs do as of 2026; audit the ones that don't.)

**Test:** Xcode validates on build. Also Archive → Organizer → "Privacy Report" shows what Apple will see.

---

## Permissions (`Info.plist`)

Every permission needs a clear, honest usage description. Vague strings = rejection.

- [ ] `NSCameraUsageDescription` — if camera used
- [ ] `NSMicrophoneUsageDescription` — if mic used
- [ ] `NSPhotoLibraryUsageDescription` / `NSPhotoLibraryAddUsageDescription`
- [ ] `NSLocationWhenInUseUsageDescription` / `NSLocationAlwaysAndWhenInUseUsageDescription`
- [ ] `NSContactsUsageDescription`
- [ ] `NSFaceIDUsageDescription` — if using Face ID
- [ ] `NSUserTrackingUsageDescription` — if showing ATT prompt

**Rule of thumb:** say *what* you do and *why the user benefits*. "Access camera to scan receipts for expense tracking" ✅. "Access camera" ❌.

---

## App Transport Security

- [ ] `NSAllowsArbitraryLoads = false` in `Info.plist`.
- [ ] No ATS exceptions, OR each exception has a documented justification.

---

## App Tracking Transparency

- [ ] If you track: ATT prompt shown before any tracking SDK initializes.
- [ ] If you don't track: `NSPrivacyTracking = false` in privacy manifest, and you don't call `requestTrackingAuthorization`.

---

## AI disclosure (required since Nov 13, 2025)

- [ ] If your app sends user data to any third-party AI service (OpenAI, Anthropic, etc.), disclose this in-app and get explicit consent before the first call.
- [ ] Privacy policy mentions the AI processing.

---

## App Review Notes

- [ ] Demo account credentials if login required (**non-negotiable** — reviewers won't sign up).
- [ ] Notes explaining any non-obvious flow.
- [ ] Explanation for any permissions that seem broader than the app's purpose.
- [ ] Region info if app is region-locked.

---

## Metadata & assets

- [ ] Screenshots match the current app (reviewers compare).
- [ ] No pricing, promotions, or competitor names in description.
- [ ] Support URL is a real, working page (not `example.com`).
- [ ] Privacy policy URL works and covers what the app actually does.
- [ ] App icon has no transparency and no Apple-branded elements.

---

## Functional / crash-free

- [ ] No crashes on first launch (test on a clean device).
- [ ] No placeholder content, lorem ipsum, or "TODO" visible to users.
- [ ] All buttons/links work.
- [ ] IAPs (if any) work end-to-end in sandbox.
- [ ] "Restore Purchases" button works (required if you have non-consumable IAPs).

---

## React Native specific gotchas

- [ ] Dev menu disabled in release: `__DEV__` is false.
- [ ] Remote debugger disabled.
- [ ] No `localhost` or `127.0.0.1` references in release bundle.
- [ ] Source maps NOT bundled in the `.ipa` (check `ios/main.jsbundle.map` is excluded).
- [ ] Hermes enabled.
- [ ] Any native module that accesses a "required reason API" declared in privacy manifest.

---

## Top rejection reasons to double-check

| Guideline | What it means | Quick check |
|-----------|---------------|-------------|
| 2.1 | App crashes or has broken flows | Test every primary user journey |
| 2.3.1 | Hidden features or misleading metadata | No "test mode," no A/B code that shows different UX to reviewers |
| 2.5.1 | Uses private APIs | MobSF or `otool -L` to check |
| 3.1.1 | IAP bypass (using Stripe/PayPal for digital goods) | Digital goods MUST use IAP |
| 4.0 | Design — looks unfinished or copies another app | Original design, no "coming soon" screens |
| 5.1.1 | Data collection without consent | Privacy policy + in-app consent for anything sensitive |

Full text: https://developer.apple.com/app-store/review/guidelines/
