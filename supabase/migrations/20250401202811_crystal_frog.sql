/*
  # Add attention headline to stores

  1. Changes
    - Add `attention_headline` column to stores table
    
  2. Description
    - Allows stores to display an optional attention headline below the store description
*/

ALTER TABLE stores ADD COLUMN IF NOT EXISTS attention_headline text;