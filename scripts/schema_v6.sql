-- Create time_bank_periods table
CREATE TABLE IF NOT EXISTS time_bank_periods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    admin_id UUID REFERENCES administrators(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add trigger for updated_at column
DROP TRIGGER IF EXISTS set_updated_at ON time_bank_periods;
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON time_bank_periods
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
