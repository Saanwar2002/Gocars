import express, { Request, Response, NextFunction } from 'express';
import { Server as SocketIOServer } from 'socket.io';
import { createServer } from 'http';
import path from 'path';
import cors from 'cors';
import { TestingAgentController } from '../core/TestingAgentController';
import { MonitoringDashboard } from '../../monitoring/dashboard/MonitoringDashboard';
import { DashboardRenderer } from '../../monitoring/dashboard/DashboardRenderer';
import { TestConfiguration } from '../core/TestConfiguration';
import { TestResult } from '../core/TestResult';
import { VirtualUser } from '../simulation/VirtualUser';

export interface WebInterfaceConfig {
  port: number;
  host: string;
  enableAuth: boolean;
  corsOrigins: string[];
  staticPath?: string;
}

export interface UserSession {
  id: string;
  username: string;
  role: 'admin' | 'operator' | 'viewer';
  loginTime: Date;
  lastActivity: Date;
  permissions: string[];
}

export interface WebSocketClient {
  id: string;
  socket: any;
  userId?: string;
  subscriptions: string[];
}

export class WebInterface {
  private app: express.Application;
  private server: any;
  private io: SocketIOServer;
  private config: WebInterfaceConfig;
  private testingController: TestingAgentController;
  private dashboard: MonitoringDashboard;
  private sessions: Map<string, UserSession> = new Map();
  private clients: Map<string, WebSocketClient> = new Map();
  private isRunning = false;

  constructor(
    testingController: TestingAgentController,
    dashboard: MonitoringDashboard,
    config: Partial<WebInterfaceConfig> = {}
  ) {
    this.testingController = testingController;
    this.dashboard = dashboard;
    this.config = {
      port: 8080,
      host: '0.0.0.0',
      enableAuth: true,
      corsOrigins: ['http://localhost:3000', 'http://localhost:8080'],
      ...config
    };

    this.app = express();
    this.server = createServer(this.app);
    this.io = new SocketIOServer(this.server, {
      cors: {
        origin: this.config.corsOrigins,
        methods: ['GET', 'POST']
      }
    });

    this.setupMiddleware();
    this.setupRoutes();
    this.setupWebSocket();
    this.setupDashboardIntegration();
  }

  private setupMiddleware(): void {
    // CORS
    this.app.use(cors({
      origin: this.config.corsOrigins,
      credentials: true
    }));

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    // Static files
    if (this.config.staticPath) {
      this.app.use('/static', express.static(this.config.staticPath));
    }

    // Serve dashboard assets
    this.app.use('/dashboard', express.static(path.join(__dirname, 'dashboard')));

    // Authentication middleware
    if (this.config.enableAuth) {
      this.app.use('/api', this.authMiddleware.bind(this));
    }

    // Error handling
    this.app.use(this.errorHandler.bind(this));
  }

