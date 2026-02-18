# Child Tickets (Sub-tickets) - Complete Guide

## 📍 Where to See Child Tickets

### 1. **Main Tickets List Page** (`/tickets`)
   - **Location**: The main tickets table shows parent tickets only
   - **Visual Indicator**: Parent tickets with child tickets show a **ChevronRight (▶)** or **ChevronDown (▼)** icon in the first column
   - **How to View**: Click the expand/collapse button (▶/▼) next to a parent ticket
   - **Display**: Child tickets appear **nested below** the parent ticket with:
     - Indented layout (visual connector lines)
     - Different background color (gray-50/800) to distinguish from parent
     - All the same columns as parent tickets

### 2. **Parent Ticket Detail Page** (`/tickets/[id]`)
   - **Location**: Actions section in the sidebar
   - **Button**: "Create Sub-ticket" button (visible to SPOC or Admin)
   - **Shows**: Current ticket details (this becomes the parent)

---

## 🔄 Complete Child Ticket Flow

### **Step 1: Creating a Child Ticket**

#### **Who Can Create?**
- ✅ **SPOC** of the parent ticket
- ✅ **Admin** users

#### **Where to Create?**
1. Navigate to the **parent ticket detail page**: `/tickets/[id]`
2. Look for the **"Create Sub-ticket"** button in the **Actions** section (sidebar, right side)
3. Button is only visible if you are:
   - The SPOC of the parent ticket, OR
   - An Admin user

#### **What Gets Pre-filled?**
When you click "Create Sub-ticket", the form automatically pre-fills:
- ✅ **Parent Ticket ID**: Links this ticket as a child
- ✅ **Target Business Group**: Same as parent's business unit group
- ✅ **SPOC**: Automatically set to **YOU** (the SPOC who created it)
- ✅ **Internal/External**: Same as parent ticket type

#### **What You Need to Fill?**
- Ticket Type (Issue or Requirement)
- Category & Subcategory
- Title & Description
- Other standard fields

---

### **Step 2: Viewing Child Tickets**

#### **In the Tickets Table** (`/tickets`)

**Visual Indicators:**
1. **Expand/Collapse Icon**:
   - ▶ (ChevronRight) = Collapsed (has children, not showing them)
   - ▼ (ChevronDown) = Expanded (showing children)
   - Empty space = No children

2. **Child Ticket Display**:
   - Appears **directly below** the parent ticket
   - **Indented** with visual connector (L-shaped border)
   - **Different background** (lighter gray) to distinguish
   - Shows all same information as parent tickets

**How It Works:**
1. The table initially shows **only parent tickets** (tickets with `parent_ticket_id = NULL`)
2. Each parent ticket shows a **child_ticket_count** (number of children)
3. When you click the expand button (▶):
   - The icon changes to ▼
   - System fetches child tickets for that parent
   - Child tickets appear nested below
4. When you click collapse (▼):
   - The icon changes to ▶
   - Child tickets are hidden (but remain in memory)

**Lazy Loading:**
- Child tickets are **NOT loaded** until you expand
- This improves performance
- Each parent's children are cached after first load

---

### **Step 3: Child Ticket Properties**

#### **Automatic Settings:**
- **Initiator**: The SPOC who created it (becomes the initiator)
- **Parent Link**: `parent_ticket_id` points to parent ticket
- **Target Group**: Inherits from parent
- **SPOC**: Set to the creator (SPOC of parent)

#### **Independent Properties:**
- Child tickets can have:
  - Different status
  - Different assignee
  - Different category/subcategory
  - Different description
  - Their own attachments
  - Their own comments

---

## 📊 Visual Flow Diagram

