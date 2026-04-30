# Coaching Plan, Badges & Wali Vision — Brainstorm Spec

Status: brainstorm / not implemented. Captures decisions from 2026-04 design chat.
Companion doc for badges: `waliFit_Challenge_Badge_Points_System.md`.

---

## 1. Coaching Plan (Wali AI program generation)

### Concept
User asks Wali AI for a program. Wali generates a 6-month plan, user validates,
plan populates Calendar + Train, sets pillar targets, schedules check-ins, and
feeds analytics. Single entity owns schedule + targets + check-ins so deletion
and analytics stay clean.

### Data model (sketch)
```
CoachingPlan
  id, userId, status (draft | active | archived | completed)
  generatedBy (ai | user), goalSummary, durationWeeks
  startDate, endDate, archivedAt
  targets: { proteinG, hydrationMl, weightGoalKg? }
  checkInCadence: { weighIn: weekly, measurements: monthly }

PlannedWorkout
  id, planId, scheduledDate, workoutTemplateId, status
  → writes to Calendar + Train when plan activates

CheckIn
  id, planId, userId, type (weight | bmi | photo | mood)
  value, recordedAt
```

### V1 scope
- One active plan per user. Generating a new one archives the old.
- Soft delete only — `status = archived`, completed workouts + check-ins persist.
- `planId` foreign key on Workout and CheckIn (retrofitting later is painful).
- Weight tracked as a CheckIn type, NOT a 4th Vitality pillar (stays inside V1
  fence — CLAUDE.md says no full macro tracking V1).
- BMI calculated on-the-fly from weight + height, not stored.

### Flow
1. User: "Wali, build me a Hyrox prep plan."
2. Wali generates draft → shows summary screen (weeks, targets, sample week).
3. User validates → status flips `draft → active`, PlannedWorkouts written.
4. Calendar/Train read from PlannedWorkouts. Vitality pillar targets updated.
5. Check-in cadence triggers notifications (weekly weigh-in, etc).
6. User can archive plan anytime → future PlannedWorkouts removed, history kept.

### Open decisions
- Plan regeneration: full rebuild vs delta adjustment when user reports injury / missed week?
- Check-in notifications: in-app only or push?

---

## 2. Badges — data model future-proofing

See `waliFit_Challenge_Badge_Points_System.md` for the full badge catalog.
This section is purely about the **shape of the data** so V1 doesn't paint
into a corner.

### Principle
V1 logic can be hardcoded triggers, but every badge is a row, not an enum.
Adding a rules engine later = new logic, not a data migration.

### Data model (sketch)
```
Badge
  id, slug, name, description, art, tier (bronze | silver | gold | legendary)
  opensAt?, closesAt?       // null = permanent achievement
  criteria (JSON)           // hardcoded matchers in V1, rules engine later
  rarity (computed)

UserBadge
  id, userId, badgeId, awardedAt, awardingWorkoutId?
```

### V1 scope
- 10–15 hardcoded triggers: first workout, 7-day streak, first 5K, first PR, etc.
- Permanent achievements only in V1. Time-windowed events ship V1.5+.
- Profile shows earned badges sorted by `awardedAt` desc.

### Critical rule
`UserBadge.awardedAt` derives from the underlying event's timestamp
(e.g. `Workout.completedAt`), NOT from sync submission time. A user who finishes
at 11:58pm but syncs at 12:02am still gets the daily/weekly badge. Easy to get
wrong, painful to fix retroactively.

---

## 3. Wali Vision — form analysis from 10s clips

### Concept
User records 10s of a lift (squat, deadlift, bench, etc). App extracts keyframes,
sends to Gemini Vision with a movement-specific prompt, returns structured
feedback (depth, knee tracking, bar path, posture).

### Pipeline
```
Record (10s, on-device)
  → Extract 8–12 keyframes (on-device, react-native-vision-camera or ffmpeg-kit)
  → Upload frames + movement type to backend
  → backend/src/waliAI/vision.ts → Gemini Vision with movement-specific prompt
  → Returns structured JSON: { depthScore, kneeTracking, barPath, cues[], overall }
  → Save FormReview record (no video by default)
  → Display feedback overlay on thumbnail
```

### V1 scope
- Fixed exercise list with hand-tuned prompts: squat, deadlift, bench, pull-up,
  box jump. Generic "analyze this exercise" produces mushy feedback.
- Frame extraction (8–12 keyframes), NOT full video upload. ~10x cheaper, faster.
- Ephemeral by default: analyze → discard clip → keep JSON feedback + 1 thumbnail.
- Explicit opt-in to "save clip to my progress reel" (separate flag).

### Data model (sketch)
```
FormReview
  id, userId, workoutId?, exercise, recordedAt
  feedback (JSON: scores + cues), thumbnailUrl
  clipUrl?              // null unless user opted in
  retainUntil           // auto-delete clip after N days even if saved
```

### Privacy
Body-form videos are sensitive PII. Defaults must favor user privacy:
- Clip auto-deleted after analysis unless user opts in
- If opted in, retention cap (e.g. 90 days)
- No frames sent to third parties beyond Gemini Vision API call
- Feedback JSON is fine to retain indefinitely (no biometric content)

### Open decisions
- Confidence threshold: when Gemini returns low confidence, do we surface
  feedback anyway with a caveat, or refuse?
- Squad/Arena sharing: can users share a Form Review to the feed? (V2.)

---

## What this doesn't cover yet
- Notification scheduling architecture (check-ins, badge awards, plan reminders)
- Analytics surface — what the user actually sees in the Profile/Analytics screen
- AI cost budgeting per user per month (Sonnet plan generation + Vision calls add up)
