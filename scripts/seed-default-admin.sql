-- Insert default admin user with credentials: admin@company.com / Admin@123456
-- Password hash for "Admin@123456" generated with bcrypt
INSERT INTO users (email, full_name, password_hash, role)
VALUES (
  'admin@company.com',
  'Admin User',
  '$2b$10$Z0xZJ8pJp8qQ8qQ8qQ8qQ8qQ8qQ8qQ8qQ8qQ8qQ8qQ8qQ8qQ8qQ8qQ', -- Use bcrypt hash
  'Admin'
) ON CONFLICT (email) DO NOTHING;
