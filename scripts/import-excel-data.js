#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const XLSX = require('xlsx');
const { Client } = require('pg');

function parseEstimatedTime(timeStr) {
  // Parse time strings like "2hrs", "30mins", "1hr 30mins" to minutes
  if (!timeStr) return 60; // default 1 hour

  const str = timeStr.toString().toLowerCase();
  let totalMinutes = 0;

  // Match hours
  const hoursMatch = str.match(/(\d+)\s*h/);
  if (hoursMatch) {
    totalMinutes += parseInt(hoursMatch[1]) * 60;
  }

  // Match minutes
  const minsMatch = str.match(/(\d+)\s*m/);
  if (minsMatch) {
    totalMinutes += parseInt(minsMatch[1]);
  }

  // If just a number, assume hours
  if (totalMinutes === 0) {
    const numMatch = str.match(/(\d+)/);
    if (numMatch) {
      totalMinutes = parseInt(numMatch[1]) * 60;
    }
  }

  return totalMinutes || 60;
}

async function importExcelData() {
  // Read the Excel file
  console.log('📄 Reading Excel file: Ticket-portal.xlsx');
  const workbook = XLSX.readFile('Ticket-portal.xlsx');
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(sheet);

  console.log(`Found ${data.length} rows of data\n`);

  // Extract unique categories and subcategories with their data
  const categories = new Map();
  const allMappings = [];

  data.forEach(row => {
    const cat = row['Category'];
    const subCat = row['Sub Category '] || row['Sub Category'];
    const input = row['Input']; // This becomes the ticket title template
    const time = row['Estimated Time'];

    if (cat && subCat) {
      if (!categories.has(cat)) {
        categories.set(cat, []);
      }

      // Check for duplicates
      const existing = categories.get(cat).find(s => s.subCat === subCat);
      if (!existing) {
        const mapping = {
          category: cat,
          subCat,
          titleTemplate: input || subCat, // Use Input as ticket title template
          estimatedMinutes: parseEstimatedTime(time)
        };
        categories.get(cat).push(mapping);
        allMappings.push(mapping);
      }
    }
  });

  console.log(`Extracted ${categories.size} categories with ${allMappings.length} subcategories:\n`);
  categories.forEach((subs, cat) => {
    console.log(`📁 ${cat}:`);
    subs.forEach(s => {
      console.log(`   └─ ${s.subCat} | Title: "${s.titleTemplate}" | ${s.estimatedMinutes} mins`);
    });
  });

  // Connect to database
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  console.log('\n✓ Connected to database');

  try {
    // Clear existing data
    console.log('\n🗑️  Clearing existing categories and subcategories...');
    await client.query('DELETE FROM ticket_classification_mapping');
    await client.query('UPDATE tickets SET category_id = NULL, subcategory_id = NULL');
    await client.query('DELETE FROM subcategories');
    await client.query('DELETE FROM categories');

    // Insert categories
    console.log('\n📥 Inserting categories...');
    const categoryIds = new Map();

    for (const [catName, subcats] of categories) {
      const result = await client.query(
        'INSERT INTO categories (name, description) VALUES ($1, $2) RETURNING id',
        [catName, `${catName} related tickets`]
      );
      categoryIds.set(catName, result.rows[0].id);
      console.log(`  ✓ ${catName} (id: ${result.rows[0].id})`);
    }

    // Insert subcategories and track their IDs
    console.log('\n📥 Inserting subcategories...');
    const subcategoryIds = new Map(); // key: "category|subcategory"

    for (const [catName, subcats] of categories) {
      const catId = categoryIds.get(catName);
      for (const sub of subcats) {
        const result = await client.query(
          'INSERT INTO subcategories (category_id, name, description) VALUES ($1, $2, $3) RETURNING id',
          [catId, sub.subCat, sub.titleTemplate]
        );
        subcategoryIds.set(`${catName}|${sub.subCat}`, {
          id: result.rows[0].id,
          catId,
          titleTemplate: sub.titleTemplate,
          estimatedMinutes: sub.estimatedMinutes
        });
      }
    }
    console.log(`  ✓ Inserted ${subcategoryIds.size} subcategories`);

    // Get ALL business unit IDs for classification mapping
    const buResult = await client.query('SELECT id, name FROM business_unit_groups ORDER BY id');
    const allBusinessUnits = buResult.rows;

    // Get a default user for SPOC
    const userResult = await client.query("SELECT id FROM users WHERE role = 'admin' OR role = 'Admin' LIMIT 1");
    const defaultSpocId = userResult.rows[0]?.id || 1;

    // Insert ticket classification mappings (for auto-fill) - FOR ALL BUSINESS UNITS
    if (allBusinessUnits.length > 0) {
      console.log(`\n📥 Creating ticket classification mappings for ${allBusinessUnits.length} business units...`);
      let mappingCount = 0;

      for (const bu of allBusinessUnits) {
        for (const [key, sub] of subcategoryIds) {
          await client.query(
            `INSERT INTO ticket_classification_mapping
             (business_unit_group_id, category_id, subcategory_id, estimated_duration, auto_title_template, spoc_user_id)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT DO NOTHING`,
            [bu.id, sub.catId, sub.id, sub.estimatedMinutes, sub.titleTemplate, defaultSpocId]
          );
          mappingCount++;
        }
        console.log(`  ✓ Created mappings for ${bu.name}`);
      }
      console.log(`  ✓ Total: ${mappingCount} classification mappings created`);
    }

    // Verify
    console.log('\n📊 Final Database State:');
    const catCount = await client.query('SELECT COUNT(*) FROM categories');
    const subCount = await client.query('SELECT COUNT(*) FROM subcategories');
    const mapCount = await client.query('SELECT COUNT(*) FROM ticket_classification_mapping');
    console.log(`  Categories: ${catCount.rows[0].count}`);
    console.log(`  Subcategories: ${subCount.rows[0].count}`);
    console.log(`  Classification Mappings: ${mapCount.rows[0].count}`);

    // Show sample data
    console.log('\n📋 Sample Categories:');
    const sampleCats = await client.query('SELECT id, name FROM categories ORDER BY id LIMIT 5');
    sampleCats.rows.forEach(r => console.log(`  ${r.id}: ${r.name}`));

    console.log('\n📋 Sample Subcategories:');
    const sampleSubs = await client.query(`
      SELECT s.id, s.name, c.name as category, s.description as title_template
      FROM subcategories s
      JOIN categories c ON s.category_id = c.id
      ORDER BY s.id LIMIT 5
    `);
    sampleSubs.rows.forEach(r => console.log(`  ${r.id}: ${r.category} → ${r.name} | "${r.title_template}"`));

    console.log('\n✅ Excel data imported successfully!');
    console.log('\n🎯 Auto-fill is now configured:');
    console.log('   When creating a ticket, selecting a subcategory will auto-populate:');
    console.log('   - Ticket title (from Input column)');
    console.log('   - Estimated duration (from Estimated Time column)');

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await client.end();
  }
}

importExcelData().catch(console.error);
