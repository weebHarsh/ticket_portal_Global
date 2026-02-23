# Troubleshooting Database Connection Issues

## Error: "Failed to login: Error connecting to database: TypeError: fetch failed"

This error indicates that the application cannot connect to the database. Here's how to troubleshoot:

## Error: ETIMEDOUT (Connection Timeout)

If you see an error like:
```
ETIMEDOUT
code: 'ETIMEDOUT'
TypeError: fetch failed
```

This indicates a network timeout when connecting to the database. The application now includes **automatic retry logic** (up to 3 attempts with exponential backoff) to handle transient network issues.

### What the Retry Logic Does

The application will automatically:
1. Retry failed database operations up to 3 times
2. Wait 1 second, 2 seconds, then 4 seconds between retries (exponential backoff)
3. Only retry on network/timeout errors (ETIMEDOUT, fetch failed, ECONNREFUSED, etc.)

### If Timeouts Persist

If you continue to see timeout errors after the retries, try these solutions:

#### 1. Use Neon Pooler Endpoint (Recommended)

Make sure your connection string uses the **pooler endpoint** (ends with `-pooler`):

```env
# ✅ Good - Uses pooler
DATABASE_URL=postgresql://user:pass@ep-xxxxx-xxxxx-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require

# ❌ Avoid - Direct connection (more prone to timeouts)
DATABASE_URL=postgresql://user:pass@ep-xxxxx-xxxxx.us-east-1.aws.neon.tech/neondb?sslmode=require
```

#### 2. Check Network Connectivity

Test if you can reach the Neon database:

```bash
# Test connectivity
ping ep-shiny-hall-a4xsbbt3-pooler.us-east-1.aws.neon.tech

# Test with psql
psql "postgresql://neondb_owner:password@ep-shiny-hall-a4xsbbt3-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require" -c "SELECT 1"
```

#### 3. Check Neon Dashboard

- Log into your Neon dashboard
- Verify the database is **active** (not paused)
- Check for any connection limits or restrictions
- Review connection metrics for any issues

#### 4. Firewall/VPN Issues

- **Corporate firewall**: May be blocking outbound connections
- **VPN**: Try disconnecting VPN temporarily to test
- **IP restrictions**: Check if Neon has IP allowlisting enabled

#### 5. Connection String Parameters

For Neon, ensure your connection string includes:

```env
DATABASE_URL=postgresql://user:pass@ep-xxxxx-pooler.region.aws.neon.tech/dbname?sslmode=require&channel_binding=require
```

Key parameters:
- `sslmode=require` - Required for Neon
- `channel_binding=require` - Optional but recommended for security
- Use `-pooler` endpoint for better connection management

#### 6. Regional Latency

If you're far from the database region:
- Consider using a database in a closer region
- Check network latency: `ping ep-xxxxx-pooler.region.aws.neon.tech`

## Quick Checks

### 1. Verify DATABASE_URL is Set

Check if `DATABASE_URL` is set in your `.env.local` file:

```bash
# In your project root
cat .env.local | grep DATABASE_URL
```

**Expected format:**
```
DATABASE_URL=postgresql://username:password@host:5432/database?sslmode=require
```

### 2. Check Database URL Format

Your `DATABASE_URL` should:
- Start with `postgresql://` or `postgres://`
- Include username, password, host, port, and database name
- Have proper SSL mode (`?sslmode=require` for cloud databases)

**Example (Neon):**
```
DATABASE_URL=postgresql://user:pass@ep-xxxxx-xxxxx.us-east-2.aws.neon.tech/neondb?sslmode=require
```

**Example (Local PostgreSQL):**
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ticketing_dev?sslmode=disable
```

### 3. Verify Database Server is Running

**For Local PostgreSQL:**
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Or on macOS
brew services list | grep postgresql
```

**For Cloud Databases (Neon, Supabase, etc.):**
- Check your database provider's dashboard
- Verify the database is active and not paused
- Check if there are any connection limits or restrictions

### 4. Test Database Connection

Create a test file `test-connection.js`:

```javascript
import { neon } from "@neondatabase/serverless"

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  console.error("❌ DATABASE_URL is not set")
  process.exit(1)
}

console.log("🔍 Testing database connection...")
console.log("📍 Host:", new URL(databaseUrl).hostname)

try {
  const sql = neon(databaseUrl)
  const result = await sql`SELECT NOW() as current_time`
  console.log("✅ Connection successful!")
  console.log("⏰ Database time:", result[0].current_time)
} catch (error) {
  console.error("❌ Connection failed:", error.message)
  console.error("Full error:", error)
  process.exit(1)
}
```

