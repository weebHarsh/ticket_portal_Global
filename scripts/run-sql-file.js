#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' })
const { Client } = require('pg')
const fs = require('fs')
const path = require('path')

async function runSqlFile(filePath) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  })

  try {
    console.log(`\n📄 Running: ${path.basename(filePath)}`)
    await client.connect()
    console.log('✓ Connected to database')

    const sql = fs.readFileSync(filePath, 'utf8')
    await client.query(sql)

    console.log(`✅ Completed: ${path.basename(filePath)}\n`)
  } catch (error) {
    console.error(`❌ Error running ${path.basename(filePath)}:`, error.message)
    throw error
  } finally {
    await client.end()
  }
}

// Get file path from command line argument
const filePath = process.argv[2]

if (!filePath) {
  console.error('Usage: node run-sql-file.js <path-to-sql-file>')
  process.exit(1)
}

runSqlFile(filePath)
  .then(() => {
    console.log('🎉 SQL file executed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Failed to execute SQL file:', error)
    process.exit(1)
  })
