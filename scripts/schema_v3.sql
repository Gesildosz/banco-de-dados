-- Create announcements table
CREATE TABLE IF NOT EXISTS announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content TEXT NOT NULL,
    admin_id UUID REFERENCES administrators(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add trigger for updated_at column
DROP TRIGGER IF EXISTS set_updated_at ON announcements;
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON announcements
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
