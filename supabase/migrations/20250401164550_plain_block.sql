/*
  # Add Custom Buttons and Store Image

  1. Changes
    - Add image_url column to stores table
    - Create custom_buttons table for personalized WhatsApp messages
    - Add RLS policies for custom_buttons
    
  2. Security
    - Enable RLS on custom_buttons table
    - Add policies for authenticated users and demo store
*/

-- Add image_url to stores table
ALTER TABLE stores ADD COLUMN IF NOT EXISTS image_url text;

-- Create custom_buttons table
CREATE TABLE IF NOT EXISTS custom_buttons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES stores(id) ON DELETE CASCADE,
  label text NOT NULL,
  message text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE custom_buttons ENABLE ROW LEVEL SECURITY;

-- Policies for custom_buttons
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