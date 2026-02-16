# Create Admin Account for virag@deltasystem.in

Complete step-by-step guide to create your admin account and fix login issues.

---

## 🎯 Quick Setup (3 Steps)

### Step 1: Create User Account in Supabase

You have **3 options** to create the account:

#### **Option A: Use the App Signup (Recommended)**

1. Open your app: `http://localhost:3000` or your deployed URL
2. Click **"Sign up"** in the top-right
3. Fill in:
   - **Name**: Virag (or your name)
   - **Email**: `virag@deltasystem.in`
   - **Password**: Create a strong password (minimum 6 characters)
4. Click **"Sign Up"**

**What happens next:**
- If email confirmation is **disabled**: You'll be logged in immediately ✅
- If email confirmation is **enabled**: You'll need to check your email and click the confirmation link

---

#### **Option B: Use OAuth Login (Instant)**

1. Open your app
2. Click one of these buttons:
   - **Google** (if you have a Google account)
   - **GitHub** (if you have a GitHub account)
   - **Figma** (if you have a Figma account)
3. Authorize the app
4. You're logged in! ✅

**Note:** If you use OAuth with a **different email** (not virag@deltasystem.in), you'll need to update the admin SQL to use that email instead.

---

#### **Option C: Manually Create User in Supabase Dashboard**

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project: `fhttdaouzyfvfegvrpil`
3. Go to **Authentication** → **Users**
4. Click **"Add user"** → **"Create new user"**
5. Fill in:
   - **Email**: `virag@deltasystem.in`
   - **Password**: (choose a password)
   - ✅ **Auto Confirm User** (check this box!)
6. Click **"Create user"**

---

### Step 2: Grant Admin Role

After creating the user, run this SQL to grant admin access:

