/**
 * Event System Demo Component
 * Demonstrates real-time event broadcasting and subscription
 */

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  useRideEvents,
  useDriverStatus,
  useLocationEvents,
  useEmergencyEvents,
  useNotificationEvents,
  useSystemEvents,
  useEventSystemStats,
  useEventHistory
} from '@/hooks/useEventSystem'
import { 
  Car, 
  MapPin, 
  AlertTriangle, 
  Bell, 
  Activity, 
  Users, 
  Navigation, 
  Zap,
  Clock,
  CheckCircle,
  XCircle,
  Play,
  Square,
  Send,
  Shield,
  BarChart3
} from 'lucide-react'

interface EventSystemDemoProps {
  userId: string
  userRole: 'passenger' | 'driver' | 'operator' | 'admin'
  className?: string
}

export const EventSystemDemo: React.FC<EventSystemDemoProps> = ({
  userId,
  userRole,
  className
}) => {
  const [activeTab, setActiveTab] = useState('rides')
  
  // Event hooks
  const rideEvents = useRideEvents(userId, userRole)
  const driverStatus = useDriverStatus(userId, userRole)
  const locationEvents = useLocationEvents(userId, userRole)
  const emergencyEvents = useEmergencyEvents(userId, userRole)
  const notificationEvents = useNotificationEvents(userId, userRole)
  const systemEvents = useSystemEvents(userId, userRole)
  const eventStats = useEventSystemStats()
  const eventHistory = useEventHistory({ limit: 20 })

  // Form states
  const [rideForm, setRideForm] = useState({
    pickupLat: 40.7128,
    pickupLng: -74.0060,
    dropoffLat: 40.7589,
    dropoffLng: -73.9851,
    pickupAddress: 'Times Square, NYC',
    dropoffAddress: 'Central Park, NYC'
  })

  const [locationForm, setLocationForm] = useState({
    lat: 40.7128,
    lng: -74.0060,
    heading: 0,
    speed: 0
  })

  const [emergencyForm, setEmergencyForm] = useState({
    alertType: 'sos' as 'sos' | 'panic' | 'accident' | 'route_deviation',
    severity: 'high' as 'low' | 'medium' | 'high' | 'critical',
    description: ''
  })

  const [notificationForm, setNotificationForm] = useState({
    recipientId: '',
    title: '',
    message: '',
    category: 'system' as 'ride' | 'payment' | 'system' | 'promotion',
    priority: 'normal' as 'low' | 'normal' | 'high' | 'urgent'
  })

  // Event handlers
  const handleRequestRide = () => {
    rideEvents.requestRide(
      userId,
      { lat: rideForm.pickupLat, lng: rideForm.pickupLng, address: rideForm.pickupAddress },
      { lat: rideForm.dropoffLat, lng: rideForm.dropoffLng, address: rideForm.dropoffAddress },
      15 // 15 minutes estimated
    )
  }

  const handleUpdateLocation = () => {
    locationEvents.updateLocation({
      lat: locationForm.lat,
      lng: locationForm.lng,
      heading: locationForm.heading,
      speed: locationForm.speed
    })
  }

  const handleTriggerEmergency = () => {
    emergencyEvents.triggerEmergency(
      emergencyForm.alertType,
      { lat: locationForm.lat, lng: locationForm.lng },
      emergencyForm.severity,
      emergencyForm.description
    )
  }

  const handleSendNotification = () => {
    notificationEvents.sendNotification(
      notificationForm.recipientId || userId,
      notificationForm.title,
      notificationForm.message,
      notificationForm.category,
      notificationForm.priority
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Event System Demo</h2>
          <p className="text-muted-foreground">
            Real-time event broadcasting and subscription for {userRole} user
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{userId}</Badge>
          <Badge>{userRole}</Badge>
        </div>
      </div>

      {/* Event System Stats */}
      {eventStats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Event System Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{eventStats.totalEvents}</div>
                <div className="text-sm text-muted-foreground">Total Events</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{eventStats.activeSubscriptions}</div>
                <div className="text-sm text-muted-foreground">Active Subscriptions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{eventStats.broadcastRules}</div>
                <div className="text-sm text-muted-foreground">Broadcast Rules</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{eventStats.queuedEvents}</div>
                <div className="text-sm text-muted-foreground">Queued Events</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Demo Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="rides">Rides</TabsTrigger>
          <TabsTrigger value="drivers">Drivers</TabsTrigger>
          <TabsTrigger value="location">Location</TabsTrigger>
          <TabsTrigger value="emergency">Emergency</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        {/* Rides Tab */}
        <TabsContent value="rides" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Car className="h-5 w-5" />
                  Ride Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>Pickup Location</Label>
                    <div className="grid grid-cols-2 gap-1">
                      <Input
                        type="number"
                        step="0.0001"
                        value={rideForm.pickupLat}
                        onChange={(e) => setRideForm(prev => ({ ...prev, pickupLat: parseFloat(e.target.value) }))}
                        placeholder="Latitude"
                      />
                      <Input
                        type="number"
                        step="0.0001"
                        value={rideForm.pickupLng}
                        onChange={(e) => setRideForm(prev => ({ ...prev, pickupLng: parseFloat(e.target.value) }))}
                        placeholder="Longitude"
                      />
                    </div>
                    <Input
                      value={rideForm.pickupAddress}
                      onChange={(e) => setRideForm(prev => ({ ...prev, pickupAddress: e.target.value }))}
                      placeholder="Pickup address"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Dropoff Location</Label>
                    <div className="grid grid-cols-2 gap-1">
                      <Input
                        type="number"
                        step="0.0001"
                        value={rideForm.dropoffLat}
                        onChange={(e) => setRideForm(prev => ({ ...prev, dropoffLat: parseFloat(e.target.value) }))}
                        placeholder="Latitude"
                      />
                      <Input
                        type="number"
                        step="0.0001"
                        value={rideForm.dropoffLng}
                        onChange={(e) => setRideForm(prev => ({ ...prev, dropoffLng: parseFloat(e.target.value) }))}
                        placeholder="Longitude"
                      />
                    </div>
                    <Input
                      value={rideForm.dropoffAddress}
                      onChange={(e) => setRideForm(prev => ({ ...prev, dropoffAddress: e.target.value }))}
                      placeholder="Dropoff address"
                      className="mt-1"
                    />
                  </div>
                </div>
                
                <Button onClick={handleRequestRide} className="w-full">
                  <Car className="h-4 w-4 mr-2" />
                  Request Ride
                </Button>

                {/* Active Rides */}
                <div className="space-y-2">
                  <Label>Active Rides ({rideEvents.activeRides.length})</Label>
                  {rideEvents.activeRides.map((ride) => (
                    <div key={ride.rideId} className="p-2 bg-muted rounded flex items-center justify-between">
                      <div>
                        <div className="font-medium text-sm">{ride.rideId}</div>
                        <div className="text-xs text-muted-foreground">
                          {ride.location?.pickup.address} → {ride.location?.dropoff.address}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {userRole === 'driver' && ride.type === 'ride_requested' && (
                          <Button size="sm" onClick={() => rideEvents.acceptRide(ride.rideId, userId)}>
                            Accept
                          </Button>
                        )}
                        {ride.type === 'ride_accepted' && (
                          <Button size="sm" onClick={() => rideEvents.startRide(ride.rideId)}>
                            Start
                          </Button>
                        )}
                        {ride.type === 'ride_started' && (
                          <Button size="sm" onClick={() => rideEvents.completeRide(ride.rideId, 25.50, 18)}>
                            Complete
                          </Button>
                        )}
                        <Button size="sm" variant="outline" onClick={() => rideEvents.cancelRide(ride.rideId, 'User cancelled')}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ))}
                  {rideEvents.activeRides.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">No active rides</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Ride Events</CardTitle>
                <CardDescription>{rideEvents.rideEvents.length} events</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-2">
                    {rideEvents.rideEvents.slice(-10).map((event, index) => (
                      <div key={index} className="p-2 bg-muted rounded text-sm">
                        <div className="flex items-center justify-between mb-1">
                          <Badge variant="outline">{event.type.replace('ride_', '')}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(event.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-xs">Ride: {event.rideId}</p>
                        <p className="text-xs">Passenger: {event.passengerId}</p>
                        {event.driverId && <p className="text-xs">Driver: {event.driverId}</p>}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Drivers Tab */}
        <TabsContent value="drivers" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Driver Status Control
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Current Status:</span>
                  <Badge variant={
                    driverStatus.myStatus === 'online' ? 'default' :
                    driverStatus.myStatus === 'busy' ? 'secondary' : 'outline'
                  }>
                    {driverStatus.myStatus}
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <Button 
                    onClick={() => driverStatus.goOnline({ lat: locationForm.lat, lng: locationForm.lng })}
                    variant={driverStatus.myStatus === 'online' ? 'default' : 'outline'}
                    size="sm"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Online
                  </Button>
                  <Button 
                    onClick={() => driverStatus.setBusy({ lat: locationForm.lat, lng: locationForm.lng })}
                    variant={driverStatus.myStatus === 'busy' ? 'default' : 'outline'}
                    size="sm"
                  >
                    <Clock className="h-4 w-4 mr-1" />
                    Busy
                  </Button>
                  <Button 
                    onClick={() => driverStatus.goOffline()}
                    variant={driverStatus.myStatus === 'offline' ? 'default' : 'outline'}
                    size="sm"
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Offline
                  </Button>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Online Drivers:</span>
                    <Badge>{driverStatus.onlineDrivers.length}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Busy Drivers:</span>
                    <Badge variant="secondary">{driverStatus.busyDrivers.length}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Driver Status Updates</CardTitle>
                <CardDescription>{driverStatus.driverStatuses.length} drivers tracked</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-2">
                    {driverStatus.driverStatuses.slice(-10).map((status, index) => (
                      <div key={index} className="p-2 bg-muted rounded text-sm">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">{status.driverId}</span>
                          <Badge variant={
                            status.type === 'driver_online' ? 'default' :
                            status.type === 'driver_busy' ? 'secondary' : 'outline'
                          }>
                            {status.type.replace('driver_', '')}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {new Date(status.timestamp).toLocaleTimeString()}
                        </p>
                        {status.location && (
                          <p className="text-xs">
                            Location: {status.location.lat.toFixed(4)}, {status.location.lng.toFixed(4)}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Location Tab */}
        <TabsContent value="location" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Location Updates
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>Latitude</Label>
                    <Input
                      type="number"
                      step="0.0001"
                      value={locationForm.lat}
                      onChange={(e) => setLocationForm(prev => ({ ...prev, lat: parseFloat(e.target.value) }))}
                    />
                  </div>
                  <div>
                    <Label>Longitude</Label>
                    <Input
                      type="number"
                      step="0.0001"
                      value={locationForm.lng}
                      onChange={(e) => setLocationForm(prev => ({ ...prev, lng: parseFloat(e.target.value) }))}
                    />
                  </div>
                  <div>
                    <Label>Heading (°)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="360"
                      value={locationForm.heading}
                      onChange={(e) => setLocationForm(prev => ({ ...prev, heading: parseInt(e.target.value) }))}
                    />
                  </div>
                  <div>
                    <Label>Speed (km/h)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={locationForm.speed}
                      onChange={(e) => setLocationForm(prev => ({ ...prev, speed: parseInt(e.target.value) }))}
                    />
                  </div>
                </div>

                <Button onClick={handleUpdateLocation} className="w-full">
                  <Navigation className="h-4 w-4 mr-2" />
                  Update Location
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Live Locations</CardTitle>
                <CardDescription>{locationEvents.userLocations.length} active locations</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-2">
                    {locationEvents.userLocations.slice(-10).map((location, index) => (
                      <div key={index} className="p-2 bg-muted rounded text-sm">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">{location.userId}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(location.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-xs">
                          {location.location.lat.toFixed(4)}, {location.location.lng.toFixed(4)}
                        </p>
                        {location.location.heading && (
                          <p className="text-xs">Heading: {location.location.heading}°</p>
                        )}
                        {location.location.speed && (
                          <p className="text-xs">Speed: {location.location.speed} km/h</p>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Emergency Tab */}
        <TabsContent value="emergency" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  Emergency Alerts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Alert Type</Label>
                  <Select value={emergencyForm.alertType} onValueChange={(value: any) => setEmergencyForm(prev => ({ ...prev, alertType: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sos">SOS</SelectItem>
                      <SelectItem value="panic">Panic</SelectItem>
                      <SelectItem value="accident">Accident</SelectItem>
                      <SelectItem value="route_deviation">Route Deviation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Severity</Label>
                  <Select value={emergencyForm.severity} onValueChange={(value: any) => setEmergencyForm(prev => ({ ...prev, severity: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={emergencyForm.description}
                    onChange={(e) => setEmergencyForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe the emergency..."
                  />
                </div>

                <Button onClick={handleTriggerEmergency} variant="destructive" className="w-full">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Trigger Emergency Alert
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Emergency Alerts</CardTitle>
                <CardDescription>
                  {emergencyEvents.activeAlerts.length} active, {emergencyEvents.criticalAlerts.length} critical
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-2">
                    {emergencyEvents.emergencyAlerts.slice(-10).map((alert, index) => (
                      <div key={index} className={`p-2 rounded text-sm border ${
                        alert.severity === 'critical' ? 'bg-red-50 border-red-200' :
                        alert.severity === 'high' ? 'bg-orange-50 border-orange-200' :
                        'bg-yellow-50 border-yellow-200'
                      }`}>
                        <div className="flex items-center justify-between mb-1">
                          <Badge variant={
                            alert.severity === 'critical' ? 'destructive' :
                            alert.severity === 'high' ? 'default' : 'secondary'
                          }>
                            {alert.alertType}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(alert.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-xs">User: {alert.userId}</p>
                        <p className="text-xs">Location: {alert.location.lat.toFixed(4)}, {alert.location.lng.toFixed(4)}</p>
                        {alert.description && <p className="text-xs mt-1">{alert.description}</p>}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Send Notification
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Recipient ID</Label>
                  <Input
                    value={notificationForm.recipientId}
                    onChange={(e) => setNotificationForm(prev => ({ ...prev, recipientId: e.target.value }))}
                    placeholder="Leave empty for self"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={notificationForm.title}
                    onChange={(e) => setNotificationForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Notification title"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Message</Label>
                  <Textarea
                    value={notificationForm.message}
                    onChange={(e) => setNotificationForm(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="Notification message"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={notificationForm.category} onValueChange={(value: any) => setNotificationForm(prev => ({ ...prev, category: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ride">Ride</SelectItem>
                        <SelectItem value="payment">Payment</SelectItem>
                        <SelectItem value="system">System</SelectItem>
                        <SelectItem value="promotion">Promotion</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select value={notificationForm.priority} onValueChange={(value: any) => setNotificationForm(prev => ({ ...prev, priority: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button onClick={handleSendNotification} className="w-full">
                  <Send className="h-4 w-4 mr-2" />
                  Send Notification
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Notifications</CardTitle>
                  <div className="flex items-center gap-2">
                    {notificationEvents.unreadCount > 0 && (
                      <Badge variant="destructive">{notificationEvents.unreadCount}</Badge>
                    )}
                    <Button size="sm" variant="outline" onClick={() => notificationEvents.markAsRead()}>
                      Mark All Read
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-2">
                    {notificationEvents.notifications.slice(0, 10).map((notification, index) => (
                      <div key={index} className={`p-2 rounded text-sm border ${
                        notification.metadata?.read ? 'bg-muted/50' : 'bg-blue-50 border-blue-200'
                      }`}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{notification.category}</Badge>
                            <Badge variant={
                              notification.priority === 'urgent' ? 'destructive' :
                              notification.priority === 'high' ? 'default' : 'secondary'
                            }>
                              {notification.priority}
                            </Badge>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(notification.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="font-medium text-sm">{notification.title}</p>
                        <p className="text-xs text-muted-foreground">{notification.message}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* System Tab */}
        <TabsContent value="system" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  System Alerts
                  {systemEvents.canEmitAlerts ? (
                    <Badge variant="default">Admin</Badge>
                  ) : (
                    <Badge variant="outline">Read Only</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {systemEvents.canEmitAlerts && (
                  <Button 
                    onClick={() => systemEvents.emitSystemAlert('warning', 'demo', 'Test system alert from demo')}
                    variant="outline"
                    className="w-full"
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Emit Test Alert
                  </Button>
                )}

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Critical Alerts:</span>
                    <Badge variant="destructive">{systemEvents.criticalAlerts.length}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Error Alerts:</span>
                    <Badge variant="default">{systemEvents.errorAlerts.length}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Warning Alerts:</span>
                    <Badge variant="secondary">{systemEvents.warningAlerts.length}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Event History</CardTitle>
                <CardDescription>Last {eventHistory.history.length} events</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-2">
                    {eventHistory.history.slice(0, 10).map((event, index) => (
                      <div key={index} className="p-2 bg-muted rounded text-sm">
                        <div className="flex items-center justify-between mb-1">
                          <Badge variant="outline">{event.type}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(event.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-xs">User: {event.userId}</p>
                        <p className="text-xs">ID: {event.id}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default EventSystemDemo