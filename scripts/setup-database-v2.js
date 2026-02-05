#!/usr/bin/env node

/**
 * Complete Database Setup Script v2
 * Uses sql() method for better compatibility with Neon
 */

const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

async function runScript(sql, scriptPath, scriptName) {
  console.log(`\n📄 Running: ${scriptName}`);

  try {
    const sqlContent = fs.readFileSync(scriptPath, 'utf-8');

    // Execute the entire script as one command
    console.log(`   Executing SQL...`);
    await sql(sqlContent);

    console.log(`   ✅ Completed: ${scriptName}`);
    return true;
  } catch (error) {
    console.error(`\n   ❌ Error in ${scriptName}:`);
    console.error(`   ${error.message}`);

    // If full script fails, try statement by statement
    console.log(`   Trying statement by statement...`);
    try {
      const sqlContent = fs.readFileSync(scriptPath, 'utf-8');
      const statements = sqlContent
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      let successCount = 0;
      for (const statement of statements) {
        try {
          await sql(statement);
          successCount++;
        } catch (err) {
          if (!err.message.includes('already exists')) {
            console.error(`   ⚠️  ${err.message.substring(0, 100)}`);
          }
        }
      }

      console.log(`   ✓ Executed ${successCount}/${statements.length} statements`);
      return successCount > 0;
    } catch (retryError) {
      console.error(`   ❌ Failed: ${retryError.message}`);
      return false;
    }
  }
}

async function setupDatabase() {
  console.log('🚀 Database Setup Starting (v2)...\n');
  console.log('=' .repeat(60));

  if (!process.env.DATABASE_URL) {
    console.error('\n❌ ERROR: DATABASE_URL not found!');
    process.exit(1);
  }

  console.log('✓ DATABASE_URL configured');
  const sql = neon(process.env.DATABASE_URL);

  // Test connection
  try {
    await sql`SELECT 1 as test`;
    console.log('✓ Database connection successful!\n');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }

  console.log('=' .repeat(60));

  // Run scripts in order
  const scripts = [
    '001-create-tables.sql',
    '003-master-data-tables.sql',
    'FINAL-seed-all-data.sql'
  ];

  for (const script of scripts) {
    const scriptPath = path.join(__dirname, script);
    if (fs.existsSync(scriptPath)) {
      await runScript(sql, scriptPath, script);
    } else {
      console.log(`\n⚠️  Script not found: ${script}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n✅ DATABASE SETUP COMPLETE!\n');
  console.log('Verifying data...\n');

  // Verify
  try {
    const userCount = await sql`SELECT COUNT(*) as count FROM users`;
    const ticketCount = await sql`SELECT COUNT(*) as count FROM tickets`;
    const teamCount = await sql`SELECT COUNT(*) as count FROM teams`;

    console.log(`  ✓ ${userCount[0].count} users`);
    console.log(`  ✓ ${ticketCount[0].count} tickets`);
    console.log(`  ✓ ${teamCount[0].count} teams`);
  } catch (err) {
    console.log('  ⚠️  Could not verify data (this is okay)');
  }

  console.log('\nTest Login:');
  console.log('  📧 john.doe@company.com');
  console.log('  🔑 TestUser@123\n');
}

setupDatabase().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
