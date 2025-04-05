/*
  # Add Store Features

  1. Changes
    - Add coupon support to stores
    - Add product features (original price, discount, new flag)
    - Add button styling options
    - Add store description
    
  2. Security
    - Maintain existing RLS policies
*/

-- Add new columns to stores table
ALTER TABLE stores 
  ADD COLUMN IF NOT EXISTS coupon_code text,
  ADD COLUMN IF NOT EXISTS coupon_discount numeric(5,2),
  ADD COLUMN IF NOT EXISTS description text;

-- Add new columns to products table
ALTER TABLE products 
  ADD COLUMN IF NOT EXISTS original_price numeric(10,2),
  ADD COLUMN IF NOT EXISTS is_new boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS discount_percentage numeric(5,2);

-- Add styling columns to custom_buttons table
ALTER TABLE custom_buttons 
  ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'whatsapp',
  ADD COLUMN IF NOT EXISTS icon text,
  ADD COLUMN IF NOT EXISTS color text;

-- Create function to calculate discount percentage
CREATE OR REPLACE FUNCTION calculate_discount_percentage()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.original_price IS NOT NULL AND NEW.original_price > 0 THEN
    NEW.discount_percentage := ROUND((1 - NEW.price / NEW.original_price) * 100, 2);
  ELSE
    NEW.discount_percentage := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-calculate discount percentage
DROP TRIGGER IF EXISTS calculate_product_discount ON products;
CREATE TRIGGER calculate_product_discount
  BEFORE INSERT OR UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION calculate_discount_percentage();