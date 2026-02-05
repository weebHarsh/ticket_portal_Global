-- Insert sample Business Unit Groups
INSERT INTO business_unit_groups (name, description) VALUES
  ('IT Operations', 'Information Technology Operations'),
  ('Customer Support', 'Customer Service and Support'),
  ('HR', 'Human Resources'),
  ('Finance', 'Finance and Accounting'),
  ('Sales', 'Sales Department')
ON CONFLICT (name) DO NOTHING;

-- Insert sample Categories
INSERT INTO categories (name, description) VALUES
  ('Technical Issue', 'Technical problems and bugs'),
  ('Feature Request', 'New feature requests'),
  ('Access Request', 'Access and permission requests'),
  ('Data Issue', 'Data-related problems'),
  ('General Inquiry', 'General questions and inquiries')
ON CONFLICT (name) DO NOTHING;

-- Insert sample Subcategories
INSERT INTO subcategories (category_id, name, description) VALUES
  ((SELECT id FROM categories WHERE name = 'Technical Issue'), 'AWS Infrastructure', 'AWS related issues'),
  ((SELECT id FROM categories WHERE name = 'Technical Issue'), 'Database', 'Database connectivity and performance'),
  ((SELECT id FROM categories WHERE name = 'Technical Issue'), 'Application Error', 'Application bugs and errors'),
  ((SELECT id FROM categories WHERE name = 'Feature Request'), 'UI Enhancement', 'User interface improvements'),
  ((SELECT id FROM categories WHERE name = 'Feature Request'), 'New Integration', 'Integration with external systems'),
  ((SELECT id FROM categories WHERE name = 'Access Request'), 'System Access', 'Access to systems and applications'),
  ((SELECT id FROM categories WHERE name = 'Access Request'), 'Data Access', 'Access to specific data'),
  ((SELECT id FROM categories WHERE name = 'Data Issue'), 'Data Correction', 'Incorrect data needs correction'),
  ((SELECT id FROM categories WHERE name = 'Data Issue'), 'Data Migration', 'Data migration requests'),
  ((SELECT id FROM categories WHERE name = 'General Inquiry'), 'How-To', 'How to use features'),
  ((SELECT id FROM categories WHERE name = 'General Inquiry'), 'Documentation', 'Documentation requests')
ON CONFLICT (category_id, name) DO NOTHING;

-- Insert sample Teams
INSERT INTO teams (name, description) VALUES
  ('Infrastructure Team', 'Manages infrastructure and DevOps'),
  ('Development Team', 'Application development team'),
  ('Support Team', 'Customer support team'),
  ('Data Team', 'Data engineering and analytics')
ON CONFLICT (name) DO NOTHING;

-- Insert sample Ticket Classification Mappings
INSERT INTO ticket_classification_mapping 
  (business_unit_group_id, category_id, subcategory_id, estimated_duration, spoc_user_id, auto_title_template) 
VALUES
  (
    (SELECT id FROM business_unit_groups WHERE name = 'IT Operations'),
    (SELECT id FROM categories WHERE name = 'Technical Issue'),
    (SELECT id FROM subcategories WHERE name = 'AWS Infrastructure'),
    120,
    (SELECT id FROM users LIMIT 1),
    '[AWS Infrastructure] - Technical Issue'
  ),
  (
    (SELECT id FROM business_unit_groups WHERE name = 'IT Operations'),
    (SELECT id FROM categories WHERE name = 'Technical Issue'),
    (SELECT id FROM subcategories WHERE name = 'Database'),
    90,
    (SELECT id FROM users LIMIT 1),
    '[Database] - Technical Issue'
  ),
  (
    (SELECT id FROM business_unit_groups WHERE name = 'Customer Support'),
    (SELECT id FROM categories WHERE name = 'Feature Request'),
    (SELECT id FROM subcategories WHERE name = 'UI Enhancement'),
    180,
    (SELECT id FROM users LIMIT 1),
    '[UI Enhancement] - Feature Request'
  )
ON CONFLICT (business_unit_group_id, category_id, subcategory_id) DO NOTHING;
