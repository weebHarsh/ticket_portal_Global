-- Drop existing tables if they exist
DROP TABLE IF EXISTS ticket_classification_mapping CASCADE;
DROP TABLE IF EXISTS subcategories CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS business_unit_groups CASCADE;
DROP TABLE IF EXISTS teams CASCADE;
DROP TABLE IF EXISTS team_members CASCADE;

-- Business Unit Groups table
CREATE TABLE business_unit_groups (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Categories table
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Subcategories table
CREATE TABLE subcategories (
  id SERIAL PRIMARY KEY,
  category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(category_id, name)
);

-- Teams table
CREATE TABLE teams (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Team Members table (linking users to teams)
CREATE TABLE team_members (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'member',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, team_id)
);

-- Ticket Classification Mapping table
CREATE TABLE ticket_classification_mapping (
  id SERIAL PRIMARY KEY,
  business_unit_group_id INTEGER NOT NULL REFERENCES business_unit_groups(id) ON DELETE CASCADE,
  category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  subcategory_id INTEGER NOT NULL REFERENCES subcategories(id) ON DELETE CASCADE,
  estimated_duration INTEGER NOT NULL, -- in minutes
  spoc_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  auto_title_template VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(business_unit_group_id, category_id, subcategory_id)
);

-- Update tickets table to reference master data
ALTER TABLE tickets 
  ADD COLUMN IF NOT EXISTS business_unit_group_id INTEGER REFERENCES business_unit_groups(id),
  ADD COLUMN IF NOT EXISTS category_id INTEGER REFERENCES categories(id),
  ADD COLUMN IF NOT EXISTS subcategory_id INTEGER REFERENCES subcategories(id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_subcategories_category ON subcategories(category_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_ticket_classification_bu ON ticket_classification_mapping(business_unit_group_id);
CREATE INDEX IF NOT EXISTS idx_ticket_classification_cat ON ticket_classification_mapping(category_id);
CREATE INDEX IF NOT EXISTS idx_ticket_classification_subcat ON ticket_classification_mapping(subcategory_id);
CREATE INDEX IF NOT EXISTS idx_tickets_bu ON tickets(business_unit_group_id);
CREATE INDEX IF NOT EXISTS idx_tickets_category ON tickets(category_id);
CREATE INDEX IF NOT EXISTS idx_tickets_subcategory ON tickets(subcategory_id);
