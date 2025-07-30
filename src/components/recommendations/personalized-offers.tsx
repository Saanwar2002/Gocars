'use client';

import React, { useState, useEffect } from 'react';
import { 
  Gift, 
  Percent, 
  Star, 
  Clock, 
  DollarSign, 
  TrendingUp, 
  Award,
  Calendar,
  MapPin,
  Users,
  Zap,
  Target,
  Copy,
  Share2,
  Check,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { personalizationService, PersonalizedOffer, UserProfile } from '@/services/personalizationService';

interface PersonalizedOffersProps {
  userId: string;
  onOfferClaim?: (offer: PersonalizedOffer) => void;
  onOfferShare?: (offer: PersonalizedOffer) => void;
}

interface OfferCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  count: number;
}

export function PersonalizedOffers({ 
  userId, 
  onOfferClaim, 
  onOfferShare 
}: PersonalizedOffersProps) {
  const [offers, setOffers] = useState<PersonalizedOffer[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [selectedOffer, setSelectedOffer] = useState<PersonalizedOffer | null>(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [claimedOffers, setClaimedOffers] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadOffers();
    loadUserProfile();
  }, [userId]);

  const loadOffers = async () => {
    setIsLoading(true);
    try {
      // In a real implementation, this would fetch from your offers service
      const mockOffers: PersonalizedOffer[] = [
        {
          id: 'loyalty_discount_1',
          userId,
          offerType: 'discount',
          title: 'Loyal Customer Reward',
          description: 'You\'ve completed 50+ rides! Enjoy 20% off your next 3 rides.',
          discountPercentage: 20,
          conditions: ['Valid for next 3 rides', 'Cannot be combined with other offers'],
          validFrom: new Date(),
          validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          usageLimit: 3,
          usedCount: 0,
          isActive: true,
          targetBehavior: 'loyalty_retention'
        },
        {
          id: 'offpeak_special_1',
          userId,
          offerType: 'discount',
          title: 'Off-Peak Hours Special',
          description: 'Travel between 10 AM - 3 PM and save 25% on all rides.',
          discountPercentage: 25,
          conditions: ['Valid 10 AM - 3 PM weekdays', 'Minimum ride value $10'],
          validFrom: new Date(),
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          usageLimit: 10,
          usedCount: 2,
          isActive: true,
          targetBehavior: 'off_peak_usage'
        },
        {
          id: 'premium_upgrade_1',
          userId,
          offerType: 'upgrade',
          title: 'Free Premium Upgrade',
          description: 'Experience luxury! Get a free upgrade to Premium for your next ride.',
          conditions: ['One-time use', 'Subject to vehicle availability'],
          validFrom: new Date(),
          validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          usageLimit: 1,
          usedCount: 0,
          isActive: true,
          targetBehavior: 'premium_conversion'
        },
        {
          id: 'weekend_bonus_1',
          userId,
          offerType: 'loyalty_bonus',
          title: 'Weekend Warrior Bonus',
          description: 'Take 3 rides this weekend and earn 2x loyalty points!',
          conditions: ['Valid Saturday-Sunday', 'Minimum 3 rides required'],
          validFrom: new Date(),
          validUntil: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          usageLimit: 1,
          usedCount: 0,
          isActive: true,
          targetBehavior: 'weekend_engagement'
        },
        {
          id: 'referral_bonus_1',
          userId,
          offerType: 'free_ride',
          title: 'Refer & Ride Free',
          description: 'Refer a friend and both get a free ride up to $25!',
          discountAmount: 25,
          conditions: ['Friend must complete first ride', 'Maximum $25 value'],
          validFrom: new Date(),
          validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
          usageLimit: 5,
          usedCount: 1,
          isActive: true,
          targetBehavior: 'referral_growth'
        }
      ];
      
      setOffers(mockOffers);
    } catch (error) {
      console.error('Error loading offers:', error);
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

  const handleClaimOffer = async (offer: PersonalizedOffer) => {
    try {
      // In a real implementation, this would call your offers service
      setClaimedOffers(prev => new Set([...prev, offer.id]));
      
      // Update the offer usage
      const updatedOffers = offers.map(o => 
        o.id === offer.id 
          ? { ...o, usedCount: o.usedCount + 1 }
          : o
      );
      setOffers(updatedOffers);
      
      onOfferClaim?.(offer);
    } catch (error) {
      console.error('Error claiming offer:', error);
    }
  };

  const getOfferIcon = (offerType: PersonalizedOffer['offerType']) => {
    switch (offerType) {
      case 'discount': return <Percent className="h-5 w-5" />;
      case 'free_ride': return <Gift className="h-5 w-5" />;
      case 'upgrade': return <TrendingUp className="h-5 w-5" />;
      case 'loyalty_bonus': return <Award className="h-5 w-5" />;
      default: return <Gift className="h-5 w-5" />;
    }
  };

  const getOfferColor = (offerType: PersonalizedOffer['offerType']) => {
    switch (offerType) {
      case 'discount': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'free_ride': return 'bg-green-100 text-green-800 border-green-200';
      case 'upgrade': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'loyalty_bonus': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const calculateSavings = (offer: PersonalizedOffer): number => {
    if (!userProfile) return 0;
    
    const avgSpending = userProfile.behaviorData.averageSpending;
    
    if (offer.discountPercentage) {
      return avgSpending * (offer.discountPercentage / 100);
    }
    
    if (offer.discountAmount) {
      return Math.min(offer.discountAmount, avgSpending);
    }
    
    return 0;
  };

  const getDaysRemaining = (validUntil: Date): number => {
    const now = new Date();
    const diffTime = validUntil.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const categories: OfferCategory[] = [
    {
      id: 'all',
      name: 'All Offers',
      icon: <Gift className="h-4 w-4" />,
      description: 'All available offers',
      count: offers.length
    },
    {
      id: 'discount',
      name: 'Discounts',
      icon: <Percent className="h-4 w-4" />,
      description: 'Percentage and amount discounts',
      count: offers.filter(o => o.offerType === 'discount').length
    },
    {
      id: 'free_ride',
      name: 'Free Rides',
      icon: <Gift className="h-4 w-4" />,
      description: 'Complimentary ride offers',
      count: offers.filter(o => o.offerType === 'free_ride').length
    },
    {
      id: 'upgrade',
      name: 'Upgrades',
      icon: <TrendingUp className="h-4 w-4" />,
      description: 'Vehicle and service upgrades',
      count: offers.filter(o => o.offerType === 'upgrade').length
    },
    {
      id: 'loyalty_bonus',
      name: 'Loyalty',
      icon: <Award className="h-4 w-4" />,
      description: 'Loyalty points and bonuses',
      count: offers.filter(o => o.offerType === 'loyalty_bonus').length
    }
  ];

  const filteredOffers = offers.filter(offer => {
    if (activeCategory === 'all') return true;
    return offer.offerType === activeCategory;
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Loading personalized offers...</span>
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
            <Gift className="h-6 w-6 mr-2 text-primary" />
            Personalized Offers
          </h2>
          <p className="text-muted-foreground">
            Exclusive deals tailored just for you
          </p>
        </div>
        
        {userProfile && (
          <div className="text-right">
            <div className="text-sm text-muted-foreground">
              {offers.filter(o => o.isActive).length} active offers
            </div>
            <div className="text-sm">
              Potential savings: ${offers.reduce((sum, offer) => sum + calculateSavings(offer), 0).toFixed(2)}
            </div>
          </div>
        )}
      </div>

      {/* Category Tabs */}
      <Tabs value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList className="grid w-full grid-cols-5">
          {categories.map(category => (
            <TabsTrigger key={category.id} value={category.id} className="relative">
              <div className="flex items-center space-x-1">
                {category.icon}
                <span>{category.name}</span>
                {category.count > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {category.count}
                  </Badge>
                )}
              </div>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeCategory} className="space-y-4">
          {filteredOffers.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Gift className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No offers available</h3>
                <p className="text-muted-foreground">
                  {activeCategory === 'all' 
                    ? "Complete more rides to unlock personalized offers!"
                    : `No ${activeCategory.replace('_', ' ')} offers available at the moment.`
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredOffers.map((offer) => {
                const isExpiringSoon = getDaysRemaining(offer.validUntil) <= 3;
                const isAlmostUsed = offer.usedCount >= offer.usageLimit * 0.8;
                const isClaimed = claimedOffers.has(offer.id);
                const estimatedSavings = calculateSavings(offer);

                return (
                  <Card key={offer.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 rounded-lg bg-primary/10 text-primary">
                            {getOfferIcon(offer.offerType)}
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">{offer.title}</h3>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge className={getOfferColor(offer.offerType)}>
                                {offer.offerType.replace('_', ' ')}
                              </Badge>
                              {isExpiringSoon && (
                                <Badge variant="destructive" className="animate-pulse">
                                  <Clock className="h-3 w-3 mr-1" />
                                  Expires soon
                                </Badge>
                              )}
                              {isClaimed && (
                                <Badge variant="secondary" className="bg-green-100 text-green-800">
                                  <Check className="h-3 w-3 mr-1" />
                                  Claimed
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          {offer.discountPercentage && (
                            <div className="text-2xl font-bold text-primary">
                              {offer.discountPercentage}% OFF
                            </div>
                          )}
                          {offer.discountAmount && (
                            <div className="text-2xl font-bold text-primary">
                              ${offer.discountAmount} OFF
                            </div>
                          )}
                          {estimatedSavings > 0 && (
                            <div className="text-sm text-muted-foreground">
                              Save ~${estimatedSavings.toFixed(2)}
                            </div>
                          )}
                        </div>
                      </div>

                      <p className="text-muted-foreground mb-4">{offer.description}</p>

                      {/* Usage Progress */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span>Usage</span>
                          <span>{offer.usedCount} / {offer.usageLimit} used</span>
                        </div>
                        <Progress 
                          value={(offer.usedCount / offer.usageLimit) * 100} 
                          className={`h-2 ${isAlmostUsed ? 'bg-red-100' : 'bg-gray-100'}`}
                        />
                      </div>

                      {/* Validity */}
                      <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          <span>Valid until {offer.validUntil.toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          <span className={isExpiringSoon ? 'text-red-600 font-medium' : ''}>
                            {getDaysRemaining(offer.validUntil)} days left
                          </span>
                        </div>
                      </div>

                      {/* Conditions */}
                      {offer.conditions.length > 0 && (
                        <div className="mb-4">
                          <p className="text-sm font-medium mb-2">Terms & Conditions:</p>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            {offer.conditions.map((condition, index) => (
                              <li key={index} className="flex items-start">
                                <AlertCircle className="h-3 w-3 mr-2 mt-0.5 flex-shrink-0" />
                                {condition}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center justify-between pt-4 border-t">
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              navigator.clipboard.writeText(`Check out this GoCars offer: ${offer.title}`);
                            }}
                          >
                            <Copy className="h-4 w-4 mr-1" />
                            Copy
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onOfferShare?.(offer)}
                          >
                            <Share2 className="h-4 w-4 mr-1" />
                            Share
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedOffer(offer)}
                          >
                            View Details
                          </Button>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Button
                            onClick={() => handleClaimOffer(offer)}
                            disabled={offer.usedCount >= offer.usageLimit || isClaimed}
                            className={isClaimed ? 'bg-green-600 hover:bg-green-700' : ''}
                          >
                            {isClaimed ? (
                              <>
                                <Check className="h-4 w-4 mr-1" />
                                Claimed
                              </>
                            ) : offer.usedCount >= offer.usageLimit ? (
                              'Fully Used'
                            ) : (
                              <>
                                <Zap className="h-4 w-4 mr-1" />
                                Claim Offer
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Offer Details Dialog */}
      <Dialog open={!!selectedOffer} onOpenChange={() => setSelectedOffer(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              {selectedOffer && getOfferIcon(selectedOffer.offerType)}
              <span className="ml-2">{selectedOffer?.title}</span>
            </DialogTitle>
          </DialogHeader>
          
          {selectedOffer && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Badge className={getOfferColor(selectedOffer.offerType)}>
                  {selectedOffer.offerType.replace('_', ' ')}
                </Badge>
                <Badge variant="outline">
                  {selectedOffer.usedCount} / {selectedOffer.usageLimit} used
                </Badge>
                <Badge variant="secondary">
                  {getDaysRemaining(selectedOffer.validUntil)} days remaining
                </Badge>
              </div>

              <p className="text-muted-foreground">{selectedOffer.description}</p>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Discount Value</h4>
                  <div className="text-2xl font-bold text-primary">
                    {selectedOffer.discountPercentage && `${selectedOffer.discountPercentage}%`}
                    {selectedOffer.discountAmount && `$${selectedOffer.discountAmount}`}
                    {!selectedOffer.discountPercentage && !selectedOffer.discountAmount && 'Special Offer'}
                  </div>
                </div>
                
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Estimated Savings</h4>
                  <div className="text-2xl font-bold text-green-600">
                    ${calculateSavings(selectedOffer).toFixed(2)}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Terms & Conditions:</h4>
                <ul className="space-y-1">
                  {selectedOffer.conditions.map((condition, index) => (
                    <li key={index} className="flex items-start text-sm text-muted-foreground">
                      <AlertCircle className="h-3 w-3 mr-2 mt-0.5 flex-shrink-0" />
                      {condition}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium mb-2">How to Use:</h4>
                <ol className="text-sm space-y-1">
                  <li>1. Click "Claim Offer" to activate this deal</li>
                  <li>2. Book your ride through the GoCars app</li>
                  <li>3. The discount will be automatically applied at checkout</li>
                  <li>4. Enjoy your savings!</li>
                </ol>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Valid until {selectedOffer.validUntil.toLocaleString()}
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedOffer(null)}
                  >
                    Close
                  </Button>
                  <Button
                    onClick={() => {
                      handleClaimOffer(selectedOffer);
                      setSelectedOffer(null);
                    }}
                    disabled={selectedOffer.usedCount >= selectedOffer.usageLimit || claimedOffers.has(selectedOffer.id)}
                  >
                    <Zap className="h-4 w-4 mr-1" />
                    Claim Offer
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