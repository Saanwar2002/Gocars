// Comprehensive test setup and configuration

import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';
import { server } from './mocks/server';

// Configure testing library
configure({
  testIdAttribute: 'data-testid',
  asyncUtilTimeout: 5000,
});

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3000/api';

// Global test setup
beforeAll(() => {
  // Start MSW server
  server.listen({
    onUnhandledRequest: 'warn',
  });

  // Mock window.matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });

  // Mock IntersectionObserver
  global.IntersectionObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  }));

  // Mock ResizeObserver
  global.ResizeObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  }));

  // Mock geolocation
  const mockGeolocation = {
    getCurrentPosition: jest.fn(),
    watchPosition: jest.fn(),
    clearWatch: jest.fn(),
  };
  Object.defineProperty(global.navigator, 'geolocation', {
    value: mockGeolocation,
  });

  // Mock localStorage
  const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  };
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
  });

  // Mock sessionStorage
  Object.defineProperty(window, 'sessionStorage', {
    value: localStorageMock,
  });

  // Mock fetch
  global.fetch = jest.fn();

  // Mock performance API
  Object.defineProperty(global, 'performance', {
    value: {
      now: jest.fn(() => Date.now()),
      mark: jest.fn(),
      measure: jest.fn(),
      getEntriesByType: jest.fn(() => []),
      getEntriesByName: jest.fn(() => []),
    },
  });

  // Mock crypto API
  Object.defineProperty(global, 'crypto', {
    value: {
      getRandomValues: jest.fn((arr) => {
        for (let i = 0; i < arr.length; i++) {
          arr[i] = Math.floor(Math.random() * 256);
        }
        return arr;
      }),
      subtle: {
        generateKey: jest.fn(),
        encrypt: jest.fn(),
        decrypt: jest.fn(),
      },
    },
  });
});

// Reset handlers after each test
afterEach(() => {
  server.resetHandlers();
  jest.clearAllMocks();
});

// Clean up after all tests
afterAll(() => {
  server.close();
});

// Custom matchers
expect.extend({
  toBeAccessible(received) {
    // Custom accessibility matcher
    const pass = received.getAttribute('aria-label') !== null ||
                 received.getAttribute('aria-labelledby') !== null ||
                 received.tagName.toLowerCase() === 'button' ||
                 received.tagName.toLowerCase() === 'a';
    
    return {
      message: () => `expected element to be accessible`,
      pass,
    };
  },

  toHavePerformantRender(received, maxTime = 100) {
    const renderTime = received.renderTime || 0;
    const pass = renderTime <= maxTime;
    
    return {
      message: () => `expected render time ${renderTime}ms to be <= ${maxTime}ms`,
      pass,
    };
  },
});

// Test utilities
export const testUtils = {
  // Wait for async operations
  waitFor: (callback: () => void, timeout = 5000) => {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const check = () => {
        try {
          callback();
          resolve(true);
        } catch (error) {
          if (Date.now() - startTime > timeout) {
            reject(error);
          } else {
            setTimeout(check, 100);
          }
        }
      };
      check();
    });
  },

  // Mock API responses
  mockApiResponse: (url: string, response: any, status = 200) => {
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        ok: status >= 200 && status < 300,
        status,
        json: () => Promise.resolve(response),
        text: () => Promise.resolve(JSON.stringify(response)),
      })
    );
  },

  // Create test user
  createTestUser: (overrides = {}) => ({
    id: '1',
    name: 'Test User',
    email: 'test@example.com',
    role: 'passenger',
    ...overrides,
  }),

  // Create test ride
  createTestRide: (overrides = {}) => ({
    id: '1',
    passengerId: '1',
    driverId: '2',
    pickup: 'Test Pickup Location',
    destination: 'Test Destination',
    status: 'pending',
    fare: 15.50,
    createdAt: new Date().toISOString(),
    ...overrides,
  }),

  // Performance testing helper
  measurePerformance: async (fn: () => Promise<void> | void) => {
    const start = performance.now();
    await fn();
    const end = performance.now();
    return end - start;
  },

  // Accessibility testing helper
  checkAccessibility: (element: HTMLElement) => {
    const issues: string[] = [];
    
    // Check for alt text on images
    const images = element.querySelectorAll('img');
    images.forEach((img, index) => {
      if (!img.alt) {
        issues.push(`Image ${index + 1} missing alt text`);
      }
    });

    // Check for form labels
    const inputs = element.querySelectorAll('input, textarea, select');
    inputs.forEach((input, index) => {
      const hasLabel = input.getAttribute('aria-label') ||
                      input.getAttribute('aria-labelledby') ||
                      element.querySelector(`label[for="${input.id}"]`);
      
      if (!hasLabel) {
        issues.push(`Form input ${index + 1} missing label`);
      }
    });

    // Check for button text
    const buttons = element.querySelectorAll('button');
    buttons.forEach((button, index) => {
      if (!button.textContent?.trim() && !button.getAttribute('aria-label')) {
        issues.push(`Button ${index + 1} missing accessible text`);
      }
    });

    return issues;
  },
};

// Global test data
export const testData = {
  users: {
    passenger: testUtils.createTestUser({ role: 'passenger' }),
    driver: testUtils.createTestUser({ 
      id: '2', 
      name: 'Test Driver', 
      email: 'driver@example.com', 
      role: 'driver' 
    }),
    admin: testUtils.createTestUser({ 
      id: '3', 
      name: 'Test Admin', 
      email: 'admin@example.com', 
      role: 'admin' 
    }),
  },
  
  rides: {
    pending: testUtils.createTestRide({ status: 'pending' }),
    active: testUtils.createTestRide({ id: '2', status: 'active' }),
    completed: testUtils.createTestRide({ id: '3', status: 'completed' }),
  },

  locations: {
    pickup: {
      address: '123 Main St, City, State',
      coordinates: { lat: 40.7128, lng: -74.0060 },
    },
    destination: {
      address: '456 Oak Ave, City, State',
      coordinates: { lat: 40.7589, lng: -73.9851 },
    },
  },
};

// Test environment configuration
export const testConfig = {
  timeout: {
    unit: 5000,
    integration: 10000,
    e2e: 30000,
  },
  
  performance: {
    maxRenderTime: 100,
    maxApiResponseTime: 1000,
    maxPageLoadTime: 3000,
  },
  
  accessibility: {
    level: 'AA',
    standards: 'WCAG 2.1',
  },
};

// Export types for TypeScript
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeAccessible(): R;
      toHavePerformantRender(maxTime?: number): R;
    }
  }
}