import { TestConfigurationManager, TestConfiguration, TestSuiteConfig, UserProfile, ConfigurationTemplate } from '../TestConfigurationManager';

export interface ConfigurationUIOptions {
  containerId: string;
  theme: 'light' | 'dark';
  showAdvancedOptions: boolean;
  enableTemplates: boolean;
}

export class ConfigurationUI {
  private manager: TestConfigurationManager;
  private options: ConfigurationUIOptions;
  private container: HTMLElement | null = null;
  private currentConfig: Partial<TestConfiguration> = {};
  private availableTestSuites: TestSuiteConfig[] = [];

  constructor(manager: TestConfigurationManager, options: ConfigurationUIOptions) {
    this.manager = manager;
    this.options = options;
    this.availableTestSuites = manager.getAvailableTestSuites();
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.manager.on('configurationCreated', (config) => {
      this.showNotification('Configuration created successfully', 'success');
      this.refreshConfigurationList();
    });

    this.manager.on('configurationUpdated', (config) => {
      this.showNotification('Configuration updated successfully', 'success');
      this.refreshConfigurationList();
    });

    this.manager.on('configurationDeleted', (config) => {
      this.showNotification('Configuration deleted successfully', 'info');
      this.refreshConfigurationList();
    });
  }

  public render(): void {
    this.container = document.getElementById(this.options.containerId);
    if (!this.container) {
      throw new Error(`Container with id '${this.options.containerId}' not found`);
    }

    this.container.innerHTML = this.generateMainHTML();
    this.applyStyles();
    this.attachEventHandlers();
    this.refreshConfigurationList();
  }

  private generateMainHTML(): string {
    return `
      <div class="config-ui ${this.options.theme}">
        <header class="config-header">
          <h1>🧪 Test Configuration Manager</h1>
          <div class="header-actions">
            <button id="new-config-btn" class="btn btn-primary">
              <span class="icon">➕</span> New Configuration
            </button>
            ${this.options.enableTemplates ? `
              <button id="templates-btn" class="btn btn-secondary">
                <span class="icon">📋</span> Templates
              </button>
            ` : ''}
            <button id="import-btn" class="btn btn-secondary">
              <span class="icon">📥</span> Import
            </button>
          </div>
        </header>

        <div class="config-content">
          <aside class="config-sidebar">
            <div class="sidebar-section">
              <h3>Configurations</h3>
              <div class="search-box">
                <input type="text" id="config-search" placeholder="Search configurations..." />
              </div>
              <div id="config-list" class="config-list">
                <!-- Configuration list will be populated here -->
              </div>
            </div>
          </aside>

          <main class="config-main">
            <div id="config-editor" class="config-editor">
              <div class="welcome-message">
                <h2>Welcome to Test Configuration Manager</h2>
                <p>Select a configuration from the sidebar to edit, or create a new one.</p>
              </div>
            </div>
          </main>
        </div>

        <!-- Modals -->
        <div id="template-modal" class="modal" style="display: none;">
          <div class="modal-content">
            <div class="modal-header">
              <h2>Configuration Templates</h2>
              <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body" id="template-list">
              <!-- Templates will be populated here -->
            </div>
          </div>
        </div>

        <div id="import-modal" class="modal" style="display: none;">
          <div class="modal-content">
            <div class="modal-header">
              <h2>Import Configuration</h2>
              <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
              <div class="form-group">
                <label for="import-format">Format:</label>
                <select id="import-format">
                  <option value="json">JSON</option>
                  <option value="yaml" disabled>YAML (Coming Soon)</option>
                </select>
              </div>
              <div class="form-group">
                <label for="import-data">Configuration Data:</label>
                <textarea id="import-data" rows="10" placeholder="Paste your configuration data here..."></textarea>
              </div>
              <div class="modal-actions">
                <button id="import-confirm-btn" class="btn btn-primary">Import</button>
                <button class="modal-close btn btn-secondary">Cancel</button>
              </div>
            </div>
          </div>
        </div>

        <div id="notification-container" class="notification-container"></div>
      </div>
    `;
  }  privat
e generateConfigurationEditor(config?: TestConfiguration): string {
    const isEditing = !!config;
    const currentConfig = config || this.getDefaultConfiguration();

    return `
      <div class="config-form">
        <div class="form-header">
          <h2>${isEditing ? 'Edit' : 'New'} Configuration</h2>
          <div class="form-actions">
            <button id="save-config-btn" class="btn btn-primary">
              <span class="icon">💾</span> Save
            </button>
            ${isEditing ? `
              <button id="clone-config-btn" class="btn btn-secondary">
                <span class="icon">📋</span> Clone
              </button>
              <button id="export-config-btn" class="btn btn-secondary">
                <span class="icon">📤</span> Export
              </button>
              <button id="delete-config-btn" class="btn btn-danger">
                <span class="icon">🗑️</span> Delete
              </button>
            ` : ''}
          </div>
        </div>

        <div class="form-content">
          <div class="form-tabs">
            <button class="tab-btn active" data-tab="basic">Basic Settings</button>
            <button class="tab-btn" data-tab="test-suites">Test Suites</button>
            <button class="tab-btn" data-tab="user-profiles">User Profiles</button>
            <button class="tab-btn" data-tab="reporting">Reporting</button>
            <button class="tab-btn" data-tab="notifications">Notifications</button>
            ${this.options.showAdvancedOptions ? '<button class="tab-btn" data-tab="advanced">Advanced</button>' : ''}
          </div>

          <div class="tab-content">
            <div id="basic-tab" class="tab-panel active">
              ${this.generateBasicSettingsTab(currentConfig)}
            </div>
            <div id="test-suites-tab" class="tab-panel">
              ${this.generateTestSuitesTab(currentConfig)}
            </div>
            <div id="user-profiles-tab" class="tab-panel">
              ${this.generateUserProfilesTab(currentConfig)}
            </div>
            <div id="reporting-tab" class="tab-panel">
              ${this.generateReportingTab(currentConfig)}
            </div>
            <div id="notifications-tab" class="tab-panel">
              ${this.generateNotificationsTab(currentConfig)}
            </div>
            ${this.options.showAdvancedOptions ? `
              <div id="advanced-tab" class="tab-panel">
                ${this.generateAdvancedTab(currentConfig)}
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }

