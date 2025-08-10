-- Create leave_requests table
CREATE TABLE IF NOT EXISTS leave_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    collaborator_id UUID NOT NULL REFERENCES collaborators(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add trigger for updated_at column
DROP TRIGGER IF EXISTS set_updated_at ON leave_requests;
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON leave_requests
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
