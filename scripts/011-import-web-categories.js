/**
 * Import Categories and Subcategories from Excel file
 *
 * This script:
 * 1. Adds input_template, estimated_duration_minutes, and closure_steps columns to subcategories
 * 2. Clears existing categories and subcategories
 * 3. Imports new data from Excel file
 *
 * Run with: node scripts/011-import-web-categories.js
 */

const { Client } = require('pg')
const XLSX = require('xlsx')
const path = require('path')

require('dotenv').config({ path: '.env.local' })

const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  console.error('DATABASE_URL not found in environment variables')
  process.exit(1)
}

async function importCategories() {
  const client = new Client({ connectionString: DATABASE_URL })

  try {
    await client.connect()
    console.log('Connected to database')

    // Step 1: Add new columns to subcategories table if they don't exist
    console.log('\n1. Adding new columns to subcategories table...')
    await client.query(`
      ALTER TABLE subcategories
      ADD COLUMN IF NOT EXISTS input_template TEXT,
      ADD COLUMN IF NOT EXISTS estimated_duration_minutes INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS closure_steps TEXT
    `)
    console.log('   Columns added/verified')

    // Step 2: Read Excel file
    console.log('\n2. Reading Excel file...')
    const excelPath = path.join(__dirname, '..', 'mf_category_web 16Jan.xlsx')
    const workbook = XLSX.readFile(excelPath)
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const data = XLSX.utils.sheet_to_json(sheet)
    console.log(`   Found ${data.length} rows`)

    // Step 3: Parse and organize data
    console.log('\n3. Parsing data...')
    const categoriesMap = new Map() // category name -> { subcategories: [...] }

    for (const row of data) {
      const categoryName = (row['Category'] || '').trim()
      const subCategoryName = (row['Sub Category '] || row['Sub Category'] || '').trim()
      const inputTemplate = (row['Input'] || '').trim()
      const estimatedTime = (row['Estimated Time'] || '').trim()
      const closureSteps = (row['closur step'] || row['closure step'] || '').trim()

      if (!categoryName || !subCategoryName) {
        console.log(`   Skipping row with missing category/subcategory: ${JSON.stringify(row).slice(0, 100)}`)
        continue
      }

      // Parse estimated time (e.g., "10hrs" -> 600 minutes, "4 hrs" -> 240 minutes)
      let durationMinutes = 0
      const timeMatch = estimatedTime.toLowerCase().match(/(\d+(?:\.\d+)?)\s*(hrs?|hours?|min|minutes?)/)
      if (timeMatch) {
        const value = parseFloat(timeMatch[1])
        const unit = timeMatch[2]
        if (unit.startsWith('hr') || unit.startsWith('hour')) {
          durationMinutes = Math.round(value * 60)
        } else {
          durationMinutes = Math.round(value)
        }
      }

      if (!categoriesMap.has(categoryName)) {
        categoriesMap.set(categoryName, { subcategories: [] })
      }

      categoriesMap.get(categoryName).subcategories.push({
        name: subCategoryName,
        inputTemplate,
        durationMinutes,
        closureSteps
      })
    }

    console.log(`   Found ${categoriesMap.size} unique categories`)

    // Step 4: Clear existing data (in order due to foreign keys)
    console.log('\n4. Clearing existing data...')

    // First, remove references from tickets
    await client.query(`
      UPDATE tickets SET category_id = NULL, subcategory_id = NULL
    `)
    console.log('   Cleared ticket references')

    // Clear ticket_classification_mapping
    await client.query(`DELETE FROM ticket_classification_mapping`)
    console.log('   Cleared ticket_classification_mapping')

    // Clear subcategories
    await client.query(`DELETE FROM subcategories`)
    console.log('   Cleared subcategories')

    // Clear categories
    await client.query(`DELETE FROM categories`)
    console.log('   Cleared categories')

    // Step 5: Insert new categories and subcategories
    console.log('\n5. Inserting new data...')
    let categoryCount = 0
    let subcategoryCount = 0
    let skippedDuplicates = 0

    for (const [categoryName, categoryData] of categoriesMap) {
      // Insert category
      const catResult = await client.query(
        `INSERT INTO categories (name, description) VALUES ($1, $2) RETURNING id`,
        [categoryName, `Category: ${categoryName}`]
      )
      const categoryId = catResult.rows[0].id
      categoryCount++

      // Track inserted subcategory names to handle duplicates
      const insertedSubcats = new Set()

      // Insert subcategories
      for (const subcat of categoryData.subcategories) {
        // Skip if already inserted for this category
        if (insertedSubcats.has(subcat.name)) {
          console.log(`   Skipping duplicate: ${categoryName} > ${subcat.name}`)
          skippedDuplicates++
          continue
        }
        insertedSubcats.add(subcat.name)

        await client.query(
          `INSERT INTO subcategories (category_id, name, description, input_template, estimated_duration_minutes, closure_steps)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            categoryId,
            subcat.name,
            `Subcategory: ${subcat.name}`,
            subcat.inputTemplate,
            subcat.durationMinutes,
            subcat.closureSteps
          ]
        )
        subcategoryCount++
      }
    }

    if (skippedDuplicates > 0) {
      console.log(`   Skipped ${skippedDuplicates} duplicate subcategories`)
    }

    console.log(`   Inserted ${categoryCount} categories`)
    console.log(`   Inserted ${subcategoryCount} subcategories`)

    // Step 6: Verify data
    console.log('\n6. Verifying data...')
    const catCheck = await client.query(`SELECT COUNT(*) as count FROM categories`)
    const subcatCheck = await client.query(`SELECT COUNT(*) as count FROM subcategories`)
    const sampleSubcat = await client.query(`
      SELECT s.name, s.input_template, s.estimated_duration_minutes, s.closure_steps, c.name as category_name
      FROM subcategories s
      JOIN categories c ON s.category_id = c.id
      LIMIT 3
    `)

    console.log(`   Categories in DB: ${catCheck.rows[0].count}`)
    console.log(`   Subcategories in DB: ${subcatCheck.rows[0].count}`)
    console.log('\n   Sample subcategories:')
    sampleSubcat.rows.forEach((row, i) => {
      console.log(`   ${i + 1}. ${row.category_name} > ${row.name}`)
      console.log(`      Duration: ${row.estimated_duration_minutes} min`)
      console.log(`      Template: ${(row.input_template || '').slice(0, 80)}...`)
    })

    console.log('\n=== Import completed successfully! ===')

  } catch (error) {
    console.error('Error during import:', error)
    throw error
  } finally {
    await client.end()
  }
}

importCategories()
