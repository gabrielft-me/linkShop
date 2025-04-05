/*
  # Update product numbering and visibility

  1. Changes
    - Modify item_number generation to support up to 9999 products
    - Add index on item_number for better performance
    - Update existing products with sequential numbers
*/

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS set_item_number ON products;
DROP FUNCTION IF EXISTS generate_item_number();

-- Create improved function for item number generation
CREATE OR REPLACE FUNCTION generate_item_number()
RETURNS TRIGGER AS $$
DECLARE
  store_count INTEGER;
  padded_number TEXT;
BEGIN
  -- Count existing products for this store
  SELECT COALESCE(MAX(NULLIF(item_number, '')::INTEGER), 0) + 1 INTO store_count
  FROM products
  WHERE store_id = NEW.store_id;
  
  -- Generate padded number (0001, 0002, etc)
  padded_number := LPAD(store_count::TEXT, 4, '0');
  
  -- Set the item_number
  NEW.item_number := padded_number;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create new trigger
CREATE TRIGGER set_item_number
BEFORE INSERT ON products
FOR EACH ROW
EXECUTE FUNCTION generate_item_number();

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_products_item_number ON products(item_number);

-- Update existing products with sequential numbers
WITH numbered_products AS (
  SELECT 
    id,
    store_id,
    ROW_NUMBER() OVER (PARTITION BY store_id ORDER BY created_at) as row_num
  FROM products
  WHERE item_number IS NULL OR item_number = ''
)
UPDATE products p
SET item_number = LPAD(np.row_num::TEXT, 4, '0')
FROM numbered_products np
WHERE p.id = np.id;