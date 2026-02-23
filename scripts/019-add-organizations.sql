-- Migration script: Add Organizations and mapping to Target Business Groups
-- This enables filtering Target Business Groups by Organization for Internal Tickets

-- ============================================================================
-- 1. CREATE ORGANIZATIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS organizations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 2. CREATE ORGANIZATION TO TARGET BUSINESS GROUP MAPPING TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS organization_target_business_group_mapping (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  target_business_group_id INTEGER NOT NULL REFERENCES target_business_groups(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(organization_id, target_business_group_id)
);

-- ============================================================================
-- 3. CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_org_tbg_mapping_org ON organization_target_business_group_mapping(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_tbg_mapping_tbg ON organization_target_business_group_mapping(target_business_group_id);

-- ============================================================================
-- 4. ADD COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE organizations IS 'Organizations that group related Target Business Groups together';
COMMENT ON TABLE organization_target_business_group_mapping IS 'Mapping table linking Organizations to their associated Target Business Groups';
COMMENT ON COLUMN organizations.name IS 'Organization name (e.g., "Tech Delivery", "Customer Support")';
COMMENT ON COLUMN organization_target_business_group_mapping.organization_id IS 'Reference to the organization';
COMMENT ON COLUMN organization_target_business_group_mapping.target_business_group_id IS 'Reference to the target business group belonging to this organization';
