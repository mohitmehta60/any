/*
  # Create farms table

  1. New Tables
    - `farms`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to user_profiles)
      - `name` (text)
      - `location` (text)
      - `size` (numeric)
      - `size_unit` (text)
      - `soil_type` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `farms` table
    - Add policies for users to manage their own farms
*/

CREATE TABLE IF NOT EXISTS farms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  location text,
  size numeric NOT NULL,
  size_unit text NOT NULL DEFAULT 'hectares',
  soil_type text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE farms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own farms"
  ON farms
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own farms"
  ON farms
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own farms"
  ON farms
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own farms"
  ON farms
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create index for better performance
CREATE INDEX IF NOT EXISTS farms_user_id_idx ON farms(user_id);