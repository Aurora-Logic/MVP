-- ════════════════════════════════════════════════════════════════
-- FIX PROFILES TABLE - Add missing 'role' column and complete schema
-- ════════════════════════════════════════════════════════════════
-- Run this in Supabase SQL Editor: https://app.supabase.com → SQL Editor

-- Step 1: Add 'role' column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles' AND column_name = 'role'
    ) THEN
        ALTER TABLE profiles ADD COLUMN role TEXT DEFAULT 'user';
        RAISE NOTICE 'Added role column to profiles table';
    ELSE
        RAISE NOTICE 'role column already exists';
    END IF;
END $$;

-- Step 2: Add 'plan' column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles' AND column_name = 'plan'
    ) THEN
        ALTER TABLE profiles ADD COLUMN plan TEXT DEFAULT 'free';
        RAISE NOTICE 'Added plan column to profiles table';
    ELSE
        RAISE NOTICE 'plan column already exists';
    END IF;
END $$;

-- Step 3: Add 'avatar_url' column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles' AND column_name = 'avatar_url'
    ) THEN
        ALTER TABLE profiles ADD COLUMN avatar_url TEXT;
        RAISE NOTICE 'Added avatar_url column to profiles table';
    ELSE
        RAISE NOTICE 'avatar_url column already exists';
    END IF;
END $$;

-- Step 4: Add 'updated_at' column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE profiles ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
        RAISE NOTICE 'Added updated_at column to profiles table';
    ELSE
        RAISE NOTICE 'updated_at column already exists';
    END IF;
END $$;

-- Step 5: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Step 6: Grant admin role to virag@deltasystem.in
UPDATE profiles
SET role = 'admin'
WHERE email = 'virag@deltasystem.in';

-- Step 7: Verify the update worked
SELECT id, email, full_name, role, plan, created_at
FROM profiles
WHERE email = 'virag@deltasystem.in';

-- Expected result:
-- email: virag@deltasystem.in
-- role: admin
-- plan: free

-- ════════════════════════════════════════════════════════════════
-- OPTIONAL: Create trigger to auto-create profile on user signup
-- ════════════════════════════════════════════════════════════════

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role, plan)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        'user',
        'free'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger to auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ════════════════════════════════════════════════════════════════
-- VERIFICATION QUERIES
-- ════════════════════════════════════════════════════════════════

-- Check table structure
SELECT
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- Check all users and their roles
SELECT
    id,
    email,
    full_name,
    role,
    plan,
    created_at
FROM profiles
ORDER BY created_at DESC;

-- ════════════════════════════════════════════════════════════════
-- SUCCESS!
-- ════════════════════════════════════════════════════════════════
-- After running this:
-- 1. ✅ profiles table has 'role' column
-- 2. ✅ virag@deltasystem.in has admin role
-- 3. ✅ New users will auto-create profiles with 'user' role
-- 4. ✅ App should load without errors
-- ════════════════════════════════════════════════════════════════
