-- Speeds up incremental catalog sync (?updatedAfter=) and max(version) scans.
CREATE INDEX IF NOT EXISTS "exercises_updated_at_idx" ON "exercises"("updatedAt");
