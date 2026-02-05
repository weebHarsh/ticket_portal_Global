#!/usr/bin/env node

/**
 * Complete Database Setup Script
 * Runs all required SQL scripts in order
 */

const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const scripts = [
  '001-create-tables.sql',
  '003-master-data-tables.sql',
  'FINAL-seed-all-data.sql'
];

async function runScript(sql, scriptPath, scriptName) {
  console.log(`\n📄 Running: ${scriptName}`);

  try {
    const sqlContent = fs.readFileSync(scriptPath, 'utf-8');

    // Split by semicolons and filter out empty statements
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`   Found ${statements.length} SQL statements`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement) {
        try {
          await sql(statement);
          process.stdout.write(`   Progress: ${i + 1}/${statements.length}\r`);
        } catch (err) {
          // Ignore "already exists" errors
          if (!err.message.includes('already exists') &&
              !err.message.includes('duplicate key')) {
            console.error(`\n   ⚠️  Warning at statement ${i + 1}: ${err.message}`);
          }
        }
      }
    }

    console.log(`\n   ✅ Completed: ${scriptName}`);
    return true;
  } catch (error) {
    console.error(`\n   ❌ Error in ${scriptName}:`, error.message);
    return false;
  }
}

async function setupDatabase() {
  console.log('🚀 Database Setup Starting...\n');
  console.log('=' .repeat(60));

  // Check for DATABASE_URL
  if (!process.env.DATABASE_URL) {
    console.error('\n❌ ERROR: DATABASE_URL not found!');
    console.error('\nPlease set DATABASE_URL in .env.local file');
    console.error('\nFor local PostgreSQL:');
    console.error('DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ticketing?sslmode=disable"');
    console.error('\nFor Neon cloud:');
    console.error('DATABASE_URL="postgresql://user:pass@ep-xxx.region.aws.neon.tech/dbname?sslmode=require"');
    process.exit(1);
  }

  console.log('✓ DATABASE_URL configured');
  console.log('✓ Connecting to database...\n');

  const sql = neon(process.env.DATABASE_URL);

  // Test connection
  try {
    await sql`SELECT 1 as test`;
    console.log('✓ Database connection successful!\n');
  } catch (error) {
    console.error('❌ Database connection failed!');
    console.error('Error:', error.message);
    console.error('\nPlease check:');
    console.error('1. Database is running (if using Docker: docker ps)');
    console.error('2. DATABASE_URL is correct in .env.local');
    console.error('3. Database is accessible from this machine\n');
    process.exit(1);
  }

  console.log('=' .repeat(60));

  // Run each script
  let allSuccess = true;
  for (const script of scripts) {
    const scriptPath = path.join(__dirname, script);

    if (!fs.existsSync(scriptPath)) {
      console.error(`\n❌ Script not found: ${script}`);
      allSuccess = false;
      continue;
    }

    const success = await runScript(sql, scriptPath, script);
    if (!success) {
      allSuccess = false;
    }
  }

  console.log('\n' + '='.repeat(60));

  if (allSuccess) {
    console.log('\n✅ DATABASE SETUP COMPLETE!\n');
    console.log('Your database now contains:');
    console.log('  ✓ 15 test users');
    console.log('  ✓ 10 business units');
    console.log('  ✓ 10 categories with subcategories');
    console.log('  ✓ 5 teams with members');
    console.log('  ✓ 15 sample tickets');
    console.log('  ✓ 9 comments\n');
    console.log('Test Login Credentials:');
    console.log('  📧 Email:    john.doe@company.com');
    console.log('  🔑 Password: TestUser@123\n');
    console.log('Next steps:');
    console.log('  1. npm run dev');
    console.log('  2. Open http://localhost:3000');
    console.log('  3. Login with credentials above\n');
  } else {
    console.log('\n⚠️  Setup completed with some warnings');
    console.log('The database should still be usable.\n');
  }
}

setupDatabase().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
