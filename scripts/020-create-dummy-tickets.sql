-- Migration script: Create Dummy Ticket Data
-- This script generates comprehensive dummy ticket data for testing

-- ============================================================================
-- 1. GET EXISTING DATA FOR REFERENCE
-- ============================================================================

DO $$
DECLARE
  -- User IDs
  v_user_ids INTEGER[];
  v_admin_id INTEGER;
  v_agent_id INTEGER;
  v_user_id INTEGER;
  
  -- Target Business Group IDs
  v_tbg_ids INTEGER[];
  v_tbg_id INTEGER;
  
  -- Category and Subcategory IDs
  v_category_ids INTEGER[];
  v_subcategory_ids INTEGER[];
  v_category_id INTEGER;
  v_subcategory_id INTEGER;
  
  -- Project IDs
  v_project_ids INTEGER[];
  v_project_id INTEGER;
  
  -- SPOC IDs
  v_spoc_ids INTEGER[];
  v_spoc_id INTEGER;
  
  -- Ticket variables
  v_ticket_id VARCHAR(50);
  v_ticket_number INTEGER;
  v_title TEXT;
  v_description TEXT;
  v_status VARCHAR(50);
  v_priority VARCHAR(50);
  v_ticket_type VARCHAR(50);
  v_is_internal BOOLEAN;
  v_created_at TIMESTAMP;
  v_resolved_at TIMESTAMP;
  v_closed_at TIMESTAMP;
  v_estimated_duration TEXT;
  v_days_ago INTEGER;
  v_resolve_days INTEGER;
  v_close_days INTEGER;
  
  -- Counter
  i INTEGER;
