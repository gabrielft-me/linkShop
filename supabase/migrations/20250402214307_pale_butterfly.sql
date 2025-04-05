/*
  # Update item number format

  1. Changes
    - Modify item_number generation to use 2 digits instead of 4
    - Update existing products with new format
    - Keep index for performance
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
  
  -- Generate padded number (01, 02, etc)
  padded_number := LPAD(store_count::TEXT, 2, '0');
  
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
SET item_number = LPAD(np.row_num::TEXT, 2, '0')
FROM numbered_products np
WHERE p.id = np.id;