// Performance tests for API endpoints
import { LoadTester, PerformanceTester, performanceUtils } from './loadTesting';

describe('API Performance Tests', () => {
  let loadTester: LoadTester;
  let performanceTester: PerformanceTester;

  beforeEach(() => {
    loadTester = new LoadTester();
    performanceTester = new PerformanceTester();
  });

  describe('Ride Booking API', () => {
    it('should handle concurrent ride requests efficiently', async () => {
      const result = await loadTester.runLoadTest({
        concurrent: 20,
        duration: 10000, // 10 seconds
        rampUp: 2000, // 2 seconds
        target: async () => {
          // Simulate API call
          const response = await fetch('/api/rides', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              pickupLocation: { lat: 37.7749, lng: -122.4194 },
              dropoffLocation: { lat: 37.7849, lng: -122.4094 },
            }),
          });
          
          if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
          }
          
          return response.json();
        },
        timeout: 5000,
        warmup: 5,
      });

      // Performance assertions
      expect(result.successfulRequests).toBeGreaterThan(0);
      expect(result.averageResponseTime).toBeLessThan(2000); // < 2 seconds
      expect(result.percentiles.p95).toBeLessThan(3000); // 95th percentile < 3 seconds
      expect(result.requestsPerSecond).toBeGreaterThan(5); // At least 5 RPS
      expect(result.failedRequests / result.totalRequests).toBeLessThan(0.01); // < 1% error rate
    }, 30000);

    it('should maintain performance under sustained load', async () => {
      const result = await loadTester.runLoadTest({
        concurrent: 10,
        duration: 30000, // 30 seconds
        rampUp: 5000, // 5 seconds
        target: '/api/rides/nearby',
        timeout: 3000,
      });

      expect(result.averageResponseTime).toBeLessThan(1500);
      expect(result.percentiles.p99).toBeLessThan(5000);
      expect(result.failedRequests).toBe(0);
    }, 45000);
  });

  describe('Real-time Updates Performance', () => {
    it('should handle WebSocket connections efficiently', async () => {
      const { metrics } = await performanceTester.measurePerformance(async () => {
        // Simulate WebSocket connection and message handling
        const connections = [];
        
        for (let i = 0; i < 100; i++) {
          connections.push({
            id: i,
            connected: true,
            lastMessage: Date.now(),
          });
        }

        // Simulate message broadcasting
        for (let i = 0; i < 1000; i++) {
          connections.forEach(conn => {
            conn.lastMessage = Date.now();
          });
        }

        return connections.length;
      }, 'WebSocket Performance Test');

      expect(metrics.duration).toBeLessThan(1000); // Should complete in < 1 second
      expect(metrics.memoryUsage.heapUsed).toBeLessThan(50 * 1024 * 1024); // < 50MB
    });
  });

  describe('Component Rendering Performance', () => {
    it('should render ride list efficiently', async () => {
      const mockRides = Array.from({ length: 1000 }, (_, i) => ({
        id: `ride-${i}`,
        status: 'completed',
        fare: Math.random() * 50 + 10,
        distance: Math.random() * 20 + 1,
        createdAt: new Date().toISOString(),
      }));

      const metrics = await performanceUtils.testComponentRender(() => {
        // Simulate component rendering
        return mockRides.map(ride => ({
          ...ride,
          formattedFare: `$${ride.fare.toFixed(2)}`,
          formattedDistance: `${ride.distance.toFixed(1)} miles`,
        }));
      }, 50);

      expect(metrics.duration).toBeLessThan(100); // Average render < 100ms
      expect(metrics.customMetrics?.maxDuration).toBeLessThan(500); // Max render < 500ms
    });

    it('should handle large datasets without memory leaks', async () => {
      const leakTest = await performanceUtils.testMemoryLeak(async () => {
        // Simulate data processing that might cause leaks
        const largeArray = new Array(10000).fill(0).map((_, i) => ({
          id: i,
          data: new Array(100).fill(`item-${i}`),
        }));

        // Process the data
        const processed = largeArray.map(item => ({
          id: item.id,
          summary: item.data.join(','),
        }));

        // Clear references
        largeArray.length = 0;
        processed.length = 0;
      }, 100);

      expect(leakTest.potentialLeak).toBe(false);
      expect(leakTest.memoryGrowth).toBeLessThan(10); // < 10MB growth
    });
  });

  describe('Database Query Performance', () => {
    it('should execute ride queries efficiently', async () => {
      const { metrics } = await performanceTester.measurePerformance(async () => {
        // Simulate database queries
        const queries = [
          'SELECT * FROM rides WHERE user_id = ?',
          'SELECT * FROM rides WHERE status = ? ORDER BY created_at DESC',
          'SELECT COUNT(*) FROM rides WHERE created_at > ?',
          'SELECT AVG(fare) FROM rides WHERE status = "completed"',
        ];

        // Simulate query execution
        const results = await Promise.all(
          queries.map(async (query) => {
            // Mock query execution time
            await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
            return { query, rows: Math.floor(Math.random() * 1000) };
          })
        );

        return results;
      }, 'Database Query Performance');

      expect(metrics.duration).toBeLessThan(500); // All queries < 500ms
    });
  });

  describe('File Upload Performance', () => {
    it('should handle multiple file uploads efficiently', async () => {
      const result = await loadTester.runLoadTest({
        concurrent: 5,
        duration: 15000, // 15 seconds
        rampUp: 3000, // 3 seconds
        target: async () => {
          // Simulate file upload
          const mockFile = new Blob(['x'.repeat(1024 * 100)], { type: 'image/jpeg' }); // 100KB file
          
          const formData = new FormData();
          formData.append('file', mockFile, 'test-image.jpg');
          
          const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });
          
          if (!response.ok) {
            throw new Error(`Upload failed: ${response.status}`);
          }
          
          return response.json();
        },
        timeout: 10000, // 10 second timeout for uploads
      });

      expect(result.averageResponseTime).toBeLessThan(5000); // < 5 seconds average
      expect(result.percentiles.p95).toBeLessThan(8000); // 95th percentile < 8 seconds
      expect(result.failedRequests).toBe(0);
    }, 30000);
  });

  describe('Search Performance', () => {
    it('should perform location searches quickly', async () => {
      const searchTerms = [
        'San Francisco Airport',
        'Union Square',
        'Golden Gate Bridge',
        'Fisherman\'s Wharf',
        'Lombard Street',
      ];

      for (const term of searchTerms) {
        const { metrics } = await performanceTester.measurePerformance(async () => {
          // Simulate search API call
          const response = await fetch(`/api/search/locations?q=${encodeURIComponent(term)}`);
          
          if (!response.ok) {
            throw new Error(`Search failed: ${response.status}`);
          }
          
          return response.json();
        }, `Search: ${term}`);

        expect(metrics.duration).toBeLessThan(1000); // Each search < 1 second
      }
    });

    it('should handle concurrent searches without degradation', async () => {
      const result = await loadTester.runLoadTest({
        concurrent: 15,
        duration: 20000, // 20 seconds
        rampUp: 4000, // 4 seconds
        target: async () => {
          const randomTerm = `location-${Math.floor(Math.random() * 1000)}`;
          const response = await fetch(`/api/search/locations?q=${randomTerm}`);
          
          if (!response.ok) {
            throw new Error(`Search failed: ${response.status}`);
          }
          
          return response.json();
        },
        timeout: 3000,
      });

      expect(result.averageResponseTime).toBeLessThan(800); // < 800ms average
      expect(result.requestsPerSecond).toBeGreaterThan(10); // At least 10 RPS
      expect(result.failedRequests).toBe(0);
    }, 35000);
  });
});

