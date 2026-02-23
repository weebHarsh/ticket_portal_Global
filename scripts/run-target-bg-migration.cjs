#!/usr/bin/env node

/**
 * Run Target Business Groups Migration
 * Usage: node scripts/run-target-bg-migration.cjs
 * 
 * This script runs the migration to create target_business_groups table
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

console.log('🔍 Running Target Business Groups migration...');
console.log('📍 Host:', new URL(databaseUrl).hostname);

const sql = neon(databaseUrl);

// Helper function to retry database operations
async function retryOperation(operation, maxRetries = 3, delay = 1000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const isTimeout = errorMessage.includes('ETIMEDOUT') || 
                       errorMessage.includes('fetch failed') ||
                       error?.code === 'ETIMEDOUT';
      
      if (!isTimeout || attempt === maxRetries) {
        throw error;
      }
      
      console.log(`   ⚠️  Attempt ${attempt}/${maxRetries} failed, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2; // Exponential backoff
    }
  }
}

async function runMigration() {
  try {
    console.log('\n📝 Step 1: Creating target_business_groups table...');
    await retryOperation(async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS target_business_groups (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL UNIQUE,
          description TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;
    });
    console.log('✅ target_business_groups table created');

    console.log('\n📝 Step 2: Creating index...');
    await retryOperation(async () => {
      await sql`
        CREATE INDEX IF NOT EXISTS idx_target_business_groups_name ON target_business_groups(name)
      `;
    });
    console.log('✅ Index created');

    console.log('\n📝 Step 3: Migrating existing business_unit_groups to target_business_groups...');
    await retryOperation(async () => {
      await sql`
        INSERT INTO target_business_groups (name, description)
        SELECT name, description
        FROM business_unit_groups
        ON CONFLICT (name) DO NOTHING
      `;
    });
    console.log('✅ Business unit groups migrated');

    console.log('\n📝 Step 4: Adding target_business_group_id to ticket_classification_mapping...');
    await retryOperation(async () => {
      await sql`
        ALTER TABLE ticket_classification_mapping 
        ADD COLUMN IF NOT EXISTS target_business_group_id INTEGER REFERENCES target_business_groups(id) ON DELETE CASCADE
      `;
    });
    console.log('✅ Column added');

    console.log('\n📝 Step 5: Adding description to ticket_classification_mapping...');
    await retryOperation(async () => {
      await sql`
        ALTER TABLE ticket_classification_mapping 
        ADD COLUMN IF NOT EXISTS description TEXT
      `;
    });
    console.log('✅ Description column added');

    console.log('\n📝 Step 6: Migrating existing mappings...');
    const mappingCount = await retryOperation(async () => {
      return await sql`
        UPDATE ticket_classification_mapping tcm
        SET target_business_group_id = (
          SELECT tbg.id
          FROM target_business_groups tbg
          INNER JOIN business_unit_groups bug ON tbg.name = bug.name
          WHERE bug.id = tcm.business_unit_group_id
          LIMIT 1
        )
        WHERE tcm.target_business_group_id IS NULL
        RETURNING id
      `;
    });
    console.log(`✅ Migrated ${mappingCount.length} mappings`);

    console.log('\n📝 Step 7: Dropping old unique constraint...');
    await retryOperation(async () => {
      await sql`
        ALTER TABLE ticket_classification_mapping 
        DROP CONSTRAINT IF EXISTS ticket_classification_mapping_business_unit_group_id_category_id_subcategory_id_key
      `;
    });
    console.log('✅ Old constraint dropped');

    console.log('\n📝 Step 8: Adding new unique constraint...');
    await retryOperation(async () => {
      await sql`
        ALTER TABLE ticket_classification_mapping 
        ADD CONSTRAINT IF NOT EXISTS unique_target_category_subcategory
        UNIQUE (target_business_group_id, category_id, subcategory_id)
      `;
    });
    console.log('✅ New constraint added');

    console.log('\n📝 Step 9: Adding target_business_group_id to tickets table...');
    await retryOperation(async () => {
      await sql`
        ALTER TABLE tickets 
        ADD COLUMN IF NOT EXISTS target_business_group_id INTEGER REFERENCES target_business_groups(id)
      `;
    });
    console.log('✅ Column added to tickets');

    console.log('\n📝 Step 10: Adding assignee_group_id to tickets table...');
    await retryOperation(async () => {
      await sql`
        ALTER TABLE tickets 
        ADD COLUMN IF NOT EXISTS assignee_group_id INTEGER REFERENCES business_unit_groups(id)
      `;
    });
    console.log('✅ Column added to tickets');

    console.log('\n📝 Step 11: Seeding "Others" category...');
    await retryOperation(async () => {
      await sql`
        INSERT INTO categories (name, description) 
        VALUES ('Others', 'General category for undefined classifications') 
        ON CONFLICT (name) DO NOTHING
      `;
    });
    console.log('✅ "Others" category seeded');

    console.log('\n📝 Step 12: Seeding "Others" subcategory...');
    await retryOperation(async () => {
      await sql`
        INSERT INTO subcategories (category_id, name, description, estimated_duration_minutes, input_template, closure_steps)
        SELECT 
          c.id,
          'Others',
          'General subcategory for undefined classifications',
          0,
          'Please provide a detailed description.',
          'N/A'
        FROM categories c
        WHERE c.name = 'Others'
        ON CONFLICT (category_id, name) DO NOTHING
      `;
    });
    console.log('✅ "Others" subcategory seeded');

    console.log('\n📝 Step 13: Creating "Others" subcategory with proper fields...');
    const othersCategory = await retryOperation(async () => {
      return await sql`SELECT id FROM categories WHERE name = 'Others'`;
    });
    
    if (othersCategory.length > 0) {
      // Update or insert "Others" subcategory with all required fields
      await retryOperation(async () => {
        await sql`
          INSERT INTO subcategories (category_id, name, description, estimated_duration_minutes, input_template, closure_steps)
          VALUES (
            ${othersCategory[0].id},
            'Others',
            'General subcategory for undefined classifications',
            0,
            'Please provide a detailed description.',
            'N/A'
          )
          ON CONFLICT (category_id, name) 
          DO UPDATE SET
            description = EXCLUDED.description,
            estimated_duration_minutes = EXCLUDED.estimated_duration_minutes,
            input_template = EXCLUDED.input_template,
            closure_steps = EXCLUDED.closure_steps
        `;
      });
      console.log('✅ "Others" subcategory created/updated');
    }

    console.log('\n📝 Step 14: Creating "Others" mappings for all target business groups...');
    const targetBusinessGroups = await retryOperation(async () => {
      return await sql`SELECT id FROM target_business_groups`;
    });
    const othersSubcategory = await retryOperation(async () => {
      return await sql`
        SELECT id FROM subcategories 
        WHERE name = 'Others' 
        AND category_id = (SELECT id FROM categories WHERE name = 'Others')
      `;
    });
    
    if (targetBusinessGroups.length > 0 && othersCategory.length > 0 && othersSubcategory.length > 0) {
      for (const tbg of targetBusinessGroups) {
        await retryOperation(async () => {
          await sql`
            INSERT INTO ticket_classification_mapping (
              target_business_group_id, 
              category_id, 
              subcategory_id, 
              estimated_duration, 
              auto_title_template, 
              description
            )
            VALUES (
              ${tbg.id}, 
              ${othersCategory[0].id}, 
              ${othersSubcategory[0].id}, 
              0, 
              'Others - {{category}} / {{subcategory}}', 
              'Default mapping for undefined classifications'
            )
            ON CONFLICT (target_business_group_id, category_id, subcategory_id) DO NOTHING
          `;
        });
      }
      console.log(`✅ Created "Others" mappings for ${targetBusinessGroups.length} target business groups`);
    }

    console.log('\n📝 Step 15: Migrating existing tickets to use target_business_group_id...');
    await retryOperation(async () => {
      await sql`
        UPDATE tickets t
        SET target_business_group_id = (
          SELECT tbg.id
          FROM target_business_groups tbg
          JOIN business_unit_groups bug ON tbg.name = bug.name
          WHERE bug.id = t.business_unit_group_id
          LIMIT 1
        )
        WHERE t.target_business_group_id IS NULL AND t.business_unit_group_id IS NOT NULL
      `;
    });
    console.log('✅ Existing tickets migrated');

    console.log('\n📝 Step 16: Setting assignee_group_id for existing tickets...');
    await retryOperation(async () => {
      await sql`
        UPDATE tickets t
        SET assignee_group_id = (
          SELECT u.business_unit_group_id
          FROM users u
          WHERE u.id = t.assigned_to
        )
        WHERE t.assigned_to IS NOT NULL AND t.assignee_group_id IS NULL
      `;
    });
    console.log('✅ Assignee groups set');

    console.log('\n📝 Step 17: Creating indexes...');
    await retryOperation(async () => {
      await sql`
        CREATE INDEX IF NOT EXISTS idx_tickets_target_bg ON tickets(target_business_group_id)
      `;
    });
    await retryOperation(async () => {
      await sql`
        CREATE INDEX IF NOT EXISTS idx_tickets_assignee_group ON tickets(assignee_group_id)
      `;
    });
    await retryOperation(async () => {
      await sql`
        CREATE INDEX IF NOT EXISTS idx_ticket_classification_target_bg ON ticket_classification_mapping(target_business_group_id)
      `;
    });
    console.log('✅ Indexes created');

    console.log('\n✅ Target Business Groups migration completed successfully!');
    
    // Verify the table exists
    console.log('\n🔍 Verifying migration...');
    const verify = await retryOperation(async () => {
      return await sql`
        SELECT COUNT(*) as count FROM target_business_groups
      `;
    });
    console.log(`✅ Found ${verify[0]?.count || 0} target business groups`);

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
    console.log('   2. The dashboard should now work correctly');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Unexpected error:', error);
    process.exit(1);
  });
