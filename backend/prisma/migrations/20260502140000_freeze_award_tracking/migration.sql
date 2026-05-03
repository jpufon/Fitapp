-- WF-021 — track the highest streak threshold (7/30/60/100) the user has
-- already received a freeze token for. Resets to 0 on streak break so each
-- milestone is re-earnable.

ALTER TABLE "vitality_states"
  ADD COLUMN "lastFreezeAwardedStreak" INTEGER NOT NULL DEFAULT 0;
