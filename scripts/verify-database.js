#!/usr/bin/env node

/**
 * Verify Database Setup
 * Checks that all data was inserted correctly
 */

const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });

async function verifyDatabase() {
  console.log('🔍 Verifying database setup...\n');

  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not found');
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL);

  try {
    // Check users
    const users = await sql`SELECT COUNT(*) as count FROM users`;
    console.log(`✓ Users: ${users[0].count} found`);

    // Check business units
    const bus = await sql`SELECT COUNT(*) as count FROM business_unit_groups`;
    console.log(`✓ Business Units: ${bus[0].count} found`);

    // Check categories
    const cats = await sql`SELECT COUNT(*) as count FROM categories`;
    console.log(`✓ Categories: ${cats[0].count} found`);

    // Check subcategories
    const subcats = await sql`SELECT COUNT(*) as count FROM subcategories`;
    console.log(`✓ Subcategories: ${subcats[0].count} found`);

    // Check teams
    const teams = await sql`SELECT COUNT(*) as count FROM teams`;
    console.log(`✓ Teams: ${teams[0].count} found`);

    // Check team members
    const members = await sql`SELECT COUNT(*) as count FROM team_members`;
    console.log(`✓ Team Members: ${members[0].count} found`);

    // Check tickets
    const tickets = await sql`SELECT COUNT(*) as count FROM tickets`;
    console.log(`✓ Tickets: ${tickets[0].count} found`);

    // Check comments
    const comments = await sql`SELECT COUNT(*) as count FROM comments`;
    console.log(`✓ Comments: ${comments[0].count} found`);

    // Check ticket classifications
    const classifications = await sql`SELECT COUNT(*) as count FROM ticket_classification_mapping`;
    console.log(`✓ Ticket Classifications: ${classifications[0].count} found`);

    console.log('\n✅ Database verification complete!\n');

    // Show sample user
    const sampleUser = await sql`SELECT email, full_name, role FROM users WHERE email = 'john.doe@company.com'`;
    if (sampleUser.length > 0) {
      console.log('Sample login credentials:');
      console.log(`  Email: ${sampleUser[0].email}`);
      console.log(`  Name: ${sampleUser[0].full_name}`);
      console.log(`  Role: ${sampleUser[0].role}`);
      console.log(`  Password: TestUser@123\n`);
    }

  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    process.exit(1);
  }
}

verifyDatabase();
