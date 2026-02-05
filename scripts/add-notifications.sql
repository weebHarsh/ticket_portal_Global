-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'info', -- info, success, warning, error
  is_read BOOLEAN DEFAULT FALSE,
  related_ticket_id INTEGER REFERENCES tickets(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- Insert sample notifications for all users
INSERT INTO notifications (user_id, title, message, type, is_read, related_ticket_id)
SELECT
  u.id,
  'New ticket assigned to you',
  'Ticket #' || t.ticket_id || ': ' || t.title,
  'info',
  FALSE,
  t.id
FROM users u
CROSS JOIN LATERAL (
  SELECT id, ticket_id, title
  FROM tickets
  WHERE assigned_to = u.id
  LIMIT 2
) t;

-- Add some general notifications
INSERT INTO notifications (user_id, title, message, type, is_read)
SELECT id, 'Welcome to Ticketing Portal', 'Your account has been successfully created. Start by creating your first ticket!', 'success', TRUE
FROM users
LIMIT 5;

INSERT INTO notifications (user_id, title, message, type, is_read)
SELECT id, 'System Maintenance Scheduled', 'Planned maintenance window: This weekend from 2 AM - 4 AM', 'warning', FALSE
FROM users
WHERE role IN ('Admin', 'Manager')
LIMIT 3;
