-- Fix TD Other to TD Others
UPDATE business_unit_groups
SET name = 'TD Others'
WHERE name = 'TD Other';

-- Verify
SELECT id, name, description FROM business_unit_groups WHERE name LIKE 'TD%' ORDER BY name;
