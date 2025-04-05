/*
  # Fix Custom Buttons Policies

  1. Changes
    - Add safety checks before creating policies
    - Ensure idempotent policy creation
    
  2. Security
    - Maintain existing RLS policies
    - Add specific policies for demo store access
*/

DO $$ 
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Users can manage their store custom buttons" ON custom_buttons;
  DROP POLICY IF EXISTS "Allow demo custom buttons management" ON custom_buttons;
  DROP POLICY IF EXISTS "Public can view custom buttons" ON custom_buttons;

  -- Create new policies
  CREATE POLICY "Users can manage their store custom buttons"
    ON custom_buttons
    FOR ALL
    TO authenticated
    USING (EXISTS (
      SELECT 1 FROM stores 
      WHERE stores.id = custom_buttons.store_id 
      AND stores.user_id = auth.uid()
    ));

  CREATE POLICY "Allow demo custom buttons management"
    ON custom_buttons
    FOR ALL
    TO public
    USING (store_id = '123e4567-e89b-12d3-a456-426614174000'::uuid)
    WITH CHECK (store_id = '123e4567-e89b-12d3-a456-426614174000'::uuid);

  CREATE POLICY "Public can view custom buttons"
    ON custom_buttons
    FOR SELECT
    TO public
    USING (true);
END $$;