#!/usr/bin/env node

/**
 * Run Organization Mappings Migration
 * Usage: node scripts/run-organization-mappings.cjs
 * 
 * This script seeds organizations and their mappings to target business groups
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

console.log('🔍 Seeding organization mappings...');
console.log('📍 Host:', new URL(databaseUrl).hostname);

const sql = neon(databaseUrl);

async function seedOrganizationMappings() {
  try {
    console.log('\n📝 Step 1: Ensuring target business groups exist...');
    await sql`
      INSERT INTO target_business_groups (name, description) VALUES
        ('TD Apps', 'Tech Delivery Apps Team'),
        ('TD Web', 'Tech Delivery Web Team'),
        ('TD Brand', 'Tech Delivery Brand Team'),
        ('TD BM', 'Tech Delivery Brand Monitoring Team'),
        ('TD RMN', 'Tech Delivery RMN Team'),
        ('TD Central', 'Tech Delivery Central Team'),
        ('TD GUI', 'Tech Delivery GUI Team'),
        ('TD Integrations', 'Tech Delivery Integrations Team'),
        ('TD IS', 'Tech Delivery Information Systems Team'),
        ('TD Product', 'Tech Delivery Product Team')
      ON CONFLICT (name) DO NOTHING
    `;
    console.log('✅ Target business groups ensured');

    console.log('\n📝 Step 2: Creating organizations...');
    await sql`
      INSERT INTO organizations (name, description) VALUES
        ('MFBuddy support', 'MFBuddy Support Organization'),
        ('Customer Portal support', 'Customer Portal Support Organization'),
        ('Ticket Portal support', 'Ticket Portal Support Organization'),
        ('Billing Portal support', 'Billing Portal Support Organization'),
        ('Customer Integrations support', 'Customer Integrations Support Organization'),
        ('GUI Development support', 'GUI Development Support Organization'),
        ('IT Administration support', 'IT Administration Support Organization'),
        ('IT Security support', 'IT Security Support Organization'),
        ('IT DevOps support', 'IT DevOps Support Organization'),
        ('Customer Solutions support', 'Customer Solutions Support Organization'),
        ('Competitive Research support', 'Competitive Research Support Organization'),
        ('Others', 'Other Support Organizations')
      ON CONFLICT (name) DO NOTHING
    `;
    console.log('✅ Organizations created');

    console.log('\n📝 Step 3: Creating organization to target business group mappings...');
    
    // Get all organizations and target business groups
    const organizations = await sql`SELECT id, name FROM organizations`;
    const targetBusinessGroups = await sql`SELECT id, name FROM target_business_groups`;
    
    const orgMap = Object.fromEntries(organizations.map(o => [o.name, o.id]));
    const tbgMap = Object.fromEntries(targetBusinessGroups.map(t => [t.name, t.id]));
    
    // Define mappings
    const mappings = [
      { org: 'MFBuddy support', tbg: 'TD Central' },
      { org: 'Customer Portal support', tbg: 'TD Central' },
      { org: 'Ticket Portal support', tbg: 'TD GUI' },
      { org: 'Billing Portal support', tbg: 'TD Central' },
      { org: 'Customer Integrations support', tbg: 'TD Integrations' },
      { org: 'GUI Development support', tbg: 'TD GUI' },
      { org: 'IT Administration support', tbg: 'TD IS' },
      { org: 'IT Security support', tbg: 'TD IS' },
      { org: 'IT DevOps support', tbg: 'TD IS' },
      { org: 'Customer Solutions support', tbg: 'TD Product' },
      { org: 'Competitive Research support', tbg: 'TD Product' },
    ];
    
    // Create individual mappings
    for (const mapping of mappings) {
      if (orgMap[mapping.org] && tbgMap[mapping.tbg]) {
        await sql`
          INSERT INTO organization_target_business_group_mapping (organization_id, target_business_group_id)
          VALUES (${orgMap[mapping.org]}, ${tbgMap[mapping.tbg]})
          ON CONFLICT DO NOTHING
        `;
      }
    }
    console.log(`✅ Created ${mappings.length} organization mappings`);
    
    // Create "Others" mapping to all target business groups
    console.log('\n📝 Step 4: Creating "Others" organization mappings...');
    const othersOrgId = orgMap['Others'];
    if (othersOrgId) {
      const allTargetGroups = ['TD Apps', 'TD Web', 'TD Brand', 'TD BM', 'TD RMN', 'TD Central', 'TD GUI', 'TD Integrations', 'TD IS', 'TD Product'];
      let othersCount = 0;
      for (const tbgName of allTargetGroups) {
        if (tbgMap[tbgName]) {
          await sql`
            INSERT INTO organization_target_business_group_mapping (organization_id, target_business_group_id)
            VALUES (${othersOrgId}, ${tbgMap[tbgName]})
            ON CONFLICT DO NOTHING
          `;
          othersCount++;
        }
      }
      console.log(`✅ Created ${othersCount} mappings for "Others" organization`);
    }

    console.log('\n✅ Organization mappings migration completed successfully!');
    
    // Verify mappings
    console.log('\n🔍 Verifying mappings...');
    const verify = await sql`
      SELECT 
        o.name as organization,
        tbg.name as target_business_group
      FROM organizations o
      JOIN organization_target_business_group_mapping otbgm ON o.id = otbgm.organization_id
      JOIN target_business_groups tbg ON otbgm.target_business_group_id = tbg.id
      ORDER BY o.name, tbg.name
    `;
    
    console.log(`✅ Found ${verify.length} organization mappings:`);
    const grouped = verify.reduce((acc, row) => {
      if (!acc[row.organization]) acc[row.organization] = [];
      acc[row.organization].push(row.target_business_group);
      return acc;
    }, {});
    
    for (const [org, tbgs] of Object.entries(grouped)) {
      console.log(`   ${org}: ${tbgs.join(', ')}`);
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

seedOrganizationMappings()
  .then(() => {
    console.log('\n🎉 Organization mappings script completed!');
    console.log('\n💡 Next steps:');
    console.log('   1. Restart your development server');
    console.log('   2. Test creating customer and internal tickets');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Unexpected error:', error);
    process.exit(1);
  });
