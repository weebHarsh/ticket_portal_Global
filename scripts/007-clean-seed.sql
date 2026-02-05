-- Clean slate: Delete in reverse FK dependency order
DELETE FROM comments;
DELETE FROM attachments;
DELETE FROM ticket_classification_mapping;
DELETE FROM tickets;
DELETE FROM team_members;
DELETE FROM teams;
DELETE FROM subcategories;
DELETE FROM categories;
DELETE FROM business_unit_groups;
DELETE FROM users WHERE email != 'admin@company.com';

-- Reset sequences
ALTER SEQUENCE users_id_seq RESTART WITH 2;
ALTER SEQUENCE business_unit_groups_id_seq RESTART WITH 1;
ALTER SEQUENCE categories_id_seq RESTART WITH 1;
ALTER SEQUENCE subcategories_id_seq RESTART WITH 1;
ALTER SEQUENCE teams_id_seq RESTART WITH 1;
ALTER SEQUENCE tickets_id_seq RESTART WITH 36;

-- 1. INSERT USERS (no FK)
-- Password for all: TestUser@123
-- Hash: $2b$10$3fYEI5DKoIzNBCfGKJPUl.XhP5W4PwJbB3ZfNLHrXd3fH4KpPdXSy
INSERT INTO users (email, full_name, role, password_hash) VALUES
('john.doe@company.com', 'John Doe', 'Admin', '$2b$10$3fYEI5DKoIzNBCfGKJPUl.XhP5W4PwJbB3ZfNLHrXd3fH4KpPdXSy'),
('jane.smith@company.com', 'Jane Smith', 'Manager', '$2b$10$3fYEI5DKoIzNBCfGKJPUl.XhP5W4PwJbB3ZfNLHrXd3fH4KpPdXSy'),
('mike.johnson@company.com', 'Mike Johnson', 'Support Agent', '$2b$10$3fYEI5DKoIzNBCfGKJPUl.XhP5W4PwJbB3ZfNLHrXd3fH4KpPdXSy'),
('sarah.williams@company.com', 'Sarah Williams', 'Team Lead', '$2b$10$3fYEI5DKoIzNBCfGKJPUl.XhP5W4PwJbB3ZfNLHrXd3fH4KpPdXSy'),
('david.brown@company.com', 'David Brown', 'Support Agent', '$2b$10$3fYEI5DKoIzNBCfGKJPUl.XhP5W4PwJbB3ZfNLHrXd3fH4KpPdXSy'),
('emily.davis@company.com', 'Emily Davis', 'Developer', '$2b$10$3fYEI5DKoIzNBCfGKJPUl.XhP5W4PwJbB3ZfNLHrXd3fH4KpPdXSy'),
('robert.miller@company.com', 'Robert Miller', 'Manager', '$2b$10$3fYEI5DKoIzNBCfGKJPUl.XhP5W4PwJbB3ZfNLHrXd3fH4KpPdXSy'),
('lisa.wilson@company.com', 'Lisa Wilson', 'Support Agent', '$2b$10$3fYEI5DKoIzNBCfGKJPUl.XhP5W4PwJbB3ZfNLHrXd3fH4KpPdXSy'),
('james.moore@company.com', 'James Moore', 'Analyst', '$2b$10$3fYEI5DKoIzNBCfGKJPUl.XhP5W4PwJbB3ZfNLHrXd3fH4KpPdXSy'),
('mary.taylor@company.com', 'Mary Taylor', 'Developer', '$2b$10$3fYEI5DKoIzNBCfGKJPUl.XhP5W4PwJbB3ZfNLHrXd3fH4KpPdXSy'),
('chris.anderson@company.com', 'Chris Anderson', 'Manager', '$2b$10$3fYEI5DKoIzNBCfGKJPUl.XhP5W4PwJbB3ZfNLHrXd3fH4KpPdXSy'),
('patricia.thomas@company.com', 'Patricia Thomas', 'Support Agent', '$2b$10$3fYEI5DKoIzNBCfGKJPUl.XhP5W4PwJbB3ZfNLHrXd3fH4KpPdXSy'),
('daniel.jackson@company.com', 'Daniel Jackson', 'Team Lead', '$2b$10$3fYEI5DKoIzNBCfGKJPUl.XhP5W4PwJbB3ZfNLHrXd3fH4KpPdXSy'),
('jennifer.white@company.com', 'Jennifer White', 'Developer', '$2b$10$3fYEI5DKoIzNBCfGKJPUl.XhP5W4PwJbB3ZfNLHrXd3fH4KpPdXSy'),
('michael.harris@company.com', 'Michael Harris', 'Admin', '$2b$10$3fYEI5DKoIzNBCfGKJPUl.XhP5W4PwJbB3ZfNLHrXd3fH4KpPdXSy');

-- 2. INSERT BUSINESS UNIT GROUPS
INSERT INTO business_unit_groups (id, name, description) VALUES
(1, 'IT Infrastructure', 'IT and Technology Services'),
(2, 'Operations', 'Business Operations'),
(3, 'Engineering', 'Product Engineering'),
(4, 'Customer Support', 'Customer Service Team'),
(5, 'Sales', 'Sales Department'),
(6, 'HR', 'Human Resources'),
(7, 'Finance', 'Finance and Accounting'),
(8, 'Marketing', 'Marketing Team'),
(9, 'Legal', 'Legal Department'),
(10, 'Security', 'Security and Compliance');

