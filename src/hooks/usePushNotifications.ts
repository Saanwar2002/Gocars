/**
 * React Hooks for Push Notifications
 * Easy integration with the push notification system
 */

import { useEffect, useState, useCallback } from 'react'
import { pushNotificationService, UserNotificationSettings } from '@/services/pushNotificationService'
import { intelligentNotificationManager } from '@/services/intelligentNotificationManager'

// Hook for managing user notification settings
export function useNotificationSettings(userId: string) {
  const [settings, setSettings] = useState<UserNotificationSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) return

    const loadSettings = async () => {
      try {
        setIsLoading(true)
        // In a real implementation, this would fetch from the service
        const defaultSettings: UserNotificationSettings = {
          userId,
          enabled: true,
          categories: {
            ride: true,
            payment: true,
            system: true,
            promotion: true,
            emergency: true
          },
          quietHours: {
            enabled: false,
            start: '22:00',
            end: '08:00'
          },
          deviceTokens: [],
          preferences: {
            sound: true,
            vibration: true,
            badge: true,
            groupSimilar: true
          }
        }
        setSettings(defaultSettings)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load settings')
      } finally {
        setIsLoading(false)
      }
    }

    loadSettings()
  }, [userId])

  const updateSettings = useCallback(async (updates: Partial<UserNotificationSettings>) => {
    if (!settings) return

    try {
      await pushNotificationService.updateUserSettings(userId, updates)
      setSettings(prev => prev ? { ...prev, ...updates } : null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update settings')
    }
  }, [userId, settings])

  const toggleCategory = useCallback(async (category: keyof UserNotificationSettings['categories']) => {
    if (!settings) return

    const newCategories = {
      ...settings.categories,
      [category]: !settings.categories[category]
    }

    await updateSettings({ categories: newCategories })
  }, [settings, updateSettings])

  const toggleQuietHours = useCallback(async () => {
    if (!settings) return

    const newQuietHours = {
      ...settings.quietHours,
      enabled: !settings.quietHours.enabled
    }

    await updateSettings({ quietHours: newQuietHours })
  }, [settings, updateSettings])

  const setQuietHoursTime = useCallback(async (start: string, end: string) => {
    if (!settings) return

    const newQuietHours = {
      ...settings.quietHours,
      start,
      end
    }

    await updateSettings({ quietHours: newQuietHours })
  }, [settings, updateSettings])

  return {
    settings,
    isLoading,
    error,
    updateSettings,
    toggleCategory,
    toggleQuietHours,
    setQuietHoursTime
  }
}

// Hook for device token management
export function useDeviceToken(userId: string) {
  const [deviceToken, setDeviceToken] = useState<string | null>(null)
  const [isRegistered, setIsRegistered] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) return

    const initializeToken = async () => {
      try {
        // In a real implementation, this would get the FCM token
        // const messaging = getMessaging()
        // const token = await getToken(messaging, { vapidKey: 'your-vapid-key' })
        
        // For demo, generate a mock token
        const mockToken = `token_${userId}_${Date.now()}`
        setDeviceToken(mockToken)
        
        // Register with service
        await pushNotificationService.registerDeviceToken(userId, mockToken)
        setIsRegistered(true)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize device token')
      }
    }

    initializeToken()
  }, [userId])

  const refreshToken = useCallback(async () => {
    if (!userId) return

    try {
      // In a real implementation, this would refresh the FCM token
      const newMockToken = `token_${userId}_${Date.now()}`
      
      if (deviceToken) {
        await pushNotificationService.unregisterDeviceToken(userId, deviceToken)
      }
      
      await pushNotificationService.registerDeviceToken(userId, newMockToken)
      setDeviceToken(newMockToken)
      setIsRegistered(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh token')
    }
  }, [userId, deviceToken])

  const unregisterToken = useCallback(async () => {
    if (!userId || !deviceToken) return

    try {
      await pushNotificationService.unregisterDeviceToken(userId, deviceToken)
      setIsRegistered(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unregister token')
    }
  }, [userId, deviceToken])

  return {
    deviceToken,
    isRegistered,
    error,
    refreshToken,
    unregisterToken
  }
}

// Hook for notification permission management
export function useNotificationPermission() {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isSupported, setIsSupported] = useState(false)

  useEffect(() => {
    // Check if notifications are supported
    setIsSupported('Notification' in window)
    
    if ('Notification' in window) {
      setPermission(Notification.permission)
    }
  }, [])

  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!isSupported) {
      throw new Error('Notifications not supported')
    }

    try {
      const result = await Notification.requestPermission()
      setPermission(result)
      return result
    } catch (error) {
      throw new Error('Failed to request notification permission')
    }
  }, [isSupported])

  const showTestNotification = useCallback(async (title: string, body: string) => {
    if (permission !== 'granted') {
      throw new Error('Notification permission not granted')
    }

    const notification = new Notification(title, {
      body,
      icon: '/icons/notification.png',
      badge: '/icons/badge.png',
      tag: 'test-notification'
    })

    // Auto-close after 5 seconds
    setTimeout(() => {
      notification.close()
    }, 5000)

    return notification
  }, [permission])

  return {
    permission,
    isSupported,
    isGranted: permission === 'granted',
    isDenied: permission === 'denied',
    requestPermission,
    showTestNotification
  }
}

