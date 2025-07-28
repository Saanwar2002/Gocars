'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  MapPin, 
  Clock, 
  Users, 
  Star, 
  Car, 
  Phone,
  MessageCircle,
  Navigation,
  AlertTriangle,
  CheckCircle,
  XCircle,
  User,
  CreditCard,
  Route
} from 'lucide-react'
import { rideSharingService, SharedRideBooking } from '@/services/rideSharingService'
import { Timestamp } from 'firebase/firestore'

interface SharedRideManagerProps {
  userId: string
  userRole: 'passenger' | 'driver'
}

export function SharedRideManager({ userId, userRole }: SharedRideManagerProps) {
  const [activeRides, setActiveRides] = useState<SharedRideBooking[]>([])
  const [completedRides, setCompletedRides] = useState<SharedRideBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRide, setSelectedRide] = useState<SharedRideBooking | null>(null)

  useEffect(() => {
    loadRideHistory()
  }, [userId, userRole])

  /**
   * Load user's ride history
   */
  const loadRideHistory = async () => {
    try {
      setLoading(true)
      const rides = await rideSharingService.getUserRideHistory(userId, userRole)
      
      const active = rides.filter(ride => 
        ['confirmed', 'driver_en_route', 'passenger_picked_up'].includes(ride.status)
      )
      const completed = rides.filter(ride => 
        ['completed', 'cancelled'].includes(ride.status)
      )
      
      setActiveRides(active)
      setCompletedRides(completed)
    } catch (error) {
      console.error('Error loading ride history:', error)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Update ride status
   */
  const updateRideStatus = async (rideId: string, status: SharedRideBooking['status']) => {
    try {
      await rideSharingService.updateRideStatus(rideId, status)
      await loadRideHistory() // Refresh data
    } catch (error) {
      console.error('Error updating ride status:', error)
      alert('Failed to update ride status')
    }
  }

  /**
   * Cancel a ride
   */
  const cancelRide = async (rideId: string, reason: string) => {
    try {
      await rideSharingService.cancelSharedRide(rideId, reason)
      await loadRideHistory() // Refresh data
    } catch (error) {
      console.error('Error cancelling ride:', error)
      alert('Failed to cancel ride')
    }
  }

  /**
   * Rate a completed ride
   */
  const rateRide = async (rideId: string, rating: number, feedback?: string) => {
    try {
      const ratingData = userRole === 'passenger' 
        ? { driverRating: rating, feedback }
        : { passengerRating: rating, feedback }
      
      await rideSharingService.rateSharedRide(rideId, ratingData)
      await loadRideHistory() // Refresh data
    } catch (error) {
      console.error('Error rating ride:', error)
      alert('Failed to submit rating')
    }
  }

  /**
   * Get status badge variant
   */
  const getStatusBadge = (status: SharedRideBooking['status']) => {
    switch (status) {
      case 'confirmed':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Confirmed</Badge>
      case 'driver_en_route':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Driver En Route</Badge>
      case 'passenger_picked_up':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">In Progress</Badge>
      case 'completed':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Completed</Badge>
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  /**
   * Format timestamp
   */
  const formatTime = (timestamp: Timestamp) => {
    return timestamp.toDate().toLocaleString()
  }

  /**
   * Render ride card
   */
  const renderRideCard = (ride: SharedRideBooking, isActive: boolean = false) => (
    <Card key={ride.id} className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-full">
              <Car className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Shared Ride</h3>
              <p className="text-sm text-muted-foreground">
                {userRole === 'passenger' ? 'Driver' : 'Passenger'}: {userRole === 'passenger' ? 'Driver Name' : 'Passenger Name'}
              </p>
            </div>
          </div>
          <div className="text-right">
            {getStatusBadge(ride.status)}
            <p className="text-sm font-semibold mt-1">£{ride.fare.toFixed(2)}</p>
          </div>
        </div>

        <div className="space-y-3 mb-4">
          <div className="flex items-start gap-3">
            <div className="bg-green-100 p-1 rounded-full mt-1">
              <MapPin className="h-3 w-3 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Pickup</p>
              <p className="text-sm text-muted-foreground">
                {ride.pickupLocation.latitude.toFixed(4)}, {ride.pickupLocation.longitude.toFixed(4)}
              </p>
              <p className="text-xs text-muted-foreground">
                {ride.estimatedPickupTime ? formatTime(ride.estimatedPickupTime) : 'Time TBD'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="bg-red-100 p-1 rounded-full mt-1">
              <MapPin className="h-3 w-3 text-red-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Dropoff</p>
              <p className="text-sm text-muted-foreground">
                {ride.dropoffLocation.latitude.toFixed(4)}, {ride.dropoffLocation.longitude.toFixed(4)}
              </p>
              <p className="text-xs text-muted-foreground">
                {ride.estimatedDropoffTime ? formatTime(ride.estimatedDropoffTime) : 'Time TBD'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            <span className="capitalize">{ride.paymentStatus}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>{formatTime(ride.createdAt)}</span>
          </div>
        </div>

        {isActive && (
          <div className="flex gap-2">
            {userRole === 'driver' && ride.status === 'confirmed' && (
              <Button 
                size="sm" 
                onClick={() => updateRideStatus(ride.id!, 'driver_en_route')}
                className="flex-1"
              >
                Start Journey
              </Button>
            )}
            
            {userRole === 'driver' && ride.status === 'driver_en_route' && (
              <Button 
                size="sm" 
                onClick={() => updateRideStatus(ride.id!, 'passenger_picked_up')}
                className="flex-1"
              >
                Passenger Picked Up
              </Button>
            )}
            
            {userRole === 'driver' && ride.status === 'passenger_picked_up' && (
              <Button 
                size="sm" 
                onClick={() => updateRideStatus(ride.id!, 'completed')}
                className="flex-1"
              >
                Complete Ride
              </Button>
            )}
            
            <Button variant="outline" size="sm">
              <MessageCircle className="h-4 w-4" />
            </Button>
            
            <Button variant="outline" size="sm">
              <Phone className="h-4 w-4" />
            </Button>
            
            {ride.status === 'confirmed' && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    Cancel
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Cancel Shared Ride</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to cancel this shared ride? This action cannot be undone.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex gap-2 mt-4">
                    <Button 
                      variant="destructive" 
                      onClick={() => cancelRide(ride.id!, 'User cancelled')}
                      className="flex-1"
                    >
                      Yes, Cancel Ride
                    </Button>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="flex-1">
                        Keep Ride
                      </Button>
                    </DialogTrigger>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        )}

        {!isActive && ride.status === 'completed' && !ride.rating && (
          <div className="flex gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" className="flex-1">
                  Rate {userRole === 'passenger' ? 'Driver' : 'Passenger'}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Rate Your Shared Ride</DialogTitle>
                  <DialogDescription>
                    How was your experience with this shared ride?
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="flex justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <Button
                        key={rating}
                        variant="outline"
                        size="sm"
                        onClick={() => rateRide(ride.id!, rating)}
                        className="p-2"
                      >
                        <Star className="h-4 w-4" />
                        {rating}
                      </Button>
                    ))}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {ride.rating && (
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-medium">
                Rating: {userRole === 'passenger' ? ride.rating.driverRating : ride.rating.passengerRating}/5
              </span>
            </div>
            {ride.rating.feedback && (
              <p className="text-sm text-muted-foreground">{ride.rating.feedback}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading your rides...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">My Shared Rides</h1>
        <p className="text-muted-foreground">
          Manage your active and completed shared rides
        </p>
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="active" className="flex items-center gap-2">
            <Car className="h-4 w-4" />
            Active Rides ({activeRides.length})
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Ride History ({completedRides.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-6">
          <div className="space-y-4">
            {activeRides.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Car className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Active Rides</h3>
                  <p className="text-muted-foreground">
                    You don't have any active shared rides at the moment.
                  </p>
                </CardContent>
              </Card>
            ) : (
              activeRides.map(ride => renderRideCard(ride, true))
            )}
          </div>
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <div className="space-y-4">
            {completedRides.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Ride History</h3>
                  <p className="text-muted-foreground">
                    Your completed shared rides will appear here.
                  </p>
                </CardContent>
              </Card>
            ) : (
              completedRides.map(ride => renderRideCard(ride, false))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Quick Stats */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{activeRides.length}</div>
            <div className="text-sm text-muted-foreground">Active Rides</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{completedRides.length}</div>
            <div className="text-sm text-muted-foreground">Completed Rides</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              £{completedRides.reduce((total, ride) => total + ride.fare, 0).toFixed(2)}
            </div>
            <div className="text-sm text-muted-foreground">Total Saved</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}