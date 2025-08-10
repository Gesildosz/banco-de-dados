CREATE TABLE IF NOT EXISTS administrators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(255) NOT NULL,
    username VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    can_create_collaborator BOOLEAN DEFAULT FALSE,
    can_create_admin BOOLEAN DEFAULT FALSE,
    can_enter_hours BOOLEAN DEFAULT FALSE,
    can_change_access_code BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS collaborators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(255) NOT NULL,
    badge_number VARCHAR(255) UNIQUE NOT NULL,
    access_code VARCHAR(255) UNIQUE NOT NULL,
    direct_leader VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS time_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    collaborator_id UUID NOT NULL REFERENCES collaborators(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    hours_worked DECIMAL(5, 2) NOT NULL,
    overtime_hours DECIMAL(5, 2) DEFAULT 0.00,
    balance_hours DECIMAL(5, 2) DEFAULT 0.00,
    entry_type VARCHAR(50) NOT NULL, -- e.g., 'normal', 'overtime', 'adjustment'
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster lookups on collaborator_id and date
CREATE INDEX IF NOT EXISTS idx_time_entries_collaborator_id_date ON time_entries(collaborator_id, date);

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for administrators table
DROP TRIGGER IF EXISTS set_updated_at ON administrators;
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON administrators
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trigger for collaborators table
DROP TRIGGER IF EXISTS set_updated_at ON collaborators;
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON collaborators
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trigger for time_entries table
DROP TRIGGER IF EXISTS set_updated_at ON time_entries;
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON time_entries
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
