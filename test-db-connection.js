#!/usr/bin/env node

/**
 * Simple Database Connection Test
 * Tests if DATABASE_URL is accessible
 */

require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

async function testConnection() {
  console.log('🔍 Testing database connection...\n');

  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not found in .env.local');
    console.error('   Please add your database connection string to .env.local');
    process.exit(1);
  }

  console.log('✓ DATABASE_URL found');
  
  // Mask sensitive parts of the URL for display
  const url = process.env.DATABASE_URL;
  const masked = url.replace(/:([^:@]+)@/, ':****@');
  console.log(`  Connection: ${masked}\n`);

  const sql = neon(process.env.DATABASE_URL);

  try {
    console.log('Attempting to connect...');
    const result = await sql`SELECT NOW() as current_time, version() as pg_version`;
    console.log('✅ Connection successful!\n');
    console.log('Database Info:');
    console.log(`  Current Time: ${result[0].current_time}`);
    console.log(`  PostgreSQL: ${result[0].pg_version.split(' ')[0]} ${result[0].pg_version.split(' ')[1]}\n`);
    
    // Check if users table exists
    try {
      const userCount = await sql`SELECT COUNT(*) as count FROM users`;
      console.log(`✓ Users table exists (${userCount[0].count} users)`);
    } catch (e) {
      console.log('⚠️  Users table does not exist - you may need to run setup scripts');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Connection failed!\n');
    console.error('Error details:');
    console.error(`  Message: ${error.message}`);
    
    if (error.message.includes('fetch failed')) {
      console.error('\nPossible causes:');
      console.error('  1. Database server is not accessible');
      console.error('  2. Connection string is incorrect');
      console.error('  3. Network/firewall blocking the connection');
      console.error('  4. SSL/TLS configuration issue');
    } else if (error.message.includes('password authentication')) {
      console.error('\nPossible causes:');
      console.error('  1. Incorrect username or password');
      console.error('  2. Database user does not have access');
    } else if (error.message.includes('does not exist')) {
      console.error('\nPossible causes:');
      console.error('  1. Database name is incorrect');
      console.error('  2. Database has not been created');
    }
    
    console.error('\nTroubleshooting steps:');
    console.error('  1. Verify your DATABASE_URL is correct');
    console.error('  2. Check if your database is running/accessible');
    console.error('  3. For Neon: Check your project is active in the dashboard');
    console.error('  4. Try connecting with a database client (pgAdmin, DBeaver, etc.)');
    
    return false;
  }
}

testConnection().then(success => {
  process.exit(success ? 0 : 1);
});
