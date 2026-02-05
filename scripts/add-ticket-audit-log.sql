-- Create ticket audit log table for tracking all actions on tickets
CREATE TABLE IF NOT EXISTS ticket_audit_log (
  id SERIAL PRIMARY KEY,
  ticket_id INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  action_type VARCHAR(50) NOT NULL,  -- 'status_change', 'assignment_change', 'project_change', 'created', 'comment_added'
  old_value TEXT,                     -- Previous value (e.g., 'open', assignee name)
  new_value TEXT,                     -- New value (e.g., 'hold', new assignee name)
  performed_by INTEGER REFERENCES users(id),
  performed_by_name VARCHAR(255),     -- Store name for display even if user is deleted
  notes TEXT,                         -- Optional notes/reason
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_ticket_audit_log_ticket_id ON ticket_audit_log(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_audit_log_created_at ON ticket_audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_ticket_audit_log_action_type ON ticket_audit_log(action_type);

-- Backfill audit logs for existing tickets based on current data
-- Log ticket creation
INSERT INTO ticket_audit_log (ticket_id, action_type, old_value, new_value, performed_by, performed_by_name, created_at)
SELECT
  t.id,
  'created',
  NULL,
  'Ticket created',
  t.created_by,
  u.full_name,
  t.created_at
FROM tickets t
LEFT JOIN users u ON t.created_by = u.id
WHERE NOT EXISTS (
  SELECT 1 FROM ticket_audit_log al WHERE al.ticket_id = t.id AND al.action_type = 'created'
);

-- Log existing closures
INSERT INTO ticket_audit_log (ticket_id, action_type, old_value, new_value, performed_by, performed_by_name, created_at)
SELECT
  t.id,
  'status_change',
  'open',
  'closed',
  t.closed_by,
  u.full_name,
  COALESCE(t.closed_at, t.updated_at)
FROM tickets t
LEFT JOIN users u ON t.closed_by = u.id
WHERE t.closed_by IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM ticket_audit_log al WHERE al.ticket_id = t.id AND al.action_type = 'status_change' AND al.new_value = 'closed'
);

-- Log existing holds
INSERT INTO ticket_audit_log (ticket_id, action_type, old_value, new_value, performed_by, performed_by_name, created_at)
SELECT
  t.id,
  'status_change',
  'open',
  'hold',
  t.hold_by,
  u.full_name,
  COALESCE(t.hold_at, t.updated_at)
FROM tickets t
LEFT JOIN users u ON t.hold_by = u.id
WHERE t.hold_by IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM ticket_audit_log al WHERE al.ticket_id = t.id AND al.action_type = 'status_change' AND al.new_value = 'hold'
);

-- Log existing assignments
INSERT INTO ticket_audit_log (ticket_id, action_type, old_value, new_value, performed_by, performed_by_name, created_at)
SELECT
  t.id,
  'assignment_change',
  NULL,
  a.full_name,
  t.created_by,
  u.full_name,
  t.updated_at
FROM tickets t
LEFT JOIN users u ON t.created_by = u.id
LEFT JOIN users a ON t.assigned_to = a.id
WHERE t.assigned_to IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM ticket_audit_log al WHERE al.ticket_id = t.id AND al.action_type = 'assignment_change'
);
