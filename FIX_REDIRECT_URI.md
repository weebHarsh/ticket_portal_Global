# Fix Redirect URI Mismatch Error

## The Problem

Azure Portal error: `AADSTS50011: The redirect URI does not match`

This means the redirect URI `http://localhost:4000/api/auth/callback/azure-ad` is not configured in your Azure AD app registration.

## ✅ Solution: Add Redirect URI in Azure Portal

### Step-by-Step Instructions

1. **Go to Azure Portal**
   - Open: https://portal.azure.com
   - Sign in with your Azure account

2. **Navigate to Your App Registration**
   - Click on **Azure Active Directory** (or **Microsoft Entra ID**)
   - Click **App registrations** in the left sidebar
   - Find your app (the one with Client ID: `ad0e861e-e234-4a21-a7f1-5a744d4ed90c`)
   - Click on it to open

3. **Go to Authentication Settings**
   - In the left sidebar, click **Authentication**
   - You'll see a section called **Platform configurations**

4. **Add Web Platform (if not already added)**
   - If you don't see "Web" platform, click **+ Add a platform**
   - Select **Web**
   - Click **Configure**

5. **Add the Redirect URI**
   - Under **Redirect URIs**, click **+ Add URI**
   - Enter exactly this (copy and paste to avoid typos):
     ```
     http://localhost:4000/api/auth/callback/azure-ad
     ```
   - **Important:** 
     - Use `http` NOT `https` for localhost
     - Use port `4000` (not 3000)
     - No trailing slash
     - All lowercase
     - Exact path: `/api/auth/callback/azure-ad`

6. **Save the Changes**
   - Click **Save** at the top
   - Wait 1-2 minutes for changes to propagate

7. **Verify the URI is Added**
   - You should now see the URI in the list:
     ```
     http://localhost:4000/api/auth/callback/azure-ad
     ```

## ✅ Visual Checklist

Your Azure Portal Authentication page should show:

**Platform configurations:**
- ✅ **Web** platform added

**Redirect URIs:**
- ✅ `http://localhost:4000/api/auth/callback/azure-ad`

**Supported account types:**
- ✅ (Your selected option - single/multi-tenant)

## 🔍 Common Mistakes to Avoid

❌ **Wrong:**
- `https://localhost:4000/api/auth/callback/azure-ad` (using https)
- `http://localhost:3000/api/auth/callback/azure-ad` (wrong port)
- `http://localhost:4000/api/auth/callback/azure-ad/` (trailing slash)
- `http://localhost:4000/api/auth/callback/microsoft` (wrong provider name)
- `http://localhost:4000/api/auth/callback/Azure-AD` (wrong case)

✅ **Correct:**
- `http://localhost:4000/api/auth/callback/azure-ad` (exact match)

## 🧪 Test After Fixing

1. **Wait 1-2 minutes** after saving (Azure needs time to propagate changes)

2. **Clear browser cache** (optional but recommended):
   - Press `Ctrl+Shift+Delete`
   - Clear cached images and files
   - Or use Incognito/Private window

3. **Try SSO login again:**
   - Go to: `http://localhost:4000/login`
   - Click "Sign in with Microsoft"
   - Should redirect to Microsoft login (not show error)

## 📸 Screenshot Reference

Your Azure Portal Authentication page should look like this:

```
┌─────────────────────────────────────────┐
│ Authentication                          │
├─────────────────────────────────────────┤
│ Platform configurations                 │
│                                         │
│ [Web]                                   │
│ Redirect URIs:                          │
│ • http://localhost:4000/api/auth/      │
│   callback/azure-ad                     │
│                                         │
│ [ + Add URI ]                           │
└─────────────────────────────────────────┘
```

## 🚨 Still Getting Error?

If you still get the error after adding the URI:

1. **Double-check the URI matches exactly:**
   - Copy from Azure Portal
   - Compare with: `http://localhost:4000/api/auth/callback/azure-ad`
   - Every character must match

2. **Check for multiple redirect URIs:**
   - Make sure you don't have a similar but different URI
   - Remove any incorrect ones

3. **Wait longer:**
   - Sometimes Azure takes 2-3 minutes to propagate
   - Try again after waiting

4. **Check your app registration:**
   - Make sure you're editing the correct app
   - Client ID should be: `ad0e861e-e234-4a21-a7f1-5a744d4ed90c`

5. **Try in Incognito/Private window:**
   - This eliminates browser cache issues

## ✅ Success Indicators

After fixing, you should:
- ✅ See Microsoft login page (not error page)
- ✅ Be able to sign in with Microsoft account
- ✅ Get redirected back to `/dashboard` after login
- ✅ No more `AADSTS50011` error

---

**Once you've added the redirect URI and waited 1-2 minutes, try the SSO login again!**