// Utility function to run performance benchmarks
export async function runPerformanceBenchmarks(): Promise<void> {
  console.log('🚀 Running performance benchmarks...');
  
  const performanceTester = new PerformanceTester();
  const loadTester = new LoadTester();

  // Benchmark 1: Component rendering
  console.log('\\n📊 Benchmarking component rendering...');
  const renderMetrics = await performanceUtils.testComponentRender(() => {
    return Array.from({ length: 1000 }, (_, i) => ({ id: i, name: `Item ${i}` }));
  }, 100);
  
  console.log(`Average render time: ${renderMetrics.duration.toFixed(2)}ms`);

  // Benchmark 2: API endpoint
  console.log('\\n🌐 Benchmarking API endpoint...');
  try {
    const apiMetrics = await performanceUtils.testApiEndpoint('/api/health', {
      concurrent: 10,
      duration: 10000,
    });
    
    console.log(`API average response time: ${apiMetrics.averageResponseTime.toFixed(2)}ms`);
    console.log(`API requests per second: ${apiMetrics.requestsPerSecond.toFixed(2)}`);
  } catch (error) {
    console.log('API endpoint not available for benchmarking');
  }

  // Benchmark 3: Memory usage
  console.log('\\n💾 Benchmarking memory usage...');
  const memoryTest = await performanceUtils.testMemoryLeak(() => {
    const data = new Array(1000).fill(0).map(i => ({ value: Math.random() }));
    return data.reduce((sum, item) => sum + item.value, 0);
  }, 500);
  
  console.log(`Memory growth: ${memoryTest.memoryGrowth.toFixed(2)}MB`);
  console.log(`Potential leak: ${memoryTest.potentialLeak ? 'Yes' : 'No'}`);

  console.log('\\n✅ Performance benchmarks completed');
}