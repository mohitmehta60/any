import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { RefreshCw, Wifi, WifiOff } from "lucide-react";
import { useEffect, useState } from "react";
import { fetchThingSpeakData, getMockThingSpeakData, ThingSpeakData } from "@/services/thingSpeakService";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const RealTimeSoilAnalysis = () => {
  const [data, setData] = useState<ThingSpeakData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [historicalData, setHistoricalData] = useState<any[]>([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const realData = await fetchThingSpeakData();
      if (realData) {
        setData(realData);
        setIsConnected(true);
      } else {
        // Fallback to mock data
        setData(getMockThingSpeakData());
        setIsConnected(false);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setData(getMockThingSpeakData());
      setIsConnected(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    
    // Generate mock historical data for charts
    const mockHistorical = Array.from({ length: 24 }, (_, i) => ({
      time: `${23 - i}h ago`,
      nitrogen: 40 + Math.random() * 20,
      phosphorus: 20 + Math.random() * 15,
      potassium: 140 + Math.random() * 40,
      moisture: 60 + Math.random() * 20,
      temperature: 20 + Math.random() * 10,
      humidity: 65 + Math.random() * 20,
      ph: 6.0 + Math.random() * 2
    }));
    setHistoricalData(mockHistorical);

    // Auto-refresh every 2 minutes
    const interval = setInterval(loadData, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getParameterStatus = (value: number, min: number, max: number) => {
    if (value >= min && value <= max) return { status: 'optimal', color: 'text-green-600' };
    if (value < min * 0.8 || value > max * 1.2) return { status: 'critical', color: 'text-red-600' };
    return { status: 'warning', color: 'text-yellow-600' };
  };

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-3 sm:p-6">
                <div className="h-3 sm:h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-6 sm:h-8 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Connection Status and Refresh */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
        <div className="flex items-center space-x-2">
          {isConnected ? (
            <>
              <Wifi className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
              <span className="text-xs sm:text-sm text-green-600">Connected to ThingSpeak</span>
            </>
          ) : (
            <>
              <WifiOff className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
              <span className="text-xs sm:text-sm text-red-600">Using Demo Data</span>
            </>
          )}
        </div>
        <Button onClick={loadData} variant="outline" size="sm" disabled={loading} className="text-xs sm:text-sm">
          <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh Data
        </Button>
      </div>

      {/* Real-time Parameter Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Nitrogen (N)</CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="text-lg sm:text-2xl font-bold mb-2">{data?.nitrogen.toFixed(1)} mg/kg</div>
            <Progress value={(data?.nitrogen || 0) / 100 * 100} className="h-1 sm:h-2 mb-2" />
            <div className={`text-xs ${getParameterStatus(data?.nitrogen || 0, 30, 60).color}`}>
              {getParameterStatus(data?.nitrogen || 0, 30, 60).status.toUpperCase()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Phosphorus (P)</CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="text-lg sm:text-2xl font-bold mb-2">{data?.phosphorus.toFixed(1)} mg/kg</div>
            <Progress value={(data?.phosphorus || 0) / 50 * 100} className="h-1 sm:h-2 mb-2" />
            <div className={`text-xs ${getParameterStatus(data?.phosphorus || 0, 15, 35).color}`}>
              {getParameterStatus(data?.phosphorus || 0, 15, 35).status.toUpperCase()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Potassium (K)</CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="text-lg sm:text-2xl font-bold mb-2">{data?.potassium.toFixed(1)} ppm</div>
            <Progress value={(data?.potassium || 0) / 200 * 100} className="h-1 sm:h-2 mb-2" />
            <div className={`text-xs ${getParameterStatus(data?.potassium || 0, 120, 180).color}`}>
              {getParameterStatus(data?.potassium || 0, 120, 180).status.toUpperCase()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Soil pH</CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="text-lg sm:text-2xl font-bold mb-2">{data?.soilPH.toFixed(1)}</div>
            <Progress value={(data?.soilPH || 0) / 14 * 100} className="h-1 sm:h-2 mb-2" />
            <div className={`text-xs ${getParameterStatus(data?.soilPH || 0, 6.0, 7.5).color}`}>
              {getParameterStatus(data?.soilPH || 0, 6.0, 7.5).status.toUpperCase()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Soil Moisture</CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="text-lg sm:text-2xl font-bold mb-2">{data?.soilMoisture.toFixed(1)}%</div>
            <Progress value={data?.soilMoisture || 0} className="h-1 sm:h-2 mb-2" />
            <div className={`text-xs ${getParameterStatus(data?.soilMoisture || 0, 40, 80).color}`}>
              {getParameterStatus(data?.soilMoisture || 0, 40, 80).status.toUpperCase()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Temperature</CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="text-lg sm:text-2xl font-bold mb-2">{data?.temperature.toFixed(1)}°C</div>
            <Progress value={(data?.temperature || 0) / 50 * 100} className="h-1 sm:h-2 mb-2" />
            <div className={`text-xs ${getParameterStatus(data?.temperature || 0, 15, 35).color}`}>
              {getParameterStatus(data?.temperature || 0, 15, 35).status.toUpperCase()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Humidity</CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="text-lg sm:text-2xl font-bold mb-2">{data?.humidity.toFixed(1)}%</div>
            <Progress value={data?.humidity || 0} className="h-1 sm:h-2 mb-2" />
            <div className={`text-xs ${getParameterStatus(data?.humidity || 0, 50, 80).color}`}>
              {getParameterStatus(data?.humidity || 0, 50, 80).status.toUpperCase()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Last Updated</CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="text-sm font-medium">
              {data ? new Date(data.timestamp).toLocaleTimeString() : 'N/A'}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {data ? new Date(data.timestamp).toLocaleDateString() : 'N/A'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card>
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="text-lg sm:text-xl">NPK Levels Trend (24h)</CardTitle>
            <CardDescription className="text-sm sm:text-base">Historical nutrient levels</CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={historicalData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Line type="monotone" dataKey="nitrogen" stroke="#22c55e" strokeWidth={2} />
                <Line type="monotone" dataKey="phosphorus" stroke="#3b82f6" strokeWidth={2} />
                <Line type="monotone" dataKey="potassium" stroke="#f59e0b" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="text-lg sm:text-xl">Environmental Conditions</CardTitle>
            <CardDescription className="text-sm sm:text-base">Temperature, humidity, and moisture levels</CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={historicalData.slice(-6)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Bar dataKey="temperature" fill="#ef4444" />
                <Bar dataKey="humidity" fill="#06b6d4" />
                <Bar dataKey="moisture" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RealTimeSoilAnalysis;