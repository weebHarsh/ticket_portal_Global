# Database Connection Timeout Troubleshooting

## Current Issue
You're experiencing persistent `ETIMEDOUT` errors when connecting to your Neon database. The retry logic is attempting 5 times but all attempts are failing.

## Symptoms
```
Error connecting to database: TypeError: fetch failed
[cause]: AggregateError: { code: 'ETIMEDOUT' }
[DB Retry] Attempt 1/5 failed... Retrying in 1162ms...
[DB Retry] Attempt 2/5 failed... Retrying in 2488ms...
[DB Retry] Attempt 3/5 failed... Retrying in 4111ms...
```

## Possible Causes

### 1. Network Connectivity Issues
- **Firewall blocking outbound connections** to Neon's servers
- **VPN or proxy** interfering with connections
- **ISP throttling** or blocking certain ports
- **Local network restrictions** (corporate network, etc.)

### 2. Neon Database Issues
- **Database is suspended** (Neon free tier auto-suspends after inactivity)
- **Region connectivity problems**
- **Neon service outage**
- **Connection pool exhausted**

### 3. Configuration Issues
- **Invalid connection string**
- **Wrong region endpoint**
- **Missing SSL/TLS configuration**

## Diagnostic Steps

### Step 1: Check Neon Dashboard
1. Go to https://console.neon.tech
2. Check if your database is **Active** or **Suspended**
3. If suspended, wake it up by clicking on it
4. Check for any service alerts

### Step 2: Test Network Connectivity
```bash
# Test if you can reach Neon's endpoint
ping ep-shiny-hall-a4xsbbt3-pooler.us-east-1.aws.neon.tech

# Test port connectivity
nc -zv ep-shiny-hall-a4xsbbt3-pooler.us-east-1.aws.neon.tech 5432

# Or using telnet
telnet ep-shiny-hall-a4xsbbt3-pooler.us-east-1.aws.neon.tech 5432
```

### Step 3: Test with psql
```bash
psql "postgresql://neondb_owner:npg_rc7YtW6bLVzQ@ep-shiny-hall-a4xsbbt3-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require"
```

If this works, the issue is with the Node.js/fetch configuration.
If this fails, it's a network/Neon issue.

### Step 4: Check for VPN/Proxy
```bash
# Check if you're using a proxy
echo $HTTP_PROXY
echo $HTTPS_PROXY

# Disable proxy temporarily
unset HTTP_PROXY
unset HTTPS_PROXY
unset http_proxy
unset https_proxy
```

### Step 5: Try Alternative Connection String
Neon provides multiple endpoints. Try the direct (non-pooler) endpoint:
```
# Current (pooler):
postgresql://...@ep-shiny-hall-a4xsbbt3-pooler.us-east-1.aws.neon.tech/...

# Try direct:
postgresql://...@ep-shiny-hall-a4xsbbt3.us-east-1.aws.neon.tech/...
```

## Solutions

### Solution 1: Wake Up Suspended Database
If your database is suspended:
1. Go to Neon dashboard
2. Click on your project
3. The database will wake up automatically
4. Wait 10-20 seconds
5. Try your app again

### Solution 2: Use Direct Connection (Not Pooler)
Update your `.env.local`:
```env
# Remove -pooler from the hostname
DATABASE_URL=postgresql://neondb_owner:npg_rc7YtW6bLVzQ@ep-shiny-hall-a4xsbbt3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

### Solution 3: Increase Timeout
Add connection timeout to your DATABASE_URL:
```env
DATABASE_URL=postgresql://...?sslmode=require&connect_timeout=30
```

### Solution 4: Use Different Region
If your current region has connectivity issues:
1. Create a new Neon project in a different region
2. Run migrations on the new database
3. Update your DATABASE_URL

### Solution 5: Switch to Local PostgreSQL (Temporary)
For development, use a local PostgreSQL:
```bash
# Install PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# Create database
sudo -u postgres createdb ticket_portal

# Create user
sudo -u postgres psql -c "CREATE USER ticket_user WITH PASSWORD 'your_password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ticket_portal TO ticket_user;"

# Update .env.local
DATABASE_URL=postgresql://ticket_user:your_password@localhost:5432/ticket_portal
```

### Solution 6: Check Firewall Rules
```bash
# Ubuntu/Debian
sudo ufw status
sudo ufw allow out 5432/tcp

# Check iptables
sudo iptables -L -n | grep 5432
```

### Solution 7: Use HTTP Proxy for Neon (if behind corporate firewall)
```bash
# Set proxy for Node.js
export HTTP_PROXY=http://your-proxy:port
export HTTPS_PROXY=http://your-proxy:port
```

## Immediate Workaround

### Option A: Use Neon's HTTP API (Serverless Driver)
The current setup uses `@neondatabase/serverless` which uses HTTP/WebSocket. If this is timing out, ensure:

1. **No firewall blocking HTTPS (port 443)**
2. **WebSocket connections allowed**
3. **No aggressive timeout settings in your network**

### Option B: Switch to Traditional pg Driver
If network issues persist with the serverless driver, switch to the traditional `pg` driver:

```bash
npm install pg
```

Update `lib/db.ts`:
```typescript
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: getDatabaseUrl(),
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 30000,
  idleTimeoutMillis: 30000,
  max: 10
})

export const sql = async (query: string, params?: any[]) => {
  const client = await pool.connect()
  try {
    const result = await client.query(query, params)
    return result.rows
  } finally {
    client.release()
  }
}
```

## Monitor Connection Health

Add this test endpoint to check database connectivity:

```typescript
// app/api/health/db/route.ts
import { sql } from '@/lib/db'

export async function GET() {
  try {
    const start = Date.now()
    const result = await sql`SELECT 1 as health`
    const duration = Date.now() - start
    
    return Response.json({
      status: 'ok',
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return Response.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
```

Visit `/api/health/db` to test connectivity.

## Next Steps

1. **Check Neon dashboard** - Is database active?
2. **Test with psql** - Can you connect from command line?
3. **Check network** - Any firewalls/proxies blocking?
4. **Try direct endpoint** - Remove `-pooler` from hostname
5. **Consider local PostgreSQL** - For development

## Contact Support

If none of these work:
- **Neon Support**: https://neon.tech/docs/introduction/support
- **Check Neon Status**: https://neonstatus.com/
- **Community Discord**: https://discord.gg/neon

## Current Retry Configuration

Your app is configured with:
- **Max retries**: 5
- **Exponential backoff**: 1s, 2s, 4s, 8s, 16s
- **Jitter**: Up to 500ms random delay

If all 5 retries fail, the issue is persistent and requires one of the solutions above.
