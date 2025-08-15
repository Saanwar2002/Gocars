// Global Jest setup - runs once before all tests
import { performance } from 'perf_hooks';

export default async function globalSetup(): Promise<void> {
  console.log('🚀 Starting global test setup...');
  const startTime = performance.now();
  
  try {
    // Set up test environment variables
    process.env.NODE_ENV = 'test';
    process.env.REACT_APP_API_URL = 'http://localhost:3001/api';
    process.env.REACT_APP_WEBSOCKET_URL = 'ws://localhost:3001';
    
    // Initialize test database if needed
    await setupTestDatabase();
    
    // Start mock services
    await startMockServices();
    
    // Set up global test utilities
    setupGlobalTestUtilities();
    
    const endTime = performance.now();
    console.log(`✅ Global setup completed in ${(endTime - startTime).toFixed(2)}ms`);
    
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  }
}

async function setupTestDatabase(): Promise<void> {
  console.log('📊 Setting up test database...');
  
  // In a real implementation, this would:
  // - Create test database
  // - Run migrations
  // - Seed test data
  
  // Mock implementation
  await new Promise(resolve => setTimeout(resolve, 100));
  console.log('✅ Test database ready');
}

async function startMockServices(): Promise<void> {
  console.log('🔧 Starting mock services...');
  
  // In a real implementation, this would:
  // - Start mock API server
  // - Start mock WebSocket server
  // - Start mock external services
  
  // Mock implementation
  await new Promise(resolve => setTimeout(resolve, 50));
  console.log('✅ Mock services started');
}

function setupGlobalTestUtilities(): void {
  console.log('🛠️ Setting up global test utilities...');
  
  // Add global test utilities
  (global as any).testUtils = {
    // Mock localStorage
    mockLocalStorage: () => {
      const store: Record<string, string> = {};
      return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => { store[key] = value; },
        removeItem: (key: string) => { delete store[key]; },
        clear: () => { Object.keys(store).forEach(key => delete store[key]); },
        length: Object.keys(store).length,
        key: (index: number) => Object.keys(store)[index] || null,
      };
    },
    
    // Mock sessionStorage
    mockSessionStorage: () => {
      const store: Record<string, string> = {};
      return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => { store[key] = value; },
        removeItem: (key: string) => { delete store[key]; },
        clear: () => { Object.keys(store).forEach(key => delete store[key]); },
        length: Object.keys(store).length,
        key: (index: number) => Object.keys(store)[index] || null,
      };
    },
    
    // Mock geolocation
    mockGeolocation: () => ({
      getCurrentPosition: jest.fn((success) => {
        success({
          coords: {
            latitude: 37.7749,
            longitude: -122.4194,
            accuracy: 10,
            altitude: null,
            altitudeAccuracy: null,
            heading: null,
            speed: null,
          },
          timestamp: Date.now(),
        });
      }),
      watchPosition: jest.fn(),
      clearWatch: jest.fn(),
    }),
    
    // Mock IntersectionObserver
    mockIntersectionObserver: () => {
      return class MockIntersectionObserver {
        constructor(callback: IntersectionObserverCallback) {}
        observe() {}
        unobserve() {}
        disconnect() {}
      };
    },
    
    // Mock ResizeObserver
    mockResizeObserver: () => {
      return class MockResizeObserver {
        constructor(callback: ResizeObserverCallback) {}
        observe() {}
        unobserve() {}
        disconnect() {}
      };
    },
    
    // Test data generators
    generateUser: (overrides = {}) => ({
      id: 'user-123',
      name: 'Test User',
      email: 'test@example.com',
      phone: '+1234567890',
      isVerified: true,
      createdAt: new Date().toISOString(),
      ...overrides,
    }),
    
    generateRide: (overrides = {}) => ({
      id: 'ride-123',
      userId: 'user-123',
      driverId: 'driver-123',
      status: 'completed',
      pickupLocation: {
        address: '123 Test St, Test City',
        coordinates: { lat: 37.7749, lng: -122.4194 },
      },
      dropoffLocation: {
        address: '456 Test Ave, Test City',
        coordinates: { lat: 37.7849, lng: -122.4094 },
      },
      fare: 25.50,
      distance: 5.2,
      duration: 15,
      createdAt: new Date().toISOString(),
      ...overrides,
    }),
    
    generateDriver: (overrides = {}) => ({
      id: 'driver-123',
      name: 'Test Driver',
      email: 'driver@example.com',
      phone: '+1234567891',
      vehicle: {
        make: 'Toyota',
        model: 'Camry',
        year: 2020,
        licensePlate: 'TEST123',
        color: 'Silver',
      },
      rating: 4.8,
      isOnline: true,
      location: { lat: 37.7749, lng: -122.4194 },
      ...overrides,
    }),
  };
  
  console.log('✅ Global test utilities ready');
}