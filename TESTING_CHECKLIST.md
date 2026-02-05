# Comprehensive Testing Checklist

## Navigation & Branding
- [ ] Nav bar displays "Ticket Portal" (not "Ticketing Portal")
- [ ] Navigation items (Dashboard, Tickets, Reports, Master Settings) are left-aligned next to logo
- [ ] Logo and title displayed correctly on desktop and mobile
- [ ] Mobile menu works properly
- [ ] All navigation links work correctly

## Authentication & Login Flow
- [ ] Login page displays "Ticket Portal" branding
- [ ] Successful login redirects to "/tickets/create" (not dashboard)
- [ ] User credentials are properly stored in localStorage
- [ ] Cookie is set for authentication
- [ ] Failed login shows appropriate error message
- [ ] Logout clears localStorage and cookies

## Create Ticket Page
- [ ] Page heading is "New Ticket" (not "Create New Ticket")
- [ ] Heading and text are left-aligned (not centered)
- [ ] User's Business Unit is pre-selected automatically
- [ ] All form sections are properly aligned

## Ticket Creation Form - Required Fields
- [ ] Group (Business Unit) field is mandatory *
- [ ] Category field is mandatory *
- [ ] Sub-Category field is mandatory *
- [ ] SPOC field is mandatory *
- [ ] Description field is present
- [ ] All required fields show asterisk (*)

## Ticket Creation Form - Sub-Category Behavior
- [ ] Sub-Category is always required (marked with *)
- [ ] When no subcategories exist for a category, "N/A" option appears automatically
- [ ] "N/A" is auto-selected when it's the only option
- [ ] Validation requires subcategory selection before submission

## Ticket Creation Form - Auto-fill Behavior
- [ ] No helper text like "(Auto-filled from classification - editable)" shown
- [ ] No helper text like "(Auto-filled)" shown
- [ ] No helper text like "(Auto-filled with SPOC)" shown
- [ ] Description auto-fills based on classification mapping
- [ ] Estimated Duration auto-fills based on classification
- [ ] SPOC auto-fills based on BU + Category + Subcategory selection

## Ticket Creation Form - Business Units
- [ ] Business Unit names are clean (no bracketed descriptions)
- [ ] "CS BM" appears (not "CS BM (Brand Monitoring)")
- [ ] "TD North" appears (not "TD North (Tech Delivery)")
- [ ] "TD South" appears (not "TD South (Tech Delivery)")
- [ ] "Others" appears (not "TD Other" or "TD Others")
- [ ] All BU names display correctly in dropdown

## SPOC & Assignee Workflow
- [ ] SPOC field is auto-filled when creating ticket
- [ ] SPOC value is saved to `spoc_user_id` column in database
- [ ] Assignee field (`assigned_to`) is NULL/blank on ticket creation
- [ ] SPOC can assign assignee from tickets table dropdown
- [ ] Only SPOC or admin can edit assignee field
- [ ] Assignee dropdown shows all users

