# SSO Troubleshooting Guide - OAuthSignin Error

You're getting `error=OAuthSignin` which means the OAuth flow failed. Here's how to fix it:

## 🔍 Common Causes

### 1. Missing or Incorrect Environment Variables

**Check your `.env.local` file:**

```env
# All of these MUST be present and correct:
AUTH_SECRET=your-secret-here
MICROSOFT_CLIENT_ID=your-client-id-guid
MICROSOFT_CLIENT_SECRET=your-client-secret
MICROSOFT_TENANT_ID=common
NEXTAUTH_URL=http://localhost:4000
```

**Common Issues:**
- ❌ Missing `AUTH_SECRET`
- ❌ Missing `MICROSOFT_CLIENT_ID`
- ❌ Missing `MICROSOFT_CLIENT_SECRET`
- ❌ Wrong `MICROSOFT_CLIENT_ID` (not a valid GUID)
- ❌ Expired `MICROSOFT_CLIENT_SECRET`
- ❌ Quotes around values (should be `AUTH_SECRET=abc123` not `AUTH_SECRET="abc123"`)
- ❌ Spaces around `=` sign
- ❌ Server not restarted after adding env variables

**Fix:**
1. Verify all 6 variables are in `.env.local`
2. Check server logs when starting - you should see validation messages
3. Restart server: `npm run dev`

---

### 2. Incorrect Redirect URI in Azure Portal

**The redirect URI MUST match exactly:**

```
http://localhost:4000/api/auth/callback/azure-ad
```

**Check in Azure Portal:**
1. Go to Azure Portal → Your App Registration
2. Click **Authentication** in left sidebar
3. Under **Redirect URIs**, verify you have:
   - `http://localhost:4000/api/auth/callback/azure-ad`
   - **Exactly this** (no trailing slash, lowercase, http not https)

**Common Mistakes:**
- ❌ Using `https` instead of `http` for localhost
- ❌ Wrong port number (should be 4000)
- ❌ Trailing slash: `/api/auth/callback/azure-ad/` ❌
- ❌ Wrong provider name: `/callback/microsoft` ❌ (should be `azure-ad`)

**Fix:**
1. Go to Azure Portal → Authentication
2. Add/edit redirect URI: `http://localhost:4000/api/auth/callback/azure-ad`
3. Click **Save**
4. Wait 1-2 minutes for changes to propagate
5. Try again

---

### 3. Missing API Permissions

**Check in Azure Portal:**
1. Go to Azure Portal → Your App Registration
2. Click **API permissions** in left sidebar
3. Verify you have these **Delegated permissions**:
   - ✅ `User.Read` (Microsoft Graph)
   - ✅ `email` (Microsoft Graph)
   - ✅ `profile` (Microsoft Graph)

**If missing:**
1. Click **+ Add a permission**
2. Select **Microsoft Graph**
3. Select **Delegated permissions**
4. Add: `User.Read`, `email`, `profile`
5. Click **Grant admin consent** (if you see a warning)

---

### 4. Client Secret Expired

**Check in Azure Portal:**
1. Go to Azure Portal → Your App Registration
2. Click **Certificates & secrets**
3. Check the **Expires** column for your client secret
4. If expired, create a new one

**Fix:**
1. Create new client secret
2. Copy the **Value** (only shown once!)
3. Update `MICROSOFT_CLIENT_SECRET` in `.env.local`
4. Restart server

---

### 5. Wrong Client ID

**Verify:**
1. Go to Azure Portal → Your App Registration → **Overview**
2. Copy the **Application (client) ID**
3. Compare with `MICROSOFT_CLIENT_ID` in `.env.local`
4. Must match exactly (GUID format: `12345678-1234-1234-1234-123456789abc`)

---

## 🔧 Step-by-Step Debugging

### Step 1: Check Server Logs

When you start the server (`npm run dev`), look for these messages:

**Good (all variables present):**
```
✅ No error messages about missing variables
```

**Bad (missing variables):**
```
❌ MICROSOFT_CLIENT_ID is missing from environment variables
❌ MICROSOFT_CLIENT_SECRET is missing from environment variables
❌ AUTH_SECRET is missing from environment variables
```