  private setupRoutes(): void {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.APP_VERSION || '1.0.0'
      });
    });

    // Authentication routes
    this.app.post('/api/auth/login', this.handleLogin.bind(this));
    this.app.post('/api/auth/logout', this.handleLogout.bind(this));
    this.app.get('/api/auth/session', this.handleGetSession.bind(this));

    // Test configuration routes
    this.app.get('/api/configurations', this.handleGetConfigurations.bind(this));
    this.app.post('/api/configurations', this.handleCreateConfiguration.bind(this));
    this.app.get('/api/configurations/:id', this.handleGetConfiguration.bind(this));
    this.app.put('/api/configurations/:id', this.handleUpdateConfiguration.bind(this));
    this.app.delete('/api/configurations/:id', this.handleDeleteConfiguration.bind(this));

    // Test execution routes
    this.app.post('/api/tests/start', this.handleStartTests.bind(this));
    this.app.post('/api/tests/stop', this.handleStopTests.bind(this));
    this.app.get('/api/tests/status', this.handleGetTestStatus.bind(this));
    this.app.get('/api/tests/results/:sessionId', this.handleGetTestResults.bind(this));

    // Virtual user management routes
    this.app.get('/api/users/virtual', this.handleGetVirtualUsers.bind(this));
    this.app.post('/api/users/virtual', this.handleCreateVirtualUser.bind(this));
    this.app.delete('/api/users/virtual/:id', this.handleDeleteVirtualUser.bind(this));

    // Monitoring and metrics routes
    this.app.get('/api/metrics', this.handleGetMetrics.bind(this));
    this.app.get('/api/alerts', this.handleGetAlerts.bind(this));
    this.app.post('/api/alerts/:id/acknowledge', this.handleAcknowledgeAlert.bind(this));
    this.app.post('/api/alerts/:id/resolve', this.handleResolveAlert.bind(this));

    // Report generation routes
    this.app.get('/api/reports/generate', this.handleGenerateReport.bind(this));
    this.app.get('/api/reports/:id', this.handleGetReport.bind(this));

    // User management routes (admin only)
    this.app.get('/api/admin/users', this.requireRole('admin'), this.handleGetUsers.bind(this));
    this.app.post('/api/admin/users', this.requireRole('admin'), this.handleCreateUser.bind(this));
    this.app.put('/api/admin/users/:id', this.requireRole('admin'), this.handleUpdateUser.bind(this));
    this.app.delete('/api/admin/users/:id', this.requireRole('admin'), this.handleDeleteUser.bind(this));

    // Dashboard route
    this.app.get('/', this.serveDashboard.bind(this));
    this.app.get('/dashboard', this.serveDashboard.bind(this));
    this.app.get('/login', this.serveLogin.bind(this));
  }

  private setupWebSocket(): void {
    this.io.on('connection', (socket) => {
      const clientId = this.generateClientId();
      const client: WebSocketClient = {
        id: clientId,
        socket,
        subscriptions: []
      };

      this.clients.set(clientId, client);

      // Handle authentication
      socket.on('authenticate', (data) => {
        this.handleSocketAuth(client, data);
      });

      // Handle subscriptions
      socket.on('subscribe', (data) => {
        this.handleSubscription(client, data);
      });

      socket.on('unsubscribe', (data) => {
        this.handleUnsubscription(client, data);
      });

      // Handle test control
      socket.on('startTest', (data) => {
        this.handleSocketStartTest(client, data);
      });

      socket.on('stopTest', (data) => {
        this.handleSocketStopTest(client, data);
      });

      // Handle configuration updates
      socket.on('updateConfiguration', (data) => {
        this.handleSocketUpdateConfiguration(client, data);
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        this.clients.delete(clientId);
      });
    });
  }

  private setupDashboardIntegration(): void {
    // Listen to dashboard events and broadcast to connected clients
    this.dashboard.on('metricsUpdated', (metrics) => {
      this.broadcast('metricsUpdate', metrics);
    });

    this.dashboard.on('alertTriggered', (alert) => {
      this.broadcast('alertTriggered', alert);
    });

    this.dashboard.on('testProgressUpdated', (progress) => {
      this.broadcast('testProgressUpdate', progress);
    });

    // Listen to testing controller events
    this.testingController.on('testStarted', (data) => {
      this.broadcast('testStarted', data);
    });

    this.testingController.on('testCompleted', (data) => {
      this.broadcast('testCompleted', data);
    });

    this.testingController.on('testFailed', (data) => {
      this.broadcast('testFailed', data);
    });
  }

  // Authentication handlers
  private async handleLogin(req: Request, res: Response): Promise<void> {
    try {
      const { username, password } = req.body;

      // In a real implementation, validate against a user database
      const user = await this.validateUser(username, password);
      if (!user) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }

      const session: UserSession = {
        id: this.generateSessionId(),
        username: user.username,
        role: user.role,
        loginTime: new Date(),
        lastActivity: new Date(),
        permissions: this.getRolePermissions(user.role)
      };

      this.sessions.set(session.id, session);

      res.json({
        sessionId: session.id,
        user: {
          username: session.username,
          role: session.role,
          permissions: session.permissions
        }
      });
    } catch (error) {
      res.status(500).json({ error: 'Login failed' });
    }
  }

  private async handleLogout(req: Request, res: Response): Promise<void> {
    const sessionId = req.headers.authorization?.replace('Bearer ', '');
    if (sessionId) {
      this.sessions.delete(sessionId);
    }
    res.json({ message: 'Logged out successfully' });
  }

  private async handleGetSession(req: Request, res: Response): Promise<void> {
    const session = (req as any).session;
    if (!session) {
      res.status(401).json({ error: 'No active session' });
      return;
    }

    res.json({
      user: {
        username: session.username,
        role: session.role,
        permissions: session.permissions
      },
      loginTime: session.loginTime,
      lastActivity: session.lastActivity
    });
  }

  // Configuration handlers
  private async handleGetConfigurations(req: Request, res: Response): Promise<void> {
    try {
      const configurations = await this.testingController.getConfigurations();
      res.json(configurations);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get configurations' });
    }
  }

  private async handleCreateConfiguration(req: Request, res: Response): Promise<void> {
    try {
      const configuration = await this.testingController.createConfiguration(req.body);
      res.status(201).json(configuration);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create configuration' });
    }
  }

  private async handleGetConfiguration(req: Request, res: Response): Promise<void> {
    try {
      const configuration = await this.testingController.getConfiguration(req.params.id);
      if (!configuration) {
        res.status(404).json({ error: 'Configuration not found' });
        return;
      }
      res.json(configuration);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get configuration' });
    }
  }

  private async handleUpdateConfiguration(req: Request, res: Response): Promise<void> {
    try {
      const configuration = await this.testingController.updateConfiguration(req.params.id, req.body);
      if (!configuration) {
        res.status(404).json({ error: 'Configuration not found' });
        return;
      }
      res.json(configuration);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update configuration' });
    }
  }

  private async handleDeleteConfiguration(req: Request, res: Response): Promise<void> {
    try {
      const success = await this.testingController.deleteConfiguration(req.params.id);
      if (!success) {
        res.status(404).json({ error: 'Configuration not found' });
        return;
      }
      res.json({ message: 'Configuration deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete configuration' });
    }
  }

  // Test execution handlers
  private async handleStartTests(req: Request, res: Response): Promise<void> {
    try {
      const { configurationId, options } = req.body;
      const sessionId = await this.testingController.startTesting(configurationId, options);
      res.json({ sessionId, message: 'Tests started successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to start tests' });
    }
  }

  private async handleStopTests(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.body;
      await this.testingController.stopTesting(sessionId);
      res.json({ message: 'Tests stopped successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to stop tests' });
    }
  }

  private async handleGetTestStatus(req: Request, res: Response): Promise<void> {
    try {
      const status = await this.testingController.getTestingStatus();
      res.json(status);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get test status' });
    }
  }

  private async handleGetTestResults(req: Request, res: Response): Promise<void> {
    try {
      const results = await this.testingController.getTestResults(req.params.sessionId);
      res.json(results);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get test results' });
    }
  }

  // Virtual user handlers
  private async handleGetVirtualUsers(req: Request, res: Response): Promise<void> {
    try {
      const users = await this.testingController.getVirtualUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get virtual users' });
    }
  }

  private async handleCreateVirtualUser(req: Request, res: Response): Promise<void> {
    try {
      const user = await this.testingController.createVirtualUser(req.body);
      res.status(201).json(user);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create virtual user' });
    }
  }

  private async handleDeleteVirtualUser(req: Request, res: Response): Promise<void> {
    try {
      const success = await this.testingController.deleteVirtualUser(req.params.id);
      if (!success) {
        res.status(404).json({ error: 'Virtual user not found' });
        return;
      }
      res.json({ message: 'Virtual user deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete virtual user' });
    }
  }

  // Monitoring handlers
  private async handleGetMetrics(req: Request, res: Response): Promise<void> {
    try {
      const metrics = this.dashboard.getMetrics();
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get metrics' });
    }
  }

  private async handleGetAlerts(req: Request, res: Response): Promise<void> {
    try {
      const alerts = this.dashboard.getAlerts();
      res.json(alerts);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get alerts' });
    }
  }

  private async handleAcknowledgeAlert(req: Request, res: Response): Promise<void> {
    try {
      this.dashboard.acknowledgeAlert(req.params.id);
      res.json({ message: 'Alert acknowledged successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to acknowledge alert' });
    }
  }

  private async handleResolveAlert(req: Request, res: Response): Promise<void> {
    try {
      this.dashboard.resolveAlert(req.params.id);
      res.json({ message: 'Alert resolved successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to resolve alert' });
    }
  }

  // Report handlers
  private async handleGenerateReport(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId, format = 'json' } = req.query;
      const report = await this.testingController.generateReport(sessionId as string, format as string);
      
      if (format === 'pdf') {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="test-report-${sessionId}.pdf"`);
      } else if (format === 'html') {
        res.setHeader('Content-Type', 'text/html');
      } else {
        res.setHeader('Content-Type', 'application/json');
      }
      
      res.send(report);
    } catch (error) {
      res.status(500).json({ error: 'Failed to generate report' });
    }
  }

  private async handleGetReport(req: Request, res: Response): Promise<void> {
    try {
      const report = await this.testingController.getReport(req.params.id);
      if (!report) {
        res.status(404).json({ error: 'Report not found' });
        return;
      }
      res.json(report);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get report' });
    }
  }

  // User management handlers (admin only)
  private async handleGetUsers(req: Request, res: Response): Promise<void> {
    try {
      // In a real implementation, this would query a user database
      const users = Array.from(this.sessions.values()).map(session => ({
        username: session.username,
        role: session.role,
        loginTime: session.loginTime,
        lastActivity: session.lastActivity
      }));
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get users' });
    }
  }

  private async handleCreateUser(req: Request, res: Response): Promise<void> {
    try {
      // In a real implementation, this would create a user in the database
      const { username, password, role } = req.body;
      const user = { username, role, id: this.generateUserId() };
      res.status(201).json(user);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create user' });
    }
  }

  private async handleUpdateUser(req: Request, res: Response): Promise<void> {
    try {
      // In a real implementation, this would update a user in the database
      const updates = req.body;
      res.json({ message: 'User updated successfully', updates });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update user' });
    }
  }

  private async handleDeleteUser(req: Request, res: Response): Promise<void> {
    try {
      // In a real implementation, this would delete a user from the database
      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete user' });
    }
  }

  // Dashboard serving
  private serveDashboard(req: Request, res: Response): void {
    const dashboardHTML = this.generateDashboardHTML();
    res.setHeader('Content-Type', 'text/html');
    res.send(dashboardHTML);
  }

  private serveLogin(req: Request, res: Response): void {
    res.sendFile(path.join(__dirname, 'dashboard', 'login.html'));
  }

  // WebSocket handlers
  private handleSocketAuth(client: WebSocketClient, data: any): void {
    const { sessionId } = data;
    const session = this.sessions.get(sessionId);
    
    if (session) {
      client.userId = session.username;
      client.socket.emit('authenticated', { 
        user: {
          username: session.username,
          role: session.role,
          permissions: session.permissions
        }
      });
    } else {
      client.socket.emit('authError', { error: 'Invalid session' });
    }
  }

  private handleSubscription(client: WebSocketClient, data: any): void {
    const { channels } = data;
    if (Array.isArray(channels)) {
      client.subscriptions.push(...channels);
      client.socket.emit('subscribed', { channels });
    }
  }

  private handleUnsubscription(client: WebSocketClient, data: any): void {
    const { channels } = data;
    if (Array.isArray(channels)) {
      client.subscriptions = client.subscriptions.filter(sub => !channels.includes(sub));
      client.socket.emit('unsubscribed', { channels });
    }
  }

  private async handleSocketStartTest(client: WebSocketClient, data: any): Promise<void> {
    try {
      const { configurationId, options } = data;
      const sessionId = await this.testingController.startTesting(configurationId, options);
      client.socket.emit('testStarted', { sessionId });
    } catch (error) {
      client.socket.emit('testError', { error: 'Failed to start test' });
    }
  }

  private async handleSocketStopTest(client: WebSocketClient, data: any): Promise<void> {
    try {
      const { sessionId } = data;
      await this.testingController.stopTesting(sessionId);
      client.socket.emit('testStopped', { sessionId });
    } catch (error) {
      client.socket.emit('testError', { error: 'Failed to stop test' });
    }
  }

  private async handleSocketUpdateConfiguration(client: WebSocketClient, data: any): Promise<void> {
    try {
      const { id, updates } = data;
      const configuration = await this.testingController.updateConfiguration(id, updates);
      client.socket.emit('configurationUpdated', configuration);
    } catch (error) {
      client.socket.emit('configurationError', { error: 'Failed to update configuration' });
    }
  }

  // Middleware
  private authMiddleware(req: Request, res: Response, next: NextFunction): void {
    if (!this.config.enableAuth) {
      next();
      return;
    }

    const sessionId = req.headers.authorization?.replace('Bearer ', '');
    if (!sessionId) {
      if (req.path.startsWith('/api/')) {
        res.status(401).json({ error: 'No authorization token provided' });
      } else {
        res.redirect('/login');
      }
      return;
    }

    const session = this.sessions.get(sessionId);
    if (!session) {
      if (req.path.startsWith('/api/')) {
        res.status(401).json({ error: 'Invalid session' });
      } else {
        res.redirect('/login');
      }
      return;
    }

    // Update last activity
    session.lastActivity = new Date();
    (req as any).session = session;
    next();
  }

  private requireRole(role: string) {
    return (req: Request, res: Response, next: NextFunction): void => {
      const session = (req as any).session;
      if (!session || session.role !== role) {
        res.status(403).json({ error: 'Insufficient permissions' });
        return;
      }
      next();
    };
  }

  private errorHandler(error: Error, req: Request, res: Response, next: NextFunction): void {
    console.error('Web interface error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }

  // Utility methods
  private broadcast(event: string, data: any): void {
    this.clients.forEach(client => {
      if (client.subscriptions.includes(event) || client.subscriptions.includes('*')) {
        client.socket.emit(event, data);
      }
    });
  }

  private async validateUser(username: string, password: string): Promise<any> {
    // In a real implementation, this would validate against a user database
    // For demo purposes, we'll use hardcoded users
    const users = [
      { username: 'admin', password: 'admin123', role: 'admin' },
      { username: 'operator', password: 'operator123', role: 'operator' },
      { username: 'viewer', password: 'viewer123', role: 'viewer' }
    ];

    return users.find(user => user.username === username && user.password === password);
  }

  private getRolePermissions(role: string): string[] {
    const permissions = {
      admin: ['read', 'write', 'delete', 'manage_users', 'manage_system'],
      operator: ['read', 'write', 'execute_tests', 'manage_configurations'],
      viewer: ['read']
    };

    return permissions[role as keyof typeof permissions] || [];
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateUserId(): string {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateDashboardHTML(): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GoCars Testing Agent - Management Dashboard</title>
    <link rel="stylesheet" href="/dashboard/styles.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <script src="https://cdn.socket.io/4.7.2/socket.io.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

</head>
<body>
    <div class="header">
        <h1><i class="fas fa-car"></i> GoCars Testing Agent</h1>
        <div class="user-info">
            <span>Loading...</span>
            <button class="btn btn-secondary btn-sm" onclick="dashboard.logout()">
                <i class="fas fa-sign-out-alt"></i> Logout
            </button>
        </div>
    </div>

    <div class="main-container">
        <div class="sidebar">
            <nav>
                <ul>
                    <li>
                        <a href="#" data-view="dashboard" class="active">
                            <i class="fas fa-tachometer-alt"></i>
                            Dashboard
                        </a>
                    </li>
                    <li>
                        <a href="#" data-view="tests">
                            <i class="fas fa-play-circle"></i>
                            Test Management
                        </a>
                    </li>
                    <li>
                        <a href="#" data-view="configurations">
                            <i class="fas fa-cog"></i>
                            Configurations
                        </a>
                    </li>
                    <li>
                        <a href="#" data-view="virtual-users">
                            <i class="fas fa-users"></i>
                            Virtual Users
                        </a>
                    </li>
                    <li>
                        <a href="#" data-view="monitoring">
                            <i class="fas fa-chart-line"></i>
                            Monitoring
                        </a>
                    </li>
                    <li>
                        <a href="#" data-view="reports">
                            <i class="fas fa-file-alt"></i>
                            Reports
                        </a>
                    </li>
                    <li>
                        <a href="#" data-view="settings">
                            <i class="fas fa-wrench"></i>
                            Settings
                        </a>
                    </li>
                </ul>
            </nav>
        </div>

        <div class="content">
            <div class="loading-container text-center">
                <div class="loading"></div>
                <p class="mt-3">Loading dashboard...</p>
            </div>
        </div>
    </div>

    <!-- Loading overlay -->
    <div id="loadingOverlay" class="modal" style="display: none;">
        <div class="modal-content text-center">
            <div class="loading"></div>
            <p class="mt-3">Processing...</p>
        </div>
    </div>
                        <div class="metric-label">Currently running</div>
                    </div>
                    <div class="card">
                        <h3>Test Success Rate</h3>
                        <div class="metric-value" id="success-rate">0%</div>
                        <div class="metric-label">Last 24 hours</div>
                    </div>
                    <div class="card">
                        <h3>Virtual Users</h3>
                        <div class="metric-value" id="virtual-users-count">0</div>
                        <div class="metric-label">Active virtual users</div>
                    </div>
                </div>

                <div class="card">
                    <h3>Test Execution Progress</h3>
                    <div class="progress-bar">
                        <div class="progress-fill" id="test-progress" style="width: 0%"></div>
                    </div>
                    <p id="progress-text">No tests running</p>
                </div>
            </div>

            <!-- Test Configurations Section -->
            <div id="configurations-section" class="section hidden">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <h2>Test Configurations</h2>
                    <button class="btn btn-primary" onclick="showCreateConfigModal()">Create Configuration</button>
                </div>
                <div class="card">
                    <table class="table" id="configurations-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Environment</th>
                                <th>Test Suites</th>
                                <th>Created</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <!-- Configurations will be loaded here -->
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Test Execution Section -->
            <div id="execution-section" class="section hidden">
                <h2>Test Execution</h2>
                <div class="dashboard-grid">
                    <div class="card">
                        <h3>Quick Start</h3>
                        <div class="form-group">
                            <label>Configuration:</label>
                            <select id="execution-config">
                                <option value="">Select configuration...</option>
                            </select>
                        </div>
                        <button class="btn btn-success" onclick="startTest()">Start Test</button>
                        <button class="btn btn-danger" onclick="stopTest()">Stop Test</button>
                    </div>
                    <div class="card">
                        <h3>Current Status</h3>
                        <div id="execution-status">
                            <p>No tests running</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Virtual Users Section -->
            <div id="virtual-users-section" class="section hidden">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <h2>Virtual Users</h2>
                    <button class="btn btn-primary" onclick="showCreateUserModal()">Create Virtual User</button>
                </div>
                <div class="card">
                    <table class="table" id="virtual-users-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Role</th>
                                <th>Status</th>
                                <th>Created</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <!-- Virtual users will be loaded here -->
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Monitoring Section -->
            <div id="monitoring-section" class="section hidden">
                <h2>System Monitoring</h2>
                <div class="dashboard-grid">
                    <div class="card">
                        <h3>Performance Metrics</h3>
                        <canvas id="performance-chart" width="400" height="200"></canvas>
                    </div>
                    <div class="card">
                        <h3>Active Alerts</h3>
                        <div id="alerts-list">
                            <!-- Alerts will be loaded here -->
                        </div>
                    </div>
                </div>
            </div>

            <!-- Reports Section -->
            <div id="reports-section" class="section hidden">
                <h2>Test Reports</h2>
                <div class="card">
                    <div class="form-group">
                        <label>Session ID:</label>
                        <input type="text" id="report-session-id" placeholder="Enter session ID">
                    </div>
                    <div class="form-group">
                        <label>Format:</label>
                        <select id="report-format">
                            <option value="json">JSON</option>
                            <option value="html">HTML</option>
                            <option value="pdf">PDF</option>
                        </select>
                    </div>
                    <button class="btn btn-primary" onclick="generateReport()">Generate Report</button>
                </div>
            </div>

            <!-- User Management Section -->
            <div id="users-section" class="section hidden">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <h2>User Management</h2>
                    <button class="btn btn-primary" onclick="showCreateUserModal()">Create User</button>
                </div>
                <div class="card">
                    <table class="table" id="users-table">
                        <thead>
                            <tr>
                                <th>Username</th>
                                <th>Role</th>
                                <th>Last Login</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <!-- Users will be loaded here -->
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>

    <!-- Modals -->
    <div id="create-config-modal" class="modal">
        <div class="modal-content">
            <span class="close" onclick="closeModal('create-config-modal')">&times;</span>
            <h2>Create Test Configuration</h2>
            <form id="create-config-form">
                <div class="form-group">
                    <label>Name:</label>
                    <input type="text" name="name" required>
                </div>
                <div class="form-group">
                    <label>Environment:</label>
                    <select name="environment" required>
                        <option value="development">Development</option>
                        <option value="staging">Staging</option>
                        <option value="production">Production</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Description:</label>
                    <textarea name="description" rows="3"></textarea>
                </div>
                <button type="submit" class="btn btn-primary">Create</button>
            </form>
        </div>
    </div>

    <script src="/dashboard/app.js"></script>
    <script>
        // Fallback script - this will be replaced by external app.js
        // Global variables
        let socket;
        let currentUser = null;
        let sessionId = localStorage.getItem('sessionId');

        // Initialize the application
        document.addEventListener('DOMContentLoaded', function() {
            if (!sessionId) {
                showLogin();
            } else {
                initializeApp();
            }
        });

        function showLogin() {
            document.body.innerHTML = \`
                <div style="display: flex; justify-content: center; align-items: center; height: 100vh; background-color: #f5f5f5;">
                    <div class="card" style="width: 400px;">
                        <h2 style="text-align: center; margin-bottom: 2rem;">Login to Testing Agent</h2>
                        <form id="login-form">
                            <div class="form-group">
                                <label>Username:</label>
                                <input type="text" name="username" required>
                            </div>
                            <div class="form-group">
                                <label>Password:</label>
                                <input type="password" name="password" required>
                            </div>
                            <button type="submit" class="btn btn-primary" style="width: 100%;">Login</button>
                        </form>
                        <div id="login-error" class="alert alert-danger hidden"></div>
                    </div>
                </div>
            \`;

            document.getElementById('login-form').addEventListener('submit', handleLogin);
        }

        async function handleLogin(e) {
            e.preventDefault();
            const formData = new FormData(e.target);
            const credentials = {
                username: formData.get('username'),
                password: formData.get('password')
            };

            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(credentials)
                });

                if (response.ok) {
                    const data = await response.json();
                    sessionId = data.sessionId;
                    localStorage.setItem('sessionId', sessionId);
                    location.reload();
                } else {
                    const error = await response.json();
                    document.getElementById('login-error').textContent = error.error;
                    document.getElementById('login-error').classList.remove('hidden');
                }
            } catch (error) {
                console.error('Login error:', error);
            }
        }

        async function initializeApp() {
            try {
                // Get user session
                const response = await fetch('/api/auth/session', {
                    headers: { 'Authorization': \`Bearer \${sessionId}\` }
                });

                if (response.ok) {
                    const data = await response.json();
                    currentUser = data.user;
                    document.getElementById('user-name').textContent = currentUser.username;
                    
                    // Show admin sections if user is admin
                    if (currentUser.role === 'admin') {
                        document.getElementById('users-nav').classList.remove('hidden');
                    }

                    // Initialize WebSocket
                    initializeWebSocket();
                    
                    // Load initial data
                    loadDashboardData();
                    loadConfigurations();
                    loadVirtualUsers();
                } else {
                    localStorage.removeItem('sessionId');
                    showLogin();
                }
            } catch (error) {
                console.error('Initialization error:', error);
                localStorage.removeItem('sessionId');
                showLogin();
            }
        }

        function initializeWebSocket() {
            socket = io();
            
            socket.on('connect', () => {
                socket.emit('authenticate', { sessionId });
                socket.emit('subscribe', { channels: ['*'] });
            });

            socket.on('metricsUpdate', updateDashboardMetrics);
            socket.on('testProgressUpdate', updateTestProgress);
            socket.on('alertTriggered', handleNewAlert);
        }

        function showSection(sectionName) {
            // Hide all sections
            document.querySelectorAll('.section').forEach(section => {
                section.classList.add('hidden');
            });

            // Remove active class from all nav links
            document.querySelectorAll('.sidebar nav a').forEach(link => {
                link.classList.remove('active');
            });

            // Show selected section
            document.getElementById(sectionName + '-section').classList.remove('hidden');
            
            // Add active class to clicked nav link
            event.target.classList.add('active');

            // Load section-specific data
            switch(sectionName) {
                case 'dashboard':
                    loadDashboardData();
                    break;
                case 'configurations':
                    loadConfigurations();
                    break;
                case 'virtual-users':
                    loadVirtualUsers();
                    break;
                case 'monitoring':
                    loadMonitoringData();
                    break;
                case 'users':
                    if (currentUser.role === 'admin') {
                        loadUsers();
                    }
                    break;
            }
        }

        async function loadDashboardData() {
            try {
                const response = await fetch('/api/metrics', {
                    headers: { 'Authorization': \`Bearer \${sessionId}\` }
                });
                
                if (response.ok) {
                    const metrics = await response.json();
                    updateDashboardMetrics(metrics);
                }
            } catch (error) {
                console.error('Error loading dashboard data:', error);
            }
        }

        function updateDashboardMetrics(metrics) {
            document.getElementById('system-status').textContent = 
                metrics.systemHealth.overallStatus.charAt(0).toUpperCase() + 
                metrics.systemHealth.overallStatus.slice(1);
            
            document.getElementById('active-tests').textContent = metrics.testExecution.runningTests;
            
            const successRate = metrics.testExecution.totalTests > 0 ? 
                (metrics.testExecution.passedTests / metrics.testExecution.totalTests * 100).toFixed(1) : 0;
            document.getElementById('success-rate').textContent = successRate + '%';
            
            document.getElementById('virtual-users-count').textContent = '0'; // Placeholder
        }

        function updateTestProgress(progress) {
            const progressBar = document.getElementById('test-progress');
            const progressText = document.getElementById('progress-text');
            
            progressBar.style.width = progress.progress + '%';
            progressText.textContent = \`\${progress.progress.toFixed(1)}% complete - \${progress.passedTests} passed, \${progress.failedTests} failed\`;
        }

        async function loadConfigurations() {
            try {
                const response = await fetch('/api/configurations', {
                    headers: { 'Authorization': \`Bearer \${sessionId}\` }
                });
                
                if (response.ok) {
                    const configurations = await response.json();
                    updateConfigurationsTable(configurations);
                    updateExecutionConfigSelect(configurations);
                }
            } catch (error) {
                console.error('Error loading configurations:', error);
            }
        }

        function updateConfigurationsTable(configurations) {
            const tbody = document.querySelector('#configurations-table tbody');
            tbody.innerHTML = configurations.map(config => \`
                <tr>
                    <td>\${config.name}</td>
                    <td>\${config.environment}</td>
                    <td>\${config.testSuites ? config.testSuites.length : 0}</td>
                    <td>\${new Date(config.createdAt).toLocaleDateString()}</td>
                    <td>
                        <button class="btn btn-primary" onclick="editConfiguration('\${config.id}')">Edit</button>
                        <button class="btn btn-danger" onclick="deleteConfiguration('\${config.id}')">Delete</button>
                    </td>
                </tr>
            \`).join('');
        }

        function updateExecutionConfigSelect(configurations) {
            const select = document.getElementById('execution-config');
            select.innerHTML = '<option value="">Select configuration...</option>' +
                configurations.map(config => \`<option value="\${config.id}">\${config.name}</option>\`).join('');
        }

        async function loadVirtualUsers() {
            try {
                const response = await fetch('/api/users/virtual', {
                    headers: { 'Authorization': \`Bearer \${sessionId}\` }
                });
                
                if (response.ok) {
                    const users = await response.json();
                    updateVirtualUsersTable(users);
                }
            } catch (error) {
                console.error('Error loading virtual users:', error);
            }
        }

        function updateVirtualUsersTable(users) {
            const tbody = document.querySelector('#virtual-users-table tbody');
            tbody.innerHTML = users.map(user => \`
                <tr>
                    <td>\${user.id}</td>
                    <td>\${user.role}</td>
                    <td>\${user.status || 'Active'}</td>
                    <td>\${new Date(user.createdAt).toLocaleDateString()}</td>
                    <td>
                        <button class="btn btn-danger" onclick="deleteVirtualUser('\${user.id}')">Delete</button>
                    </td>
                </tr>
            \`).join('');
        }

        async function startTest() {
            const configId = document.getElementById('execution-config').value;
            if (!configId) {
                alert('Please select a configuration');
                return;
            }

            try {
                const response = await fetch('/api/tests/start', {
                    method: 'POST',
                    headers: { 
                        'Authorization': \`Bearer \${sessionId}\`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ configurationId: configId })
                });
                
                if (response.ok) {
                    const data = await response.json();
                    alert('Test started successfully');
                    loadDashboardData();
                } else {
                    const error = await response.json();
                    alert('Failed to start test: ' + error.error);
                }
            } catch (error) {
                console.error('Error starting test:', error);
                alert('Failed to start test');
            }
        }

        async function logout() {
            try {
                await fetch('/api/auth/logout', {
                    method: 'POST',
                    headers: { 'Authorization': \`Bearer \${sessionId}\` }
                });
            } catch (error) {
                console.error('Logout error:', error);
            } finally {
                localStorage.removeItem('sessionId');
                location.reload();
            }
        }

        function showCreateConfigModal() {
            document.getElementById('create-config-modal').style.display = 'block';
        }

        function closeModal(modalId) {
            document.getElementById(modalId).style.display = 'none';
        }

        // Additional utility functions would be implemented here...
        
    </script>
</body>
</html>
    `;
  }

  // Public methods
  public async start(): Promise<void> {
    if (this.isRunning) {
      return;
    }

    return new Promise((resolve, reject) => {
      this.server.listen(this.config.port, this.config.host, (error: any) => {
        if (error) {
          reject(error);
          return;
        }

        this.isRunning = true;
        console.log(`Web interface started on http://${this.config.host}:${this.config.port}`);
        resolve();
      });
    });
  }

  public async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    return new Promise((resolve) => {
      this.server.close(() => {
        this.isRunning = false;
        console.log('Web interface stopped');
        resolve();
      });
    });
  }

  public getConfig(): WebInterfaceConfig {
    return { ...this.config };
  }

  public isActive(): boolean {
    return this.isRunning;
  }

  public getConnectedClients(): number {
    return this.clients.size;
  }

  public getActiveSessions(): number {
    return this.sessions.size;
  }
}