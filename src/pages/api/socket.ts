/**
 * Next.js API Route for WebSocket Server
 * Initializes WebSocket server for real-time communication
 */

import { NextApiRequest, NextApiResponse } from 'next'
import { Server as SocketIOServer } from 'socket.io'
import { Server as HTTPServer } from 'http'
import { webSocketServer } from '@/lib/websocket/websocket-server'

// Extend NextApiResponse to include socket server
interface NextApiResponseWithSocket extends NextApiResponse {
  socket: {
    server: HTTPServer & {
      io?: SocketIOServer
    }
  }
}

export default function handler(req: NextApiRequest, res: NextApiResponseWithSocket) {
  // Check if WebSocket server is already initialized
  if (!res.socket.server.io) {
    console.log('Initializing WebSocket server...')
    
    try {
      // Initialize WebSocket server
      webSocketServer.initialize(res.socket.server)
      res.socket.server.io = webSocketServer as any
      
      console.log('WebSocket server initialized successfully')
    } catch (error) {
      console.error('Failed to initialize WebSocket server:', error)
      return res.status(500).json({ error: 'Failed to initialize WebSocket server' })
    }
  } else {
    console.log('WebSocket server already initialized')
  }

  // Return server statistics
  const stats = webSocketServer.getStats()
  res.json({
    message: 'WebSocket server is running',
    stats,
    timestamp: new Date().toISOString()
  })
}

// Disable body parsing for WebSocket
export const config = {
  api: {
    bodyParser: false,
  },
}