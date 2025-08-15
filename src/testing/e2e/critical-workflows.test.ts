// End-to-end tests for critical user workflows

import { test, expect, Page, BrowserContext } from '@playwright/test';

// Test configuration
const TEST_CONFIG = {
  baseURL: process.env.TEST_BASE_URL || 'http://localhost:3000',
  timeout: 30000,
  retries: 2,
};

// Page object models
class BookingPage {
  constructor(private page: Page) {}

  async navigateToBooking() {
    await this.page.goto('/booking');
    await this.page.waitForLoadState('networkidle');
  }

  async enterPickupLocation(location: string) {
    await this.page.fill('[data-testid="pickup-input"]', location);
    await this.page.waitForSelector('[data-testid="pickup-suggestions"]');
    await this.page.click('[data-testid="pickup-suggestion-0"]');
  }

  async enterDestination(destination: string) {
    await this.page.fill('[data-testid="destination-input"]', destination);
    await this.page.waitForSelector('[data-testid="destination-suggestions"]');
    await this.page.click('[data-testid="destination-suggestion-0"]');
  }

  async selectVehicleType(type: 'economy' | 'standard' | 'premium' | 'luxury') {
    await this.page.click(`[data-testid="vehicle-${type}"]`);
  }

  async confirmBooking() {
    await this.page.click('[data-testid="confirm-booking"]');
    await this.page.waitForSelector('[data-testid="booking-confirmation"]');
  }

  async getBookingDetails() {
    return {
      rideId: await this.page.textContent('[data-testid="ride-id"]'),
      fare: await this.page.textContent('[data-testid="fare-amount"]'),
      eta: await this.page.textContent('[data-testid="eta"]'),
    };
  }
}

class LoginPage {
  constructor(private page: Page) {}

  async navigateToLogin() {
    await this.page.goto('/login');
    await this.page.waitForLoadState('networkidle');
  }

  async login(email: string, password: string) {
    await this.page.fill('[data-testid="email-input"]', email);
    await this.page.fill('[data-testid="password-input"]', password);
    await this.page.click('[data-testid="login-button"]');
    await this.page.waitForURL('/dashboard');
  }

  async loginAsPassenger() {
    await this.login('passenger@test.com', 'password123');
  }

  async loginAsDriver() {
    await this.login('driver@test.com', 'password123');
  }
}

class DashboardPage {
  constructor(private page: Page) {}

  async waitForDashboard() {
    await this.page.waitForSelector('[data-testid="dashboard"]');
  }

  async getQuickStats() {
    return {
      totalRides: await this.page.textContent('[data-testid="total-rides"]'),
      totalEarnings: await this.page.textContent('[data-testid="total-earnings"]'),
      rating: await this.page.textContent('[data-testid="rating"]'),
    };
  }

  async navigateToBooking() {
    await this.page.click('[data-testid="book-ride-button"]');
    await this.page.waitForURL('/booking');
  }
}

