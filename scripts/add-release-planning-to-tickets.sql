-- Add release planning fields to tickets table
ALTER TABLE tickets
ADD COLUMN IF NOT EXISTS project_id INTEGER REFERENCES projects(id),
ADD COLUMN IF NOT EXISTS estimated_release_date DATE;
