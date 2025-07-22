# GoCars WebSocket System

## Overview

The GoCars WebSocket system provides real-time communication capabilities for the taxi booking platform. It enables instant updates for ride status, location tracking, chat messaging, notifications, and system monitoring.

## Architecture

### Components

1. **WebSocket Server** (`websocket-server.ts`)
   - Handles server-side WebSocket connections
   - Manages rooms and user sessions
   - Broadcasts messages and events
   - Provides connection health monitoring

2. **WebSocket Client** (`websocket-client.ts`)
   - Client-side WebSocket connection management
   - Automatic reconnection with exponential backoff
   - Message queuing for offline scenarios
   - Event subscription system

3. **React Hooks** (`useWebSocket.ts`)
   - Easy-to-use React hooks for WebSocket functionality
   - Specialized hooks for different features (location, rides, chat, etc.)
   - Automatic cleanup and memory management

4. **Context Provider** (`WebSocketContext.tsx`)
   - React context for global WebSocket state
   - Automatic user authentication and connection
   - Device detection and connection info

## Features

### Real-time Communication
- **Instant Messaging**: Real-time chat between users
- **Location Updates**: Live location tracking for drivers and passengers
- **Ride Status**: Real-time ride status updates and notifications
- **Driver Status**: Online/offline/busy status broadcasting
- **System Notifications**: Push notifications and alerts

### Connection Management
- **Automatic Reconnection**: Exponential backoff reconnection strategy
- **Connection Health**: Heartbeat monitoring and health checks
- **Message Queuing**: Offline message storage and delivery
- **Room Management**: Dynamic room creation and user management

### Security & Performance
- **Authentication**: User authentication and role-based access
- **Rate Limiting**: Connection and message rate limiting
- **Scalability**: Connection pooling and load balancing ready
- **Error Handling**: Comprehensive error handling and recovery

## Usage

### Basic Setup

1. **Initialize WebSocket Server**
```typescript
// pages/api/socket.ts
import { webSocketServer } from '@/lib/websocket/websocket-server'

export default function handler(req, res) {
  if (!res.socket.server.io) {
    webSocketServer.initialize(res.socket.server)
    res.socket.server.io = webSocketServer
  }
  res.end()
}
```

2. **Add WebSocket Provider**
```tsx
// _app.tsx
import { WebSocketProvider } from '@/contexts/WebSocketContext'

function MyApp({ Component, pageProps }) {
  return (
    <AuthProvider>
      <WebSocketProvider>
        <Component {...pageProps} />
      </WebSocketProvider>
    </AuthProvider>
  )
}
```

### Using React Hooks

#### Basic Connection
```tsx
import { useWebSocket } from '@/hooks/useWebSocket'

function MyComponent() {
  const { isConnected, sendMessage, joinRoom } = useWebSocket(userId, userRole)
  
  const handleSendMessage = () => {
    sendMessage({
      type: 'chat_message',
      payload: { content: 'Hello!' },
      timestamp: Date.now(),
      userId,
      roomId: 'chat-room'
    })
  }
  
  return (
    <div>
      <p>Status: {isConnected ? 'Connected' : 'Disconnected'}</p>
      <button onClick={handleSendMessage}>Send Message</button>
    </div>
  )
}
```

#### Location Tracking
```tsx
import { useLocationTracking } from '@/hooks/useWebSocket'

function LocationTracker() {
  const { locations, updateMyLocation } = useLocationTracking(userId, userRole)
  
  const handleLocationUpdate = () => {
    navigator.geolocation.getCurrentPosition((position) => {
      updateMyLocation({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        heading: position.coords.heading
      })
    })
  }
  
  return (
    <div>
      <button onClick={handleLocationUpdate}>Update Location</button>
      <div>
        {locations.map(location => (
          <div key={location.userId}>
            {location.userId}: {location.lat}, {location.lng}
          </div>
        ))}
      </div>
    </div>
  )
}
```

#### Ride Tracking
```tsx
import { useRideTracking } from '@/hooks/useWebSocket'

function RideTracker({ rideId }) {
  const { rideStatus, updateStatus } = useRideTracking(userId, userRole, rideId)
  
  return (
    <div>
      <p>Ride Status: {rideStatus?.status}</p>
      <button onClick={() => updateStatus('in_progress')}>
        Start Ride
      </button>
      <button onClick={() => updateStatus('completed')}>
        Complete Ride
      </button>
    </div>
  )
}
```

#### Chat System
```tsx
import { useChat } from '@/hooks/useWebSocket'

function ChatComponent({ roomId }) {
  const { messages, sendChatMessage } = useChat(userId, userRole, roomId)
  const [message, setMessage] = useState('')
  
  const handleSend = () => {
    sendChatMessage(message)
    setMessage('')
  }
  
  return (
    <div>
      <div>
        {messages.map((msg, index) => (
          <div key={index}>
            <strong>{msg.userId}:</strong> {msg.payload.content}
          </div>
        ))}
      </div>
      <input 
        value={message} 
        onChange={(e) => setMessage(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
      />
      <button onClick={handleSend}>Send</button>
    </div>
  )
}
```

### Direct Client Usage

```typescript
import { WebSocketClient } from '@/lib/websocket/websocket-client'

const client = new WebSocketClient({
  url: 'http://localhost:3000',
  userId: 'user123',
  userRole: 'passenger'
})

// Connect
await client.connect()

// Send message
client.sendMessage({
  type: 'chat_message',
  payload: { content: 'Hello!' },
  timestamp: Date.now(),
  userId: 'user123',
  roomId: 'room123'
})

// Subscribe to events
const unsubscribe = client.subscribe('message', (data) => {
  console.log('Received message:', data)
})

// Update location
client.updateLocation({ lat: 40.7128, lng: -74.0060 })

// Disconnect
client.disconnect()
```

