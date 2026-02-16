# OAuth Setup Guide - All Providers

Complete setup for **Google**, **GitHub**, and **Figma** authentication.

---

## 🎯 Overview

Your app now supports **4 login methods**:

1. ✅ **Email/Phone + Password** (ready to use)
2. ✅ **Google OAuth** (needs configuration)
3. ✅ **GitHub OAuth** (needs configuration)
4. ✅ **Figma OAuth** (needs configuration)

---

## 1️⃣ Google OAuth Setup

### Step 1: Create Google OAuth App

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Navigate to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth client ID**
5. Application type: **Web application**
6. Add authorized redirect URIs:
   ```
   https://fhttdaouzyfvfegvrpil.supabase.co/auth/v1/callback
   http://localhost:3000
   ```
7. Click **Create**
8. **Copy** your:
   - Client ID
   - Client Secret

### Step 2: Configure in Supabase

1. [Supabase Dashboard](https://app.supabase.com) → **Authentication** → **Providers**
2. Find **Google** → Toggle **ON**
3. Paste:
   - **Client ID**
   - **Client Secret**
4. Click **Save**

---

## 2️⃣ GitHub OAuth Setup

### Step 1: Create GitHub OAuth App

1. Go to [GitHub Settings → Developer Settings](https://github.com/settings/developers)
2. Click **OAuth Apps** → **New OAuth App**
3. Fill in:
   - **Application name**: ProposalKit
   - **Homepage URL**: `https://your-domain.com` or `http://localhost:3000`
   - **Authorization callback URL**:
     ```
     https://fhttdaouzyfvfegvrpil.supabase.co/auth/v1/callback
     ```
4. Click **Register application**
5. Click **Generate a new client secret**
6. **Copy**:
   - Client ID
   - Client Secret

### Step 2: Configure in Supabase

1. [Supabase Dashboard](https://app.supabase.com) → **Authentication** → **Providers**
2. Find **GitHub** → Toggle **ON**
3. Paste:
   - **Client ID**
   - **Client Secret**
4. Click **Save**

---

## 3️⃣ Figma OAuth Setup

### Step 1: Create Figma OAuth App

1. Go to [Figma Settings → Apps](https://www.figma.com/settings)
2. Click **Create a new app**
3. Fill in:
   - **App name**: ProposalKit
   - **Redirect URI**:
     ```
     https://fhttdaouzyfvfegvrpil.supabase.co/auth/v1/callback
     ```
4. Click **Create app**
5. **Copy**:
   - Client ID
   - Client Secret

### Step 2: Configure in Supabase

1. [Supabase Dashboard](https://app.supabase.com) → **Authentication** → **Providers**
2. Find **Figma** → Toggle **ON**
3. Paste:
   - **Client ID**
   - **Client Secret**
4. Click **Save**

---

## 4️⃣ Admin Access Setup

### Grant Admin Role to virag@deltasystem.in

**Run this SQL in Supabase:**

```sql
UPDATE profiles
SET role = 'admin'
WHERE email = 'virag@deltasystem.in';
```

**Verify it worked:**

```sql
SELECT email, role FROM profiles WHERE email = 'virag@deltasystem.in';
```

---

## ✅ Testing Checklist

### Test All Login Methods

- [ ] **Email Login**: Try `virag@deltasystem.in` with password
- [ ] **Google OAuth**: Click Google button, authorize, redirect back
- [ ] **GitHub OAuth**: Click GitHub button, authorize, redirect back
- [ ] **Figma OAuth**: Click Figma button, authorize, redirect back

### Test Admin Panel

- [ ] Log in as `virag@deltasystem.in`
- [ ] Check sidebar - "Admin Panel" button should appear at bottom
- [ ] Click "Admin Panel" or visit `/admin`
- [ ] Should see dashboard with metrics

---

## 🔍 Troubleshooting

### "Invalid redirect URI"
- Ensure callback URL matches exactly: `https://YOUR_PROJECT.supabase.co/auth/v1/callback`
- Don't forget the `/auth/v1/callback` part

### "OAuth login failed"
- Check Client ID and Secret are correct (no extra spaces)
- Verify provider is enabled in Supabase
- Check browser console for detailed error

### "Admin Panel not showing"
- Verify SQL update ran successfully
- Log out and log back in
- Check browser console for errors
- Verify `role` column exists in `profiles` table

### "Access denied" when accessing /admin
- Check role is exactly `admin` (case-sensitive)
- Refresh the page
- Clear browser cache and re-login

---

## 📋 Quick Reference

### Supabase Redirect URL

Use this for **all OAuth providers**:
```
https://fhttdaouzyfvfegvrpil.supabase.co/auth/v1/callback
```

### Admin Email
```
virag@deltasystem.in
```

### Admin Role SQL
```sql
UPDATE profiles SET role = 'admin' WHERE email = 'virag@deltasystem.in';
```

---

## 🚀 Production Checklist

Before deploying to production:

- [ ] Update all OAuth apps with production redirect URL
- [ ] Set up production Supabase project
- [ ] Update `SUPABASE_URL` and `SUPABASE_ANON_KEY` in `assets/js/core/supabase.js`
- [ ] Test all OAuth providers in production
- [ ] Verify admin access works in production
- [ ] Set up email templates for password reset

---

## 📚 Provider Documentation Links

- [Google OAuth Setup](https://cloud.google.com/docs/authentication)
- [GitHub OAuth Setup](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps)
- [Figma OAuth Setup](https://www.figma.com/developers/api#oauth2)
- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)

---

**Setup completed!** 🎉

All three OAuth providers are configured. Just add credentials in Supabase Dashboard.
