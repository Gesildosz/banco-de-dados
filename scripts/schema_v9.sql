-- Add updated_at column to collaborators table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'collaborators' AND column_name = 'updated_at') THEN
        ALTER TABLE collaborators
        ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
    END IF;
END
$$;

-- Re-create or ensure the trigger for collaborators table
-- This ensures the updated_at column is automatically managed
DROP TRIGGER IF EXISTS set_updated_at ON collaborators;
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON collaborators
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
