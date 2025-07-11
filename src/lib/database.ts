import { supabase } from './supabaseClient';

// Types for database tables
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  farm_location?: string;
  created_at: string;
  updated_at: string;
}

export interface Farm {
  id: string;
  user_id: string;
  name: string;
  location?: string;
  size: number;
  size_unit: string;
  soil_type?: string;
  created_at: string;
  updated_at: string;
}

export interface SoilAnalysis {
  id: string;
  farm_id: string;
  user_id: string;
  ph_level?: number;
  nitrogen?: number;
  phosphorus?: number;
  potassium?: number;
  organic_matter?: number;
  moisture?: number;
  temperature?: number;
  humidity?: number;
  analysis_date: string;
  created_at: string;
}

export interface FertilizerRecommendation {
  id: string;
  farm_id: string;
  user_id: string;
  soil_analysis_id?: string;
  crop_type: string;
  primary_fertilizer: string;
  secondary_fertilizer?: string;
  organic_options: any[];
  application_timing: any;
  cost_estimate: any;
  ml_prediction: any;
  confidence_score: number;
  status: 'pending' | 'applied' | 'scheduled';
  applied_date?: string;
  created_at: string;
}

export interface SensorData {
  id: string;
  farm_id?: string;
  user_id?: string;
  sensor_type: string;
  nitrogen?: number;
  phosphorus?: number;
  potassium?: number;
  ph_level?: number;
  soil_moisture?: number;
  temperature?: number;
  humidity?: number;
  timestamp: string;
  created_at: string;
}

// Database service functions
export class DatabaseService {
  // User Profile functions
  static async getUserProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }

    return data;
  }

  static async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('update_user_profile', {
        user_name: updates.name || null,
        user_phone: (updates as any).phone || null,
        user_bio: (updates as any).bio || null,
        user_farm_location: updates.farm_location || null,
        user_profile_image_url: (updates as any).profile_image_url || null
      });

      if (error) {
        console.error('Error updating user profile:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error updating user profile:', error);
      return false;
    }
  }

  // Farm functions
  static async getUserFarms(userId: string): Promise<Farm[]> {
    const { data, error } = await supabase
      .from('farms')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching farms:', error);
      return [];
    }

    return data || [];
  }

  static async createFarm(farm: Omit<Farm, 'id' | 'created_at' | 'updated_at'>): Promise<Farm | null> {
    const { data, error } = await supabase
      .from('farms')
      .insert(farm)
      .select()
      .single();

    if (error) {
      console.error('Error creating farm:', error);
      return null;
    }

    return data;
  }

  static async updateFarm(farmId: string, updates: Partial<Farm>): Promise<boolean> {
    const { error } = await supabase
      .from('farms')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', farmId);

    if (error) {
      console.error('Error updating farm:', error);
      return false;
    }

    return true;
  }

  static async deleteFarm(farmId: string): Promise<boolean> {
    const { error } = await supabase
      .from('farms')
      .delete()
      .eq('id', farmId);

    if (error) {
      console.error('Error deleting farm:', error);
      return false;
    }

    return true;
  }

  // Soil Analysis functions
  static async createSoilAnalysis(analysis: Omit<SoilAnalysis, 'id' | 'created_at'>): Promise<SoilAnalysis | null> {
    const { data, error } = await supabase
      .from('soil_analyses')
      .insert(analysis)
      .select()
      .single();

    if (error) {
      console.error('Error creating soil analysis:', error);
      return null;
    }

    return data;
  }

  static async getFarmSoilAnalyses(farmId: string): Promise<SoilAnalysis[]> {
    const { data, error } = await supabase
      .from('soil_analyses')
      .select('*')
      .eq('farm_id', farmId)
      .order('analysis_date', { ascending: false });

    if (error) {
      console.error('Error fetching soil analyses:', error);
      return [];
    }

    return data || [];
  }

  static async getLatestSoilAnalysis(farmId: string): Promise<SoilAnalysis | null> {
    const { data, error } = await supabase
      .from('soil_analyses')
      .select('*')
      .eq('farm_id', farmId)
      .order('analysis_date', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error('Error fetching latest soil analysis:', error);
      return null;
    }

    return data;
  }

  // Fertilizer Recommendation functions
  static async createFertilizerRecommendation(
    recommendation: Omit<FertilizerRecommendation, 'id' | 'created_at'>
  ): Promise<FertilizerRecommendation | null> {
    const { data, error } = await supabase
      .from('fertilizer_recommendations')
      .insert(recommendation)
      .select()
      .single();

    if (error) {
      console.error('Error creating fertilizer recommendation:', error);
      return null;
    }

    return data;
  }

  static async getFarmRecommendations(farmId: string): Promise<FertilizerRecommendation[]> {
    const { data, error } = await supabase
      .from('fertilizer_recommendations')
      .select('*')
      .eq('farm_id', farmId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching recommendations:', error);
      return [];
    }

    return data || [];
  }

  static async updateRecommendationStatus(
    recommendationId: string, 
    status: 'pending' | 'applied' | 'scheduled',
    appliedDate?: string
  ): Promise<boolean> {
    const updates: any = { status };
    if (appliedDate) {
      updates.applied_date = appliedDate;
    }

    const { error } = await supabase
      .from('fertilizer_recommendations')
      .update(updates)
      .eq('id', recommendationId);

    if (error) {
      console.error('Error updating recommendation status:', error);
      return false;
    }

    return true;
  }

  // Sensor Data functions
  static async insertSensorData(sensorData: Omit<SensorData, 'id' | 'created_at'>): Promise<SensorData | null> {
    const { data, error } = await supabase
      .from('sensor_data')
      .insert(sensorData)
      .select()
      .single();

    if (error) {
      console.error('Error inserting sensor data:', error);
      return null;
    }

    return data;
  }

  static async getLatestSensorData(farmId: string): Promise<SensorData | null> {
    const { data, error } = await supabase
      .from('sensor_data')
      .select('*')
      .eq('farm_id', farmId)
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error('Error fetching latest sensor data:', error);
      return null;
    }

    return data;
  }

  static async getFarmSensorHistory(farmId: string, limit: number = 100): Promise<SensorData[]> {
    const { data, error } = await supabase
      .from('sensor_data')
      .select('*')
      .eq('farm_id', farmId)
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching sensor history:', error);
      return [];
    }

    return data || [];
  }

  // Analytics functions
  static async getFarmHealthScore(farmId: string): Promise<number> {
    const latestAnalysis = await this.getLatestSoilAnalysis(farmId);
    if (!latestAnalysis) return 0;

    let score = 0;
    const { ph_level, nitrogen, phosphorus, potassium, moisture } = latestAnalysis;

    // pH scoring (optimal 6.0-7.5)
    if (ph_level) {
      if (ph_level >= 6.0 && ph_level <= 7.5) score += 20;
      else if (ph_level >= 5.5 && ph_level <= 8.0) score += 15;
      else score += 5;
    }

    // Nutrient scoring
    if (nitrogen && nitrogen >= 40) score += 20;
    else if (nitrogen && nitrogen >= 20) score += 15;
    else score += 5;

    if (phosphorus && phosphorus >= 20) score += 20;
    else if (phosphorus && phosphorus >= 10) score += 15;
    else score += 5;

    if (potassium && potassium >= 150) score += 20;
    else if (potassium && potassium >= 100) score += 15;
    else score += 5;

    if (moisture) {
      if (moisture >= 60 && moisture <= 80) score += 20;
      else if (moisture >= 40 && moisture <= 90) score += 15;
      else score += 5;
    }

    return Math.min(score, 100);
  }
}