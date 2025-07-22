/**
 * Firebase Cloud Messaging Integration for GoCars
 * Handles web push notifications with service worker support
 */

import { initializeApp, getApp } from 'firebase/app'
import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging'
import { app } from './firebase'

let messaging: Messaging | null = null

/**
 * Initialize Firebase Cloud Messaging
 */
export const initializeMessaging = async (): Promise<Messaging | null> => {
  try {
    if (typeof window === 'undefined') {
      console.log('Firebase Messaging: Not available in server-side environment')
      return null
    }

    if (!app) {
      console.error('Firebase Messaging: Firebase app not initialized')
      return null
    }

    if (!messaging) {
      messaging = getMessaging(app)
      console.log('Firebase Messaging initialized successfully')
    }

    return messaging
  } catch (error) {
    console.error('Error initializing Firebase Messaging:', error)
    return null
  }
}

/**
 * Request notification permission and get FCM token
 */
export const requestNotificationPermission = async (): Promise<string | null> => {
  try {
    if (typeof window === 'undefined') {
      console.log('Notification permission: Not available in server-side environment')
      return null
    }

    // Check if notifications are supported
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications')
      return null
    }

    // Request permission
    const permission = await Notification.requestPermission()
    
    if (permission !== 'granted') {
      console.log('Notification permission denied')
      return null
    }

    // Initialize messaging
    const messagingInstance = await initializeMessaging()
    if (!messagingInstance) {
      console.error('Failed to initialize messaging')
      return null
    }

    // Get FCM token
    const token = await getToken(messagingInstance, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || 'BKxvxhk6f0LGYzpMuFqKhEqAWD4rM8XkOZWzQj9vNm8yL3pQ2rK5sT7uV9wX1yZ3A4bC6dE8fG0hI2jK4lM6nO8pQ'
    })

    if (token) {
      console.log('FCM Token obtained:', token)
      return token
    } else {
      console.log('No registration token available')
      return null
    }
  } catch (error) {
    console.error('Error getting notification permission/token:', error)
    return null
  }
}

/**
 * Listen for foreground messages
 */
export const onForegroundMessage = (callback: (payload: any) => void): (() => void) | null => {
  try {
    if (typeof window === 'undefined') {
      console.log('Foreground messaging: Not available in server-side environment')
      return null
    }

    if (!messaging) {
      console.error('Messaging not initialized')
      return null
    }

    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('Foreground message received:', payload)
      callback(payload)
    })

    return unsubscribe
  } catch (error) {
    console.error('Error setting up foreground message listener:', error)
    return null
  }
}

/**
 * Show notification using Web Notifications API
 */
export const showNotification = (title: string, options: NotificationOptions = {}): void => {
  try {
    if (typeof window === 'undefined') {
      console.log('Show notification: Not available in server-side environment')
      return
    }

    if (!('Notification' in window)) {
      console.log('This browser does not support notifications')
      return
    }

    if (Notification.permission === 'granted') {
      const notification = new Notification(title, {
        icon: '/icons/notification.png',
        badge: '/icons/badge.png',
        ...options
      })

      // Auto-close after 5 seconds
      setTimeout(() => {
        notification.close()
      }, 5000)

      // Handle click events
      notification.onclick = (event) => {
        event.preventDefault()
        window.focus()
        
        // Handle action based on notification data
        if (options.data?.actionUrl) {
          window.open(options.data.actionUrl, '_blank')
        }
        
        notification.close()
      }
    }
  } catch (error) {
    console.error('Error showing notification:', error)
  }
}

/**
 * Check if notifications are supported and enabled
 */
export const isNotificationSupported = (): boolean => {
  if (typeof window === 'undefined') return false
  return 'Notification' in window && 'serviceWorker' in navigator
}

/**
 * Get current notification permission status
 */
export const getNotificationPermission = (): NotificationPermission | null => {
  if (typeof window === 'undefined') return null
  if (!('Notification' in window)) return null
  return Notification.permission
}

/**
 * Register service worker for background notifications
 */
export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  try {
    if (typeof window === 'undefined') {
      console.log('Service Worker: Not available in server-side environment')
      return null
    }

    if (!('serviceWorker' in navigator)) {
      console.log('Service Worker not supported')
      return null
    }

    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js')
    console.log('Service Worker registered successfully:', registration)
    
    return registration
  } catch (error) {
    console.error('Service Worker registration failed:', error)
    return null
  }
}

/**
 * Unregister service worker
 */
export const unregisterServiceWorker = async (): Promise<boolean> => {
  try {
    if (typeof window === 'undefined') return false
    if (!('serviceWorker' in navigator)) return false

    const registrations = await navigator.serviceWorker.getRegistrations()
    
    for (const registration of registrations) {
      await registration.unregister()
    }
    
    console.log('Service Worker unregistered successfully')
    return true
  } catch (error) {
    console.error('Service Worker unregistration failed:', error)
    return false
  }
}

export default {
  initializeMessaging,
  requestNotificationPermission,
  onForegroundMessage,
  showNotification,
  isNotificationSupported,
  getNotificationPermission,
  registerServiceWorker,
  unregisterServiceWorker
}