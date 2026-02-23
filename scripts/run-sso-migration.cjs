#!/usr/bin/env node

/**
 * Run SSO migration to add microsoft_id and related columns
 * Usage: node scripts/run-sso-migration.cjs
 */

const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ DATABASE_URL is not set in .env.local');
  process.exit(1);
}

console.log('🔍 Running SSO migration...');
console.log('📍 Host:', new URL(databaseUrl).hostname);

const sql = neon(databaseUrl);

async function runMigration() {
  try {
    console.log('\n📝 Step 1: Making password_hash nullable...');
    await sql`ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL`;
    console.log('✅ password_hash is now nullable');

    console.log('\n📝 Step 2: Adding auth_provider column...');
    await sql`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(50) DEFAULT 'email'
    `;
    console.log('✅ auth_provider column added');

    console.log('\n📝 Step 3: Adding microsoft_id column...');
    await sql`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS microsoft_id VARCHAR(255)
    `;
    console.log('✅ microsoft_id column added');

    console.log('\n📝 Step 4: Adding email_verified column...');
    await sql`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE
    `;
    console.log('✅ email_verified column added');

    console.log('\n📝 Step 5: Creating indexes...');
    await sql`
      CREATE INDEX IF NOT EXISTS idx_users_microsoft_id 
      ON users(microsoft_id) 
      WHERE microsoft_id IS NOT NULL
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_users_auth_provider 
      ON users(auth_provider)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_users_email_verified 
      ON users(email_verified)
    `;
    console.log('✅ Indexes created');

    console.log('\n📝 Step 6: Updating existing users...');
    await sql`
      UPDATE users 
      SET auth_provider = 'email' 
      WHERE auth_provider IS NULL
    `;
    await sql`
      UPDATE users 
      SET email_verified = TRUE 
      WHERE email_verified IS NULL
    `;
    console.log('✅ Existing users updated');

    console.log('\n📝 Step 7: Adding column comments...');
    await sql`
      COMMENT ON COLUMN users.auth_provider IS 'Authentication provider: email or microsoft'
    `;
    await sql`
      COMMENT ON COLUMN users.microsoft_id IS 'Microsoft/Azure AD user ID for SSO users'
    `;
    await sql`
      COMMENT ON COLUMN users.email_verified IS 'Whether the email address has been verified'
    `;
    console.log('✅ Column comments added');

    console.log('\n✅ SSO migration completed successfully!');
    
    // Verify the columns exist
    console.log('\n🔍 Verifying columns...');
    const columns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'users'
      AND column_name IN ('microsoft_id', 'auth_provider', 'email_verified')
      ORDER BY column_name
    `;
    
    if (columns.length === 3) {
      console.log('✅ All SSO columns verified:');
      columns.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
    } else {
      console.warn('⚠️  Some columns may be missing:', columns);
    }

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    if (error instanceof Error) {
      console.error('   Error message:', error.message);
      if (error.stack) {
        console.error('   Stack:', error.stack);
      }
    }
    process.exit(1);
  }
}

runMigration()
  .then(() => {
    console.log('\n🎉 Migration script completed!');
    console.log('\n💡 Next steps:');
    console.log('   1. Restart your development server');
    console.log('   2. Try Microsoft SSO login again');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Unexpected error:', error);
    process.exit(1);
  });