```
┌─────────────────────────────────────────┐
│  Main Tickets Page (/tickets)          │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │ Parent Ticket #123                │  │
│  │ [▶] Expand button (if has kids)  │  │
│  │ Title: "Main Issue"               │  │
│  │ Status: Open                      │  │
│  │ Child Count: 2                    │  │
│  └──────────────────────────────────┘  │
│         │                               │
│         │ Click Expand (▶)              │
│         ▼                               │
│  ┌──────────────────────────────────┐  │
│  │ Parent Ticket #123                │  │
│  │ [▼] Collapse button              │  │
│  │ Title: "Main Issue"               │  │
│  └──────────────────────────────────┘  │
│         │                               │
│         ├─┐ ┌────────────────────────┐ │
│         │ │ │ Child Ticket #124      │ │
│         │ │ │ └─ Indented            │ │
│         │ │ │ Status: In Progress    │ │
│         │ │ └────────────────────────┘ │
│         │ │                            │
│         │ └─┐ ┌──────────────────────┐│
│         │   │ │ Child Ticket #125    ││
│         │   │ │ └─ Indented          ││
│         │   │ │ Status: Open         ││
│         │   └─┘ └────────────────────┘│
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Parent Ticket Detail (/tickets/123)    │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │ Actions Section (Sidebar)        │  │
│  │                                   │  │
│  │ [Open]                           │  │
│  │ [On Hold]                        │  │
│  │ [Close]                          │  │
│  │ [Redirect]                       │  │
│  │ [Create Sub-ticket] ← Click here │  │
│  └──────────────────────────────────┘  │
│         │                               │
│         │ Navigates to create form      │
│         ▼                               │
│  ┌──────────────────────────────────┐  │
│  │ Create Ticket Form                │  │
│  │                                   │  │
│  │ Pre-filled:                       │  │
│  │ • parentTicketId: 123            │  │
│  │ • businessUnitGroupId: (parent)  │  │
│  │ • spocId: (your user ID)         │  │
│  │ • isInternal: (from parent)      │  │
│  └──────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

---

## 🔍 Key Features

### **1. Expand/Collapse Functionality**
- **Location**: First column of tickets table
- **Icon States**:
  - ▶ = Has children, not expanded
  - ▼ = Has children, expanded
  - (empty) = No children
- **Behavior**: Click to toggle expand/collapse
- **Lazy Loading**: Children loaded only when expanded

### **2. Visual Hierarchy**
- **Parent Tickets**: Normal background, full width
- **Child Tickets**: 
  - Indented with visual connector (L-shape)
  - Different background color (gray-50/800)
  - All columns aligned properly

### **3. Child Ticket Count**
- Displayed in the query as `child_ticket_count`
- Shows how many child tickets exist
- Only tickets with count > 0 show expand button

### **4. Navigation**
- Click any ticket (parent or child) to view details
- Child tickets have same navigation as parent tickets
- All actions work on child tickets (edit, assign, status change, etc.)

---

## 🎯 Use Cases

### **Scenario 1: Breaking Down a Complex Ticket**
1. **Parent Ticket**: "Implement User Authentication System"
2. **Child Tickets**:
   - "Set up OAuth integration"
   - "Create login UI components"
   - "Implement password reset flow"
   - "Add two-factor authentication"

### **Scenario 2: Task Delegation**
1. **Parent Ticket**: "Fix Production Bug #123"
2. **SPOC creates child tickets** for different team members:
   - "Investigate root cause" → Assign to Developer A
   - "Update database schema" → Assign to Developer B
   - "Update frontend components" → Assign to Developer C

### **Scenario 3: Sequential Tasks**
1. **Parent Ticket**: "Deploy New Feature"
2. **Child Tickets** (in order):
   - "Code review and approval"
   - "Run test suite"
   - "Deploy to staging"
   - "User acceptance testing"
   - "Deploy to production"

---

## 🔐 Permissions & Access

### **Creating Child Tickets**
- ✅ **SPOC** of parent ticket
- ✅ **Admin** users
- ❌ Regular users (even if they created the parent)

### **Viewing Child Tickets**
- ✅ **Everyone** can see child tickets when parent is expanded
- ✅ Same visibility rules as parent tickets apply

### **Editing Child Tickets**
- ✅ **Admin**: Can edit any child ticket
- ✅ **Initiator** (SPOC who created it): Can edit their child tickets
- ✅ **Assignee**: Can edit assigned child tickets
- ✅ **SPOC**: Can edit child tickets in their group

### **Deleting Child Tickets**
- ✅ **Admin**: Can delete any child ticket
- ✅ **Initiator**: Can delete their own child tickets

---

## 📝 Database Structure

### **Parent-Child Relationship**
```sql
tickets table:
- id (primary key)
- parent_ticket_id (foreign key → tickets.id)
  - NULL = Parent ticket
  - Number = Child ticket (points to parent)
