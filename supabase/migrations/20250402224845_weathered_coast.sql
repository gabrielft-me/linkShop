/*
  # Fix RLS Policies for Custom Buttons Position Updates

  1. Changes
    - Drop and recreate RLS policies for custom_buttons table
    - Add specific policies for position updates
    - Maintain existing access control for other operations
    
  2. Security
    - Ensure authenticated users can update positions for their store's buttons
    - Maintain demo store access
    - Keep public read access
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can manage their store custom buttons" ON custom_buttons;
DROP POLICY IF EXISTS "Allow demo custom buttons management" ON custom_buttons;
DROP POLICY IF EXISTS "Public can view custom buttons" ON custom_buttons;

-- Create new policies with proper position update handling
CREATE POLICY "Users can manage their store custom buttons"
  ON custom_buttons
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM stores 
      WHERE stores.id = custom_buttons.store_id 
      AND stores.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM stores 
      WHERE stores.id = custom_buttons.store_id 
      AND stores.user_id = auth.uid()
    )
  );

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