# Microsoft SSO Setup Checklist

Use this checklist to verify your SSO setup is complete. Check off each item as you complete it.

## ✅ Environment Variables Check

Verify you have all required environment variables in your `.env.local` file:

### Required Variables:

- [ ] **AUTH_SECRET**
  - ✅ Present: `AUTH_SECRET=...`
  - ❌ Missing: Generate one using:
    - Windows PowerShell: `[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))`
    - Mac/Linux: `openssl rand -base64 32`
    - Online: https://generate-secret.vercel.app/32

- [ ] **MICROSOFT_CLIENT_ID**
  - ✅ Present: `MICROSOFT_CLIENT_ID=...` (should be a GUID like `12345678-1234-1234-1234-123456789abc`)
  - ❌ Missing: Get from Azure Portal → App Registration → Overview → Application (client) ID

- [ ] **MICROSOFT_CLIENT_SECRET**
  - ✅ Present: `MICROSOFT_CLIENT_SECRET=...` (should be a long string)
  - ❌ Missing: Create in Azure Portal → App Registration → Certificates & secrets → New client secret

- [ ] **MICROSOFT_TENANT_ID**
  - ✅ Present: `MICROSOFT_TENANT_ID=common` or `MICROSOFT_TENANT_ID=your-tenant-id`
  - ❌ Missing: Use `common` for multi-tenant, or get from Azure Portal → App Registration → Overview → Directory (tenant) ID

- [ ] **NEXTAUTH_URL**
  - ✅ Present: `NEXTAUTH_URL=http://localhost:4000` (for development)
  - ❌ Missing: Add `NEXTAUTH_URL=http://localhost:4000`

- [ ] **NEXTAUTH_URL_INTERNAL**
  - ✅ Present: `NEXTAUTH_URL_INTERNAL=http://localhost:4000` (optional but recommended)
  - ❌ Missing: Add `NEXTAUTH_URL_INTERNAL=http://localhost:4000`

- [ ] **DATABASE_URL**
  - ✅ Present: `DATABASE_URL=postgresql://...` (should already exist)
  - ❌ Missing: Add your database connection string

### Example Complete .env.local:

```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/database

# NextAuth Configuration
AUTH_SECRET=your-generated-secret-here-minimum-32-characters
NEXTAUTH_URL=http://localhost:4000
NEXTAUTH_URL_INTERNAL=http://localhost:4000

# Microsoft Entra ID (Azure AD) Configuration
MICROSOFT_CLIENT_ID=12345678-1234-1234-1234-123456789abc
MICROSOFT_CLIENT_SECRET=abc~def123456789...long-secret-string
MICROSOFT_TENANT_ID=common
```

---

## ✅ Database Migration Check

- [ ] **Migration Script Executed**
  - ✅ Completed: Database has been updated with SSO columns
  - ❌ Not Done: Run `scripts/015-add-sso-support.sql`

### How to Verify:

Run this SQL query in your database:

```sql
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('auth_provider', 'microsoft_id', 'email_verified');
```

**Expected Result:** You should see 3 rows:
- `auth_provider` (varchar, nullable)
- `microsoft_id` (varchar, nullable)
- `email_verified` (boolean, nullable)

If you see fewer than 3 rows, the migration hasn't been run.

---

## ✅ Azure AD App Registration Check

- [ ] **App Registration Created**
  - ✅ Created in Azure Portal
  - ❌ Not Created: Follow Step 2 in `SSO_SETUP_GUIDE.md`

- [ ] **Client ID Obtained**
  - ✅ Have the Application (client) ID
  - ❌ Missing: Get from Azure Portal → App Registration → Overview

- [ ] **Client Secret Created**
  - ✅ Created and value copied to `.env.local`
  - ❌ Missing: Create in Azure Portal → Certificates & secrets
  - ⚠️ **Important:** Client secrets expire! Check expiration date

- [ ] **Redirect URI Configured**
  - ✅ Added: `http://localhost:4000/api/auth/callback/azure-ad`
  - ❌ Missing: Add in Azure Portal → Authentication → Redirect URIs

- [ ] **API Permissions Configured**
  - ✅ Added: `User.Read`, `email`, `profile` (Delegated permissions)
  - ❌ Missing: Configure in Azure Portal → API permissions
  - ⚠️ **Important:** Grant admin consent if required

---

## ✅ Code Verification

- [ ] **NextAuth Route File Exists**
  - ✅ File exists: `app/api/auth/[...nextauth]/route.ts`
  - ❌ Missing: Should have been created during implementation

- [ ] **Login Form Updated**
  - ✅ "Sign in with Microsoft" button visible on login page
  - ❌ Missing: Check `components/auth/login-form.tsx`

- [ ] **Proxy File Updated**
  - ✅ `proxy.ts` includes NextAuth token checking
  - ❌ Missing: Check `proxy.ts` file

