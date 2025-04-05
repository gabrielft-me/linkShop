/*
  # Add Category Features and Statistics

  1. Changes
    - Add new columns to categories table for better management
    - Create a function to get category statistics
    - Add necessary permissions and indexes
    
  2. Security
    - Maintain existing RLS policies
    - Use functions instead of materialized views for better security
*/

-- Add new columns to categories table
ALTER TABLE categories 
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS status boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES auth.users(id);

-- Create function to get category statistics
CREATE OR REPLACE FUNCTION get_category_stats(store_id_param uuid)
RETURNS TABLE (
  id uuid,
  name text,
  description text,
  status boolean,
  store_id uuid,
  products_count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    c.description,
    c.status,
    c.store_id,
    COUNT(p.id)::bigint as products_count
  FROM categories c
  LEFT JOIN products p ON c.id = p.category_id
  WHERE c.store_id = store_id_param
  GROUP BY c.id, c.name, c.description, c.status, c.store_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_category_stats TO authenticated, anon;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_categories_store_id ON categories(store_id);

-- Create trigger function to update timestamps
CREATE OR REPLACE FUNCTION update_category_timestamps()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for timestamp updates
DROP TRIGGER IF EXISTS update_category_timestamps ON categories;
CREATE TRIGGER update_category_timestamps
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_category_timestamps();