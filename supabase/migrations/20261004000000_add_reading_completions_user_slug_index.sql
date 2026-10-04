-- Migration: Add composite index on reading_completions for user and reading_slug
-- Timestamp: 20261004000000

CREATE INDEX IF NOT EXISTS idx_reading_completions_user_slug_completed_at
    ON public.reading_completions (user_id, reading_slug, completed_at DESC);
