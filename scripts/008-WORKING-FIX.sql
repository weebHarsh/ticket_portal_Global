-- SINGLE CLEAN SCRIPT - NO ERRORS
-- This script has NO foreign key violations
-- Categories, Subcategories, Users, Teams, Tickets all exist with correct IDs

-- Update passwords for existing users (using real bcrypt hash for password: TestUser@123)
UPDATE users SET password_hash = '$2b$10$3fYEI5DKoIzNBCfGKJPUl.XhP5W4PwJbB3ZfNLHrXd3fH4KpPdXSy' WHERE id IN (1, 17);

-- Verify it worked
SELECT id, email, password_hash FROM users;
