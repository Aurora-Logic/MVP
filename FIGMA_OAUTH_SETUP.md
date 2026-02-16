# Figma OAuth Setup Guide

This guide explains how to configure Figma authentication for ProposalKit.

## 📋 Prerequisites

1. A Figma account
2. Access to your Supabase project dashboard
3. Your app's redirect URL

## 🔧 Step 1: Create Figma OAuth App

1. Go to [Figma Account Settings](https://www.figma.com/settings)
2. Navigate to **Apps** section
3. Click **Create a new app**
4. Fill in the details:
   - **App name**: ProposalKit (or your app name)
   - **App description**: Professional proposal builder
   - **Redirect URI**: `https://YOUR_SUPABASE_PROJECT.supabase.co/auth/v1/callback`

   **Example redirect URI**:
   ```
   https://fhttdaouzyfvfegvrpil.supabase.co/auth/v1/callback
   ```

5. Click **Create app**
6. **Copy** your:
   - **Client ID** (e.g., `Ab1c2D3e4F5g6H7i8J9k`)
   - **Client Secret** (e.g., `aBcDeFgHiJkLmNoPqRsTuVwXyZ123456`)

⚠️ **Important**: Keep your Client Secret secure! Never commit it to version control.

## 🔐 Step 2: Configure Supabase

1. Open [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **Authentication** → **Providers**
4. Scroll down to **Figma**
5. Toggle **Enable Figma**
6. Enter your credentials:
   - **Client ID**: Paste from Step 1
   - **Client Secret**: Paste from Step 1
7. Click **Save**

## 📱 Step 3: Update Redirect URLs (Optional)

For local development, add localhost to Figma app:

1. Go back to Figma app settings
2. Add additional redirect URI:
   ```
   http://localhost:3000
   ```

## ✅ Step 4: Test Authentication

1. Start your app: `npm start` or open `index.html`
2. Click **Figma** button on login screen
3. You'll be redirected to Figma's authorization page
4. Click **Allow access**
5. You should be redirected back and logged in!

## 🔍 Troubleshooting

### Error: "Invalid redirect URI"
- Double-check the redirect URI in Figma app settings
- Ensure it matches: `https://YOUR_PROJECT.supabase.co/auth/v1/callback`

### Error: "Invalid client credentials"
- Verify Client ID and Secret are correct
- Re-enter them in Supabase (copy-paste errors are common)

### Error: "Figma login failed"
- Check browser console for detailed error
- Ensure Figma provider is enabled in Supabase
- Verify your app has the correct permissions

### Still not working?
1. Check Supabase logs: **Logs** → **Auth Logs**
2. Enable debug mode in browser DevTools
3. Look for errors in the console

## 📚 Additional Resources

- [Figma OAuth Documentation](https://www.figma.com/developers/api#oauth2)
- [Supabase Auth Providers](https://supabase.com/docs/guides/auth/social-login)
- [Figma API Scopes](https://www.figma.com/developers/api#authentication-scopes)

## 🎨 Available Scopes

ProposalKit uses `file_read` scope by default. Available scopes:

- `file_read` - Read files and metadata
- `file_write` - Create and edit files (not needed for auth)

To change scopes, edit `assets/js/core/auth.js`:

```javascript
async function doFigmaLogin() {
    // ...
    const { error } = await sb().auth.signInWithOAuth({
        provider: 'figma',
        options: {
            redirectTo: redirectUrl,
            scopes: 'file_read file_write' // Add more scopes
        }
    });
}
```
