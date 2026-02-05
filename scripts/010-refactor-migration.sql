-- Migration script for Ticketing Portal Refactor
-- Phase 1: Database Schema Changes

-- 1.1 Add business_unit_group_id to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS business_unit_group_id INTEGER REFERENCES business_unit_groups(id);
CREATE INDEX IF NOT EXISTS idx_users_business_unit ON users(business_unit_group_id);

-- 1.2 Add spoc_user_id to tickets table (for tracking SPOC assignment)
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS spoc_user_id INTEGER REFERENCES users(id);
CREATE INDEX IF NOT EXISTS idx_tickets_spoc ON tickets(spoc_user_id);

-- 1.3 Add "Others" category if it doesn't exist
INSERT INTO categories (name, description)
VALUES ('Others', 'General tickets that do not fit other categories')
ON CONFLICT (name) DO NOTHING;

-- 1.4 Create Soju Jose user if not exists
INSERT INTO users (email, password_hash, full_name, role)
VALUES (
  'soju.jose@company.com',
  '$2a$10$8K1p/a0dL1LXMw0HXMh9v.3L4Y5j5h5j5h5j5h5j5h5j5h5j5h5j5', -- placeholder hash
  'Soju Jose',
  'agent'
)
ON CONFLICT (email) DO NOTHING;

-- 1.5 Get the CS Web business unit ID and update Soju Jose as SPOC for all CS Web mappings
DO $$
DECLARE
  cs_web_id INTEGER;
  soju_id INTEGER;
BEGIN
  -- Get CS Web ID
  SELECT id INTO cs_web_id FROM business_unit_groups WHERE name = 'CS Web';

  -- Get Soju Jose ID
  SELECT id INTO soju_id FROM users WHERE full_name ILIKE '%Soju Jose%' OR email = 'soju.jose@company.com';

  IF cs_web_id IS NOT NULL AND soju_id IS NOT NULL THEN
    -- Update all CS Web mappings to have Soju Jose as SPOC
    UPDATE ticket_classification_mapping
    SET spoc_user_id = soju_id
    WHERE business_unit_group_id = cs_web_id;

    RAISE NOTICE 'Updated SPOC for CS Web to Soju Jose (user_id: %)', soju_id;
  ELSE
    RAISE NOTICE 'Could not find CS Web (%) or Soju Jose (%)', cs_web_id, soju_id;
  END IF;
END $$;

-- 1.6 Add soft delete support for tickets
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
CREATE INDEX IF NOT EXISTS idx_tickets_deleted ON tickets(is_deleted);

-- 1.7 Add has_attachments flag for quick lookup
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS has_attachments BOOLEAN DEFAULT FALSE;

-- Verify changes
SELECT 'Users table columns:' as info;
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users' ORDER BY ordinal_position;

SELECT 'Tickets table new columns:' as info;
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'tickets' AND column_name IN ('spoc_user_id', 'is_deleted', 'has_attachments');

SELECT 'Others category:' as info;
SELECT * FROM categories WHERE name = 'Others';

SELECT 'CS Web SPOC mappings:' as info;
SELECT tcm.id, bug.name as business_unit, c.name as category, u.full_name as spoc
FROM ticket_classification_mapping tcm
JOIN business_unit_groups bug ON tcm.business_unit_group_id = bug.id
JOIN categories c ON tcm.category_id = c.id
LEFT JOIN users u ON tcm.spoc_user_id = u.id
WHERE bug.name = 'CS Web'
LIMIT 5;
