# ProposalKit Setup Guide

Complete guide to set up authentication, admin panel, and Figma OAuth.

---

## 🔐 Issue #1: Admin Panel Access

### Where is the Admin Panel?

The admin panel is located at: **`/admin`**

### How to Access It

**Step 1: Grant Admin Role**

You need to set a user's role to `admin` in Supabase:

```sql
-- Run this in Supabase SQL Editor (https://app.supabase.com → SQL Editor)
UPDATE profiles
SET role = 'admin'
WHERE email = 'your-email@example.com';
```

**Available Roles:**
- `admin` - Full admin access
- `superadmin` - Full admin access (same as admin)
- `user` - Regular user (default)

**Step 2: Login and Access**

1. Log into the app with the admin user account
2. The "Admin Panel" button will appear in the sidebar (bottom section, above Settings)
3. Or directly visit: `http://localhost:3000/admin` or `https://your-domain.com/admin`

### What You'll See

The admin panel includes:
- **Dashboard**: User metrics, revenue (MRR/ARR), active subscriptions, tickets
- **Users**: Manage all registered users and their subscriptions
- **Tickets**: View and respond to support tickets
- **Analytics**: Business insights and performance metrics

### Security

- ✅ Only users with `role='admin'` or `role='superadmin'` can access
- ✅ Non-admin users are redirected to dashboard
- ✅ Admin nav button is hidden for regular users
- ✅ All admin actions are logged in `admin_audit_log` table

---

## 🎨 Issue #2: Figma OAuth Setup

### Client ID & Secret Configuration

**Don't edit code for credentials!** Configure them in Supabase Dashboard:

### Step-by-Step Setup

#### 1. Create Figma OAuth App

1. Go to [Figma Settings → Apps](https://www.figma.com/settings)
2. Click **Create a new app**
3. Fill in:
   - **App name**: ProposalKit
   - **Redirect URI**: `https://YOUR_PROJECT.supabase.co/auth/v1/callback`

   Example:
   ```
   https://fhttdaouzyfvfegvrpil.supabase.co/auth/v1/callback
   ```

4. Click **Create app**
5. **Copy** these values:
   - Client ID
   - Client Secret

#### 2. Configure Supabase

1. Open [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Authentication** → **Providers**
4. Find **Figma** and toggle it **ON**
5. Paste:
   - **Client ID**: (from step 1)
   - **Client Secret**: (from step 1)
6. Click **Save**

#### 3. Add Localhost (Development Only)

For local testing, add to Figma app:
```
http://localhost:3000
```

#### 4. Test It

1. Start your app
2. Click the **Figma** button on login screen
3. Authorize on Figma
4. You're logged in! ✅

### Troubleshooting

**"Invalid redirect URI"**
- Check Supabase project URL is correct
- Ensure it ends with `/auth/v1/callback`

**"Figma login failed"**
- Verify Client ID and Secret in Supabase
- Check Figma provider is enabled
- Look for errors in browser console

**More details**: See [FIGMA_OAUTH_SETUP.md](FIGMA_OAUTH_SETUP.md)

---

## 🔒 Issue #3: Force Authentication

### What Changed

✅ **"Continue without account" button has been removed**

Users **MUST** authenticate to use the app. They can choose:
- Email/Phone + Password
- Figma OAuth

### What Happens Now

- Users see the login/signup screen on first visit
- No offline mode bypass
- Data is always synced to Supabase
- No anonymous/guest access

### How to Re-enable Offline Mode (Optional)

If you want to allow offline access later, add this back to `auth.js`:

```javascript
// In getLoginHtml() and getSignupHtml(), before closing </div>:
<div class="auth-offline">
    <button class="btn-outline auth-offline-btn" onclick="skipAuth()">
        <i data-lucide="wifi-off" style="width:16px;height:16px"></i> Continue without account
    </button>
    <div class="auth-offline-hint">Your data stays on this device only</div>
</div>
```

---

## 📋 Quick Reference

### Login Methods

| Method | Field | Example |
|--------|-------|---------|
| Email | `email@example.com` | `admin@proposalkit.com` |
| Phone | `+[country][number]` | `+919876543210` |
| Figma | OAuth button | One-click sign in |

### Admin Setup Checklist

- [ ] Create Supabase account
- [ ] Set up `profiles` table with `role` column
- [ ] Grant admin role to your account (SQL above)
- [ ] Log in and verify admin button appears
- [ ] Test accessing `/admin`

### Figma OAuth Checklist

- [ ] Create Figma OAuth app
- [ ] Copy Client ID & Secret
- [ ] Enable Figma in Supabase → Auth → Providers
- [ ] Paste credentials
- [ ] Test login with Figma button

---

## 🚀 Next Steps

1. **Test authentication**
   - Try email/phone login
   - Try Figma OAuth
   - Verify admin access

2. **Configure Email**
   - Set up email templates in Supabase
   - Configure SMTP for password reset emails

3. **Deploy**
   - Update Figma redirect URL for production
   - Set environment variables
   - Test on production domain

---

## 📚 Resources

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Figma API Docs](https://www.figma.com/developers/api)
- [Admin Panel Schema](supabase-admin-schema.sql)

## ❓ Need Help?

Check these files for more details:
- `FIGMA_OAUTH_SETUP.md` - Detailed Figma setup
- `DIAGNOSTIC.md` - Troubleshooting guide
- `supabase-admin-schema.sql` - Database schema

---

**Last Updated**: 2026-02-14
**Version**: 3.0.0
