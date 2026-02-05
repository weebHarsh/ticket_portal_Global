-- Add SPOC name to Business Unit Groups
ALTER TABLE business_unit_groups
ADD COLUMN IF NOT EXISTS spoc_name VARCHAR(255);

-- Drop and recreate projects table for release planning
DROP TABLE IF EXISTS projects CASCADE;

CREATE TABLE projects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  estimated_release_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample projects
INSERT INTO projects (name, estimated_release_date) VALUES
  ('Q1 2026 Release', '2026-03-31'),
  ('Q2 2026 Release', '2026-06-30'),
  ('Others', NULL);
