# Next Steps After Environment Variables Setup

Great! You've set up all the environment variables in `.env.local`. Here's what's left to do:

## ✅ What You've Completed

- [x] Environment variables configured in `.env.local`

## 📋 Remaining Steps

### Step 1: Verify Environment Variables Format

Quick check - make sure your `.env.local` looks like this (with your actual values):

```env
# Database (should already exist)
DATABASE_URL=postgresql://...

# NextAuth Configuration
AUTH_SECRET=your-secret-here
NEXTAUTH_URL=http://localhost:4000
NEXTAUTH_URL_INTERNAL=http://localhost:4000

# Microsoft SSO Configuration
MICROSOFT_CLIENT_ID=your-client-id-guid
MICROSOFT_CLIENT_SECRET=your-client-secret
MICROSOFT_TENANT_ID=common
```

**Important Checks:**
- ✅ No quotes around values (e.g., `AUTH_SECRET=abc123` not `AUTH_SECRET="abc123"`)
- ✅ No spaces around `=` sign
- ✅ No trailing spaces
- ✅ All values are on single lines (no line breaks)

---

### Step 2: Run Database Migration ⚠️ **CRITICAL**

The database needs to be updated to support SSO users. This is **required** before SSO will work.

**Option A: Using Neon Console (Easiest)**
1. Go to [Neon Console](https://console.neon.tech)
2. Select your project
3. Click **SQL Editor**
4. Open the file: `scripts/015-add-sso-support.sql`
5. Copy all the SQL code
6. Paste into SQL Editor
7. Click **Run**

**Option B: Using Database Tool**
1. Open your database tool (pgAdmin, DBeaver, etc.)
2. Connect to your database
3. Open file: `scripts/015-add-sso-support.sql`
4. Execute the script

**Option C: Command Line**
```bash
psql $DATABASE_URL -f scripts/015-add-sso-support.sql
```

**Verify Migration:**
Run this query in your database:
```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('auth_provider', 'microsoft_id', 'email_verified');
```

Should return 3 rows. If you get fewer, migration didn't run successfully.

---

### Step 3: Set Up Azure AD App Registration ⚠️ **REQUIRED**

If you haven't created the Azure AD app registration yet, you need to do this. The environment variables won't work without it.

**Quick Checklist:**
- [ ] App registration created in Azure Portal
- [ ] Client ID copied to `MICROSOFT_CLIENT_ID`
- [ ] Client secret created and copied to `MICROSOFT_CLIENT_SECRET`
- [ ] Redirect URI added: `http://localhost:4000/api/auth/callback/azure-ad`
- [ ] API permissions added: `User.Read`, `email`, `profile`

**Detailed Steps:** See `SSO_SETUP_GUIDE.md` → Step 2 (pages 63-152)

**If you've already done this:** Skip to Step 4

---

### Step 4: Restart Development Server 🔄

**IMPORTANT:** Environment variables are only loaded when the server starts.

1. **Stop** your current server (press `Ctrl+C` in terminal)
2. **Start** it again:
   ```bash
   npm run dev
   ```
3. Check for any errors in the console

**What to look for:**
- ✅ Server starts without errors
- ✅ No "Missing environment variable" errors
- ✅ Server running on `http://localhost:4000`

---

### Step 5: Test SSO Login 🧪

1. Open browser: `http://localhost:4000/login`
2. Look for **"Sign in with Microsoft"** button
3. Click the button
4. Should redirect to Microsoft login
5. Sign in with your Microsoft account
6. Should redirect back to `/dashboard`

**If it works:** ✅ SSO is configured correctly!

**If you get errors:** See troubleshooting below

---

## 🔍 Troubleshooting

### Error: "Redirect URI mismatch"

**Problem:** The redirect URI in Azure Portal doesn't match.

**Fix:**
1. Go to Azure Portal → Your App → Authentication
2. Add redirect URI: `http://localhost:4000/api/auth/callback/azure-ad`
3. Make sure it's exactly this (no trailing slash, lowercase)
4. Save and try again

### Error: "Invalid client secret"

**Problem:** Client secret is wrong or expired.

**Fix:**
1. Go to Azure Portal → Your App → Certificates & secrets
2. Check if secret is expired
3. Create a new secret if expired
4. Update `MICROSOFT_CLIENT_SECRET` in `.env.local`
5. Restart server

### Error: "Application not found"

**Problem:** Client ID is wrong.

**Fix:**
1. Verify `MICROSOFT_CLIENT_ID` in Azure Portal → Overview → Application (client) ID
2. Make sure it matches exactly (GUID format)
3. Check for typos or extra spaces

### Error: "User not created in database"

**Problem:** Database migration not run.

**Fix:**
1. Run Step 2 (Database Migration) above
2. Verify migration with the SQL query
3. Try SSO login again

### SSO Button Not Visible

**Problem:** Code not updated or server error.

**Fix:**
1. Check browser console for errors (F12)
2. Check server logs for errors
3. Verify `components/auth/login-form.tsx` has the SSO button
4. Restart server

---

## ✅ Quick Status Check

Answer these questions:

1. **Database Migration:**
   - [ ] Have you run `scripts/015-add-sso-support.sql`?
   - [ ] Can you verify the 3 new columns exist?

2. **Azure AD Setup:**
   - [ ] Have you created the app registration in Azure Portal?
   - [ ] Do you have the Client ID and Client Secret?
   - [ ] Have you added the redirect URI?

3. **Server:**
   - [ ] Have you restarted the server after adding environment variables?
   - [ ] Is the server running without errors?

4. **Testing:**
   - [ ] Can you see the "Sign in with Microsoft" button?
   - [ ] Have you tried clicking it?

---

## 🎯 What to Do Right Now

**If you haven't done the database migration:**
→ Do **Step 2** above (Run Database Migration)

**If you haven't set up Azure AD:**
→ Do **Step 3** above (Set Up Azure AD App Registration)
→ Or follow detailed guide: `SSO_SETUP_GUIDE.md` → Step 2

**If both are done:**
→ Do **Step 4** (Restart Server)
→ Then **Step 5** (Test SSO Login)

---

## 📞 Still Having Issues?

1. Check which step you're on
2. Review the troubleshooting section above
3. Check server logs for specific error messages
4. Verify each step in `SSO_SETUP_CHECKLIST.md`

---

**You're almost there!** Once you complete the database migration and Azure AD setup, SSO should work. Let me know which step you need help with!
