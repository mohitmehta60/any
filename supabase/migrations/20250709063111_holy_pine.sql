/*
  # Create sensor data table for IoT integration

  1. New Tables
    - `sensor_data`
      - `id` (uuid, primary key)
      - `farm_id` (uuid, foreign key to farms)
      - `user_id` (uuid, foreign key to user_profiles)
      - `sensor_type` (text)
      - `nitrogen` (numeric)
      - `phosphorus` (numeric)
      - `potassium` (numeric)
      - `ph_level` (numeric)
      - `soil_moisture` (numeric)
      - `temperature` (numeric)
      - `humidity` (numeric)
      - `timestamp` (timestamp)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `sensor_data` table
    - Add policies for users to read their own sensor data
    - Add policy for service role to insert sensor data
*/

CREATE TABLE IF NOT EXISTS sensor_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id uuid REFERENCES farms(id) ON DELETE CASCADE,
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  sensor_type text DEFAULT 'npk_sensor',
  nitrogen numeric,
  phosphorus numeric,
  potassium numeric,
  ph_level numeric,
  soil_moisture numeric,
  temperature numeric,
  humidity numeric,
  timestamp timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE sensor_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own sensor data"
  ON sensor_data
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Service role can insert sensor data"
  ON sensor_data
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Users can insert own sensor data"
  ON sensor_data
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS sensor_data_farm_id_idx ON sensor_data(farm_id);
CREATE INDEX IF NOT EXISTS sensor_data_user_id_idx ON sensor_data(user_id);
CREATE INDEX IF NOT EXISTS sensor_data_timestamp_idx ON sensor_data(timestamp);
CREATE INDEX IF NOT EXISTS sensor_data_sensor_type_idx ON sensor_data(sensor_type);

-- Create a function to get latest sensor readings
CREATE OR REPLACE FUNCTION get_latest_sensor_data(farm_uuid uuid)
RETURNS TABLE (
  nitrogen numeric,
  phosphorus numeric,
  potassium numeric,
  ph_level numeric,
  soil_moisture numeric,
  temperature numeric,
  humidity numeric,
  timestamp timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.nitrogen,
    s.phosphorus,
    s.potassium,
    s.ph_level,
    s.soil_moisture,
    s.temperature,
    s.humidity,
    s.timestamp
  FROM sensor_data s
  WHERE s.farm_id = farm_uuid
  ORDER BY s.timestamp DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;