'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { 
  MapPin, 
  Clock, 
  Users, 
  Star, 
  Car, 
  Pound, 
  Route,
  Shield,
  MessageCircle,
  Volume2,
  Cigarette,
  Heart,
  User
} from 'lucide-react'
import { rideSharingService, SharedRideRequest, SharedRideOffer, RideMatch } from '@/services/rideSharingService'
import { GeoPoint, Timestamp } from 'firebase/firestore'

interface RideSharingInterfaceProps {
  userId: string
  userRole: 'passenger' | 'driver'
  onBookingComplete?: (bookingId: string) => void
}

export function RideSharingInterface({ userId, userRole, onBookingComplete }: RideSharingInterfaceProps) {
  const [activeTab, setActiveTab] = useState<'request' | 'offer' | 'matches'>('request')
  const [loading, setLoading] = useState(false)
  const [matches, setMatches] = useState<RideMatch[]>([])
  const [currentRequest, setCurrentRequest] = useState<string | null>(null)

  // Request form state
  const [requestForm, setRequestForm] = useState({
    pickupAddress: '',
    pickupCoordinates: { lat: 0, lng: 0 },
    dropoffAddress: '',
    dropoffCoordinates: { lat: 0, lng: 0 },
    requestedTime: '',
    flexibilityMinutes: 15,
    maxDetourMinutes: 20,
    seatsNeeded: 1,
    preferences: {
      gender: 'any' as 'male' | 'female' | 'any',
      smokingAllowed: false,
      petsAllowed: false,
      musicPreference: 'any' as 'none' | 'low' | 'any',
      conversationLevel: 'friendly' as 'quiet' | 'friendly' | 'chatty'
    },
    priceRange: { min: 5, max: 25 }
  })

  // Offer form state
  const [offerForm, setOfferForm] = useState({
    originAddress: '',
    originCoordinates: { lat: 0, lng: 0 },
    destinationAddress: '',
    destinationCoordinates: { lat: 0, lng: 0 },
    departureTime: '',
    availableSeats: 3,
    pricePerSeat: 10,
    vehicleInfo: {
      make: '',
      model: '',
      color: '',
      licensePlate: '',
      capacity: 4
    },
    preferences: {
      passengerGender: 'any' as 'male' | 'female' | 'any',
      smokingAllowed: false,
      petsAllowed: false,
      conversationLevel: 'friendly' as 'quiet' | 'friendly' | 'chatty'
    }
  })

  /**
   * Handle ride request submission
   */
  const handleSubmitRequest = async () => {
    if (!requestForm.pickupAddress || !requestForm.dropoffAddress || !requestForm.requestedTime) {
      alert('Please fill in all required fields')
      return
    }

    setLoading(true)
    try {
      const request: Omit<SharedRideRequest, 'id' | 'createdAt' | 'updatedAt'> = {
        passengerId: userId,
        passengerName: 'Current User', // In real app, get from user profile
        passengerRating: 4.5, // In real app, get from user profile
        pickupLocation: {
          address: requestForm.pickupAddress,
          coordinates: new GeoPoint(requestForm.pickupCoordinates.lat, requestForm.pickupCoordinates.lng)
        },
        dropoffLocation: {
          address: requestForm.dropoffAddress,
          coordinates: new GeoPoint(requestForm.dropoffCoordinates.lat, requestForm.dropoffCoordinates.lng)
        },
        requestedTime: Timestamp.fromDate(new Date(requestForm.requestedTime)),
        flexibilityMinutes: requestForm.flexibilityMinutes,
        maxDetourMinutes: requestForm.maxDetourMinutes,
        seatsNeeded: requestForm.seatsNeeded,
        preferences: requestForm.preferences,
        priceRange: requestForm.priceRange,
        status: 'searching'
      }

      const requestId = await rideSharingService.createRideRequest(request)
      setCurrentRequest(requestId)
      
      // Find matches
      const foundMatches = await rideSharingService.findMatches(requestId)
      setMatches(foundMatches)
      setActiveTab('matches')
      
    } catch (error) {
      console.error('Error submitting request:', error)
      alert('Failed to submit ride request')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Handle ride offer submission
   */
  const handleSubmitOffer = async () => {
    if (!offerForm.originAddress || !offerForm.destinationAddress || !offerForm.departureTime) {
      alert('Please fill in all required fields')
      return
    }

    setLoading(true)
    try {
      const offer: Omit<SharedRideOffer, 'id' | 'createdAt' | 'updatedAt'> = {
        driverId: userId,
        driverName: 'Current Driver', // In real app, get from user profile
        driverRating: 4.7, // In real app, get from user profile
        vehicleInfo: {
          ...offerForm.vehicleInfo,
          capacity: offerForm.vehicleInfo.capacity || 4
        },
        route: {
          origin: {
            address: offerForm.originAddress,
            coordinates: new GeoPoint(offerForm.originCoordinates.lat, offerForm.originCoordinates.lng)
          },
          destination: {
            address: offerForm.destinationAddress,
            coordinates: new GeoPoint(offerForm.destinationCoordinates.lat, offerForm.destinationCoordinates.lng)
          },
          waypoints: []
        },
        departureTime: Timestamp.fromDate(new Date(offerForm.departureTime)),
        availableSeats: offerForm.availableSeats,
        pricePerSeat: offerForm.pricePerSeat,
        preferences: offerForm.preferences,
        status: 'available',
        passengers: []
      }

      await rideSharingService.createRideOffer(offer)
      alert('Ride offer created successfully!')
      
      // Reset form
      setOfferForm({
        ...offerForm,
        originAddress: '',
        destinationAddress: '',
        departureTime: ''
      })
      
    } catch (error) {
      console.error('Error submitting offer:', error)
      alert('Failed to create ride offer')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Handle booking a matched ride
   */
  const handleBookRide = async (match: RideMatch) => {
    setLoading(true)
    try {
      const bookingId = await rideSharingService.bookSharedRide(match)
      alert('Ride booked successfully!')
      onBookingComplete?.(bookingId)
    } catch (error) {
      console.error('Error booking ride:', error)
      alert('Failed to book ride')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Render ride request form
   */
  const renderRequestForm = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="pickup">Pickup Location</Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="pickup"
              placeholder="Enter pickup address"
              value={requestForm.pickupAddress}
              onChange={(e) => setRequestForm({ ...requestForm, pickupAddress: e.target.value })}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="dropoff">Dropoff Location</Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="dropoff"
              placeholder="Enter dropoff address"
              value={requestForm.dropoffAddress}
              onChange={(e) => setRequestForm({ ...requestForm, dropoffAddress: e.target.value })}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="time">Preferred Time</Label>
          <Input
            id="time"
            type="datetime-local"
            value={requestForm.requestedTime}
            onChange={(e) => setRequestForm({ ...requestForm, requestedTime: e.target.value })}
          />
        </div>
        
        <div className="space-y-2">
          <Label>Flexibility (±{requestForm.flexibilityMinutes} min)</Label>
          <Slider
            value={[requestForm.flexibilityMinutes]}
            onValueChange={([value]) => setRequestForm({ ...requestForm, flexibilityMinutes: value })}
            max={60}
            min={5}
            step={5}
            className="w-full"
          />
        </div>
        
        <div className="space-y-2">
          <Label>Max Detour ({requestForm.maxDetourMinutes} min)</Label>
          <Slider
            value={[requestForm.maxDetourMinutes]}
            onValueChange={([value]) => setRequestForm({ ...requestForm, maxDetourMinutes: value })}
            max={45}
            min={10}
            step={5}
            className="w-full"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Seats Needed</Label>
          <Select
            value={requestForm.seatsNeeded.toString()}
            onValueChange={(value) => setRequestForm({ ...requestForm, seatsNeeded: parseInt(value) })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 seat</SelectItem>
              <SelectItem value="2">2 seats</SelectItem>
              <SelectItem value="3">3 seats</SelectItem>
              <SelectItem value="4">4 seats</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label>Price Range (£{requestForm.priceRange.min} - £{requestForm.priceRange.max})</Label>
          <div className="px-3">
            <Slider
              value={[requestForm.priceRange.min, requestForm.priceRange.max]}
              onValueChange={([min, max]) => setRequestForm({ 
                ...requestForm, 
                priceRange: { min, max } 
              })}
              max={50}
              min={3}
              step={1}
              className="w-full"
            />
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Driver Gender Preference</Label>
              <Select
                value={requestForm.preferences.gender}
                onValueChange={(value: 'male' | 'female' | 'any') => 
                  setRequestForm({ 
                    ...requestForm, 
                    preferences: { ...requestForm.preferences, gender: value }
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">No preference</SelectItem>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Conversation Level</Label>
              <Select
                value={requestForm.preferences.conversationLevel}
                onValueChange={(value: 'quiet' | 'friendly' | 'chatty') => 
                  setRequestForm({ 
                    ...requestForm, 
                    preferences: { ...requestForm.preferences, conversationLevel: value }
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="quiet">Quiet ride</SelectItem>
                  <SelectItem value="friendly">Friendly chat</SelectItem>
                  <SelectItem value="chatty">Love to chat</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="smoking"
                checked={requestForm.preferences.smokingAllowed}
                onCheckedChange={(checked) => 
                  setRequestForm({ 
                    ...requestForm, 
                    preferences: { ...requestForm.preferences, smokingAllowed: checked }
                  })
                }
              />
              <Label htmlFor="smoking" className="flex items-center gap-2">
                <Cigarette className="h-4 w-4" />
                Smoking OK
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="pets"
                checked={requestForm.preferences.petsAllowed}
                onCheckedChange={(checked) => 
                  setRequestForm({ 
                    ...requestForm, 
                    preferences: { ...requestForm.preferences, petsAllowed: checked }
                  })
                }
              />
              <Label htmlFor="pets" className="flex items-center gap-2">
                <Heart className="h-4 w-4" />
                Pets OK
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button 
        onClick={handleSubmitRequest} 
        disabled={loading}
        className="w-full"
        size="lg"
      >
        {loading ? 'Finding Rides...' : 'Find Shared Rides'}
      </Button>
    </div>
  )

  /**
   * Render ride offer form
   */
  const renderOfferForm = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="origin">Starting Location</Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="origin"
              placeholder="Enter starting address"
              value={offerForm.originAddress}
              onChange={(e) => setOfferForm({ ...offerForm, originAddress: e.target.value })}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="destination">Destination</Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="destination"
              placeholder="Enter destination address"
              value={offerForm.destinationAddress}
              onChange={(e) => setOfferForm({ ...offerForm, destinationAddress: e.target.value })}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="departure">Departure Time</Label>
          <Input
            id="departure"
            type="datetime-local"
            value={offerForm.departureTime}
            onChange={(e) => setOfferForm({ ...offerForm, departureTime: e.target.value })}
          />
        </div>
        
        <div className="space-y-2">
          <Label>Available Seats</Label>
          <Select
            value={offerForm.availableSeats.toString()}
            onValueChange={(value) => setOfferForm({ ...offerForm, availableSeats: parseInt(value) })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 seat</SelectItem>
              <SelectItem value="2">2 seats</SelectItem>
              <SelectItem value="3">3 seats</SelectItem>
              <SelectItem value="4">4 seats</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="price">Price per Seat (£)</Label>
          <Input
            id="price"
            type="number"
            min="3"
            max="50"
            value={offerForm.pricePerSeat}
            onChange={(e) => setOfferForm({ ...offerForm, pricePerSeat: parseFloat(e.target.value) || 0 })}
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Vehicle Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="make">Make</Label>
              <Input
                id="make"
                placeholder="e.g., Toyota"
                value={offerForm.vehicleInfo.make}
                onChange={(e) => setOfferForm({ 
                  ...offerForm, 
                  vehicleInfo: { ...offerForm.vehicleInfo, make: e.target.value }
                })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              <Input
                id="model"
                placeholder="e.g., Prius"
                value={offerForm.vehicleInfo.model}
                onChange={(e) => setOfferForm({ 
                  ...offerForm, 
                  vehicleInfo: { ...offerForm.vehicleInfo, model: e.target.value }
                })}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              <Input
                id="color"
                placeholder="e.g., Blue"
                value={offerForm.vehicleInfo.color}
                onChange={(e) => setOfferForm({ 
                  ...offerForm, 
                  vehicleInfo: { ...offerForm.vehicleInfo, color: e.target.value }
                })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="plate">License Plate</Label>
              <Input
                id="plate"
                placeholder="e.g., ABC 123"
                value={offerForm.vehicleInfo.licensePlate}
                onChange={(e) => setOfferForm({ 
                  ...offerForm, 
                  vehicleInfo: { ...offerForm.vehicleInfo, licensePlate: e.target.value }
                })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Passenger Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Passenger Gender Preference</Label>
              <Select
                value={offerForm.preferences.passengerGender}
                onValueChange={(value: 'male' | 'female' | 'any') => 
                  setOfferForm({ 
                    ...offerForm, 
                    preferences: { ...offerForm.preferences, passengerGender: value }
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">No preference</SelectItem>
                  <SelectItem value="male">Male passengers</SelectItem>
                  <SelectItem value="female">Female passengers</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Conversation Level</Label>
              <Select
                value={offerForm.preferences.conversationLevel}
                onValueChange={(value: 'quiet' | 'friendly' | 'chatty') => 
                  setOfferForm({ 
                    ...offerForm, 
                    preferences: { ...offerForm.preferences, conversationLevel: value }
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="quiet">Quiet ride</SelectItem>
                  <SelectItem value="friendly">Friendly chat</SelectItem>
                  <SelectItem value="chatty">Love to chat</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="offer-smoking"
                checked={offerForm.preferences.smokingAllowed}
                onCheckedChange={(checked) => 
                  setOfferForm({ 
                    ...offerForm, 
                    preferences: { ...offerForm.preferences, smokingAllowed: checked }
                  })
                }
              />
              <Label htmlFor="offer-smoking" className="flex items-center gap-2">
                <Cigarette className="h-4 w-4" />
                Smoking OK
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="offer-pets"
                checked={offerForm.preferences.petsAllowed}
                onCheckedChange={(checked) => 
                  setOfferForm({ 
                    ...offerForm, 
                    preferences: { ...offerForm.preferences, petsAllowed: checked }
                  })
                }
              />
              <Label htmlFor="offer-pets" className="flex items-center gap-2">
                <Heart className="h-4 w-4" />
                Pets OK
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button 
        onClick={handleSubmitOffer} 
        disabled={loading}
        className="w-full"
        size="lg"
      >
        {loading ? 'Creating Offer...' : 'Create Ride Offer'}
      </Button>
    </div>
  )

  /**
   * Render ride matches
   */
  const renderMatches = () => (
    <div className="space-y-4">
      {matches.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Car className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No matches found</h3>
            <p className="text-muted-foreground">
              Try adjusting your preferences or check back later for new ride offers.
            </p>
          </CardContent>
        </Card>
      ) : (
        matches.map((match) => (
          <Card key={`${match.requestId}-${match.offerId}`} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <Car className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Shared Ride Match</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span>{(match.compatibilityScore * 100).toFixed(0)}% match</span>
                    </div>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  £{match.estimatedFare.toFixed(2)}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{match.estimatedDuration} min trip</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Route className="h-4 w-4 text-muted-foreground" />
                  <span>+{match.detourTime} min detour</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>Shared ride</span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
                <div className="text-center">
                  <div className="text-xs text-muted-foreground">Route</div>
                  <div className="text-sm font-medium">
                    {(match.factors.routeCompatibility * 100).toFixed(0)}%
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-muted-foreground">Time</div>
                  <div className="text-sm font-medium">
                    {(match.factors.timeCompatibility * 100).toFixed(0)}%
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-muted-foreground">Preferences</div>
                  <div className="text-sm font-medium">
                    {(match.factors.preferenceCompatibility * 100).toFixed(0)}%
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-muted-foreground">Price</div>
                  <div className="text-sm font-medium">
                    {(match.factors.priceCompatibility * 100).toFixed(0)}%
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-muted-foreground">Rating</div>
                  <div className="text-sm font-medium">
                    {(match.factors.ratingCompatibility * 100).toFixed(0)}%
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={() => handleBookRide(match)}
                  disabled={loading}
                  className="flex-1"
                >
                  Book This Ride
                </Button>
                <Button variant="outline" size="icon">
                  <MessageCircle className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Ride Sharing</h1>
        <p className="text-muted-foreground">
          Share rides with other passengers to save money and reduce environmental impact
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="request" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Find Ride
          </TabsTrigger>
          <TabsTrigger value="offer" className="flex items-center gap-2">
            <Car className="h-4 w-4" />
            Offer Ride
          </TabsTrigger>
          <TabsTrigger value="matches" className="flex items-center gap-2">
            <Star className="h-4 w-4" />
            Matches ({matches.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="request" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Find a Shared Ride</CardTitle>
              <CardDescription>
                Tell us where you want to go and we'll find compatible rides to share
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderRequestForm()}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="offer" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Offer a Shared Ride</CardTitle>
              <CardDescription>
                Share your journey with other passengers and split the costs
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderOfferForm()}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="matches" className="mt-6">
          <div>
            <div className="mb-4">
              <h2 className="text-xl font-semibold">Available Matches</h2>
              <p className="text-muted-foreground">
                Here are the best ride sharing options we found for you
              </p>
            </div>
            {renderMatches()}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}