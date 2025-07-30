'use client';

import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  TrendingUp, 
  Star, 
  MapPin, 
  Clock, 
  User, 
  Gift,
  Heart,
  Target,
  BarChart3,
  Settings,
  RefreshCw,
  Download,
  Eye,
  EyeOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { RecommendationEngine } from './recommendation-engine';
import { DriverPreferenceManager } from './driver-preference-manager';
import { PersonalizedOffers } from './personalized-offers';
import { personalizationService, UserProfile, Recommendation, PersonalizedOffer } from '@/services/personalizationService';

interface PersonalizationDashboardProps {
  userId: string;
  userRole?: 'passenger' | 'driver' | 'operator' | 'admin';
  context?: {
    currentLocation?: { lat: number; lng: number };
    timeOfDay?: string;
    dayOfWeek?: string;
    weatherCondition?: string;
  };
}

interface PersonalizationInsights {
  totalRecommendations: number;
  acceptanceRate: number;
  savingsGenerated: number;
  preferenceAccuracy: number;
  topCategories: Array<{ category: string; count: number }>;
  behaviorTrends: Array<{ metric: string; value: number; change: number }>;
}

export function PersonalizationDashboard({ 
  userId, 
  userRole = 'passenger', 
  context 
}: PersonalizationDashboardProps) {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [insights, setInsights] = useState<PersonalizationInsights | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [privacySettings, setPrivacySettings] = useState({
    shareLocationData: true,
    shareRideHistory: true,
    sharePreferences: true,
    allowPersonalization: true,
    shareWithPartners: false
  });
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadPersonalizationData();
  }, [userId]);

  const loadPersonalizationData = async () => {
    setIsLoading(true);
    try {
      const profile = await personalizationService.getUserProfile(userId);
      setUserProfile(profile);
      
      if (profile) {
        // Generate insights based on profile data
        const mockInsights: PersonalizationInsights = {
          totalRecommendations: 47,
          acceptanceRate: 73.2,
          savingsGenerated: 156.50,
          preferenceAccuracy: 89.5,
          topCategories: [
            { category: 'Ride Suggestions', count: 18 },
            { category: 'Driver Matches', count: 12 },
            { category: 'Pricing Offers', count: 10 },
            { category: 'Route Optimization', count: 7 }
          ],
          behaviorTrends: [
            { metric: 'Average Ride Distance', value: profile.behaviorData.averageRideDistance, change: 5.2 },
            { metric: 'Booking Lead Time', value: profile.behaviorData.bookingLeadTime, change: -12.3 },
            { metric: 'Driver Rating', value: profile.behaviorData.averageRating, change: 2.1 },
            { metric: 'Tip Frequency', value: profile.behaviorData.tipFrequency * 100, change: 8.7 }
          ]
        };
        setInsights(mockInsights);
      }
    } catch (error) {
      console.error('Error loading personalization data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecommendationAction = (recommendation: Recommendation, action: string) => {
    console.log('Recommendation action:', recommendation.id, action);
    // Handle recommendation actions (accept, dismiss, like, etc.)
  };

  const handleOfferClaim = (offer: PersonalizedOffer) => {
    console.log('Offer claimed:', offer.id);
    // Handle offer claiming
  };

  const handleDriverSelect = (driverId: string) => {
    console.log('Driver selected:', driverId);
    // Handle driver selection
  };

  const handlePrivacySettingChange = (setting: string, value: boolean) => {
    setPrivacySettings(prev => ({
      ...prev,
      [setting]: value
    }));
    // In a real implementation, this would update the user's privacy preferences
  };

  const exportPersonalizationData = () => {
    if (!userProfile) return;
    
    const data = {
      profile: userProfile,
      insights: insights,
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gocars-personalization-${userId}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Loading personalization dashboard...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center">
            <Brain className="h-8 w-8 mr-3 text-primary" />
            Personalization Hub
          </h1>
          <p className="text-muted-foreground">
            Your AI-powered travel companion learns and adapts to your preferences
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={loadPersonalizationData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={exportPersonalizationData}>
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="drivers">Drivers</TabsTrigger>
          <TabsTrigger value="offers">Offers</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Rides</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{userProfile?.behaviorData.totalRides || 0}</div>
                <p className="text-xs text-muted-foreground">
                  ${(userProfile?.behaviorData.averageSpending || 0).toFixed(2)} average spending
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Recommendations</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{insights?.totalRecommendations || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {insights?.acceptanceRate.toFixed(1)}% acceptance rate
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Savings Generated</CardTitle>
                <Gift className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${insights?.savingsGenerated.toFixed(2) || '0.00'}</div>
                <p className="text-xs text-green-600">
                  Through personalized offers
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Preference Accuracy</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{insights?.preferenceAccuracy.toFixed(1)}%</div>
                <Progress value={insights?.preferenceAccuracy || 0} className="mt-2" />
              </CardContent>
            </Card>
          </div>

          {/* Quick Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Your Travel Patterns</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {userProfile?.behaviorData.frequentLocations.slice(0, 5).map((location, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{location.location}</span>
                    </div>
                    <Badge variant="secondary">{location.frequency} visits</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recommendation Categories</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {insights?.topCategories.map((category, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{category.category}</span>
                      <span className="text-sm text-muted-foreground">{category.count}</span>
                    </div>
                    <Progress value={(category.count / (insights?.totalRecommendations || 1)) * 100} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Preferred Drivers Preview */}
          {userProfile?.driverPreferences.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Heart className="h-5 w-5 mr-2 text-red-500" />
                  Your Preferred Drivers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {userProfile.driverPreferences.slice(0, 3).map((preference) => (
                    <div key={preference.driverId} className="p-4 border rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <User className="h-4 w-4" />
                        <span className="font-medium">{preference.driverName}</span>
                      </div>
                      <div className="flex items-center space-x-2 mb-2">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm">{preference.preferenceScore.toFixed(1)}</span>
                        <span className="text-sm text-muted-foreground">
                          ({preference.rideCount} rides)
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {preference.reasons.slice(0, 2).map((reason, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {reason}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="recommendations">
          <RecommendationEngine
            userId={userId}
            userRole={userRole}
            context={context}
            onRecommendationAction={handleRecommendationAction}
          />
        </TabsContent>

        <TabsContent value="drivers">
          <DriverPreferenceManager
            userId={userId}
            onDriverSelect={handleDriverSelect}
          />
        </TabsContent>

        <TabsContent value="offers">
          <PersonalizedOffers
            userId={userId}
            onOfferClaim={handleOfferClaim}
          />
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Behavior Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {insights?.behaviorTrends.map((trend, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <div className="font-medium">{trend.metric}</div>
                      <div className="text-2xl font-bold">{trend.value.toFixed(1)}</div>
                    </div>
                    <div className={`flex items-center ${trend.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      <TrendingUp className={`h-4 w-4 mr-1 ${trend.change < 0 ? 'rotate-180' : ''}`} />
                      <span className="font-medium">{Math.abs(trend.change).toFixed(1)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Personalization Performance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="text-sm text-muted-foreground">Recommendation Accuracy</div>
                  <div className="text-2xl font-bold text-blue-600">{insights?.preferenceAccuracy.toFixed(1)}%</div>
                  <Progress value={insights?.preferenceAccuracy || 0} className="mt-2" />
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="text-sm text-muted-foreground">Acceptance Rate</div>
                  <div className="text-2xl font-bold text-green-600">{insights?.acceptanceRate.toFixed(1)}%</div>
                  <Progress value={insights?.acceptanceRate || 0} className="mt-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                Privacy & Data Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Allow Personalization</Label>
                    <div className="text-sm text-muted-foreground">
                      Enable AI-powered recommendations and personalized experiences
                    </div>
                  </div>
                  <Switch
                    checked={privacySettings.allowPersonalization}
                    onCheckedChange={(checked) => handlePrivacySettingChange('allowPersonalization', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Share Location Data</Label>
                    <div className="text-sm text-muted-foreground">
                      Use location data to improve route suggestions and nearby recommendations
                    </div>
                  </div>
                  <Switch
                    checked={privacySettings.shareLocationData}
                    onCheckedChange={(checked) => handlePrivacySettingChange('shareLocationData', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Share Ride History</Label>
                    <div className="text-sm text-muted-foreground">
                      Use ride history to learn your preferences and improve recommendations
                    </div>
                  </div>
                  <Switch
                    checked={privacySettings.shareRideHistory}
                    onCheckedChange={(checked) => handlePrivacySettingChange('shareRideHistory', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Share Preferences</Label>
                    <div className="text-sm text-muted-foreground">
                      Share your preferences to get better driver matches and offers
                    </div>
                  </div>
                  <Switch
                    checked={privacySettings.sharePreferences}
                    onCheckedChange={(checked) => handlePrivacySettingChange('sharePreferences', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Share with Partners</Label>
                    <div className="text-sm text-muted-foreground">
                      Allow sharing anonymized data with trusted partners for better services
                    </div>
                  </div>
                  <Switch
                    checked={privacySettings.shareWithPartners}
                    onCheckedChange={(checked) => handlePrivacySettingChange('shareWithPartners', checked)}
                  />
                </div>
              </div>

              <div className="pt-4 border-t">
                <h4 className="font-medium mb-2">Data Management</h4>
                <div className="flex space-x-2">
                  <Button variant="outline" onClick={exportPersonalizationData}>
                    <Download className="h-4 w-4 mr-2" />
                    Export My Data
                  </Button>
                  <Button variant="outline">
                    <Eye className="h-4 w-4 mr-2" />
                    View Data Usage
                  </Button>
                  <Button variant="destructive" className="ml-auto">
                    <EyeOff className="h-4 w-4 mr-2" />
                    Delete All Data
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Data Usage Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Ride History Records</span>
                  <Badge variant="secondary">{userProfile?.rideHistory.length || 0}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Location Patterns</span>
                  <Badge variant="secondary">{userProfile?.locationPatterns.length || 0}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Driver Preferences</span>
                  <Badge variant="secondary">{userProfile?.driverPreferences.length || 0}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Time Patterns</span>
                  <Badge variant="secondary">{userProfile?.timePatterns.length || 0}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}