/**
 * React Hooks for Real-time Event System
 * Provides easy integration with the GoCars event system
 */

import { useEffect, useState, useCallback, useRef } from 'react'
import {
  eventSystem,
  EventType,
  GoCarsEvent,
  RideEvent,
  DriverStatusEvent,
  LocationEvent,
  EmergencyEvent,
  NotificationEvent,
  SystemEvent,
  createRideEvent,
  createDriverStatusEvent,
  createLocationEvent,
  createEmergencyEvent,
  createNotificationEvent,
  createSystemEvent
} from '@/lib/websocket/event-system'

// Hook for subscribing to events
export function useEventSubscription<T extends GoCarsEvent = GoCarsEvent>(
  eventType: EventType | EventType[],
  callback: (event: T) => void,
  options?: {
    userId?: string
    userRole?: string
    roomId?: string
    filter?: (event: T) => boolean
  }
) {
  const callbackRef = useRef(callback)
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null)
  const [events, setEvents] = useState<T[]>([])
  const [lastEvent, setLastEvent] = useState<T | null>(null)

  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  useEffect(() => {
    const id = eventSystem.subscribe({
      eventType,
      userId: options?.userId,
      userRole: options?.userRole,
      roomId: options?.roomId,
      filter: options?.filter as any,
      callback: (event: GoCarsEvent) => {
        const typedEvent = event as T
        setEvents(prev => [...prev, typedEvent].slice(-100)) // Keep last 100 events
        setLastEvent(typedEvent)
        callbackRef.current(typedEvent)
      }
    })

    setSubscriptionId(id)

    return () => {
      if (id) {
        eventSystem.unsubscribe(id)
      }
    }
  }, [eventType, options?.userId, options?.userRole, options?.roomId])

  return {
    events,
    lastEvent,
    subscriptionId,
    isSubscribed: !!subscriptionId
  }
}