- [ ] **No middleware.ts File**
  - ✅ Only `proxy.ts` exists (no `middleware.ts`)
  - ❌ Issue: Delete `middleware.ts` if it exists (Next.js doesn't allow both)

---

## ✅ Server Configuration

- [ ] **Development Server Restarted**
  - ✅ Restarted after adding environment variables
  - ❌ Not Restarted: Stop server (Ctrl+C) and run `npm run dev` again
  - ⚠️ **Important:** Environment variables are only loaded on server start

- [ ] **No Build Errors**
  - ✅ Server starts without errors
  - ❌ Errors: Check console for specific error messages

---

## ✅ Testing Checklist

### Test 1: SSO Button Visibility
- [ ] Go to `http://localhost:4000/login`
- [ ] See "Sign in with Microsoft" button
- [ ] Button is clickable (not disabled)

### Test 2: SSO Login Flow
- [ ] Click "Sign in with Microsoft"
- [ ] Redirected to Microsoft login page
- [ ] Can sign in with Microsoft account
- [ ] Redirected back to `/dashboard` after login
- [ ] No errors in browser console
- [ ] No errors in server logs

### Test 3: User Creation
- [ ] After first SSO login, check database:
  ```sql
  SELECT id, email, full_name, auth_provider, microsoft_id, email_verified 
  FROM users 
  WHERE email = 'your-test-email@domain.com';
  ```
- [ ] `auth_provider` = `'microsoft'`
- [ ] `microsoft_id` is not NULL
- [ ] `email_verified` = `true`
- [ ] `password_hash` = `NULL`

### Test 4: Email/Password Still Works
- [ ] Logout
- [ ] Try logging in with existing email/password account
- [ ] Email/password login still works

### Test 5: SSO-Only User Protection
- [ ] Create a test user via SSO
- [ ] Try to log in with email/password for that user
- [ ] Should see error: "This account uses Microsoft SSO. Please sign in with Microsoft."

---

## 🔍 Common Issues & Quick Fixes

### Issue: "Redirect URI mismatch"
**Check:**
- [ ] Azure Portal → Authentication → Redirect URIs includes: `http://localhost:4000/api/auth/callback/azure-ad`
- [ ] No trailing slash
- [ ] Exact match (case-sensitive)
- [ ] Using `http` not `https` for localhost

### Issue: "Invalid client secret"
**Check:**
- [ ] Client secret hasn't expired (check expiration date in Azure Portal)
- [ ] Copied the entire secret value (no spaces, no truncation)
- [ ] Updated `.env.local` with new secret if expired
- [ ] Restarted server after updating `.env.local`

### Issue: "Application not found"
**Check:**
- [ ] `MICROSOFT_CLIENT_ID` is correct (GUID format)
- [ ] `MICROSOFT_TENANT_ID` matches the tenant where app is registered
- [ ] Try using `common` for `MICROSOFT_TENANT_ID` if using multi-tenant

### Issue: "Module not found: next-auth/providers/azure-ad"
**Check:**
- [ ] Run: `npm list next-auth` (should show 4.24.13)
- [ ] If missing: `npm install next-auth@4.24.13`
- [ ] Restart server

### Issue: "Both middleware.ts and proxy.ts detected"
**Check:**
- [ ] Delete `middleware.ts` file (only `proxy.ts` should exist)
- [ ] Restart server

### Issue: SSO button not visible
**Check:**
- [ ] File `components/auth/login-form.tsx` exists and has been updated
- [ ] No JavaScript errors in browser console
- [ ] Server is running without errors

---

## 📋 Quick Verification Commands

### Check Environment Variables (PowerShell):
```powershell
Get-Content .env.local | Select-String -Pattern "AUTH_SECRET|MICROSOFT|NEXTAUTH"
```

### Check Environment Variables (Bash):
```bash
grep -E "AUTH_SECRET|MICROSOFT|NEXTAUTH" .env.local
```

### Verify Database Migration:
```sql
-- Run in your database
SELECT COUNT(*) as column_count
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('auth_provider', 'microsoft_id', 'email_verified');
-- Should return: 3
```

### Check NextAuth Package:
```bash
npm list next-auth
# Should show: next-auth@4.24.13
```

---

## ✅ Final Checklist Summary

Before testing, ensure:

1. [ ] All 6 environment variables are set in `.env.local`
2. [ ] Database migration has been executed
3. [ ] Azure AD app registration is complete
4. [ ] Redirect URI is configured in Azure Portal
5. [ ] Server has been restarted after adding environment variables
6. [ ] No `middleware.ts` file exists (only `proxy.ts`)

---

## 🚀 Ready to Test?

If all items above are checked, you're ready to test:

1. Start server: `npm run dev`
2. Go to: `http://localhost:4000/login`
3. Click: "Sign in with Microsoft"
4. Complete authentication
5. Should redirect to `/dashboard`

---

## 📞 Need Help?

If you're stuck on any step:
1. Check `SSO_SETUP_GUIDE.md` for detailed instructions
2. Review the troubleshooting section above
3. Check server logs for specific error messages
4. Verify each checklist item one by one

---

**Last Updated:** After environment variables setup
**Next Step:** Run database migration (if not done) → Set up Azure AD app registration (if not done) → Test SSO login
