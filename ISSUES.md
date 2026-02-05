# Ticketing Portal - Issues Documentation

**Date**: December 28, 2025
**Analysis**: Comprehensive user journey testing and code review

---

## Critical Issues (Must Fix Immediately)

### 1. ✗ **SQL Parameter Mismatch in Ticket Search**
- **File**: `lib/actions/tickets.ts:43-45`
- **Severity**: CRITICAL
- **Impact**: App crashes when searching tickets
- **Issue**: Search filter uses same parameter placeholder 3 times but only pushes value once
```typescript
if (filters?.search) {
  values.push(`%${filters.search}%`)
  query += ` AND (t.title ILIKE $${values.length} OR t.ticket_id ILIKE $${values.length} OR t.description ILIKE $${values.length})`
}
```
- **Fix**: Push value 3 times or use single CONCAT search
- **Error**: `Bind parameter value count mismatch`

### 2. ✗ **localStorage Access in Server-Side Rendering**
- **File**: `app/dashboard/page.tsx:15-20`
- **Severity**: CRITICAL
- **Impact**: Hydration errors, dashboard doesn't load
- **Issue**: Accessing `localStorage` in server component during SSR
```typescript
const user = localStorage.getItem("user")
if (!user) {
  router.push("/")
}
```
- **Fix**: Move to middleware or useEffect hook
- **Error**: `ReferenceError: localStorage is not defined`

### 3. ✗ **No Authentication Middleware**
- **File**: Missing `middleware.ts`
- **Severity**: CRITICAL
- **Impact**: Unauthenticated users can access all pages
- **Issue**: No server-side authentication check
- **Fix**: Create Next.js middleware to protect routes
- **Security Risk**: HIGH

### 4. ✗ **Hardcoded User IDs in Ticket Actions**
- **File**: `lib/actions/tickets.ts:139, 196`
- **Severity**: CRITICAL
- **Impact**: Wrong user attribution for tickets/comments
- **Issue**: User ID hardcoded to 3 (tickets) and 2 (comments)
```typescript
const userId = 3  // Line 139
const userId = 2  // Line 196
```
- **Fix**: Get user from session/auth context
- **Data Integrity**: Broken audit trail

---

## High Priority Issues

### 5. ✗ **Inconsistent SQL Result Handling**
- **Files**: `lib/actions/master-data.ts`, `lib/actions/teams.ts`
- **Severity**: HIGH
- **Impact**: "Cannot read property of undefined" errors
- **Issue**: Some functions check `result.rows || []`, others use `result.rows` directly
- **Fix**: Standardize to always check for undefined/null

### 6. ✗ **Async SearchParams Used Synchronously**
- **File**: `app/tickets/page.tsx:13-14`
- **Severity**: HIGH
- **Impact**: TypeScript error, filters don't work
- **Issue**: Next.js 15+ requires async handling of searchParams
```typescript
const [showSuccess, setShowSuccess] = useState(!!searchParams.get("created"))
```
- **Fix**: Make component async or use client component with useSearchParams

### 7. ✗ **Duplicate Team Management Pages**
- **Files**: `app/teams/page.tsx`, `app/admin/page.tsx`, `app/settings/page.tsx`
- **Severity**: HIGH
- **Impact**: Confusing UX, maintenance nightmare
- **Issue**: Three different routes manage the same teams functionality
- **Fix**: Consolidate to single teams route, remove duplicates

### 8. ✗ **Missing Subcategory Validation in Edit Page**
- **File**: `app/tickets/[id]/edit/page.tsx:45-50`
- **Severity**: HIGH
- **Impact**: Form breaks if subcategories fail to load
- **Issue**: Subcategories fetched separately from Promise.all
- **Fix**: Include in Promise.all and validate before rendering

---

## Medium Priority Issues

### 9. ✗ **Cookie/localStorage Authentication Data Exposure**
- **File**: `components/auth/login-form.tsx:46-50`
- **Severity**: MEDIUM
- **Impact**: Security risk, data leakage
- **Issue**: User data stored as JSON string in cookies and localStorage
```typescript
localStorage.setItem("user", JSON.stringify(data.user))
document.cookie = `user=${JSON.stringify(data.user)}; path=/; max-age=86400`
```
- **Fix**: Use httpOnly cookies or session tokens
- **Security**: Password hashes potentially exposed

### 10. ✗ **Missing Error Boundaries**
- **Files**: All component files
- **Severity**: MEDIUM
- **Impact**: App crashes completely on component errors
- **Issue**: No React Error Boundaries defined
- **Fix**: Add error boundaries at app and page level

### 11. ✗ **Inconsistent Status Values**
- **File**: `components/dashboard/recent-tickets.tsx:14`
- **Severity**: MEDIUM
- **Impact**: Status filters don't work correctly
- **Issue**: Status uses both "open" and "Open", "in-progress" and "In Progress"
- **Fix**: Standardize to lowercase with hyphens throughout

### 12. ✗ **Missing Assignee Filter in Tickets UI**
- **File**: `components/tickets/tickets-filter.tsx`
- **Severity**: MEDIUM
- **Impact**: Can't filter tickets by assignee
- **Issue**: API supports assignee filter but UI doesn't show it
- **Fix**: Add assignee dropdown to filter component

### 13. ✗ **No Error State in Analytics**
- **File**: `components/analytics/analytics-charts.tsx:41-46`
- **Severity**: MEDIUM
- **Impact**: User can't tell if data failed or is empty
- **Issue**: Only shows "No data available" for both error and empty states
- **Fix**: Add separate error state with retry button

