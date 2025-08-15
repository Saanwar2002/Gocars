/**
 * Offline Storage Utility
 * 
 * Provides IndexedDB-based storage for offline functionality and background sync
 */

interface StoredItem {
  id: string;
  data: any;
  timestamp: number;
  type: string;
  synced: boolean;
}

interface BookingData {
  id: string;
  pickupLocation: string;
  dropoffLocation: string;
  scheduledTime?: string;
  passengerCount: number;
  vehicleType: string;
  specialRequests?: string;
  userId: string;
}

interface LocationUpdate {
  id: string;
  userId: string;
  latitude: number;
  longitude: number;
  timestamp: number;
  accuracy?: number;
}

interface MessageData {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: number;
  type: 'text' | 'image' | 'location';
}

class OfflineStorage {
  private dbName = 'GoCarsOfflineDB';
  private version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores
        if (!db.objectStoreNames.contains('bookings')) {
          const bookingStore = db.createObjectStore('bookings', { keyPath: 'id' });
          bookingStore.createIndex('synced', 'synced', { unique: false });
          bookingStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        if (!db.objectStoreNames.contains('locations')) {
          const locationStore = db.createObjectStore('locations', { keyPath: 'id' });
          locationStore.createIndex('synced', 'synced', { unique: false });
          locationStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        if (!db.objectStoreNames.contains('messages')) {
          const messageStore = db.createObjectStore('messages', { keyPath: 'id' });
          messageStore.createIndex('synced', 'synced', { unique: false });
          messageStore.createIndex('conversationId', 'conversationId', { unique: false });
          messageStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        if (!db.objectStoreNames.contains('cache')) {
          const cacheStore = db.createObjectStore('cache', { keyPath: 'id' });
          cacheStore.createIndex('type', 'type', { unique: false });
          cacheStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  private async getStore(storeName: string, mode: IDBTransactionMode = 'readonly'): Promise<IDBObjectStore> {
    if (!this.db) {
      await this.init();
    }
    
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const transaction = this.db.transaction([storeName], mode);
    return transaction.objectStore(storeName);
  }

  // Booking operations
  async storeBooking(booking: BookingData): Promise<void> {
    const store = await this.getStore('bookings', 'readwrite');
    const item: StoredItem = {
      id: booking.id,
      data: booking,
      timestamp: Date.now(),
      type: 'booking',
      synced: false
    };

    return new Promise((resolve, reject) => {
      const request = store.put(item);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to store booking'));
    });
  }

  async getPendingBookings(): Promise<BookingData[]> {
    const store = await this.getStore('bookings');
    const index = store.index('synced');

    return new Promise((resolve, reject) => {
      const request = index.getAll(false);
      request.onsuccess = () => {
        const items = request.result as StoredItem[];
        resolve(items.map(item => item.data));
      };
      request.onerror = () => reject(new Error('Failed to get pending bookings'));
    });
  }

  async markBookingSynced(bookingId: string): Promise<void> {
    const store = await this.getStore('bookings', 'readwrite');

    return new Promise((resolve, reject) => {
      const getRequest = store.get(bookingId);
      getRequest.onsuccess = () => {
        const item = getRequest.result as StoredItem;
        if (item) {
          item.synced = true;
          const putRequest = store.put(item);
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(new Error('Failed to mark booking as synced'));
        } else {
          resolve(); // Item doesn't exist, consider it synced
        }
      };
      getRequest.onerror = () => reject(new Error('Failed to get booking'));
    });
  }

  async removeBooking(bookingId: string): Promise<void> {
    const store = await this.getStore('bookings', 'readwrite');

    return new Promise((resolve, reject) => {
      const request = store.delete(bookingId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to remove booking'));
    });
  }

  // Location operations
  async storeLocationUpdate(location: LocationUpdate): Promise<void> {
    const store = await this.getStore('locations', 'readwrite');
    const item: StoredItem = {
      id: location.id,
      data: location,
      timestamp: location.timestamp,
      type: 'location',
      synced: false
    };

    return new Promise((resolve, reject) => {
      const request = store.put(item);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to store location update'));
    });
  }

  async getPendingLocationUpdates(): Promise<LocationUpdate[]> {
    const store = await this.getStore('locations');
    const index = store.index('synced');

    return new Promise((resolve, reject) => {
      const request = index.getAll(false);
      request.onsuccess = () => {
        const items = request.result as StoredItem[];
        resolve(items.map(item => item.data));
      };
      request.onerror = () => reject(new Error('Failed to get pending location updates'));
    });
  }

  async markLocationSynced(locationId: string): Promise<void> {
    const store = await this.getStore('locations', 'readwrite');

    return new Promise((resolve, reject) => {
      const getRequest = store.get(locationId);
      getRequest.onsuccess = () => {
        const item = getRequest.result as StoredItem;
        if (item) {
          item.synced = true;
          const putRequest = store.put(item);
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(new Error('Failed to mark location as synced'));
        } else {
          resolve();
        }
      };
      getRequest.onerror = () => reject(new Error('Failed to get location'));
    });
  }

  // Message operations
  async storeMessage(message: MessageData): Promise<void> {
    const store = await this.getStore('messages', 'readwrite');
    const item: StoredItem = {
      id: message.id,
      data: message,
      timestamp: message.timestamp,
      type: 'message',
      synced: false
    };

    return new Promise((resolve, reject) => {
      const request = store.put(item);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to store message'));
    });
  }

  async getPendingMessages(): Promise<MessageData[]> {
    const store = await this.getStore('messages');
    const index = store.index('synced');

    return new Promise((resolve, reject) => {
      const request = index.getAll(false);
      request.onsuccess = () => {
        const items = request.result as StoredItem[];
        resolve(items.map(item => item.data));
      };
      request.onerror = () => reject(new Error('Failed to get pending messages'));
    });
  }

  async getConversationMessages(conversationId: string): Promise<MessageData[]> {
    const store = await this.getStore('messages');
    const index = store.index('conversationId');

    return new Promise((resolve, reject) => {
      const request = index.getAll(conversationId);
      request.onsuccess = () => {
        const items = request.result as StoredItem[];
        const messages = items.map(item => item.data).sort((a, b) => a.timestamp - b.timestamp);
        resolve(messages);
      };
      request.onerror = () => reject(new Error('Failed to get conversation messages'));
    });
  }

  async markMessageSynced(messageId: string): Promise<void> {
    const store = await this.getStore('messages', 'readwrite');

    return new Promise((resolve, reject) => {
      const getRequest = store.get(messageId);
      getRequest.onsuccess = () => {
        const item = getRequest.result as StoredItem;
        if (item) {
          item.synced = true;
          const putRequest = store.put(item);
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(new Error('Failed to mark message as synced'));
        } else {
          resolve();
        }
      };
      getRequest.onerror = () => reject(new Error('Failed to get message'));
    });
  }

  // Cache operations
  async cacheData(key: string, data: any, type: string): Promise<void> {
    const store = await this.getStore('cache', 'readwrite');
    const item: StoredItem = {
      id: key,
      data,
      timestamp: Date.now(),
      type,
      synced: true // Cache items are always considered synced
    };

    return new Promise((resolve, reject) => {
      const request = store.put(item);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to cache data'));
    });
  }

  async getCachedData(key: string): Promise<any | null> {
    const store = await this.getStore('cache');

    return new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => {
        const item = request.result as StoredItem;
        resolve(item ? item.data : null);
      };
      request.onerror = () => reject(new Error('Failed to get cached data'));
    });
  }

  async clearExpiredCache(maxAge: number = 24 * 60 * 60 * 1000): Promise<void> {
    const store = await this.getStore('cache', 'readwrite');
    const index = store.index('timestamp');
    const cutoffTime = Date.now() - maxAge;

    return new Promise((resolve, reject) => {
      const request = index.openCursor(IDBKeyRange.upperBound(cutoffTime));
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };
      request.onerror = () => reject(new Error('Failed to clear expired cache'));
    });
  }

  // Utility methods
  async getStorageUsage(): Promise<{ bookings: number; locations: number; messages: number; cache: number }> {
    const stores = ['bookings', 'locations', 'messages', 'cache'];
    const counts = await Promise.all(
      stores.map(async (storeName) => {
        const store = await this.getStore(storeName);
        return new Promise<number>((resolve, reject) => {
          const request = store.count();
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(new Error(`Failed to count ${storeName}`));
        });
      })
    );

    return {
      bookings: counts[0],
      locations: counts[1],
      messages: counts[2],
      cache: counts[3]
    };
  }

  async clearAllData(): Promise<void> {
    const stores = ['bookings', 'locations', 'messages', 'cache'];
    
    await Promise.all(
      stores.map(async (storeName) => {
        const store = await this.getStore(storeName, 'readwrite');
        return new Promise<void>((resolve, reject) => {
          const request = store.clear();
          request.onsuccess = () => resolve();
          request.onerror = () => reject(new Error(`Failed to clear ${storeName}`));
        });
      })
    );
  }

  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

// Export singleton instance
export const offlineStorage = new OfflineStorage();

// Background sync helper functions
export async function queueBookingForSync(booking: BookingData): Promise<void> {
  await offlineStorage.storeBooking(booking);
  
  // Register background sync if available
  if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register('booking-sync');
    } catch (error) {
      console.error('Failed to register background sync:', error);
    }
  }
}

export async function queueLocationUpdateForSync(location: LocationUpdate): Promise<void> {
  await offlineStorage.storeLocationUpdate(location);
  
  if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register('location-sync');
    } catch (error) {
      console.error('Failed to register location sync:', error);
    }
  }
}

export async function queueMessageForSync(message: MessageData): Promise<void> {
  await offlineStorage.storeMessage(message);
  
  if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register('message-sync');
    } catch (error) {
      console.error('Failed to register message sync:', error);
    }
  }
}