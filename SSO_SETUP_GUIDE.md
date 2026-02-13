# Microsoft SSO Setup Guide - Step by Step

This guide will walk you through the remaining steps to complete the Microsoft SSO integration in your Ticket Portal application.

## Prerequisites

- ✅ Code implementation is complete
- ✅ Database access
- ✅ Azure Portal access (or access to someone who can create app registrations)
- ✅ Environment variables file (`.env.local`)

---

## Step 1: Run Database Migration

The database schema needs to be updated to support SSO users.

### Option A: Using psql (Command Line)

```bash
# If you have psql installed
psql $DATABASE_URL -f scripts/015-add-sso-support.sql
```

### Option B: Using Database GUI Tool

1. Open your database management tool (pgAdmin, DBeaver, TablePlus, etc.)
2. Connect to your database
3. Open the file: `scripts/015-add-sso-support.sql`
4. Execute the entire script

### Option C: Using Neon Console (if using Neon PostgreSQL)

1. Go to [Neon Console](https://console.neon.tech)
2. Select your project
3. Go to **SQL Editor**
4. Copy the contents of `scripts/015-add-sso-support.sql`
5. Paste and execute

### What This Does

- Makes `password_hash` nullable (SSO users don't have passwords)
- Adds `auth_provider` column to track authentication method
- Adds `microsoft_id` column to store Microsoft user ID
- Adds `email_verified` column (SSO emails are pre-verified)
- Creates indexes for efficient lookups

### Verify Migration

Run this query to verify the columns were added:

```sql
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('auth_provider', 'microsoft_id', 'email_verified');
```

You should see all three columns listed.

---

## Step 2: Set Up Azure AD App Registration

This step requires access to Azure Portal. If you don't have access, ask your IT administrator to create the app registration.

### 2.1: Create App Registration

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** (or **Microsoft Entra ID**)
3. Click on **App registrations** in the left sidebar
4. Click **+ New registration**

### 2.2: Configure Basic Settings

Fill in the registration form:

- **Name**: `Ticket Portal` (or any name you prefer)
- **Supported account types**: 
  - **Single tenant**: Only users in your organization
  - **Multi-tenant**: Any Azure AD directory (choose this if you want external users)
  - **Multi-tenant + personal Microsoft accounts**: Any Azure AD + personal Microsoft accounts
- **Redirect URI**: 
  - Platform: **Web**
  - URI: `http://localhost:4000/api/auth/callback/azure-ad` (for development)

Click **Register**

### 2.3: Note Your Application Details

After registration, you'll see the **Overview** page. Note down:

- **Application (client) ID** - You'll need this for `MICROSOFT_CLIENT_ID`
- **Directory (tenant) ID** - You'll need this for `MICROSOFT_TENANT_ID` (optional, can use "common")

### 2.4: Create Client Secret

1. In the app registration, go to **Certificates & secrets** in the left sidebar
2. Click **+ New client secret**
3. Fill in:
   - **Description**: `Ticket Portal Secret` (or any description)
   - **Expires**: Choose an expiration (recommend 24 months for production)
4. Click **Add**
5. **IMPORTANT**: Copy the **Value** immediately (you won't see it again!)
   - This is your `MICROSOFT_CLIENT_SECRET`
   - Store it securely (password manager, secure notes, etc.)

### 2.5: Configure API Permissions

1. Go to **API permissions** in the left sidebar
2. Click **+ Add a permission**
3. Select **Microsoft Graph**
4. Select **Delegated permissions**
5. Add these permissions:
   - `User.Read` - Read user profile
   - `email` - View user's email address
   - `profile` - View user's basic profile
6. Click **Add permissions**
7. If you see a warning about admin consent, click **Grant admin consent for [Your Organization]**
   - This may require admin privileges

### 2.6: Configure Authentication (Redirect URIs)

1. Go to **Authentication** in the left sidebar
2. Under **Platform configurations**, click **Add a platform**
3. Select **Web**
4. Add these Redirect URIs:

   **For Development:**
   ```
   http://localhost:4000/api/auth/callback/azure-ad
   ```

   **For Production (add when ready to deploy):**
   ```
   https://yourdomain.com/api/auth/callback/azure-ad
   ```

5. Under **Implicit grant and hybrid flows**, you can leave defaults
6. Click **Configure**

### 2.7: (Optional) Configure Token Configuration

1. Go to **Token configuration** in the left sidebar
2. Click **+ Add optional claim**
3. Select **ID** token
4. Check:
   - `email`
   - `family_name`
   - `given_name`
5. Click **Add**

---

## Step 3: Configure Environment Variables

Create or update your `.env.local` file in the project root.

### 3.1: Generate AUTH_SECRET

Generate a secure random secret for NextAuth:

**On Windows (PowerShell):**
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

**On Mac/Linux:**
```bash
openssl rand -base64 32
```

**Or use an online generator:**
- Visit: https://generate-secret.vercel.app/32
- Copy the generated secret

### 3.2: Add Environment Variables

Open or create `.env.local` in your project root and add:

```env
# Database (if not already present)
DATABASE_URL=your-database-url-here

# NextAuth Configuration
AUTH_SECRET=your-generated-secret-here

# NextAuth URLs
NEXTAUTH_URL=http://localhost:4000
NEXTAUTH_URL_INTERNAL=http://localhost:4000

# Microsoft Entra ID (Azure AD) Configuration
MICROSOFT_CLIENT_ID=your-client-id-from-azure-portal
MICROSOFT_CLIENT_SECRET=your-client-secret-from-azure-portal
MICROSOFT_TENANT_ID=common
```

### 3.3: Fill in the Values

Replace the placeholders:

- `AUTH_SECRET`: Paste the secret you generated in step 3.1
- `MICROSOFT_CLIENT_ID`: Paste the Application (client) ID from Azure Portal (step 2.3)
- `MICROSOFT_CLIENT_SECRET`: Paste the client secret value from Azure Portal (step 2.4)
- `MICROSOFT_TENANT_ID`: 
  - Use `common` for multi-tenant (any Azure AD directory)
  - Use your Directory (tenant) ID for single-tenant (only your organization)

### 3.4: Example .env.local

```env
DATABASE_URL=postgresql://user:password@host:5432/database

AUTH_SECRET=abc123xyz789...your-actual-secret-here

NEXTAUTH_URL=http://localhost:4000
NEXTAUTH_URL_INTERNAL=http://localhost:4000

MICROSOFT_CLIENT_ID=12345678-1234-1234-1234-123456789abc
MICROSOFT_CLIENT_SECRET=abc~def123456789...
MICROSOFT_TENANT_ID=common
```

---

## Step 4: Restart Development Server

After adding environment variables, restart your development server:

1. Stop the current server (Ctrl+C)
2. Start it again:
   ```bash
   npm run dev
   ```

The server needs to restart to pick up the new environment variables.

---

## Step 5: Test the Integration

### 5.1: Test SSO Login

1. Open your browser and go to: `http://localhost:4000/login`
2. You should see a **"Sign in with Microsoft"** button
3. Click the button
4. You should be redirected to Microsoft login page
5. Sign in with your Microsoft account
6. After successful authentication, you should be redirected back to `/dashboard`

### 5.2: Verify User Creation

After first SSO login, check your database:

```sql
SELECT id, email, full_name, auth_provider, microsoft_id, email_verified 
FROM users 
WHERE auth_provider = 'microsoft' 
ORDER BY created_at DESC 
LIMIT 5;
```

You should see:
- `auth_provider` = `'microsoft'`
- `microsoft_id` = a string (Microsoft user ID)
- `email_verified` = `true`
- `password_hash` = `NULL`

### 5.3: Test Email/Password Login Still Works

1. Logout (if logged in)
2. Go to `/login`
3. Try logging in with an existing email/password account
4. It should still work normally

### 5.4: Test SSO-Only User

1. Create a test user via SSO (sign in with Microsoft)
2. Try to log in with email/password for that user
3. You should see an error: "This account uses Microsoft SSO. Please sign in with Microsoft."

---

## Step 6: Production Deployment

When ready to deploy to production:

### 6.1: Update Azure AD Redirect URI

1. Go to Azure Portal → Your App Registration → **Authentication**
2. Add production redirect URI:
   ```
   https://yourdomain.com/api/auth/callback/azure-ad
   ```
3. Click **Save**

### 6.2: Update Environment Variables

In your production environment (Vercel, Railway, etc.), add:

```env
AUTH_SECRET=your-production-secret (use a different one from dev)
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_URL_INTERNAL=https://yourdomain.com
MICROSOFT_CLIENT_ID=your-client-id
MICROSOFT_CLIENT_SECRET=your-client-secret
MICROSOFT_TENANT_ID=common (or your tenant ID)
```

### 6.3: Deploy

Deploy your application as usual. The SSO integration will work automatically.

---

## Troubleshooting

### Issue: "Redirect URI mismatch"

**Error**: The redirect URI in the request does not match the redirect URIs configured for the application.

**Solution**:
1. Check Azure Portal → App Registration → Authentication
2. Ensure the redirect URI exactly matches: `http://localhost:4000/api/auth/callback/azure-ad`
3. Check for trailing slashes, http vs https, port numbers

### Issue: "Invalid client secret"

**Error**: Invalid client secret provided.

**Solution**:
1. Client secrets expire - create a new one in Azure Portal
2. Update `MICROSOFT_CLIENT_SECRET` in `.env.local`
3. Restart the development server

### Issue: "AADSTS700016: Application not found"

**Error**: The application was not found in the directory/tenant.

**Solution**:
1. Verify `MICROSOFT_CLIENT_ID` is correct
2. Verify `MICROSOFT_TENANT_ID` matches the tenant where the app is registered
3. Try using `common` for `MICROSOFT_TENANT_ID` if using multi-tenant

### Issue: User not being created in database

**Error**: SSO login works but user doesn't appear in database.

**Solution**:
1. Check server logs for errors
2. Verify database migration was run (Step 1)
3. Check database connection is working
4. Verify `findOrCreateSSOUser` function is being called (check logs)

### Issue: "Cannot find module 'next-auth/providers/azure-ad'"

**Error**: Module not found error.

**Solution**:
1. Verify `next-auth` is installed: `npm list next-auth`
2. Should show version 4.24.13
3. If not, install: `npm install next-auth@4.24.13`

### Issue: Both authentication methods not working

**Error**: Neither SSO nor email/password works.

**Solution**:
1. Check `proxy.ts` is being used (not `middleware.ts`)
2. Verify environment variables are set correctly
3. Check server logs for specific errors
4. Ensure database migration was completed

---

## Checklist

Use this checklist to track your progress:

- [ ] Step 1: Database migration executed successfully
- [ ] Step 2.1: Azure AD app registration created
- [ ] Step 2.2: App registration configured
- [ ] Step 2.3: Application (client) ID noted
- [ ] Step 2.4: Client secret created and saved
- [ ] Step 2.5: API permissions configured
- [ ] Step 2.6: Redirect URIs configured
- [ ] Step 3.1: AUTH_SECRET generated
- [ ] Step 3.2: Environment variables added to `.env.local`
- [ ] Step 4: Development server restarted
- [ ] Step 5.1: SSO login tested successfully
- [ ] Step 5.2: User creation verified in database
- [ ] Step 5.3: Email/password login still works
- [ ] Step 6: Production deployment configured (when ready)

---

## Next Steps After Setup

1. **Assign Roles**: Decide how to assign roles to SSO users (default 'user', manual assignment, or automated based on email domain)

2. **Assign Business Unit Groups**: Decide how to assign business unit groups to SSO users

3. **User Migration**: Consider if you want to migrate existing users to SSO or keep dual authentication

4. **Domain Restrictions**: Consider if you want to restrict SSO to specific email domains

5. **Testing**: Test thoroughly with different user scenarios

---

## Support Resources

- **NextAuth Documentation**: https://next-auth.js.org/
- **Azure AD Documentation**: https://learn.microsoft.com/en-us/azure/active-directory/
- **Implementation Guide**: See `MICROSOFT_SSO_INTEGRATION.md`
- **Implementation Summary**: See `SSO_IMPLEMENTATION_SUMMARY.md`

---

## Quick Reference

### Environment Variables Template

```env
AUTH_SECRET=<generate-with-openssl-rand-base64-32>
NEXTAUTH_URL=http://localhost:4000
NEXTAUTH_URL_INTERNAL=http://localhost:4000
MICROSOFT_CLIENT_ID=<from-azure-portal>
MICROSOFT_CLIENT_SECRET=<from-azure-portal>
MICROSOFT_TENANT_ID=common
```

### Azure AD Redirect URI

**Development:**
```
http://localhost:4000/api/auth/callback/azure-ad
```

**Production:**
```
https://yourdomain.com/api/auth/callback/azure-ad
```

### Database Migration File

```
scripts/015-add-sso-support.sql
```

---

**Need Help?** If you encounter any issues not covered in this guide, check the troubleshooting section or review the implementation files for more details.
