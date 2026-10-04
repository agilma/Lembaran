-- Migration: Create reading_progress table for Lembaran
-- Timestamp: 20261003000001

-- Create reading_progress table if it does not exist
CREATE TABLE IF NOT EXISTS public.reading_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    reading_slug TEXT NOT NULL,
    active_index INTEGER NOT NULL DEFAULT 0,
    counts JSONB NOT NULL DEFAULT '[]'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_reading_progress_user_slug UNIQUE (user_id, reading_slug)
);

-- Index for querying progress by user and reading slug
CREATE INDEX IF NOT EXISTS idx_reading_progress_user_slug
    ON public.reading_progress (user_id, reading_slug);

-- Enable Row Level Security (RLS)
ALTER TABLE public.reading_progress ENABLE ROW LEVEL SECURITY;

-- Note on RLS Architecture:
-- Lembaran uses NextAuth / Auth.js for authentication (JWT session strategy).
-- Supabase is accessed exclusively on the server side using the Supabase Service Role Key (SUPABASE_SECRET_KEY).
-- Server actions verify NextAuth session and identity before writing or querying reading_progress.
-- Client browser does not connect directly to Supabase and does not possess Supabase Auth JWTs.
-- Therefore, service role bypasses RLS for server-managed operations, while default access for anon/authenticated roles is denied.
