import { WidgetConfig } from '@/components/dashboard/widget-system'

// Widget Data Types
export interface WidgetDataResponse {
  data: any
  timestamp: number
  error?: string
  loading?: boolean
}

export interface CacheEntry {
  data: any
  timestamp: number
  expiresAt: number
}

// Widget Data Service
class WidgetDataService {
  private cache = new Map<string, CacheEntry>()
  private refreshIntervals = new Map<string, NodeJS.Timeout>()
  private subscribers = new Map<string, Set<(data: WidgetDataResponse) => void>>()

  // Cache Management
  private getCacheKey(widgetId: string, params?: Record<string, any>): string {
    const paramString = params ? JSON.stringify(params) : ''
    return `${widgetId}:${paramString}`
  }

  private isExpired(entry: CacheEntry): boolean {
    return Date.now() > entry.expiresAt
  }

  private setCache(key: string, data: any, ttl: number = 300000): void { // 5 minutes default
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttl,
    })
  }

  private getCache(key: string): CacheEntry | null {
    const entry = this.cache.get(key)
    if (!entry || this.isExpired(entry)) {
      this.cache.delete(key)
      return null
    }
    return entry
  }

  // Data Fetching
  async fetchWidgetData(
    widget: WidgetConfig,
    params?: Record<string, any>,
    forceRefresh: boolean = false
  ): Promise<WidgetDataResponse> {
    const cacheKey = this.getCacheKey(widget.id, params)
    
    // Check cache first
    if (!forceRefresh) {
      const cached = this.getCache(cacheKey)
      if (cached) {
        return {
          data: cached.data,
          timestamp: cached.timestamp,
        }
      }
    }

    try {
      // Simulate API call based on widget type
      const data = await this.fetchDataByType(widget, params)
      
      // Cache the result
      this.setCache(cacheKey, data)
      
      const response: WidgetDataResponse = {
        data,
        timestamp: Date.now(),
      }

      // Notify subscribers
      this.notifySubscribers(widget.id, response)
      
      return response
    } catch (error) {
      const errorResponse: WidgetDataResponse = {
        data: null,
        timestamp: Date.now(),
        error: error instanceof Error ? error.message : 'Unknown error',
      }

      this.notifySubscribers(widget.id, errorResponse)
      return errorResponse
    }
  }

  private async fetchDataByType(widget: WidgetConfig, params?: Record<string, any>): Promise<any> {
    // Simulate different data fetching based on widget type
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500)) // Simulate network delay

    switch (widget.type) {
      case 'metric':
        return this.generateMetricData(widget)
      case 'chart':
        return this.generateChartData(widget)
      case 'list':
        return this.generateListData(widget)
      case 'map':
        return this.generateMapData(widget)
      case 'action':
        return this.generateActionData(widget)
      default:
        return { message: 'No data available' }
    }
  }

  // Data Generators (simulate real API responses)
  private generateMetricData(widget: WidgetConfig) {
    const metrics = {
      'Total Rides': Math.floor(Math.random() * 1000) + 500,
      'Active Drivers': Math.floor(Math.random() * 50) + 20,
      'Revenue': Math.floor(Math.random() * 10000) + 5000,
      'Average Rating': (Math.random() * 2 + 3).toFixed(1),
    }

    return {
      value: metrics[widget.title as keyof typeof metrics] || Math.floor(Math.random() * 100),
      change: (Math.random() * 20 - 10).toFixed(1),
      trend: Math.random() > 0.5 ? 'up' : 'down',
      period: 'Last 24 hours',
    }
  }

  private generateChartData(widget: WidgetConfig) {
    const dataPoints = Array.from({ length: 12 }, (_, i) => ({
      label: `${i + 1}:00`,
      value: Math.floor(Math.random() * 100) + 20,
    }))

    return {
      type: 'line',
      data: dataPoints,
      title: widget.title,
      xAxis: 'Time',
      yAxis: 'Count',
    }
  }

  private generateListData(widget: WidgetConfig) {
    const items = [
      { id: 1, title: 'Recent Booking #1234', status: 'completed', time: '2 min ago' },
      { id: 2, title: 'Driver Request #5678', status: 'pending', time: '5 min ago' },
      { id: 3, title: 'Payment #9012', status: 'processing', time: '8 min ago' },
      { id: 4, title: 'Support Ticket #3456', status: 'open', time: '12 min ago' },
      { id: 5, title: 'Fleet Update #7890', status: 'completed', time: '15 min ago' },
    ]

    return {
      items: items.slice(0, Math.floor(Math.random() * 5) + 1),
      total: items.length,
      hasMore: Math.random() > 0.5,
    }
  }

  private generateMapData(widget: WidgetConfig) {
    const locations = Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      lat: 40.7128 + (Math.random() - 0.5) * 0.1,
      lng: -74.0060 + (Math.random() - 0.5) * 0.1,
      type: Math.random() > 0.5 ? 'driver' : 'passenger',
      status: Math.random() > 0.3 ? 'active' : 'idle',
    }))

    return {
      locations,
      center: { lat: 40.7128, lng: -74.0060 },
      zoom: 12,
    }
  }

  private generateActionData(widget: WidgetConfig) {
    return {
      actions: [
        { id: 'quick-book', label: 'Quick Book', enabled: true },
        { id: 'emergency', label: 'Emergency', enabled: true },
        { id: 'support', label: 'Support', enabled: Math.random() > 0.2 },
      ],
      quickStats: {
        pending: Math.floor(Math.random() * 10),
        active: Math.floor(Math.random() * 5),
      },
    }
  }

  // Subscription Management
  subscribe(widgetId: string, callback: (data: WidgetDataResponse) => void): () => void {
    if (!this.subscribers.has(widgetId)) {
      this.subscribers.set(widgetId, new Set())
    }
    
    this.subscribers.get(widgetId)!.add(callback)
    
    // Return unsubscribe function
    return () => {
      const subscribers = this.subscribers.get(widgetId)
      if (subscribers) {
        subscribers.delete(callback)
        if (subscribers.size === 0) {
          this.subscribers.delete(widgetId)
        }
      }
    }
  }

  private notifySubscribers(widgetId: string, data: WidgetDataResponse): void {
    const subscribers = this.subscribers.get(widgetId)
    if (subscribers) {
      subscribers.forEach(callback => callback(data))
    }
  }

  // Auto Refresh Management
  startAutoRefresh(widget: WidgetConfig, callback: (data: WidgetDataResponse) => void): void {
    if (!widget.refreshInterval || widget.refreshInterval <= 0) return

    // Clear existing interval
    this.stopAutoRefresh(widget.id)

    const interval = setInterval(async () => {
      try {
        const data = await this.fetchWidgetData(widget, undefined, true)
        callback(data)
      } catch (error) {
        console.error(`Auto refresh failed for widget ${widget.id}:`, error)
      }
    }, widget.refreshInterval)

    this.refreshIntervals.set(widget.id, interval)
  }

  stopAutoRefresh(widgetId: string): void {
    const interval = this.refreshIntervals.get(widgetId)
    if (interval) {
      clearInterval(interval)
      this.refreshIntervals.delete(widgetId)
    }
  }

  // Cache Management Methods
  clearCache(widgetId?: string): void {
    if (widgetId) {
      // Clear cache for specific widget
      const keysToDelete = Array.from(this.cache.keys()).filter(key => 
        key.startsWith(`${widgetId}:`)
      )
      keysToDelete.forEach(key => this.cache.delete(key))
    } else {
      // Clear all cache
      this.cache.clear()
    }
  }

  getCacheStats(): { size: number; entries: Array<{ key: string; timestamp: number; expiresAt: number }> } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.entries()).map(([key, entry]) => ({
        key,
        timestamp: entry.timestamp,
        expiresAt: entry.expiresAt,
      })),
    }
  }

  // Batch Operations
  async refreshMultipleWidgets(widgets: WidgetConfig[]): Promise<Map<string, WidgetDataResponse>> {
    const results = new Map<string, WidgetDataResponse>()
    
    const promises = widgets.map(async (widget) => {
      try {
        const data = await this.fetchWidgetData(widget, undefined, true)
        results.set(widget.id, data)
      } catch (error) {
        results.set(widget.id, {
          data: null,
          timestamp: Date.now(),
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    })

    await Promise.all(promises)
    return results
  }

  // Cleanup
  cleanup(): void {
    // Clear all intervals
    this.refreshIntervals.forEach(interval => clearInterval(interval))
    this.refreshIntervals.clear()
    
    // Clear cache
    this.cache.clear()
    
    // Clear subscribers
    this.subscribers.clear()
  }
}

// Export singleton instance
export const widgetDataService = new WidgetDataService()

// React Hook for Widget Data
export const useWidgetData = (widget: WidgetConfig, params?: Record<string, any>) => {
  const [data, setData] = React.useState<WidgetDataResponse>({ 
    data: null, 
    timestamp: 0, 
    loading: true 
  })

  React.useEffect(() => {
    let mounted = true

    // Initial fetch
    const fetchData = async () => {
      if (!mounted) return
      
      setData(prev => ({ ...prev, loading: true }))
      
      try {
        const response = await widgetDataService.fetchWidgetData(widget, params)
        if (mounted) {
          setData({ ...response, loading: false })
        }
      } catch (error) {
        if (mounted) {
          setData({
            data: null,
            timestamp: Date.now(),
            loading: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          })
        }
      }
    }

    fetchData()

    // Subscribe to updates
    const unsubscribe = widgetDataService.subscribe(widget.id, (response) => {
      if (mounted) {
        setData({ ...response, loading: false })
      }
    })

    // Setup auto refresh
    if (widget.refreshInterval && widget.refreshInterval > 0) {
      widgetDataService.startAutoRefresh(widget, (response) => {
        if (mounted) {
          setData({ ...response, loading: false })
        }
      })
    }

    return () => {
      mounted = false
      unsubscribe()
      widgetDataService.stopAutoRefresh(widget.id)
    }
  }, [widget.id, widget.refreshInterval, JSON.stringify(params)])

  const refresh = React.useCallback(async () => {
    setData(prev => ({ ...prev, loading: true }))
    try {
      const response = await widgetDataService.fetchWidgetData(widget, params, true)
      setData({ ...response, loading: false })
    } catch (error) {
      setData({
        data: null,
        timestamp: Date.now(),
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }, [widget, params])

  return { ...data, refresh }
}

// Import React for the hook
import * as React from 'react'