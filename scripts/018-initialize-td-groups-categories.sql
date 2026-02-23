-- Migration Script: Initialize Category Lists for TD Groups
-- Date: Current
-- Description: Initialize category lists for TD Web, TD Brand, TD Integration (WIP), and TD IS (WIP)

-- ============================================================================
-- 1. ENSURE TARGET BUSINESS GROUPS EXIST
-- ============================================================================

-- Insert TD groups into target_business_groups if they don't exist
INSERT INTO target_business_groups (name, description)
VALUES 
  ('TD Web', 'Tech Delivery Web Team'),
  ('TD Brand', 'Tech Delivery Brand Team'),
  ('TD Integration (WIP)', 'Tech Delivery Integration Team (Work In Progress)'),
  ('TD IS (WIP)', 'Tech Delivery IS Team (Work In Progress)')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- 2. GET OR CREATE "OTHERS" CATEGORY AND SUBCATEGORY
-- ============================================================================

DO $$
DECLARE
  others_category_id INTEGER;
  others_subcategory_id INTEGER;
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
  
  -- Get or create "Others" subcategory
  SELECT id INTO others_subcategory_id
  FROM subcategories
  WHERE category_id = others_category_id AND name = 'Others';
  
  IF others_subcategory_id IS NULL THEN
    INSERT INTO subcategories (category_id, name, description)
    VALUES (others_category_id, 'Others', '')
    RETURNING id INTO others_subcategory_id;
  END IF;
  
  RAISE NOTICE 'Others category ID: %, Others subcategory ID: %', others_category_id, others_subcategory_id;
END $$;

-- ============================================================================
-- 3. CREATE SAMPLE CATEGORIES FOR TD GROUPS
-- ============================================================================

-- Create categories that are commonly used for TD groups
INSERT INTO categories (name, description)
VALUES 
  ('Web Development', 'Web development related tickets'),
  ('Brand Management', 'Brand management and marketing related tickets'),
  ('Integration', 'System integration related tickets'),
  ('Infrastructure', 'Infrastructure and system related tickets'),
  ('API Development', 'API development and maintenance'),
  ('Database', 'Database related issues and requests'),
  ('Security', 'Security related tickets'),
  ('Performance', 'Performance optimization tickets')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- 4. CREATE SAMPLE SUBCATEGORIES
-- ============================================================================

-- Web Development subcategories
INSERT INTO subcategories (category_id, name, description)
SELECT c.id, 'Frontend Development', 'Frontend development tasks'
FROM categories c WHERE c.name = 'Web Development'
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO subcategories (category_id, name, description)
SELECT c.id, 'Backend Development', 'Backend development tasks'
FROM categories c WHERE c.name = 'Web Development'
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO subcategories (category_id, name, description)
SELECT c.id, 'UI/UX Issues', 'User interface and experience issues'
FROM categories c WHERE c.name = 'Web Development'
ON CONFLICT (category_id, name) DO NOTHING;

-- Brand Management subcategories
INSERT INTO subcategories (category_id, name, description)
SELECT c.id, 'Brand Guidelines', 'Brand guideline related requests'
FROM categories c WHERE c.name = 'Brand Management'
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO subcategories (category_id, name, description)
SELECT c.id, 'Content Management', 'Content management tasks'
FROM categories c WHERE c.name = 'Brand Management'
ON CONFLICT (category_id, name) DO NOTHING;

-- Integration subcategories
INSERT INTO subcategories (category_id, name, description)
SELECT c.id, 'API Integration', 'API integration tasks'
FROM categories c WHERE c.name = 'Integration'
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO subcategories (category_id, name, description)
SELECT c.id, 'Third-party Integration', 'Third-party system integration'
FROM categories c WHERE c.name = 'Integration'
ON CONFLICT (category_id, name) DO NOTHING;

-- Infrastructure subcategories
INSERT INTO subcategories (category_id, name, description)
SELECT c.id, 'Server Configuration', 'Server configuration tasks'
FROM categories c WHERE c.name = 'Infrastructure'
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO subcategories (category_id, name, description)
SELECT c.id, 'Deployment', 'Deployment related tasks'
FROM categories c WHERE c.name = 'Infrastructure'
ON CONFLICT (category_id, name) DO NOTHING;

