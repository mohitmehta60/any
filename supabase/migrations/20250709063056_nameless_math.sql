/*
  # Create soil analyses table

  1. New Tables
    - `soil_analyses`
      - `id` (uuid, primary key)
      - `farm_id` (uuid, foreign key to farms)
      - `user_id` (uuid, foreign key to user_profiles)
      - `ph_level` (numeric)
      - `nitrogen` (numeric)
      - `phosphorus` (numeric)
      - `potassium` (numeric)
      - `organic_matter` (numeric)
      - `moisture` (numeric)
      - `temperature` (numeric)
      - `humidity` (numeric)
      - `analysis_date` (timestamp)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `soil_analyses` table
    - Add policies for users to manage their own soil analyses
*/

CREATE TABLE IF NOT EXISTS soil_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id uuid NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  ph_level numeric,
  nitrogen numeric,
  phosphorus numeric,
  potassium numeric,
  organic_matter numeric,
  moisture numeric,
  temperature numeric,
  humidity numeric,
  analysis_date timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE soil_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own soil analyses"
  ON soil_analyses
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own soil analyses"
  ON soil_analyses
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own soil analyses"
  ON soil_analyses
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own soil analyses"
  ON soil_analyses
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS soil_analyses_farm_id_idx ON soil_analyses(farm_id);
CREATE INDEX IF NOT EXISTS soil_analyses_user_id_idx ON soil_analyses(user_id);
CREATE INDEX IF NOT EXISTS soil_analyses_analysis_date_idx ON soil_analyses(analysis_date);