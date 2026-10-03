-- Migration: Create reading_completions table for Lembaran
-- Timestamp: 20261003000000

-- Create reading_completions table if it does not exist
CREATE TABLE IF NOT EXISTS public.reading_completions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    reading_slug TEXT NOT NULL,
    count INTEGER NULL,
    target INTEGER NULL,
    completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for querying history by user and completed_at
CREATE INDEX IF NOT EXISTS idx_reading_completions_user_completed_at
    ON public.reading_completions (user_id, completed_at DESC);

-- Index for querying completions by reading slug
CREATE INDEX IF NOT EXISTS idx_reading_completions_reading_slug
    ON public.reading_completions (reading_slug);

-- Enable Row Level Security (RLS)
ALTER TABLE public.reading_completions ENABLE ROW LEVEL SECURITY;

-- Note on RLS Architecture:
-- Lembaran uses NextAuth / Auth.js for authentication (JWT session strategy).
-- Supabase is accessed exclusively on the server side using the Supabase Service Role Key (SUPABASE_SECRET_KEY).
-- Server actions verify NextAuth session and identity before writing or querying reading_completions.
-- Client browser does not connect directly to Supabase and does not possess Supabase Auth JWTs.
-- Therefore, service role bypasses RLS for server-managed operations, while default access for anon/authenticated roles is denied.
