import { useState, useEffect } from 'react';
import { DatabaseService, Farm, SoilAnalysis, FertilizerRecommendation, SensorData } from '@/lib/database';
import { supabase } from '@/lib/supabaseClient';

// Hook for managing user farms
export const useFarms = () => {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFarms = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('User not authenticated');
        return;
      }

      const userFarms = await DatabaseService.getUserFarms(user.id);
      setFarms(userFarms);
      setError(null);
    } catch (err) {
      setError('Failed to fetch farms');
      console.error('Error fetching farms:', err);
    } finally {
      setLoading(false);
    }
  };

  const createFarm = async (farmData: Omit<Farm, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const newFarm = await DatabaseService.createFarm({
        ...farmData,
        user_id: user.id
      });

      if (newFarm) {
        setFarms(prev => [newFarm, ...prev]);
        return newFarm;
      }
    } catch (err) {
      setError('Failed to create farm');
      console.error('Error creating farm:', err);
    }
    return null;
  };

  const updateFarm = async (farmId: string, updates: Partial<Farm>) => {
    try {
      const success = await DatabaseService.updateFarm(farmId, updates);
      if (success) {
        setFarms(prev => prev.map(farm => 
          farm.id === farmId ? { ...farm, ...updates } : farm
        ));
        return true;
      }
    } catch (err) {
      setError('Failed to update farm');
      console.error('Error updating farm:', err);
    }
    return false;
  };

  const deleteFarm = async (farmId: string) => {
    try {
      const success = await DatabaseService.deleteFarm(farmId);
      if (success) {
        setFarms(prev => prev.filter(farm => farm.id !== farmId));
        return true;
      }
    } catch (err) {
      setError('Failed to delete farm');
      console.error('Error deleting farm:', err);
    }
    return false;
  };

  useEffect(() => {
    fetchFarms();
  }, []);

  return {
    farms,
    loading,
    error,
    refetch: fetchFarms,
    createFarm,
    updateFarm,
    deleteFarm
  };
};

// Hook for managing soil analyses
export const useSoilAnalyses = (farmId: string | null) => {
  const [analyses, setAnalyses] = useState<SoilAnalysis[]>([]);
  const [latestAnalysis, setLatestAnalysis] = useState<SoilAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalyses = async () => {
    if (!farmId) return;

    try {
      setLoading(true);
      const [farmAnalyses, latest] = await Promise.all([
        DatabaseService.getFarmSoilAnalyses(farmId),
        DatabaseService.getLatestSoilAnalysis(farmId)
      ]);

      setAnalyses(farmAnalyses);
      setLatestAnalysis(latest);
      setError(null);
    } catch (err) {
      setError('Failed to fetch soil analyses');
      console.error('Error fetching soil analyses:', err);
    } finally {
      setLoading(false);
    }
  };

  const createAnalysis = async (analysisData: Omit<SoilAnalysis, 'id' | 'created_at'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const newAnalysis = await DatabaseService.createSoilAnalysis({
        ...analysisData,
        user_id: user.id
      });

      if (newAnalysis) {
        setAnalyses(prev => [newAnalysis, ...prev]);
        setLatestAnalysis(newAnalysis);
        return newAnalysis;
      }
    } catch (err) {
      setError('Failed to create soil analysis');
      console.error('Error creating soil analysis:', err);
    }
    return null;
  };

  useEffect(() => {
    fetchAnalyses();
  }, [farmId]);

  return {
    analyses,
    latestAnalysis,
    loading,
    error,
    refetch: fetchAnalyses,
    createAnalysis
  };
};

// Hook for managing fertilizer recommendations
export const useFertilizerRecommendations = (farmId: string | null) => {
  const [recommendations, setRecommendations] = useState<FertilizerRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecommendations = async () => {
    if (!farmId) return;

    try {
      setLoading(true);
      const farmRecommendations = await DatabaseService.getFarmRecommendations(farmId);
      setRecommendations(farmRecommendations);
      setError(null);
    } catch (err) {
      setError('Failed to fetch recommendations');
      console.error('Error fetching recommendations:', err);
    } finally {
      setLoading(false);
    }
  };

  const createRecommendation = async (
    recommendationData: Omit<FertilizerRecommendation, 'id' | 'created_at'>
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const newRecommendation = await DatabaseService.createFertilizerRecommendation({
        ...recommendationData,
        user_id: user.id
      });

      if (newRecommendation) {
        setRecommendations(prev => [newRecommendation, ...prev]);
        return newRecommendation;
      }
    } catch (err) {
      setError('Failed to create recommendation');
      console.error('Error creating recommendation:', err);
    }
    return null;
  };

  const updateRecommendationStatus = async (
    recommendationId: string,
    status: 'pending' | 'applied' | 'scheduled',
    appliedDate?: string
  ) => {
    try {
      const success = await DatabaseService.updateRecommendationStatus(
        recommendationId,
        status,
        appliedDate
      );

      if (success) {
        setRecommendations(prev => prev.map(rec =>
          rec.id === recommendationId
            ? { ...rec, status, applied_date: appliedDate || rec.applied_date }
            : rec
        ));
        return true;
      }
    } catch (err) {
      setError('Failed to update recommendation status');
      console.error('Error updating recommendation status:', err);
    }
    return false;
  };

  useEffect(() => {
    fetchRecommendations();
  }, [farmId]);

  return {
    recommendations,
    loading,
    error,
    refetch: fetchRecommendations,
    createRecommendation,
    updateRecommendationStatus
  };
};

// Hook for managing sensor data
export const useSensorData = (farmId: string | null) => {
  const [latestData, setLatestData] = useState<SensorData | null>(null);
  const [history, setHistory] = useState<SensorData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSensorData = async () => {
    if (!farmId) return;

    try {
      setLoading(true);
      const [latest, sensorHistory] = await Promise.all([
        DatabaseService.getLatestSensorData(farmId),
        DatabaseService.getFarmSensorHistory(farmId, 50)
      ]);

      setLatestData(latest);
      setHistory(sensorHistory);
      setError(null);
    } catch (err) {
      setError('Failed to fetch sensor data');
      console.error('Error fetching sensor data:', err);
    } finally {
      setLoading(false);
    }
  };

  const insertSensorData = async (sensorData: Omit<SensorData, 'id' | 'created_at'>) => {
    try {
      const newData = await DatabaseService.insertSensorData(sensorData);
      if (newData) {
        setLatestData(newData);
        setHistory(prev => [newData, ...prev.slice(0, 49)]);
        return newData;
      }
    } catch (err) {
      setError('Failed to insert sensor data');
      console.error('Error inserting sensor data:', err);
    }
    return null;
  };

  useEffect(() => {
    fetchSensorData();
  }, [farmId]);

  return {
    latestData,
    history,
    loading,
    error,
    refetch: fetchSensorData,
    insertSensorData
  };
};

// Hook for farm health analytics
export const useFarmHealth = (farmId: string | null) => {
  const [healthScore, setHealthScore] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealthScore = async () => {
    if (!farmId) return;

    try {
      setLoading(true);
      const score = await DatabaseService.getFarmHealthScore(farmId);
      setHealthScore(score);
      setError(null);
    } catch (err) {
      setError('Failed to fetch health score');
      console.error('Error fetching health score:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthScore();
  }, [farmId]);

  return {
    healthScore,
    loading,
    error,
    refetch: fetchHealthScore
  };
};