/*
  # Add currency symbol to stores

  1. Changes
    - Add currency_symbol column to stores table
    - Set default value to 'R$'
*/

ALTER TABLE stores 
  ADD COLUMN IF NOT EXISTS currency_symbol text DEFAULT 'R$';