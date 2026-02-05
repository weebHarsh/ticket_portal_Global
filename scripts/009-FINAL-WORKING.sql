-- Clean and comprehensive seed script - NO ERRORS
-- Delete in reverse FK dependency order
DELETE FROM comments;
DELETE FROM attachments;
DELETE FROM ticket_classification_mapping;
DELETE FROM tickets;
DELETE FROM team_members;
DELETE FROM teams;
DELETE FROM subcategories;
DELETE FROM categories;
DELETE FROM business_unit_groups;
DELETE FROM users WHERE email NOT IN ('admin@company.com');

-- Reset sequences to 1 or 2
ALTER SEQUENCE users_id_seq RESTART WITH 2;
ALTER SEQUENCE business_unit_groups_id_seq RESTART WITH 1;
ALTER SEQUENCE categories_id_seq RESTART WITH 1;
ALTER SEQUENCE subcategories_id_seq RESTART WITH 1;
ALTER SEQUENCE teams_id_seq RESTART WITH 1;
ALTER SEQUENCE tickets_id_seq RESTART WITH 1;

-- 1. INSERT USERS
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

-- 2. INSERT BUSINESS UNIT GROUPS with proper names
INSERT INTO business_unit_groups (name, description) VALUES
('Sales', 'Sales Team'),
('CS Apps', 'Customer Success Applications'),
('CS Web', 'Customer Success Web Services'),
('CS Brand', 'Customer Success Brand Management'),
('CS BM', 'Brand Monitoring'),
('TD North', 'Tech Delivery North Region'),
('TD South', 'Tech Delivery South Region'),
('TD Others', 'Tech Delivery Other Regions'),
('Engineering', 'Product Engineering'),
('Operations', 'Business Operations');

-- 3. INSERT CATEGORIES
INSERT INTO categories (name, description) VALUES
('Hardware Issue', 'Hardware problems and failures'),
('Software Issue', 'Software problems and bugs'),
('Access Request', 'Access and permission related'),
('Network Issue', 'Network and connectivity problems'),
('Email Issue', 'Email and communication problems'),
('Performance Issue', 'System performance issues'),
('Security Issue', 'Security concerns and incidents'),
('Data Issue', 'Data management and loss'),
('Training Request', 'Training and skill development'),
('Other', 'Miscellaneous issues');

-- 4. INSERT SUBCATEGORIES (FK to categories exists)
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
('Sales Team', 'Sales operations team'),
('CS Apps Team', 'Customer Success Applications team'),
('CS Web Team', 'Customer Success Web Services team'),
('CS Brand Team', 'Customer Success Brand Management team'),
('Monitoring Team', 'Brand monitoring team'),
('TD North Team', 'Tech Delivery North region team'),
('TD South Team', 'Tech Delivery South region team'),
('TD Others Team', 'Tech Delivery other regions team');

-- 6. INSERT TEAM MEMBERS (FK to users and teams exist)
INSERT INTO team_members (user_id, team_id, role) VALUES
(2, 1, 'Lead'), (3, 1, 'Member'), (4, 1, 'Member'),
(5, 2, 'Lead'), (6, 2, 'Member'), (7, 2, 'Member'),
(8, 3, 'Lead'), (9, 3, 'Member'), (10, 3, 'Member'),
(11, 4, 'Lead'), (12, 4, 'Member'), (13, 4, 'Member'),
(14, 5, 'Lead'), (15, 5, 'Member'), (2, 5, 'Member'),
(3, 6, 'Lead'), (4, 6, 'Member'), (5, 6, 'Member'),
(6, 7, 'Lead'), (7, 7, 'Member'), (8, 7, 'Member'),
(9, 8, 'Lead'), (10, 8, 'Member'), (11, 8, 'Member');

-- 7. INSERT TICKET CLASSIFICATION MAPPING
INSERT INTO ticket_classification_mapping (business_unit_group_id, category_id, subcategory_id, spoc_user_id, estimated_duration, auto_title_template) VALUES
(1, 1, 1, 2, 240, 'Sales Hardware Issue'),
(2, 2, 3, 5, 180, 'CS Apps Software Issue'),
(3, 3, 5, 8, 60, 'CS Web New Account'),
(4, 4, 7, 11, 180, 'CS Brand WiFi Issue'),
(5, 5, 9, 14, 120, 'Brand Monitoring Email Issue'),
(6, 6, 11, 3, 240, 'TD North Performance Issue'),
(7, 7, 13, 6, 120, 'TD South Security Issue'),
(8, 8, 15, 9, 480, 'TD Others Data Issue'),
(9, 9, 17, 12, 180, 'Engineering Training'),
(10, 10, 20, 15, 60, 'Operations Other');

