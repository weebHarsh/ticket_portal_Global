#!/usr/bin/env node

/**
 * Database Setup Script
 * Runs the FINAL-seed-all-data.sql script to populate the database
 */

const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

async function runSeedScript() {
  console.log('🚀 Starting database setup...\n');

  // Check for DATABASE_URL
  if (!process.env.DATABASE_URL) {
    console.error('❌ ERROR: DATABASE_URL environment variable is not set!');
    console.error('\nPlease follow these steps:');
    console.error('1. Edit .env.local file in the project root');
    console.error('2. Add your Neon PostgreSQL connection string');
    console.error('3. Save the file and run this script again\n');
    console.error('Example:');
    console.error('DATABASE_URL=postgresql://user:pass@ep-xxx.region.aws.neon.tech/dbname?sslmode=require\n');
    process.exit(1);
  }

  console.log('✓ DATABASE_URL found');

  // Read SQL file
  const sqlFile = path.join(__dirname, 'FINAL-seed-all-data.sql');

  if (!fs.existsSync(sqlFile)) {
    console.error(`❌ ERROR: SQL file not found at ${sqlFile}`);
    process.exit(1);
  }

  console.log('✓ SQL script file found');

  const sqlContent = fs.readFileSync(sqlFile, 'utf-8');

  // Initialize Neon connection
  const sql = neon(process.env.DATABASE_URL);

  try {
    console.log('\n📊 Executing SQL script...');
    console.log('This will:');
    console.log('  - Clear existing test data');
    console.log('  - Insert 15 users');
    console.log('  - Insert 10 business units');
    console.log('  - Insert 10 categories with 15 subcategories');
    console.log('  - Insert 5 teams with 15 members');
    console.log('  - Insert 15 ticket classifications');
    console.log('  - Insert 15 sample tickets');
    console.log('  - Insert 9 comments\n');

    // Execute the SQL script
    await sql(sqlContent);

    console.log('✅ Database setup completed successfully!\n');
    console.log('Test credentials:');
    console.log('  Email: john.doe@company.com');
    console.log('  Password: TestUser@123\n');
    console.log('You can now:');
    console.log('  1. Start the dev server: npm run dev');
    console.log('  2. Open http://localhost:3000');
    console.log('  3. Login with the credentials above\n');

  } catch (error) {
    console.error('❌ Error executing SQL script:');
    console.error(error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  }
}

runSeedScript();
