-- Migration script: Seed Organizations and Mappings for Internal Tickets
-- This script creates organizations and maps them to target business groups

-- ============================================================================
-- 1. ENSURE TARGET BUSINESS GROUPS EXIST
-- ============================================================================

INSERT INTO target_business_groups (name, description) VALUES
  ('TD Apps', 'Tech Delivery Apps Team'),
  ('TD Web', 'Tech Delivery Web Team'),
  ('TD Brand', 'Tech Delivery Brand Team'),
  ('TD BM', 'Tech Delivery Brand Monitoring Team'),
  ('TD RMN', 'Tech Delivery RMN Team'),
  ('TD Central', 'Tech Delivery Central Team'),
  ('TD GUI', 'Tech Delivery GUI Team'),
  ('TD Integrations', 'Tech Delivery Integrations Team'),
  ('TD IS', 'Tech Delivery Information Systems Team'),
  ('TD Product', 'Tech Delivery Product Team')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- 2. CREATE ORGANIZATIONS FOR INTERNAL TICKETS
-- ============================================================================

INSERT INTO organizations (name, description) VALUES
  ('MFBuddy support', 'MFBuddy Support Organization'),
  ('Customer Portal support', 'Customer Portal Support Organization'),
  ('Ticket Portal support', 'Ticket Portal Support Organization'),
  ('Billing Portal support', 'Billing Portal Support Organization'),
  ('Customer Integrations support', 'Customer Integrations Support Organization'),
  ('GUI Development support', 'GUI Development Support Organization'),
  ('IT Administration support', 'IT Administration Support Organization'),
  ('IT Security support', 'IT Security Support Organization'),
  ('IT DevOps support', 'IT DevOps Support Organization'),
  ('Customer Solutions support', 'Customer Solutions Support Organization'),
  ('Competitive Research support', 'Competitive Research Support Organization'),
  ('Others', 'Other Support Organizations')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- 3. CREATE ORGANIZATION TO TARGET BUSINESS GROUP MAPPINGS
-- ============================================================================

-- MFBuddy support -> TD Central
INSERT INTO organization_target_business_group_mapping (organization_id, target_business_group_id)
SELECT o.id, tbg.id
FROM organizations o, target_business_groups tbg
WHERE o.name = 'MFBuddy support' AND tbg.name = 'TD Central'
ON CONFLICT DO NOTHING;

-- Customer Portal support -> TD Central
INSERT INTO organization_target_business_group_mapping (organization_id, target_business_group_id)
SELECT o.id, tbg.id
FROM organizations o, target_business_groups tbg
WHERE o.name = 'Customer Portal support' AND tbg.name = 'TD Central'
ON CONFLICT DO NOTHING;

-- Ticket Portal support -> TD GUI
INSERT INTO organization_target_business_group_mapping (organization_id, target_business_group_id)
SELECT o.id, tbg.id
FROM organizations o, target_business_groups tbg
WHERE o.name = 'Ticket Portal support' AND tbg.name = 'TD GUI'
ON CONFLICT DO NOTHING;

-- Billing Portal support -> TD Central
INSERT INTO organization_target_business_group_mapping (organization_id, target_business_group_id)
SELECT o.id, tbg.id
FROM organizations o, target_business_groups tbg
WHERE o.name = 'Billing Portal support' AND tbg.name = 'TD Central'
ON CONFLICT DO NOTHING;

-- Customer Integrations support -> TD Integrations
INSERT INTO organization_target_business_group_mapping (organization_id, target_business_group_id)
SELECT o.id, tbg.id
FROM organizations o, target_business_groups tbg
WHERE o.name = 'Customer Integrations support' AND tbg.name = 'TD Integrations'
ON CONFLICT DO NOTHING;

-- GUI Development support -> TD GUI
INSERT INTO organization_target_business_group_mapping (organization_id, target_business_group_id)
SELECT o.id, tbg.id
FROM organizations o, target_business_groups tbg
WHERE o.name = 'GUI Development support' AND tbg.name = 'TD GUI'
ON CONFLICT DO NOTHING;

-- IT Administration support -> TD IS
INSERT INTO organization_target_business_group_mapping (organization_id, target_business_group_id)
SELECT o.id, tbg.id
FROM organizations o, target_business_groups tbg
WHERE o.name = 'IT Administration support' AND tbg.name = 'TD IS'
ON CONFLICT DO NOTHING;

-- IT Security support -> TD IS
INSERT INTO organization_target_business_group_mapping (organization_id, target_business_group_id)
SELECT o.id, tbg.id
FROM organizations o, target_business_groups tbg
WHERE o.name = 'IT Security support' AND tbg.name = 'TD IS'
ON CONFLICT DO NOTHING;

-- IT DevOps support -> TD IS
INSERT INTO organization_target_business_group_mapping (organization_id, target_business_group_id)
SELECT o.id, tbg.id
FROM organizations o, target_business_groups tbg
WHERE o.name = 'IT DevOps support' AND tbg.name = 'TD IS'
ON CONFLICT DO NOTHING;

-- Customer Solutions support -> TD Product
INSERT INTO organization_target_business_group_mapping (organization_id, target_business_group_id)
SELECT o.id, tbg.id
FROM organizations o, target_business_groups tbg
WHERE o.name = 'Customer Solutions support' AND tbg.name = 'TD Product'
ON CONFLICT DO NOTHING;

-- Competitive Research support -> TD Product
INSERT INTO organization_target_business_group_mapping (organization_id, target_business_group_id)
SELECT o.id, tbg.id
FROM organizations o, target_business_groups tbg
WHERE o.name = 'Competitive Research support' AND tbg.name = 'TD Product'
ON CONFLICT DO NOTHING;

-- Others -> All target business groups (TD Apps, TD Web, TD Brand, TD BM, TD RMN, TD Central, TD GUI, TD Integrations, TD IS, TD Product)
INSERT INTO organization_target_business_group_mapping (organization_id, target_business_group_id)
SELECT o.id, tbg.id
FROM organizations o, target_business_groups tbg
WHERE o.name = 'Others' 
  AND tbg.name IN ('TD Apps', 'TD Web', 'TD Brand', 'TD BM', 'TD RMN', 'TD Central', 'TD GUI', 'TD Integrations', 'TD IS', 'TD Product')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 4. VERIFY MAPPINGS
-- ============================================================================

SELECT 
  o.name as organization,
  tbg.name as target_business_group,
  COUNT(*) as mapping_count
FROM organizations o
JOIN organization_target_business_group_mapping otbgm ON o.id = otbgm.organization_id
JOIN target_business_groups tbg ON otbgm.target_business_group_id = tbg.id
GROUP BY o.name, tbg.name
ORDER BY o.name, tbg.name;
