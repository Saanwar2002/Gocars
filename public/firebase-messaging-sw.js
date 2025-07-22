/**
 * Firebase Cloud Messaging Service Worker for GoCars
 * Handles background push notifications
 */

// Import Firebase scripts
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js')

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAEnaOlXAGlkox-wpOOER7RUPhd8iWKhg4",
  authDomain: "taxinow-vvp38.firebaseapp.com",
  projectId: "taxinow-vvp38",
  storageBucket: "taxinow-vvp38.firebasestorage.app",
  messagingSenderId: "679652213262",
  appId: "1:679652213262:web:0217c9706165949cd5f25f"
}

// Initialize Firebase
firebase.initializeApp(firebaseConfig)

// Initialize Firebase Cloud Messaging
const messaging = firebase.messaging()

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('Background message received:', payload)

  const notificationTitle = payload.notification?.title || 'GoCars Notification'
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new notification',
    icon: payload.notification?.icon || '/icons/notification.png',
    badge: '/icons/badge.png',
    tag: payload.data?.category || 'general',
    data: payload.data || {},
    actions: [],
    requireInteraction: payload.data?.priority === 'urgent',
    silent: payload.data?.silent === 'true'
  }

  // Add custom actions based on notification type
  if (payload.data?.category === 'ride') {
    notificationOptions.actions = [
      {
        action: 'view_ride',
        title: 'View Ride',
        icon: '/icons/view.png'
      },
      {
        action: 'contact_driver',
        title: 'Contact Driver',
        icon: '/icons/phone.png'
      }
    ]
  } else if (payload.data?.category === 'emergency') {
    notificationOptions.actions = [
      {
        action: 'view_emergency',
        title: 'View Details',
        icon: '/icons/info.png'
      }
    ]
  } else if (payload.data?.category === 'promotion') {
    notificationOptions.actions = [
      {
        action: 'use_offer',
        title: 'Use Offer',
        icon: '/icons/gift.png'
      }
    ]
  }

  // Show notification
  return self.registration.showNotification(notificationTitle, notificationOptions)
})

// Handle notification click events
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event)

  const notification = event.notification
  const action = event.action
  const data = notification.data || {}

  notification.close()

  // Handle different actions based on real data
  let targetUrl = '/'

  if (action === 'view_ride' || data.category === 'ride') {
    targetUrl = data.rideId ? `/passenger/track-ride/${data.rideId}` : '/passenger/dashboard'
  } else if (action === 'contact_driver') {
    targetUrl = data.driverId ? `/passenger/chat/${data.driverId}` : '/passenger/dashboard'
  } else if (action === 'view_emergency' || data.category === 'emergency') {
    targetUrl = data.emergencyId ? `/emergency/${data.emergencyId}` : '/emergency'
  } else if (action === 'use_offer' || data.category === 'promotion') {
    targetUrl = data.promotionId ? `/promotions/${data.promotionId}` : '/promotions'
  } else if (action === 'rate_ride') {
    targetUrl = data.rideId ? `/passenger/rate/${data.rideId}` : '/passenger/dashboard'
  } else if (action === 'view_receipt') {
    targetUrl = data.rideId ? `/passenger/receipt/${data.rideId}` : '/passenger/dashboard'
  } else if (data.actionUrl) {
    targetUrl = data.actionUrl
  }

  // Open the target URL
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window/tab open with the target URL
      for (const client of clientList) {
        if (client.url.includes(targetUrl.split('?')[0]) && 'focus' in client) {
          return client.focus()
        }
      }

      // If no existing window/tab, open a new one
      if (clients.openWindow) {
        return clients.openWindow(targetUrl)
      }
    })
  )

  // Track notification interaction for real analytics
  event.waitUntil(
    fetch('/api/analytics/notification-interaction', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        notificationId: data.notificationId || 'unknown',
        userId: data.userId,
        action: action || 'click',
        timestamp: Date.now(),
        category: data.category || 'general',
        templateId: data.templateId
      })
    }).catch(error => {
      console.error('Failed to track notification interaction:', error)
    })
  )
})

// Handle notification close events
self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed:', event)

  const notification = event.notification
  const data = notification.data || {}

  // Track notification dismissal for real analytics
  fetch('/api/analytics/notification-interaction', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      notificationId: data.notificationId || 'unknown',
      userId: data.userId,
      action: 'dismiss',
      timestamp: Date.now(),
      category: data.category || 'general',
      templateId: data.templateId
    })
  }).catch(error => {
    console.error('Failed to track notification dismissal:', error)
  })
})

// Handle push events (for additional processing)
self.addEventListener('push', (event) => {
  console.log('Push event received:', event)

  if (!event.data) {
    console.log('Push event has no data')
    return
  }

  try {
    const payload = event.data.json()
    console.log('Push payload:', payload)

    // Additional processing can be done here
    // For example, caching data, updating local storage, etc.
    
  } catch (error) {
    console.error('Error processing push event:', error)
  }
})

// Service worker installation
self.addEventListener('install', (event) => {
  console.log('Firebase Messaging Service Worker installed')
  self.skipWaiting()
})

// Service worker activation
self.addEventListener('activate', (event) => {
  console.log('Firebase Messaging Service Worker activated')
  event.waitUntil(self.clients.claim())
})