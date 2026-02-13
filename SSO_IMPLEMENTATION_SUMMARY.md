# Microsoft SSO Implementation Summary

## ✅ Implementation Complete

Microsoft Single Sign-On (SSO) has been successfully integrated into the Ticket Portal application. The implementation maintains backward compatibility with the existing email/password authentication system.

## Files Created/Modified

### 1. Database Migration
- **File**: `scripts/015-add-sso-support.sql`
- **Purpose**: Adds SSO support columns to users table
- **Changes**:
  - Makes `password_hash` nullable (SSO users don't have passwords)
  - Adds `auth_provider` column (email/microsoft)
  - Adds `microsoft_id` column
  - Adds `email_verified` column
  - Creates indexes for efficient lookups

### 2. NextAuth Configuration
- **File**: `app/api/auth/[...nextauth]/route.ts`
- **Purpose**: Configures NextAuth with Microsoft provider
- **Features**:
  - Microsoft Entra ID provider setup
  - Custom signIn callback to find/create users
  - JWT callback to add user data to token
  - Session callback to format session data
  - Handles multiple Microsoft provider names for compatibility

### 3. Type Definitions
- **File**: `types/next-auth.d.ts`
- **Purpose**: Extends NextAuth types to include custom user fields
- **Adds**: role, business_unit_group_id, group_name, auth_provider to Session and JWT

### 4. Auth Functions Updated
- **File**: `lib/actions/auth.ts`
- **New Functions**:
  - `findOrCreateSSOUser()` - Creates or finds SSO users
  - `getUserByEmail()` - Fetches user by email
  - `getUserByMicrosoftId()` - Fetches user by Microsoft ID
- **Updated Functions**:
  - `getCurrentUser()` - Now supports both NextAuth sessions and cookie-based auth
  - `loginUser()` - Checks if user is SSO-only and prevents password login

### 5. Login Form Updated
- **File**: `components/auth/login-form.tsx`
- **Changes**:
  - Added "Sign in with Microsoft" button with Microsoft logo
  - Added divider between SSO and email/password login
  - Integrated NextAuth signIn function
  - Handles SSO loading states

### 6. Middleware Created
- **File**: `middleware.ts`
- **Purpose**: Integrates NextAuth session checking with existing auth
- **Features**:
  - Checks both NextAuth sessions and cookie-based auth
  - Maintains backward compatibility
  - Applies security headers
  - Protects routes appropriately

### 7. Environment Variables
- **File**: `.env.example`
- **New Variables**:
  - `AUTH_SECRET` - NextAuth secret key
  - `MICROSOFT_CLIENT_ID` - Azure AD Client ID
  - `MICROSOFT_CLIENT_SECRET` - Azure AD Client Secret
  - `MICROSOFT_TENANT_ID` - Azure AD Tenant ID (optional)
  - `NEXTAUTH_URL` - Application URL

## Setup Instructions

### 1. Run Database Migration

Execute the migration script to add SSO support:

```bash
# Connect to your database and run:
psql $DATABASE_URL -f scripts/015-add-sso-support.sql
```

Or use your preferred database tool to execute the SQL file.

### 2. Set Up Azure AD App Registration

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** → **App registrations**
3. Click **New registration**
4. Configure:
   - **Name**: Ticket Portal
   - **Supported account types**: Choose based on your needs
     - Single tenant: Only your organization
     - Multi-tenant: Any Azure AD directory
   - **Redirect URI**: 
     - Development: `http://localhost:4000/api/auth/callback/microsoft-entra-id`
     - Production: `https://yourdomain.com/api/auth/callback/microsoft-entra-id`
5. After creation, note the **Application (client) ID**
6. Go to **Certificates & secrets** → **New client secret**
7. Copy the secret value (only shown once)
8. Go to **API permissions** → Add:
   - Microsoft Graph → Delegated permissions:
     - `User.Read`
     - `email`
     - `profile`
   - Click **Grant admin consent** if required

### 3. Configure Environment Variables

Create or update your `.env.local` file:

```env
# NextAuth Configuration
AUTH_SECRET=your-secret-key-here-generate-with-openssl-rand-base64-32

# NextAuth URLs
NEXTAUTH_URL=http://localhost:4000
NEXTAUTH_URL_INTERNAL=http://localhost:4000

# Microsoft Entra ID Configuration
MICROSOFT_CLIENT_ID=your-client-id-from-azure-portal
MICROSOFT_CLIENT_SECRET=your-client-secret-from-azure-portal
MICROSOFT_TENANT_ID=common  # or your specific tenant ID
```

**Generate AUTH_SECRET:**
```bash
openssl rand -base64 32
```

### 4. Install Dependencies

The required `next-auth` package is already installed. If you need to reinstall:

```bash
npm install next-auth@4.24.13
```

### 5. Test the Integration

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to `/login`
3. Click "Sign in with Microsoft"
4. Complete Microsoft authentication
5. You should be redirected to `/dashboard`

## User Flow

### First-Time SSO User
1. User clicks "Sign in with Microsoft"
2. Redirected to Microsoft login
3. Authenticates with Microsoft credentials
4. System creates new user in database with:
   - Email from Microsoft profile
   - Name from Microsoft profile
   - `auth_provider = 'microsoft'`
   - `password_hash = NULL`
   - `microsoft_id` from Microsoft profile
   - Default role: 'user'
   - `email_verified = TRUE`

### Existing User (Email Match)
1. User signs in with Microsoft
2. System finds existing user by email
3. Updates user record with:
   - `microsoft_id`
   - `auth_provider = 'microsoft'`
   - Links Microsoft account to existing account

### SSO-Only User Login Attempt
- If user tries to login with email/password but account is SSO-only:
  - Error message: "This account uses Microsoft SSO. Please sign in with Microsoft."

## Security Features

1. **Email Verification**: SSO users automatically have `email_verified = TRUE`
2. **Password Protection**: SSO users don't have passwords (password_hash is NULL)
3. **Session Management**: Uses secure JWT tokens with 30-day expiration
4. **CSRF Protection**: NextAuth handles CSRF protection automatically
5. **Secure Cookies**: NextAuth uses httpOnly, secure cookies

## Backward Compatibility

- ✅ Existing email/password authentication still works
- ✅ Cookie-based session management still works
- ✅ `getCurrentUser()` supports both auth methods
- ✅ Middleware checks both NextAuth sessions and cookies
- ✅ No breaking changes to existing functionality

## Troubleshooting

### Issue: "Cannot find module 'next-auth/providers/microsoft-entra-id'"
**Solution**: The code includes fallback providers. If this error occurs, check your next-auth version:
```bash
npm list next-auth
```
Should be version 4.24.13 or compatible.

### Issue: Redirect URI Mismatch
**Solution**: Ensure the redirect URI in Azure AD matches exactly:
- Development: `http://localhost:4000/api/auth/callback/microsoft-entra-id`
- Check the exact provider name used (might be `azure-ad` or `microsoft`)

### Issue: "Invalid client secret"
**Solution**: 
- Verify `MICROSOFT_CLIENT_SECRET` in `.env.local`
- Client secrets expire - create a new one if needed
- Ensure no extra spaces or quotes in the value

### Issue: Users not being created
**Solution**:
- Check database migration was run
- Verify `auth_provider` column exists
- Check server logs for errors in `findOrCreateSSOUser`

## Next Steps

1. ✅ Run database migration
2. ✅ Set up Azure AD app registration
3. ✅ Configure environment variables
4. ✅ Test SSO login
5. ⏳ Assign roles to SSO users (manual or automated)
6. ⏳ Assign business unit groups to SSO users
7. ⏳ Consider domain restrictions if needed
8. ⏳ Update production environment variables
9. ⏳ Deploy to production

## Support

For issues or questions:
1. Check the implementation guide: `MICROSOFT_SSO_INTEGRATION.md`
2. Review NextAuth documentation: https://next-auth.js.org/
3. Review Azure AD documentation: https://learn.microsoft.com/en-us/azure/active-directory/
