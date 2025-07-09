/*
  # Create fertilizer recommendations table

  1. New Tables
    - `fertilizer_recommendations`
      - `id` (uuid, primary key)
      - `farm_id` (uuid, foreign key to farms)
      - `user_id` (uuid, foreign key to user_profiles)
      - `soil_analysis_id` (uuid, foreign key to soil_analyses)
      - `crop_type` (text)
      - `primary_fertilizer` (text)
      - `secondary_fertilizer` (text)
      - `organic_options` (jsonb)
      - `application_timing` (jsonb)
      - `cost_estimate` (jsonb)
      - `ml_prediction` (jsonb)
      - `confidence_score` (numeric)
      - `status` (text)
      - `applied_date` (timestamp)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `fertilizer_recommendations` table
    - Add policies for users to manage their own recommendations
*/

CREATE TABLE IF NOT EXISTS fertilizer_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id uuid NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  soil_analysis_id uuid REFERENCES soil_analyses(id) ON DELETE SET NULL,
  crop_type text NOT NULL,
  primary_fertilizer text NOT NULL,
  secondary_fertilizer text,
  organic_options jsonb DEFAULT '[]'::jsonb,
  application_timing jsonb DEFAULT '{}'::jsonb,
  cost_estimate jsonb DEFAULT '{}'::jsonb,
  ml_prediction jsonb DEFAULT '{}'::jsonb,
  confidence_score numeric DEFAULT 0,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'applied', 'scheduled')),
  applied_date timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE fertilizer_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own recommendations"
  ON fertilizer_recommendations
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own recommendations"
  ON fertilizer_recommendations
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own recommendations"
  ON fertilizer_recommendations
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own recommendations"
  ON fertilizer_recommendations
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS fertilizer_recommendations_farm_id_idx ON fertilizer_recommendations(farm_id);
CREATE INDEX IF NOT EXISTS fertilizer_recommendations_user_id_idx ON fertilizer_recommendations(user_id);
CREATE INDEX IF NOT EXISTS fertilizer_recommendations_status_idx ON fertilizer_recommendations(status);
CREATE INDEX IF NOT EXISTS fertilizer_recommendations_created_at_idx ON fertilizer_recommendations(created_at);