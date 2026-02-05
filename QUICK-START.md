# Quick Start Guide - Ticketing Portal

## ⚡ Fastest Setup (No Docker Required)

### Option 1: Use Neon Cloud Database (Recommended - 2 minutes)

1. **Get Free Database**
   - Go to https://neon.tech
   - Click "Sign Up" (free, no credit card)
   - Create a new project
   - Copy the connection string shown

2. **Configure App**
   ```bash
   # Edit .env.local and paste your connection string:
   DATABASE_URL="your-neon-connection-string-here"
   ```

3. **Setup Database**
   ```bash
   node scripts/setup-database.js
   ```

4. **Start App**
   ```bash
   npm run dev
   # Open http://localhost:3000
   # Login: john.doe@company.com / TestUser@123
   ```

Done! ✅

---

### Option 2: Use Supabase (Alternative Free Option)

1. **Get Free Database**
   - Go to https://supabase.com
   - Sign up and create project
   - Go to Settings → Database
   - Copy "Connection String" (use "Connection pooling" string)

2. **Configure & Run**
   ```bash
   # Edit .env.local with Supabase connection string
   DATABASE_URL="your-supabase-connection-string"

   # Run setup
   node scripts/setup-database.js

   # Start app
   npm run dev
   ```

---

### Option 3: Local PostgreSQL (If You Have It Installed)

If you already have PostgreSQL installed locally:

```bash
# Create database
createdb ticketing

# Edit .env.local
DATABASE_URL="postgresql://your-user:your-pass@localhost:5432/ticketing"

# Run setup
node scripts/setup-database.js

# Start app
npm run dev
```

---

## 🎯 What You Get After Setup

- ✅ 15 test users (all password: `TestUser@123`)
- ✅ 15 sample tickets in various states
- ✅ 5 teams with members
- ✅ Full master data (business units, categories)
- ✅ Analytics data ready

## 🔐 Login Credentials

**Email**: `john.doe@company.com`
**Password**: `TestUser@123`

All test users have the same password!

---

## 🚨 Troubleshooting

**"DATABASE_URL not found"**
- Edit `.env.local` file in project root
- Make sure line starts with `DATABASE_URL=` (no spaces)

**"Connection failed"**
- Verify your database is running
- Check connection string is correct
- For Neon/Supabase: check your account is active

**"Permission denied"**
- Run: `chmod +x scripts/setup-database.js`

---

## 📱 Current Status

✅ Code fixes applied
✅ Server running at http://localhost:3000
✅ Setup script ready
⏳ Waiting for database connection

**Next**: Get a database URL from Neon.tech (free, 2 minutes) and run the setup!
