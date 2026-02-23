-- Migration Script: Target Business Groups Implementation
-- Phase 1: Database Schema Changes
-- Date: Current
-- Description: Adds Target Business Group entity, updates ticket classification mapping,
--              adds target_business_group_id and assignee_group_id to tickets,
--              and seeds universal "Others" category/subcategory

-- ============================================================================
-- 1. CREATE TARGET BUSINESS GROUPS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS target_business_groups (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_target_business_groups_name ON target_business_groups(name);

-- ============================================================================
-- 2. MIGRATE EXISTING BUSINESS UNIT GROUPS TO TARGET BUSINESS GROUPS
-- ============================================================================

-- Copy all existing business_unit_groups to target_business_groups
INSERT INTO target_business_groups (name, description)
SELECT name, description
FROM business_unit_groups
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- 3. MODIFY TICKET_CLASSIFICATION_MAPPING TABLE
-- ============================================================================

-- Add target_business_group_id column (nullable initially for migration)
ALTER TABLE ticket_classification_mapping 
ADD COLUMN IF NOT EXISTS target_business_group_id INTEGER REFERENCES target_business_groups(id) ON DELETE CASCADE;

-- Add description field if it doesn't exist
ALTER TABLE ticket_classification_mapping 
ADD COLUMN IF NOT EXISTS description TEXT;

-- Migrate existing data: map business_unit_group_id to target_business_group_id
-- by matching names
UPDATE ticket_classification_mapping tcm
SET target_business_group_id = (
  SELECT tbg.id
  FROM target_business_groups tbg
  JOIN business_unit_groups bug ON tbg.name = bug.name
  WHERE bug.id = tcm.business_unit_group_id
  LIMIT 1
)
WHERE tcm.target_business_group_id IS NULL;

-- Make target_business_group_id NOT NULL after migration
ALTER TABLE ticket_classification_mapping 
ALTER COLUMN target_business_group_id SET NOT NULL;

-- Drop the old unique constraint
ALTER TABLE ticket_classification_mapping 
DROP CONSTRAINT IF EXISTS ticket_classification_mapping_business_unit_group_id_category_id_subcategory_id_key;

-- Drop the old foreign key constraint
ALTER TABLE ticket_classification_mapping 
DROP CONSTRAINT IF EXISTS ticket_classification_mapping_business_unit_group_id_fkey;

-- Add new unique constraint with target_business_group_id
ALTER TABLE ticket_classification_mapping 
ADD CONSTRAINT ticket_classification_mapping_target_bg_cat_subcat_unique 
UNIQUE (target_business_group_id, category_id, subcategory_id);

-- Create new indexes
CREATE INDEX IF NOT EXISTS idx_ticket_classification_target_bg ON ticket_classification_mapping(target_business_group_id);

-- Drop old index if it exists
DROP INDEX IF EXISTS idx_ticket_classification_bu;

-- Keep business_unit_group_id column for now (can be removed in future migration if needed)
-- This allows for gradual migration and rollback if needed

-- ============================================================================
-- 4. UPDATE TICKETS TABLE
-- ============================================================================

-- Add target_business_group_id column
ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS target_business_group_id INTEGER REFERENCES target_business_groups(id);

-- Add assignee_group_id column (FK to business_unit_groups)
ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS assignee_group_id INTEGER REFERENCES business_unit_groups(id);

-- Migrate existing tickets: set target_business_group_id from business_unit_group_id
UPDATE tickets t
SET target_business_group_id = (
  SELECT tbg.id
  FROM target_business_groups tbg
  JOIN business_unit_groups bug ON tbg.name = bug.name
  WHERE bug.id = t.business_unit_group_id
  LIMIT 1
)
WHERE t.target_business_group_id IS NULL AND t.business_unit_group_id IS NOT NULL;

-- Set assignee_group_id from assigned_to user's business_unit_group_id
UPDATE tickets t
SET assignee_group_id = (
  SELECT u.business_unit_group_id
  FROM users u
  WHERE u.id = t.assigned_to
)
WHERE t.assigned_to IS NOT NULL AND t.assignee_group_id IS NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_tickets_target_bg ON tickets(target_business_group_id);
CREATE INDEX IF NOT EXISTS idx_tickets_assignee_group ON tickets(assignee_group_id);

-- ============================================================================
-- 5. SEED UNIVERSAL "OTHERS" CATEGORY AND SUBCATEGORY
-- ============================================================================

-- Create "Others" category if it doesn't exist
INSERT INTO categories (name, description)
VALUES ('Others', 'General tickets that do not fit other categories')
ON CONFLICT (name) DO NOTHING;

-- Get the "Others" category ID
DO $$
DECLARE
  others_category_id INTEGER;
  others_subcategory_id INTEGER;
  target_bg_record RECORD;
BEGIN
  -- Get or create "Others" category
  SELECT id INTO others_category_id
  FROM categories
  WHERE name = 'Others';
  
  IF others_category_id IS NULL THEN
    INSERT INTO categories (name, description)
    VALUES ('Others', 'General tickets that do not fit other categories')
    RETURNING id INTO others_category_id;
  END IF;
  
  -- Create "Others" subcategory if it doesn't exist
  INSERT INTO subcategories (category_id, name, description)
  VALUES (others_category_id, 'Others', '')
  ON CONFLICT (category_id, name) DO NOTHING
  RETURNING id INTO others_subcategory_id;
  
  -- If subcategory already existed, get its ID
  IF others_subcategory_id IS NULL THEN
    SELECT id INTO others_subcategory_id
    FROM subcategories
    WHERE category_id = others_category_id AND name = 'Others';
  END IF;
  
  -- Create classification mappings for ALL target business groups
  FOR target_bg_record IN SELECT id FROM target_business_groups
  LOOP
    INSERT INTO ticket_classification_mapping (
      target_business_group_id,
      category_id,
      subcategory_id,
      estimated_duration,
      description,
      auto_title_template
    )
    VALUES (
      target_bg_record.id,
      others_category_id,
      others_subcategory_id,
      0, -- blank duration
      '', -- blank description
      'Others'
    )
    ON CONFLICT (target_business_group_id, category_id, subcategory_id) DO NOTHING;
  END LOOP;
  
  RAISE NOTICE 'Created "Others" category and subcategory with mappings for all target business groups';
END $$;

-- ============================================================================
-- 6. ADD COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE target_business_groups IS 'Target business groups that tickets are directed to';
COMMENT ON COLUMN tickets.target_business_group_id IS 'The target business group this ticket is directed to (replaces business_unit_group_id in classification context)';
COMMENT ON COLUMN tickets.assignee_group_id IS 'The business unit group of the assigned user (derived from assigned_to user)';
COMMENT ON COLUMN ticket_classification_mapping.target_business_group_id IS 'Target business group for this classification mapping (replaces business_unit_group_id)';
COMMENT ON COLUMN ticket_classification_mapping.description IS 'Description or template for this classification mapping';

-- ============================================================================
-- 7. VERIFY MIGRATION
-- ============================================================================

-- Verify target_business_groups table exists and has data
SELECT 
  COUNT(*) as target_business_groups_count,
  'Target business groups created' as status
FROM target_business_groups;

-- Verify ticket_classification_mapping has target_business_group_id
SELECT 
  COUNT(*) as total_mappings,
  COUNT(target_business_group_id) as mappings_with_target_bg,
  'Classification mappings migrated' as status
FROM ticket_classification_mapping;

-- Verify tickets table has new columns
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'tickets' 
  AND column_name IN ('target_business_group_id', 'assignee_group_id')
ORDER BY column_name;

-- Verify "Others" category and subcategory exist
SELECT 
  c.id as category_id,
  c.name as category_name,
  s.id as subcategory_id,
  s.name as subcategory_name,
  COUNT(tcm.id) as mapping_count
FROM categories c
JOIN subcategories s ON s.category_id = c.id
LEFT JOIN ticket_classification_mapping tcm ON tcm.category_id = c.id AND tcm.subcategory_id = s.id
WHERE c.name = 'Others' AND s.name = 'Others'
GROUP BY c.id, c.name, s.id, s.name;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

SELECT 'Migration completed successfully!' as status;
SELECT 'Target business groups table created' as step1;
SELECT 'Ticket classification mapping updated to use target_business_group_id' as step2;
SELECT 'Tickets table updated with target_business_group_id and assignee_group_id' as step3;
SELECT 'Universal "Others" category and subcategory seeded' as step4;
