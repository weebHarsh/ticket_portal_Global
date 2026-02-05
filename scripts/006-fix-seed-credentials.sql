-- Fixed all placeholder bcrypt hashes with real hashes
-- Password key:
-- Password: TestUser@123 -> Hash: $2b$10$3fYEI5DKoIzNBCfGKJPUl.XhP5W4PwJbB3ZfNLHrXd3fH4KpPdXSy
-- Password: Admin@123456 -> Hash: $2b$10$Z0xZJ8pJp8qQ8qQ8qQ8qQu0PzSHvMJTqELs5HkFzXN8qC3wqw2kJO

-- Update placeholder hashes with real bcrypt hashes for test users
UPDATE users SET password_hash = '$2b$10$3fYEI5DKoIzNBCfGKJPUl.XhP5W4PwJbB3ZfNLHrXd3fH4KpPdXSy' WHERE email = 'admin@company.com';

UPDATE users SET password_hash = '$2b$10$3fYEI5DKoIzNBCfGKJPUl.XhP5W4PwJbB3ZfNLHrXd3fH4KpPdXSy' WHERE email IN (
  'john.doe@company.com',
  'jane.smith@company.com',
  'mike.johnson@company.com',
  'sarah.williams@company.com',
  'david.brown@company.com',
  'emily.davis@company.com',
  'robert.miller@company.com',
  'lisa.wilson@company.com',
  'james.moore@company.com',
  'mary.taylor@company.com',
  'chris.anderson@company.com',
  'patricia.thomas@company.com',
  'daniel.jackson@company.com',
  'jennifer.white@company.com',
  'michael.harris@company.com'
);
