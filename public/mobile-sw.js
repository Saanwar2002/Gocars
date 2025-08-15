// Mobile-optimized Service Worker for performance and offline functionality

const CACHE_NAME = 'gocars-mobile-v1';
const STATIC_CACHE = 'gocars-static-v1';
const DYNAMIC_CACHE = 'gocars-dynamic-v1';
const IMAGE_CACHE = 'gocars-images-v1';

// Resources to cache immediately
const STATIC_ASSETS = [
  '/',
  '/mobile-demo',
  '/performance-demo',
  '/manifest.json',
  '/offline',
  // Add critical CSS and JS files
];

// Network-first resources (always try network first)
const NETWORK_FIRST = [
  '/api/',
  '/auth/',
];

// Cache-first resources (serve from cache if available)
const CACHE_FIRST = [
  '/images/',
  '/icons/',
  '/fonts/',
  '.woff2',
  '.woff',
  '.ttf',
];

// Stale-while-revalidate resources
const STALE_WHILE_REVALIDATE = [
  '/dashboard',
  '/profile',
  '/settings',
];

self.addEventListener('install', (event) => {
  console.log('Mobile SW: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Mobile SW: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('Mobile SW: Skip waiting');
        return self.skipWaiting();
      })
  );
});

self.addEventListener('activate', (event) => {
  console.log('Mobile SW: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && 
                cacheName !== STATIC_CACHE && 
                cacheName !== DYNAMIC_CACHE && 
                cacheName !== IMAGE_CACHE) {
              console.log('Mobile SW: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Mobile SW: Claiming clients');
        return self.clients.claim();
      })
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip chrome-extension and other non-http requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Handle different caching strategies based on request type
  if (isNetworkFirst(request.url)) {
    event.respondWith(networkFirst(request));
  } else if (isCacheFirst(request.url)) {
    event.respondWith(cacheFirst(request));
  } else if (isStaleWhileRevalidate(request.url)) {
    event.respondWith(staleWhileRevalidate(request));
  } else if (isImageRequest(request)) {
    event.respondWith(handleImageRequest(request));
  } else {
    event.respondWith(networkFirst(request));
  }
});

// Network-first strategy
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Mobile SW: Network failed, trying cache:', request.url);
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return caches.match('/offline');
    }
    
    throw error;
  }
}

// Cache-first strategy
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Mobile SW: Cache-first failed:', request.url);
    throw error;
  }
}

// Stale-while-revalidate strategy
async function staleWhileRevalidate(request) {
  const cachedResponse = await caches.match(request);
  
  const networkResponsePromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        const cache = caches.open(DYNAMIC_CACHE);
        cache.then(c => c.put(request, networkResponse.clone()));
      }
      return networkResponse;
    })
    .catch(() => {
      console.log('Mobile SW: Network failed for stale-while-revalidate:', request.url);
    });
  
  return cachedResponse || networkResponsePromise;
}

// Handle image requests with network-aware optimization
async function handleImageRequest(request) {
  const url = new URL(request.url);
  
  // Check if we have a cached version
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    // Get connection info from client if available
    const clients = await self.clients.matchAll();
    let connectionType = '4g'; // default
    
    if (clients.length > 0) {
      // This would need to be communicated from the client
      // For now, we'll use a default optimization
    }
    
    // Optimize image request based on connection
    const optimizedUrl = optimizeImageUrl(url.href, connectionType);
    const optimizedRequest = new Request(optimizedUrl, {
      headers: request.headers,
      mode: request.mode,
      credentials: request.credentials,
    });
    
    const networkResponse = await fetch(optimizedRequest);
    
    if (networkResponse.ok) {
      const cache = await caches.open(IMAGE_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Mobile SW: Image request failed:', request.url);
    
    // Return a placeholder image
    return new Response(
      '<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg"><rect width="400" height="300" fill="#f0f0f0"/><text x="200" y="150" text-anchor="middle" fill="#999">Image unavailable</text></svg>',
      {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'no-cache',
        },
      }
    );
  }
}

// Optimize image URL based on connection type
function optimizeImageUrl(url, connectionType) {
  if (url.includes('picsum.photos') || url.includes('unsplash.com')) {
    const urlObj = new URL(url);
    
    // Adjust quality based on connection
    let quality = 80;
    if (connectionType === 'slow-2g' || connectionType === '2g') {
      quality = 40;
    } else if (connectionType === '3g') {
      quality = 60;
    }
    
    // Add quality parameter
    urlObj.searchParams.set('q', quality.toString());
    
    return urlObj.href;
  }
  
  return url;
}

// Helper functions to determine caching strategy
function isNetworkFirst(url) {
  return NETWORK_FIRST.some(pattern => url.includes(pattern));
}

function isCacheFirst(url) {
  return CACHE_FIRST.some(pattern => url.includes(pattern));
}

function isStaleWhileRevalidate(url) {
  return STALE_WHILE_REVALIDATE.some(pattern => url.includes(pattern));
}

function isImageRequest(request) {
  return request.destination === 'image' || 
         request.url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i);
}

// Handle background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Mobile SW: Background sync triggered:', event.tag);
  
  if (event.tag === 'offline-actions') {
    event.waitUntil(syncOfflineActions());
  }
});

async function syncOfflineActions() {
  try {
    // Get offline actions from IndexedDB or localStorage
    const clients = await self.clients.matchAll();
    
    if (clients.length > 0) {
      // Notify clients to sync their offline actions
      clients.forEach(client => {
        client.postMessage({
          type: 'SYNC_OFFLINE_ACTIONS',
          timestamp: Date.now(),
        });
      });
    }
  } catch (error) {
    console.error('Mobile SW: Failed to sync offline actions:', error);
  }
}

// Handle push notifications
self.addEventListener('push', (event) => {
  console.log('Mobile SW: Push received');
  
  const options = {
    body: 'You have a new ride request!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      url: '/dashboard',
    },
    actions: [
      {
        action: 'accept',
        title: 'Accept',
        icon: '/icons/accept.png',
      },
      {
        action: 'decline',
        title: 'Decline',
        icon: '/icons/decline.png',
      },
    ],
  };
  
  if (event.data) {
    const data = event.data.json();
    options.body = data.body || options.body;
    options.data = { ...options.data, ...data };
  }
  
  event.waitUntil(
    self.registration.showNotification('GoCars', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Mobile SW: Notification clicked:', event.action);
  
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/dashboard';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window/tab open with the target URL
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        
        // If not, open a new window/tab
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Periodic background sync for cache cleanup
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'cache-cleanup') {
    event.waitUntil(cleanupCaches());
  }
});

async function cleanupCaches() {
  const cacheNames = await caches.keys();
  const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
  const now = Date.now();
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const requests = await cache.keys();
    
    for (const request of requests) {
      const response = await cache.match(request);
      const dateHeader = response?.headers.get('date');
      
      if (dateHeader) {
        const cacheDate = new Date(dateHeader).getTime();
        if (now - cacheDate > maxAge) {
          await cache.delete(request);
          console.log('Mobile SW: Cleaned up old cache entry:', request.url);
        }
      }
    }
  }
}

// Handle messages from clients
self.addEventListener('message', (event) => {
  console.log('Mobile SW: Message received:', event.data);
  
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  } else if (event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(DYNAMIC_CACHE)
        .then(cache => cache.addAll(event.data.urls))
    );
  }
});