-- 3. INSERT CATEGORIES
INSERT INTO categories (id, name, description) VALUES
(1, 'Hardware Issue', 'Hardware problems and failures'),
(2, 'Software Issue', 'Software problems and bugs'),
(3, 'Access Request', 'Access and permission related'),
(4, 'Network Issue', 'Network and connectivity problems'),
(5, 'Email Issue', 'Email and communication problems'),
(6, 'Performance Issue', 'System performance issues'),
(7, 'Security Issue', 'Security concerns and incidents'),
(8, 'Data Issue', 'Data management and loss'),
(9, 'Training Request', 'Training and skill development'),
(10, 'Other', 'Miscellaneous issues');

-- 4. INSERT SUBCATEGORIES (all categories exist first)
INSERT INTO subcategories (category_id, name, description) VALUES
(1, 'Laptop Issue', 'Laptop hardware problems'),
(1, 'Printer Issue', 'Printer problems and failures'),
(2, 'Application Error', 'Application crashes and errors'),
(2, 'Installation Issue', 'Software installation problems'),
(3, 'New Account', 'Request for new user account'),
(3, 'Password Reset', 'Password reset requests'),
(4, 'WiFi Issue', 'WiFi connectivity problems'),
(4, 'VPN Issue', 'VPN connection failures'),
(5, 'Cannot Send Email', 'Email sending issues'),
(5, 'Cannot Receive Email', 'Email receiving issues'),
(6, 'Slow System', 'System running slowly'),
(6, 'High Memory Usage', 'Memory and CPU issues'),
(7, 'Security Alert', 'Security incidents and alerts'),
(7, 'Malware Detection', 'Malware or virus detection'),
(8, 'Data Loss', 'Data loss or corruption'),
(8, 'Backup Failed', 'Backup failure issues'),
(9, 'Software Training', 'Software training requests'),
(9, 'System Training', 'System training requests'),
(10, 'General Inquiry', 'General IT inquiries'),
(10, 'Other Request', 'Other miscellaneous requests');

-- 5. INSERT TEAMS
INSERT INTO teams (name, description) VALUES
('IT Support Team', 'Handles IT support tickets'),
('Network Team', 'Manages network and connectivity'),
('Security Team', 'Handles security incidents'),
('Application Team', 'Manages application issues'),
('Operations Team', 'General operations support'),
('Database Team', 'Database and data management'),
('Infrastructure Team', 'Infrastructure and servers'),
('Support Escalation', 'Escalation team for critical issues');

-- 6. INSERT TEAM MEMBERS
INSERT INTO team_members (user_id, team_id, role) VALUES
(1, 1, 'Lead'), (3, 1, 'Member'), (5, 1, 'Member'), (8, 1, 'Member'), (12, 1, 'Member'),
(2, 2, 'Lead'), (4, 2, 'Member'), (6, 2, 'Member'),
(11, 3, 'Lead'), (15, 3, 'Member'),
(7, 4, 'Lead'), (10, 4, 'Member'), (14, 4, 'Member'),
(13, 5, 'Lead'), (9, 5, 'Member'),
(6, 6, 'Lead'), (9, 6, 'Member'),
(11, 7, 'Lead'), (2, 7, 'Member'),
(1, 8, 'Lead'), (3, 8, 'Member'), (5, 8, 'Member');

-- 7. INSERT TICKET CLASSIFICATION MAPPING
INSERT INTO ticket_classification_mapping (business_unit_group_id, category_id, subcategory_id, spoc_user_id, estimated_duration, auto_title_template) VALUES
(1, 1, 1, 3, 240, 'Laptop Issue - {{subcategory}}'),
(1, 1, 2, 3, 120, 'Printer Issue - {{subcategory}}'),
(1, 2, 3, 6, 180, 'Application Error - {{subcategory}}'),
(1, 2, 4, 6, 120, 'Installation Issue - {{subcategory}}'),
(2, 3, 5, 3, 60, 'New Account Request - {{subcategory}}'),
(2, 3, 6, 3, 30, 'Password Reset - {{subcategory}}'),
(3, 4, 7, 5, 180, 'WiFi Issue - {{subcategory}}'),
(3, 4, 8, 5, 240, 'VPN Issue - {{subcategory}}'),
(4, 5, 9, 8, 120, 'Email Sending Issue - {{subcategory}}'),
(4, 5, 10, 8, 120, 'Email Receiving Issue - {{subcategory}}');

