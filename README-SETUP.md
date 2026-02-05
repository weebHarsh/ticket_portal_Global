# Ticketing Portal - Complete Setup Guide

## 🚀 Quick Start (3 Simple Steps)

### Step 1: Run the Database Script
1. Go to the **Scripts** section in v0
2. Find and run: `scripts/RUN-THIS-WORKING-DATA.sql`
3. Click **Run** and wait for completion

This single script will:
- Clear any existing conflicting data
- Insert 15 users
- Insert 10 business unit groups
- Insert 10 categories with 15 subcategories
- Insert 5 teams with 15 team members
- Insert 15 ticket classification mappings (for auto-fill)
- Insert 15 realistic tickets
- Insert 9 comments

### Step 2: Refresh Your Browser
After the script completes, refresh the page (Cmd+R or Ctrl+R)

### Step 3: Test Everything
All screens should now show data:
- ✅ Dashboard with stats and recent tickets
- ✅ Tickets list with 15 tickets
- ✅ Create Ticket form with dropdowns populated
- ✅ Teams page with 5 teams and 15 members
- ✅ Master Data Management with all data
- ✅ Analytics with comprehensive charts
- ✅ Settings page

---

## 📋 What's Working Now

### ✅ Dashboard
- Quick stats showing total tickets, open, in progress, resolved
- Recent tickets list
- Auto-refreshes every 30 seconds

### ✅ Create Ticket (FIXED)
- Business Unit dropdown loads 10 options
- Category dropdown loads 10 options
- Subcategory dropdown loads based on selected category
- **Auto-fill functionality**:
  - Ticket title auto-populates based on classification
  - Estimated duration fills automatically
  - SPOC (assignee) auto-selects based on mapping
- Description is optional
- Assign To dropdown shows all 15 users

### ✅ Tickets List
- Shows all 15 tickets with various statuses
- Filter by status, priority, category
- Click ticket ID or View button to see details
- Edit button takes you to edit page

### ✅ Ticket View/Edit Pages
- View complete ticket details
- See comments and attachments
- Edit ticket properties
- Update status, priority, assignee

### ✅ Teams Management (FIXED)
- Shows 5 teams with member counts
- **Add Team Member** button now works:
  - User dropdown shows all 15 users
  - Team dropdown shows all 5 teams
  - Role dropdown has 8 role options
- Edit and delete team members
- Search and filter functionality

### ✅ Master Data Management
- **Business Unit Groups**: View, add, edit, delete, bulk upload
- **Categories**: View, add, edit, delete, bulk upload
- **Subcategories**: View, add, edit, delete, bulk upload
- **Ticket Classification Mapping**: Configure auto-fill rules
- Bulk upload via CSV for all entities

### ✅ Analytics Dashboard (FILLED WITH DATA)
- Tickets by Business Unit (bar chart)
- Tickets by Category (bar chart)
- Top 10 Subcategories (horizontal bar chart)
- Status Distribution (pie chart)
- Ticket Type Distribution (pie chart)
- Priority Distribution (bar chart)
- 30-day Ticket Trend (line chart)
- Team Performance (grouped bar chart)
- 12-month Monthly Trend (line chart)
- Key metrics: Avg Resolution Time, Total Tickets, Active BUs

### ✅ Settings
- Create and manage teams
- View team statistics
- Add team description

---

## 🗂️ Sample Data Included

### Users (15 total)
- John Doe (Admin, IT)
- Jane Smith (Manager, Operations)
- Mike Johnson (Support Agent)
- Sarah Williams (Team Lead, Engineering)
- And 11 more...

### Tickets (15 total with varied statuses)
- **Open**: "Laptop not turning on", "Printer not working", etc.
- **In Progress**: "VPN connection failing", "Application keeps crashing", etc.
- **Resolved**: "Password reset needed", "New employee account", etc.
- **Critical**: "Email not sending", "Security alert on account"

### Teams (5 total)
- IT Support Team
- Engineering Team
- Operations Team
- Customer Success
- Admin Team

---

## 🔧 Troubleshooting

### Problem: Dropdowns still empty after running script
**Solution**: Hard refresh your browser (Cmd+Shift+R or Ctrl+Shift+R)

### Problem: "No users available" in Add Team Member
**Solution**: 
1. Check if the SQL script ran successfully
2. Look for any errors in the console
3. Re-run the script: `scripts/RUN-THIS-WORKING-DATA.sql`

### Problem: Analytics charts are empty
**Solution**: The script creates tickets with realistic data. If empty:
1. Verify the script completed successfully
2. Check browser console for errors
3. Refresh the page

### Problem: Can't create tickets
**Solution**:
1. Ensure all dropdowns are populated (refresh if needed)
2. All fields except Description are required
3. Check browser console for specific errors

---

## 📝 Features Summary

### Core Functionality
- ✅ Full ticket lifecycle (create, view, edit, resolve)
- ✅ Real-time dashboard statistics
- ✅ Team and user management
- ✅ Master data management (BU, categories, subcategories)
- ✅ Ticket classification with auto-fill
- ✅ Comments and attachments
- ✅ Advanced analytics with 9 chart types
- ✅ Bulk data upload via CSV
- ✅ Search and filter on all lists

### Auto-Fill Magic ✨
When creating a ticket:
1. Select Business Unit → Category → Subcategory
2. Watch as the system automatically fills:
   - Ticket title from template
   - Estimated duration in minutes
   - Assigns to the designated SPOC

### Database Schema
All tables properly connected with foreign keys:
- `users` - 15 sample users
- `business_unit_groups` - 10 units
- `categories` - 10 categories
- `subcategories` - 15 subcategories
- `teams` - 5 teams
- `team_members` - 15 member assignments
- `ticket_classification_mapping` - 15 auto-fill rules
- `tickets` - 15 sample tickets
- `comments` - 9 comments
- `attachments` - Ready for file uploads

---

## 🎯 Ready for Presentation

Your ticketing portal is now a **fully functional prototype** with:
- ✅ Real database backend (Neon PostgreSQL)
- ✅ 15 users, 15 tickets, 5 teams
- ✅ Comprehensive analytics
- ✅ Working forms with validation
- ✅ Auto-fill intelligence
- ✅ Professional UI/UX
- ✅ Real-time updates

**Just run the SQL script and you're ready to demo!**
