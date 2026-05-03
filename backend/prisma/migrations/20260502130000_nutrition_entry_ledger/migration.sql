-- WF-017 / WF-018 — additive nutrition ledger.
-- Every protein / water tap appends one row keyed by a mobile-minted clientId.
-- Replays from the offline sync queue collapse on the (userId, clientId) unique.

CREATE TABLE "nutrition_entries" (
  "id"            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId"        UUID         NOT NULL,
  "date"          DATE         NOT NULL,
  "clientId"      TEXT         NOT NULL,
  "proteinDeltaG" INTEGER      NOT NULL DEFAULT 0,
  "waterDeltaMl"  INTEGER      NOT NULL DEFAULT 0,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "nutrition_entries_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX "nutrition_entries_userId_clientId_key"
  ON "nutrition_entries"("userId", "clientId");

CREATE INDEX "nutrition_entries_userId_date_idx"
  ON "nutrition_entries"("userId", "date");
