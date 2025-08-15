// Mock Service Worker setup for API mocking

import { setupServer } from 'msw/node';
import { rest } from 'msw';
import { testData } from '../testSetup';

// Mock API handlers
export const handlers = [
  // Auth endpoints
  rest.post('/api/auth/login', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        user: testData.users.passenger,
        token: 'mock-jwt-token',
      })
    );
  }),

  rest.post('/api/auth/logout', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ success: true }));
  }),

  rest.get('/api/auth/me', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(testData.users.passenger));
  }),

  // User endpoints
  rest.get('/api/users/:id', (req, res, ctx) => {
    const { id } = req.params;
    const user = Object.values(testData.users).find(u => u.id === id);
    
    if (!user) {
      return res(ctx.status(404), ctx.json({ error: 'User not found' }));
    }
    
    return res(ctx.status(200), ctx.json(user));
  }),

  rest.put('/api/users/:id', (req, res, ctx) => {
    const { id } = req.params;
    return res(
      ctx.status(200),
      ctx.json({ ...testData.users.passenger, id })
    );
  }),

  // Ride endpoints
  rest.get('/api/rides', (req, res, ctx) => {
    const rides = Object.values(testData.rides);
    return res(ctx.status(200), ctx.json(rides));
  }),

  rest.post('/api/rides', (req, res, ctx) => {
    return res(
      ctx.status(201),
      ctx.json({
        ...testData.rides.pending,
        id: Date.now().toString(),
      })
    );
  }),

  rest.get('/api/rides/:id', (req, res, ctx) => {
    const { id } = req.params;
    const ride = Object.values(testData.rides).find(r => r.id === id);
    
    if (!ride) {
      return res(ctx.status(404), ctx.json({ error: 'Ride not found' }));
    }
    
    return res(ctx.status(200), ctx.json(ride));
  }),

  rest.put('/api/rides/:id', (req, res, ctx) => {
    const { id } = req.params;
    return res(
      ctx.status(200),
      ctx.json({ ...testData.rides.pending, id })
    );
  }),

  rest.delete('/api/rides/:id', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ success: true }));
  }),

  // Driver endpoints
  rest.get('/api/drivers/nearby', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json([
        {
          id: '2',
          name: 'Test Driver',
          location: testData.locations.pickup.coordinates,
          rating: 4.8,
          eta: 5,
        },
      ])
    );
  }),

  // Payment endpoints
  rest.post('/api/payments', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        id: 'payment_123',
        status: 'succeeded',
        amount: 1550, // $15.50 in cents
      })
    );
  }),

  // Location endpoints
  rest.get('/api/locations/search', (req, res, ctx) => {
    const query = req.url.searchParams.get('q');
    
    return res(
      ctx.status(200),
      ctx.json([
        {
          address: `${query} - Test Location 1`,
          coordinates: { lat: 40.7128, lng: -74.0060 },
        },
        {
          address: `${query} - Test Location 2`,
          coordinates: { lat: 40.7589, lng: -73.9851 },
        },
      ])
    );
  }),

  // Notification endpoints
  rest.post('/api/notifications', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        id: 'notification_123',
        sent: true,
      })
    );
  }),

  // Analytics endpoints
  rest.get('/api/analytics/dashboard', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        totalRides: 156,
        totalEarnings: 2340.50,
        averageRating: 4.8,
        completionRate: 0.95,
      })
    );
  }),

  // Error simulation endpoints
  rest.get('/api/error/500', (req, res, ctx) => {
    return res(
      ctx.status(500),
      ctx.json({ error: 'Internal server error' })
    );
  }),

  rest.get('/api/error/timeout', (req, res, ctx) => {
    return res(
      ctx.delay(10000), // 10 second delay to simulate timeout
      ctx.status(200),
      ctx.json({ data: 'This should timeout' })
    );
  }),

  // Rate limiting simulation
  rest.get('/api/rate-limit', (req, res, ctx) => {
    return res(
      ctx.status(429),
      ctx.json({ error: 'Too many requests' })
    );
  }),
];

// Create server instance
export const server = setupServer(...handlers);

// Helper functions for dynamic mocking
export const mockApiSuccess = (endpoint: string, data: any) => {
  server.use(
    rest.get(endpoint, (req, res, ctx) => {
      return res(ctx.status(200), ctx.json(data));
    })
  );
};

export const mockApiError = (endpoint: string, status = 500, error = 'Server error') => {
  server.use(
    rest.get(endpoint, (req, res, ctx) => {
      return res(ctx.status(status), ctx.json({ error }));
    })
  );
};

export const mockApiDelay = (endpoint: string, delay = 1000) => {
  server.use(
    rest.get(endpoint, (req, res, ctx) => {
      return res(
        ctx.delay(delay),
        ctx.status(200),
        ctx.json({ delayed: true })
      );
    })
  );
};

// Reset to default handlers
export const resetMocks = () => {
  server.resetHandlers(...handlers);
};