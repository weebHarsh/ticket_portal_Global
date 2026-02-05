-- Add hold audit columns to tickets table
ALTER TABLE tickets
ADD COLUMN IF NOT EXISTS hold_by INTEGER REFERENCES users(id),
ADD COLUMN IF NOT EXISTS hold_at TIMESTAMP;

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_tickets_hold_by ON tickets(hold_by);
CREATE INDEX IF NOT EXISTS idx_tickets_hold_at ON tickets(hold_at);
