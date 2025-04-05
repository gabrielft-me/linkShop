/*
  # Add position field to custom buttons

  1. Changes
    - Add position column to custom_buttons table
    - Update existing buttons with sequential positions
    - Add index for better performance
*/

-- Add position column
ALTER TABLE custom_buttons 
  ADD COLUMN IF NOT EXISTS position integer DEFAULT 0;

-- Update existing buttons with sequential positions
WITH numbered_buttons AS (
  SELECT 
    id,
    store_id,
    ROW_NUMBER() OVER (PARTITION BY store_id ORDER BY created_at) as row_num
  FROM custom_buttons
)
UPDATE custom_buttons b
SET position = nb.row_num
FROM numbered_buttons nb
WHERE b.id = nb.id;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_custom_buttons_position ON custom_buttons(store_id, position);