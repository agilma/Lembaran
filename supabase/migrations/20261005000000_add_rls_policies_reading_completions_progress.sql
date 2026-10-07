-- Migration: Add Row Level Security (RLS) policies for authenticated users
-- Timestamp: 20261005000000

-- RLS policies for public.reading_completions
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'reading_completions' AND policyname = 'Users can insert their own reading completions'
    ) THEN
        CREATE POLICY "Users can insert their own reading completions"
            ON public.reading_completions
            FOR INSERT
            TO authenticated
            WITH CHECK ((auth.uid())::text = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'reading_completions' AND policyname = 'Users can select their own reading completions'
    ) THEN
        CREATE POLICY "Users can select their own reading completions"
            ON public.reading_completions
            FOR SELECT
            TO authenticated
            USING ((auth.uid())::text = user_id);
    END IF;
END $$;

-- RLS policies for public.reading_progress
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'reading_progress' AND policyname = 'Users can manage their own reading progress'
    ) THEN
        CREATE POLICY "Users can manage their own reading progress"
            ON public.reading_progress
            FOR ALL
            TO authenticated
            USING ((auth.uid())::text = user_id)
            WITH CHECK ((auth.uid())::text = user_id);
    END IF;
END $$;
