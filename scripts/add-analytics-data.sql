-- Add more tickets for comprehensive analytics
-- This script adds 50 additional tickets with varied dates, statuses, and assignments

-- First, get the IDs we'll need to reference
DO $$
DECLARE
  v_user_ids INTEGER[];
  v_category_ids INTEGER[];
  v_subcategory_ids INTEGER[];
  v_bu_ids INTEGER[];
  i INTEGER;
  random_user INTEGER;
  random_category INTEGER;
  random_subcategory INTEGER;
  random_bu INTEGER;
  random_priority TEXT;
  random_status TEXT;
  random_type TEXT;
  random_days INTEGER;
  ticket_date TIMESTAMP;
  resolve_date TIMESTAMP;
BEGIN
  -- Get all user IDs
  SELECT ARRAY_AGG(id) INTO v_user_ids FROM users;

  -- Get all category IDs
  SELECT ARRAY_AGG(id) INTO v_category_ids FROM categories;

  -- Get all subcategory IDs
  SELECT ARRAY_AGG(id) INTO v_subcategory_ids FROM subcategories;

  -- Get all business unit IDs
  SELECT ARRAY_AGG(id) INTO v_bu_ids FROM business_unit_groups;

  -- Insert 50 tickets with varied data
  FOR i IN 1..50 LOOP
    -- Random selections
    random_user := v_user_ids[1 + floor(random() * array_length(v_user_ids, 1))];
    random_category := v_category_ids[1 + floor(random() * array_length(v_category_ids, 1))];
    random_subcategory := v_subcategory_ids[1 + floor(random() * array_length(v_subcategory_ids, 1))];
    random_bu := v_bu_ids[1 + floor(random() * array_length(v_bu_ids, 1))];

    -- Random priority
    random_priority := (ARRAY['low', 'medium', 'high', 'critical'])[1 + floor(random() * 4)];

    -- Random status (60% closed, 25% open, 15% hold)
    IF random() < 0.6 THEN
      random_status := 'closed';
    ELSIF random() < 0.85 THEN
      random_status := 'open';
    ELSE
      random_status := 'hold';
    END IF;

    -- Random type
    random_type := (ARRAY['incident', 'request', 'problem', 'change'])[1 + floor(random() * 4)];

    -- Random date in the past 90 days
    random_days := floor(random() * 90);
    ticket_date := CURRENT_TIMESTAMP - (random_days || ' days')::INTERVAL;

    -- If closed, set resolved_at to 1-5 days after creation
    IF random_status = 'closed' THEN
      resolve_date := ticket_date + (1 + floor(random() * 5) || ' days')::INTERVAL;
    ELSE
      resolve_date := NULL;
    END IF;

    -- Insert ticket
    INSERT INTO tickets (
      ticket_id,
      title,
      description,
      status,
      priority,
      ticket_type,
      category_id,
      subcategory_id,
      business_unit_group_id,
      created_by,
      assigned_to,
      created_at,
      resolved_at
    ) VALUES (
      'TKT-' || LPAD((20 + i)::TEXT, 6, '0'),
      CASE
        WHEN i % 5 = 0 THEN 'Database Performance Issue'
        WHEN i % 5 = 1 THEN 'User Access Request'
        WHEN i % 5 = 2 THEN 'System Error in Production'
        WHEN i % 5 = 3 THEN 'Feature Enhancement Request'
        ELSE 'General Support Query'
      END || ' #' || i,
      'Detailed description for ticket ' || i || '. This ticket requires attention from the ' || random_type || ' team.',
      random_status,
      random_priority,
      random_type,
      random_category,
      random_subcategory,
      random_bu,
      random_user,
      random_user,
      ticket_date,
      resolve_date
    );
  END LOOP;

  RAISE NOTICE '✓ Added 50 analytics tickets with varied dates and statuses';
END $$;

-- Verify the data
DO $$
DECLARE
  total_count INTEGER;
  open_count INTEGER;
  closed_count INTEGER;
  hold_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_count FROM tickets;
  SELECT COUNT(*) INTO open_count FROM tickets WHERE status = 'open';
  SELECT COUNT(*) INTO closed_count FROM tickets WHERE status = 'closed';
  SELECT COUNT(*) INTO hold_count FROM tickets WHERE status = 'hold';

  RAISE NOTICE '========================================';
  RAISE NOTICE 'Analytics Data Summary:';
  RAISE NOTICE '  Total Tickets: %', total_count;
  RAISE NOTICE '  Open: %', open_count;
  RAISE NOTICE '  Closed: %', closed_count;
  RAISE NOTICE '  On Hold: %', hold_count;
  RAISE NOTICE '========================================';
END $$;
