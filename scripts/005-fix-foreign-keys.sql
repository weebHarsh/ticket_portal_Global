-- Fix foreign key constraint on tickets table to cascade delete when subcategory is deleted
-- This allows deletion of subcategories without foreign key constraint violations

-- Drop the existing foreign key constraint if it exists
ALTER TABLE tickets
DROP CONSTRAINT IF EXISTS tickets_subcategory_id_fkey;

-- Add the new constraint with ON DELETE CASCADE
ALTER TABLE tickets
ADD CONSTRAINT tickets_subcategory_id_fkey
FOREIGN KEY (subcategory_id) REFERENCES subcategories(id) ON DELETE CASCADE;

-- Also ensure category_id has cascading delete
ALTER TABLE tickets
DROP CONSTRAINT IF EXISTS tickets_category_id_fkey;

ALTER TABLE tickets
ADD CONSTRAINT tickets_category_id_fkey
FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE;

-- And business_unit_group_id
ALTER TABLE tickets
DROP CONSTRAINT IF EXISTS tickets_business_unit_group_id_fkey;

ALTER TABLE tickets
ADD CONSTRAINT tickets_business_unit_group_id_fkey
FOREIGN KEY (business_unit_group_id) REFERENCES business_unit_groups(id) ON DELETE CASCADE;
