-- Add audit trail fields for ticket closure tracking
ALTER TABLE tickets
ADD COLUMN IF NOT EXISTS closed_by INTEGER REFERENCES users(id),
ADD COLUMN IF NOT EXISTS closed_at TIMESTAMP;

-- Add index for efficient queries
CREATE INDEX IF NOT EXISTS idx_tickets_closed_by ON tickets(closed_by);
CREATE INDEX IF NOT EXISTS idx_tickets_closed_at ON tickets(closed_at);
