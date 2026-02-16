# 🚨 URGENT FIX - Missing 'role' Column

## The Problem

Your error:
```
ERROR: column "role" of relation "profiles" does not exist
```

**Cause:** The `profiles` table exists but is missing the `role` column.

---

## ✅ QUICK FIX (2 Minutes)

### Step 1: Open Supabase SQL Editor

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project: `fhttdaouzyfvfegvrpil`
3. Click **SQL Editor** in the left sidebar
4. Click **"New query"**

### Step 2: Run This SQL

**Copy and paste this ENTIRE script:**

```sql
-- Add missing 'role' column
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- Add missing 'plan' column
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'free';

-- Add missing 'avatar_url' column
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Add missing 'updated_at' column
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Grant admin role to your account
UPDATE profiles
SET role = 'admin'
WHERE email = 'virag@deltasystem.in';

-- Verify it worked
SELECT id, email, full_name, role, plan, created_at
FROM profiles
WHERE email = 'virag@deltasystem.in';
```

### Step 3: Click "Run" (or press Ctrl+Enter)

You should see:
```
✅ Success
email: virag@deltasystem.in
role: admin
```

### Step 4: Refresh Your App

1. Go back to your app: `http://localhost:3000`
2. Hard refresh: `Ctrl+Shift+R` / `Cmd+Shift+R`
3. ✅ Error should be GONE!

---

## 📋 Alternative: Use the Complete Script

I've created a comprehensive SQL file: **[FIX_PROFILES_TABLE.sql](FIX_PROFILES_TABLE.sql)**

This script:
- ✅ Adds all missing columns safely (won't break if columns exist)
- ✅ Creates indexes for performance
- ✅ Grants admin role to virag@deltasystem.in
- ✅ Sets up auto-profile creation trigger
- ✅ Includes verification queries

**To use it:**
1. Open [FIX_PROFILES_TABLE.sql](FIX_PROFILES_TABLE.sql)
2. Copy the entire content
3. Paste in Supabase SQL Editor
4. Click "Run"

---

## ✅ Expected Results

After running the SQL:

1. ✅ `profiles` table has `role` column
2. ✅ `virag@deltasystem.in` has `role = 'admin'`
3. ✅ App loads without "Something went wrong" error
4. ✅ "Admin Panel" button appears in sidebar
5. ✅ Can access `/admin` route

---

## 🔍 Why This Happened

The `profiles` table was likely created manually or by a different trigger that didn't include the `role` column. The app expects:

**Required columns in `profiles` table:**
- `id` (UUID, primary key)
- `email` (TEXT)
- `full_name` (TEXT)
- `role` (TEXT) ← **This was missing!**
- `plan` (TEXT)
- `avatar_url` (TEXT, optional)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

---

## 🆘 If SQL Fails

If you get an error when running the SQL:

### Error: "permission denied for table profiles"

**Fix:** Run this first to grant permissions:
```sql
GRANT ALL ON TABLE profiles TO authenticated;
GRANT ALL ON TABLE profiles TO service_role;
```

### Error: "relation profiles does not exist"

**Fix:** The profiles table doesn't exist at all. Run this complete schema:

```sql
-- Create profiles table from scratch
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'user',
    plan TEXT DEFAULT 'free',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Grant admin role
UPDATE profiles SET role = 'admin' WHERE email = 'virag@deltasystem.in';
```

---

## 🎯 Next Steps After Fix

Once the SQL runs successfully:

1. ✅ **Refresh your app** - Error should be gone
2. ✅ **Try logging in** with email + password or OAuth
3. ✅ **Check for Admin Panel button** in sidebar
4. ✅ **Visit `/admin`** to confirm access

---

## 📞 Verification Query

After fixing, run this to verify everything is correct:

```sql
-- Check table structure
SELECT
    column_name,
    data_type,
    column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- Check your user
SELECT
    email,
    role,
    plan,
    created_at
FROM profiles
WHERE email = 'virag@deltasystem.in';
```

Expected output:
```
Columns: id, email, full_name, avatar_url, role, plan, created_at, updated_at

User:
email: virag@deltasystem.in
role: admin
plan: free
```

---

## ✅ TL;DR

**3 Quick Steps:**

1. Open Supabase SQL Editor
2. Run: `ALTER TABLE profiles ADD COLUMN role TEXT DEFAULT 'user';`
3. Run: `UPDATE profiles SET role = 'admin' WHERE email = 'virag@deltasystem.in';`

**Done!** Refresh your app - error should be gone! 🎉

---

**Last Updated**: 2026-02-14
**Issue**: Missing `role` column in `profiles` table
**Solution**: [FIX_PROFILES_TABLE.sql](FIX_PROFILES_TABLE.sql)