Run it:
```bash
node test-connection.js
```

### 5. Check Network Connectivity

**For Cloud Databases:**
- Verify your IP is not blocked by firewall
- Check if VPN is interfering with connection
- Test if you can reach the database host:
  ```bash
  # Replace with your actual database host
  ping ep-xxxxx-xxxxx.us-east-2.aws.neon.tech
  ```

**For Local Databases:**
- Ensure PostgreSQL is listening on the correct port (default: 5432)
- Check firewall settings
- Verify connection string uses correct host (localhost vs 127.0.0.1)

### 6. Check SSL/TLS Settings

**Cloud Databases (Neon, Supabase, Railway):**
- Must use `?sslmode=require` or `?sslmode=prefer`
- Example: `postgresql://user:pass@host:5432/db?sslmode=require`

**Local PostgreSQL:**
- Can use `?sslmode=disable` for development
- Example: `postgresql://user:pass@localhost:5432/db?sslmode=disable`

### 7. Verify Environment Variables are Loaded

The application reads from `.env.local` file. Make sure:

1. File exists in project root: `ticket_portal_Global/.env.local`
2. File is not in `.gitignore` (it should be, but make sure it exists)
3. Restart your development server after changing `.env.local`:
   ```bash
   # Stop the server (Ctrl+C)
   # Then restart
   npm run dev
   ```

### 8. Check for Special Characters in Password

If your database password contains special characters, they must be URL-encoded:

**Special Characters that need encoding:**
- `@` → `%40`
- `#` → `%23`
- `!` → `%21`
- `/` → `%2F`
- `?` → `%3F`
- `=` → `%3D`
- `&` → `%26`

**Example:**
```
# Password: myP@ss#word!
# Encoded: myP%40ss%23word%21
DATABASE_URL=postgresql://user:myP%40ss%23word%21@host:5432/db
```

**Quick encoding in Node.js:**
```javascript
encodeURIComponent('myP@ss#word!') // Returns: myP%40ss%23word%21
```

## Common Solutions

### Solution 1: Database URL Not Set
```bash
# Add to .env.local
DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require
```

### Solution 2: Wrong SSL Mode
```bash
# For cloud databases, change from:
DATABASE_URL=postgresql://user:pass@host:5432/db

# To:
DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require
```

### Solution 3: Database Server Not Running
```bash
# Start PostgreSQL (Linux)
sudo systemctl start postgresql

# Start PostgreSQL (macOS)
brew services start postgresql

# Start PostgreSQL (Windows)
# Use Services app or pg_ctl
```

### Solution 4: Firewall/Network Issues
- Check if your IP is whitelisted in cloud database settings
- Disable VPN temporarily to test
- Check corporate firewall settings

### Solution 5: Restart Development Server
After changing `.env.local`, always restart:
```bash
# Stop server
Ctrl+C

# Restart
npm run dev
```

## Getting More Information

Enable detailed logging by checking server console output. The application logs database connection attempts with detailed information.

Look for logs starting with:
- `🔍 [DB:XX|XX]` - Database configuration checks
- `[LoginUser]` - Login attempt details
- `[Login API]` - API route errors

## Still Having Issues?

1. **Check server logs** - Look for detailed error messages
   - Look for `[DB Retry]` messages indicating retry attempts
   - Check for specific error codes (ETIMEDOUT, ECONNREFUSED, etc.)
2. **Verify database credentials** - Test with a database client (pgAdmin, DBeaver, etc.)
   - If `psql` works but the app doesn't, it's likely a network/firewall issue
3. **Contact database provider** - If using cloud database, check their status page
   - Neon: https://status.neon.tech
   - Check for any ongoing incidents
4. **Check application logs** - Review console output for specific error details
   - The app logs retry attempts: `[DB Retry] Attempt X/3 failed...`
5. **Test with a simple script** - Create `test-neon.js`:
   ```javascript
   import { neon } from "@neondatabase/serverless"
   const sql = neon(process.env.DATABASE_URL)
   try {
     const result = await sql`SELECT NOW()`
     console.log("✅ Success:", result)
   } catch (error) {
     console.error("❌ Error:", error)
   }
   ```

## Example .env.local File

```env
# Database Configuration
DATABASE_URL=postgresql://username:password@host:5432/database_name?sslmode=require

# Or for local development
# DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ticketing_dev?sslmode=disable

# NextAuth Configuration
AUTH_SECRET=your-secret-key-minimum-32-characters-long
NEXTAUTH_URL=http://localhost:4000
NEXTAUTH_URL_INTERNAL=http://localhost:4000
```

---

*Last Updated: Based on current codebase implementation*