1. Go to [Supabase Dashboard](https://app.supabase.com) → **SQL Editor**
2. Click **"New query"**
3. Paste this SQL:

```sql
-- Grant admin role to virag@deltasystem.in
UPDATE profiles
SET role = 'admin'
WHERE email = 'virag@deltasystem.in';

-- Verify it worked
SELECT id, email, role, created_at
FROM profiles
WHERE email = 'virag@deltasystem.in';
```

4. Click **"Run"** (or press `Ctrl+Enter`)
5. Check the results — you should see:
   ```
   email: virag@deltasystem.in
   role: admin
   ```

**⚠️ Important:** If the `SELECT` query returns **no rows**, it means the `profiles` table entry wasn't created yet. This can happen if:
- You just signed up (wait 5 seconds and try again)
- The signup trigger isn't working

If still no rows, manually create the profile:

```sql
-- Manually create profile entry
INSERT INTO profiles (id, email, full_name, role)
SELECT id, email, raw_user_meta_data->>'full_name', 'admin'
FROM auth.users
WHERE email = 'virag@deltasystem.in';
```

---

### Step 3: Login and Test

1. Open your app
2. Enter:
   - **Email or Phone**: `virag@deltasystem.in`
   - **Password**: (the password you set)
3. Click **"Sign In"**
4. You should now see the **"Admin Panel"** button in the sidebar (bottom section, above Settings)

---

## 🔍 Troubleshooting Login Issues

If clicking "Sign In" does nothing or shows errors:

### Check Browser Console

1. Open browser **DevTools** (F12 or right-click → Inspect)
2. Go to **Console** tab
3. Click **"Sign In"** again
4. Look for error messages

**Common errors and fixes:**

#### Error: `sb is not defined` or `Supabase client not initialized`

**Fix:** Check `assets/js/core/supabase.js` has correct credentials:

```javascript
const SUPABASE_URL = 'https://fhttdaouzyfvfegvrpil.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key-here';
```

Get your keys from: [Supabase Dashboard](https://app.supabase.com) → **Settings** → **API**

---

#### Error: `Invalid login credentials`

**Possible causes:**
1. Wrong email/password
2. User doesn't exist yet → Go back to **Step 1**
3. Email not confirmed → Check email for confirmation link

**Fix:** Try creating account again via signup or OAuth

---

#### Error: `Email not confirmed`

**Fix:** Two options:
1. Check email for confirmation link and click it
2. Or disable email confirmation in Supabase:
   - [Supabase Dashboard](https://app.supabase.com) → **Authentication** → **Providers**
   - Find **Email** → Toggle **"Enable email confirmations"** OFF
   - Try signing up again

---

#### Error: `User already registered`

This is **good news** — it means the account exists!

**Fix:** Use the **login** form (not signup):
1. Click **"Login"** in top-right
2. Enter `virag@deltasystem.in` and your password
3. If you forgot the password, click **"Forgot password?"**

---

#### Button click does nothing (no error)

**Possible causes:**
1. JavaScript not loaded
2. Function not exported

**Fix:** Check browser console for errors when page loads. If you see `doLogin is not defined`, check this line in `auth.js`:

```javascript
/* exported initAuth, onSignedIn, doLogin, doSignup, doGoogleLogin, doGithubLogin, doFigmaLogin, doPasswordReset, skipAuth, doLogout, authMode */
```

---

#### Error: `profiles table does not exist`

**Fix:** The profiles table needs to be created. Run this SQL in Supabase:

```sql
-- Create profiles table
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

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Create trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        'user'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();
```

---

## 🚀 Alternative: Complete Reset & Setup

If nothing works, here's a **complete fresh start**:

### 1. Clear Supabase Data

```sql
-- Remove all existing users (⚠️ BE CAREFUL - THIS DELETES ALL USERS)
DELETE FROM auth.users;
DELETE FROM profiles;
```

### 2. Recreate Tables

```sql
-- Run the profiles table SQL from above
-- (See "Error: profiles table does not exist" section)
```

### 3. Create Admin User via SQL

```sql
-- This creates user in auth.users AND profiles with admin role
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_user_meta_data,
    created_at,
    updated_at
)
VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'virag@deltasystem.in',
    crypt('YourPasswordHere', gen_salt('bf')), -- Replace YourPasswordHere
    NOW(),
    '{"full_name": "Virag"}',
    NOW(),
    NOW()
)
RETURNING id;

-- Then grant admin role (use the ID from above result)
UPDATE profiles
SET role = 'admin'
WHERE email = 'virag@deltasystem.in';
```

**⚠️ Warning:** Replace `YourPasswordHere` with your actual password!

---

## ✅ Success Checklist

After completing the steps above:

- [ ] User account created in Supabase (via signup/OAuth/manual)
- [ ] Email confirmed (if confirmation is enabled)
- [ ] Admin role granted via SQL
- [ ] Can login successfully with email + password
- [ ] "Admin Panel" button appears in sidebar
- [ ] Can access `/admin` route

---

## 📋 Quick Reference

### Login Credentials
- **Email**: `virag@deltasystem.in`
- **Password**: (the one you set during signup)

### Supabase Project
- **Project ID**: `fhttdaouzyfvfegvrpil`
- **URL**: `https://fhttdaouzyfvfegvrpil.supabase.co`
- **Dashboard**: https://app.supabase.com

### Admin SQL (Grant Role)
```sql
UPDATE profiles SET role = 'admin' WHERE email = 'virag@deltasystem.in';
```

### Admin SQL (Verify)
```sql
SELECT email, role FROM profiles WHERE email = 'virag@deltasystem.in';
```

---

## 🆘 Still Not Working?

If you're still having issues:

1. **Check Supabase Status**: https://status.supabase.com
2. **Check Browser Console**: F12 → Console tab
3. **Check Supabase Logs**: Dashboard → Logs → Auth Logs
4. **Verify API Keys**: Dashboard → Settings → API

### Share These Details:

When asking for help, provide:
- Browser console errors (screenshot)
- Supabase auth logs (last 5 entries)
- Result of this SQL query:
  ```sql
  SELECT email, role, created_at FROM profiles WHERE email = 'virag@deltasystem.in';
  ```

---

**Last Updated**: 2026-02-14
**Support**: Check SETUP_GUIDE.md and OAUTH_SETUP_FINAL.md for more details
