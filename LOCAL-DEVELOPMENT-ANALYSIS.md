# Local Development Analysis - Login Issue

## 1. Backend Location ✅

**Answer: Backend is INSIDE Next.js using App Router API routes**

- **Location**: `app/api/` directory
- **Login Route**: `app/api/auth/login/route.ts` (lines 1-32)
- **Signup Route**: `app/api/auth/signup/route.ts` (lines 1-24)
- **Other Routes**: `app/api/attachments/route.ts`, `app/api/cleanup/route.ts`, `app/api/users/create/route.ts`

**No separate Express/Fastify server exists** - No `server.js`, `server.ts`, or separate backend found.

---

## 2. Separate Backend Command ❌

**Answer: NO separate backend exists - you only need to start Next.js**

There is no separate backend server to start. The API routes are part of Next.js.

---

## 3. Port Configuration ✅

**Answer: Backend runs on port 4000**

- **File**: `package.json` line 7
- **Script**: `"dev": "next dev -p 4000"`
- **URL**: `http://localhost:4000`

**Note**: Some documentation references port 3000, but your actual config uses 4000.

---

## 4. Hardcoded Vercel URLs ✅

**Answer: NO hardcoded Vercel URLs in API calls**

- **File**: `components/auth/login-form.tsx` line 34
- **Pattern**: Uses relative path `/api/auth/login` ✅
- **No hardcoded domains found** in API calls

**Only references to Vercel are in documentation files** (README.md, etc.), not in code.

---

## 5. API Call Pattern ✅

**Answer: API calls correctly use relative paths**

- **File**: `components/auth/login-form.tsx` line 34
- **Code**: `fetch("/api/auth/login", { ... })`
- **This is CORRECT** - will work on both localhost and production

---

## 6. DATABASE_URL Loading ⚠️

**Answer: DATABASE_URL is SET in .env.local, but needs verification**

**Current Status**:
- ✅ `.env.local` file exists
- ✅ `DATABASE_URL` is configured with Neon database:
  ```
  DATABASE_URL="postgresql://neondb_owner:npg_rc7YtW6bLVzQ@ep-dry-art-a4d995a9-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
  ```

**Potential Issues**:
1. **Next.js requires server restart** after changing `.env.local`
2. **Database connection might be failing** - test with: `node test-db-connection.js`
3. **File**: `lib/db.ts` line 3-4 - throws error if DATABASE_URL not set
4. **File**: `lib/actions/auth.ts` line 7-9 - also checks for DATABASE_URL

**Action Required**: 
- Verify database connection works: `node test-db-connection.js`
- Ensure dev server was restarted after setting DATABASE_URL

---

## 7. Missing Environment Variables ✅

**Answer: NO JWT/NextAuth secrets required - using custom cookie auth**

**Authentication Method**: Custom cookie-based authentication (NOT NextAuth)

- **No `NEXTAUTH_SECRET` needed** - NextAuth is installed but not used
- **No `JWT_SECRET` needed** - not using JWT tokens
- **Auth method**: Cookie-based with bcrypt password hashing
- **File**: `lib/actions/auth.ts` - custom login/signup functions
- **File**: `components/auth/login-form.tsx` line 51 - sets cookie directly

**Optional Environment Variables** (not required for login):
- `GMAIL_USER`, `GMAIL_APP_PASSWORD` - for email notifications (optional)
- `R2_*` variables - for file attachments (optional)
- `NEXT_PUBLIC_APP_URL` - defaults to `http://localhost:4000` ✅

---

## 8. CORS Configuration ✅

**Answer: NO CORS blocking - no CORS middleware found**

- **No CORS configuration found** in codebase
- **No CORS errors expected** - all API calls are same-origin (relative paths)
- **File**: `proxy.ts` line 16 - CSP allows `'self'` for connect-src ✅

**Note**: `proxy.ts` exists but is NOT being used as middleware (see issue below).

---

## 9. Exact Startup Commands 🚨

**Answer: Start Next.js dev server, but middleware is missing**

### Current Issue Found:

**CRITICAL**: `proxy.ts` exists but is NOT being used as middleware!

- ❌ No `middleware.ts` file exists in project root
- ❌ `proxy.ts` is not imported/used anywhere
- ⚠️ Route protection may not be working

### Commands to Start Local Development:

```powershell
# 1. Verify DATABASE_URL is set
Get-Content .env.local | Select-String "DATABASE_URL"

# 2. Test database connection (optional but recommended)
node test-db-connection.js

# 3. Start Next.js development server
npm run dev
```

**Expected Output**:
- Server starts on `http://localhost:4000`
- Open browser to `http://localhost:4000/login`

### If Login Still Fails:

**Check 1: Database Connection**
```powershell
node test-db-connection.js
```
If this fails, your DATABASE_URL is incorrect or database is not accessible.

**Check 2: Server Console Errors**
Look for errors in the terminal where `npm run dev` is running:
- `DATABASE_URL environment variable is not set` → Restart server
- `Error connecting to database` → Check DATABASE_URL
- `fetch failed` → Network/database connectivity issue

**Check 3: Browser Console**
Open DevTools (F12) → Console tab:
- Network errors → Check if `/api/auth/login` returns 500
- CORS errors → Should not happen (same-origin)

**Check 4: Database Tables**
If database connects but login fails, tables might not exist:
```powershell
node scripts/setup-database-pg.js
# OR
node scripts/run-seed.js
```

---

## 🔍 Specific File References

### Login Flow:
1. **Frontend**: `components/auth/login-form.tsx` line 34 - calls `/api/auth/login`
2. **API Route**: `app/api/auth/login/route.ts` line 12 - calls `loginUser()`
3. **Auth Logic**: `lib/actions/auth.ts` line 120-169 - `loginUser()` function
4. **Database**: `lib/db.ts` line 7 - creates SQL connection

### Error Points:
- **`lib/db.ts:3-4`**: Throws if DATABASE_URL not set
- **`lib/actions/auth.ts:7-9`**: Throws if DATABASE_URL not set  
- **`lib/actions/auth.ts:133`**: SQL query to find user
- **`lib/actions/auth.ts:148`**: Password verification with bcrypt

---

## ✅ Summary

1. ✅ Backend is in Next.js (`app/api/`)
2. ❌ No separate backend to start
3. ✅ Port 4000
4. ✅ No hardcoded URLs
5. ✅ Relative API paths (correct)
6. ⚠️ DATABASE_URL set but verify connection
7. ✅ No auth secrets needed
8. ✅ No CORS issues
9. 🚨 **Missing middleware.ts** - `proxy.ts` not being used

**Most Likely Issue**: Database connection failure or missing database tables.

**Next Steps**:
1. Run `node test-db-connection.js` to verify database
2. If connection fails, check DATABASE_URL
3. If connection works, run `node scripts/run-seed.js` to create tables
4. Restart dev server: `npm run dev`
5. Try login again
