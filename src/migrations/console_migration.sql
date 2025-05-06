-- USER BAN FUNCTIONALITY MIGRATION SCRIPT
-- This script creates tables and adds columns needed for the user ban system
-- Execute this script in the Supabase SQL Editor (https://app.supabase.com/project/<your-project-id>/sql)

-- First ensure the perks column is properly defined as an array
DO $$
BEGIN
  -- Check if perks column exists and is not an array, convert it to array if needed
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'perks'
  ) THEN
    -- Try to make sure perks is an array type
    BEGIN
      ALTER TABLE public.profiles 
        ALTER COLUMN perks TYPE TEXT[] USING 
          CASE 
            WHEN perks IS NULL THEN ARRAY['user']::TEXT[]
            WHEN perks::TEXT = '[]' THEN ARRAY['user']::TEXT[]
            ELSE ARRAY[perks]::TEXT[] 
          END;
    EXCEPTION WHEN OTHERS THEN
      -- If error occurs, log it but continue
      RAISE NOTICE 'Could not convert perks to array type: %', SQLERRM;
    END;
  END IF;
END
$$;

-- STEP 1: Add columns to the profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ban_reason TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ban_end_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ban_admin_id UUID REFERENCES auth.users(id);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ban_admin_name TEXT;

-- STEP 2: Create table for storing ban information
CREATE TABLE IF NOT EXISTS public.user_bans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  admin_id UUID NOT NULL REFERENCES auth.users(id),
  admin_name TEXT NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  end_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  ban_type TEXT NOT NULL
);

-- STEP 3: Create indexes for optimizing database queries
CREATE INDEX IF NOT EXISTS idx_user_bans_user_id ON public.user_bans(user_id);
CREATE INDEX IF NOT EXISTS idx_user_bans_is_active ON public.user_bans(is_active);
CREATE INDEX IF NOT EXISTS idx_user_bans_created_at ON public.user_bans(created_at);

-- STEP 4: Enable Row Level Security (RLS) for the user_bans table
ALTER TABLE public.user_bans ENABLE ROW LEVEL SECURITY;

-- STEP 5: Create a function to check admin privileges that handles different formats for perks
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  user_email TEXT;
  is_admin_user BOOLEAN;
BEGIN
  -- Get current user email
  SELECT email INTO user_email FROM auth.users WHERE id = auth.uid();
  
  -- Check if user is the superadmin by email
  IF user_email = 'igoraor79@gmail.com' THEN
    RETURN TRUE;
  END IF;
  
  -- Check if user has admin role in profiles
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND (
      active_perk = 'admin' OR
      CASE 
        WHEN perks IS NULL THEN FALSE
        WHEN perks::TEXT = '[]' THEN FALSE
        WHEN perks IS NOT NULL AND perks::TEXT LIKE '%admin%' THEN TRUE
        ELSE FALSE
      END
    )
  ) INTO is_admin_user;
  
  RETURN is_admin_user;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 6: Drop existing policies first to avoid errors
DO $$
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Admins can read all bans" ON public.user_bans;
  DROP POLICY IF EXISTS "Users can view their own bans" ON public.user_bans;
  DROP POLICY IF EXISTS "Only admins can create bans" ON public.user_bans;
  DROP POLICY IF EXISTS "Only admins can update bans" ON public.user_bans;
  DROP POLICY IF EXISTS "Only admins can delete bans" ON public.user_bans;
END
$$;

-- STEP 7: Create simple RLS policies using the is_admin function

-- Policy: Admins can read all bans and users can view their own bans
CREATE POLICY "Admins can read all bans" 
  ON public.user_bans FOR SELECT
  USING (is_admin() OR user_id = auth.uid());

-- Policy: Only admins can create bans
CREATE POLICY "Only admins can create bans"
  ON public.user_bans FOR INSERT
  WITH CHECK (is_admin());

-- Policy: Only admins can update bans
CREATE POLICY "Only admins can update bans"
  ON public.user_bans FOR UPDATE
  USING (is_admin());

-- Policy: Only admins can delete bans
CREATE POLICY "Only admins can delete bans"
  ON public.user_bans FOR DELETE
  USING (is_admin());

-- STEP 8: Grant privileges to allow ban verification during login
GRANT SELECT ON public.user_bans TO anon;
GRANT SELECT ON public.profiles TO anon;

-- STEP 9: Create check for expired bans (optional, can also be handled client-side)
COMMENT ON TABLE public.user_bans IS 'Stores information about user bans'; 