## Message Types

### Chat Messages
```typescript
{
  type: 'chat_message',
  payload: {
    content: string,
    messageType: 'text' | 'image' | 'location',
    timestamp: number
  },
  userId: string,
  roomId: string
}
```

### Location Updates
```typescript
{
  type: 'location_update',
  payload: {
    userId: string,
    location: {
      lat: number,
      lng: number,
      heading?: number
    },
    timestamp: number
  },
  userId: string
}
```

### Ride Status Updates
```typescript
{
  type: 'ride_status',
  payload: {
    rideId: string,
    status: 'requested' | 'accepted' | 'in_progress' | 'completed' | 'cancelled',
    updatedBy: string,
    metadata?: any
  },
  userId: string,
  roomId: string
}
```

### Driver Status Updates
```typescript
{
  type: 'driver_status',
  payload: {
    driverId: string,
    status: 'online' | 'offline' | 'busy',
    location?: { lat: number, lng: number },
    timestamp: number
  },
  userId: string
}
```

### Notifications
```typescript
{
  type: 'notification',
  payload: {
    title: string,
    message: string,
    type: 'info' | 'warning' | 'error' | 'success',
    actionUrl?: string,
    metadata?: any
  },
  userId: string
}
```

## Room Management

### Room Types
- **User Rooms**: `user_{userId}` - Personal user room
- **Role Rooms**: `role_{role}` - Role-based rooms (passenger, driver, operator, admin)
- **Ride Rooms**: `ride_{rideId}` - Specific ride communication
- **Chat Rooms**: Custom chat room IDs
- **Fleet Rooms**: `fleet_{operatorId}` - Fleet management

### Joining/Leaving Rooms
```typescript
// Join a room
client.joinRoom('ride_123', 'ride')

// Leave a room
client.leaveRoom('ride_123')

// Auto-join based on user role
// Users automatically join user_{userId} and role_{role} rooms
```

## Error Handling

### Connection Errors
- Automatic reconnection with exponential backoff
- Maximum retry attempts configuration
- Error event callbacks for custom handling

### Message Errors
- Message queuing for offline scenarios
- Delivery confirmation and retry logic
- Error logging and monitoring

### Server Errors
- Health check monitoring
- Graceful degradation
- Admin notifications for critical issues

## Performance Considerations

### Client-Side
- Connection pooling and reuse
- Message batching for high-frequency updates
- Efficient event subscription management
- Memory leak prevention with proper cleanup

### Server-Side
- Connection limit management
- Message rate limiting
- Room size optimization
- Inactive connection cleanup

## Security

### Authentication
- User authentication required for connection
- Role-based access control
- JWT token validation

### Message Validation
- Input sanitization and validation
- Rate limiting per user/connection
- Spam detection and prevention

### Privacy
- Room-based message isolation
- User permission checks
- Data encryption for sensitive information

## Monitoring & Debugging

### Health Checks
```typescript
// Get server statistics
const stats = webSocketServer.getStats()
console.log('Connections:', stats.connections)
console.log('Rooms:', stats.rooms)
console.log('Queued Messages:', stats.queuedMessages)
```

### Connection Info
```typescript
// Get client connection info
const info = client.getConnectionInfo()
console.log('Connected:', info.connected)
console.log('Status:', info.status)
console.log('Socket ID:', info.socketId)
```

### Debug Mode
Set `DEBUG=socket.io*` environment variable for detailed Socket.IO logs.

## Environment Variables

```env
# WebSocket server URL (client-side)
NEXT_PUBLIC_WEBSOCKET_URL=http://localhost:3000

# WebSocket server configuration
WEBSOCKET_PORT=3001
WEBSOCKET_CORS_ORIGIN=http://localhost:3000

# Connection limits
MAX_CONNECTIONS_PER_USER=5
MAX_ROOMS_PER_USER=10
MESSAGE_RATE_LIMIT=100
```

## Testing

### Unit Tests
```bash
npm run test:websocket
```

### Integration Tests
```bash
npm run test:websocket:integration
```

### Load Testing
```bash
npm run test:websocket:load
```

## Deployment

### Development
```bash
npm run dev
# WebSocket server starts automatically with Next.js
```

### Production
```bash
npm run build
npm start
# Ensure WebSocket server is properly initialized
```

### Docker
```dockerfile
# WebSocket server runs alongside Next.js app
EXPOSE 3000
CMD ["npm", "start"]
```

## Troubleshooting

### Common Issues

1. **Connection Fails**
   - Check server is running
   - Verify CORS configuration
   - Check firewall settings

2. **Messages Not Received**
   - Verify room membership
   - Check user authentication
   - Confirm message format

3. **High Memory Usage**
   - Check for memory leaks in event listeners
   - Verify proper cleanup on unmount
   - Monitor connection count

4. **Performance Issues**
   - Enable message batching
   - Optimize room structure
   - Check for excessive reconnections

### Debug Commands
```typescript
// Enable debug logging
localStorage.debug = 'socket.io-client:*'

// Check connection status
console.log(client.getConnectionInfo())

// Monitor server health
console.log(webSocketServer.getStats())
```

## Future Enhancements

- [ ] Message persistence and history
- [ ] File sharing capabilities
- [ ] Voice/video call integration
- [ ] Advanced analytics and monitoring
- [ ] Horizontal scaling support
- [ ] Message encryption
- [ ] Offline sync improvements
- [ ] Mobile push notification integration

## Contributing

1. Follow TypeScript best practices
2. Add comprehensive tests for new features
3. Update documentation for API changes
4. Ensure backward compatibility
5. Performance test with realistic loads

## License

This WebSocket system is part of the GoCars project and follows the same license terms.