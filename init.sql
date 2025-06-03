-- Ticketsystem Database Schema
-- Für lokale PostgreSQL Installation

-- Tickets Tabelle
CREATE TABLE IF NOT EXISTS tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    contact TEXT NOT NULL,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('open', 'in_progress', 'completed')),
    priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
    assigned_users TEXT[] DEFAULT '{}',
    files JSONB DEFAULT '[]',
    history JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index für bessere Performance
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON tickets(priority);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned_users ON tickets USING GIN(assigned_users);

-- Trigger für automatische updated_at Aktualisierung
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tickets_updated_at 
    BEFORE UPDATE ON tickets 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Test-Daten (optional)
INSERT INTO tickets (subject, description, contact, date, status, priority, assigned_users) 
VALUES 
    ('Testticket 1', 'Dies ist ein Testticket', 'test@example.com', NOW(), 'open', 'medium', '{"nico"}'),
    ('Testticket 2', 'Ein weiteres Testticket', 'test2@example.com', NOW(), 'in_progress', 'high', '{"finnja"}')
ON CONFLICT DO NOTHING; 