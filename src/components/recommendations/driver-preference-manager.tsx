'use client';

import React, { useState, useEffect } from 'react';
import { 
  Star, 
  User, 
  Heart, 
  MessageSquare, 
  Clock, 
  MapPin, 
  TrendingUp,
  Filter,
  Search,
  MoreHorizontal,
  ThumbsUp,
  ThumbsDown,
  Award,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { personalizationService, DriverPreference, UserProfile } from '@/services/personalizationService';

interface DriverPreferenceManagerProps {
  userId: string;
  onDriverSelect?: (driverId: string) => void;
  onPreferenceUpdate?: (preferences: DriverPreference[]) => void;
}

interface DriverDetails {
  id: string;
  name: string;
  rating: number;
  totalRides: number;
  profileImage?: string;
  vehicleType: string;
  vehicleModel: string;
  languages: string[];
  specialties: string[];
  availability: 'online' | 'offline' | 'busy';
  location?: { lat: number; lng: number };
  estimatedArrival?: number; // minutes
}

export function DriverPreferenceManager({ 
  userId, 
  onDriverSelect, 
  onPreferenceUpdate 
}: DriverPreferenceManagerProps) {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [availableDrivers, setAvailableDrivers] = useState<DriverDetails[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'preference' | 'rating' | 'availability'>('preference');
  const [filterBy, setFilterBy] = useState<'all' | 'preferred' | 'available'>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUserProfile();
    loadAvailableDrivers();
  }, [userId]);

  const loadUserProfile = async () => {
    try {
      const profile = await personalizationService.getUserProfile(userId);
      setUserProfile(profile);
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const loadAvailableDrivers = async () => {
    setIsLoading(true);
    try {
      // In a real implementation, this would fetch from your driver service
      const mockDrivers: DriverDetails[] = [
        {
          id: 'driver1',
          name: 'Sarah Johnson',
          rating: 4.9,
          totalRides: 1247,
          profileImage: '/avatars/sarah.jpg',
          vehicleType: 'Premium',
          vehicleModel: 'BMW 5 Series',
          languages: ['English', 'Spanish'],
          specialties: ['Airport transfers', 'Business trips'],
          availability: 'online',
          estimatedArrival: 5
        },
        {
          id: 'driver2',
          name: 'Mike Chen',
          rating: 4.7,
          totalRides: 892,
          profileImage: '/avatars/mike.jpg',
          vehicleType: 'Standard',
          vehicleModel: 'Toyota Camry',
          languages: ['English', 'Mandarin'],
          specialties: ['City tours', 'Long distance'],
          availability: 'online',
          estimatedArrival: 8
        },
        {
          id: 'driver3',
          name: 'Emily Rodriguez',
          rating: 4.8,
          totalRides: 1156,
          profileImage: '/avatars/emily.jpg',
          vehicleType: 'Premium',
          vehicleModel: 'Mercedes E-Class',
          languages: ['English', 'Spanish', 'French'],
          specialties: ['Executive transport', 'Events'],
          availability: 'busy',
          estimatedArrival: 15
        },
        {
          id: 'driver4',
          name: 'James Wilson',
          rating: 4.6,
          totalRides: 743,
          profileImage: '/avatars/james.jpg',
          vehicleType: 'Standard',
          vehicleModel: 'Honda Accord',
          languages: ['English'],
          specialties: ['Family trips', 'Shopping'],
          availability: 'online',
          estimatedArrival: 12
        }
      ];
      
      setAvailableDrivers(mockDrivers);
    } catch (error) {
      console.error('Error loading available drivers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getDriverPreference = (driverId: string): DriverPreference | undefined => {
    return userProfile?.driverPreferences.find(pref => pref.driverId === driverId);
  };

  const updateDriverPreference = async (driverId: string, rating: number, reasons: string[]) => {
    if (!userProfile) return;

    try {
      // Update preference in the profile
      const existingPref = userProfile.driverPreferences.find(pref => pref.driverId === driverId);
      const driver = availableDrivers.find(d => d.id === driverId);
      
      if (!driver) return;

      if (existingPref) {
        existingPref.preferenceScore = rating;
        existingPref.reasons = reasons;
        existingPref.lastRideDate = new Date();
      } else {
        userProfile.driverPreferences.push({
          driverId,
          driverName: driver.name,
          preferenceScore: rating,
          rideCount: 1,
          averageRating: rating,
          reasons,
          lastRideDate: new Date()
        });
      }

      // Update the profile
      await personalizationService.updateUserProfile(userId, {
        driverPreferences: userProfile.driverPreferences
      });

      // Refresh the profile
      await loadUserProfile();
      
      onPreferenceUpdate?.(userProfile.driverPreferences);
    } catch (error) {
      console.error('Error updating driver preference:', error);
    }
  };

  const filteredAndSortedDrivers = availableDrivers
    .filter(driver => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!driver.name.toLowerCase().includes(query) &&
            !driver.vehicleModel.toLowerCase().includes(query) &&
            !driver.specialties.some(s => s.toLowerCase().includes(query))) {
          return false;
        }
      }

      // Category filter
      switch (filterBy) {
        case 'preferred':
          const preference = getDriverPreference(driver.id);
          return preference && preference.preferenceScore >= 4.0;
        case 'available':
          return driver.availability === 'online';
        default:
          return true;
      }
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'preference':
          const prefA = getDriverPreference(a.id)?.preferenceScore || 0;
          const prefB = getDriverPreference(b.id)?.preferenceScore || 0;
          return prefB - prefA;
        case 'rating':
          return b.rating - a.rating;
        case 'availability':
          const availabilityOrder = { online: 3, busy: 2, offline: 1 };
          return availabilityOrder[b.availability] - availabilityOrder[a.availability];
        default:
          return 0;
      }
    });

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'online': return 'bg-green-100 text-green-800';
      case 'busy': return 'bg-yellow-100 text-yellow-800';
      case 'offline': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPreferenceColor = (score: number) => {
    if (score >= 4.5) return 'text-green-600';
    if (score >= 4.0) return 'text-blue-600';
    if (score >= 3.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Loading driver preferences...</span>
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
            <Heart className="h-6 w-6 mr-2 text-red-500" />
            Driver Preferences
          </h2>
          <p className="text-muted-foreground">
            Manage your preferred drivers and discover new ones
          </p>
        </div>
        
        {userProfile && (
          <div className="text-right">
            <div className="text-sm text-muted-foreground">
              {userProfile.driverPreferences.length} preferred drivers
            </div>
            <div className="text-sm">
              {userProfile.driverPreferences.filter(p => p.preferenceScore >= 4.5).length} highly preferred
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search drivers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={filterBy} onValueChange={(value: any) => setFilterBy(value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Drivers</SelectItem>
                <SelectItem value="preferred">Preferred</SelectItem>
                <SelectItem value="available">Available</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="preference">By Preference</SelectItem>
                <SelectItem value="rating">By Rating</SelectItem>
                <SelectItem value="availability">By Availability</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Driver List */}
      <Tabs defaultValue="grid" className="space-y-4">
        <TabsList>
          <TabsTrigger value="grid">Grid View</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="preferred">Preferred Only</TabsTrigger>
        </TabsList>

        <TabsContent value="grid" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAndSortedDrivers.map((driver) => {
              const preference = getDriverPreference(driver.id);
              return (
                <Card key={driver.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={driver.profileImage} alt={driver.name} />
                          <AvatarFallback>{driver.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold">{driver.name}</h3>
                          <div className="flex items-center space-x-1">
                            <Star className="h-4 w-4 text-yellow-500" />
                            <span className="text-sm">{driver.rating}</span>
                            <span className="text-sm text-muted-foreground">
                              ({driver.totalRides} rides)
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onDriverSelect?.(driver.id)}>
                            Request Driver
                          </DropdownMenuItem>
                          <DropdownMenuItem>View Profile</DropdownMenuItem>
                          <DropdownMenuItem>Message Driver</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge className={getAvailabilityColor(driver.availability)}>
                          {driver.availability}
                        </Badge>
                        {driver.estimatedArrival && driver.availability === 'online' && (
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Clock className="h-4 w-4 mr-1" />
                            {driver.estimatedArrival} min away
                          </div>
                        )}
                      </div>

                      <div>
                        <div className="text-sm font-medium">{driver.vehicleType}</div>
                        <div className="text-sm text-muted-foreground">{driver.vehicleModel}</div>
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {driver.specialties.slice(0, 2).map((specialty) => (
                          <Badge key={specialty} variant="outline" className="text-xs">
                            {specialty}
                          </Badge>
                        ))}
                      </div>

                      {preference && (
                        <div className="p-3 bg-muted rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">Your Preference</span>
                            <div className="flex items-center">
                              <Star className={`h-4 w-4 mr-1 ${getPreferenceColor(preference.preferenceScore)}`} />
                              <span className={`text-sm font-medium ${getPreferenceColor(preference.preferenceScore)}`}>
                                {preference.preferenceScore.toFixed(1)}
                              </span>
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {preference.rideCount} rides together
                          </div>
                          {preference.reasons.length > 0 && (
                            <div className="mt-2">
                              <div className="text-xs font-medium mb-1">Why you like this driver:</div>
                              <div className="flex flex-wrap gap-1">
                                {preference.reasons.slice(0, 2).map((reason, index) => (
                                  <Badge key={index} variant="secondary" className="text-xs">
                                    {reason}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={() => onDriverSelect?.(driver.id)}
                          disabled={driver.availability === 'offline'}
                        >
                          {driver.availability === 'online' ? 'Request' : 
                           driver.availability === 'busy' ? 'Join Queue' : 'Unavailable'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateDriverPreference(driver.id, 5, ['Great service'])}
                        >
                          <Heart className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="list" className="space-y-4">
          <div className="space-y-2">
            {filteredAndSortedDrivers.map((driver) => {
              const preference = getDriverPreference(driver.id);
              return (
                <Card key={driver.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={driver.profileImage} alt={driver.name} />
                          <AvatarFallback>{driver.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-medium">{driver.name}</h3>
                            <Badge className={getAvailabilityColor(driver.availability)}>
                              {driver.availability}
                            </Badge>
                            {preference && (
                              <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                                <Heart className="h-3 w-3 mr-1" />
                                Preferred
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <div className="flex items-center">
                              <Star className="h-4 w-4 mr-1 text-yellow-500" />
                              {driver.rating} ({driver.totalRides} rides)
                            </div>
                            <span>{driver.vehicleModel}</span>
                            {driver.estimatedArrival && driver.availability === 'online' && (
                              <div className="flex items-center">
                                <Clock className="h-4 w-4 mr-1" />
                                {driver.estimatedArrival} min
                              </div>
                            )}
                            {preference && (
                              <div className="flex items-center">
                                <TrendingUp className="h-4 w-4 mr-1" />
                                {preference.rideCount} rides together
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateDriverPreference(driver.id, 5, ['Great service'])}
                        >
                          <Heart className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => onDriverSelect?.(driver.id)}
                          disabled={driver.availability === 'offline'}
                        >
                          Request
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="preferred" className="space-y-4">
          {userProfile?.driverPreferences.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No preferred drivers yet</h3>
                <p className="text-muted-foreground">
                  Complete a few rides and rate your drivers to build your preference list.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {userProfile?.driverPreferences
                .sort((a, b) => b.preferenceScore - a.preferenceScore)
                .map((preference) => {
                  const driver = availableDrivers.find(d => d.id === preference.driverId);
                  return (
                    <Card key={preference.driverId}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-4">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={driver?.profileImage} alt={preference.driverName} />
                              <AvatarFallback>
                                {preference.driverName.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            
                            <div>
                              <h3 className="font-semibold">{preference.driverName}</h3>
                              <div className="flex items-center space-x-2 mb-2">
                                <div className="flex items-center">
                                  <Star className={`h-4 w-4 mr-1 ${getPreferenceColor(preference.preferenceScore)}`} />
                                  <span className={`font-medium ${getPreferenceColor(preference.preferenceScore)}`}>
                                    {preference.preferenceScore.toFixed(1)}
                                  </span>
                                </div>
                                <span className="text-sm text-muted-foreground">
                                  {preference.rideCount} rides together
                                </span>
                              </div>
                              
                              <div className="flex flex-wrap gap-1 mb-2">
                                {preference.reasons.map((reason, index) => (
                                  <Badge key={index} variant="secondary" className="text-xs">
                                    {reason}
                                  </Badge>
                                ))}
                              </div>
                              
                              <div className="text-sm text-muted-foreground">
                                Last ride: {preference.lastRideDate.toLocaleDateString()}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            {driver && (
                              <>
                                <Badge className={getAvailabilityColor(driver.availability)}>
                                  {driver.availability}
                                </Badge>
                                <Button
                                  size="sm"
                                  onClick={() => onDriverSelect?.(driver.id)}
                                  disabled={driver.availability === 'offline'}
                                >
                                  Request
                                </Button>
                              </>
                            )}
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
    </div>
  );
}