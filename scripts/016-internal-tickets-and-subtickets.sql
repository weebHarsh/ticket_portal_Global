-- Migration Script: Internal Tickets, Sub-tickets, and Redirection Support
-- Phase 1: Database Schema Expansion
-- Date: Current
-- Description: Adds support for internal tickets, sub-tickets (child tickets), and ticket redirection

-- ============================================================================
-- 1. ADD NEW COLUMNS TO TICKETS TABLE
-- ============================================================================

-- 1.1 Add is_internal flag to distinguish customer vs internal tickets
ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS is_internal BOOLEAN DEFAULT FALSE;

-- 1.2 Add parent_ticket_id for sub-tickets (child tickets)
ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS parent_ticket_id INTEGER REFERENCES tickets(id) ON DELETE CASCADE;

-- 1.3 Add redirection fields
ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS redirected_from_business_unit_group_id INTEGER REFERENCES business_unit_groups(id),
ADD COLUMN IF NOT EXISTS redirected_from_spoc_user_id INTEGER REFERENCES users(id),
ADD COLUMN IF NOT EXISTS redirection_remarks TEXT,
ADD COLUMN IF NOT EXISTS redirected_at TIMESTAMP WITH TIME ZONE;

-- ============================================================================
-- 2. CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Index for filtering internal vs customer tickets
CREATE INDEX IF NOT EXISTS idx_tickets_is_internal ON tickets(is_internal);

-- Index for querying sub-tickets by parent
CREATE INDEX IF NOT EXISTS idx_tickets_parent_ticket_id ON tickets(parent_ticket_id);

-- Index for querying parent tickets (tickets with children)
CREATE INDEX IF NOT EXISTS idx_tickets_has_children ON tickets(parent_ticket_id) WHERE parent_ticket_id IS NOT NULL;

-- Index for redirection queries
CREATE INDEX IF NOT EXISTS idx_tickets_redirected_from_group ON tickets(redirected_from_business_unit_group_id);
CREATE INDEX IF NOT EXISTS idx_tickets_redirected_from_spoc ON tickets(redirected_from_spoc_user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_redirected_at ON tickets(redirected_at);

-- ============================================================================
-- 3. ENSURE REQUIRED BUSINESS GROUPS EXIST
-- ============================================================================

-- Insert internal support business groups if they don't exist
INSERT INTO business_unit_groups (name, description) VALUES
  ('Tech Support', 'Technical Support Team'),
  ('DevOps Support', 'DevOps and Infrastructure Support Team'),
  ('Integration Support', 'Integration and API Support Team'),
  ('GUI Support', 'Graphical User Interface Support Team'),
  ('Central Team Support', 'Central Support Team'),
  ('Product Team Support', 'Product Development Support Team')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- 4. ADD COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON COLUMN tickets.is_internal IS 'Flag to distinguish internal tickets (true) from customer tickets (false)';
COMMENT ON COLUMN tickets.parent_ticket_id IS 'Self-referencing FK for sub-tickets. NULL for parent tickets, references parent ticket id for child tickets';
COMMENT ON COLUMN tickets.redirected_from_business_unit_group_id IS 'Original business unit group before redirection';
COMMENT ON COLUMN tickets.redirected_from_spoc_user_id IS 'Original SPOC before redirection';
COMMENT ON COLUMN tickets.redirection_remarks IS 'Remarks/reason for ticket redirection (stored for audit trail)';
COMMENT ON COLUMN tickets.redirected_at IS 'Timestamp when ticket was redirected to another business group/SPOC';

-- ============================================================================
-- 5. VERIFY MIGRATION
-- ============================================================================

-- Verify new columns exist
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'tickets' 
  AND column_name IN (
    'is_internal',
    'parent_ticket_id',
    'redirected_from_business_unit_group_id',
    'redirected_from_spoc_user_id',
    'redirection_remarks',
    'redirected_at'
  )
ORDER BY column_name;

-- Verify indexes were created
SELECT 
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'tickets' 
  AND indexname LIKE '%internal%' 
   OR indexname LIKE '%parent%'
   OR indexname LIKE '%redirect%'
ORDER BY indexname;

-- Verify business groups exist
SELECT id, name, description 
FROM business_unit_groups 
WHERE name IN (
  'Tech Support',
  'DevOps Support',
  'Integration Support',
  'GUI Support',
  'Central Team Support',
  'Product Team Support'
)
ORDER BY name;

-- ============================================================================
-- 6. DATA INTEGRITY CONSTRAINTS (Optional - Add if needed)
-- ============================================================================

-- Prevent circular references in parent_ticket_id
-- Note: This would require a trigger or application-level validation
-- Example constraint: A ticket cannot be its own parent or grandparent

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

SELECT 'Migration completed successfully!' as status;
SELECT 'New columns added: is_internal, parent_ticket_id, redirection fields' as summary;
SELECT 'Business groups verified: Tech Support, DevOps Support, Integration Support, GUI Support, Central Team Support, Product Team Support' as business_groups;
