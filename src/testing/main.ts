#!/usr/bin/env node

import { TestingAgentServer } from './server/TestingAgentServer';
import { config } from 'dotenv';

// Load environment variables
config();

// Configuration from environment variables
const serverConfig = {
  port: parseInt(process.env.API_PORT || process.env.PORT || '3000'),
  metricsPort: parseInt(process.env.METRICS_PORT || '9090'),
  enableCors: process.env.ENABLE_CORS !== 'false',
  enableCompression: process.env.ENABLE_COMPRESSION !== 'false',
  enableSecurity: process.env.ENABLE_SECURITY !== 'false',
  logLevel: (process.env.LOG_LEVEL || 'info') as 'debug' | 'info' | 'warn' | 'error'
};

// Global error handlers
process.on('uncaughtException', (error: Error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Graceful shutdown handler
let server: TestingAgentServer | null = null;

const gracefulShutdown = async (signal: string) => {
  console.log(`\n📡 Received ${signal}. Starting graceful shutdown...`);
  
  if (server) {
    try {
      await server.stop();
      console.log('✅ Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      console.error('❌ Error during shutdown:', error);
      process.exit(1);
    }
  } else {
    process.exit(0);
  }
};

// Register shutdown handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Main function
async function main() {
  try {
    console.log('🚀 Starting GoCars Testing Agent...');
    console.log('📋 Configuration:', {
      nodeEnv: process.env.NODE_ENV || 'development',
      apiPort: serverConfig.port,
      metricsPort: serverConfig.metricsPort,
      logLevel: serverConfig.logLevel,
      autoFixEnabled: process.env.AUTO_FIX_ENABLED === 'true',
      metricsEnabled: process.env.METRICS_ENABLED === 'true'
    });

    // Create and start server
    server = new TestingAgentServer(serverConfig);
    await server.start();

    console.log('🎉 GoCars Testing Agent is ready!');
    console.log(`📡 API Server: http://localhost:${serverConfig.port}`);
    console.log(`📊 Metrics: http://localhost:${serverConfig.metricsPort}/metrics`);
    console.log(`🏥 Health Check: http://localhost:${serverConfig.port}/health`);
    console.log(`ℹ️  Info: http://localhost:${serverConfig.port}/info`);

  } catch (error) {
    console.error('❌ Failed to start Testing Agent:', error);
    process.exit(1);
  }
}

// Start the application
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}

export { TestingAgentServer };