-- 8. INSERT TICKETS
INSERT INTO tickets (ticket_id, title, description, status, priority, ticket_type, category, subcategory, business_unit_group_id, category_id, subcategory_id, created_by, assigned_to, estimated_duration) VALUES
('TKT-2024-001', 'Laptop not turning on', 'My Dell laptop is not powering on', 'Open', 'High', 'Incident', 'Hardware Issue', 'Laptop Issue', 1, 1, 1, 2, 3, '240'),
('TKT-2024-002', 'VPN connection failing', 'Unable to connect to company VPN', 'In Progress', 'Medium', 'Incident', 'Network Issue', 'VPN Issue', 6, 4, 8, 3, 4, '240'),
('TKT-2024-003', 'Password reset needed', 'Forgot password and need reset', 'Resolved', 'Low', 'Service Request', 'Access Request', 'Password Reset', 3, 3, 6, 4, 5, '30'),
('TKT-2024-004', 'Printer not working', 'Office printer not responding', 'Open', 'Medium', 'Incident', 'Hardware Issue', 'Printer Issue', 1, 1, 2, 5, 6, '120'),
('TKT-2024-005', 'Application keeps crashing', 'CRM crashes every 10 minutes', 'In Progress', 'High', 'Incident', 'Software Issue', 'Application Error', 2, 2, 3, 6, 7, '180'),
('TKT-2024-006', 'Email not sending', 'Cannot send emails externally', 'Open', 'Critical', 'Incident', 'Email Issue', 'Cannot Send Email', 4, 5, 9, 7, 8, '120'),
('TKT-2024-007', 'Slow computer performance', 'Workstation running very slowly', 'Open', 'Low', 'Incident', 'Performance Issue', 'Slow System', 1, 6, 11, 8, 9, '120'),
('TKT-2024-008', 'New employee account', 'Create account for new hire', 'Resolved', 'Medium', 'Service Request', 'Access Request', 'New Account', 3, 3, 5, 9, 10, '60'),
('TKT-2024-009', 'WiFi keeps disconnecting', 'WiFi drops in conference room', 'In Progress', 'High', 'Incident', 'Network Issue', 'WiFi Issue', 5, 4, 7, 10, 11, '180'),
('TKT-2024-010', 'Software installation help', 'Help installing software', 'Open', 'Low', 'Service Request', 'Software Issue', 'Installation Issue', 2, 2, 4, 11, 12, '120'),
('TKT-2024-011', 'Security alert', 'Suspicious login attempt', 'Open', 'Critical', 'Incident', 'Security Issue', 'Security Alert', 7, 7, 13, 12, 13, '120'),
('TKT-2024-012', 'Cannot receive emails', 'Not receiving from domain', 'In Progress', 'High', 'Incident', 'Email Issue', 'Cannot Receive Email', 4, 5, 10, 13, 14, '120'),
('TKT-2024-013', 'Training on new software', 'PM tool training needed', 'Open', 'Low', 'Service Request', 'Training Request', 'Software Training', 6, 9, 17, 14, 15, '180'),
('TKT-2024-014', 'Database backup failed', 'Backup error last night', 'Resolved', 'High', 'Incident', 'Data Issue', 'Backup Failed', 8, 8, 16, 15, 2, '240'),
('TKT-2024-015', 'General IT inquiry', 'IT policies question', 'Open', 'Low', 'Service Request', 'Other', 'Other Request', 10, 10, 20, 2, 3, '60'),
('TKT-2024-016', 'High memory usage', 'Server A high memory', 'In Progress', 'High', 'Incident', 'Performance Issue', 'High Memory Usage', 6, 6, 12, 3, 4, '240'),
('TKT-2024-017', 'Malware detected', 'Antivirus found malware', 'Open', 'Critical', 'Incident', 'Security Issue', 'Malware Detection', 7, 7, 14, 4, 5, '120'),
('TKT-2024-018', 'Account access required', 'Need drive access', 'Open', 'Medium', 'Service Request', 'Access Request', 'New Account', 2, 3, 5, 5, 6, '60'),
('TKT-2024-019', 'System training', 'Staff optimization training', 'In Progress', 'Low', 'Service Request', 'Training Request', 'System Training', 9, 9, 18, 6, 7, '240'),
('TKT-2024-020', 'Data recovery', 'Deleted files recovery', 'In Progress', 'Critical', 'Incident', 'Data Issue', 'Data Loss', 8, 8, 15, 7, 8, '480');

-- 9. INSERT COMMENTS
INSERT INTO comments (ticket_id, user_id, content) VALUES
(1, 2, 'Investigating laptop issue'),
(2, 3, 'Checking VPN server status'),
(5, 5, 'Found memory leak in update'),
(6, 8, 'Email server maintenance in progress'),
(9, 11, 'WiFi firmware update needed'),
(11, 13, 'Security team alerted'),
(12, 8, 'Email server resolved'),
(14, 6, 'Backup restored successfully'),
(17, 12, 'Malware quarantined'),
(20, 9, 'Data recovery in progress');
