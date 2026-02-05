-- Preview script - Shows what will be deleted without actually deleting
-- Run this first to see what will be removed

SELECT '=== PREVIEW: Data that will be DELETED ===' as info;

SELECT 'Users to DELETE:' as category, COUNT(*) as count
FROM users
WHERE LOWER(role) != 'admin'
  AND email NOT IN ('harsh.thapliyal@mfilterit.com', 'soami.narang@mfilterit.com');

SELECT 'Users to DELETE - Details:' as category, id, email, full_name, role
FROM users
WHERE LOWER(role) != 'admin'
  AND email NOT IN ('harsh.thapliyal@mfilterit.com', 'soami.narang@mfilterit.com')
ORDER BY id;

SELECT '' as spacer;

SELECT 'Users to KEEP:' as category, id, email, full_name, role
FROM users
WHERE LOWER(role) = 'admin'
   OR email IN ('harsh.thapliyal@mfilterit.com', 'soami.narang@mfilterit.com')
ORDER BY id;

SELECT '' as spacer;

SELECT 'Current Data Counts:' as info;
SELECT 'Total Tickets' as item, COUNT(*) as count FROM tickets
UNION ALL
SELECT 'Total Comments' as item, COUNT(*) as count FROM comments
UNION ALL
SELECT 'Total Attachments' as item, COUNT(*) as count FROM attachments
UNION ALL
SELECT 'Total Audit Logs' as item, COUNT(*) as count FROM ticket_audit_log
UNION ALL
SELECT 'Total Notifications' as item, COUNT(*) as count FROM notifications
UNION ALL
SELECT 'Total Team Members' as item, COUNT(*) as count FROM team_members
UNION ALL
SELECT 'Total Users' as item, COUNT(*) as count FROM users;

SELECT '' as spacer;
SELECT '=== After cleanup, all tickets/comments/attachments/audit logs will be deleted ===' as warning;
