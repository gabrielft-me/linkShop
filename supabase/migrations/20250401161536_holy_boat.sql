/*
  # Initial Schema Setup for LinkTree Catalog

  1. New Tables
    - `stores`
      - Basic store information
    - `products`
      - Product catalog
    - `categories`
      - Product categories
    
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create stores table
CREATE TABLE IF NOT EXISTS stores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  name text NOT NULL,
  whatsapp text NOT NULL,
  welcome_message text DEFAULT 'Olá! Vi seu catálogo e gostaria de saber mais sobre:',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES stores(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES stores(id) ON DELETE CASCADE,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  price decimal(10,2) NOT NULL,
  image_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Policies for stores
CREATE POLICY "Users can view their own store"
  ON stores
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own store"
  ON stores
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own store"
  ON stores
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for categories
CREATE POLICY "Users can manage their store categories"
  ON categories
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM stores 
    WHERE stores.id = categories.store_id 
    AND stores.user_id = auth.uid()
  ));

-- Policies for products
CREATE POLICY "Users can manage their store products"
  ON products
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM stores 
    WHERE stores.id = products.store_id 
    AND stores.user_id = auth.uid()
  ));

-- Public access policies
CREATE POLICY "Public can view stores"
  ON stores
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can view categories"
  ON categories
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can view products"
  ON products
  FOR SELECT
  TO public
  USING (true);