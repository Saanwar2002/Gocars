/**
 * WebSocket Demo Component
 * Demonstrates real-time WebSocket functionality
 */

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  useWebSocket, 
  useWebSocketSubscription, 
  useLocationTracking, 
  useRideTracking, 
  useDriverStatus, 
  useNotifications, 
  useChat,
  useSystemHealth
} from '@/hooks/useWebSocket'
import { ConnectionStatus } from '@/contexts/WebSocketContext'
import { 
  Wifi, 
  WifiOff, 
  Send, 
  MapPin, 
  Car, 
  Users, 
  Bell, 
  MessageCircle,
  Activity,
  Zap,
  AlertTriangle,
  CheckCircle,
  Clock,
  Navigation
} from 'lucide-react'

interface WebSocketDemoProps {
  userId: string
  userRole: 'passenger' | 'driver' | 'operator' | 'admin'
  className?: string
}

export const WebSocketDemo: React.FC<WebSocketDemoProps> = ({
  userId,
  userRole,
  className
}) => {
  const [activeTab, setActiveTab] = useState('connection')
  const [testMessage, setTestMessage] = useState('')
  const [testRoomId, setTestRoomId] = useState('test-room')
  const [testLocation, setTestLocation] = useState({ lat: 40.7128, lng: -74.0060 })

  // WebSocket connection
  const {
    connectionStatus,
    isConnected,
    error,
    sendMessage,
    joinRoom,
    leaveRoom,
    updateLocation,
    updateRideStatus,
    updateDriverStatus
  } = useWebSocket(userId, userRole)

  // Location tracking
  const { locations, myLocation, updateMyLocation, getLocationForUser } = useLocationTracking(userId, userRole)

  // Ride tracking
  const { rideStatus, rideHistory, updateStatus } = useRideTracking(userId, userRole, 'demo-ride-123')

  // Driver status
  const { driverStatuses, myStatus, updateMyStatus, getDriverStatus } = useDriverStatus(userId, userRole)

  // Notifications
  const { notifications, unreadCount, markAsRead, clearNotifications } = useNotifications(userId, userRole)

  // Chat
  const { messages, sendChatMessage } = useChat(userId, userRole, testRoomId)

  // System health (admin only)
  const { healthData, lastUpdate, isHealthy } = useSystemHealth(userId, userRole)

  // Test functions
  const handleSendTestMessage = () => {
    if (!testMessage.trim()) return

    sendMessage({
      type: 'chat_message',
      payload: {
        content: testMessage,
        messageType: 'text'
      },
      timestamp: Date.now(),
      userId,
      roomId: testRoomId
    })

    setTestMessage('')
  }

  const handleUpdateLocation = () => {
    const newLocation = {
      lat: testLocation.lat + (Math.random() - 0.5) * 0.01,
      lng: testLocation.lng + (Math.random() - 0.5) * 0.01,
      heading: Math.random() * 360
    }
    setTestLocation(newLocation)
    updateMyLocation(newLocation)
  }

  const handleUpdateRideStatus = (status: string) => {
    updateStatus(status, { timestamp: Date.now(), updatedBy: userId })
  }

  const handleUpdateDriverStatus = (status: 'online' | 'offline' | 'busy') => {
    updateMyStatus(status, testLocation)
  }

  const handleJoinRoom = () => {
    joinRoom(testRoomId, 'chat')
  }

  const handleLeaveRoom = () => {
    leaveRoom(testRoomId)
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">WebSocket Demo</h2>
          <p className="text-muted-foreground">
            Real-time communication testing for {userRole} user
          </p>
        </div>
        <ConnectionStatus className="text-sm" />
      </div>

      {/* Main Demo Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="connection">Connection</TabsTrigger>
          <TabsTrigger value="messaging">Messaging</TabsTrigger>
          <TabsTrigger value="location">Location</TabsTrigger>
          <TabsTrigger value="rides">Rides</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        {/* Connection Tab */}
        <TabsContent value="connection" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {isConnected ? <Wifi className="h-5 w-5 text-green-500" /> : <WifiOff className="h-5 w-5 text-red-500" />}
                  Connection Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Status:</span>
                  <Badge variant={isConnected ? 'default' : 'destructive'}>
                    {connectionStatus}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">User ID:</span>
                  <span className="text-sm font-mono">{userId}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Role:</span>
                  <Badge variant="outline">{userRole}</Badge>
                </div>
                {error && (
                  <div className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
                    Error: {error.message}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Room Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="Room ID"
                    value={testRoomId}
                    onChange={(e) => setTestRoomId(e.target.value)}
                    className="flex-1"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleJoinRoom} size="sm" className="flex-1">
                    Join Room
                  </Button>
                  <Button onClick={handleLeaveRoom} variant="outline" size="sm" className="flex-1">
                    Leave Room
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Messaging Tab */}
        <TabsContent value="messaging" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Send Message
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="Type a message..."
                    value={testMessage}
                    onChange={(e) => setTestMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendTestMessage()}
                    className="flex-1"
                  />
                  <Button onClick={handleSendTestMessage} size="sm">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Messages will be sent to room: {testRoomId}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Messages</CardTitle>
                <CardDescription>Last {messages.length} messages</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-48">
                  <div className="space-y-2">
                    {messages.slice(-10).map((message, index) => (
                      <div key={index} className="p-2 bg-muted rounded text-sm">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">{message.userId}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(message.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p>{message.payload?.content}</p>
                      </div>
                    ))}
                    {messages.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No messages yet
                      </p>
                    )}
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
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-muted-foreground">Latitude</label>
                    <Input
                      type="number"
                      step="0.0001"
                      value={testLocation.lat}
                      onChange={(e) => setTestLocation(prev => ({ ...prev, lat: parseFloat(e.target.value) }))}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Longitude</label>
                    <Input
                      type="number"
                      step="0.0001"
                      value={testLocation.lng}
                      onChange={(e) => setTestLocation(prev => ({ ...prev, lng: parseFloat(e.target.value) }))}
                    />
                  </div>
                </div>
                <Button onClick={handleUpdateLocation} className="w-full">
                  <Navigation className="h-4 w-4 mr-2" />
                  Update My Location
                </Button>
                {myLocation && (
                  <div className="p-2 bg-green-50 border border-green-200 rounded text-sm">
                    Current: {myLocation.lat.toFixed(4)}, {myLocation.lng.toFixed(4)}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Live Locations</CardTitle>
                <CardDescription>{locations.length} active locations</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-48">
                  <div className="space-y-2">
                    {locations.map((location, index) => (
                      <div key={index} className="p-2 bg-muted rounded text-sm">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">{location.userId}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(location.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-xs">
                          {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                        </p>
                      </div>
                    ))}
                    {locations.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No locations yet
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Rides Tab */}
        <TabsContent value="rides" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Car className="h-5 w-5" />
                  Ride Status Control
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <Button onClick={() => handleUpdateRideStatus('requested')} size="sm">
                    Request
                  </Button>
                  <Button onClick={() => handleUpdateRideStatus('accepted')} size="sm">
                    Accept
                  </Button>
                  <Button onClick={() => handleUpdateRideStatus('in_progress')} size="sm">
                    Start
                  </Button>
                  <Button onClick={() => handleUpdateRideStatus('completed')} size="sm">
                    Complete
                  </Button>
                </div>
                {userRole === 'driver' && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Driver Status</p>
                      <div className="grid grid-cols-3 gap-2">
                        <Button 
                          onClick={() => handleUpdateDriverStatus('online')} 
                          size="sm"
                          variant={myStatus === 'online' ? 'default' : 'outline'}
                        >
                          Online
                        </Button>
                        <Button 
                          onClick={() => handleUpdateDriverStatus('busy')} 
                          size="sm"
                          variant={myStatus === 'busy' ? 'default' : 'outline'}
                        >
                          Busy
                        </Button>
                        <Button 
                          onClick={() => handleUpdateDriverStatus('offline')} 
                          size="sm"
                          variant={myStatus === 'offline' ? 'default' : 'outline'}
                        >
                          Offline
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ride History</CardTitle>
                <CardDescription>Recent ride updates</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-48">
                  <div className="space-y-2">
                    {rideHistory.slice(-10).map((update, index) => (
                      <div key={index} className="p-2 bg-muted rounded text-sm">
                        <div className="flex items-center justify-between mb-1">
                          <Badge variant="outline">{update.status}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(update.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-xs">Ride: {update.rideId}</p>
                      </div>
                    ))}
                    {rideHistory.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No ride updates yet
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notifications
                  {unreadCount > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {unreadCount}
                    </Badge>
                  )}
                </CardTitle>
                <div className="flex gap-2">
                  <Button onClick={() => markAsRead()} size="sm" variant="outline">
                    Mark All Read
                  </Button>
                  <Button onClick={clearNotifications} size="sm" variant="outline">
                    Clear All
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                <div className="space-y-2">
                  {notifications.map((notification, index) => (
                    <div 
                      key={index} 
                      className={`p-3 border rounded ${notification.read ? 'bg-muted/50' : 'bg-blue-50 border-blue-200'}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{notification.type}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(notification.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm">{notification.payload?.message || 'No message'}</p>
                    </div>
                  ))}
                  {notifications.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No notifications yet
                    </p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Tab */}
        <TabsContent value="system" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  System Health
                  {isHealthy ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {healthData ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Total Connections:</span>
                      <Badge>{healthData.totalConnections}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Active Rooms:</span>
                      <Badge>{healthData.totalRooms}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Queued Messages:</span>
                      <Badge>{healthData.queuedMessages}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Last Update:</span>
                      <span className="text-xs text-muted-foreground">
                        {lastUpdate?.toLocaleTimeString()}
                      </span>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {userRole === 'admin' ? 'Loading health data...' : 'Health data available for admin users only'}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Driver Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-48">
                  <div className="space-y-2">
                    {driverStatuses.map((driver, index) => (
                      <div key={index} className="p-2 bg-muted rounded text-sm">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">{driver.driverId}</span>
                          <Badge 
                            variant={
                              driver.status === 'online' ? 'default' :
                              driver.status === 'busy' ? 'secondary' : 'outline'
                            }
                          >
                            {driver.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {new Date(driver.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    ))}
                    {driverStatuses.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No driver status updates yet
                      </p>
                    )}
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

export default WebSocketDemo