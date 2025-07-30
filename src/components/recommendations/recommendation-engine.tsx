'use client';

import React, { useState, useEffect } from 'react';
import { 
  Star, 
  MapPin, 
  Clock, 
  DollarSign, 
  TrendingUp, 
  User, 
  Route, 
  Gift,
  Sparkles,
  ChevronRight,
  X,
  ThumbsUp,
  ThumbsDown,
  Bookmark,
  Share2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { personalizationService, Recommendation, UserProfile } from '@/services/personalizationService';

interface RecommendationEngineProps {
  userId: string;
  userRole?: 'passenger' | 'driver' | 'operator' | 'admin';
  context?: {
    currentLocation?: { lat: number; lng: number };
    timeOfDay?: string;
    dayOfWeek?: string;
    weatherCondition?: string;
  };
  onRecommendationAction?: (recommendation: Recommendation, action: string) => void;
}

export function RecommendationEngine({ 
  userId, 
  userRole = 'passenger', 
  context, 
  onRecommendationAction 
}: RecommendationEngineProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [selectedRecommendation, setSelectedRecommendation] = useState<Recommendation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [dismissedRecommendations, setDismissedRecommendations] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadRecommendations();
    loadUserProfile();
  }, [userId, context]);

  const loadRecommendations = async () => {
    setIsLoading(true);
    try {
      const recs = await personalizationService.generateRecommendations(userId, context);
      setRecommendations(recs.filter(rec => !dismissedRecommendations.has(rec.id)));
    } catch (error) {
      console.error('Error loading recommendations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserProfile = async () => {
    try {
      const profile = await personalizationService.getUserProfile(userId);
      setUserProfile(profile);
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const handleRecommendationAction = (recommendation: Recommendation, action: string) => {
    if (action === 'dismiss') {
      setDismissedRecommendations(prev => new Set([...prev, recommendation.id]));
      setRecommendations(prev => prev.filter(rec => rec.id !== recommendation.id));
    }
    
    onRecommendationAction?.(recommendation, action);
  };

  const getRecommendationIcon = (type: Recommendation['type']) => {
    switch (type) {
      case 'ride_suggestion': return <MapPin className="h-5 w-5" />;
      case 'driver_match': return <User className="h-5 w-5" />;
      case 'route_optimization': return <Route className="h-5 w-5" />;
      case 'pricing_offer': return <Gift className="h-5 w-5" />;
      case 'time_suggestion': return <Clock className="h-5 w-5" />;
      default: return <Sparkles className="h-5 w-5" />;
    }
  };

  const getPriorityColor = (priority: Recommendation['priority']) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeColor = (type: Recommendation['type']) => {
    switch (type) {
      case 'ride_suggestion': return 'bg-blue-100 text-blue-800';
      case 'driver_match': return 'bg-purple-100 text-purple-800';
      case 'route_optimization': return 'bg-green-100 text-green-800';
      case 'pricing_offer': return 'bg-orange-100 text-orange-800';
      case 'time_suggestion': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredRecommendations = recommendations.filter(rec => {
    if (activeTab === 'all') return true;
    return rec.type === activeTab;
  });

  const recommendationTypes = [
    { key: 'all', label: 'All', count: recommendations.length },
    { key: 'ride_suggestion', label: 'Rides', count: recommendations.filter(r => r.type === 'ride_suggestion').length },
    { key: 'driver_match', label: 'Drivers', count: recommendations.filter(r => r.type === 'driver_match').length },
    { key: 'pricing_offer', label: 'Offers', count: recommendations.filter(r => r.type === 'pricing_offer').length },
    { key: 'route_optimization', label: 'Routes', count: recommendations.filter(r => r.type === 'route_optimization').length },
    { key: 'time_suggestion', label: 'Timing', count: recommendations.filter(r => r.type === 'time_suggestion').length },
  ];

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Loading personalized recommendations...</span>
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
          <h2 className="text-2xl font-bold flex items-center">
            <Sparkles className="h-6 w-6 mr-2 text-primary" />
            Personalized for You
          </h2>
          <p className="text-muted-foreground">
            Smart recommendations based on your preferences and patterns
          </p>
        </div>
        
        {userProfile && (
          <div className="text-right">
            <div className="text-sm text-muted-foreground">
              {userProfile.behaviorData.totalRides} rides completed
            </div>
            <div className="flex items-center text-sm">
              <Star className="h-4 w-4 text-yellow-500 mr-1" />
              {userProfile.behaviorData.averageRating.toFixed(1)} average rating
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          {recommendationTypes.map(type => (
            <TabsTrigger key={type.key} value={type.key} className="relative">
              {type.label}
              {type.count > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {type.count}
                </Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {filteredRecommendations.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No recommendations available</h3>
                <p className="text-muted-foreground">
                  {activeTab === 'all' 
                    ? "We're learning your preferences. Complete a few more rides to get personalized recommendations!"
                    : `No ${activeTab.replace('_', ' ')} recommendations at the moment.`
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredRecommendations.map((recommendation) => (
                <Card key={recommendation.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="p-2 rounded-lg bg-primary/10 text-primary">
                            {getRecommendationIcon(recommendation.type)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <h3 className="font-semibold">{recommendation.title}</h3>
                              <Badge className={getPriorityColor(recommendation.priority)}>
                                {recommendation.priority}
                              </Badge>
                              <Badge variant="outline" className={getTypeColor(recommendation.type)}>
                                {recommendation.type.replace('_', ' ')}
                              </Badge>
                              {recommendation.isPersonalized && (
                                <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                                  <Sparkles className="h-3 w-3 mr-1" />
                                  Personalized
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                              <span>{Math.round(recommendation.confidence * 100)}% confidence</span>
                              <span>•</span>
                              <span>Valid until {recommendation.validUntil.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>

                        <p className="text-muted-foreground mb-4">{recommendation.description}</p>

                        {/* Estimated Savings */}
                        {recommendation.estimatedSavings && (
                          <div className="flex items-center space-x-4 mb-4 p-3 bg-green-50 rounded-lg">
                            <TrendingUp className="h-5 w-5 text-green-600" />
                            <div className="flex items-center space-x-4 text-sm">
                              {recommendation.estimatedSavings.time && (
                                <div className="flex items-center">
                                  <Clock className="h-4 w-4 mr-1 text-green-600" />
                                  <span>Save {recommendation.estimatedSavings.time} min</span>
                                </div>
                              )}
                              {recommendation.estimatedSavings.money && (
                                <div className="flex items-center">
                                  <DollarSign className="h-4 w-4 mr-1 text-green-600" />
                                  <span>Save ${recommendation.estimatedSavings.money.toFixed(2)}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Reasons */}
                        {recommendation.reasons.length > 0 && (
                          <div className="mb-4">
                            <p className="text-sm font-medium mb-2">Why this recommendation:</p>
                            <ul className="text-sm text-muted-foreground space-y-1">
                              {recommendation.reasons.map((reason, index) => (
                                <li key={index} className="flex items-center">
                                  <div className="w-1.5 h-1.5 bg-primary rounded-full mr-2"></div>
                                  {reason}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Confidence Bar */}
                        <div className="mb-4">
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span>Recommendation confidence</span>
                            <span>{Math.round(recommendation.confidence * 100)}%</span>
                          </div>
                          <Progress value={recommendation.confidence * 100} className="h-2" />
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRecommendationAction(recommendation, 'like')}
                        >
                          <ThumbsUp className="h-4 w-4 mr-1" />
                          Helpful
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRecommendationAction(recommendation, 'dislike')}
                        >
                          <ThumbsDown className="h-4 w-4 mr-1" />
                          Not helpful
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRecommendationAction(recommendation, 'save')}
                        >
                          <Bookmark className="h-4 w-4 mr-1" />
                          Save
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRecommendationAction(recommendation, 'share')}
                        >
                          <Share2 className="h-4 w-4 mr-1" />
                          Share
                        </Button>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedRecommendation(recommendation)}
                        >
                          View Details
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleRecommendationAction(recommendation, 'accept')}
                        >
                          {recommendation.type === 'ride_suggestion' ? 'Book Ride' :
                           recommendation.type === 'driver_match' ? 'Request Driver' :
                           recommendation.type === 'pricing_offer' ? 'Claim Offer' :
                           'Apply'}
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRecommendationAction(recommendation, 'dismiss')}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Recommendation Details Dialog */}
      <Dialog open={!!selectedRecommendation} onOpenChange={() => setSelectedRecommendation(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              {selectedRecommendation && getRecommendationIcon(selectedRecommendation.type)}
              <span className="ml-2">{selectedRecommendation?.title}</span>
            </DialogTitle>
          </DialogHeader>
          
          {selectedRecommendation && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Badge className={getPriorityColor(selectedRecommendation.priority)}>
                  {selectedRecommendation.priority} priority
                </Badge>
                <Badge variant="outline" className={getTypeColor(selectedRecommendation.type)}>
                  {selectedRecommendation.type.replace('_', ' ')}
                </Badge>
                <Badge variant="secondary">
                  {Math.round(selectedRecommendation.confidence * 100)}% confidence
                </Badge>
              </div>

              <p className="text-muted-foreground">{selectedRecommendation.description}</p>

              {selectedRecommendation.estimatedSavings && (
                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-medium mb-2">Estimated Savings</h4>
                  <div className="flex items-center space-x-4">
                    {selectedRecommendation.estimatedSavings.time && (
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1 text-green-600" />
                        <span>{selectedRecommendation.estimatedSavings.time} minutes</span>
                      </div>
                    )}
                    {selectedRecommendation.estimatedSavings.money && (
                      <div className="flex items-center">
                        <DollarSign className="h-4 w-4 mr-1 text-green-600" />
                        <span>${selectedRecommendation.estimatedSavings.money.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div>
                <h4 className="font-medium mb-2">Why this recommendation:</h4>
                <ul className="space-y-1">
                  {selectedRecommendation.reasons.map((reason, index) => (
                    <li key={index} className="flex items-center text-sm text-muted-foreground">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full mr-2"></div>
                      {reason}
                    </li>
                  ))}
                </ul>
              </div>

              {selectedRecommendation.data && (
                <div>
                  <h4 className="font-medium mb-2">Additional Details:</h4>
                  <div className="p-3 bg-muted rounded-lg">
                    <pre className="text-sm whitespace-pre-wrap">
                      {JSON.stringify(selectedRecommendation.data, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Valid until {selectedRecommendation.validUntil.toLocaleString()}
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedRecommendation(null)}
                  >
                    Close
                  </Button>
                  <Button
                    onClick={() => {
                      handleRecommendationAction(selectedRecommendation, 'accept');
                      setSelectedRecommendation(null);
                    }}
                  >
                    {selectedRecommendation.type === 'ride_suggestion' ? 'Book Ride' :
                     selectedRecommendation.type === 'driver_match' ? 'Request Driver' :
                     selectedRecommendation.type === 'pricing_offer' ? 'Claim Offer' :
                     'Apply'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}