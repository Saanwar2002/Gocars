import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { HealthCheckService } from '../health/HealthCheckService';
import { PrometheusMetrics } from '../metrics/PrometheusMetrics';

export interface ServerConfig {
  port: number;
  metricsPort?: number;
  enableCors?: boolean;
  enableCompression?: boolean;
  enableSecurity?: boolean;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
}

export class TestingAgentServer {
  private app: express.Application;
  private metricsApp: express.Application;
  private healthService: HealthCheckService;
  private metricsService: PrometheusMetrics;
  private config: ServerConfig;
  private server: any;
  private metricsServer: any;

  constructor(config: ServerConfig) {
    this.config = {
      enableCors: true,
      enableCompression: true,
      enableSecurity: true,
      logLevel: 'info',
      ...config
    };

    this.app = express();
    this.metricsApp = express();
    this.healthService = new HealthCheckService();
    this.metricsService = new PrometheusMetrics();

    this.setupMiddleware();
    this.setupRoutes();
    this.setupMetricsRoutes();
    this.setupErrorHandling();
  }

  private setupMiddleware(): void {
    // Security middleware
    if (this.config.enableSecurity) {
      this.app.use(helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
          },
        },
      }));
    }

    // CORS middleware
    if (this.config.enableCors) {
      this.app.use(cors({
        origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
      }));
    }

    // Compression middleware
    if (this.config.enableCompression) {
      this.app.use(compression());
    }

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging middleware
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      const start = Date.now();
      
      res.on('finish', () => {
        const duration = Date.now() - start;
        this.metricsService.recordAPIRequest(req.path, req.method, duration / 1000);
        
        if (this.config.logLevel === 'debug') {
          console.log(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
        }
      });
      
      next();
    });
  }

  private setupRoutes(): void {
    // Health check endpoints
    this.app.get('/health', async (req: Request, res: Response) => {
      try {
        const health = await this.healthService.runAllChecks();
        const statusCode = health.status === 'healthy' ? 200 : 
                          health.status === 'degraded' ? 200 : 503;
        
        res.status(statusCode).json(health);
      } catch (error) {
        res.status(503).json({
          status: 'unhealthy',
          message: error.message,
          timestamp: new Date()
        });
      }
    });

    this.app.get('/ready', async (req: Request, res: Response) => {
      try {
        const readiness = await this.healthService.getReadinessStatus();
        const statusCode = readiness.ready ? 200 : 503;
        
        res.status(statusCode).json(readiness);
      } catch (error) {
        res.status(503).json({
          ready: false,
          message: error.message
        });
      }
    });

    // API info endpoint
    this.app.get('/info', (req: Request, res: Response) => {
      res.json({
        name: 'GoCars Testing Agent',
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        uptime: process.uptime(),
        timestamp: new Date(),
        node_version: process.version,
        platform: process.platform,
        arch: process.arch
      });
    });

    // Test execution endpoints (placeholder)
    this.app.post('/api/tests/start', async (req: Request, res: Response) => {
      try {
        // Placeholder for test execution logic
        const { configuration } = req.body;
        
        // Simulate test execution
        const sessionId = `session_${Date.now()}`;
        
        this.metricsService.incrementCounter('test_executions_total', { 
          suite: configuration?.suite || 'unknown', 
          status: 'started' 
        });

        res.json({
          sessionId,
          status: 'started',
          message: 'Test execution started',
          timestamp: new Date()
        });
      } catch (error) {
        res.status(500).json({
          error: 'Failed to start tests',
          message: error.message
        });
      }
    });

    this.app.get('/api/tests/:sessionId/status', (req: Request, res: Response) => {
      const { sessionId } = req.params;
      
      // Placeholder for test status logic
      res.json({
        sessionId,
        status: 'running',
        progress: 45,
        testsCompleted: 23,
        testsTotal: 51,
        timestamp: new Date()
      });
    });

    this.app.post('/api/tests/:sessionId/stop', (req: Request, res: Response) => {
      const { sessionId } = req.params;
      
      // Placeholder for test stop logic
      res.json({
        sessionId,
        status: 'stopped',
        message: 'Test execution stopped',
        timestamp: new Date()
      });
    });

    // Configuration endpoints
    this.app.get('/api/config', (req: Request, res: Response) => {
      res.json({
        autoFixEnabled: process.env.AUTO_FIX_ENABLED === 'true',
        metricsEnabled: process.env.METRICS_ENABLED === 'true',
        logLevel: process.env.LOG_LEVEL || 'info',
        maxConcurrentUsers: parseInt(process.env.MAX_CONCURRENT_USERS || '100'),
        testTimeout: parseInt(process.env.TEST_TIMEOUT || '300000')
      });
    });

    // Root endpoint
    this.app.get('/', (req: Request, res: Response) => {
      res.json({
        message: 'GoCars Testing Agent API',
        version: process.env.npm_package_version || '1.0.0',
        endpoints: {
          health: '/health',
          ready: '/ready',
          info: '/info',
          metrics: `http://localhost:${this.config.metricsPort || 9090}/metrics`,
          api: '/api'
        }
      });
    });
  }

  private setupMetricsRoutes(): void {
    // Prometheus metrics endpoint
    this.metricsApp.get('/metrics', (req: Request, res: Response) => {
      try {
        const metrics = this.metricsService.getMetricsText();
        res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
        res.send(metrics);
      } catch (error) {
        res.status(500).send(`# Error generating metrics: ${error.message}\n`);
      }
    });

    // JSON metrics endpoint
    this.metricsApp.get('/metrics.json', (req: Request, res: Response) => {
      try {
        const metrics = this.metricsService.getMetricsJSON();
        res.json(metrics);
      } catch (error) {
        res.status(500).json({
          error: 'Failed to generate metrics',
          message: error.message
        });
      }
    });

    // Metrics health check
    this.metricsApp.get('/health', (req: Request, res: Response) => {
      res.json({
        status: 'healthy',
        service: 'metrics',
        timestamp: new Date()
      });
    });
  }

  private setupErrorHandling(): void {
    // 404 handler
    this.app.use((req: Request, res: Response) => {
      res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.method} ${req.path} not found`,
        timestamp: new Date()
      });
    });

    // Global error handler
    this.app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
      console.error('Unhandled error:', error);
      
      this.metricsService.incrementCounter('api_errors_total', {
        endpoint: req.path,
        method: req.method,
        error_type: 'internal'
      });

      res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
        timestamp: new Date()
      });
    });

    // Metrics app error handler
    this.metricsApp.use((error: Error, req: Request, res: Response, next: NextFunction) => {
      console.error('Metrics error:', error);
      res.status(500).send(`# Error: ${error.message}\n`);
    });
  }

  public async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Start main API server
        this.server = this.app.listen(this.config.port, () => {
          console.log(`🚀 Testing Agent API server started on port ${this.config.port}`);
          
          // Start metrics server if different port
          if (this.config.metricsPort && this.config.metricsPort !== this.config.port) {
            this.metricsServer = this.metricsApp.listen(this.config.metricsPort, () => {
              console.log(`📊 Metrics server started on port ${this.config.metricsPort}`);
              this.startServices();
              resolve();
            });
          } else {
            // Use same port for metrics
            this.app.use('/metrics', this.metricsApp);
            this.startServices();
            resolve();
          }
        });

        this.server.on('error', (error: Error) => {
          console.error('Server error:', error);
          reject(error);
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  private startServices(): void {
    // Start health checks
    this.healthService.startPeriodicChecks();
    
    // Start system metrics collection
    this.metricsService.startSystemMetricsCollection();
    
    console.log('✅ All services started successfully');
  }

  public async stop(): Promise<void> {
    return new Promise((resolve) => {
      console.log('🛑 Shutting down Testing Agent server...');
      
      // Stop services
      this.healthService.stopPeriodicChecks();
      
      let serversToClose = 0;
      let serversClosed = 0;
      
      const checkComplete = () => {
        serversClosed++;
        if (serversClosed === serversToClose) {
          console.log('✅ Testing Agent server shut down successfully');
          resolve();
        }
      };

      // Close main server
      if (this.server) {
        serversToClose++;
        this.server.close(checkComplete);
      }

      // Close metrics server
      if (this.metricsServer) {
        serversToClose++;
        this.metricsServer.close(checkComplete);
      }

      // If no servers to close, resolve immediately
      if (serversToClose === 0) {
        resolve();
      }
    });
  }

  public getHealthService(): HealthCheckService {
    return this.healthService;
  }

  public getMetricsService(): PrometheusMetrics {
    return this.metricsService;
  }
}