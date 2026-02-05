# Database Setup Guide

## Quick Setup (3 Steps)

### Step 1: Get Your Database Connection String

You need a Neon PostgreSQL database connection string. Choose one option:

#### Option A: If you already have a Neon database
1. Go to [Neon Console](https://console.neon.tech)
2. Select your project
3. Click "Connection Details"
4. Copy the connection string (it looks like):
   ```
   postgresql://username:password@ep-xxx-xxx.region.aws.neon.tech/dbname?sslmode=require
   ```

#### Option B: Create a new Neon database (FREE)
1. Go to [Neon.tech](https://neon.tech)
2. Sign up for free account
3. Create a new project
4. Copy the connection string provided

#### Option C: Use another PostgreSQL database
Any PostgreSQL database will work. The connection string format is:
```
postgresql://username:password@host:port/database?sslmode=require
```

---

### Step 2: Configure Environment Variables

1. Open the file `.env.local` in the project root
2. Replace the empty `DATABASE_URL=` line with your connection string:
   ```
   DATABASE_URL=postgresql://your-actual-connection-string-here
   ```
3. Save the file

---

### Step 3: Run the Setup Script

```bash
# Run the database setup script
node scripts/run-seed.js
```

This will:
- ✓ Clear existing test data
- ✓ Create 15 users with test credentials
- ✓ Create 10 business units
- ✓ Create 10 categories with 15 subcategories
- ✓ Create 5 teams with 15 members
- ✓ Create 15 ticket classifications for auto-fill
- ✓ Create 15 sample tickets
- ✓ Create 9 comments

---

## Test Credentials

After setup completes, you can login with:

**Email**: `john.doe@company.com`
**Password**: `TestUser@123`

All 15 test users have the same password: `TestUser@123`

### All Test Users:
1. john.doe@company.com - Admin
2. jane.smith@company.com - Manager
3. mike.johnson@company.com - Support Agent
4. sarah.williams@company.com - Team Lead
5. david.brown@company.com - Support Agent
6. emily.davis@company.com - Developer
7. robert.miller@company.com - Manager
8. lisa.wilson@company.com - Support Agent
9. james.moore@company.com - Analyst
10. mary.taylor@company.com - Developer
11. chris.anderson@company.com - Manager
12. patricia.thomas@company.com - Support Agent
13. daniel.jackson@company.com - Team Lead
14. jennifer.white@company.com - Developer
15. michael.harris@company.com - Admin

---

## Troubleshooting

### Error: "DATABASE_URL environment variable is not set"
- Make sure you edited `.env.local` and added your connection string
- Make sure there are no extra spaces around the `=` sign
- Restart your terminal/dev server after changing .env.local

### Error: "Connection refused" or "Connection timeout"
- Check that your database is running
- Verify the connection string is correct
- Check if your IP is whitelisted in Neon (if using Neon)

### Error: "relation does not exist"
- Your database might not have the required tables
- You may need to run the schema creation scripts first:
  ```bash
  # Run these in order if tables don't exist
  node -e "require('@neondatabase/serverless').neon(process.env.DATABASE_URL)('$(cat scripts/001-create-tables.sql)')"
  node -e "require('@neondatabase/serverless').neon(process.env.DATABASE_URL)('$(cat scripts/003-master-data-tables.sql)')"
  ```

### Error: SQL syntax errors
- Make sure you're using PostgreSQL (not MySQL or other database)
- The SQL scripts are designed for PostgreSQL

---

## After Setup

Once the setup is complete:

1. Make sure dev server is running:
   ```bash
   npm run dev
   ```

2. Open your browser to: http://localhost:3000

3. Click "Login" (or go to http://localhost:3000/login)

4. Use credentials:
   - Email: `john.doe@company.com`
   - Password: `TestUser@123`

5. You should see:
   - Dashboard with stats
   - 15 tickets in various states
   - 5 teams with members
   - All master data populated
   - Analytics charts with data

---

## Manual SQL Execution (Alternative Method)

If the Node.js script doesn't work, you can manually run the SQL:

### Using psql command line:
```bash
psql "your-connection-string-here" -f scripts/FINAL-seed-all-data.sql
```

### Using Neon Console:
1. Go to [Neon Console](https://console.neon.tech)
2. Select your project
3. Click "SQL Editor"
4. Copy contents of `scripts/FINAL-seed-all-data.sql`
5. Paste and click "Run"

### Using any PostgreSQL client:
1. Connect to your database with any SQL client (TablePlus, pgAdmin, DBeaver, etc.)
2. Open `scripts/FINAL-seed-all-data.sql`
3. Execute the entire script

---

## Need Help?

If you encounter issues:
1. Check that DATABASE_URL is set correctly in `.env.local`
2. Verify your database is accessible
3. Try the manual SQL execution methods above
4. Check the console output for specific error messages
