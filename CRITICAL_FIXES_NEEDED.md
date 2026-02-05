# CRITICAL FIXES NEEDED - IMMEDIATE ATTENTION REQUIRED

## 🚨 HIGH SEVERITY - APPLICATION BREAKING ISSUES

### 1. DATABASE QUERY API MISMATCH (CRITICAL)
**File:** `lib/actions/tickets.ts` Line 104-105
**Issue:** Using `sql.query(query, values)` which doesn't exist in Neon's @neondatabase/serverless
**Impact:** Tickets page will crash on load
**Fix Required:**
```typescript
// Current (BROKEN):
const tickets = await sql.query(query, values)
return { success: true, data: tickets.rows || tickets }

// Should be:
// Use neon() function from '@neondatabase/serverless' for parameterized queries
// OR rebuild using sql`` template literals
```

### 2. SETTINGS PAGE - NO DATABASE UPDATES (CRITICAL)
**File:** `app/settings/page.tsx` Lines 69-157
**Issue:** All save functions have `// TODO: Implement API call` - nothing saves to database
**Impact:** Users cannot update business group, account info, or change password
**Fix Required:** Create Server Actions in `lib/actions/users.ts`:
- `updateUserBusinessGroup(userId, businessGroupId)`
- `updateUserProfile(userId, fullName, businessGroupId)`
- `changeUserPassword(userId, currentPassword, newPassword)`

### 3. ADMIN ACCESS CONTROL MISSING (HIGH)
**Files:**
- `app/master-data/page.tsx` (no role check)
- `app/analytics/page.tsx` (no role check)

**Issue:** Any logged-in user can access these pages via direct URL
**Impact:** Security vulnerability - non-admin users can modify master data
**Fix Required:** Add role check at page level:
```typescript
export default function MasterDataPage() {
  const [user, setUser] = useState<any>(null)
  
  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      const parsedUser = JSON.parse(userData)
      if (parsedUser.role !== "admin") {
        router.push("/dashboard")
      }
      setUser(parsedUser)
    }
  }, [])
  
  if (!user || user.role !== "admin") return null
  // ... rest of component
}
```

### 4. R2 STORAGE NOT CONFIGURED (HIGH)
**File:** `lib/r2.ts`
**Issue:** Environment variables not validated, will fail silently
**Impact:** File uploads don't work
**Fix Required:** Add validation or disable upload feature:
```typescript
const R2_ENDPOINT = process.env.R2_ENDPOINT
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY

if (!R2_ENDPOINT || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
  console.warn("R2 storage not configured - file uploads will be disabled")
  // Disable upload UI or show warning
}
```

---

## ⚠️ MEDIUM PRIORITY

### 5. "ADD USER" BUTTON NON-FUNCTIONAL
**File:** `app/settings/page.tsx` Line 245-248
**Issue:** Button has no onClick handler
**Fix:** Implement team member management:
```typescript
<Button size="sm" variant="outline" onClick={() => setShowAddUserModal(true)}>
  <UserPlus className="w-4 h-4 mr-2" />
  Add User
</Button>
```

### 6. ROLE CHECK CASE INCONSISTENCY
**Multiple Files**
**Issue:** Code checks both `"admin"` and `"Admin"` (inconsistent casing)
**Fix:** Standardize to lowercase everywhere:
```typescript
// Use this consistently:
if (user.role?.toLowerCase() === "admin")
```

---

## 📋 TESTING CHECKLIST AFTER FIXES

### Critical Path Testing:
1. ✅ Login flow → redirects to /dashboard (Create Ticket)
2. ❌ Create ticket → saves to database (NEEDS FIX #1)
3. ❌ View tickets → loads from database (NEEDS FIX #1)
4. ❌ Settings → Save changes (NEEDS FIX #2)
5. ❌ Settings → Change password (NEEDS FIX #2)
6. ❌ Master Data → Admin only access (NEEDS FIX #3)
7. ❌ Analytics → Admin only access (NEEDS FIX #3)
8. ❌ Upload file → works (NEEDS FIX #4 or disable)

### Secondary Testing:
- Ticket assignment (SPOC → Any Employee) ✅
- Filters (Status, Type, SPOC, Assignee) ✅
- Export to Excel ✅
- Ticket editing ✅
- Soft delete ✅

---

## 🛠️ IMPLEMENTATION PRIORITY

**PHASE 1 (DO NOW):**
1. Fix database query API (#1) - blocks all ticket operations
2. Implement Settings save functions (#2) - core feature missing
3. Add admin access control (#3) - security issue

**PHASE 2 (DO SOON):**
4. Configure R2 or disable uploads (#4)
5. Fix "Add User" button (#5)
6. Standardize role checks (#6)

---

## 📝 NOTES
- Database uses Neon's @neondatabase/serverless package
- All other queries in the codebase use `await sql`...`` template literals correctly
- Only getTickets() uses the broken sql.query() method
- Password hashing uses bcryptjs with 10 salt rounds
- User data stored in localStorage (consider moving to server-side session)

