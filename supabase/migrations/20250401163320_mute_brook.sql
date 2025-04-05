/*
  # Fix RLS Policies for Demo Store Access

  1. Changes
    - Add new policies to allow public access to demo store data
    - Modify existing policies to handle demo store as a special case
    
  2. Security
    - Maintain existing RLS policies for authenticated users
    - Add specific policies for demo store public access
*/

DO $$ BEGIN
  -- Drop existing policies
  DROP POLICY IF EXISTS "Public can view demo store" ON stores;
  DROP POLICY IF EXISTS "Public can view demo categories" ON categories;
  DROP POLICY IF EXISTS "Public can view demo products" ON products;

  -- Create new policies for demo store
  CREATE POLICY "Public can view demo store"
    ON stores
    FOR SELECT
    TO public
    USING (id = '123e4567-e89b-12d3-a456-426614174000'::uuid);

  CREATE POLICY "Public can view demo categories"
    ON categories
    FOR SELECT
    TO public
    USING (store_id = '123e4567-e89b-12d3-a456-426614174000'::uuid);

  CREATE POLICY "Public can view demo products"
    ON products
    FOR SELECT
    TO public
    USING (store_id = '123e4567-e89b-12d3-a456-426614174000'::uuid);

  -- Add policies for demo store management
  CREATE POLICY "Allow demo store management"
    ON stores
    FOR ALL
    TO public
    USING (id = '123e4567-e89b-12d3-a456-426614174000'::uuid)
    WITH CHECK (id = '123e4567-e89b-12d3-a456-426614174000'::uuid);

  CREATE POLICY "Allow demo categories management"
    ON categories
    FOR ALL
    TO public
    USING (store_id = '123e4567-e89b-12d3-a456-426614174000'::uuid)
    WITH CHECK (store_id = '123e4567-e89b-12d3-a456-426614174000'::uuid);

  CREATE POLICY "Allow demo products management"
    ON products
    FOR ALL
    TO public
    USING (store_id = '123e4567-e89b-12d3-a456-426614174000'::uuid)
    WITH CHECK (store_id = '123e4567-e89b-12d3-a456-426614174000'::uuid);
END $$;