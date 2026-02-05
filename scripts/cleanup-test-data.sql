-- Cleanup script to remove all test data while keeping admin user
-- This will delete all tickets, comments, attachments, audit logs, and test users
-- Only keeps the admin@company.com user

-- Step 1: Delete all audit logs (has foreign key to tickets)
DELETE FROM ticket_audit_log;

-- Step 2: Delete all comments (has foreign key to tickets)
DELETE FROM comments;

-- Step 3: Delete all attachments (has foreign key to tickets)
DELETE FROM attachments;

-- Step 4: Delete all tickets
DELETE FROM tickets;

-- Step 5: Delete all notifications
DELETE FROM notifications;

-- Step 6: Delete all team members (has foreign key to users)
DELETE FROM team_members;

-- Step 7: Delete all users EXCEPT admin role users and specific users
-- Keeps: All admins + harsh.thapliyal@mfilterit.com + soami.narang@mfilterit.com
DELETE FROM users
WHERE LOWER(role) != 'admin'
  AND email NOT IN ('harsh.thapliyal@mfilterit.com', 'soami.narang@mfilterit.com');

-- Step 8: Reset ticket_number sequence to start from 1
-- Since we deleted all tickets, the next ticket should be #1
-- The sequence will auto-increment from the max value, which is now 0

-- Step 9: Verify what's left
SELECT 'Remaining Users:' as info, COUNT(*) as count FROM users
UNION ALL
SELECT 'Remaining Tickets:' as info, COUNT(*) as count FROM tickets
UNION ALL
SELECT 'Remaining Comments:' as info, COUNT(*) as count FROM comments
UNION ALL
SELECT 'Remaining Attachments:' as info, COUNT(*) as count FROM attachments
UNION ALL
SELECT 'Remaining Audit Logs:' as info, COUNT(*) as count FROM ticket_audit_log
UNION ALL
SELECT 'Remaining Notifications:' as info, COUNT(*) as count FROM notifications
UNION ALL
SELECT 'Remaining Team Members:' as info, COUNT(*) as count FROM team_members;

-- Show remaining user
SELECT id, email, full_name, role FROM users;
