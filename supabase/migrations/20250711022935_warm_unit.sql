/*
  # Comprehensive Database Fixes

  1. User Profile Management
    - Create update_user_profile function
    - Create update_last_login function
    - Add proper RLS policies

  2. Recommendation History
    - Create get_user_recommendation_history function
    - Create update_recommendation_status function
    - Ensure proper data isolation per user

  3. Authentication & Profile Updates
    - Handle user profile creation on signup
    - Ensure proper user data management
*/

-- Create or replace function to update user profile
CREATE OR REPLACE FUNCTION update_user_profile(
  user_name text DEFAULT NULL,
  user_phone text DEFAULT NULL,
  user_bio text DEFAULT NULL,
  user_farm_location text DEFAULT NULL,
  user_profile_image_url text DEFAULT NULL
)
RETURNS user_profiles AS $$
DECLARE
  current_user_id uuid;
  updated_profile user_profiles;
BEGIN
  -- Get current user ID
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  -- Update the user profile
  UPDATE user_profiles 
  SET 
    name = COALESCE(user_name, name),
    phone = COALESCE(user_phone, phone),
    bio = COALESCE(user_bio, bio),
    farm_location = COALESCE(user_farm_location, farm_location),
    profile_image_url = COALESCE(user_profile_image_url, profile_image_url),
    updated_at = now()
  WHERE id = current_user_id
  RETURNING * INTO updated_profile;

  -- If no profile exists, create one
  IF NOT FOUND THEN
    INSERT INTO user_profiles (
      id, 
      name, 
      email, 
      phone, 
      bio, 
      farm_location, 
      profile_image_url,
      created_at,
      updated_at
    ) VALUES (
      current_user_id,
      COALESCE(user_name, 'User'),
      auth.email(),
      user_phone,
      user_bio,
      user_farm_location,
      user_profile_image_url,
      now(),
      now()
    )
    RETURNING * INTO updated_profile;
  END IF;

  RETURN updated_profile;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create or replace function to update last login
CREATE OR REPLACE FUNCTION update_last_login()
RETURNS void AS $$
DECLARE
  current_user_id uuid;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN;
  END IF;

  -- Update last login timestamp
  UPDATE user_profiles 
  SET last_login = now()
  WHERE id = current_user_id;

  -- If profile doesn't exist, create it
  IF NOT FOUND THEN
    INSERT INTO user_profiles (
      id, 
      name, 
      email, 
      last_login,
      created_at,
      updated_at
    ) VALUES (
      current_user_id,
      COALESCE(auth.email(), 'User'),
      auth.email(),
      now(),
      now(),
      now()
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get user recommendation history
CREATE OR REPLACE FUNCTION get_user_recommendation_history(
  limit_count integer DEFAULT 50,
  offset_count integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  farm_name text,
  crop_type text,
  primary_fertilizer text,
  secondary_fertilizer text,
  confidence_score numeric,
  status text,
  created_at timestamptz,
  applied_date timestamptz
) AS $$
DECLARE
  current_user_id uuid;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  RETURN QUERY
  SELECT 
    fr.id,
    f.name as farm_name,
    fr.crop_type,
    fr.primary_fertilizer,
    fr.secondary_fertilizer,
    fr.confidence_score,
    fr.status,
    fr.created_at,
    fr.applied_date
  FROM fertilizer_recommendations fr
  LEFT JOIN farms f ON fr.farm_id = f.id
  WHERE fr.user_id = current_user_id
  ORDER BY fr.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update recommendation status
CREATE OR REPLACE FUNCTION update_recommendation_status(
  recommendation_id uuid,
  new_status text,
  application_date timestamptz DEFAULT NULL
)
RETURNS boolean AS $$
DECLARE
  current_user_id uuid;
  rows_affected integer;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  -- Validate status
  IF new_status NOT IN ('pending', 'applied', 'scheduled') THEN
    RAISE EXCEPTION 'Invalid status. Must be pending, applied, or scheduled';
  END IF;

  -- Update the recommendation
  UPDATE fertilizer_recommendations 
  SET 
    status = new_status,
    applied_date = CASE 
      WHEN new_status = 'applied' THEN COALESCE(application_date, now())
      ELSE applied_date
    END
  WHERE id = recommendation_id AND user_id = current_user_id;

  GET DIAGNOSTICS rows_affected = ROW_COUNT;
  
  RETURN rows_affected > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger function to handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO user_profiles (
    id,
    name,
    email,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    now(),
    now()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Ensure all tables have proper RLS policies

-- Update user_profiles policies
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;

CREATE POLICY "Users can read own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Update farms policies
DROP POLICY IF EXISTS "Users can read own farms" ON farms;
DROP POLICY IF EXISTS "Users can insert own farms" ON farms;
DROP POLICY IF EXISTS "Users can update own farms" ON farms;
DROP POLICY IF EXISTS "Users can delete own farms" ON farms;

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

-- Update fertilizer_recommendations policies
DROP POLICY IF EXISTS "Users can read own recommendations" ON fertilizer_recommendations;
DROP POLICY IF EXISTS "Users can insert own recommendations" ON fertilizer_recommendations;
DROP POLICY IF EXISTS "Users can update own recommendations" ON fertilizer_recommendations;
DROP POLICY IF EXISTS "Users can delete own recommendations" ON fertilizer_recommendations;

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

-- Update soil_analyses policies
DROP POLICY IF EXISTS "Users can read own soil analyses" ON soil_analyses;
DROP POLICY IF EXISTS "Users can insert own soil analyses" ON soil_analyses;
DROP POLICY IF EXISTS "Users can update own soil analyses" ON soil_analyses;
DROP POLICY IF EXISTS "Users can delete own soil analyses" ON soil_analyses;

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

-- Add missing indexes for better performance
CREATE INDEX IF NOT EXISTS user_profiles_email_idx ON user_profiles(email);
CREATE INDEX IF NOT EXISTS user_profiles_last_login_idx ON user_profiles(last_login);
CREATE INDEX IF NOT EXISTS farms_user_id_idx ON farms(user_id);
CREATE INDEX IF NOT EXISTS soil_analyses_user_id_idx ON soil_analyses(user_id);
CREATE INDEX IF NOT EXISTS soil_analyses_farm_id_idx ON soil_analyses(farm_id);
CREATE INDEX IF NOT EXISTS soil_analyses_analysis_date_idx ON soil_analyses(analysis_date);
CREATE INDEX IF NOT EXISTS fertilizer_recommendations_user_id_idx ON fertilizer_recommendations(user_id);
CREATE INDEX IF NOT EXISTS fertilizer_recommendations_farm_id_idx ON fertilizer_recommendations(farm_id);
CREATE INDEX IF NOT EXISTS fertilizer_recommendations_status_idx ON fertilizer_recommendations(status);
CREATE INDEX IF NOT EXISTS fertilizer_recommendations_created_at_idx ON fertilizer_recommendations(created_at);
CREATE INDEX IF NOT EXISTS fertilizer_recommendations_user_created_idx ON fertilizer_recommendations(user_id, created_at DESC);