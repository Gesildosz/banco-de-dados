-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL, -- Can be collaborator_id or admin_id
    user_type VARCHAR(50) NOT NULL, -- 'collaborator' or 'admin'
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    type VARCHAR(100), -- e.g., 'leave_request_status', 'access_code_reset_status', 'announcement'
    related_id UUID -- Optional: ID of the related entity (e.g., leave_request_id)
);

-- Add trigger for updated_at column (if not already present for this table)
DROP TRIGGER IF EXISTS set_updated_at ON notifications;
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON notifications
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
