import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";
import { History, Leaf, Calendar, TrendingUp, Filter, RefreshCw } from "lucide-react";

interface RecommendationHistoryItem {
  id: string;
  farm_name: string;
  crop_type: string;
  primary_fertilizer: string;
  secondary_fertilizer: string;
  confidence_score: number;
  status: 'pending' | 'applied' | 'scheduled';
  created_at: string;
  applied_date?: string;
}

const RecommendationHistory = () => {
  const [recommendations, setRecommendations] = useState<RecommendationHistoryItem[]>([]);
  const [filteredRecommendations, setFilteredRecommendations] = useState<RecommendationHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [cropFilter, setCropFilter] = useState<string>('all');
  const { toast } = useToast();

  useEffect(() => {
    fetchRecommendationHistory();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [recommendations, statusFilter, cropFilter]);

  const fetchRecommendationHistory = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_user_recommendation_history', {
        limit_count: 100,
        offset_count: 0
      });

      if (error) {
        console.error('Error fetching recommendation history:', error);
        toast({
          title: "Error",
          description: "Failed to load recommendation history",
          variant: "destructive"
        });
        return;
      }

      setRecommendations(data || []);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to load recommendation history",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = recommendations;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(rec => rec.status === statusFilter);
    }

    if (cropFilter !== 'all') {
      filtered = filtered.filter(rec => rec.crop_type.toLowerCase() === cropFilter.toLowerCase());
    }

    setFilteredRecommendations(filtered);
  };

  const updateRecommendationStatus = async (recommendationId: string, newStatus: 'pending' | 'applied' | 'scheduled') => {
    try {
      const { data, error } = await supabase.rpc('update_recommendation_status', {
        recommendation_id: recommendationId,
        new_status: newStatus,
        application_date: newStatus === 'applied' ? new Date().toISOString() : null
      });

      if (error) {
        console.error('Error updating status:', error);
        toast({
          title: "Error",
          description: "Failed to update recommendation status",
          variant: "destructive"
        });
        return;
      }

      // Update local state
      setRecommendations(prev => prev.map(rec => 
        rec.id === recommendationId 
          ? { 
              ...rec, 
              status: newStatus,
              applied_date: newStatus === 'applied' ? new Date().toISOString() : rec.applied_date
            }
          : rec
      ));

      toast({
        title: "Status Updated",
        description: `Recommendation marked as ${newStatus}`,
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'applied': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'scheduled': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const uniqueCrops = Array.from(new Set(recommendations.map(rec => rec.crop_type)));

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-grass-600"></div>
          <span className="ml-2">Loading recommendation history...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
          <div>
            <CardTitle className="flex items-center space-x-2 text-lg sm:text-xl">
              <History className="h-5 w-5 sm:h-6 sm:w-6 text-grass-600" />
              <span>Fertilizer Recommendation History</span>
            </CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Track your past ML-powered fertilizer recommendations
            </CardDescription>
          </div>
          <Button
            onClick={fetchRecommendationHistory}
            variant="outline"
            size="sm"
            className="flex items-center space-x-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="applied">Applied</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Select value={cropFilter} onValueChange={setCropFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Crop" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Crops</SelectItem>
              {uniqueCrops.map(crop => (
                <SelectItem key={crop} value={crop}>{crop}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent className="px-4 sm:px-6">
        {filteredRecommendations.length === 0 ? (
          <div className="text-center py-8">
            <Leaf className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Recommendations Yet</h3>
            <p className="text-gray-600">
              {recommendations.length === 0 
                ? "Start by creating your first fertilizer recommendation using our ML-powered form."
                : "No recommendations match your current filters."
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRecommendations.map((recommendation, index) => (
              <div 
                key={recommendation.id}
                className="p-4 border border-gray-200 rounded-lg bg-gradient-to-r from-white to-gray-50 hover:shadow-md transition-all duration-300"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0">
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 mb-2">
                      <h4 className="font-semibold text-gray-800">
                        {recommendation.farm_name || 'Unknown Farm'}
                      </h4>
                      <Badge variant="secondary" className="w-fit">
                        {recommendation.crop_type}
                      </Badge>
                      <Badge className={`${getStatusColor(recommendation.status)} w-fit`}>
                        {recommendation.status.charAt(0).toUpperCase() + recommendation.status.slice(1)}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600 mb-2">
                      <div>
                        <span className="font-medium">Primary:</span> {recommendation.primary_fertilizer}
                      </div>
                      <div>
                        <span className="font-medium">Secondary:</span> {recommendation.secondary_fertilizer || 'None'}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4 text-xs text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>Created: {formatDate(recommendation.created_at)}</span>
                      </div>
                      {recommendation.applied_date && (
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>Applied: {formatDate(recommendation.applied_date)}</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-1">
                        <TrendingUp className="h-3 w-3" />
                        <span>Confidence: {recommendation.confidence_score}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Status Update Buttons */}
                  <div className="flex flex-row sm:flex-col gap-2">
                    {recommendation.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateRecommendationStatus(recommendation.id, 'scheduled')}
                          className="text-xs"
                        >
                          Schedule
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => updateRecommendationStatus(recommendation.id, 'applied')}
                          className="bg-green-600 hover:bg-green-700 text-xs"
                        >
                          Mark Applied
                        </Button>
                      </>
                    )}
                    {recommendation.status === 'scheduled' && (
                      <Button
                        size="sm"
                        onClick={() => updateRecommendationStatus(recommendation.id, 'applied')}
                        className="bg-green-600 hover:bg-green-700 text-xs"
                      >
                        Mark Applied
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecommendationHistory;