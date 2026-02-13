-- Migration script for Microsoft SSO Support
-- This script adds support for Single Sign-On authentication

-- Make password_hash nullable for SSO users (SSO users don't have passwords)
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

-- Add auth provider tracking (email/password vs microsoft)
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(50) DEFAULT 'email';

-- Add Microsoft ID for SSO users
ALTER TABLE users ADD COLUMN IF NOT EXISTS microsoft_id VARCHAR(255);

-- Add email verification status (Microsoft emails are pre-verified)
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;

-- Create indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_users_microsoft_id ON users(microsoft_id) WHERE microsoft_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_auth_provider ON users(auth_provider);
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(email_verified);

-- Update existing users to have email auth provider
UPDATE users SET auth_provider = 'email' WHERE auth_provider IS NULL;

-- Set email_verified to true for existing users (assuming they've verified their email)
UPDATE users SET email_verified = TRUE WHERE email_verified IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN users.auth_provider IS 'Authentication provider: email or microsoft';
COMMENT ON COLUMN users.microsoft_id IS 'Microsoft/Azure AD user ID for SSO users';
COMMENT ON COLUMN users.email_verified IS 'Whether the email address has been verified';
