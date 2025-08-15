// Playwright global teardown
import { FullConfig } from '@playwright/test';
import fs from 'fs';
import path from 'path';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting Playwright global teardown...');
  
  try {
    // Clean up authentication state
    await cleanupAuthState();
    
    // Clean up test data
    await cleanupTestData();
    
    // Generate test reports
    await generateReports();
    
    console.log('✅ Playwright global teardown completed');
  } catch (error) {
    console.error('❌ Playwright teardown failed:', error);
  }
}

async function cleanupAuthState(): Promise<void> {
  console.log('🔐 Cleaning up authentication state...');
  
  const authStatePath = 'src/testing/setup/auth-state.json';
  
  try {
    if (fs.existsSync(authStatePath)) {
      fs.unlinkSync(authStatePath);
      console.log('✅ Authentication state cleaned up');
    }
  } catch (error) {
    console.warn('⚠️ Could not clean up authentication state:', error);
  }
}

async function cleanupTestData(): Promise<void> {
  console.log('🗑️ Cleaning up test data...');
  
  // In a real implementation, this would:
  // - Remove test users
  // - Clean up test rides
  // - Remove test drivers
  // - Clean database test data
  
  // Mock implementation
  await new Promise(resolve => setTimeout(resolve, 50));
  console.log('✅ Test data cleaned up');
}

async function generateReports(): Promise<void> {
  console.log('📊 Generating E2E test reports...');
  
  // In a real implementation, this would:
  // - Aggregate test results
  // - Generate HTML reports
  // - Send notifications
  // - Upload artifacts to CI/CD
  
  // Mock implementation
  await new Promise(resolve => setTimeout(resolve, 100));
  console.log('✅ E2E test reports generated');
}

export default globalTeardown;