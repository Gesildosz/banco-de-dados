-- Create access_code_reset_requests table
CREATE TABLE IF NOT EXISTS access_code_reset_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    collaborator_id UUID NOT NULL REFERENCES collaborators(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP WITH TIME ZONE,
    admin_id UUID REFERENCES administrators(id) ON DELETE SET NULL,
    notes TEXT
);

-- Add trigger for updated_at column (if not already present for this table)
-- Note: This trigger name is generic, ensure it's unique or apply to specific tables
-- For simplicity, assuming update_updated_at_column() function exists from schema.sql
DROP TRIGGER IF EXISTS set_updated_at ON access_code_reset_requests;
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON access_code_reset_requests
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
