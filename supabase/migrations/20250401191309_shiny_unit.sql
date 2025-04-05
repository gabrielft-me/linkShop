/*
  # Update products table with new fields

  1. Changes
    - Add `item_number` column for product numbering
    - Add `is_visible` column to control catalog visibility
    - Add `tags` column for product labels (Launch, Most Loved, Last Units, Sale)
    - Remove `is_new` column as it's replaced by tags

  2. Data Migration
    - Convert existing `is_new` values to tags
*/

-- Add new columns
ALTER TABLE products
ADD COLUMN item_number TEXT,
ADD COLUMN is_visible BOOLEAN DEFAULT true,
ADD COLUMN tags TEXT[] DEFAULT '{}';

-- Create a function to generate sequential item numbers
CREATE OR REPLACE FUNCTION generate_item_number()
RETURNS TRIGGER AS $$
DECLARE
  store_count INTEGER;
  padded_number TEXT;
BEGIN
  -- Count existing products for this store
  SELECT COUNT(*) + 1 INTO store_count
  FROM products
  WHERE store_id = NEW.store_id;
  
  -- Generate padded number (01, 02, etc)
  padded_number := LPAD(store_count::TEXT, 2, '0');
  
  -- Set the item_number
  NEW.item_number := padded_number;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate item numbers
CREATE TRIGGER set_item_number
BEFORE INSERT ON products
FOR EACH ROW
EXECUTE FUNCTION generate_item_number();

-- Migrate existing is_new data to tags
UPDATE products
SET tags = ARRAY['launch']
WHERE is_new = true;

-- Drop is_new column
ALTER TABLE products DROP COLUMN is_new;