// Hook for ride events
export function useRideEvents(userId: string, userRole: string) {
  const [rideEvents, setRideEvents] = useState<RideEvent[]>([])
  const [activeRides, setActiveRides] = useState<Map<string, RideEvent>>(new Map())

  useEventSubscription<RideEvent>(
    ['ride_requested', 'ride_accepted', 'ride_started', 'ride_completed', 'ride_cancelled'],
    (event) => {
      setRideEvents(prev => [...prev, event].slice(-50)) // Keep last 50 ride events

      // Update active rides
      setActiveRides(prev => {
        const newMap = new Map(prev)
        if (event.type === 'ride_completed' || event.type === 'ride_cancelled') {
          newMap.delete(event.rideId)
        } else {
          newMap.set(event.rideId, event)
        }
        return newMap
      })
    },
    {
      userId: userRole === 'operator' || userRole === 'admin' ? undefined : userId,
      userRole
    }
  )

  const emitRideEvent = useCallback((
    type: RideEvent['type'],
    data: Omit<RideEvent, 'id' | 'type' | 'timestamp' | 'userId'>
  ) => {
    const event = createRideEvent(type, { ...data, userId })
    eventSystem.emitEvent(event)
  }, [userId])

  const requestRide = useCallback((
    passengerId: string,
    pickup: { lat: number; lng: number; address?: string },
    dropoff: { lat: number; lng: number; address?: string },
    estimatedDuration?: number
  ) => {
    emitRideEvent('ride_requested', {
      rideId: `ride_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      passengerId,
      location: { pickup, dropoff },
      estimatedDuration
    })
  }, [emitRideEvent])

  const acceptRide = useCallback((rideId: string, driverId: string) => {
    const activeRide = activeRides.get(rideId)
    if (activeRide) {
      emitRideEvent('ride_accepted', {
        rideId,
        passengerId: activeRide.passengerId,
        driverId,
        location: activeRide.location,
        estimatedDuration: activeRide.estimatedDuration
      })
    }
  }, [emitRideEvent, activeRides])

  const startRide = useCallback((rideId: string) => {
    const activeRide = activeRides.get(rideId)
    if (activeRide) {
      emitRideEvent('ride_started', {
        rideId,
        passengerId: activeRide.passengerId,
        driverId: activeRide.driverId,
        location: activeRide.location
      })
    }
  }, [emitRideEvent, activeRides])

  const completeRide = useCallback((rideId: string, fare: number, actualDuration: number) => {
    const activeRide = activeRides.get(rideId)
    if (activeRide) {
      emitRideEvent('ride_completed', {
        rideId,
        passengerId: activeRide.passengerId,
        driverId: activeRide.driverId,
        location: activeRide.location,
        fare,
        actualDuration
      })
    }
  }, [emitRideEvent, activeRides])

  const cancelRide = useCallback((rideId: string, reason?: string) => {
    const activeRide = activeRides.get(rideId)
    if (activeRide) {
      emitRideEvent('ride_cancelled', {
        rideId,
        passengerId: activeRide.passengerId,
        driverId: activeRide.driverId,
        location: activeRide.location,
        metadata: { reason }
      })
    }
  }, [emitRideEvent, activeRides])

  return {
    rideEvents,
    activeRides: Array.from(activeRides.values()),
    requestRide,
    acceptRide,
    startRide,
    completeRide,
    cancelRide
  }
}

// Hook for driver status events
export function useDriverStatus(userId: string, userRole: string) {
  const [driverStatuses, setDriverStatuses] = useState<Map<string, DriverStatusEvent>>(new Map())
  const [myStatus, setMyStatus] = useState<'online' | 'offline' | 'busy'>('offline')

  useEventSubscription<DriverStatusEvent>(
    ['driver_online', 'driver_offline', 'driver_busy'],
    (event) => {
      setDriverStatuses(prev => new Map(prev.set(event.driverId, event)))

      // Update own status if it's our event
      if (event.driverId === userId) {
        setMyStatus(event.type.replace('driver_', '') as any)
      }
    },
    {
      userRole: userRole === 'driver' ? undefined : userRole // Drivers see all, others see based on role
    }
  )

  const updateDriverStatus = useCallback((
    status: 'online' | 'offline' | 'busy',
    location?: { lat: number; lng: number },
    vehicleInfo?: any
  ) => {
    const event = createDriverStatusEvent(`driver_${status}` as any, {
      userId,
      driverId: userId,
      location,
      vehicleInfo
    })
    eventSystem.emitEvent(event)
  }, [userId])

  const goOnline = useCallback((location: { lat: number; lng: number }, vehicleInfo?: any) => {
    updateDriverStatus('online', location, vehicleInfo)
  }, [updateDriverStatus])

  const goOffline = useCallback(() => {
    updateDriverStatus('offline')
  }, [updateDriverStatus])

  const setBusy = useCallback((location?: { lat: number; lng: number }) => {
    updateDriverStatus('busy', location)
  }, [updateDriverStatus])

  return {
    driverStatuses: Array.from(driverStatuses.values()),
    myStatus,
    onlineDrivers: Array.from(driverStatuses.values()).filter(d => d.type === 'driver_online'),
    busyDrivers: Array.from(driverStatuses.values()).filter(d => d.type === 'driver_busy'),
    goOnline,
    goOffline,
    setBusy,
    updateDriverStatus
  }
}

// Hook for location events
export function useLocationEvents(userId: string, userRole: string) {
  const [locationUpdates, setLocationUpdates] = useState<LocationEvent[]>([])
  const [userLocations, setUserLocations] = useState<Map<string, LocationEvent>>(new Map())

  useEventSubscription<LocationEvent>(
    'location_updated',
    (event) => {
      setLocationUpdates(prev => [...prev, event].slice(-100)) // Keep last 100 updates
      setUserLocations(prev => new Map(prev.set(event.userId, event)))
    },
    {
      userRole: userRole === 'operator' || userRole === 'admin' ? undefined : userId
    }
  )

  const updateLocation = useCallback((
    location: { lat: number; lng: number; heading?: number; speed?: number; accuracy?: number },
    rideId?: string
  ) => {
    const event = createLocationEvent({
      userId,
      location,
      rideId
    })
    eventSystem.emitEvent(event)
  }, [userId])

  const getLocationForUser = useCallback((targetUserId: string) => {
    return userLocations.get(targetUserId)
  }, [userLocations])

  const getLocationsInRadius = useCallback((
    center: { lat: number; lng: number },
    radiusKm: number
  ) => {
    return Array.from(userLocations.values()).filter(locationEvent => {
      const distance = calculateDistance(
        center.lat, center.lng,
        locationEvent.location.lat, locationEvent.location.lng
      )
      return distance <= radiusKm
    })
  }, [userLocations])

  return {
    locationUpdates,
    userLocations: Array.from(userLocations.values()),
    updateLocation,
    getLocationForUser,
    getLocationsInRadius
  }
}

// Hook for emergency events
export function useEmergencyEvents(userId: string, userRole: string) {
  const [emergencyAlerts, setEmergencyAlerts] = useState<EmergencyEvent[]>([])
  const [activeAlerts, setActiveAlerts] = useState<EmergencyEvent[]>([])

  useEventSubscription<EmergencyEvent>(
    'emergency_alert',
    (event) => {
      setEmergencyAlerts(prev => [...prev, event].slice(-50)) // Keep last 50 alerts

      if (event.severity === 'high' || event.severity === 'critical') {
        setActiveAlerts(prev => [...prev, event])
      }
    },
    {
      userRole: userRole === 'operator' || userRole === 'admin' ? undefined : userId
    }
  )

  const triggerEmergency = useCallback((
    alertType: 'sos' | 'panic' | 'accident' | 'route_deviation',
    location: { lat: number; lng: number },
    severity: 'low' | 'medium' | 'high' | 'critical' = 'high',
    description?: string,
    rideId?: string
  ) => {
    const event = createEmergencyEvent({
      userId,
      alertType,
      location,
      severity,
      description,
      rideId
    })
    eventSystem.emitEvent(event)
  }, [userId])

  const dismissAlert = useCallback((alertId: string) => {
    setActiveAlerts(prev => prev.filter(alert => alert.id !== alertId))
  }, [])

  return {
    emergencyAlerts,
    activeAlerts,
    criticalAlerts: activeAlerts.filter(a => a.severity === 'critical'),
    triggerEmergency,
    dismissAlert
  }
}

// Hook for notifications
export function useNotificationEvents(userId: string, userRole: string) {
  const [notifications, setNotifications] = useState<NotificationEvent[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  useEventSubscription<NotificationEvent>(
    'notification_sent',
    (event) => {
      if (event.recipientId === userId || !event.recipientId) {
        setNotifications(prev => [event, ...prev].slice(0, 100)) // Keep last 100 notifications
        setUnreadCount(prev => prev + 1)
      }
    },
    {
      userId,
      userRole
    }
  )

  const sendNotification = useCallback((
    recipientId: string,
    title: string,
    message: string,
    category: 'ride' | 'payment' | 'system' | 'promotion' = 'system',
    priority: 'low' | 'normal' | 'high' | 'urgent' = 'normal',
    actionUrl?: string
  ) => {
    const event = createNotificationEvent({
      userId,
      recipientId,
      title,
      message,
      category,
      priority,
      actionUrl
    })
    eventSystem.emitEvent(event)
  }, [userId])

  const markAsRead = useCallback((notificationId?: string) => {
    if (notificationId) {
      setNotifications(prev => prev.map(notif =>
        notif.id === notificationId ? { ...notif, metadata: { ...notif.metadata, read: true } } : notif
      ))
    } else {
      setNotifications(prev => prev.map(notif => ({ ...notif, metadata: { ...notif.metadata, read: true } })))
      setUnreadCount(0)
    }
  }, [])

  const clearNotifications = useCallback(() => {
    setNotifications([])
    setUnreadCount(0)
  }, [])

  return {
    notifications,
    unreadCount,
    urgentNotifications: notifications.filter(n => n.priority === 'urgent'),
    sendNotification,
    markAsRead,
    clearNotifications
  }
}

// Hook for system events (admin only)
export function useSystemEvents(userId: string, userRole: string) {
  const [systemAlerts, setSystemAlerts] = useState<SystemEvent[]>([])
  const [criticalAlerts, setCriticalAlerts] = useState<SystemEvent[]>([])

  useEventSubscription<SystemEvent>(
    'system_alert',
    (event) => {
      setSystemAlerts(prev => [...prev, event].slice(-100)) // Keep last 100 alerts

      if (event.alertLevel === 'critical' || event.alertLevel === 'error') {
        setCriticalAlerts(prev => [...prev, event])
      }
    },
    {
      userRole: userRole === 'admin' ? userRole : undefined // Only admins see system events
    }
  )

  const emitSystemAlert = useCallback((
    alertLevel: 'info' | 'warning' | 'error' | 'critical',
    component: string,
    message: string,
    affectedUsers?: string[]
  ) => {
    if (userRole !== 'admin') return // Only admins can emit system alerts

    const event = createSystemEvent({
      userId,
      alertLevel,
      component,
      message,
      affectedUsers
    })
    eventSystem.emitEvent(event)
  }, [userId, userRole])

  const dismissAlert = useCallback((alertId: string) => {
    setCriticalAlerts(prev => prev.filter(alert => alert.id !== alertId))
  }, [])

  return {
    systemAlerts,
    criticalAlerts,
    errorAlerts: systemAlerts.filter(a => a.alertLevel === 'error'),
    warningAlerts: systemAlerts.filter(a => a.alertLevel === 'warning'),
    emitSystemAlert,
    dismissAlert,
    canEmitAlerts: userRole === 'admin'
  }
}

// Hook for event system statistics
export function useEventSystemStats() {
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    const updateStats = () => {
      setStats(eventSystem.getStats())
    }

    updateStats()
    const interval = setInterval(updateStats, 5000) // Update every 5 seconds

    return () => clearInterval(interval)
  }, [])

  return stats
}

// Hook for event history
export function useEventHistory(filter?: {
  eventType?: EventType
  userId?: string
  since?: Date
  limit?: number
}) {
  const [history, setHistory] = useState<GoCarsEvent[]>([])

  useEffect(() => {
    const events = eventSystem.getEventHistory(filter)
    setHistory(events)
  }, [filter])

  const refreshHistory = useCallback(() => {
    const events = eventSystem.getEventHistory(filter)
    setHistory(events)
  }, [filter])

  return {
    history,
    refreshHistory
  }
}

// Utility function to calculate distance between two points
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}