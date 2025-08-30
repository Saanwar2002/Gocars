// GoCars Testing Agent Dashboard Application

class TestingAgentDashboard {
    constructor() {
        this.socket = null;
        this.currentUser = null;
        this.currentView = 'dashboard';
        this.testSessions = new Map();
        this.configurations = [];
        this.virtualUsers = [];
        this.metrics = {};
        this.alerts = [];
        
        this.init();
    }

    async init() {
        await this.loadInitialData();
        this.setupEventListeners();
        this.initializeWebSocket();
        this.renderCurrentView();
        this.startMetricsPolling();
    }

    async loadInitialData() {
        try {
            // Load user session
            const sessionResponse = await fetch('/api/auth/session');
            if (sessionResponse.ok) {
                const sessionData = await sessionResponse.json();
                this.currentUser = sessionData.user;
                this.updateUserInfo();
            }

            // Load configurations
            await this.loadConfigurations();
            
            // Load virtual users
            await this.loadVirtualUsers();
            
            // Load metrics
            await this.loadMetrics();
            
            // Load alerts
            await this.loadAlerts();
        } catch (error) {
            console.error('Failed to load initial data:', error);
            this.showNotification('Failed to load initial data', 'danger');
        }
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.sidebar nav a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const view = e.target.getAttribute('data-view');
                if (view) {
                    this.navigateTo(view);
                }
            });
        });

        // Modal close buttons
        document.querySelectorAll('.close').forEach(closeBtn => {
            closeBtn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                if (modal) {
                    this.hideModal(modal.id);
                }
            });
        });

        // Global keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideAllModals();
            }
        });
    }

    initializeWebSocket() {
        this.socket = io();
        
        this.socket.on('connect', () => {
            console.log('Connected to server');
            // Authenticate with session
            const sessionId = localStorage.getItem('sessionId');
            if (sessionId) {
                this.socket.emit('authenticate', { sessionId });
            }
        });

        this.socket.on('authenticated', (data) => {
            console.log('WebSocket authenticated:', data.user);
            // Subscribe to relevant channels
            this.socket.emit('subscribe', { 
                channels: ['metricsUpdate', 'testProgressUpdate', 'alertTriggered', 'testStarted', 'testCompleted', 'testFailed'] 
            });
        });

        this.socket.on('metricsUpdate', (metrics) => {
            this.metrics = metrics;
            this.updateMetricsDisplay();
        });

        this.socket.on('testProgressUpdate', (progress) => {
            this.updateTestProgress(progress);
        });

        this.socket.on('alertTriggered', (alert) => {
            this.alerts.unshift(alert);
            this.updateAlertsDisplay();
            this.showNotification(`Alert: ${alert.message}`, alert.severity);
        });

        this.socket.on('testStarted', (data) => {
            this.testSessions.set(data.sessionId, { ...data, status: 'running' });
            this.updateTestSessionsDisplay();
            this.showNotification('Test session started', 'success');
        });

        this.socket.on('testCompleted', (data) => {
            const session = this.testSessions.get(data.sessionId);
            if (session) {
                session.status = 'completed';
                session.results = data.results;
                this.updateTestSessionsDisplay();
            }
            this.showNotification('Test session completed', 'success');
        });

        this.socket.on('testFailed', (data) => {
            const session = this.testSessions.get(data.sessionId);
            if (session) {
                session.status = 'failed';
                session.error = data.error;
                this.updateTestSessionsDisplay();
            }
            this.showNotification('Test session failed', 'danger');
        });

        this.socket.on('disconnect', () => {
            console.log('Disconnected from server');
            this.showNotification('Connection lost. Attempting to reconnect...', 'warning');
        });
    }

    navigateTo(view) {
        // Update active navigation
        document.querySelectorAll('.sidebar nav a').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`[data-view="${view}"]`).classList.add('active');

        this.currentView = view;
        this.renderCurrentView();
    }

    renderCurrentView() {
        const content = document.querySelector('.content');
        
        switch (this.currentView) {
            case 'dashboard':
                content.innerHTML = this.renderDashboard();
                break;
            case 'tests':
                content.innerHTML = this.renderTestsView();
                break;
            case 'configurations':
                content.innerHTML = this.renderConfigurationsView();
                break;
            case 'virtual-users':
                content.innerHTML = this.renderVirtualUsersView();
                break;
            case 'monitoring':
                content.innerHTML = this.renderMonitoringView();
                break;
            case 'reports':
                content.innerHTML = this.renderReportsView();
                break;
            case 'settings':
                content.innerHTML = this.renderSettingsView();
                break;
            default:
                content.innerHTML = this.renderDashboard();
        }

        // Re-attach event listeners for the new content
        this.attachViewEventListeners();
    }

    renderDashboard() {
        return `
            <div class="dashboard-header">
                <h2>Dashboard Overview</h2>
                <div class="dashboard-actions">
                    <button class="btn btn-primary" onclick="dashboard.showModal('startTestModal')">
                        <i class="fas fa-play"></i> Start Test
                    </button>
                </div>
            </div>

            <div class="dashboard-grid">
                <div class="metric-card success">
                    <div class="metric-value" id="activeTests">${this.getActiveTestsCount()}</div>
                    <div class="metric-label">Active Tests</div>
                    <div class="metric-change positive">+2 from yesterday</div>
                </div>
                
                <div class="metric-card info">
                    <div class="metric-value" id="totalConfigurations">${this.configurations.length}</div>
                    <div class="metric-label">Configurations</div>
                </div>
                
                <div class="metric-card warning">
                    <div class="metric-value" id="virtualUsers">${this.virtualUsers.length}</div>
                    <div class="metric-label">Virtual Users</div>
                </div>
                
                <div class="metric-card danger">
                    <div class="metric-value" id="activeAlerts">${this.getActiveAlertsCount()}</div>
                    <div class="metric-label">Active Alerts</div>
                </div>
            </div>

            <div class="dashboard-content">
                <div class="card">
                    <div class="card-header">
                        <h3>Recent Test Sessions</h3>
                    </div>
                    <div class="card-body">
                        <div id="recentTestSessions">
                            ${this.renderRecentTestSessions()}
                        </div>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <h3>System Health</h3>
                    </div>
                    <div class="card-body">
                        <div id="systemHealth">
                            ${this.renderSystemHealth()}
                        </div>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <h3>Recent Alerts</h3>
                    </div>
                    <div class="card-body">
                        <div id="recentAlerts">
                            ${this.renderRecentAlerts()}
                        </div>
                    </div>
                </div>
            </div>

            ${this.renderStartTestModal()}
        `;
    }

    renderTestsView() {
        return `
            <div class="tests-header">
                <h2>Test Management</h2>
                <div class="tests-actions">
                    <button class="btn btn-primary" onclick="dashboard.showModal('startTestModal')">
                        <i class="fas fa-play"></i> Start New Test
                    </button>
                    <button class="btn btn-secondary" onclick="dashboard.refreshTestSessions()">
                        <i class="fas fa-refresh"></i> Refresh
                    </button>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <h3>Active Test Sessions</h3>
                </div>
                <div class="card-body">
                    <div id="testSessionsList">
                        ${this.renderTestSessionsList()}
                    </div>
                </div>
            </div>

            ${this.renderStartTestModal()}
            ${this.renderTestDetailsModal()}
        `;
    }

    renderConfigurationsView() {
        return `
            <div class="configurations-header">
                <h2>Test Configurations</h2>
                <div class="configurations-actions">
                    <button class="btn btn-primary" onclick="dashboard.showModal('createConfigModal')">
                        <i class="fas fa-plus"></i> Create Configuration
                    </button>
                </div>
            </div>

            <div class="card">
                <div class="card-body">
                    <div id="configurationsList">
                        ${this.renderConfigurationsList()}
                    </div>
                </div>
            </div>

            ${this.renderCreateConfigModal()}
            ${this.renderEditConfigModal()}
        `;
    }

    renderVirtualUsersView() {
        return `
            <div class="virtual-users-header">
                <h2>Virtual Users</h2>
                <div class="virtual-users-actions">
                    <button class="btn btn-primary" onclick="dashboard.showModal('createUserModal')">
                        <i class="fas fa-user-plus"></i> Create Virtual User
                    </button>
                </div>
            </div>

            <div class="card">
                <div class="card-body">
                    <div id="virtualUsersList">
                        ${this.renderVirtualUsersList()}
                    </div>
                </div>
            </div>

            ${this.renderCreateUserModal()}
        `;
    }

    renderMonitoringView() {
        return `
            <div class="monitoring-header">
                <h2>System Monitoring</h2>
                <div class="monitoring-actions">
                    <button class="btn btn-secondary" onclick="dashboard.refreshMetrics()">
                        <i class="fas fa-refresh"></i> Refresh
                    </button>
                </div>
            </div>

            <div class="dashboard-grid">
                <div class="card">
                    <div class="card-header">
                        <h3>Performance Metrics</h3>
                    </div>
                    <div class="card-body">
                        <div class="chart-container">
                            <canvas id="performanceChart"></canvas>
                        </div>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <h3>Resource Usage</h3>
                    </div>
                    <div class="card-body">
                        <div id="resourceUsage">
                            ${this.renderResourceUsage()}
                        </div>
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <h3>Active Alerts</h3>
                </div>
                <div class="card-body">
                    <div id="alertsList">
                        ${this.renderAlertsList()}
                    </div>
                </div>
            </div>
        `;
    }

    renderReportsView() {
        return `
            <div class="reports-header">
                <h2>Test Reports</h2>
                <div class="reports-actions">
                    <button class="btn btn-primary" onclick="dashboard.showModal('generateReportModal')">
                        <i class="fas fa-file-alt"></i> Generate Report
                    </button>
                </div>
            </div>

            <div class="card">
                <div class="card-body">
                    <div id="reportsList">
                        ${this.renderReportsList()}
                    </div>
                </div>
            </div>

            ${this.renderGenerateReportModal()}
        `;
    }

    renderSettingsView() {
        return `
            <div class="settings-header">
                <h2>Settings</h2>
            </div>

            <div class="card">
                <div class="card-header">
                    <h3>User Preferences</h3>
                </div>
                <div class="card-body">
                    <form id="userPreferencesForm">
                        <div class="form-group">
                            <label for="theme">Theme</label>
                            <select id="theme" class="form-control">
                                <option value="light">Light</option>
                                <option value="dark">Dark</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="notifications">Enable Notifications</label>
                            <input type="checkbox" id="notifications" checked>
                        </div>
                        <button type="submit" class="btn btn-primary">Save Settings</button>
                    </form>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <h3>System Configuration</h3>
                </div>
                <div class="card-body">
                    <div id="systemConfig">
                        ${this.renderSystemConfig()}
                    </div>
                </div>
            </div>
        `;
    }

    // Helper render methods
    renderRecentTestSessions() {
        const recentSessions = Array.from(this.testSessions.values()).slice(0, 5);
        if (recentSessions.length === 0) {
            return '<p class="text-muted">No recent test sessions</p>';
        }

        return `
            <table class="table">
                <thead>
                    <tr>
                        <th>Session ID</th>
                        <th>Configuration</th>
                        <th>Status</th>
                        <th>Started</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${recentSessions.map(session => `
                        <tr>
                            <td>${session.sessionId}</td>
                            <td>${session.configurationName || 'Unknown'}</td>
                            <td>
                                <span class="status-indicator">
                                    <span class="status-dot ${this.getStatusClass(session.status)}"></span>
                                    ${session.status}
                                </span>
                            </td>
                            <td>${new Date(session.startTime).toLocaleString()}</td>
                            <td>
                                <button class="btn btn-sm btn-outline" onclick="dashboard.viewTestDetails('${session.sessionId}')">
                                    View
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    renderSystemHealth() {
        return `
            <div class="health-indicators">
                <div class="health-item">
                    <span class="status-indicator">
                        <span class="status-dot healthy"></span>
                        API Server
                    </span>
                </div>
                <div class="health-item">
                    <span class="status-indicator">
                        <span class="status-dot healthy"></span>
                        Database
                    </span>
                </div>
                <div class="health-item">
                    <span class="status-indicator">
                        <span class="status-dot warning"></span>
                        WebSocket
                    </span>
                </div>
                <div class="health-item">
                    <span class="status-indicator">
                        <span class="status-dot healthy"></span>
                        Testing Engine
                    </span>
                </div>
            </div>
        `;
    }

    renderRecentAlerts() {
        const recentAlerts = this.alerts.slice(0, 5);
        if (recentAlerts.length === 0) {
            return '<p class="text-muted">No recent alerts</p>';
        }

        return `
            <div class="alerts-list">
                ${recentAlerts.map(alert => `
                    <div class="alert alert-${alert.severity}">
                        <strong>${alert.title}</strong>
                        <p>${alert.message}</p>
                        <small class="text-muted">${new Date(alert.timestamp).toLocaleString()}</small>
                    </div>
                `).join('')}
            </div>
        `;
    }

    renderStartTestModal() {
        return `
            <div id="startTestModal" class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>Start New Test</h2>
                        <button class="close" onclick="dashboard.hideModal('startTestModal')">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="startTestForm">
                            <div class="form-group">
                                <label for="configurationSelect">Configuration</label>
                                <select id="configurationSelect" class="form-control" required>
                                    <option value="">Select a configuration...</option>
                                    ${this.configurations.map(config => `
                                        <option value="${config.id}">${config.name}</option>
                                    `).join('')}
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="testOptions">Test Options</label>
                                <textarea id="testOptions" class="form-control" rows="4" 
                                    placeholder="Enter test options as JSON (optional)"></textarea>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" onclick="dashboard.hideModal('startTestModal')">
                            Cancel
                        </button>
                        <button type="button" class="btn btn-primary" onclick="dashboard.startTest()">
                            Start Test
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    // API methods
    async loadConfigurations() {
        try {
            const response = await fetch('/api/configurations');
            if (response.ok) {
                this.configurations = await response.json();
            }
        } catch (error) {
            console.error('Failed to load configurations:', error);
        }
    }

    async loadVirtualUsers() {
        try {
            const response = await fetch('/api/users/virtual');
            if (response.ok) {
                this.virtualUsers = await response.json();
            }
        } catch (error) {
            console.error('Failed to load virtual users:', error);
        }
    }

    async loadMetrics() {
        try {
            const response = await fetch('/api/metrics');
            if (response.ok) {
                this.metrics = await response.json();
            }
        } catch (error) {
            console.error('Failed to load metrics:', error);
        }
    }

    async loadAlerts() {
        try {
            const response = await fetch('/api/alerts');
            if (response.ok) {
                this.alerts = await response.json();
            }
        } catch (error) {
            console.error('Failed to load alerts:', error);
        }
    }

    async startTest() {
        const configurationId = document.getElementById('configurationSelect').value;
        const optionsText = document.getElementById('testOptions').value;
        
        if (!configurationId) {
            this.showNotification('Please select a configuration', 'warning');
            return;
        }

        let options = {};
        if (optionsText.trim()) {
            try {
                options = JSON.parse(optionsText);
            } catch (error) {
                this.showNotification('Invalid JSON in test options', 'danger');
                return;
            }
        }

        try {
            const response = await fetch('/api/tests/start', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ configurationId, options })
            });

            if (response.ok) {
                const result = await response.json();
                this.hideModal('startTestModal');
                this.showNotification('Test started successfully', 'success');
                
                // Add to local sessions
                this.testSessions.set(result.sessionId, {
                    sessionId: result.sessionId,
                    configurationId,
                    status: 'starting',
                    startTime: new Date().toISOString()
                });
                
                this.updateTestSessionsDisplay();
            } else {
                const error = await response.json();
                this.showNotification(`Failed to start test: ${error.error}`, 'danger');
            }
        } catch (error) {
            console.error('Failed to start test:', error);
            this.showNotification('Failed to start test', 'danger');
        }
    }

    // Utility methods
    getActiveTestsCount() {
        return Array.from(this.testSessions.values()).filter(session => 
            session.status === 'running' || session.status === 'starting'
        ).length;
    }

    getActiveAlertsCount() {
        return this.alerts.filter(alert => !alert.acknowledged).length;
    }

    getStatusClass(status) {
        switch (status) {
            case 'running':
            case 'completed':
                return 'healthy';
            case 'starting':
                return 'warning';
            case 'failed':
            case 'error':
                return 'critical';
            default:
                return 'warning';
        }
    }

    updateUserInfo() {
        if (this.currentUser) {
            const userInfo = document.querySelector('.user-info');
            if (userInfo) {
                userInfo.innerHTML = `
                    <div class="user-avatar">${this.currentUser.username.charAt(0).toUpperCase()}</div>
                    <span>${this.currentUser.username}</span>
                    <span class="text-muted">(${this.currentUser.role})</span>
                `;
            }
        }
    }

    updateMetricsDisplay() {
        // Update metric cards if they exist
        const activeTestsEl = document.getElementById('activeTests');
        if (activeTestsEl) {
            activeTestsEl.textContent = this.getActiveTestsCount();
        }

        const totalConfigsEl = document.getElementById('totalConfigurations');
        if (totalConfigsEl) {
            totalConfigsEl.textContent = this.configurations.length;
        }

        const virtualUsersEl = document.getElementById('virtualUsers');
        if (virtualUsersEl) {
            virtualUsersEl.textContent = this.virtualUsers.length;
        }

        const activeAlertsEl = document.getElementById('activeAlerts');
        if (activeAlertsEl) {
            activeAlertsEl.textContent = this.getActiveAlertsCount();
        }
    }

    updateTestProgress(progress) {
        // Update progress bars and status displays
        console.log('Test progress update:', progress);
    }

    updateTestSessionsDisplay() {
        const recentSessionsEl = document.getElementById('recentTestSessions');
        if (recentSessionsEl) {
            recentSessionsEl.innerHTML = this.renderRecentTestSessions();
        }

        const testSessionsListEl = document.getElementById('testSessionsList');
        if (testSessionsListEl) {
            testSessionsListEl.innerHTML = this.renderTestSessionsList();
        }
    }

    updateAlertsDisplay() {
        const recentAlertsEl = document.getElementById('recentAlerts');
        if (recentAlertsEl) {
            recentAlertsEl.innerHTML = this.renderRecentAlerts();
        }

        const alertsListEl = document.getElementById('alertsList');
        if (alertsListEl) {
            alertsListEl.innerHTML = this.renderAlertsList();
        }
    }

    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('show');
            modal.style.display = 'flex';
        }
    }

    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('show');
            modal.style.display = 'none';
        }
    }

    hideAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('show');
            modal.style.display = 'none';
        });
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }

    startMetricsPolling() {
        setInterval(async () => {
            await this.loadMetrics();
            this.updateMetricsDisplay();
        }, 30000); // Update every 30 seconds
    }

    attachViewEventListeners() {
        // Attach event listeners specific to the current view
        // This method should be called after rendering new content
    }

    // Placeholder methods for missing functionality
    renderTestSessionsList() {
        return '<p class="text-muted">Test sessions list implementation needed</p>';
    }

    renderTestDetailsModal() {
        return '<div id="testDetailsModal" class="modal"><!-- Test details modal content --></div>';
    }

    renderConfigurationsList() {
        return '<p class="text-muted">Configurations list implementation needed</p>';
    }

    renderCreateConfigModal() {
        return '<div id="createConfigModal" class="modal"><!-- Create config modal content --></div>';
    }

    renderEditConfigModal() {
        return '<div id="editConfigModal" class="modal"><!-- Edit config modal content --></div>';
    }

    renderVirtualUsersList() {
        return '<p class="text-muted">Virtual users list implementation needed</p>';
    }

    renderCreateUserModal() {
        return '<div id="createUserModal" class="modal"><!-- Create user modal content --></div>';
    }

    renderResourceUsage() {
        return '<p class="text-muted">Resource usage display implementation needed</p>';
    }

    renderAlertsList() {
        return '<p class="text-muted">Alerts list implementation needed</p>';
    }

    renderReportsList() {
        return '<p class="text-muted">Reports list implementation needed</p>';
    }

    renderGenerateReportModal() {
        return '<div id="generateReportModal" class="modal"><!-- Generate report modal content --></div>';
    }

    renderSystemConfig() {
        return '<p class="text-muted">System configuration display implementation needed</p>';
    }

    refreshTestSessions() {
        // Refresh test sessions data
        this.updateTestSessionsDisplay();
    }

    refreshMetrics() {
        this.loadMetrics();
    }

    viewTestDetails(sessionId) {
        // Show test details modal
        console.log('View test details for session:', sessionId);
    }

    logout() {
        fetch('/api/auth/logout', { method: 'POST' })
            .then(() => {
                localStorage.removeItem('sessionId');
                window.location.reload();
            })
            .catch(error => {
                console.error('Logout failed:', error);
                localStorage.removeItem('sessionId');
                window.location.reload();
            });
    }
}

// Initialize the dashboard when the page loads
let dashboard;
document.addEventListener('DOMContentLoaded', () => {
    dashboard = new TestingAgentDashboard();
});