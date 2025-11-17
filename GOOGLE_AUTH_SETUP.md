# Google OAuth Setup Guide

This guide will help you set up Google sign-in for your admin panel.

## Step 1: Create Google OAuth Credentials

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth client ID**
5. If prompted, configure the OAuth consent screen:
   - Choose **External** (unless you have a Google Workspace)
   - Fill in the required information (App name, User support email, etc.)
   - Add your email to test users if needed
   - Save and continue through the scopes and test users screens
6. For **Application type**, select **Web application**
7. Give it a name (e.g., "Millies Calendar Admin")
8. Add **Authorized JavaScript origins**:
   - For local development: `http://localhost:3000`
   - For production: `https://your-render-app.onrender.com` (your actual Render URL)
9. Add **Authorized redirect URIs**:
   - For local development: `http://localhost:3000/api/auth/google/callback`
   - For production: `https://your-render-app.onrender.com/api/auth/google/callback`
10. Click **Create**
11. Copy the **Client ID** and **Client Secret**

## Step 2: Configure Allowed Admin Emails

You need to specify which email addresses are allowed to access the admin panel. You can do this in two ways:

### Option A: Environment Variable (Recommended)

Set the `ALLOWED_ADMIN_EMAILS` environment variable in Render with a comma-separated list:

```
ALLOWED_ADMIN_EMAILS=user1@example.com,user2@example.com,user3@example.com
```

### Option B: Edit server.js

Edit the `ALLOWED_ADMIN_EMAILS` array in `server.js` (around line 30):

```javascript
const ALLOWED_ADMIN_EMAILS = [
  'user1@example.com',
  'user2@example.com',
  'user3@example.com'
];
```

## Step 3: Add Environment Variables to Render

In your Render dashboard, go to your service and add these environment variables:

1. **GOOGLE_CLIENT_ID** - Your Google OAuth Client ID
2. **GOOGLE_CLIENT_SECRET** - Your Google OAuth Client Secret
3. **ALLOWED_ADMIN_EMAILS** - Comma-separated list of allowed emails (e.g., `email1@example.com,email2@example.com,email3@example.com`)
4. **BASE_URL** - Your Render app URL (e.g., `https://your-app.onrender.com`)
5. **SESSION_SECRET** - A random secret string for session encryption (optional, will use JWT_SECRET if not set)

## Step 4: Test the Setup

1. Deploy your changes to Render
2. Visit your admin page: `https://your-app.onrender.com/admin.html`
3. Click "Sign in with Google"
4. Sign in with one of your allowed email addresses
5. You should be redirected back to the admin panel

## Troubleshooting

### "Email not authorized" error
- Make sure the email you're signing in with is in the `ALLOWED_ADMIN_EMAILS` list
- Check that the email is spelled correctly (case-insensitive)

### Redirect URI mismatch
- Make sure the redirect URI in Google Cloud Console exactly matches your callback URL
- For production: `https://your-app.onrender.com/api/auth/google/callback`
- Check for trailing slashes and HTTP vs HTTPS

### Google sign-in button not showing
- Check that `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set in your environment variables
- Check the server logs for any errors

### Session not persisting
- Make sure `SESSION_SECRET` is set in production
- Check that cookies are enabled in your browser
- In production, ensure your Render app is using HTTPS (required for secure cookies)

## Security Notes

- Never commit your Google OAuth credentials to git
- Use environment variables for all sensitive data
- Regularly rotate your OAuth secrets
- Only add trusted email addresses to the allowed list
- The regular username/password login still works as a fallback