// Test suites
test.describe('Critical User Workflows', () => {
  let context: BrowserContext;
  let page: Page;
  let loginPage: LoginPage;
  let dashboardPage: DashboardPage;
  let bookingPage: BookingPage;

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      permissions: ['geolocation'],
      geolocation: { latitude: 40.7128, longitude: -74.0060 },
    });
  });

  test.beforeEach(async () => {
    page = await context.newPage();
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
    bookingPage = new BookingPage(page);

    // Set up API mocking
    await page.route('/api/**', (route) => {
      const url = route.request().url();
      
      if (url.includes('/api/auth/login')) {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            user: { id: '1', name: 'Test User', email: 'test@example.com' },
            token: 'mock-token',
          }),
        });
      } else if (url.includes('/api/rides') && route.request().method() === 'POST') {
        route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'ride_123',
            status: 'pending',
            fare: 15.50,
            eta: 5,
          }),
        });
      } else {
        route.continue();
      }
    });
  });

  test.afterEach(async () => {
    await page.close();
  });

  test.afterAll(async () => {
    await context.close();
  });

  test.describe('Passenger Booking Flow', () => {
    test('complete booking workflow', async () => {
      // Login as passenger
      await loginPage.navigateToLogin();
      await loginPage.loginAsPassenger();
      
      // Verify dashboard loads
      await dashboardPage.waitForDashboard();
      const stats = await dashboardPage.getQuickStats();
      expect(stats.totalRides).toBeTruthy();
      
      // Navigate to booking
      await dashboardPage.navigateToBooking();
      
      // Fill booking form
      await bookingPage.enterPickupLocation('123 Main St');
      await bookingPage.enterDestination('456 Oak Ave');
      await bookingPage.selectVehicleType('standard');
      
      // Confirm booking
      await bookingPage.confirmBooking();
      
      // Verify booking confirmation
      const bookingDetails = await bookingPage.getBookingDetails();
      expect(bookingDetails.rideId).toBeTruthy();
      expect(bookingDetails.fare).toContain('$');
      expect(bookingDetails.eta).toContain('min');
    });

    test('booking with multiple stops', async () => {
      await loginPage.navigateToLogin();
      await loginPage.loginAsPassenger();
      await dashboardPage.navigateToBooking();
      
      // Add multiple stops
      await bookingPage.enterPickupLocation('Start Location');
      
      await page.click('[data-testid="add-stop-button"]');
      await page.fill('[data-testid="stop-1-input"]', 'Stop 1');
      
      await page.click('[data-testid="add-stop-button"]');
      await page.fill('[data-testid="stop-2-input"]', 'Stop 2');
      
      await bookingPage.enterDestination('Final Destination');
      await bookingPage.selectVehicleType('premium');
      
      // Verify fare calculation includes multiple stops
      const fareText = await page.textContent('[data-testid="estimated-fare"]');
      expect(fareText).toContain('$');
      
      await bookingPage.confirmBooking();
      
      const bookingDetails = await bookingPage.getBookingDetails();
      expect(bookingDetails.rideId).toBeTruthy();
    });

    test('booking cancellation flow', async () => {
      await loginPage.navigateToLogin();
      await loginPage.loginAsPassenger();
      await dashboardPage.navigateToBooking();
      
      // Create booking
      await bookingPage.enterPickupLocation('Test Pickup');
      await bookingPage.enterDestination('Test Destination');
      await bookingPage.selectVehicleType('standard');
      await bookingPage.confirmBooking();
      
      // Cancel booking
      await page.click('[data-testid="cancel-booking"]');
      await page.click('[data-testid="confirm-cancellation"]');
      
      // Verify cancellation
      await expect(page.locator('[data-testid="cancellation-confirmation"]')).toBeVisible();
    });
  });

  test.describe('Driver Workflow', () => {
    test('driver ride acceptance flow', async () => {
      await loginPage.navigateToLogin();
      await loginPage.loginAsDriver();
      
      // Wait for ride requests
      await page.waitForSelector('[data-testid="ride-request"]');
      
      // Accept ride
      await page.click('[data-testid="accept-ride"]');
      
      // Verify ride details
      await expect(page.locator('[data-testid="active-ride"]')).toBeVisible();
      
      const rideDetails = {
        pickup: await page.textContent('[data-testid="pickup-address"]'),
        destination: await page.textContent('[data-testid="destination-address"]'),
        passengerName: await page.textContent('[data-testid="passenger-name"]'),
      };
      
      expect(rideDetails.pickup).toBeTruthy();
      expect(rideDetails.destination).toBeTruthy();
      expect(rideDetails.passengerName).toBeTruthy();
    });

    test('driver navigation and completion', async () => {
      await loginPage.navigateToLogin();
      await loginPage.loginAsDriver();
      
      // Accept a ride
      await page.waitForSelector('[data-testid="ride-request"]');
      await page.click('[data-testid="accept-ride"]');
      
      // Start navigation
      await page.click('[data-testid="start-navigation"]');
      await expect(page.locator('[data-testid="navigation-active"]')).toBeVisible();
      
      // Arrive at pickup
      await page.click('[data-testid="arrived-pickup"]');
      await expect(page.locator('[data-testid="pickup-confirmation"]')).toBeVisible();
      
      // Start ride
      await page.click('[data-testid="start-ride"]');
      await expect(page.locator('[data-testid="ride-in-progress"]')).toBeVisible();
      
      // Complete ride
      await page.click('[data-testid="complete-ride"]');
      await expect(page.locator('[data-testid="ride-completion"]')).toBeVisible();
      
      // Verify earnings update
      const earnings = await page.textContent('[data-testid="trip-earnings"]');
      expect(earnings).toContain('$');
    });
  });

  test.describe('Payment Processing', () => {
    test('successful payment flow', async () => {
      await loginPage.navigateToLogin();
      await loginPage.loginAsPassenger();
      
      // Complete a booking
      await dashboardPage.navigateToBooking();
      await bookingPage.enterPickupLocation('Test Pickup');
      await bookingPage.enterDestination('Test Destination');
      await bookingPage.selectVehicleType('standard');
      await bookingPage.confirmBooking();
      
      // Navigate to payment
      await page.click('[data-testid="proceed-to-payment"]');
      
      // Fill payment details
      await page.fill('[data-testid="card-number"]', '4242424242424242');
      await page.fill('[data-testid="expiry-date"]', '12/25');
      await page.fill('[data-testid="cvv"]', '123');
      
      // Process payment
      await page.click('[data-testid="pay-now"]');
      
      // Verify payment success
      await expect(page.locator('[data-testid="payment-success"]')).toBeVisible();
      
      const paymentDetails = {
        amount: await page.textContent('[data-testid="payment-amount"]'),
        method: await page.textContent('[data-testid="payment-method"]'),
        status: await page.textContent('[data-testid="payment-status"]'),
      };
      
      expect(paymentDetails.amount).toContain('$');
      expect(paymentDetails.status).toBe('Completed');
    });

    test('payment failure handling', async () => {
      // Mock payment failure
      await page.route('/api/payments', (route) => {
        route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Payment declined' }),
        });
      });
      
      await loginPage.navigateToLogin();
      await loginPage.loginAsPassenger();
      await dashboardPage.navigateToBooking();
      
      // Complete booking flow
      await bookingPage.enterPickupLocation('Test Pickup');
      await bookingPage.enterDestination('Test Destination');
      await bookingPage.confirmBooking();
      
      // Attempt payment
      await page.click('[data-testid="proceed-to-payment"]');
      await page.fill('[data-testid="card-number"]', '4000000000000002'); // Declined card
      await page.fill('[data-testid="expiry-date"]', '12/25');
      await page.fill('[data-testid="cvv"]', '123');
      await page.click('[data-testid="pay-now"]');
      
      // Verify error handling
      await expect(page.locator('[data-testid="payment-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="retry-payment"]')).toBeVisible();
    });
  });

  test.describe('Mobile Responsive Tests', () => {
    test('mobile booking workflow', async () => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      await loginPage.navigateToLogin();
      await loginPage.loginAsPassenger();
      
      // Verify mobile navigation
      await expect(page.locator('[data-testid="mobile-nav"]')).toBeVisible();
      await expect(page.locator('[data-testid="desktop-sidebar"]')).not.toBeVisible();
      
      // Test mobile booking
      await page.click('[data-testid="mobile-book-ride"]');
      
      // Use mobile-optimized inputs
      await page.tap('[data-testid="pickup-input"]');
      await page.fill('[data-testid="pickup-input"]', 'Mobile Pickup');
      
      await page.tap('[data-testid="destination-input"]');
      await page.fill('[data-testid="destination-input"]', 'Mobile Destination');
      
      // Test swipe gestures (if supported)
      const vehicleSelector = page.locator('[data-testid="vehicle-selector"]');
      await vehicleSelector.swipe({ direction: 'left' });
      
      await page.tap('[data-testid="confirm-mobile-booking"]');
      
      // Verify mobile confirmation screen
      await expect(page.locator('[data-testid="mobile-booking-success"]')).toBeVisible();
    });

    test('tablet responsive layout', async () => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      
      await loginPage.navigateToLogin();
      await loginPage.loginAsPassenger();
      
      // Verify tablet layout
      await expect(page.locator('[data-testid="tablet-layout"]')).toBeVisible();
      
      // Test tablet-specific interactions
      await dashboardPage.navigateToBooking();
      
      // Verify grid layout on tablet
      const vehicleGrid = page.locator('[data-testid="vehicle-grid"]');
      await expect(vehicleGrid).toHaveClass(/grid-cols-2/);
    });
  });

  test.describe('Performance Tests', () => {
    test('page load performance', async () => {
      const startTime = Date.now();
      
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(3000); // 3 second budget
      
      // Check Core Web Vitals
      const metrics = await page.evaluate(() => {
        return new Promise((resolve) => {
          new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lcp = entries.find(entry => entry.entryType === 'largest-contentful-paint');
            resolve({
              lcp: lcp?.startTime || 0,
              fcp: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0,
            });
          }).observe({ entryTypes: ['largest-contentful-paint'] });
          
          // Fallback timeout
          setTimeout(() => resolve({ lcp: 0, fcp: 0 }), 5000);
        });
      });
      
      expect(metrics.lcp).toBeLessThan(2500); // LCP budget
      expect(metrics.fcp).toBeLessThan(1800); // FCP budget
    });

    test('interaction responsiveness', async () => {
      await loginPage.navigateToLogin();
      await loginPage.loginAsPassenger();
      
      // Measure button click responsiveness
      const startTime = performance.now();
      await page.click('[data-testid="book-ride-button"]');
      await page.waitForURL('/booking');
      const responseTime = performance.now() - startTime;
      
      expect(responseTime).toBeLessThan(500); // 500ms budget for navigation
    });

    test('memory usage during extended session', async () => {
      await loginPage.navigateToLogin();
      await loginPage.loginAsPassenger();
      
      // Simulate extended usage
      for (let i = 0; i < 10; i++) {
        await dashboardPage.navigateToBooking();
        await page.goBack();
        await page.waitForLoadState('networkidle');
      }
      
      // Check for memory leaks
      const memoryUsage = await page.evaluate(() => {
        if ('memory' in performance) {
          return (performance as any).memory.usedJSHeapSize;
        }
        return 0;
      });
      
      // Memory usage should be reasonable (less than 50MB)
      expect(memoryUsage).toBeLessThan(50 * 1024 * 1024);
    });
  });

  test.describe('Accessibility Tests', () => {
    test('keyboard navigation', async () => {
      await loginPage.navigateToLogin();
      
      // Test tab navigation
      await page.keyboard.press('Tab');
      await expect(page.locator('[data-testid="email-input"]')).toBeFocused();
      
      await page.keyboard.press('Tab');
      await expect(page.locator('[data-testid="password-input"]')).toBeFocused();
      
      await page.keyboard.press('Tab');
      await expect(page.locator('[data-testid="login-button"]')).toBeFocused();
      
      // Test Enter key activation
      await page.keyboard.press('Enter');
      // Should trigger login (will fail due to empty fields, but interaction works)
    });

    test('screen reader compatibility', async () => {
      await page.goto('/dashboard');
      
      // Check for proper ARIA labels
      const bookButton = page.locator('[data-testid="book-ride-button"]');
      await expect(bookButton).toHaveAttribute('aria-label');
      
      // Check for proper heading structure
      const headings = page.locator('h1, h2, h3, h4, h5, h6');
      const headingCount = await headings.count();
      expect(headingCount).toBeGreaterThan(0);
      
      // Verify main landmark
      await expect(page.locator('main')).toBeVisible();
    });

    test('high contrast mode', async () => {
      // Enable high contrast
      await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
      
      await page.goto('/dashboard');
      
      // Verify high contrast styles are applied
      const body = page.locator('body');
      await expect(body).toHaveClass(/dark/);
      
      // Check button contrast
      const buttons = page.locator('button');
      const buttonCount = await buttons.count();
      
      for (let i = 0; i < Math.min(buttonCount, 5); i++) {
        const button = buttons.nth(i);
        const styles = await button.evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return {
            backgroundColor: computed.backgroundColor,
            color: computed.color,
          };
        });
        
        // Verify sufficient contrast (simplified check)
        expect(styles.backgroundColor).not.toBe(styles.color);
      }
    });
  });

  test.describe('Error Handling', () => {
    test('network error recovery', async () => {
      await loginPage.navigateToLogin();
      await loginPage.loginAsPassenger();
      
      // Simulate network failure
      await page.route('/api/**', (route) => {
        route.abort('failed');
      });
      
      // Attempt action that requires network
      await page.click('[data-testid="refresh-data"]');
      
      // Verify error message
      await expect(page.locator('[data-testid="network-error"]')).toBeVisible();
      
      // Restore network and retry
      await page.unroute('/api/**');
      await page.click('[data-testid="retry-button"]');
      
      // Verify recovery
      await expect(page.locator('[data-testid="network-error"]')).not.toBeVisible();
    });

    test('form validation errors', async () => {
      await bookingPage.navigateToBooking();
      
      // Try to submit without required fields
      await page.click('[data-testid="confirm-booking"]');
      
      // Verify validation errors
      await expect(page.locator('[data-testid="pickup-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="destination-error"]')).toBeVisible();
      
      // Fill one field and verify partial validation
      await bookingPage.enterPickupLocation('Test Pickup');
      await page.click('[data-testid="confirm-booking"]');
      
      await expect(page.locator('[data-testid="pickup-error"]')).not.toBeVisible();
      await expect(page.locator('[data-testid="destination-error"]')).toBeVisible();
    });
  });

  test.describe('Real-time Features', () => {
    test('live ride tracking', async () => {
      await loginPage.navigateToLogin();
      await loginPage.loginAsPassenger();
      
      // Create a booking
      await dashboardPage.navigateToBooking();
      await bookingPage.enterPickupLocation('Test Pickup');
      await bookingPage.enterDestination('Test Destination');
      await bookingPage.confirmBooking();
      
      // Navigate to tracking page
      await page.click('[data-testid="track-ride"]');
      
      // Verify map and tracking elements
      await expect(page.locator('[data-testid="ride-map"]')).toBeVisible();
      await expect(page.locator('[data-testid="driver-location"]')).toBeVisible();
      await expect(page.locator('[data-testid="eta-display"]')).toBeVisible();
      
      // Simulate real-time updates
      await page.evaluate(() => {
        // Simulate WebSocket message
        window.dispatchEvent(new CustomEvent('ride-update', {
          detail: { status: 'driver-arriving', eta: 3 }
        }));
      });
      
      // Verify UI updates
      await expect(page.locator('[data-testid="driver-arriving"]')).toBeVisible();
    });
  });
});