-- 8. INSERT TICKETS
INSERT INTO tickets (ticket_id, title, description, status, priority, ticket_type, category, subcategory, business_unit_group_id, category_id, subcategory_id, created_by, assigned_to, estimated_duration) VALUES
('TKT-2024-001', 'Laptop not turning on', 'My Dell laptop is not powering on after system update', 'Open', 'High', 'Incident', 'Hardware Issue', 'Laptop Issue', 1, 1, 1, 1, 3, '240'),
('TKT-2024-002', 'VPN connection failing', 'Unable to connect to company VPN from home', 'In Progress', 'Medium', 'Incident', 'Network Issue', 'VPN Issue', 3, 4, 8, 2, 5, '240'),
('TKT-2024-003', 'Password reset needed', 'Forgot my password and need reset', 'Resolved', 'Low', 'Service Request', 'Access Request', 'Password Reset', 2, 3, 6, 3, 3, '30'),
('TKT-2024-004', 'Printer not working', 'Office printer is not responding to print jobs', 'Open', 'Medium', 'Incident', 'Hardware Issue', 'Printer Issue', 1, 1, 2, 4, 3, '120'),
('TKT-2024-005', 'Application keeps crashing', 'CRM application crashes every 10 minutes', 'In Progress', 'High', 'Incident', 'Software Issue', 'Application Error', 1, 2, 3, 5, 6, '180'),
('TKT-2024-006', 'Email not sending', 'Cannot send emails to external clients', 'Open', 'Critical', 'Incident', 'Email Issue', 'Cannot Send Email', 4, 5, 9, 6, 8, '120'),
('TKT-2024-007', 'Slow computer performance', 'My workstation is running very slowly', 'Open', 'Low', 'Incident', 'Performance Issue', 'Slow System', 1, 6, 11, 7, 12, '120'),
('TKT-2024-008', 'New employee account needed', 'Create new account for Jane Doe starting Monday', 'Resolved', 'Medium', 'Service Request', 'Access Request', 'New Account', 2, 3, 5, 8, 3, '60'),
('TKT-2024-009', 'WiFi keeps disconnecting', 'WiFi disconnects every few minutes in conference room', 'In Progress', 'High', 'Incident', 'Network Issue', 'WiFi Issue', 3, 4, 7, 9, 5, '180'),
('TKT-2024-010', 'Software installation help', 'Need help installing Adobe Creative Suite', 'Open', 'Low', 'Service Request', 'Software Issue', 'Installation Issue', 1, 2, 4, 10, 6, '120'),
('TKT-2024-011', 'Security alert - suspicious login', 'Suspicious login attempt from unknown location', 'Open', 'Critical', 'Incident', 'Security Issue', 'Security Alert', 7, 7, 13, 11, 15, '120'),
('TKT-2024-012', 'Cannot receive emails', 'Not receiving emails from specific domain', 'In Progress', 'High', 'Incident', 'Email Issue', 'Cannot Receive Email', 4, 5, 10, 12, 8, '120'),
('TKT-2024-013', 'Training on new software', 'Need training for new project management tool', 'Open', 'Low', 'Service Request', 'Training Request', 'Software Training', 5, 9, 17, 13, 4, '180'),
('TKT-2024-014', 'Database backup failed', 'Last night backup failed with error', 'Resolved', 'High', 'Incident', 'Data Issue', 'Backup Failed', 6, 8, 16, 14, 6, '240'),
('TKT-2024-015', 'General IT inquiry', 'Question about IT policies and procedures', 'Open', 'Low', 'Service Request', 'Other', 'Other Request', 6, 10, 20, 15, 12, '60'),
('TKT-2024-016', 'High memory usage on server', 'Server A running with high memory consumption', 'In Progress', 'High', 'Incident', 'Performance Issue', 'High Memory Usage', 1, 6, 12, 2, 9, '240'),
('TKT-2024-017', 'Malware detected on workstation', 'Antivirus detected malware on my computer', 'Open', 'Critical', 'Incident', 'Security Issue', 'Malware Detection', 7, 7, 14, 3, 11, '120'),
('TKT-2024-018', 'Account access required', 'Need access to shared network drive', 'Open', 'Medium', 'Service Request', 'Access Request', 'New Account', 2, 3, 5, 4, 3, '60'),
('TKT-2024-019', 'System performance training', 'Staff training for system optimization', 'In Progress', 'Low', 'Service Request', 'Training Request', 'System Training', 5, 9, 18, 5, 13, '240'),
('TKT-2024-020', 'Data recovery request', 'Accidentally deleted important files', 'In Progress', 'Critical', 'Incident', 'Data Issue', 'Data Loss', 6, 8, 15, 6, 9, '480');

-- 9. INSERT COMMENTS
INSERT INTO comments (ticket_id, user_id, content) VALUES
(1, 3, 'Investigating the laptop issue. Checking system logs.'),
(1, 1, 'Thank you for looking into this. Please keep me updated.'),
(2, 5, 'Checking VPN server status. Issue identified.'),
(5, 6, 'Reproduced the crash. Found memory leak in latest update.'),
(6, 8, 'Email server undergoing maintenance. ETA 2 hours.'),
(9, 5, 'WiFi router firmware needs update. Scheduling for tonight.'),
(11, 15, 'Security team alerted. Resetting password immediately.'),
(12, 8, 'Email server back online. Issue resolved.'),
(13, 4, 'Training session scheduled for next week Tuesday.'),
(14, 6, 'Backup successfully restored from secondary backup.');
