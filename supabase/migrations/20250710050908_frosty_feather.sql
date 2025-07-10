/*
  # Complete User Management System

  1. User Profile Management
    - Enhanced user_profiles table with additional fields
    - Profile update functionality
    - Email verification tracking

  2. User-specific Fertilizer Recommendation History
    - Enhanced fertilizer_recommendations table
    - User-specific history tracking
    - Recommendation status management

  3. Security and RLS Policies
    - Proper row-level security for all tables
    - User-specific data access controls
    - Profile editing permissions

  4. Helper Functions
    - Profile management functions
    - Recommendation history functions
*/

-- Enhance user_profiles table with additional fields
DO $$
BEGIN
  -- Add new columns if they don't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'phone') THEN
    ALTER TABLE user_profiles ADD COLUMN phone text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'bio') THEN
    ALTER TABLE user_profiles ADD COLUMN bio text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'profile_image_url') THEN
    ALTER TABLE user_profiles ADD COLUMN profile_image_url text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'email_verified') THEN
    ALTER TABLE user_profiles ADD COLUMN email_verified boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'last_login') THEN
    ALTER TABLE user_profiles ADD COLUMN last_login timestamptz;
  END IF;
END $$;

-- Create function to update user profile
CREATE OR REPLACE FUNCTION update_user_profile(
  user_name text DEFAULT NULL,
  user_phone text DEFAULT NULL,
  user_bio text DEFAULT NULL,
  user_farm_location text DEFAULT NULL,
  user_profile_image_url text DEFAULT NULL
)
RETURNS json AS $$
DECLARE
  current_user_id uuid;
  updated_profile json;
BEGIN
  -- Get current user ID
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- Update user profile
  UPDATE user_profiles 
  SET 
    name = COALESCE(user_name, name),
    phone = COALESCE(user_phone, phone),
    bio = COALESCE(user_bio, bio),
    farm_location = COALESCE(user_farm_location, farm_location),
    profile_image_url = COALESCE(user_profile_image_url, profile_image_url),
    updated_at = now()
  WHERE id = current_user_id;
  
  -- Return updated profile
  SELECT json_build_object(
    'id', id,
    'name', name,
    'email', email,
    'phone', phone,
    'bio', bio,
    'farm_location', farm_location,
    'profile_image_url', profile_image_url,
    'email_verified', email_verified,
    'created_at', created_at,
    'updated_at', updated_at
  ) INTO updated_profile
  FROM user_profiles
  WHERE id = current_user_id;
  
  RETURN updated_profile;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get user's fertilizer recommendation history
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
  -- Get current user ID
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
  -- Get current user ID
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- Validate status
  IF new_status NOT IN ('pending', 'applied', 'scheduled') THEN
    RAISE EXCEPTION 'Invalid status. Must be pending, applied, or scheduled';
  END IF;
  
  -- Update recommendation status
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

-- Create function to get user statistics
CREATE OR REPLACE FUNCTION get_user_statistics()
RETURNS json AS $$
DECLARE
  current_user_id uuid;
  stats json;
BEGIN
  -- Get current user ID
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  SELECT json_build_object(
    'total_farms', (
      SELECT COUNT(*) FROM farms WHERE user_id = current_user_id
    ),
    'total_recommendations', (
      SELECT COUNT(*) FROM fertilizer_recommendations WHERE user_id = current_user_id
    ),
    'applied_recommendations', (
      SELECT COUNT(*) FROM fertilizer_recommendations 
      WHERE user_id = current_user_id AND status = 'applied'
    ),
    'pending_recommendations', (
      SELECT COUNT(*) FROM fertilizer_recommendations 
      WHERE user_id = current_user_id AND status = 'pending'
    ),
    'total_soil_analyses', (
      SELECT COUNT(*) FROM soil_analyses WHERE user_id = current_user_id
    ),
    'latest_analysis_date', (
      SELECT MAX(analysis_date) FROM soil_analyses WHERE user_id = current_user_id
    )
  ) INTO stats;
  
  RETURN stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the handle_new_user function to include email verification tracking
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert a new user profile when a user signs up
  INSERT INTO public.user_profiles (
    id, 
    name, 
    email, 
    email_verified,
    created_at, 
    updated_at
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.email_confirmed_at IS NOT NULL, false),
    NOW(),
    NOW()
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't prevent user creation
    RAISE LOG 'Error creating user profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update last login time
CREATE OR REPLACE FUNCTION update_last_login()
RETURNS void AS $$
DECLARE
  current_user_id uuid;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NOT NULL THEN
    UPDATE user_profiles 
    SET last_login = now()
    WHERE id = current_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions on all functions
GRANT EXECUTE ON FUNCTION update_user_profile(text, text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_recommendation_history(integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION update_recommendation_status(uuid, text, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_statistics() TO authenticated;
GRANT EXECUTE ON FUNCTION update_last_login() TO authenticated;

-- Ensure proper RLS policies are in place
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE farms ENABLE ROW LEVEL SECURITY;
ALTER TABLE fertilizer_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE soil_analyses ENABLE ROW LEVEL SECURITY;

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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS user_profiles_email_idx ON user_profiles(email);
CREATE INDEX IF NOT EXISTS user_profiles_last_login_idx ON user_profiles(last_login);
CREATE INDEX IF NOT EXISTS fertilizer_recommendations_user_created_idx ON fertilizer_recommendations(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS fertilizer_recommendations_status_idx ON fertilizer_recommendations(status);