**If you see errors:** Fix the missing variables and restart server.

---

### Step 2: Verify Environment Variables Format

Open `.env.local` and verify:

```env
# ✅ CORRECT FORMAT:
AUTH_SECRET=abc123xyz789...
MICROSOFT_CLIENT_ID=12345678-1234-1234-1234-123456789abc
MICROSOFT_CLIENT_SECRET=abc~def123456789...
MICROSOFT_TENANT_ID=common
NEXTAUTH_URL=http://localhost:4000
NEXTAUTH_URL_INTERNAL=http://localhost:4000

# ❌ WRONG FORMATS:
AUTH_SECRET="abc123"          # ❌ No quotes
AUTH_SECRET = abc123           # ❌ No spaces around =
MICROSOFT_CLIENT_ID=           # ❌ Empty value
```

---

### Step 3: Test Environment Variables

Create a test file to verify variables are loaded:

**Create:** `test-env.js` (temporary file)

```javascript
require('dotenv').config({ path: '.env.local' })

console.log('AUTH_SECRET:', process.env.AUTH_SECRET ? '✅ Present' : '❌ Missing')
console.log('MICROSOFT_CLIENT_ID:', process.env.MICROSOFT_CLIENT_ID ? '✅ Present' : '❌ Missing')
console.log('MICROSOFT_CLIENT_SECRET:', process.env.MICROSOFT_CLIENT_SECRET ? '✅ Present' : '❌ Missing')
console.log('MICROSOFT_TENANT_ID:', process.env.MICROSOFT_TENANT_ID || 'common')
console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL || '❌ Missing')
```

Run: `node test-env.js`

All should show ✅ Present. If any show ❌ Missing, fix that variable.

**Delete the test file after:** `rm test-env.js`

---

### Step 4: Verify Azure Portal Configuration

**Checklist:**

- [ ] App registration exists
- [ ] Client ID matches `.env.local`
- [ ] Client secret is not expired
- [ ] Redirect URI: `http://localhost:4000/api/auth/callback/azure-ad`
- [ ] API permissions: `User.Read`, `email`, `profile`
- [ ] Admin consent granted (if required)

---

### Step 5: Check Browser Console

1. Open browser Developer Tools (F12)
2. Go to **Console** tab
3. Click "Sign in with Microsoft"
4. Look for any JavaScript errors
5. Share any red error messages

---

### Step 6: Check Network Tab

1. Open browser Developer Tools (F12)
2. Go to **Network** tab
3. Click "Sign in with Microsoft"
4. Look for failed requests (red)
5. Click on failed requests to see error details
6. Check the **Response** tab for error messages

---

## 🎯 Quick Fix Checklist

Run through this checklist:

1. [ ] All 6 environment variables in `.env.local`
2. [ ] No quotes around values
3. [ ] No spaces around `=` sign
4. [ ] Server restarted after adding env variables
5. [ ] Redirect URI in Azure Portal: `http://localhost:4000/api/auth/callback/azure-ad`
6. [ ] Client secret not expired
7. [ ] API permissions added and consented
8. [ ] Client ID matches Azure Portal

---

## 📞 Still Not Working?

If you've checked everything above:

1. **Share your server logs** - What do you see when starting the server?
2. **Share browser console errors** - Any JavaScript errors?
3. **Share network tab** - Any failed requests?
4. **Verify Azure Portal** - Screenshot of Authentication page showing redirect URIs

---

## 🔄 Common Solutions

### Solution 1: Restart Everything

```bash
# Stop server (Ctrl+C)
# Wait 5 seconds
npm run dev
# Clear browser cache (Ctrl+Shift+Delete)
# Try again
```

### Solution 2: Recreate Client Secret

1. Azure Portal → Certificates & secrets
2. Delete old secret (if expired)
3. Create new secret
4. Update `.env.local`
5. Restart server

### Solution 3: Double-Check Redirect URI

1. Azure Portal → Authentication
2. Remove all redirect URIs
3. Add only: `http://localhost:4000/api/auth/callback/azure-ad`
4. Save
5. Wait 2 minutes
6. Try again

---

**Most Common Issue:** Missing or incorrect environment variables. Check your `.env.local` file first!
