# Database Cleanup Guide

## Quick Start (Easiest & Safest Approach)

### Step 1: Preview What Will Be Deleted
Run this first to see what will be removed:
```bash
node scripts/run-sql-file.js scripts/preview-cleanup.sql
```

This shows:
- Which users will be DELETED
- Which users will be KEPT (admins)
- Total counts of tickets, comments, etc.

### Step 2: Run the Cleanup
If the preview looks good:
```bash
node scripts/run-sql-file.js scripts/cleanup-test-data.sql
```

This will:
- ✅ Keep all admin users (john.doe@company.com, admin@company.com, michael.harris@company.com)
- ❌ Delete all non-admin users
- ❌ Delete all tickets
- ❌ Delete all comments, attachments, notifications
- ❌ Delete all audit logs
- ❌ Delete all team members
- 🔄 Reset ticket numbering (next ticket will be #1)

---

## Alternative Options

### Option A: Keep ALL Admin Users (Default - Recommended)
Already configured in the script. Keeps:
- john.doe@company.com
- admin@company.com
- michael.harris@company.com

### Option B: Keep Only ONE Specific Admin
Edit `scripts/cleanup-test-data.sql` line 24:
```sql
-- Change this line:
DELETE FROM users WHERE LOWER(role) != 'admin';

-- To this (replace with your email):
DELETE FROM users WHERE email != 'admin@company.com';
```

### Option C: Keep Multiple Specific Users
Edit `scripts/cleanup-test-data.sql` line 24:
```sql
-- Change this line:
DELETE FROM users WHERE LOWER(role) != 'admin';

-- To this:
DELETE FROM users WHERE email NOT IN ('admin@company.com', 'harsh.thapliyal@mfilterit.com');
```

---

## After Cleanup

The next ticket created will be **#1** (fresh start).

All master data (categories, subcategories, business units, projects) will be preserved.

---

## Rollback (If Something Goes Wrong)

If you need to restore test data, run:
```bash
node scripts/setup-database-pg.js
```

This will re-seed the database with sample data.

---

## Summary

**EASIEST & BEST:** Run preview first, then cleanup
```bash
# 1. Preview
node scripts/run-sql-file.js scripts/preview-cleanup.sql

# 2. Cleanup (if preview looks good)
node scripts/run-sql-file.js scripts/cleanup-test-data.sql
```

Done! Your database is now clean with only admin users and no test tickets.