// Hook for notification analytics
export function useNotificationAnalytics(userId?: string) {
  const [analytics, setAnalytics] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setIsLoading(true)
        
        // Get delivery stats
        const deliveryStats = await pushNotificationService.getDeliveryStats(userId)
        
        // Get intelligent manager analytics
        const managerAnalytics = intelligentNotificationManager.getAnalytics()
        
        setAnalytics({
          delivery: deliveryStats,
          intelligence: managerAnalytics,
          lastUpdated: new Date()
        })
      } catch (error) {
        console.error('Failed to load notification analytics:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadAnalytics()
    
    // Refresh every 5 minutes
    const interval = setInterval(loadAnalytics, 5 * 60 * 1000)
    
    return () => clearInterval(interval)
  }, [userId])

  return {
    analytics,
    isLoading,
    refresh: () => setIsLoading(true)
  }
}

// Hook for notification templates
export function useNotificationTemplates() {
  const [templates, setTemplates] = useState<any[]>([])

  useEffect(() => {
    const loadTemplates = () => {
      const availableTemplates = pushNotificationService.getTemplates()
      setTemplates(availableTemplates)
    }

    loadTemplates()
  }, [])

  const addTemplate = useCallback((template: any) => {
    pushNotificationService.addTemplate(template)
    setTemplates(pushNotificationService.getTemplates())
  }, [])

  return {
    templates,
    addTemplate
  }
}

// Hook for sending custom notifications
export function useSendNotification(userId: string) {
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sendNotification = useCallback(async (
    title: string,
    body: string,
    options?: {
      category?: string
      priority?: string
      icon?: string
      actions?: Array<{ action: string; title: string }>
      data?: Record<string, any>
    }
  ) => {
    try {
      setIsSending(true)
      setError(null)

      const notification = {
        title,
        body,
        icon: options?.icon || '/icons/notification.png',
        data: {
          category: options?.category || 'system',
          priority: options?.priority || 'normal',
          userId,
          ...options?.data
        },
        actions: options?.actions,
        timestamp: Date.now()
      }

      await pushNotificationService.sendNotificationToUser(userId, notification)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send notification')
      throw err
    } finally {
      setIsSending(false)
    }
  }, [userId])

  const sendTemplateNotification = useCallback(async (
    templateId: string,
    variables: Record<string, string> = {}
  ) => {
    try {
      setIsSending(true)
      setError(null)

      const templates = pushNotificationService.getTemplates()
      const template = templates.find(t => t.id === templateId)
      
      if (!template) {
        throw new Error(`Template ${templateId} not found`)
      }

      await pushNotificationService.sendNotificationToUser(userId, template, variables)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send template notification')
      throw err
    } finally {
      setIsSending(false)
    }
  }, [userId])

  return {
    sendNotification,
    sendTemplateNotification,
    isSending,
    error
  }
}

// Hook for notification history
export function useNotificationHistory(userId: string) {
  const [history, setHistory] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadHistory = async () => {
      try {
        setIsLoading(true)
        
        // In a real implementation, this would fetch from a database
        // For now, return mock data
        const mockHistory = [
          {
            id: '1',
            title: 'Ride Accepted',
            body: 'Your ride has been accepted by John Driver',
            timestamp: Date.now() - 3600000,
            status: 'delivered',
            category: 'ride'
          },
          {
            id: '2',
            title: 'Payment Processed',
            body: 'Your payment of $25.50 has been processed',
            timestamp: Date.now() - 7200000,
            status: 'clicked',
            category: 'payment'
          }
        ]
        
        setHistory(mockHistory)
      } catch (error) {
        console.error('Failed to load notification history:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (userId) {
      loadHistory()
    }
  }, [userId])

  return {
    history,
    isLoading
  }
}

// Hook for real-time notification status
export function useNotificationStatus() {
  const [onlineStatus, setOnlineStatus] = useState(navigator.onLine)
  const [serviceWorkerStatus, setServiceWorkerStatus] = useState<'supported' | 'registered' | 'unsupported'>('unsupported')

  useEffect(() => {
    // Monitor online status
    const handleOnline = () => setOnlineStatus(true)
    const handleOffline = () => setOnlineStatus(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Check service worker support
    if ('serviceWorker' in navigator) {
      setServiceWorkerStatus('supported')
      
      navigator.serviceWorker.ready.then(() => {
        setServiceWorkerStatus('registered')
      })
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return {
    isOnline: onlineStatus,
    serviceWorkerStatus,
    canReceiveNotifications: onlineStatus && serviceWorkerStatus === 'registered'
  }
}