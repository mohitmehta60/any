import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Droplets, Thermometer, Activity, Leaf, Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { fetchThingSpeakData, getMockThingSpeakData, ThingSpeakData } from "@/services/thingSpeakService";

interface Farm {
  id: string;
  name: string;
  size: number;
  unit: string;
  lastUpdated: string;
  soilHealth: number;
}

interface RecommendationLog {
  id: string;
  farmName: string;
  timestamp: string;
  primaryFertilizer: string;
  secondaryFertilizer: string;
  status: 'applied' | 'pending' | 'scheduled';
}

const EnhancedFarmOverview = () => {
  const [realTimeData, setRealTimeData] = useState<ThingSpeakData | null>(null);
  const [loading, setLoading] = useState(true);

  // Mock farms data
  const farms: Farm[] = [
    { id: '1', name: 'North Field', size: 5.2, unit: 'hectares', lastUpdated: '2 hours ago', soilHealth: 85 },
    { id: '2', name: 'South Field', size: 3.8, unit: 'hectares', lastUpdated: '4 hours ago', soilHealth: 78 },
    { id: '3', name: 'East Field', size: 2.1, unit: 'hectares', lastUpdated: '1 hour ago', soilHealth: 92 }
  ];

  // Mock recommendation logs
  const recommendationLogs: RecommendationLog[] = [
    {
      id: '1',
      farmName: 'North Field',
      timestamp: '2025-01-27 14:30',
      primaryFertilizer: 'NPK 20-10-10',
      secondaryFertilizer: 'Phosphate Rock',
      status: 'applied'
    },
    {
      id: '2',
      farmName: 'South Field',
      timestamp: '2025-01-26 09:15',
      primaryFertilizer: 'Urea 46%',
      secondaryFertilizer: 'Compost',
      status: 'pending'
    },
    {
      id: '3',
      farmName: 'East Field',
      timestamp: '2025-01-25 16:45',
      primaryFertilizer: 'DAP 18-46-0',
      secondaryFertilizer: 'Bone Meal',
      status: 'scheduled'
    }
  ];

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const data = await fetchThingSpeakData();
        if (data) {
          setRealTimeData(data);
        } else {
          // Fallback to mock data
          setRealTimeData(getMockThingSpeakData());
        }
      } catch (error) {
        console.error('Error loading data:', error);
        setRealTimeData(getMockThingSpeakData());
      } finally {
        setLoading(false);
      }
    };

    loadData();
    // Refresh data every 5 minutes
    const interval = setInterval(loadData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getHealthScore = (data: ThingSpeakData) => {
    if (!data) return 0;
    
    let score = 0;
    const { soilPH, nitrogen, phosphorus, potassium, soilMoisture } = data;
    
    // pH scoring (optimal 6.0-7.5)
    if (soilPH >= 6.0 && soilPH <= 7.5) score += 20;
    else if (soilPH >= 5.5 && soilPH <= 8.0) score += 15;
    else score += 5;
    
    // Nutrient scoring
    if (nitrogen >= 40) score += 20;
    else if (nitrogen >= 20) score += 15;
    else score += 5;
    
    if (phosphorus >= 20) score += 20;
    else if (phosphorus >= 10) score += 15;
    else score += 5;
    
    if (potassium >= 150) score += 20;
    else if (potassium >= 100) score += 15;
    else score += 5;
    
    if (soilMoisture >= 60 && soilMoisture <= 80) score += 20;
    else if (soilMoisture >= 40 && soilMoisture <= 90) score += 15;
    else score += 5;
    
    return Math.min(score, 100);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'applied': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'scheduled': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse border-0 shadow-md">
              <CardContent className="p-3 sm:p-6">
                <div className="h-3 sm:h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded mb-2"></div>
                <div className="h-6 sm:h-8 bg-gradient-to-r from-gray-200 to-gray-300 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const healthScore = realTimeData ? getHealthScore(realTimeData) : 0;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Real-time Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 bg-gradient-to-br from-grass-50 to-green-50">
          <CardHeader className="pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">Overall Soil Health</CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="flex items-center space-x-2">
              <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-grass-600 animate-pulse" />
              <span className="text-lg sm:text-2xl font-bold text-grass-700">{healthScore}%</span>
            </div>
            <Progress value={healthScore} className="mt-2 h-2 bg-grass-100" />
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 bg-gradient-to-br from-blue-50 to-cyan-50">
          <CardHeader className="pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">Soil Moisture</CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="flex items-center space-x-2">
              <Droplets className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 animate-bounce" />
              <span className="text-lg sm:text-2xl font-bold text-blue-700">{realTimeData?.soilMoisture.toFixed(1)}%</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 bg-gradient-to-br from-orange-50 to-red-50">
          <CardHeader className="pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">Temperature</CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="flex items-center space-x-2">
              <Thermometer className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
              <span className="text-lg sm:text-2xl font-bold text-orange-700">{realTimeData?.temperature.toFixed(1)}°C</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 bg-gradient-to-br from-cyan-50 to-blue-50">
          <CardHeader className="pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">Humidity</CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="flex items-center space-x-2">
              <Droplets className="h-4 w-4 sm:h-5 sm:w-5 text-cyan-600" />
              <span className="text-lg sm:text-2xl font-bold text-cyan-700">{realTimeData?.humidity.toFixed(1)}%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* NPK Levels */}
      <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="text-lg sm:text-xl flex items-center space-x-2">
            <Leaf className="h-5 w-5 text-grass-600" />
            <span>NPK Levels (Real-time)</span>
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">Current nutrient levels from sensors</CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            <div className="space-y-2 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
              <div className="flex justify-between">
                <span className="text-sm font-medium text-green-800">Nitrogen (N)</span>
                <span className="text-sm text-green-600 font-semibold">{realTimeData?.nitrogen.toFixed(1)} mg/kg</span>
              </div>
              <Progress value={(realTimeData?.nitrogen || 0) / 100 * 100} className="h-2 bg-green-100" />
            </div>
            <div className="space-y-2 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
              <div className="flex justify-between">
                <span className="text-sm font-medium text-blue-800">Phosphorus (P)</span>
                <span className="text-sm text-blue-600 font-semibold">{realTimeData?.phosphorus.toFixed(1)} mg/kg</span>
              </div>
              <Progress value={(realTimeData?.phosphorus || 0) / 50 * 100} className="h-2 bg-blue-100" />
            </div>
            <div className="space-y-2 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
              <div className="flex justify-between">
                <span className="text-sm font-medium text-yellow-800">Potassium (K)</span>
                <span className="text-sm text-yellow-600 font-semibold">{realTimeData?.potassium.toFixed(1)} mg/kg</span>
              </div>
              <Progress value={(realTimeData?.potassium || 0) / 200 * 100} className="h-2 bg-yellow-100" />
            </div>
          </div>
          <div className="mt-4 text-xs text-gray-500 flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Last updated: {realTimeData ? new Date(realTimeData.timestamp).toLocaleString() : 'N/A'}</span>
          </div>
        </CardContent>
      </Card>

      {/* Registered Farms */}
      <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="text-lg sm:text-xl flex items-center space-x-2">
            <BarChart3 className="h-5 w-5 text-grass-600" />
            <span>Registered Farms</span>
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">Overview of all your farm properties</CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {farms.map((farm, index) => (
              <div 
                key={farm.id} 
                className="p-4 border border-gray-200 rounded-lg bg-gradient-to-br from-white to-gray-50 hover:shadow-lg transition-all duration-300 hover:scale-105"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-sm sm:text-base text-gray-800">{farm.name}</h4>
                  <Badge variant="secondary" className={`text-xs border ${farm.soilHealth >= 85 ? 'bg-green-100 text-green-800 border-green-200' : farm.soilHealth >= 70 ? 'bg-yellow-100 text-yellow-800 border-yellow-200' : 'bg-red-100 text-red-800 border-red-200'}`}>
                    {farm.soilHealth}% Health
                  </Badge>
                </div>
                <p className="text-xs sm:text-sm text-gray-600 mb-1">
                  Size: {farm.size} {farm.unit}
                </p>
                <p className="text-xs text-gray-500 mb-2">
                  Last updated: {farm.lastUpdated}
                </p>
                <Progress value={farm.soilHealth} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recommendation History */}
      <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="flex items-center space-x-2 text-lg sm:text-xl">
            <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-grass-600" />
            <span>Fertilizer Recommendation History</span>
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">Past recommendations and their application status</CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <div className="space-y-4">
            {recommendationLogs.map((log, index) => (
              <div 
                key={log.id} 
                className="flex items-center justify-between p-3 sm:p-4 border border-gray-200 rounded-lg bg-gradient-to-r from-white to-gray-50 hover:shadow-md transition-all duration-300 hover:scale-102"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2 mb-1">
                    <h4 className="font-semibold text-sm sm:text-base text-gray-800">{log.farmName}</h4>
                    <Badge className={`${getStatusColor(log.status)} text-xs w-fit border transition-all duration-200 hover:scale-105`}>
                      {log.status.charAt(0).toUpperCase() + log.status.slice(1)}
                    </Badge>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 mb-1">
                    Primary: <span className="font-medium">{log.primaryFertilizer}</span> | Secondary: <span className="font-medium">{log.secondaryFertilizer}</span>
                  </p>
                  <p className="text-xs text-gray-500">{log.timestamp}</p>
                </div>
                <Leaf className="h-4 w-4 sm:h-5 sm:w-5 text-grass-600 ml-2 animate-pulse" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedFarmOverview;