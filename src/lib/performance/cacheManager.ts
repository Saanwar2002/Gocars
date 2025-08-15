// Advanced caching strategies for optimal performance

interface CacheConfig {
  name: string;
  version: string;
  maxSize: number;
  maxAge: number;
  strategy: CacheStrategy;
  compression: boolean;
  encryption: boolean;
}

interface CacheEntry<T = any> {
  key: string;
  data: T;
  timestamp: number;
  expiresAt: number;
  size: number;
  accessCount: number;
  lastAccessed: number;
  priority: CachePriority;
  tags: string[];
  metadata: Record<string, any>;
}

type CacheStrategy = 
  | 'cache-first' 
  | 'network-first' 
  | 'stale-while-revalidate' 
  | 'network-only' 
  | 'cache-only';

type CachePriority = 'low' | 'medium' | 'high' | 'critical';

interface CacheStats {
  hitRate: number;
  missRate: number;
  totalRequests: number;
  totalHits: number;
  totalMisses: number;
  averageResponseTime: number;
  cacheSize: number;
  entryCount: number;
  evictionCount: number;
}

export class AdvancedCacheManager {
  private caches: Map<string, Map<string, CacheEntry>> = new Map();
  private configs: Map<string, CacheConfig> = new Map();
  private stats: Map<string, CacheStats> = new Map();
  private cleanupIntervals: Map<string, NodeJS.Timeout> = new Map();
  private compressionWorker: Worker | null = null;

  constructor() {
    this.initializeCompressionWorker();
    this.setupPerformanceMonitoring();
  }

  private initializeCompressionWorker() {
    if (typeof Worker !== 'undefined') {
      // Create compression worker for large data
      const workerCode = `
        self.onmessage = function(e) {
          const { action, data, id } = e.data;
          
          if (action === 'compress') {
            // Simple compression simulation
            const compressed = JSON.stringify(data);
            self.postMessage({ id, result: compressed, size: compressed.length });
          } else if (action === 'decompress') {
            try {
              const decompressed = JSON.parse(data);
              self.postMessage({ id, result: decompressed });
            } catch (error) {
              self.postMessage({ id, error: error.message });
            }
          }
        };
      `;
      
      const blob = new Blob([workerCode], { type: 'application/javascript' });
      this.compressionWorker = new Worker(URL.createObjectURL(blob));
    }
  }

  private setupPerformanceMonitoring() {
    // Monitor cache performance
    setInterval(() => {
      this.updateCacheStats();
      this.optimizeCaches();
    }, 60000); // Every minute
  }

  // Create or configure a cache
  public createCache(config: CacheConfig): void {
    this.configs.set(config.name, config);
    this.caches.set(config.name, new Map());
    this.stats.set(config.name, {
      hitRate: 0,
      missRate: 0,
      totalRequests: 0,
      totalHits: 0,
      totalMisses: 0,
      averageResponseTime: 0,
      cacheSize: 0,
      entryCount: 0,
      evictionCount: 0,
    });

    // Setup cleanup interval
    const cleanupInterval = setInterval(() => {
      this.cleanupCache(config.name);
    }, config.maxAge / 10); // Cleanup every 10% of maxAge

    this.cleanupIntervals.set(config.name, cleanupInterval);
  }

  // Get data from cache with strategy
  public async get<T>(
    cacheName: string, 
    key: string, 
    fetchFn?: () => Promise<T>
  ): Promise<T | null> {
    const startTime = performance.now();
    const config = this.configs.get(cacheName);
    const cache = this.caches.get(cacheName);
    const stats = this.stats.get(cacheName);

    if (!config || !cache || !stats) {
      throw new Error(`Cache ${cacheName} not found`);
    }

    stats.totalRequests++;

    // Check cache first
    const entry = cache.get(key);
    const now = Date.now();

    if (entry && entry.expiresAt > now) {
      // Cache hit
      entry.accessCount++;
      entry.lastAccessed = now;
      stats.totalHits++;
      stats.hitRate = stats.totalHits / stats.totalRequests;
      
      const responseTime = performance.now() - startTime;
      stats.averageResponseTime = 
        (stats.averageResponseTime * (stats.totalRequests - 1) + responseTime) / stats.totalRequests;

      return this.deserializeData(entry.data, config);
    }

    // Cache miss - handle based on strategy
    stats.totalMisses++;
    stats.missRate = stats.totalMisses / stats.totalRequests;

    if (!fetchFn) {
      return null;
    }

    switch (config.strategy) {
      case 'cache-first':
        return this.handleCacheFirst(cacheName, key, fetchFn, entry);
      
      case 'network-first':
        return this.handleNetworkFirst(cacheName, key, fetchFn, entry);
      
      case 'stale-while-revalidate':
        return this.handleStaleWhileRevalidate(cacheName, key, fetchFn, entry);
      
      case 'network-only':
        return fetchFn();
      
      case 'cache-only':
        return entry ? this.deserializeData(entry.data, config) : null;
      
      default:
        return this.handleNetworkFirst(cacheName, key, fetchFn, entry);
    }
  }

  // Set data in cache
  public async set<T>(
    cacheName: string, 
    key: string, 
    data: T, 
    options: {
      ttl?: number;
      priority?: CachePriority;
      tags?: string[];
      metadata?: Record<string, any>;
    } = {}
  ): Promise<void> {
    const config = this.configs.get(cacheName);
    const cache = this.caches.get(cacheName);

    if (!config || !cache) {
      throw new Error(`Cache ${cacheName} not found`);
    }

    const now = Date.now();
    const ttl = options.ttl || config.maxAge;
    const serializedData = await this.serializeData(data, config);
    const size = this.calculateSize(serializedData);

    // Check if we need to evict entries
    await this.ensureCapacity(cacheName, size);

    const entry: CacheEntry<T> = {
      key,
      data: serializedData,
      timestamp: now,
      expiresAt: now + ttl,
      size,
      accessCount: 0,
      lastAccessed: now,
      priority: options.priority || 'medium',
      tags: options.tags || [],
      metadata: options.metadata || {},
    };

    cache.set(key, entry);
    this.updateCacheSize(cacheName);
  }

  // Cache strategy implementations
  private async handleCacheFirst<T>(
    cacheName: string, 
    key: string, 
    fetchFn: () => Promise<T>, 
    staleEntry?: CacheEntry
  ): Promise<T> {
    if (staleEntry) {
      // Return stale data immediately
      return this.deserializeData(staleEntry.data, this.configs.get(cacheName)!);
    }

    // Fetch from network and cache
    try {
      const data = await fetchFn();
      await this.set(cacheName, key, data);
      return data;
    } catch (error) {
      console.error('Network fetch failed in cache-first strategy:', error);
      throw error;
    }
  }

  private async handleNetworkFirst<T>(
    cacheName: string, 
    key: string, 
    fetchFn: () => Promise<T>, 
    staleEntry?: CacheEntry
  ): Promise<T> {
    try {
      // Try network first
      const data = await fetchFn();
      await this.set(cacheName, key, data);
      return data;
    } catch (error) {
      // Fallback to stale cache if available
      if (staleEntry) {
        console.warn('Network failed, returning stale cache:', error);
        return this.deserializeData(staleEntry.data, this.configs.get(cacheName)!);
      }
      throw error;
    }
  }

  private async handleStaleWhileRevalidate<T>(
    cacheName: string, 
    key: string, 
    fetchFn: () => Promise<T>, 
    staleEntry?: CacheEntry
  ): Promise<T> {
    // Return stale data immediately if available
    const staleData = staleEntry ? 
      this.deserializeData(staleEntry.data, this.configs.get(cacheName)!) : null;

    // Revalidate in background
    fetchFn().then(freshData => {
      this.set(cacheName, key, freshData);
    }).catch(error => {
      console.warn('Background revalidation failed:', error);
    });

    // If no stale data, wait for network
    if (!staleData) {
      return fetchFn();
    }

    return staleData;
  }

  // Data serialization/deserialization
  private async serializeData(data: any, config: CacheConfig): Promise<any> {
    let serialized = data;

    if (config.compression && this.compressionWorker) {
      serialized = await this.compressData(data);
    }

    if (config.encryption) {
      serialized = await this.encryptData(serialized);
    }

    return serialized;
  }

  private async deserializeData(data: any, config: CacheConfig): Promise<any> {
    let deserialized = data;

    if (config.encryption) {
      deserialized = await this.decryptData(deserialized);
    }

    if (config.compression && this.compressionWorker) {
      deserialized = await this.decompressData(deserialized);
    }

    return deserialized;
  }

  private compressData(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.compressionWorker) {
        resolve(data);
        return;
      }

      const id = Math.random().toString(36);
      
      const handleMessage = (e: MessageEvent) => {
        if (e.data.id === id) {
          this.compressionWorker!.removeEventListener('message', handleMessage);
          if (e.data.error) {
            reject(new Error(e.data.error));
          } else {
            resolve(e.data.result);
          }
        }
      };

      this.compressionWorker.addEventListener('message', handleMessage);
      this.compressionWorker.postMessage({ action: 'compress', data, id });
    });
  }

  private decompressData(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.compressionWorker) {
        resolve(data);
        return;
      }

      const id = Math.random().toString(36);
      
      const handleMessage = (e: MessageEvent) => {
        if (e.data.id === id) {
          this.compressionWorker!.removeEventListener('message', handleMessage);
          if (e.data.error) {
            reject(new Error(e.data.error));
          } else {
            resolve(e.data.result);
          }
        }
      };

      this.compressionWorker.addEventListener('message', handleMessage);
      this.compressionWorker.postMessage({ action: 'decompress', data, id });
    });
  }

  private async encryptData(data: any): Promise<string> {
    // Simple encryption for demo - use proper encryption in production
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(JSON.stringify(data));
    
    if ('crypto' in window && 'subtle' in crypto) {
      try {
        const key = await crypto.subtle.generateKey(
          { name: 'AES-GCM', length: 256 },
          false,
          ['encrypt']
        );
        
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const encrypted = await crypto.subtle.encrypt(
          { name: 'AES-GCM', iv },
          key,
          dataBuffer
        );
        
        return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
      } catch (error) {
        console.warn('Encryption failed, storing unencrypted:', error);
      }
    }
    
    return btoa(JSON.stringify(data));
  }

  private async decryptData(encryptedData: string): Promise<any> {
    try {
      return JSON.parse(atob(encryptedData));
    } catch (error) {
      console.warn('Decryption failed:', error);
      return null;
    }
  }

  // Cache management
  private calculateSize(data: any): number {
    try {
      return new Blob([JSON.stringify(data)]).size;
    } catch {
      return JSON.stringify(data).length * 2;
    }
  }

  private async ensureCapacity(cacheName: string, requiredSize: number): Promise<void> {
    const config = this.configs.get(cacheName)!;
    const cache = this.caches.get(cacheName)!;
    const stats = this.stats.get(cacheName)!;

    if (stats.cacheSize + requiredSize <= config.maxSize) {
      return;
    }

    // Evict entries using LRU with priority
    const entries = Array.from(cache.entries())
      .map(([key, entry]) => ({ key, ...entry }))
      .sort((a, b) => {
        // Sort by priority first, then by last accessed time
        const priorityOrder = { low: 0, medium: 1, high: 2, critical: 3 };
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        
        if (priorityDiff !== 0) return priorityDiff;
        return a.lastAccessed - b.lastAccessed;
      });

    let freedSize = 0;
    for (const entry of entries) {
      if (stats.cacheSize - freedSize + requiredSize <= config.maxSize) {
        break;
      }

      cache.delete(entry.key);
      freedSize += entry.size;
      stats.evictionCount++;
    }

    this.updateCacheSize(cacheName);
  }

  private updateCacheSize(cacheName: string): void {
    const cache = this.caches.get(cacheName)!;
    const stats = this.stats.get(cacheName)!;

    let totalSize = 0;
    for (const entry of cache.values()) {
      totalSize += entry.size;
    }

    stats.cacheSize = totalSize;
    stats.entryCount = cache.size;
  }

  private cleanupCache(cacheName: string): void {
    const cache = this.caches.get(cacheName)!;
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, entry] of cache.entries()) {
      if (entry.expiresAt < now) {
        cache.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      this.updateCacheSize(cacheName);
    }
  }

  private updateCacheStats(): void {
    for (const [cacheName, stats] of this.stats.entries()) {
      if (stats.totalRequests > 0) {
        stats.hitRate = stats.totalHits / stats.totalRequests;
        stats.missRate = stats.totalMisses / stats.totalRequests;
      }
    }
  }

  private optimizeCaches(): void {
    // Optimize cache configurations based on usage patterns
    for (const [cacheName, stats] of this.stats.entries()) {
      const config = this.configs.get(cacheName)!;
      
      // Adjust cache size based on hit rate
      if (stats.hitRate < 0.5 && config.maxSize > 1024 * 1024) {
        // Low hit rate - reduce cache size
        config.maxSize *= 0.9;
      } else if (stats.hitRate > 0.8 && stats.cacheSize > config.maxSize * 0.8) {
        // High hit rate and near capacity - increase size
        config.maxSize *= 1.1;
      }
    }
  }

  // Public API methods
  public invalidate(cacheName: string, key?: string): void {
    const cache = this.caches.get(cacheName);
    if (!cache) return;

    if (key) {
      cache.delete(key);
    } else {
      cache.clear();
    }

    this.updateCacheSize(cacheName);
  }

  public invalidateByTag(cacheName: string, tag: string): void {
    const cache = this.caches.get(cacheName);
    if (!cache) return;

    for (const [key, entry] of cache.entries()) {
      if (entry.tags.includes(tag)) {
        cache.delete(key);
      }
    }

    this.updateCacheSize(cacheName);
  }

  public getStats(cacheName: string): CacheStats | null {
    return this.stats.get(cacheName) || null;
  }

  public getAllStats(): Map<string, CacheStats> {
    return new Map(this.stats);
  }

  public exportCache(cacheName: string): any[] {
    const cache = this.caches.get(cacheName);
    if (!cache) return [];

    return Array.from(cache.entries()).map(([key, entry]) => ({
      key,
      ...entry,
    }));
  }

  public importCache(cacheName: string, entries: any[]): void {
    const cache = this.caches.get(cacheName);
    if (!cache) return;

    entries.forEach(entry => {
      const { key, ...entryData } = entry;
      cache.set(key, entryData);
    });

    this.updateCacheSize(cacheName);
  }

  public cleanup(): void {
    // Cleanup all intervals
    for (const interval of this.cleanupIntervals.values()) {
      clearInterval(interval);
    }

    // Terminate compression worker
    if (this.compressionWorker) {
      this.compressionWorker.terminate();
    }

    // Clear all caches
    this.caches.clear();
    this.configs.clear();
    this.stats.clear();
  }
}

// Create default cache configurations
export const cacheManager = new AdvancedCacheManager();

// Setup default caches
cacheManager.createCache({
  name: 'api-cache',
  version: '1.0',
  maxSize: 50 * 1024 * 1024, // 50MB
  maxAge: 5 * 60 * 1000, // 5 minutes
  strategy: 'stale-while-revalidate',
  compression: true,
  encryption: false,
});

cacheManager.createCache({
  name: 'static-cache',
  version: '1.0',
  maxSize: 100 * 1024 * 1024, // 100MB
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  strategy: 'cache-first',
  compression: true,
  encryption: false,
});

cacheManager.createCache({
  name: 'user-cache',
  version: '1.0',
  maxSize: 10 * 1024 * 1024, // 10MB
  maxAge: 60 * 60 * 1000, // 1 hour
  strategy: 'network-first',
  compression: false,
  encryption: true,
});

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    cacheManager.cleanup();
  });
}