  private generateBasicSettingsTab(config: TestConfiguration): string {
    return `
      <div class="form-section">
        <h3>Basic Information</h3>
        <div class="form-row">
          <div class="form-group">
            <label for="config-name">Name *</label>
            <input type="text" id="config-name" value="${config.name || ''}" required />
          </div>
          <div class="form-group">
            <label for="config-environment">Environment *</label>
            <select id="config-environment" required>
              <option value="development" ${config.environment === 'development' ? 'selected' : ''}>Development</option>
              <option value="staging" ${config.environment === 'staging' ? 'selected' : ''}>Staging</option>
              <option value="production" ${config.environment === 'production' ? 'selected' : ''}>Production</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label for="config-description">Description</label>
          <textarea id="config-description" rows="3">${config.description || ''}</textarea>
        </div>
        <div class="form-group">
          <label for="config-tags">Tags (comma-separated)</label>
          <input type="text" id="config-tags" value="${config.tags?.join(', ') || ''}" placeholder="e.g., smoke, regression, nightly" />
        </div>
      </div>

      <div class="form-section">
        <h3>Execution Settings</h3>
        <div class="form-row">
          <div class="form-group">
            <label for="config-concurrency">Concurrency Level</label>
            <input type="number" id="config-concurrency" value="${config.concurrencyLevel || 10}" min="1" max="1000" />
            <small>Number of concurrent virtual users</small>
          </div>
          <div class="form-group">
            <label for="config-timeout">Timeout (minutes)</label>
            <input type="number" id="config-timeout" value="${(config.timeout || 600000) / 60000}" min="1" max="180" />
            <small>Maximum execution time</small>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="config-retries">Retry Attempts</label>
            <input type="number" id="config-retries" value="${config.retryAttempts || 1}" min="0" max="5" />
            <small>Number of retry attempts for failed tests</small>
          </div>
          <div class="form-group">
            <label>
              <input type="checkbox" id="config-autofix" ${config.autoFixEnabled ? 'checked' : ''} />
              Enable Auto-Fix
            </label>
            <small>Automatically attempt to fix detected issues</small>
          </div>
        </div>
      </div>
    `;
  }