## Tickets Table - Columns & Data
- [ ] Table shows row number (#) first
- [ ] **Initiator column** appears before Date/Time
- [ ] Initiator shows creator name (top line)
- [ ] Initiator shows Group/BU name below creator name (bottom line, gray text)
- [ ] Date/Time column appears after Initiator
- [ ] Date shows as "MMM dd, yyyy" format
- [ ] Time shows as "hh:mm a" format below date
- [ ] Category and Subcategory are stacked in one column
- [ ] Description is shown and truncated properly
- [ ] SPOC column displays correct SPOC name
- [ ] Assignee column displays assignee or "Unassigned"
- [ ] Status badge shows correct color
- [ ] Files column shows attachment count

## Tickets Table - Attachments Download
- [ ] Files column shows paperclip icon with count when attachments exist
- [ ] Download icon appears next to attachment count
- [ ] Clicking download icon navigates to ticket detail with attachments section
- [ ] Files column shows "-" when no attachments

## Tickets Table - Assignee Management
- [ ] SPOC can click on assignee field to edit
- [ ] Dropdown appears with list of all users
- [ ] SPOC can select new assignee from dropdown
- [ ] Non-SPOC users cannot edit assignee field
- [ ] Admin users can edit assignee field
- [ ] Changes save immediately on selection

## User Settings Page
- [ ] Settings page displays real user data (not dummy data)
- [ ] Display Name shows user's actual full_name from database
- [ ] Email Address shows user's actual email from database
- [ ] Business Unit / Group shows user's group_name
- [ ] Role shows user's role from database
- [ ] All fields are read-only (greyed out with cursor-not-allowed)
- [ ] Help text indicates "Contact your administrator to update"
- [ ] My Teams section works correctly
- [ ] Teams Management section works correctly

## Ticket Detail Page
- [ ] Download buttons work for all attachments
- [ ] Each attachment has individual download link
- [ ] File names and sizes display correctly
- [ ] Uploader name shows for each attachment
- [ ] Comments section works properly
- [ ] Status change buttons work
- [ ] Edit button navigates to edit page

## Ticket Filtering
- [ ] Users see their own created tickets by default (user-level filtering)
- [ ] Search works across tickets, descriptions, users, categories
- [ ] Status filter works (Open, In Progress, Resolved, Closed, Hold, All)
- [ ] Assignee filter works
- [ ] Type filter works (Support/Requirement)
- [ ] Date range filters work (From/To)
- [ ] "My Team" filter shows team tickets when toggled
- [ ] Filters can be reset

## Security (OWASP Standards)
- [ ] Input validation on all form fields
- [ ] XSS prevention (no script injection in text fields)
- [ ] SQL injection protection (using parameterized queries)
- [ ] File upload size limits enforced (5MB max)
- [ ] Authentication required for all protected routes
- [ ] Authorization checks for admin/SPOC actions
- [ ] Secure password storage (bcrypt hashing)
- [ ] Session management with cookies

## Master Data Management
- [ ] Business Unit Groups can be created/edited/deleted
- [ ] Categories can be created/edited/deleted
- [ ] Subcategories can be created/edited/deleted
- [ ] SPOC configuration would be under Business Units (TODO)
- [ ] Ticket classification mappings work correctly

## Notifications
- [ ] Notification bell icon shows in header
- [ ] Unread count badge displays correctly
- [ ] Dropdown shows recent notifications
- [ ] Mark as read functionality works
- [ ] Mark all as read works
- [ ] Notifications refresh automatically

## General UI/UX
- [ ] All pages use consistent left-aligned headings
- [ ] Form labels are clear without excessive helper text
- [ ] Error messages are user-friendly
- [ ] Success messages appear after actions
- [ ] Loading states show during data fetching
- [ ] Mobile responsive design works
- [ ] Colors and styling are consistent

## Database Integrity
- [ ] `spoc_user_id` column exists in tickets table
- [ ] `assigned_to` is NULL on new tickets
- [ ] Business Unit names are cleaned up (no brackets)
- [ ] All foreign keys work correctly
- [ ] Timestamps update automatically

## Edge Cases
- [ ] Creating ticket with no subcategories available
- [ ] Editing ticket with deleted category/subcategory
- [ ] Uploading files exceeding size limit
- [ ] Very long descriptions and titles
- [ ] Special characters in text fields
- [ ] Empty search queries
- [ ] Deleting tickets (soft delete)
- [ ] Duplicate ticket functionality

## Performance
- [ ] Ticket list loads quickly with many tickets
- [ ] Search returns results promptly
- [ ] File uploads complete successfully
- [ ] No memory leaks on long sessions
- [ ] Images/assets load efficiently

## Browser Compatibility
- [ ] Works in Chrome
- [ ] Works in Firefox
- [ ] Works in Safari
- [ ] Works in Edge
- [ ] Mobile browsers (iOS Safari, Android Chrome)