```

### **Query Logic**
```sql
-- Get parent tickets (no parent)
SELECT * FROM tickets WHERE parent_ticket_id IS NULL

-- Get child tickets for a parent
SELECT * FROM tickets WHERE parent_ticket_id = 123

-- Count children for each parent
SELECT 
  t.*,
  (SELECT COUNT(*) FROM tickets child 
   WHERE child.parent_ticket_id = t.id) as child_ticket_count
FROM tickets t
WHERE t.parent_ticket_id IS NULL
```

---

## 🚀 Quick Start Guide

### **To Create a Child Ticket:**
1. Go to `/tickets` and find a parent ticket
2. Click on the ticket to open detail page (`/tickets/[id]`)
3. In the **Actions** section (right sidebar), click **"Create Sub-ticket"**
4. Fill in the form (most fields pre-filled)
5. Submit → Child ticket is created and linked to parent

### **To View Child Tickets:**
1. Go to `/tickets` (main tickets page)
2. Look for tickets with **▶** icon in first column
3. Click the **▶** icon to expand
4. Child tickets appear nested below parent
5. Click **▼** to collapse

### **To Work with Child Tickets:**
- Click any child ticket row to view details
- Edit, assign, change status just like parent tickets
- Child tickets are independent but linked to parent

---

## ⚠️ Important Notes

1. **Child tickets are NOT automatically filtered** - They appear in the main list when parent is expanded
2. **Child tickets can have their own children** - Multi-level nesting is possible
3. **Deleting parent does NOT delete children** - Children become orphaned (parent_ticket_id stays but parent is deleted)
4. **Child tickets count towards totals** - They are real tickets, just linked to a parent
5. **Export includes child tickets** - When exporting, child tickets are included if parent is expanded

---

## 🎨 Visual Examples

### **Collapsed State:**
```
[▶] Ticket #123 | Main Issue | Open | ...
```

### **Expanded State:**
```
[▼] Ticket #123 | Main Issue | Open | ...
    │
    ├─ Ticket #124 | Sub-task 1 | In Progress | ...
    │
    └─ Ticket #125 | Sub-task 2 | Open | ...
```

---

## 📍 Summary: Where to Find Everything

| Feature | Location | Access |
|---------|----------|--------|
| **Create Child Ticket** | `/tickets/[id]` → Actions → "Create Sub-ticket" | SPOC or Admin |
| **View Child Tickets** | `/tickets` → Click ▶ on parent ticket | Everyone |
| **Edit Child Ticket** | Click child ticket → Edit button | Based on permissions |
| **Delete Child Ticket** | Click child ticket → Delete button | Admin or Initiator |

---

## 🔗 Related Files

- **Display Logic**: `components/tickets/tickets-table.tsx` (lines 579-1067)
- **Create Button**: `app/tickets/[id]/page.tsx` (lines 119-134, 350-358)
- **Create Form**: `components/tickets/create-ticket-form.tsx` (handles parentTicketId)
- **Query Logic**: `lib/actions/tickets.ts` (getTickets with parentTicketId filter)
- **Database**: `scripts/016-internal-tickets-and-subtickets.sql` (parent_ticket_id column)

---

**Last Updated**: Based on current implementation
**Status**: ✅ Fully Implemented and Functional