  private generateTestSuitesTab(config: TestConfiguration): string {
    const selectedSuites = config.testSuites || [];
    const selectedIds = new Set(selectedSuites.map(s => s.id));

    return `
      <div class="form-section">
        <div class="section-header">
          <h3>Test Suites</h3>
          <button id="select-all-suites" class="btn btn-sm btn-secondary">Select All</button>
        </div>
        <div class="test-suites-grid">
          ${this.availableTestSuites.map(suite => {
            const selected = selectedIds.has(suite.id);
            const selectedConfig = selectedSuites.find(s => s.id === suite.id);
            
            return `
              <div class="test-suite-card ${selected ? 'selected' : ''}">
                <div class="suite-header">
                  <label class="suite-checkbox">
                    <input type="checkbox" data-suite-id="${suite.id}" ${selected ? 'checked' : ''} />
                    <span class="suite-name">${suite.name}</span>
                  </label>
                  <div class="suite-priority">
                    <label>Priority:</label>
                    <input type="number" class="priority-input" data-suite-id="${suite.id}" 
                           value="${selectedConfig?.priority || suite.priority}" min="1" max="100" />
                  </div>
                </div>
                <div class="suite-dependencies">
                  <small>Dependencies: ${suite.dependencies.length > 0 ? suite.dependencies.join(', ') : 'None'}</small>
                </div>
                <div class="suite-parameters" ${selected ? '' : 'style="display: none;"'}>
                  <h4>Parameters</h4>
                  <div class="parameters-container" data-suite-id="${suite.id}">
                    ${this.generateParametersEditor(selectedConfig?.parameters || {})}
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  private generateParametersEditor(parameters: Record<string, any>): string {
    const entries = Object.entries(parameters);
    
    return `
      <div class="parameters-list">
        ${entries.map(([key, value]) => `
          <div class="parameter-row">
            <input type="text" class="param-key" value="${key}" placeholder="Parameter name" />
            <input type="text" class="param-value" value="${value}" placeholder="Parameter value" />
            <button class="remove-param-btn" type="button">×</button>
          </div>
        `).join('')}
        <button class="add-param-btn btn btn-sm btn-secondary" type="button">+ Add Parameter</button>
      </div>
    `;
  }

  private generateUserProfilesTab(config: TestConfiguration): string {
    const profiles = config.userProfiles || [];
    
    return `
      <div class="form-section">
        <div class="section-header">
          <h3>User Profiles</h3>
          <button id="add-profile-btn" class="btn btn-sm btn-primary">+ Add Profile</button>
        </div>
        <div id="user-profiles-container">
          ${profiles.map((profile, index) => this.generateUserProfileEditor(profile, index)).join('')}
        </div>
        ${profiles.length === 0 ? '<p class="empty-state">No user profiles configured. Add a profile to simulate user behavior.</p>' : ''}
      </div>
    `;
  }

  private generateUserProfileEditor(profile: UserProfile, index: number): string {
    return `
      <div class="user-profile-card" data-profile-index="${index}">
        <div class="profile-header">
          <h4>Profile ${index + 1}: ${profile.name}</h4>
          <div class="profile-actions">
            <button class="btn btn-sm btn-secondary clone-profile-btn">Clone</button>
            <button class="btn btn-sm btn-danger remove-profile-btn">Remove</button>
          </div>
        </div>
        <div class="profile-content">
          <div class="form-row">
            <div class="form-group">
              <label>Profile Name</label>
              <input type="text" class="profile-name" value="${profile.name}" />
            </div>
            <div class="form-group">
              <label>Role</label>
              <select class="profile-role">
                <option value="passenger" ${profile.role === 'passenger' ? 'selected' : ''}>Passenger</option>
                <option value="driver" ${profile.role === 'driver' ? 'selected' : ''}>Driver</option>
                <option value="operator" ${profile.role === 'operator' ? 'selected' : ''}>Operator</option>
                <option value="admin" ${profile.role === 'admin' ? 'selected' : ''}>Admin</option>
              </select>
            </div>
            <div class="form-group">
              <label>Weight (%)</label>
              <input type="number" class="profile-weight" value="${profile.weight}" min="0" max="100" />
            </div>
          </div>
          
          <div class="profile-sections">
            <div class="profile-section">
              <h5>Demographics</h5>
              <div class="form-row">
                <div class="form-group">
                  <label>Age</label>
                  <input type="number" class="demo-age" value="${profile.demographics.age}" min="18" max="100" />
                </div>
                <div class="form-group">
                  <label>Location</label>
                  <input type="text" class="demo-location" value="${profile.demographics.location}" />
                </div>
                <div class="form-group">
                  <label>Device Type</label>
                  <select class="demo-device">
                    <option value="mobile" ${profile.demographics.deviceType === 'mobile' ? 'selected' : ''}>Mobile</option>
                    <option value="desktop" ${profile.demographics.deviceType === 'desktop' ? 'selected' : ''}>Desktop</option>
                    <option value="tablet" ${profile.demographics.deviceType === 'tablet' ? 'selected' : ''}>Tablet</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Experience</label>
                  <select class="demo-experience">
                    <option value="new" ${profile.demographics.experience === 'new' ? 'selected' : ''}>New</option>
                    <option value="regular" ${profile.demographics.experience === 'regular' ? 'selected' : ''}>Regular</option>
                    <option value="power" ${profile.demographics.experience === 'power' ? 'selected' : ''}>Power User</option>
                  </select>
                </div>
              </div>
            </div>

            <div class="profile-section">
              <h5>Preferences</h5>
              <div class="form-row">
                <div class="form-group">
                  <label>Payment Method</label>
                  <select class="pref-payment">
                    <option value="credit_card" ${profile.preferences.paymentMethod === 'credit_card' ? 'selected' : ''}>Credit Card</option>
                    <option value="debit_card" ${profile.preferences.paymentMethod === 'debit_card' ? 'selected' : ''}>Debit Card</option>
                    <option value="paypal" ${profile.preferences.paymentMethod === 'paypal' ? 'selected' : ''}>PayPal</option>
                    <option value="cash" ${profile.preferences.paymentMethod === 'cash' ? 'selected' : ''}>Cash</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Language</label>
                  <select class="pref-language">
                    <option value="en" ${profile.preferences.language === 'en' ? 'selected' : ''}>English</option>
                    <option value="es" ${profile.preferences.language === 'es' ? 'selected' : ''}>Spanish</option>
                    <option value="fr" ${profile.preferences.language === 'fr' ? 'selected' : ''}>French</option>
                  </select>
                </div>
              </div>
            </div>

            <div class="profile-section">
              <h5>Behavior Patterns</h5>
              <div class="form-row">
                <div class="form-group">
                  <label>Booking Frequency (per week)</label>
                  <input type="number" class="behavior-frequency" value="${profile.behaviorPatterns.bookingFrequency}" min="0" max="50" />
                </div>
                <div class="form-group">
                  <label>Average Ride Distance (km)</label>
                  <input type="number" class="behavior-distance" value="${profile.behaviorPatterns.averageRideDistance}" min="1" max="100" />
                </div>
                <div class="form-group">
                  <label>Cancellation Rate (%)</label>
                  <input type="number" class="behavior-cancellation" value="${profile.behaviorPatterns.cancellationRate * 100}" min="0" max="50" step="0.1" />
                </div>
              </div>
              <div class="form-group">
                <label>Preferred Times (comma-separated, 24h format)</label>
                <input type="text" class="behavior-times" value="${profile.behaviorPatterns.preferredTimes.join(', ')}" placeholder="e.g., 09:00, 17:30, 20:00" />
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }  pr
ivate generateReportingTab(config: TestConfiguration): string {
    const reporting = config.reportingOptions || {};
    
    return `
      <div class="form-section">
        <h3>Report Content</h3>
        <div class="checkbox-group">
          <label>
            <input type="checkbox" id="report-executive" ${reporting.includeExecutiveSummary !== false ? 'checked' : ''} />
            Executive Summary
          </label>
          <label>
            <input type="checkbox" id="report-technical" ${reporting.includeTechnicalDetails !== false ? 'checked' : ''} />
            Technical Details
          </label>
          <label>
            <input type="checkbox" id="report-trends" ${reporting.includeTrendAnalysis ? 'checked' : ''} />
            Trend Analysis
          </label>
          <label>
            <input type="checkbox" id="report-recommendations" ${reporting.includeRecommendations !== false ? 'checked' : ''} />
            Recommendations
          </label>
        </div>
      </div>

      <div class="form-section">
        <h3>Output Formats</h3>
        <div class="checkbox-group">
          <label>
            <input type="checkbox" id="format-json" ${!reporting.formats || reporting.formats.includes('json') ? 'checked' : ''} />
            JSON
          </label>
          <label>
            <input type="checkbox" id="format-html" ${!reporting.formats || reporting.formats.includes('html') ? 'checked' : ''} />
            HTML
          </label>
          <label>
            <input type="checkbox" id="format-pdf" ${reporting.formats?.includes('pdf') ? 'checked' : ''} />
            PDF
          </label>
        </div>
      </div>

      <div class="form-section">
        <h3>Distribution</h3>
        <div class="form-group">
          <label for="report-output-path">Output Path</label>
          <input type="text" id="report-output-path" value="${reporting.outputPath || ''}" placeholder="./reports" />
        </div>
        <div class="form-group">
          <label for="report-email-recipients">Email Recipients (comma-separated)</label>
          <input type="text" id="report-email-recipients" value="${reporting.emailRecipients?.join(', ') || ''}" placeholder="user@example.com, team@example.com" />
        </div>
        <div class="form-group">
          <label for="report-slack-webhook">Slack Webhook URL</label>
          <input type="url" id="report-slack-webhook" value="${reporting.slackWebhook || ''}" placeholder="https://hooks.slack.com/..." />
        </div>
      </div>
    `;
  }

  private generateNotificationsTab(config: TestConfiguration): string {
    const notifications = config.notificationSettings || {};
    
    return `
      <div class="form-section">
        <h3>Notification Events</h3>
        <div class="checkbox-group">
          <label>
            <input type="checkbox" id="notify-start" ${notifications.onTestStart ? 'checked' : ''} />
            Test Start
          </label>
          <label>
            <input type="checkbox" id="notify-complete" ${notifications.onTestComplete !== false ? 'checked' : ''} />
            Test Complete
          </label>
          <label>
            <input type="checkbox" id="notify-failure" ${notifications.onTestFailure !== false ? 'checked' : ''} />
            Test Failure
          </label>
          <label>
            <input type="checkbox" id="notify-critical" ${notifications.onCriticalError !== false ? 'checked' : ''} />
            Critical Error
          </label>
        </div>
      </div>

      <div class="form-section">
        <h3>Notification Channels</h3>
        <div class="checkbox-group">
          <label>
            <input type="checkbox" id="channel-email" ${!notifications.channels || notifications.channels.includes('email') ? 'checked' : ''} />
            Email
          </label>
          <label>
            <input type="checkbox" id="channel-slack" ${notifications.channels?.includes('slack') ? 'checked' : ''} />
            Slack
          </label>
          <label>
            <input type="checkbox" id="channel-webhook" ${notifications.channels?.includes('webhook') ? 'checked' : ''} />
            Webhook
          </label>
        </div>
      </div>

      <div class="form-section">
        <h3>Channel Configuration</h3>
        <div class="form-group">
          <label for="notify-email-recipients">Email Recipients (comma-separated)</label>
          <input type="text" id="notify-email-recipients" value="${notifications.emailRecipients?.join(', ') || ''}" placeholder="user@example.com, team@example.com" />
        </div>
        <div class="form-group">
          <label for="notify-slack-channel">Slack Channel</label>
          <input type="text" id="notify-slack-channel" value="${notifications.slackChannel || ''}" placeholder="#testing" />
        </div>
        <div class="form-group">
          <label for="notify-webhook-url">Webhook URL</label>
          <input type="url" id="notify-webhook-url" value="${notifications.webhookUrl || ''}" placeholder="https://your-webhook-url.com" />
        </div>
      </div>
    `;
  }

  private generateAdvancedTab(config: TestConfiguration): string {
    return `
      <div class="form-section">
        <h3>Advanced Settings</h3>
        <div class="form-group">
          <label for="config-created-by">Created By</label>
          <input type="text" id="config-created-by" value="${config.createdBy || ''}" placeholder="Username or email" />
        </div>
        <div class="form-group">
          <label>Configuration JSON</label>
          <textarea id="config-json" rows="20" class="json-editor">${JSON.stringify(config, null, 2)}</textarea>
          <small>Advanced users can edit the raw JSON configuration</small>
        </div>
      </div>
    `;
  }

  private attachEventHandlers(): void {
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const tabId = target.dataset.tab;
        this.switchTab(tabId!);
      });
    });

    // Main action buttons
    document.getElementById('new-config-btn')?.addEventListener('click', () => {
      this.showConfigurationEditor();
    });

    document.getElementById('templates-btn')?.addEventListener('click', () => {
      this.showTemplatesModal();
    });

    document.getElementById('import-btn')?.addEventListener('click', () => {
      this.showImportModal();
    });

    // Configuration list search
    document.getElementById('config-search')?.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement;
      this.filterConfigurations(target.value);
    });

    // Modal close handlers
    document.querySelectorAll('.modal-close').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const modal = (e.target as HTMLElement).closest('.modal') as HTMLElement;
        modal.style.display = 'none';
      });
    });

    // Import confirmation
    document.getElementById('import-confirm-btn')?.addEventListener('click', () => {
      this.handleImport();
    });
  }

  private switchTab(tabId: string): void {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabId}"]`)?.classList.add('active');

    // Update tab panels
    document.querySelectorAll('.tab-panel').forEach(panel => {
      panel.classList.remove('active');
    });
    document.getElementById(`${tabId}-tab`)?.classList.add('active');
  }

