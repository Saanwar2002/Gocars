# Real-time Dashboard System

This directory contains the implementation of the real-time dashboard system for GoCars, featuring WebSocket integration, optimistic UI updates, and role-specific widgets.

## Architecture Overview

### Core Components

1. **WebSocket Service** (`/services/websocket.ts`)
   - Manages WebSocket connections with automatic reconnection
   - Handles message queuing and delivery guarantees
   - Provides subscription-based event handling
   - Includes heartbeat mechanism for connection health

2. **Real-time Data Hooks** (`/hooks/useRealTimeData.ts`)
   - React hooks for consuming real-time data
   - Automatic loading states and error handling
   - Data caching and optimistic updates
   - Specialized hooks for different data types

3. **Data Synchronization Service** (`/services/dataSynchronization.ts`)
   - Handles optimistic UI updates
   - Manages offline/online synchronization
   - Provides conflict resolution and retry logic
   - Batch processing for efficient data sync

4. **Role-specific Widgets** (`role-widgets.tsx`)
   - Passenger, Driver, Operator, and Admin widgets
   - Real-time data integration with loading states
   - Responsive design with skeleton screens
   - Configurable and customizable components

## Features

### Real-time Updates
- **Live Data Streaming**: WebSocket-based real-time data updates
- **Connection Management**: Automatic reconnection with exponential backoff
- **Message Queuing**: Reliable message delivery even during connection issues
- **Event Subscription**: Type-safe event handling with cleanup

### Optimistic UI
- **Instant Feedback**: Immediate UI updates before server confirmation
- **Automatic Reversion**: Rollback on failure with user notification
- **Conflict Resolution**: Smart handling of concurrent updates
- **Retry Logic**: Configurable retry attempts with exponential backoff

### Performance Optimization
- **Data Caching**: Intelligent caching with TTL and invalidation
- **Skeleton Loading**: Smooth loading states with skeleton screens
- **Batch Processing**: Efficient batch updates to reduce server load
- **Connection Pooling**: Optimized WebSocket connection management

### User Experience
- **Loading States**: Comprehensive loading and error states
- **Real-time Indicators**: Visual indicators for live data updates
- **Offline Support**: Graceful degradation when offline
- **Responsive Design**: Mobile-first responsive components

## Widget Types

### Passenger Widgets
- **Quick Booking**: One-tap ride booking interface
- **Active Ride**: Real-time ride status with driver info
- **Ride History**: Historical ride data with trends
- **Favorite Drivers**: Preferred driver management

### Driver Widgets
- **Earnings**: Real-time earnings tracking with trends
- **Ride Requests**: Incoming ride request management
- **Online Status**: Driver availability controls
- **Performance**: Rating and performance metrics

### Operator Widgets
- **Fleet Overview**: Real-time fleet status monitoring
- **Active Rides**: Current ride operations dashboard
- **Revenue**: Business revenue tracking
- **System Alerts**: Operational alerts and notifications

### Admin Widgets
- **System Health**: Platform health monitoring
- **Platform Metrics**: Key performance indicators
- **User Growth**: User acquisition and growth metrics
- **Security Alerts**: Security monitoring and alerts

## Usage Examples

### Basic Widget Usage
```tsx
import { DriverWidgets } from './role-widgets'

// Real-time earnings widget with automatic updates
const EarningsWidget = () => {
  const config = {
    id: 'earnings',
    title: 'Today\'s Earnings',
    type: 'metric',
    size: 'sm'
  }
  
  return DriverWidgets.earnings(config, 'driver_123')
}
```

### Custom Real-time Hook
```tsx
import { useRealTimeData, DASHBOARD_EVENTS } from '@/hooks/useRealTimeData'

const useCustomData = (userId: string) => {
  return useRealTimeData({
    eventType: DASHBOARD_EVENTS.USER_ACTIVITY,
    cacheKey: `user_${userId}`,
    optimisticUpdates: true,
    refreshInterval: 30000
  })
}
```

### Optimistic Updates
```tsx
import { syncHelpers } from '@/services/dataSynchronization'

const updateEarnings = (driverId: string, newEarnings: any) => {
  // Immediate UI update
  const operationId = syncHelpers.updateEarnings(driverId, newEarnings)
  
  // Handle confirmation/reversion automatically
  return operationId
}
```

## Configuration

### WebSocket Configuration
```typescript
const config = {
  url: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080',
  reconnectInterval: 3000,
  maxReconnectAttempts: 5,
  heartbeatInterval: 30000
}
```

### Sync Configuration
```typescript
const syncConfig = {
  maxRetries: 3,
  retryDelay: 1000,
  batchSize: 10,
  syncInterval: 5000
}
```

## Event Types

### Dashboard Events
- `RIDE_STATUS_UPDATE`: Ride status changes
- `DRIVER_LOCATION_UPDATE`: Driver location updates
- `EARNINGS_UPDATE`: Earnings data changes
- `FLEET_STATUS_UPDATE`: Fleet status changes
- `SYSTEM_ALERT`: System alerts and notifications
- `PERFORMANCE_METRICS`: Performance metric updates

## Testing

### Demo Component
The `real-time-demo.tsx` component provides a comprehensive demonstration of:
- WebSocket connection management
- Real-time data simulation
- Optimistic update testing
- All widget types in action

### Running the Demo
```tsx
import { RealTimeDashboardDemo } from './real-time-demo'

// Include in your app for testing
<RealTimeDashboardDemo />
```

## Best Practices

### Performance
- Use appropriate refresh intervals for different data types
- Implement proper cleanup in useEffect hooks
- Cache frequently accessed data
- Batch multiple updates when possible

### Error Handling
- Always provide fallback UI for connection failures
- Implement proper retry logic with exponential backoff
- Show meaningful error messages to users
- Log errors for debugging and monitoring

### Security
- Validate all incoming WebSocket messages
- Implement proper authentication for WebSocket connections
- Use secure WebSocket (WSS) in production
- Sanitize data before displaying to users

### Accessibility
- Provide proper ARIA labels for real-time updates
- Use semantic HTML for screen readers
- Implement keyboard navigation support
- Ensure color contrast meets WCAG guidelines

## Future Enhancements

### Planned Features
- **Push Notifications**: Browser push notification integration
- **Advanced Analytics**: Real-time analytics dashboard
- **Multi-tenant Support**: Organization-specific data isolation
- **Advanced Filtering**: Real-time data filtering and search
- **Export Functionality**: Real-time data export capabilities

### Performance Improvements
- **Service Worker Integration**: Offline-first architecture
- **Data Compression**: WebSocket message compression
- **Connection Pooling**: Advanced connection management
- **Edge Caching**: CDN integration for static assets

## Troubleshooting

### Common Issues
1. **Connection Failures**: Check WebSocket URL and network connectivity
2. **Missing Updates**: Verify event subscriptions and handlers
3. **Memory Leaks**: Ensure proper cleanup of subscriptions
4. **Performance Issues**: Check refresh intervals and batch sizes

### Debug Tools
- Browser DevTools WebSocket inspector
- Console logging for connection events
- Performance profiler for optimization
- Network tab for message inspection

## Contributing

When adding new widgets or features:
1. Follow the established patterns for real-time integration
2. Include proper TypeScript types
3. Add loading states and error handling
4. Write comprehensive tests
5. Update documentation

## Dependencies

- React 18+ for hooks and concurrent features
- TypeScript for type safety
- Tailwind CSS for styling
- Lucide React for icons
- Custom UI components from `/components/ui`