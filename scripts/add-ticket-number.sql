-- Add global sequential ticket number column
ALTER TABLE tickets
ADD COLUMN IF NOT EXISTS ticket_number INTEGER;

-- Populate existing tickets with sequential numbers based on creation order
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC, id ASC) as rn
  FROM tickets
)
UPDATE tickets t
SET ticket_number = n.rn
FROM numbered n
WHERE t.id = n.id AND t.ticket_number IS NULL;

-- Create unique index on ticket_number
CREATE UNIQUE INDEX IF NOT EXISTS idx_tickets_ticket_number ON tickets(ticket_number);
