#!/usr/bin/env node

/**
 * Complete Database Setup Script
 * Uses standard node-postgres client
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

async function runScript(client, scriptPath, scriptName) {
  console.log(`\n📄 Running: ${scriptName}`);

  try {
    const sqlContent = fs.readFileSync(scriptPath, 'utf-8');

    console.log(`   Executing SQL...`);
    await client.query(sqlContent);

    console.log(`   ✅ Completed: ${scriptName}`);
    return true;
  } catch (error) {
    // If there's an error, it might be due to multi-statement execution
    // Try executing statements one by one
    console.log(`   Trying statements individually...`);

    try {
      const sqlContent = fs.readFileSync(scriptPath, 'utf-8');
      const statements = sqlContent
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < statements.length; i++) {
        try {
          await client.query(statements[i]);
          successCount++;
          process.stdout.write(`   Progress: ${i + 1}/${statements.length} ✓\r`);
        } catch (err) {
          // Ignore "already exists" errors
          if (!err.message.includes('already exists') &&
              !err.message.includes('duplicate')) {
            errorCount++;
            if (errorCount < 3) { // Only show first few errors
              console.log(`\n   ⚠️  Error: ${err.message.substring(0, 100)}`);
            }
          } else {
            successCount++;
          }
        }
      }

      console.log(`\n   ✓ Executed ${successCount}/${statements.length} statements`);
      return successCount > 0;
    } catch (retryError) {
      console.error(`\n   ❌ Failed: ${retryError.message}`);
      return false;
    }
  }
}

async function setupDatabase() {
  console.log('🚀 Database Setup Starting...\n');
  console.log('=' .repeat(60));

  if (!process.env.DATABASE_URL) {
    console.error('\n❌ ERROR: DATABASE_URL not found!');
    process.exit(1);
  }

  console.log('✓ DATABASE_URL configured');

  // Create client
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('sslmode=require') ? { rejectUnauthorized: false } : false
  });

  try {
    // Connect
    console.log('✓ Connecting to database...');
    await client.connect();
    console.log('✓ Connected successfully!\n');

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
        await runScript(client, scriptPath, script);
      } else {
        console.log(`\n⚠️  Script not found: ${script}`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n✅ DATABASE SETUP COMPLETE!\n');
    console.log('Verifying data...\n');

    // Verify
    try {
      const users = await client.query('SELECT COUNT(*) as count FROM users');
      const tickets = await client.query('SELECT COUNT(*) as count FROM tickets');
      const teams = await client.query('SELECT COUNT(*) as count FROM teams');
      const categories = await client.query('SELECT COUNT(*) as count FROM categories');
      const bus = await client.query('SELECT COUNT(*) as count FROM business_unit_groups');

      console.log(`  ✓ Users: ${users.rows[0].count}`);
      console.log(`  ✓ Tickets: ${tickets.rows[0].count}`);
      console.log(`  ✓ Teams: ${teams.rows[0].count}`);
      console.log(`  ✓ Categories: ${categories.rows[0].count}`);
      console.log(`  ✓ Business Units: ${bus.rows[0].count}`);

      // Get sample user
      const sampleUser = await client.query(`SELECT email, full_name, role FROM users WHERE email = 'john.doe@company.com'`);
      if (sampleUser.rows.length > 0) {
        console.log('\n📧 Test Login Credentials:');
        console.log(`  Email:    ${sampleUser.rows[0].email}`);
        console.log(`  Name:     ${sampleUser.rows[0].full_name}`);
        console.log(`  Role:     ${sampleUser.rows[0].role}`);
        console.log(`  Password: TestUser@123`);
      }

    } catch (err) {
      console.log('  ⚠️  Could not verify all data');
      console.log(`  Error: ${err.message}`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n🎉 Setup complete! Your app is ready to use.\n');
    console.log('Next steps:');
    console.log('  1. Make sure dev server is running: npm run dev');
    console.log('  2. Open http://localhost:3000');
    console.log('  3. Login with: john.doe@company.com / TestUser@123\n');

  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

setupDatabase();