### 14. ✗ **Extensive Use of `any` Type**
- **Files**: Multiple component files
- **Severity**: MEDIUM
- **Impact**: No TypeScript protection, runtime errors
- **Issue**: State and props using `any` instead of proper types
```typescript
const [teams, setTeams] = useState<any[]>([])
const [ticket, setTicket] = useState<any>(null)
```
- **Fix**: Define proper TypeScript interfaces

---

## Low Priority Issues (UX/Polish)

### 15. ✗ **Incorrect Signup Link**
- **File**: `components/auth/signup-form.tsx:178`
- **Severity**: LOW
- **Impact**: User clicks "Login" and goes to wrong page
- **Issue**: Login link href is "/" instead of "/login"
```typescript
<Link href="/" className="text-primary font-semibold hover:underline">
```
- **Fix**: Change to `/login`

### 16. ✗ **Inconsistent User Name Property**
- **File**: `components/layout/top-nav.tsx:16-18`
- **Severity**: LOW
- **Impact**: Username might not display
- **Issue**: Checks for both `userData.name` and `userData.full_name`
```typescript
setUserName(userData.name || userData.full_name || userData.email || "User")
```
- **Fix**: Standardize to `full_name` from database schema

### 17. ✗ **Generic Browser Alerts for Errors**
- **File**: `components/teams/add-team-member-modal.tsx:85`
- **Severity**: LOW
- **Impact**: Poor UX, inconsistent with design
- **Issue**: Using `alert()` instead of toast notifications
```typescript
alert(result.error || "Failed to save team member")
```
- **Fix**: Use toast/sonner notifications

### 18. ✗ **Browser confirm() for Deletions**
- **File**: `components/teams/teams-list.tsx:47`
- **Severity**: LOW
- **Impact**: Breaks design consistency
- **Issue**: Native browser confirm dialog instead of modal
```typescript
if (confirm(`Are you sure you want to remove ${name} from the team?`)) {
```
- **Fix**: Use AlertDialog component from shadcn/ui

### 19. ✗ **Hardcoded Refresh Interval**
- **File**: `components/analytics/analytics-charts.tsx:29`
- **Severity**: LOW
- **Impact**: Unnecessary API calls
- **Issue**: 60-second auto-refresh with no way to disable
```typescript
const interval = setInterval(loadData, 60000)
```
- **Fix**: Make interval configurable or remove

### 20. ✗ **Missing Package Manager**
- **File**: `package.json`
- **Severity**: LOW
- **Impact**: Can't run development server
- **Issue**: Project uses `pnpm` but it's not installed
- **Fix**: Add instructions to install pnpm or switch to npm

---

## Missing Components/Features

### 21. ✗ **BulkUploadDialog Component Not Found**
- **Files**: `components/master-data/categories-tab.tsx:13`, `business-unit-groups-tab.tsx:13`
- **Severity**: MEDIUM
- **Impact**: Bulk upload feature doesn't work
- **Issue**: Component imported but file doesn't exist
- **Fix**: Create BulkUploadDialog component

### 22. ✗ **EditDialog Component Not Found**
- **Files**: Master data components
- **Severity**: MEDIUM
- **Impact**: Can't edit master data entries
- **Issue**: Component imported but file doesn't exist
- **Fix**: Create EditDialog component

---

## Summary Statistics

| Severity | Count | User Journey Impact |
|----------|-------|---------------------|
| Critical | 4 | App doesn't work |
| High | 4 | Major features broken |
| Medium | 6 | Degraded experience |
| Low | 8 | Polish issues |
| **Total** | **22** | |

---

## User Journey Impact Assessment

### 1. Authentication Flow: BROKEN
- ❌ Login stores data insecurely
- ❌ No middleware protection
- ❌ Dashboard crashes on SSR

### 2. Dashboard: PARTIALLY BROKEN
- ❌ Can't load due to localStorage issue
- ⚠️ No error boundaries if components fail
- ✓ Layout and navigation work (once fixed)

### 3. Ticket Management: BROKEN
- ❌ Search crashes (SQL error)
- ❌ Wrong user IDs on creation
- ⚠️ Missing filters
- ⚠️ Edit page might fail

### 4. Team Management: PARTIALLY WORKING
- ✓ Basic CRUD works
- ⚠️ Confusing duplicate pages
- ⚠️ Poor error handling

### 5. Master Data: WORKING WITH ISSUES
- ✓ Basic operations work
- ❌ Missing bulk upload/edit dialogs
- ⚠️ Inconsistent error handling

### 6. Analytics: WORKING WITH ISSUES
- ✓ Charts display
- ⚠️ No error state
- ⚠️ Continuous polling

---

## Recommended Fix Priority

1. **Phase 1 - Make it Work** (Critical)
   - Fix SQL parameter mismatch (Issue #1)
   - Fix localStorage in SSR (Issue #2)
   - Add authentication middleware (Issue #3)
   - Fix hardcoded user IDs (Issue #4)

2. **Phase 2 - Stabilize** (High)
   - Fix async searchParams (Issue #6)
   - Consolidate team pages (Issue #7)
   - Standardize SQL result handling (Issue #5)
   - Add error boundaries (Issue #10)

3. **Phase 3 - Improve** (Medium)
   - Fix security issues (Issue #9)
   - Add missing filters (Issue #12)
   - Add proper TypeScript types (Issue #14)
   - Create missing dialogs (Issues #21-22)

4. **Phase 4 - Polish** (Low)
   - Fix all UX issues (Issues #15-19)
   - Improve error messages
   - Optimize performance

---

**Total Estimated Fixes**: 22 issues across 6 user journeys
