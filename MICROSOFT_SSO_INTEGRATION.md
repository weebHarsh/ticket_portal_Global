# Microsoft SSO Integration Guide

## Overview

This document outlines the plan for integrating Microsoft Single Sign-On (SSO) into the Ticket Portal application. The integration will use **NextAuth.js v4** (already installed) with the Microsoft Entra ID (Azure AD) provider to enable enterprise authentication.

## Current Authentication System

### Existing Setup
- **Framework**: Next.js 16.0.10 (App Router)
- **Auth Library**: next-auth@4.24.13 (already installed)
- **Database**: PostgreSQL (Neon)
- **Current Auth**: Email/password with bcrypt
- **Session Management**: Cookies + localStorage
- **Route Protection**: Custom middleware in `proxy.ts`

### User Schema
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,  -- Will be nullable for SSO users
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'user',
  avatar_url TEXT,
  business_unit_group_id INTEGER REFERENCES business_unit_groups(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## Integration Architecture

### Components to Implement

1. **NextAuth Configuration** (`app/api/auth/[...nextauth]/route.ts`)
   - Microsoft Entra ID provider setup
   - Custom callbacks for user creation/lookup
   - Session management

2. **Database Schema Updates**
   - Make `password_hash` nullable (SSO users won't have passwords)
   - Add `auth_provider` column (email/password vs microsoft)
   - Add `microsoft_id` column (optional, for Microsoft user ID)
   - Add `email_verified` column (optional)

3. **User Management Functions** (`lib/actions/auth.ts`)
   - Update `loginUser` to handle SSO users
   - Add `findOrCreateSSOUser` function
   - Update `getCurrentUser` to work with NextAuth sessions

4. **UI Components** (`components/auth/`)
   - Update `login-form.tsx` to include "Sign in with Microsoft" button
   - Create SSO callback handler

5. **Middleware Updates** (`middleware.ts` or `proxy.ts`)
   - Integrate NextAuth session checking
   - Maintain backward compatibility with existing cookie-based auth

6. **Environment Variables**
   - `AUTH_SECRET` - NextAuth secret key
   - `MICROSOFT_CLIENT_ID` - Azure AD Application (Client) ID
   - `MICROSOFT_CLIENT_SECRET` - Azure AD Client Secret
   - `MICROSOFT_TENANT_ID` - Azure AD Tenant ID (optional, for single-tenant)

## Implementation Steps

### Phase 1: Database Schema Updates

**File**: `scripts/add-sso-support.sql`

```sql
-- Make password_hash nullable for SSO users
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

-- Add auth provider tracking
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(50) DEFAULT 'email';
ALTER TABLE users ADD COLUMN IF NOT EXISTS microsoft_id VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;

-- Create index for Microsoft ID lookups
CREATE INDEX IF NOT EXISTS idx_users_microsoft_id ON users(microsoft_id);
CREATE INDEX IF NOT EXISTS idx_users_auth_provider ON users(auth_provider);
```

### Phase 2: NextAuth Configuration

**File**: `app/api/auth/[...nextauth]/route.ts`

- Configure Microsoft Entra ID provider
- Implement `signIn` callback to find/create users
- Implement `jwt` callback to add user data to token
- Implement `session` callback to format session data
- Handle user creation for first-time SSO users

### Phase 3: User Management Functions

**File**: `lib/actions/auth.ts`

- Add `findOrCreateSSOUser(email, name, microsoftId)` function
- Update `loginUser` to check auth_provider
- Add `getUserByMicrosoftId` function
- Update `getCurrentUser` to support NextAuth sessions

### Phase 4: UI Updates

**File**: `components/auth/login-form.tsx`

- Add "Sign in with Microsoft" button
- Style to match existing design
- Handle loading states
- Show error messages for SSO failures

### Phase 5: Middleware Integration

**File**: `middleware.ts` (new) or update `proxy.ts`

- Check NextAuth session alongside existing cookie auth
- Redirect unauthenticated users to login
- Support both authentication methods

### Phase 6: Environment Configuration

**File**: `.env.local` (example)

```env
# NextAuth Configuration
AUTH_SECRET=your-secret-key-here-generate-with-openssl-rand-base64-32

# Microsoft Entra ID Configuration
MICROSOFT_CLIENT_ID=your-client-id-from-azure-portal
MICROSOFT_CLIENT_SECRET=your-client-secret-from-azure-portal
MICROSOFT_TENANT_ID=your-tenant-id-or-common-for-multi-tenant

# NextAuth URL (for production)
NEXTAUTH_URL=http://localhost:4000
NEXTAUTH_URL_INTERNAL=http://localhost:4000
```

## Azure AD App Registration Setup

### Steps in Azure Portal

1. **Register Application**
   - Go to Azure Portal → Azure Active Directory → App registrations
   - Click "New registration"
   - Name: "Ticket Portal"
   - Supported account types: Choose based on requirements
     - Single tenant: Only your organization
     - Multi-tenant: Any Azure AD directory
   - Redirect URI: `http://localhost:4000/api/auth/callback/microsoft` (dev)
   - Redirect URI (prod): `https://yourdomain.com/api/auth/callback/microsoft`

2. **Configure API Permissions**
   - Microsoft Graph API permissions:
     - `User.Read` (Delegated) - Read user profile
     - `email` (Delegated) - Read user email
     - `profile` (Delegated) - Read user profile
   - Admin consent if required

3. **Create Client Secret**
   - Certificates & secrets → New client secret
   - Copy the secret value (only shown once)

4. **Configure Authentication**
   - Authentication → Platform configurations
   - Add Web platform
   - Redirect URIs:
     - `http://localhost:4000/api/auth/callback/microsoft`
     - `https://yourdomain.com/api/auth/callback/microsoft`

## User Flow

### SSO Login Flow

1. User clicks "Sign in with Microsoft" button
2. Redirected to Microsoft login page
3. User authenticates with Microsoft credentials
4. Microsoft redirects back with authorization code
5. NextAuth exchanges code for tokens
6. NextAuth calls `signIn` callback
7. System finds or creates user in database
8. Session created and user redirected to dashboard

### First-Time SSO User

- User authenticated via Microsoft but doesn't exist in database
- System creates new user record with:
  - Email from Microsoft profile
  - Full name from Microsoft profile
  - `auth_provider = 'microsoft'`
  - `password_hash = NULL`
  - `microsoft_id` from Microsoft profile
  - Default role: 'user'
  - May need to assign `business_unit_group_id` manually or via mapping

### Existing User with SSO

- User exists with email/password auth
- Can optionally link Microsoft account
- Or can switch to SSO-only (remove password)

## Security Considerations

1. **Email Verification**
   - Microsoft emails are pre-verified
   - Set `email_verified = true` for SSO users

2. **Password Hash**
   - SSO users don't need passwords
   - Keep `password_hash` nullable
   - Prevent password reset for SSO users

3. **Account Linking**
   - Allow users to link Microsoft account to existing email account
   - Prevent duplicate accounts with same email

4. **Session Security**
   - Use secure, httpOnly cookies
   - Set appropriate session expiration
   - Implement CSRF protection (NextAuth handles this)

5. **Role Assignment**
   - Determine how to assign roles for SSO users
   - Options:
     - Default role for all SSO users
     - Map based on Microsoft group membership
     - Manual assignment by admin
     - Email domain-based assignment

## Business Unit Group Assignment

### Options for SSO Users

1. **Default Group**: Assign all SSO users to a default business unit group
2. **Email Domain Mapping**: Map email domains to business unit groups
3. **Microsoft Group Mapping**: Query Microsoft Graph API for group membership
4. **Manual Assignment**: Require admin to assign after first login
5. **Self-Selection**: Allow user to select on first login (if multiple options)

## Testing Checklist

- [ ] SSO login works for new users
- [ ] SSO login works for existing users (email match)
- [ ] Session persists across page refreshes
- [ ] Logout clears NextAuth session
- [ ] Protected routes require authentication
- [ ] User data correctly populated from Microsoft profile
- [ ] Error handling for SSO failures
- [ ] Fallback to email/password still works
- [ ] Database constraints handle nullable password_hash
- [ ] Role assignment works correctly
- [ ] Business unit group assignment works

## Migration Strategy

### For Existing Users

1. **Option A: Dual Auth**
   - Keep email/password for existing users
   - Allow them to optionally enable SSO
   - Both methods work for same account

2. **Option B: SSO Migration**
   - Migrate all users to SSO
   - Remove password requirement
   - One-time migration script

3. **Option C: Hybrid**
   - New users default to SSO
   - Existing users keep email/password
   - Allow switching between methods

## Dependencies

### Already Installed
- `next-auth@4.24.13` ✅

### May Need Updates
- Ensure Next.js version compatibility (16.0.10 is compatible)

## File Structure After Implementation

```
app/
  api/
    auth/
      [...nextauth]/
        route.ts          # NextAuth configuration
      login/
        route.ts          # Existing email/password login (keep)
components/
  auth/
    login-form.tsx        # Updated with SSO button
    sso-button.tsx        # New: Microsoft SSO button component
lib/
  actions/
    auth.ts               # Updated with SSO functions
middleware.ts             # New: NextAuth middleware (or update proxy.ts)
scripts/
  add-sso-support.sql     # New: Database migration
.env.local                # Updated with Microsoft credentials
```

## Next Steps

1. Review and approve this plan
2. Set up Azure AD App Registration
3. Implement database schema changes
4. Configure NextAuth
5. Update UI components
6. Test integration
7. Deploy to staging
8. Production deployment

## References

- [NextAuth.js Documentation](https://next-auth.js.org/)
- [NextAuth.js Microsoft Provider](https://next-auth.js.org/providers/microsoft-entra-id)
- [Microsoft Identity Platform](https://learn.microsoft.com/en-us/azure/active-directory/develop/)
- [Azure AD App Registration Guide](https://learn.microsoft.com/en-us/azure/active-directory/develop/quickstart-register-app)

## Questions to Resolve

1. **Tenant Configuration**: Single-tenant or multi-tenant?
2. **Role Assignment**: How should roles be assigned to SSO users?
3. **Business Unit Groups**: How should business unit groups be assigned?
4. **Account Linking**: Should existing email/password users be able to link Microsoft accounts?
5. **Migration**: Should we migrate existing users to SSO or keep dual auth?
6. **Domain Restrictions**: Should SSO be limited to specific email domains?
