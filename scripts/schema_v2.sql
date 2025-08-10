-- Add balance_hours to collaborators table
ALTER TABLE collaborators
ADD COLUMN balance_hours DECIMAL(10, 2) DEFAULT 0.00;

-- Create a function to calculate total positive and negative hours
CREATE OR REPLACE FUNCTION get_total_positive_negative_hours()
RETURNS TABLE(total_positive_hours DECIMAL(10, 2), total_negative_hours DECIMAL(10, 2)) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COALESCE(SUM(CASE WHEN balance_hours > 0 THEN balance_hours ELSE 0 END), 0)::DECIMAL(10, 2) AS total_positive_hours,
        COALESCE(SUM(CASE WHEN balance_hours < 0 THEN balance_hours ELSE 0 END), 0)::DECIMAL(10, 2) AS total_negative_hours
    FROM collaborators;
END;
$$ LANGUAGE plpgsql;
