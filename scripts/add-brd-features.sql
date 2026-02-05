-- Add BRD missing features to database
-- Run this script to add new fields and tables for BRD compliance

-- 1. Add missing fields to tickets table
ALTER TABLE tickets
ADD COLUMN IF NOT EXISTS project_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS product_release_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- 2. Update status enum to include 'hold'
-- Note: We're using VARCHAR for status, so no enum change needed
-- Just document that valid statuses are: open, in-progress, hold, resolved, closed

-- 3. Create Product Release Plan master table
CREATE TABLE IF NOT EXISTS product_releases (
  id SERIAL PRIMARY KEY,
  product_name VARCHAR(255) NOT NULL,
  package_name VARCHAR(255),
  release_number VARCHAR(100) NOT NULL,
  release_date DATE,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(product_name, release_number)
);

-- 4. Create Projects master table (for Initiator Project Name dropdown)
CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  business_unit_group_id INTEGER REFERENCES business_unit_groups(id) ON DELETE CASCADE,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Add some sample projects for each Business Unit
INSERT INTO projects (name, business_unit_group_id, description)
SELECT 'Airtel', id, 'Airtel project' FROM business_unit_groups WHERE name = 'Sales'
ON CONFLICT (name) DO NOTHING;

INSERT INTO projects (name, business_unit_group_id, description)
SELECT 'Vodafone', id, 'Vodafone project' FROM business_unit_groups WHERE name = 'Sales'
ON CONFLICT (name) DO NOTHING;

INSERT INTO projects (name, business_unit_group_id, description)
SELECT 'Jio', id, 'Jio project' FROM business_unit_groups WHERE name = 'Sales'
ON CONFLICT (name) DO NOTHING;

INSERT INTO projects (name, business_unit_group_id, description)
SELECT 'General CS Apps', id, 'General CS Apps work' FROM business_unit_groups WHERE name = 'CS Apps'
ON CONFLICT (name) DO NOTHING;

INSERT INTO projects (name, business_unit_group_id, description)
SELECT 'General CS Web', id, 'General CS Web work' FROM business_unit_groups WHERE name = 'CS Web'
ON CONFLICT (name) DO NOTHING;

-- 6. Add some sample product releases
INSERT INTO product_releases (product_name, package_name, release_number, release_date, description)
VALUES
  ('Portal V2', 'core', 'v2.1.0', '2025-02-15', 'Major portal update with new features'),
  ('Portal V2', 'core', 'v2.2.0', '2025-03-15', 'Performance improvements'),
  ('Analytics Dashboard', 'analytics', 'v1.0.0', '2025-02-01', 'New analytics module'),
  ('API Gateway', 'backend', 'v3.0.0', '2025-04-01', 'API v3 release')
ON CONFLICT (product_name, release_number) DO NOTHING;

-- 7. Add index for soft delete queries (to exclude deleted tickets)
CREATE INDEX IF NOT EXISTS idx_tickets_is_deleted ON tickets(is_deleted) WHERE is_deleted = FALSE;

-- 8. Add index for project lookups
CREATE INDEX IF NOT EXISTS idx_projects_business_unit ON projects(business_unit_group_id);

COMMENT ON COLUMN tickets.project_name IS 'Initiator project name (e.g., Airtel, Vodafone)';
COMMENT ON COLUMN tickets.product_release_name IS 'For New Requirement tickets - links to product release plan';
COMMENT ON COLUMN tickets.is_deleted IS 'Soft delete flag - deleted tickets are greyed out but not removed';
COMMENT ON COLUMN tickets.deleted_at IS 'Timestamp when ticket was marked as deleted';