  private showConfigurationEditor(config?: TestConfiguration): void {
    const editor = document.getElementById('config-editor');
    if (!editor) return;

    editor.innerHTML = this.generateConfigurationEditor(config);
    this.currentConfig = config ? { ...config } : {};
    
    // Attach editor-specific event handlers
    this.attachEditorEventHandlers();
  }

  private attachEditorEventHandlers(): void {
    // Save button
    document.getElementById('save-config-btn')?.addEventListener('click', () => {
      this.saveConfiguration();
    });

    // Clone button
    document.getElementById('clone-config-btn')?.addEventListener('click', () => {
      this.cloneConfiguration();
    });

    // Export button
    document.getElementById('export-config-btn')?.addEventListener('click', () => {
      this.exportConfiguration();
    });

    // Delete button
    document.getElementById('delete-config-btn')?.addEventListener('click', () => {
      this.deleteConfiguration();
    });

    // Test suite selection
    document.querySelectorAll('[data-suite-id]').forEach(checkbox => {
      if (checkbox instanceof HTMLInputElement && checkbox.type === 'checkbox') {
        checkbox.addEventListener('change', (e) => {
          const target = e.target as HTMLInputElement;
          const suiteId = target.dataset.suiteId!;
          this.toggleTestSuite(suiteId, target.checked);
        });
      }
    });

    // Select all suites
    document.getElementById('select-all-suites')?.addEventListener('click', () => {
      this.selectAllTestSuites();
    });

    // Add user profile
    document.getElementById('add-profile-btn')?.addEventListener('click', () => {
      this.addUserProfile();
    });

    // Parameter management
    document.querySelectorAll('.add-param-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const container = target.closest('.parameters-container');
        this.addParameter(container!);
      });
    });
  }

  private getDefaultConfiguration(): TestConfiguration {
    return {
      id: '',
      name: '',
      environment: 'development',
      testSuites: [],
      userProfiles: [],
      concurrencyLevel: 10,
      timeout: 600000,
      retryAttempts: 1,
      reportingOptions: {
        includeExecutiveSummary: true,
        includeTechnicalDetails: true,
        includeTrendAnalysis: false,
        includeRecommendations: true,
        formats: ['json', 'html']
      },
      autoFixEnabled: false,
      notificationSettings: {
        onTestStart: false,
        onTestComplete: true,
        onTestFailure: true,
        onCriticalError: true,
        channels: ['email']
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  private saveConfiguration(): void {
    try {
      const configData = this.collectFormData();
      const validation = this.manager.validateConfiguration(configData);
      
      if (!validation.isValid) {
        this.showValidationErrors(validation.errors);
        return;
      }

      if (validation.warnings.length > 0) {
        this.showValidationWarnings(validation.warnings);
      }

      if (configData.id && this.manager.getConfiguration(configData.id)) {
        this.manager.updateConfiguration(configData.id, configData);
      } else {
        this.manager.createConfiguration(configData);
      }
    } catch (error) {
      this.showNotification(`Failed to save configuration: ${error}`, 'error');
    }
  }

  private collectFormData(): TestConfiguration {
    // This would collect all form data and return a complete configuration
    // Implementation would be quite extensive, so showing the structure
    const formData: TestConfiguration = {
      ...this.currentConfig,
      id: this.currentConfig.id || '',
      name: (document.getElementById('config-name') as HTMLInputElement)?.value || '',
      description: (document.getElementById('config-description') as HTMLTextAreaElement)?.value,
      environment: (document.getElementById('config-environment') as HTMLSelectElement)?.value as any,
      concurrencyLevel: parseInt((document.getElementById('config-concurrency') as HTMLInputElement)?.value || '10'),
      timeout: parseInt((document.getElementById('config-timeout') as HTMLInputElement)?.value || '10') * 60000,
      retryAttempts: parseInt((document.getElementById('config-retries') as HTMLInputElement)?.value || '1'),
      autoFixEnabled: (document.getElementById('config-autofix') as HTMLInputElement)?.checked || false,
      tags: (document.getElementById('config-tags') as HTMLInputElement)?.value.split(',').map(t => t.trim()).filter(t => t),
      testSuites: this.collectTestSuites(),
      userProfiles: this.collectUserProfiles(),
      reportingOptions: this.collectReportingOptions(),
      notificationSettings: this.collectNotificationSettings(),
      createdAt: this.currentConfig.createdAt || new Date(),
      updatedAt: new Date()
    };

    return formData;
  }

  private collectTestSuites(): TestSuiteConfig[] {
    const suites: TestSuiteConfig[] = [];
    document.querySelectorAll('[data-suite-id]').forEach(element => {
      if (element instanceof HTMLInputElement && element.type === 'checkbox' && element.checked) {
        const suiteId = element.dataset.suiteId!;
        const priorityInput = document.querySelector(`[data-suite-id="${suiteId}"].priority-input`) as HTMLInputElement;
        const parametersContainer = document.querySelector(`[data-suite-id="${suiteId}"].parameters-container`);
        
        const suite = this.availableTestSuites.find(s => s.id === suiteId);
        if (suite) {
          suites.push({
            ...suite,
            priority: parseInt(priorityInput?.value || '1'),
            parameters: this.collectParameters(parametersContainer!)
          });
        }
      }
    });
    return suites;
  }

  private collectUserProfiles(): UserProfile[] {
    const profiles: UserProfile[] = [];
    document.querySelectorAll('.user-profile-card').forEach((card, index) => {
      const profile: UserProfile = {
        id: `profile-${index}`,
        name: (card.querySelector('.profile-name') as HTMLInputElement)?.value || `Profile ${index + 1}`,
        role: (card.querySelector('.profile-role') as HTMLSelectElement)?.value as any,
        weight: parseInt((card.querySelector('.profile-weight') as HTMLInputElement)?.value || '0'),
        demographics: {
          age: parseInt((card.querySelector('.demo-age') as HTMLInputElement)?.value || '30'),
          location: (card.querySelector('.demo-location') as HTMLInputElement)?.value || '',
          deviceType: (card.querySelector('.demo-device') as HTMLSelectElement)?.value as any,
          experience: (card.querySelector('.demo-experience') as HTMLSelectElement)?.value as any
        },
        preferences: {
          paymentMethod: (card.querySelector('.pref-payment') as HTMLSelectElement)?.value || '',
          language: (card.querySelector('.pref-language') as HTMLSelectElement)?.value || 'en',
          notificationSettings: {}
        },
        behaviorPatterns: {
          bookingFrequency: parseInt((card.querySelector('.behavior-frequency') as HTMLInputElement)?.value || '5'),
          averageRideDistance: parseInt((card.querySelector('.behavior-distance') as HTMLInputElement)?.value || '10'),
          cancellationRate: parseFloat((card.querySelector('.behavior-cancellation') as HTMLInputElement)?.value || '5') / 100,
          preferredTimes: (card.querySelector('.behavior-times') as HTMLInputElement)?.value.split(',').map(t => t.trim()).filter(t => t) || []
        }
      };
      profiles.push(profile);
    });
    return profiles;
  }

  private collectReportingOptions(): ReportingOptions {
    return {
      includeExecutiveSummary: (document.getElementById('report-executive') as HTMLInputElement)?.checked || false,
      includeTechnicalDetails: (document.getElementById('report-technical') as HTMLInputElement)?.checked || false,
      includeTrendAnalysis: (document.getElementById('report-trends') as HTMLInputElement)?.checked || false,
      includeRecommendations: (document.getElementById('report-recommendations') as HTMLInputElement)?.checked || false,
      formats: this.collectSelectedFormats(),
      outputPath: (document.getElementById('report-output-path') as HTMLInputElement)?.value,
      emailRecipients: (document.getElementById('report-email-recipients') as HTMLInputElement)?.value.split(',').map(e => e.trim()).filter(e => e),
      slackWebhook: (document.getElementById('report-slack-webhook') as HTMLInputElement)?.value
    };
  }

  private collectSelectedFormats(): ('json' | 'html' | 'pdf')[] {
    const formats: ('json' | 'html' | 'pdf')[] = [];
    if ((document.getElementById('format-json') as HTMLInputElement)?.checked) formats.push('json');
    if ((document.getElementById('format-html') as HTMLInputElement)?.checked) formats.push('html');
    if ((document.getElementById('format-pdf') as HTMLInputElement)?.checked) formats.push('pdf');
    return formats;
  }

  private collectNotificationSettings(): NotificationSettings {
    return {
      onTestStart: (document.getElementById('notify-start') as HTMLInputElement)?.checked || false,
      onTestComplete: (document.getElementById('notify-complete') as HTMLInputElement)?.checked || false,
      onTestFailure: (document.getElementById('notify-failure') as HTMLInputElement)?.checked || false,
      onCriticalError: (document.getElementById('notify-critical') as HTMLInputElement)?.checked || false,
      channels: this.collectNotificationChannels(),
      emailRecipients: (document.getElementById('notify-email-recipients') as HTMLInputElement)?.value.split(',').map(e => e.trim()).filter(e => e),
      slackChannel: (document.getElementById('notify-slack-channel') as HTMLInputElement)?.value,
      webhookUrl: (document.getElementById('notify-webhook-url') as HTMLInputElement)?.value
    };
  }

  private collectNotificationChannels(): ('email' | 'slack' | 'webhook')[] {
    const channels: ('email' | 'slack' | 'webhook')[] = [];
    if ((document.getElementById('channel-email') as HTMLInputElement)?.checked) channels.push('email');
    if ((document.getElementById('channel-slack') as HTMLInputElement)?.checked) channels.push('slack');
    if ((document.getElementById('channel-webhook') as HTMLInputElement)?.checked) channels.push('webhook');
    return channels;
  }

  private collectParameters(container: Element): Record<string, any> {
    const parameters: Record<string, any> = {};
    container.querySelectorAll('.parameter-row').forEach(row => {
      const keyInput = row.querySelector('.param-key') as HTMLInputElement;
      const valueInput = row.querySelector('.param-value') as HTMLInputElement;
      if (keyInput?.value && valueInput?.value) {
        parameters[keyInput.value] = valueInput.value;
      }
    });
    return parameters;
  }  pr
ivate refreshConfigurationList(): void {
    const configList = document.getElementById('config-list');
    if (!configList) return;

    const configurations = this.manager.getAllConfigurations();
    
    if (configurations.length === 0) {
      configList.innerHTML = '<p class="empty-state">No configurations found. Create your first configuration to get started.</p>';
      return;
    }

    configList.innerHTML = configurations.map(config => `
      <div class="config-item" data-config-id="${config.id}">
        <div class="config-item-header">
          <h4>${config.name}</h4>
          <span class="config-environment ${config.environment}">${config.environment}</span>
        </div>
        <div class="config-item-details">
          <p>${config.description || 'No description'}</p>
          <div class="config-meta">
            <span class="config-suites">${config.testSuites.length} suites</span>
            <span class="config-profiles">${config.userProfiles.length} profiles</span>
            <span class="config-updated">Updated ${this.formatRelativeTime(config.updatedAt)}</span>
          </div>
          ${config.tags && config.tags.length > 0 ? `
            <div class="config-tags">
              ${config.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
            </div>
          ` : ''}
        </div>
        <div class="config-item-actions">
          <button class="btn btn-sm btn-primary edit-config-btn" data-config-id="${config.id}">Edit</button>
          <button class="btn btn-sm btn-secondary clone-config-btn" data-config-id="${config.id}">Clone</button>
        </div>
      </div>
    `).join('');

    // Attach event handlers for config items
    configList.querySelectorAll('.edit-config-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const configId = (e.target as HTMLElement).dataset.configId!;
        const config = this.manager.getConfiguration(configId);
        if (config) {
          this.showConfigurationEditor(config);
        }
      });
    });

    configList.querySelectorAll('.clone-config-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const configId = (e.target as HTMLElement).dataset.configId!;
        this.cloneConfigurationById(configId);
      });
    });
  }

  private filterConfigurations(searchTerm: string): void {
    const configItems = document.querySelectorAll('.config-item');
    const term = searchTerm.toLowerCase();

    configItems.forEach(item => {
      const element = item as HTMLElement;
      const name = element.querySelector('h4')?.textContent?.toLowerCase() || '';
      const description = element.querySelector('p')?.textContent?.toLowerCase() || '';
      const tags = Array.from(element.querySelectorAll('.tag')).map(tag => tag.textContent?.toLowerCase() || '').join(' ');
      
      const matches = name.includes(term) || description.includes(term) || tags.includes(term);
      element.style.display = matches ? 'block' : 'none';
    });
  }

  private showTemplatesModal(): void {
    const modal = document.getElementById('template-modal');
    const templateList = document.getElementById('template-list');
    if (!modal || !templateList) return;

    const templates = this.manager.getTemplates();
    
    templateList.innerHTML = templates.map(template => `
      <div class="template-card">
        <div class="template-header">
          <h3>${template.name}</h3>
          <span class="template-category ${template.category}">${template.category}</span>
        </div>
        <p class="template-description">${template.description}</p>
        <div class="template-actions">
          <button class="btn btn-primary use-template-btn" data-template-id="${template.id}">Use Template</button>
        </div>
      </div>
    `).join('');

    // Attach event handlers
    templateList.querySelectorAll('.use-template-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const templateId = (e.target as HTMLElement).dataset.templateId!;
        this.createFromTemplate(templateId);
        modal.style.display = 'none';
      });
    });

    modal.style.display = 'block';
  }

  private showImportModal(): void {
    const modal = document.getElementById('import-modal');
    if (!modal) return;

    // Clear previous data
    const dataTextarea = document.getElementById('import-data') as HTMLTextAreaElement;
    if (dataTextarea) {
      dataTextarea.value = '';
    }

    modal.style.display = 'block';
  }

  private handleImport(): void {
    const formatSelect = document.getElementById('import-format') as HTMLSelectElement;
    const dataTextarea = document.getElementById('import-data') as HTMLTextAreaElement;
    const modal = document.getElementById('import-modal');

    if (!formatSelect || !dataTextarea || !modal) return;

    try {
      const configId = this.manager.importConfiguration(dataTextarea.value, formatSelect.value as any);
      this.showNotification('Configuration imported successfully', 'success');
      modal.style.display = 'none';
      
      // Show the imported configuration
      const config = this.manager.getConfiguration(configId);
      if (config) {
        this.showConfigurationEditor(config);
      }
    } catch (error) {
      this.showNotification(`Import failed: ${error}`, 'error');
    }
  }

  private createFromTemplate(templateId: string): void {
    try {
      const configId = this.manager.createFromTemplate(templateId);
      const config = this.manager.getConfiguration(configId);
      if (config) {
        this.showConfigurationEditor(config);
      }
    } catch (error) {
      this.showNotification(`Failed to create from template: ${error}`, 'error');
    }
  }

  private cloneConfiguration(): void {
    if (!this.currentConfig.id) return;
    this.cloneConfigurationById(this.currentConfig.id);
  }

  private cloneConfigurationById(configId: string): void {
    try {
      const newConfigId = this.manager.cloneConfiguration(configId);
      const newConfig = this.manager.getConfiguration(newConfigId);
      if (newConfig) {
        this.showConfigurationEditor(newConfig);
      }
    } catch (error) {
      this.showNotification(`Failed to clone configuration: ${error}`, 'error');
    }
  }

  private exportConfiguration(): void {
    if (!this.currentConfig.id) return;

    try {
      const exportData = this.manager.exportConfiguration(this.currentConfig.id);
      this.downloadFile(`${this.currentConfig.name || 'configuration'}.json`, exportData);
      this.showNotification('Configuration exported successfully', 'success');
    } catch (error) {
      this.showNotification(`Export failed: ${error}`, 'error');
    }
  }

  private deleteConfiguration(): void {
    if (!this.currentConfig.id) return;

    if (confirm(`Are you sure you want to delete the configuration "${this.currentConfig.name}"? This action cannot be undone.`)) {
      try {
        this.manager.deleteConfiguration(this.currentConfig.id);
        this.showConfigurationEditor(); // Show empty editor
      } catch (error) {
        this.showNotification(`Failed to delete configuration: ${error}`, 'error');
      }
    }
  }

  private toggleTestSuite(suiteId: string, enabled: boolean): void {
    const suiteCard = document.querySelector(`[data-suite-id="${suiteId}"]`)?.closest('.test-suite-card') as HTMLElement;
    if (!suiteCard) return;

    if (enabled) {
      suiteCard.classList.add('selected');
      const parametersDiv = suiteCard.querySelector('.suite-parameters') as HTMLElement;
      if (parametersDiv) {
        parametersDiv.style.display = 'block';
      }
    } else {
      suiteCard.classList.remove('selected');
      const parametersDiv = suiteCard.querySelector('.suite-parameters') as HTMLElement;
      if (parametersDiv) {
        parametersDiv.style.display = 'none';
      }
    }
  }

  private selectAllTestSuites(): void {
    const checkboxes = document.querySelectorAll('[data-suite-id]') as NodeListOf<HTMLInputElement>;
    const allSelected = Array.from(checkboxes).every(cb => cb.checked);
    
    checkboxes.forEach(checkbox => {
      if (checkbox.type === 'checkbox') {
        checkbox.checked = !allSelected;
        this.toggleTestSuite(checkbox.dataset.suiteId!, checkbox.checked);
      }
    });

    const button = document.getElementById('select-all-suites');
    if (button) {
      button.textContent = allSelected ? 'Select All' : 'Deselect All';
    }
  }

  private addUserProfile(): void {
    const container = document.getElementById('user-profiles-container');
    if (!container) return;

    const profileCount = container.querySelectorAll('.user-profile-card').length;
    const defaultProfile: UserProfile = {
      id: `profile-${profileCount}`,
      name: `Profile ${profileCount + 1}`,
      role: 'passenger',
      weight: 0,
      demographics: {
        age: 30,
        location: 'urban',
        deviceType: 'mobile',
        experience: 'regular'
      },
      preferences: {
        paymentMethod: 'credit_card',
        language: 'en',
        notificationSettings: {}
      },
      behaviorPatterns: {
        bookingFrequency: 5,
        averageRideDistance: 10,
        cancellationRate: 0.05,
        preferredTimes: ['09:00', '17:00']
      }
    };

    const profileHTML = this.generateUserProfileEditor(defaultProfile, profileCount);
    container.insertAdjacentHTML('beforeend', profileHTML);

    // Remove empty state message if it exists
    const emptyState = container.querySelector('.empty-state');
    if (emptyState) {
      emptyState.remove();
    }

    // Attach event handlers for the new profile
    this.attachProfileEventHandlers(container.lastElementChild as HTMLElement);
  }

  private attachProfileEventHandlers(profileCard: HTMLElement): void {
    // Remove profile button
    const removeBtn = profileCard.querySelector('.remove-profile-btn');
    removeBtn?.addEventListener('click', () => {
      profileCard.remove();
      this.updateProfileIndices();
    });

    // Clone profile button
    const cloneBtn = profileCard.querySelector('.clone-profile-btn');
    cloneBtn?.addEventListener('click', () => {
      const clonedHTML = profileCard.outerHTML;
      profileCard.insertAdjacentHTML('afterend', clonedHTML);
      this.updateProfileIndices();
    });
  }

  private updateProfileIndices(): void {
    const profiles = document.querySelectorAll('.user-profile-card');
    profiles.forEach((profile, index) => {
      const header = profile.querySelector('.profile-header h4');
      if (header) {
        const nameInput = profile.querySelector('.profile-name') as HTMLInputElement;
        const currentName = nameInput?.value || `Profile ${index + 1}`;
        header.textContent = `Profile ${index + 1}: ${currentName}`;
      }
      (profile as HTMLElement).dataset.profileIndex = index.toString();
    });
  }

  private addParameter(container: Element): void {
    const parametersList = container.querySelector('.parameters-list');
    if (!parametersList) return;

    const addButton = parametersList.querySelector('.add-param-btn');
    const parameterHTML = `
      <div class="parameter-row">
        <input type="text" class="param-key" placeholder="Parameter name" />
        <input type="text" class="param-value" placeholder="Parameter value" />
        <button class="remove-param-btn" type="button">×</button>
      </div>
    `;

    addButton?.insertAdjacentHTML('beforebegin', parameterHTML);

    // Attach remove handler
    const newRow = parametersList.querySelector('.parameter-row:last-of-type');
    const removeBtn = newRow?.querySelector('.remove-param-btn');
    removeBtn?.addEventListener('click', () => {
      newRow?.remove();
    });
  }

  private showValidationErrors(errors: any[]): void {
    const errorMessages = errors.map(error => error.message).join('\n');
    this.showNotification(`Validation errors:\n${errorMessages}`, 'error');
  }

  private showValidationWarnings(warnings: any[]): void {
    const warningMessages = warnings.map(warning => warning.message).join('\n');
    this.showNotification(`Warnings:\n${warningMessages}`, 'warning');
  }

  private showNotification(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info'): void {
    const container = document.getElementById('notification-container');
    if (!container) return;

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <span class="notification-icon">${this.getNotificationIcon(type)}</span>
        <span class="notification-message">${message}</span>
      </div>
      <button class="notification-close">&times;</button>
    `;

    container.appendChild(notification);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 5000);

    // Add click handler for close button
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn?.addEventListener('click', () => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    });
  }

  private getNotificationIcon(type: string): string {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return 'ℹ️';
    }
  }

  private formatRelativeTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (minutes > 0) {
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  }

  private downloadFile(filename: string, content: string): void {
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  private applyStyles(): void {
    if (!document.getElementById('config-ui-styles')) {
      const styles = document.createElement('style');
      styles.id = 'config-ui-styles';
      styles.textContent = this.getConfigUICSS();
      document.head.appendChild(styles);
    }
  }

  private getConfigUICSS(): string {
    return `
      .config-ui {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        height: 100vh;
        display: flex;
        flex-direction: column;
        background: #f5f5f5;
      }

      .config-ui.dark {
        background: #1a1a1a;
        color: #fff;
      }

      .config-header {
        background: white;
        padding: 20px;
        border-bottom: 1px solid #e0e0e0;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .dark .config-header {
        background: #2d2d2d;
        border-color: #404040;
      }

      .header-actions {
        display: flex;
        gap: 10px;
      }

      .config-content {
        flex: 1;
        display: flex;
        overflow: hidden;
      }

      .config-sidebar {
        width: 350px;
        background: white;
        border-right: 1px solid #e0e0e0;
        display: flex;
        flex-direction: column;
      }

      .dark .config-sidebar {
        background: #2d2d2d;
        border-color: #404040;
      }

      .sidebar-section {
        padding: 20px;
        flex: 1;
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }

      .search-box {
        margin: 15px 0;
      }

      .search-box input {
        width: 100%;
        padding: 8px 12px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 14px;
      }

      .dark .search-box input {
        background: #404040;
        border-color: #555;
        color: #fff;
      }

      .config-list {
        flex: 1;
        overflow-y: auto;
      }

      .config-item {
        padding: 15px;
        border-bottom: 1px solid #f0f0f0;
        cursor: pointer;
        transition: background-color 0.2s;
      }

      .config-item:hover {
        background: #f8f9fa;
      }

      .dark .config-item {
        border-color: #404040;
      }

      .dark .config-item:hover {
        background: #3d3d3d;
      }

      .config-item-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
      }

      .config-item-header h4 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
      }

      .config-environment {
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 500;
        text-transform: uppercase;
      }

      .config-environment.development {
        background: #e3f2fd;
        color: #1976d2;
      }

      .config-environment.staging {
        background: #fff3e0;
        color: #f57c00;
      }

      .config-environment.production {
        background: #ffebee;
        color: #d32f2f;
      }

      .config-item-details p {
        margin: 0 0 8px 0;
        color: #666;
        font-size: 14px;
      }

      .dark .config-item-details p {
        color: #aaa;
      }

      .config-meta {
        display: flex;
        gap: 15px;
        font-size: 12px;
        color: #888;
        margin-bottom: 8px;
      }

      .config-tags {
        display: flex;
        gap: 5px;
        flex-wrap: wrap;
      }

      .tag {
        background: #e0e0e0;
        color: #333;
        padding: 2px 6px;
        border-radius: 10px;
        font-size: 11px;
      }

      .dark .tag {
        background: #555;
        color: #ccc;
      }

      .config-item-actions {
        margin-top: 10px;
        display: flex;
        gap: 8px;
      }

      .config-main {
        flex: 1;
        overflow: auto;
        background: white;
      }

      .dark .config-main {
        background: #2d2d2d;
      }

      .config-editor {
        height: 100%;
        padding: 20px;
      }

      .welcome-message {
        text-align: center;
        padding: 60px 20px;
        color: #666;
      }

      .dark .welcome-message {
        color: #aaa;
      }

      .config-form {
        max-width: 1000px;
        margin: 0 auto;
      }

      .form-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 30px;
        padding-bottom: 20px;
        border-bottom: 1px solid #e0e0e0;
      }

      .dark .form-header {
        border-color: #404040;
      }

      .form-actions {
        display: flex;
        gap: 10px;
      }

      .form-tabs {
        display: flex;
        border-bottom: 1px solid #e0e0e0;
        margin-bottom: 30px;
      }

      .dark .form-tabs {
        border-color: #404040;
      }

      .tab-btn {
        padding: 12px 20px;
        border: none;
        background: none;
        cursor: pointer;
        border-bottom: 2px solid transparent;
        transition: all 0.2s;
      }

      .tab-btn:hover {
        background: #f5f5f5;
      }

      .dark .tab-btn:hover {
        background: #3d3d3d;
      }

      .tab-btn.active {
        border-bottom-color: #007bff;
        color: #007bff;
      }

      .tab-panel {
        display: none;
      }

      .tab-panel.active {
        display: block;
      }

      .form-section {
        margin-bottom: 40px;
      }

      .form-section h3 {
        margin: 0 0 20px 0;
        font-size: 18px;
        font-weight: 600;
      }

      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
      }

      .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
        margin-bottom: 20px;
      }

      .form-group {
        margin-bottom: 20px;
      }

      .form-group label {
        display: block;
        margin-bottom: 5px;
        font-weight: 500;
      }

      .form-group input,
      .form-group select,
      .form-group textarea {
        width: 100%;
        padding: 8px 12px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 14px;
      }

      .dark .form-group input,
      .dark .form-group select,
      .dark .form-group textarea {
        background: #404040;
        border-color: #555;
        color: #fff;
      }

      .form-group small {
        display: block;
        margin-top: 5px;
        color: #666;
        font-size: 12px;
      }

      .dark .form-group small {
        color: #aaa;
      }

      .checkbox-group {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .checkbox-group label {
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
      }

      .test-suites-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
        gap: 20px;
      }

      .test-suite-card {
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        padding: 15px;
        transition: all 0.2s;
      }

      .test-suite-card.selected {
        border-color: #007bff;
        background: #f8f9ff;
      }

      .dark .test-suite-card {
        border-color: #404040;
        background: #3d3d3d;
      }

      .dark .test-suite-card.selected {
        border-color: #007bff;
        background: #1a2332;
      }

      .suite-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
      }

      .suite-checkbox {
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
      }

      .suite-name {
        font-weight: 500;
      }

      .suite-priority {
        display: flex;
        align-items: center;
        gap: 5px;
        font-size: 12px;
      }

      .priority-input {
        width: 60px !important;
        padding: 4px 6px !important;
      }

      .suite-dependencies {
        margin-bottom: 15px;
        font-size: 12px;
        color: #666;
      }

      .dark .suite-dependencies {
        color: #aaa;
      }

      .suite-parameters h4 {
        margin: 0 0 10px 0;
        font-size: 14px;
      }

      .parameters-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .parameter-row {
        display: flex;
        gap: 8px;
        align-items: center;
      }

      .param-key,
      .param-value {
        flex: 1;
        padding: 4px 8px !important;
        font-size: 12px !important;
      }

      .remove-param-btn {
        background: #dc3545;
        color: white;
        border: none;
        border-radius: 50%;
        width: 24px;
        height: 24px;
        cursor: pointer;
        font-size: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .add-param-btn {
        align-self: flex-start;
        margin-top: 5px;
      }

      .user-profile-card {
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        padding: 20px;
        margin-bottom: 20px;
      }

      .dark .user-profile-card {
        border-color: #404040;
        background: #3d3d3d;
      }

      .profile-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        padding-bottom: 15px;
        border-bottom: 1px solid #f0f0f0;
      }

      .dark .profile-header {
        border-color: #404040;
      }

      .profile-actions {
        display: flex;
        gap: 8px;
      }

      .profile-sections {
        display: grid;
        gap: 20px;
      }

      .profile-section h5 {
        margin: 0 0 15px 0;
        font-size: 14px;
        font-weight: 600;
        color: #007bff;
      }

      .btn {
        padding: 8px 16px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        transition: all 0.2s;
        display: inline-flex;
        align-items: center;
        gap: 5px;
      }

      .btn-primary {
        background: #007bff;
        color: white;
      }

      .btn-secondary {
        background: #6c757d;
        color: white;
      }

      .btn-danger {
        background: #dc3545;
        color: white;
      }

      .btn-sm {
        padding: 4px 8px;
        font-size: 12px;
      }

      .btn:hover {
        opacity: 0.9;
        transform: translateY(-1px);
      }

      .modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .modal-content {
        background: white;
        border-radius: 8px;
        max-width: 800px;
        max-height: 80vh;
        overflow-y: auto;
        margin: 20px;
      }

      .dark .modal-content {
        background: #2d2d2d;
      }

      .modal-header {
        padding: 20px;
        border-bottom: 1px solid #e0e0e0;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .dark .modal-header {
        border-color: #404040;
      }

      .modal-close {
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: #666;
      }

      .dark .modal-close {
        color: #aaa;
      }

      .modal-body {
        padding: 20px;
      }

      .modal-actions {
        margin-top: 20px;
        display: flex;
        gap: 10px;
        justify-content: flex-end;
      }

      .template-card {
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        padding: 20px;
        margin-bottom: 15px;
      }

      .dark .template-card {
        border-color: #404040;
        background: #3d3d3d;
      }

      .template-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
      }

      .template-category {
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 500;
        text-transform: uppercase;
      }

      .template-category.smoke {
        background: #e8f5e8;
        color: #2e7d32;
      }

      .template-category.regression {
        background: #fff3e0;
        color: #f57c00;
      }

      .template-category.performance {
        background: #f3e5f5;
        color: #7b1fa2;
      }

      .template-description {
        color: #666;
        margin-bottom: 15px;
      }

      .dark .template-description {
        color: #aaa;
      }

      .template-actions {
        display: flex;
        justify-content: flex-end;
      }

      .notification-container {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 2000;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .notification {
        background: white;
        border-radius: 8px;
        padding: 15px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        display: flex;
        align-items: center;
        justify-content: space-between;
        min-width: 300px;
        animation: slideIn 0.3s ease;
      }

      .notification.success {
        border-left: 4px solid #28a745;
      }

      .notification.error {
        border-left: 4px solid #dc3545;
      }

      .notification.warning {
        border-left: 4px solid #ffc107;
      }

      .notification.info {
        border-left: 4px solid #17a2b8;
      }

      .notification-content {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .notification-close {
        background: none;
        border: none;
        font-size: 18px;
        cursor: pointer;
        color: #666;
      }

      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }

      .empty-state {
        text-align: center;
        color: #666;
        font-style: italic;
        padding: 40px 20px;
      }

      .dark .empty-state {
        color: #aaa;
      }

      .json-editor {
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        font-size: 12px;
        line-height: 1.4;
      }

      .icon {
        font-size: 16px;
      }
    `;
  }

  public destroy(): void {
    if (this.container) {
      this.container.innerHTML = '';
    }
  }
}