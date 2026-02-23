#!/usr/bin/env node
/**
 * Test script to verify Neon database connection
 * Usage: node test-neon-connection.js
 */

import { neon } from "@neondatabase/serverless"
import { config } from "dotenv"
import { fileURLToPath } from "url"
import { dirname, join } from "path"

// Load environment variables from .env.local
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
config({ path: join(__dirname, ".env.local") })

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  console.error("❌ DATABASE_URL is not set in .env.local")
  console.error("   Please add: DATABASE_URL=postgresql://...")
  process.exit(1)
}

console.log("🔍 Testing Neon database connection...")
console.log("📍 Host:", new URL(databaseUrl).hostname)

// Check if using pooler endpoint
if (databaseUrl.includes("-pooler.")) {
  console.log("✅ Using pooler endpoint (recommended)")
} else {
  console.warn("⚠️  Not using pooler endpoint. Consider using -pooler endpoint for better connection management")
}

let attempt = 0
const maxAttempts = 3

async function testConnection() {
  for (attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`\n🔄 Attempt ${attempt}/${maxAttempts}...`)
      
      const sql = neon(databaseUrl)
      const startTime = Date.now()
      
      const result = await sql`SELECT NOW() as current_time, version() as pg_version`
      const duration = Date.now() - startTime
      
      console.log("✅ Connection successful!")
      console.log("⏰ Database time:", result[0].current_time)
      console.log("📊 PostgreSQL version:", result[0].pg_version.split(" ")[0] + " " + result[0].pg_version.split(" ")[1])
      console.log(`⚡ Response time: ${duration}ms`)
      
      // Test a simple query
      const userCount = await sql`SELECT COUNT(*) as count FROM users`
      console.log(`👥 Users in database: ${userCount[0].count}`)
      
      return true
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      const errorCode = error?.code || error?.cause?.code
      
      console.error(`❌ Attempt ${attempt} failed:`)
      console.error(`   Error: ${errorMessage}`)
      if (errorCode) {
        console.error(`   Code: ${errorCode}`)
      }
      
      if (attempt < maxAttempts) {
        const waitTime = 1000 * Math.pow(2, attempt - 1)
        console.log(`   Retrying in ${waitTime}ms...`)
        await new Promise(resolve => setTimeout(resolve, waitTime))
      } else {
        console.error("\n❌ All connection attempts failed")
        console.error("\n💡 Troubleshooting tips:")
        console.error("   1. Verify DATABASE_URL in .env.local is correct")
        console.error("   2. Check if database is active in Neon dashboard")
        console.error("   3. Test network connectivity: ping <hostname>")
        console.error("   4. Check firewall/VPN settings")
        console.error("   5. Ensure using pooler endpoint (-pooler in hostname)")
        process.exit(1)
      }
    }
  }
}

testConnection()
  .then(() => {
    console.log("\n✅ Connection test completed successfully!")
    process.exit(0)
  })
  .catch((error) => {
    console.error("\n❌ Unexpected error:", error)
    process.exit(1)
  })
