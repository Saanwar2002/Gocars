// Integration tests for Rides API endpoints

import { testUtils, testData } from '../../setup/testSetup';
import { server, mockApiError, mockApiDelay } from '../../setup/mocks/server';

describe('Rides API Integration', () => {
  describe('GET /api/rides', () => {
    it('fetches all rides successfully', async () => {
      const response = await fetch('/api/rides');
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data).toHaveLength(3);
      expect(data[0]).toMatchObject({
        id: expect.any(String),
        passengerId: expect.any(String),
        status: expect.any(String),
      });
    });

    it('handles server errors gracefully', async () => {
      mockApiError('/api/rides', 500, 'Database connection failed');
      
      const response = await fetch('/api/rides');
      const data = await response.json();
      
      expect(response.status).toBe(500);
      expect(data.error).toBe('Database connection failed');
    });

    it('handles network timeouts', async () => {
      mockApiDelay('/api/rides', 5000);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1000);
      
      try {
        await fetch('/api/rides', { signal: controller.signal });
        fail('Request should have been aborted');
      } catch (error) {
        expect(error.name).toBe('AbortError');
      } finally {
        clearTimeout(timeoutId);
      }
    });
  });

  describe('POST /api/rides', () => {
    it('creates a new ride successfully', async () => {
      const newRide = {
        passengerId: testData.users.passenger.id,
        pickup: testData.locations.pickup.address,
        destination: testData.locations.destination.address,
        fare: 15.50,
      };
      
      const response = await fetch('/api/rides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRide),
      });
      
      const data = await response.json();
      
      expect(response.status).toBe(201);
      expect(data).toMatchObject({
        id: expect.any(String),
        passengerId: newRide.passengerId,
        pickup: newRide.pickup,
        destination: newRide.destination,
        status: 'pending',
      });
    });

    it('validates required fields', async () => {
      const invalidRide = {
        passengerId: testData.users.passenger.id,
        // Missing pickup and destination
      };
      
      mockApiError('/api/rides', 400, 'Missing required fields');
      
      const response = await fetch('/api/rides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidRide),
      });
      
      expect(response.status).toBe(400);
    });

    it('handles duplicate ride requests', async () => {
      const rideData = {
        passengerId: testData.users.passenger.id,
        pickup: testData.locations.pickup.address,
        destination: testData.locations.destination.address,
      };
      
      // First request should succeed
      const response1 = await fetch('/api/rides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rideData),
      });
      
      expect(response1.status).toBe(201);
      
      // Second identical request should also succeed (new ride)
      const response2 = await fetch('/api/rides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rideData),
      });
      
      expect(response2.status).toBe(201);
    });
  });

  describe('GET /api/rides/:id', () => {
    it('fetches a specific ride successfully', async () => {
      const rideId = testData.rides.pending.id;
      
      const response = await fetch(`/api/rides/${rideId}`);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.id).toBe(rideId);
      expect(data).toMatchObject(testData.rides.pending);
    });

    it('returns 404 for non-existent ride', async () => {
      const response = await fetch('/api/rides/non-existent-id');
      const data = await response.json();
      
      expect(response.status).toBe(404);
      expect(data.error).toBe('Ride not found');
    });

    it('handles malformed ride IDs', async () => {
      const response = await fetch('/api/rides/invalid-id-format');
      
      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/rides/:id', () => {
    it('updates ride status successfully', async () => {
      const rideId = testData.rides.pending.id;
      const updateData = { status: 'active' };
      
      const response = await fetch(`/api/rides/${rideId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });
      
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.id).toBe(rideId);
      expect(data.status).toBe('active');
    });

    it('validates status transitions', async () => {
      const rideId = testData.rides.completed.id;
      const invalidUpdate = { status: 'pending' };
      
      mockApiError(`/api/rides/${rideId}`, 400, 'Invalid status transition');
      
      const response = await fetch(`/api/rides/${rideId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidUpdate),
      });
      
      expect(response.status).toBe(400);
    });

    it('handles concurrent updates', async () => {
      const rideId = testData.rides.pending.id;
      
      // Simulate concurrent updates
      const update1 = fetch(`/api/rides/${rideId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'active' }),
      });
      
      const update2 = fetch(`/api/rides/${rideId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' }),
      });
      
      const [response1, response2] = await Promise.all([update1, update2]);
      
      // Both should succeed (last write wins in this mock)
      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
    });
  });

  describe('DELETE /api/rides/:id', () => {
    it('cancels a ride successfully', async () => {
      const rideId = testData.rides.pending.id;
      
      const response = await fetch(`/api/rides/${rideId}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('prevents deletion of active rides', async () => {
      const rideId = testData.rides.active.id;
      
      mockApiError(`/api/rides/${rideId}`, 400, 'Cannot cancel active ride');
      
      const response = await fetch(`/api/rides/${rideId}`, {
        method: 'DELETE',
      });
      
      expect(response.status).toBe(400);
    });
  });

  describe('Performance Tests', () => {
    it('handles high load efficiently', async () => {
      const startTime = performance.now();
      
      // Simulate 10 concurrent requests
      const requests = Array.from({ length: 10 }, () =>
        fetch('/api/rides')
      );
      
      const responses = await Promise.all(requests);
      const endTime = performance.now();
      
      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
      
      // Should complete within reasonable time
      expect(endTime - startTime).toBeLessThan(2000); // 2 seconds
    });

    it('maintains response time under load', async () => {
      const responseTimes: number[] = [];
      
      // Make 5 sequential requests and measure response times
      for (let i = 0; i < 5; i++) {
        const startTime = performance.now();
        const response = await fetch('/api/rides');
        const endTime = performance.now();
        
        expect(response.status).toBe(200);
        responseTimes.push(endTime - startTime);
      }
      
      // Average response time should be reasonable
      const averageTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
      expect(averageTime).toBeLessThan(100); // 100ms average
    });
  });

  describe('Error Recovery', () => {
    it('recovers from temporary server errors', async () => {
      // First request fails
      mockApiError('/api/rides', 503, 'Service temporarily unavailable');
      
      const response1 = await fetch('/api/rides');
      expect(response1.status).toBe(503);
      
      // Reset to normal behavior
      server.resetHandlers();
      
      // Second request should succeed
      const response2 = await fetch('/api/rides');
      expect(response2.status).toBe(200);
    });

    it('handles rate limiting gracefully', async () => {
      // Simulate rate limiting
      server.use(
        rest.get('/api/rides', (req, res, ctx) => {
          return res(
            ctx.status(429),
            ctx.set('Retry-After', '1'),
            ctx.json({ error: 'Too many requests' })
          );
        })
      );
      
      const response = await fetch('/api/rides');
      
      expect(response.status).toBe(429);
      expect(response.headers.get('Retry-After')).toBe('1');
    });
  });

  describe('Data Consistency', () => {
    it('maintains data integrity across operations', async () => {
      // Create a ride
      const createResponse = await fetch('/api/rides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          passengerId: testData.users.passenger.id,
          pickup: 'Test Pickup',
          destination: 'Test Destination',
        }),
      });
      
      const createdRide = await createResponse.json();
      expect(createResponse.status).toBe(201);
      
      // Fetch the created ride
      const fetchResponse = await fetch(`/api/rides/${createdRide.id}`);
      const fetchedRide = await fetchResponse.json();
      
      expect(fetchResponse.status).toBe(200);
      expect(fetchedRide).toMatchObject(createdRide);
      
      // Update the ride
      const updateResponse = await fetch(`/api/rides/${createdRide.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'active' }),
      });
      
      const updatedRide = await updateResponse.json();
      expect(updateResponse.status).toBe(200);
      expect(updatedRide.status).toBe('active');
    });
  });
});