BEGIN
  -- Get user IDs (at least 3 users needed)
  SELECT ARRAY_AGG(id) INTO v_user_ids FROM users LIMIT 10;
  SELECT id INTO v_admin_id FROM users WHERE role = 'admin' LIMIT 1;
  SELECT id INTO v_agent_id FROM users WHERE role = 'agent' LIMIT 1;
  SELECT id INTO v_user_id FROM users WHERE role = 'user' LIMIT 1;
  
  -- Get Target Business Group IDs
  SELECT ARRAY_AGG(id) INTO v_tbg_ids FROM target_business_groups LIMIT 10;
  
  -- Get Category IDs
  SELECT ARRAY_AGG(id) INTO v_category_ids FROM categories LIMIT 10;
  
  -- Get Subcategory IDs
  SELECT ARRAY_AGG(id) INTO v_subcategory_ids FROM subcategories LIMIT 10;
  
  -- Get Project IDs
  SELECT ARRAY_AGG(id) INTO v_project_ids FROM projects LIMIT 10;
  
  -- Get SPOC IDs (users who can be SPOCs)
  SELECT ARRAY_AGG(id) INTO v_spoc_ids FROM users WHERE role IN ('admin', 'agent') LIMIT 5;
  
  -- If no SPOCs found, use admin
  IF v_spoc_ids IS NULL OR array_length(v_spoc_ids, 1) = 0 THEN
    v_spoc_ids := ARRAY[v_admin_id];
  END IF;
  
  -- Get current max ticket number
  SELECT COALESCE(MAX(ticket_number), 0) INTO v_ticket_number FROM tickets;
  
  -- ============================================================================
  -- 2. CREATE 50 DUMMY TICKETS
  -- ============================================================================
  
  FOR i IN 1..50 LOOP
    -- Increment ticket number
    v_ticket_number := v_ticket_number + 1;
    
    -- Generate ticket ID
    v_ticket_id := 'TKT-' || TO_CHAR(CURRENT_DATE, 'YYYYMM') || '-' || LPAD(v_ticket_number::TEXT, 5, '0');
    
    -- Random selections
    v_user_id := v_user_ids[1 + floor(random() * array_length(v_user_ids, 1))];
    v_tbg_id := v_tbg_ids[1 + floor(random() * array_length(v_tbg_ids, 1))];
    v_category_id := v_category_ids[1 + floor(random() * array_length(v_category_ids, 1))];
    v_subcategory_id := v_subcategory_ids[1 + floor(random() * array_length(v_subcategory_ids, 1))];
    v_spoc_id := v_spoc_ids[1 + floor(random() * array_length(v_spoc_ids, 1))];
    
    -- Random project (30% chance)
    IF random() < 0.3 AND v_project_ids IS NOT NULL AND array_length(v_project_ids, 1) > 0 THEN
      v_project_id := v_project_ids[1 + floor(random() * array_length(v_project_ids, 1))];
    ELSE
      v_project_id := NULL;
    END IF;
    
    -- Random priority
    v_priority := (ARRAY['low', 'medium', 'high', 'urgent'])[1 + floor(random() * 4)];
    
    -- Random ticket type
    IF random() < 0.7 THEN
      v_ticket_type := 'support';
    ELSE
      v_ticket_type := 'requirement';
    END IF;
    
    -- Random internal vs customer (20% internal)
    v_is_internal := random() < 0.2;
    
    -- Random status distribution:
    -- 30% open, 20% on-hold, 25% resolved, 20% closed, 5% returned
    v_status := CASE
      WHEN random() < 0.30 THEN 'open'
      WHEN random() < 0.50 THEN 'on-hold'
      WHEN random() < 0.75 THEN 'resolved'
      WHEN random() < 0.95 THEN 'closed'
      ELSE 'returned'
    END;
    
    -- Random creation date (past 90 days)
    v_days_ago := floor(random() * 90);
    v_created_at := CURRENT_TIMESTAMP - (v_days_ago || ' days')::INTERVAL;
    
    -- Set resolved/closed dates based on status
    v_resolved_at := NULL;
    v_closed_at := NULL;
    
    IF v_status IN ('resolved', 'closed') THEN
      v_resolve_days := floor(random() * (v_days_ago - 1)) + 1;
      v_resolved_at := v_created_at + (v_resolve_days || ' days')::INTERVAL;
      
      IF v_status = 'closed' THEN
        v_close_days := floor(random() * 3) + 1;
        v_closed_at := v_resolved_at + (v_close_days || ' days')::INTERVAL;
      END IF;
    END IF;
    
    -- Generate realistic titles and descriptions
    IF v_ticket_type = 'support' THEN
      v_title := CASE floor(random() * 10)
        WHEN 0 THEN 'Application not responding'
        WHEN 1 THEN 'Unable to access shared drive'
        WHEN 2 THEN 'Email synchronization issue'
        WHEN 3 THEN 'VPN connection timeout'
        WHEN 4 THEN 'Printer not printing'
        WHEN 5 THEN 'Laptop screen flickering'
        WHEN 6 THEN 'Software installation failed'
        WHEN 7 THEN 'Password reset required'
        WHEN 8 THEN 'Network connectivity problem'
        ELSE 'System performance degradation'
      END;
      
      v_description := 'User reported: ' || v_title || '. This issue started occurring ' || 
        CASE floor(random() * 3)
          WHEN 0 THEN 'yesterday'
          WHEN 1 THEN 'a few days ago'
          ELSE 'recently'
        END || '. ' ||
        CASE floor(random() * 3)
          WHEN 0 THEN 'Impact: High - blocking daily work.'
          WHEN 1 THEN 'Impact: Medium - workaround available.'
          ELSE 'Impact: Low - minor inconvenience.'
        END;
    ELSE
      v_title := CASE floor(random() * 10)
        WHEN 0 THEN 'New feature: User dashboard enhancement'
        WHEN 1 THEN 'Enhancement: Add export functionality'
        WHEN 2 THEN 'Feature request: Mobile app support'
        WHEN 3 THEN 'Improvement: Performance optimization'
        WHEN 4 THEN 'New module: Reporting system'
        WHEN 5 THEN 'Enhancement: Notification system'
        WHEN 6 THEN 'Feature: Integration with third-party API'
        WHEN 7 THEN 'Improvement: UI/UX redesign'
        WHEN 8 THEN 'New feature: Analytics dashboard'
        ELSE 'Enhancement: Search functionality'
      END;
      
      v_description := 'Requirement details: ' || v_title || '. ' ||
        'Business justification: This feature will improve user experience and productivity. ' ||
        'Expected benefits: ' ||
        CASE floor(random() * 3)
          WHEN 0 THEN 'Reduced processing time by 30%'
          WHEN 1 THEN 'Improved user satisfaction'
          ELSE 'Increased system efficiency'
        END || '.';
    END IF;
    
    -- Random estimated duration
    v_estimated_duration := CASE floor(random() * 5)
      WHEN 0 THEN '30 min'
      WHEN 1 THEN '1 hr'
      WHEN 2 THEN '2 hr'
      WHEN 3 THEN '4 hr'
      ELSE '1 day'
    END;
    
    -- Insert ticket
    INSERT INTO tickets (
      ticket_id,
      ticket_number,
      title,
      description,
      ticket_type,
      status,
      priority,
      category_id,
      subcategory_id,
      target_business_group_id,
      spoc_user_id,
      project_id,
      created_by,
      assigned_to,
      estimated_duration,
      is_internal,
      created_at,
      resolved_at,
      closed_at,
      updated_at
    ) VALUES (
      v_ticket_id,
      v_ticket_number,
      v_title,
      v_description,
      v_ticket_type,
      v_status,
      v_priority,
      v_category_id,
      v_subcategory_id,
      v_tbg_id,
      v_spoc_id,
      v_project_id,
      v_user_id,
      CASE WHEN random() < 0.6 THEN v_spoc_id ELSE NULL END, -- 60% assigned
      v_estimated_duration,
      v_is_internal,
      v_created_at,
      v_resolved_at,
      v_closed_at,
      COALESCE(v_closed_at, v_resolved_at, v_created_at)
    );
    
    -- Create audit log entries for status changes
    IF v_status IN ('resolved', 'closed') THEN
      INSERT INTO ticket_audit_log (
        ticket_id,
        action_type,
        old_value,
        new_value,
        performed_by,
        performed_by_name,
        notes,
        created_at
      ) VALUES (
        (SELECT id FROM tickets WHERE ticket_id = v_ticket_id),
        'status_change',
        'open',
        'resolved',
        v_spoc_id,
        (SELECT full_name FROM users WHERE id = v_spoc_id),
        'Ticket resolved successfully',
        v_resolved_at
      );
      
      IF v_status = 'closed' THEN
        INSERT INTO ticket_audit_log (
          ticket_id,
          action_type,
          old_value,
          new_value,
          performed_by,
          performed_by_name,
          notes,
          created_at
        ) VALUES (
          (SELECT id FROM tickets WHERE ticket_id = v_ticket_id),
          'status_change',
          'resolved',
          'closed',
          v_user_id,
          (SELECT full_name FROM users WHERE id = v_user_id),
          'Ticket closed by initiator',
          v_closed_at
        );
      END IF;
    END IF;
    
    -- Create initial "created" audit log
    INSERT INTO ticket_audit_log (
      ticket_id,
      action_type,
      old_value,
      new_value,
      performed_by,
      performed_by_name,
      notes,
      created_at
    ) VALUES (
      (SELECT id FROM tickets WHERE ticket_id = v_ticket_id),
      'created',
      NULL,
      'Ticket created',
      v_user_id,
      (SELECT full_name FROM users WHERE id = v_user_id),
      NULL,
      v_created_at
    );
    
    -- Create some comments (30% chance, 1-3 comments per ticket)
    IF random() < 0.3 THEN
      FOR j IN 1..(1 + floor(random() * 3)) LOOP
        INSERT INTO comments (
          ticket_id,
          user_id,
          content,
          created_at
        ) VALUES (
          (SELECT id FROM tickets WHERE ticket_id = v_ticket_id),
          v_user_ids[1 + floor(random() * array_length(v_user_ids, 1))],
          CASE floor(random() * 5)
            WHEN 0 THEN 'Following up on this issue. Any updates?'
            WHEN 1 THEN 'Thanks for the quick response!'
            WHEN 2 THEN 'This is still occurring. Can you check again?'
            WHEN 3 THEN 'The workaround is working for now.'
            ELSE 'Please let me know if you need more information.'
          END,
          v_created_at + (j || ' hours')::INTERVAL
        );
      END LOOP;
    END IF;
    
  END LOOP;
  
  RAISE NOTICE 'Created 50 dummy tickets successfully!';
  
END $$;

-- ============================================================================
-- 3. VERIFY CREATED TICKETS
-- ============================================================================

SELECT 
  COUNT(*) as total_tickets,
  COUNT(CASE WHEN status = 'open' THEN 1 END) as open_tickets,
  COUNT(CASE WHEN status = 'on-hold' THEN 1 END) as on_hold_tickets,
  COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved_tickets,
  COUNT(CASE WHEN status = 'closed' THEN 1 END) as closed_tickets,
  COUNT(CASE WHEN ticket_type = 'support' THEN 1 END) as support_tickets,
  COUNT(CASE WHEN ticket_type = 'requirement' THEN 1 END) as requirement_tickets,
  COUNT(CASE WHEN is_internal = true THEN 1 END) as internal_tickets
FROM tickets
WHERE ticket_id LIKE 'TKT-' || TO_CHAR(CURRENT_DATE, 'YYYYMM') || '%';
