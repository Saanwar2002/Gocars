'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Award, 
  Trophy, 
  Star, 
  Gift, 
  Target, 
  TrendingUp,
  Calendar,
  Clock,
  CheckCircle,
  Crown,
  Medal,
  Zap,
  Heart,
  Shield,
  Flame,
  Diamond,
  Sparkles,
  Users,
  DollarSign,
  MapPin,
  ThumbsUp
} from 'lucide-react';
import { driverSupportService, DriverAchievement, DriverReward } from '@/services/driverSupportService';
import { useToast } from '@/hooks/use-toast';

interface DriverRecognitionRewardsProps {
  driverId: string;
  driverName: string;
  driverAvatar?: string;
  driverStats?: {
    totalRides: number;
    rating: number;
    totalEarnings: number;
    completionRate: number;
    responseTime: number;
  };
}

interface AchievementCategory {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  color: string;
  description: string;
}

interface RewardTier {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  color: string;
  minPoints: number;
  benefits: string[];
}

export function DriverRecognitionRewards({ 
  driverId, 
  driverName, 
  driverAvatar,
  driverStats = {
    totalRides: 0,
    rating: 0,
    totalEarnings: 0,
    completionRate: 0,
    responseTime: 0
  }
}: DriverRecognitionRewardsProps) {
  const [achievements, setAchievements] = useState<DriverAchievement[]>([]);
  const [rewards, setRewards] = useState<DriverReward[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPoints, setTotalPoints] = useState(0);
  const [currentTier, setCurrentTier] = useState<RewardTier | null>(null);
  const [nextTier, setNextTier] = useState<RewardTier | null>(null);
  const { toast } = useToast();

  const achievementCategories: AchievementCategory[] = [
    {
      id: 'rating',
      name: 'Service Excellence',
      icon: Star,
      color: 'text-yellow-600 bg-yellow-100',
      description: 'Outstanding customer service and ratings'
    },
    {
      id: 'earnings',
      name: 'Top Earner',
      icon: DollarSign,
      color: 'text-green-600 bg-green-100',
      description: 'Exceptional earning performance'
    },
    {
      id: 'rides',
      name: 'Ride Master',
      icon: MapPin,
      color: 'text-blue-600 bg-blue-100',
      description: 'High volume of completed rides'
    },
    {
      id: 'safety',
      name: 'Safety Champion',
      icon: Shield,
      color: 'text-red-600 bg-red-100',
      description: 'Exemplary safety record'
    },
    {
      id: 'efficiency',
      name: 'Efficiency Expert',
      icon: Zap,
      color: 'text-purple-600 bg-purple-100',
      description: 'Outstanding efficiency and speed'
    },
    {
      id: 'community',
      name: 'Community Leader',
      icon: Users,
      color: 'text-indigo-600 bg-indigo-100',
      description: 'Active community participation'
    }
  ];

  const rewardTiers: RewardTier[] = [
    {
      id: 'bronze',
      name: 'Bronze Driver',
      icon: Medal,
      color: 'text-amber-600 bg-amber-100',
      minPoints: 0,
      benefits: ['Basic support', 'Monthly newsletter', 'Driver community access']
    },
    {
      id: 'silver',
      name: 'Silver Driver',
      icon: Award,
      color: 'text-gray-600 bg-gray-100',
      minPoints: 500,
      benefits: ['Priority support', 'Bonus opportunities', 'Advanced analytics', 'Silver badge']
    },
    {
      id: 'gold',
      name: 'Gold Driver',
      icon: Trophy,
      color: 'text-yellow-600 bg-yellow-100',
      minPoints: 1500,
      benefits: ['VIP support', 'Higher bonuses', 'Exclusive events', 'Gold badge', 'Fee discounts']
    },
    {
      id: 'platinum',
      name: 'Platinum Driver',
      icon: Diamond,
      color: 'text-blue-600 bg-blue-100',
      minPoints: 3000,
      benefits: ['Dedicated support', 'Premium bonuses', 'Beta features', 'Platinum badge', 'Insurance discounts']
    },
    {
      id: 'diamond',
      name: 'Diamond Driver',
      icon: Crown,
      color: 'text-purple-600 bg-purple-100',
      minPoints: 5000,
      benefits: ['Personal account manager', 'Maximum bonuses', 'Early access', 'Diamond badge', 'All perks']
    }
  ];

  useEffect(() => {
    loadData();
  }, [driverId]);

  useEffect(() => {
    calculateTierStatus();
  }, [achievements]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [achievementsData, rewardsData] = await Promise.all([
        driverSupportService.getDriverAchievements(driverId),
        driverSupportService.getDriverRewards(driverId)
      ]);

      setAchievements(achievementsData);
      setRewards(rewardsData);
    } catch (error) {
      console.error('Error loading recognition data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load recognition data. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateTierStatus = () => {
    const points = achievements.reduce((sum, achievement) => sum + achievement.points, 0);
    setTotalPoints(points);

    // Find current tier
    const sortedTiers = [...rewardTiers].sort((a, b) => b.minPoints - a.minPoints);
    const current = sortedTiers.find(tier => points >= tier.minPoints) || rewardTiers[0];
    setCurrentTier(current);

    // Find next tier
    const next = rewardTiers.find(tier => tier.minPoints > points);
    setNextTier(next);
  };

  const claimReward = async (rewardId: string) => {
    try {
      // Update reward as claimed
      const reward = rewards.find(r => r.id === rewardId);
      if (reward) {
        // In a real implementation, this would update the database
        toast({
          title: 'Reward Claimed!',
          description: `You've successfully claimed: ${reward.title}`,
        });
        await loadData();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to claim reward. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const getAchievementIcon = (type: string) => {
    const category = achievementCategories.find(cat => cat.id === type);
    return category ? category.icon : Award;
  };

  const getAchievementColor = (type: string) => {
    const category = achievementCategories.find(cat => cat.id === type);
    return category ? category.color : 'text-gray-600 bg-gray-100';
  };

  const formatDate = (timestamp: any) => {
    return timestamp.toDate().toLocaleDateString();
  };

  const getProgressToNextTier = () => {
    if (!nextTier) return 100;
    const progress = ((totalPoints - (currentTier?.minPoints || 0)) / (nextTier.minPoints - (currentTier?.minPoints || 0))) * 100;
    return Math.min(progress, 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Recognition & Rewards</h1>
          <p className="text-gray-600">Celebrate your achievements and claim your rewards</p>
        </div>
        <div className="flex items-center space-x-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={driverAvatar} />
            <AvatarFallback>{driverName.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{driverName}</p>
            <div className="flex items-center space-x-2">
              {currentTier && (
                <>
                  <currentTier.icon className={`h-4 w-4 ${currentTier.color.split(' ')[0]}`} />
                  <span className="text-sm font-medium">{currentTier.name}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Current Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Star className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm text-gray-600">Total Points</p>
                <p className="text-2xl font-bold">{totalPoints}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Award className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Achievements</p>
                <p className="text-2xl font-bold">{achievements.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Gift className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Available Rewards</p>
                <p className="text-2xl font-bold">{rewards.filter(r => !r.claimedAt).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Driver Rating</p>
                <p className="text-2xl font-bold">{driverStats.rating.toFixed(1)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tier Progress */}
      {nextTier && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5" />
              <span>Tier Progress</span>
            </CardTitle>
            <CardDescription>
              Progress towards {nextTier.name}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {currentTier && <currentTier.icon className={`h-5 w-5 ${currentTier.color.split(' ')[0]}`} />}
                <span className="font-medium">{currentTier?.name}</span>
              </div>
              <div className="flex items-center space-x-2">
                <nextTier.icon className={`h-5 w-5 ${nextTier.color.split(' ')[0]}`} />
                <span className="font-medium">{nextTier.name}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <Progress value={getProgressToNextTier()} className="h-3" />
              <div className="flex justify-between text-sm text-gray-600">
                <span>{totalPoints} points</span>
                <span>{nextTier.minPoints - totalPoints} points to go</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <Tabs defaultValue="achievements" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="rewards">Rewards</TabsTrigger>
          <TabsTrigger value="tiers">Tiers</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
        </TabsList>

        {/* Achievements Tab */}
        <TabsContent value="achievements" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievementCategories.map((category) => {
              const categoryAchievements = achievements.filter(a => a.achievementType === category.id);
              const Icon = category.icon;
              
              return (
                <Card key={category.id}>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center space-x-2 text-lg">
                      <Icon className={`h-5 w-5 ${category.color.split(' ')[0]}`} />
                      <span>{category.name}</span>
                    </CardTitle>
                    <CardDescription>{category.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {categoryAchievements.length === 0 ? (
                        <p className="text-gray-500 text-sm text-center py-4">
                          No achievements in this category yet
                        </p>
                      ) : (
                        categoryAchievements.map((achievement) => (
                          <div key={achievement.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${achievement.badgeColor}`}>
                              <span className="text-lg">{achievement.badgeIcon}</span>
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium text-sm">{achievement.title}</h4>
                              <p className="text-xs text-gray-600">{achievement.description}</p>
                              <div className="flex items-center space-x-2 mt-1">
                                <Star className="h-3 w-3 text-yellow-500" />
                                <span className="text-xs text-gray-500">{achievement.points} points</span>
                                <span className="text-xs text-gray-500">•</span>
                                <span className="text-xs text-gray-500">{formatDate(achievement.unlockedAt)}</span>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Rewards Tab */}
        <TabsContent value="rewards" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rewards.length === 0 ? (
              <Card className="md:col-span-2">
                <CardContent className="p-8 text-center">
                  <Gift className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No rewards available yet. Keep driving to earn rewards!</p>
                </CardContent>
              </Card>
            ) : (
              rewards.map((reward) => (
                <Card key={reward.id} className={`${reward.claimedAt ? 'bg-gray-50' : 'bg-gradient-to-br from-green-50 to-blue-50 border-green-200'}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{reward.title}</CardTitle>
                      {reward.claimedAt ? (
                        <Badge className="bg-gray-100 text-gray-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Claimed
                        </Badge>
                      ) : (
                        <Badge className="bg-green-100 text-green-800">
                          <Gift className="h-3 w-3 mr-1" />
                          Available
                        </Badge>
                      )}
                    </div>
                    <CardDescription>{reward.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {reward.value && (
                      <div className="text-center">
                        <p className="text-3xl font-bold text-green-600">${reward.value}</p>
                        <p className="text-sm text-gray-600">Reward Value</p>
                      </div>
                    )}
                    
                    {reward.code && (
                      <div className="bg-white p-3 rounded border">
                        <p className="text-sm font-medium mb-1">Reward Code:</p>
                        <p className="font-mono text-lg">{reward.code}</p>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>Created: {formatDate(reward.createdAt)}</span>
                      {reward.expiresAt && (
                        <span>Expires: {formatDate(reward.expiresAt)}</span>
                      )}
                    </div>
                    
                    {!reward.claimedAt && (
                      <Button 
                        className="w-full" 
                        onClick={() => claimReward(reward.id)}
                      >
                        <Gift className="h-4 w-4 mr-2" />
                        Claim Reward
                      </Button>
                    )}
                    
                    {reward.claimedAt && (
                      <div className="text-center text-sm text-gray-600">
                        Claimed on {formatDate(reward.claimedAt)}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Tiers Tab */}
        <TabsContent value="tiers" className="space-y-4">
          <div className="space-y-4">
            {rewardTiers.map((tier, index) => {
              const Icon = tier.icon;
              const isCurrentTier = currentTier?.id === tier.id;
              const isUnlocked = totalPoints >= tier.minPoints;
              
              return (
                <Card key={tier.id} className={`${isCurrentTier ? 'ring-2 ring-blue-500 bg-blue-50' : isUnlocked ? 'bg-green-50' : 'bg-gray-50'}`}>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center ${tier.color}`}>
                        <Icon className="h-8 w-8" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-xl font-bold">{tier.name}</h3>
                          {isCurrentTier && (
                            <Badge className="bg-blue-100 text-blue-800">Current Tier</Badge>
                          )}
                          {isUnlocked && !isCurrentTier && (
                            <Badge className="bg-green-100 text-green-800">Unlocked</Badge>
                          )}
                        </div>
                        
                        <p className="text-gray-600 mb-3">
                          {tier.minPoints === 0 ? 'Starting tier' : `Requires ${tier.minPoints} points`}
                        </p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                          {tier.benefits.map((benefit, benefitIndex) => (
                            <div key={benefitIndex} className="flex items-center space-x-2">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              <span className="text-sm">{benefit}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-2xl font-bold">{tier.minPoints}</p>
                        <p className="text-sm text-gray-600">points</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Leaderboard Tab */}
        <TabsContent value="leaderboard" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Trophy className="h-5 w-5" />
                <span>Top Drivers This Month</span>
              </CardTitle>
              <CardDescription>
                See how you rank among other drivers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Mock leaderboard data */}
                {[
                  { rank: 1, name: 'Sarah Johnson', points: 2850, tier: 'Platinum', avatar: '/driver1.jpg' },
                  { rank: 2, name: 'Mike Chen', points: 2720, tier: 'Platinum', avatar: '/driver2.jpg' },
                  { rank: 3, name: 'Emma Davis', points: 2650, tier: 'Gold', avatar: '/driver3.jpg' },
                  { rank: 4, name: driverName, points: totalPoints, tier: currentTier?.name || 'Bronze', avatar: driverAvatar },
                  { rank: 5, name: 'John Smith', points: 1950, tier: 'Gold', avatar: '/driver4.jpg' }
                ].map((driver, index) => (
                  <div key={index} className={`flex items-center space-x-4 p-4 rounded-lg ${driver.name === driverName ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'}`}>
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white border-2 border-gray-300 font-bold">
                      {driver.rank}
                    </div>
                    
                    <Avatar>
                      <AvatarImage src={driver.avatar} />
                      <AvatarFallback>{driver.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <p className="font-medium">{driver.name}</p>
                      <p className="text-sm text-gray-600">{driver.tier} Driver</p>
                    </div>
                    
                    <div className="text-right">
                      <p className="font-bold">{driver.points}</p>
                      <p className="text-sm text-gray-600">points</p>
                    </div>
                    
                    {driver.rank <= 3 && (
                      <div className="flex items-center">
                        {driver.rank === 1 && <Crown className="h-6 w-6 text-yellow-500" />}
                        {driver.rank === 2 && <Medal className="h-6 w-6 text-gray-500" />}
                        {driver.rank === 3 && <Award className="h-6 w-6 text-amber-600" />}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}