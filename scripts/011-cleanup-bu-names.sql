-- Clean up Business Unit Group names - remove bracketed text
-- Remove "(Brand Monitoring)" and "(Tech Delivery)" from names

UPDATE business_unit_groups
SET name = 'CS BM'
WHERE name LIKE 'CS BM%';

UPDATE business_unit_groups
SET name = 'TD North'
WHERE name LIKE 'TD North%';

UPDATE business_unit_groups
SET name = 'TD South'
WHERE name LIKE 'TD South%';

UPDATE business_unit_groups
SET name = 'TD Others'
WHERE name LIKE 'TD Others%';

-- Verify the changes
SELECT id, name, description FROM business_unit_groups ORDER BY name;