-- ============================================================================
-- 5. CREATE CLASSIFICATION MAPPINGS FOR TD GROUPS
-- ============================================================================

-- Get default SPOC (first admin user)
DO $$
DECLARE
  default_spoc_id INTEGER;
  td_web_id INTEGER;
  td_brand_id INTEGER;
  td_integration_id INTEGER;
  td_is_id INTEGER;
  others_category_id INTEGER;
  others_subcategory_id INTEGER;
  web_dev_category_id INTEGER;
  brand_mgmt_category_id INTEGER;
  integration_category_id INTEGER;
  infra_category_id INTEGER;
  mapping_count INTEGER := 0;
BEGIN
  -- Get default SPOC
  SELECT id INTO default_spoc_id
  FROM users
  WHERE role = 'admin' OR role = 'Admin'
  LIMIT 1;
  
  IF default_spoc_id IS NULL THEN
    SELECT id INTO default_spoc_id FROM users LIMIT 1;
  END IF;
  
  -- Get target business group IDs
  SELECT id INTO td_web_id FROM target_business_groups WHERE name = 'TD Web';
  SELECT id INTO td_brand_id FROM target_business_groups WHERE name = 'TD Brand';
  SELECT id INTO td_integration_id FROM target_business_groups WHERE name = 'TD Integration (WIP)';
  SELECT id INTO td_is_id FROM target_business_groups WHERE name = 'TD IS (WIP)';
  
  -- Get category IDs
  SELECT id INTO others_category_id FROM categories WHERE name = 'Others';
  SELECT id INTO web_dev_category_id FROM categories WHERE name = 'Web Development';
  SELECT id INTO brand_mgmt_category_id FROM categories WHERE name = 'Brand Management';
  SELECT id INTO integration_category_id FROM categories WHERE name = 'Integration';
  SELECT id INTO infra_category_id FROM categories WHERE name = 'Infrastructure';
  
  -- Get Others subcategory ID
  SELECT id INTO others_subcategory_id
  FROM subcategories
  WHERE category_id = others_category_id AND name = 'Others';
  
  -- Create mappings for TD Web
  IF td_web_id IS NOT NULL THEN
    -- Web Development mappings
    FOR subcat IN SELECT id FROM subcategories WHERE category_id = web_dev_category_id
    LOOP
      INSERT INTO ticket_classification_mapping (
        target_business_group_id, category_id, subcategory_id,
        estimated_duration, spoc_user_id, auto_title_template, description
      )
      VALUES (
        td_web_id, web_dev_category_id, subcat.id,
        120, default_spoc_id, '[Web Development] - {{subcategory}}', ''
      )
      ON CONFLICT (target_business_group_id, category_id, subcategory_id) DO NOTHING;
      mapping_count := mapping_count + 1;
    END LOOP;
    
    -- Others mapping (already created in migration 017, but ensure it exists)
    INSERT INTO ticket_classification_mapping (
      target_business_group_id, category_id, subcategory_id,
      estimated_duration, spoc_user_id, auto_title_template, description
    )
    VALUES (
      td_web_id, others_category_id, others_subcategory_id,
      0, default_spoc_id, 'Others', ''
    )
    ON CONFLICT (target_business_group_id, category_id, subcategory_id) DO NOTHING;
  END IF;
  
  -- Create mappings for TD Brand
  IF td_brand_id IS NOT NULL THEN
    -- Brand Management mappings
    FOR subcat IN SELECT id FROM subcategories WHERE category_id = brand_mgmt_category_id
    LOOP
      INSERT INTO ticket_classification_mapping (
        target_business_group_id, category_id, subcategory_id,
        estimated_duration, spoc_user_id, auto_title_template, description
      )
      VALUES (
        td_brand_id, brand_mgmt_category_id, subcat.id,
        180, default_spoc_id, '[Brand Management] - {{subcategory}}', ''
      )
      ON CONFLICT (target_business_group_id, category_id, subcategory_id) DO NOTHING;
      mapping_count := mapping_count + 1;
    END LOOP;
    
    -- Others mapping
    INSERT INTO ticket_classification_mapping (
      target_business_group_id, category_id, subcategory_id,
      estimated_duration, spoc_user_id, auto_title_template, description
    )
    VALUES (
      td_brand_id, others_category_id, others_subcategory_id,
      0, default_spoc_id, 'Others', ''
    )
    ON CONFLICT (target_business_group_id, category_id, subcategory_id) DO NOTHING;
  END IF;
  
  -- Create mappings for TD Integration (WIP)
  IF td_integration_id IS NOT NULL THEN
    -- Integration mappings
    FOR subcat IN SELECT id FROM subcategories WHERE category_id = integration_category_id
    LOOP
      INSERT INTO ticket_classification_mapping (
        target_business_group_id, category_id, subcategory_id,
        estimated_duration, spoc_user_id, auto_title_template, description
      )
      VALUES (
        td_integration_id, integration_category_id, subcat.id,
        240, default_spoc_id, '[Integration] - {{subcategory}}', ''
      )
      ON CONFLICT (target_business_group_id, category_id, subcategory_id) DO NOTHING;
      mapping_count := mapping_count + 1;
    END LOOP;
    
    -- Others mapping
    INSERT INTO ticket_classification_mapping (
      target_business_group_id, category_id, subcategory_id,
      estimated_duration, spoc_user_id, auto_title_template, description
    )
    VALUES (
      td_integration_id, others_category_id, others_subcategory_id,
      0, default_spoc_id, 'Others', ''
    )
    ON CONFLICT (target_business_group_id, category_id, subcategory_id) DO NOTHING;
  END IF;
  
  -- Create mappings for TD IS (WIP)
  IF td_is_id IS NOT NULL THEN
    -- Infrastructure mappings
    FOR subcat IN SELECT id FROM subcategories WHERE category_id = infra_category_id
    LOOP
      INSERT INTO ticket_classification_mapping (
        target_business_group_id, category_id, subcategory_id,
        estimated_duration, spoc_user_id, auto_title_template, description
      )
      VALUES (
        td_is_id, infra_category_id, subcat.id,
        180, default_spoc_id, '[Infrastructure] - {{subcategory}}', ''
      )
      ON CONFLICT (target_business_group_id, category_id, subcategory_id) DO NOTHING;
      mapping_count := mapping_count + 1;
    END LOOP;
    
    -- Others mapping
    INSERT INTO ticket_classification_mapping (
      target_business_group_id, category_id, subcategory_id,
      estimated_duration, spoc_user_id, auto_title_template, description
    )
    VALUES (
      td_is_id, others_category_id, others_subcategory_id,
      0, default_spoc_id, 'Others', ''
    )
    ON CONFLICT (target_business_group_id, category_id, subcategory_id) DO NOTHING;
  END IF;
  
  RAISE NOTICE 'Created % classification mappings for TD groups', mapping_count;
END $$;

-- ============================================================================
-- 6. VERIFY MIGRATION
-- ============================================================================

-- Verify target business groups exist
SELECT 
  id, name, description,
  'Target Business Group' as type
FROM target_business_groups
WHERE name IN ('TD Web', 'TD Brand', 'TD Integration (WIP)', 'TD IS (WIP)')
ORDER BY name;

-- Verify mappings were created
SELECT 
  tbg.name as target_business_group,
  c.name as category,
  s.name as subcategory,
  tcm.estimated_duration,
  u.full_name as spoc_name
FROM ticket_classification_mapping tcm
JOIN target_business_groups tbg ON tcm.target_business_group_id = tbg.id
JOIN categories c ON tcm.category_id = c.id
JOIN subcategories s ON tcm.subcategory_id = s.id
LEFT JOIN users u ON tcm.spoc_user_id = u.id
WHERE tbg.name IN ('TD Web', 'TD Brand', 'TD Integration (WIP)', 'TD IS (WIP)')
ORDER BY tbg.name, c.name, s.name;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

SELECT 'Migration completed successfully!' as status;
SELECT 'TD Web, TD Brand, TD Integration (WIP), and TD IS (WIP) groups initialized' as summary;
