CREATE TABLE IF NOT EXISTS info_banners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    image_url TEXT NOT NULL,
    link_url TEXT,
    order_index INTEGER UNIQUE NOT NULL CHECK (order_index >= 1 AND order_index <= 5),
    is_active BOOLEAN DEFAULT TRUE,
    admin_id UUID REFERENCES administrators(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add trigger for updated_at column, reusing the function from schema.sql
-- Ensure the trigger name is consistent with the pattern used in schema.sql
DROP TRIGGER IF EXISTS set_updated_at ON info_banners;
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON info_banners
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
