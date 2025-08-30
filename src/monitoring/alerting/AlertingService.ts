/**
 * Alerting and Notification Service
 * Manages alerts, notifications, and escalation policies
 */

import { EventEmitter } from 'events'
import axios from 'axios'
import * as nodemailer from 'nodemailer'

export interface Alert {
  id: string
  name: string
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: 'firing' | 'resolved' | 'silenced'
  labels: Record<string, string>
  annotations: Record<string, string>
  startsAt: Date
  endsAt?: Date
  generatorURL?: string
  fingerprint: string
}

export interface AlertRule {
  id: string
  name: string
  description: string
  query: string
  condition: string
  threshold: number
  duration: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  labels: Record<string, string>
  annotations: Record<string, string>
  enabled: boolean
}

export interface NotificationChannel {
  id: string
  name: string
  type: 'email' | 'slack' | 'webhook' | 'pagerduty' | 'sms'
  config: Record<string, any>
  enabled: boolean
}

export interface EscalationPolicy {
  id: string
  name: string
  rules: Array<{
    delay: number // minutes
    channels: string[]
    severity: 'low' | 'medium' | 'high' | 'critical'
  }>
}

export interface AlertingConfig {
  evaluationInterval: number
  retentionPeriod: number
  groupWait: number
  groupInterval: number
  repeatInterval: number
  channels: NotificationChannel[]
  escalationPolicies: EscalationPolicy[]
  rules: AlertRule[]
}

export class AlertingService extends EventEmitter {
  private config: AlertingConfig
  private activeAlerts: Map<string, Alert> = new Map()
  private alertHistory: Alert[] = []
  private evaluationTimer?: NodeJS.Timeout
  private escalationTimers: Map<string, NodeJS.Timeout> = new Map()
  private silencedAlerts: Set<string> = new Set()

  constructor(config: AlertingConfig) {
    super()
    this.config = config
    this.startEvaluation()
  }

  /**
   * Start alert evaluation
   */
  private startEvaluation(): void {
    this.evaluationTimer = setInterval(async () => {
      await this.evaluateRules()
    }, this.config.evaluationInterval)
  }

  /**
   * Evaluate all alert rules
   */
  private async evaluateRules(): Promise<void> {
    for (const rule of this.config.rules) {
      if (!rule.enabled) continue

      try {
        await this.evaluateRule(rule)
      } catch (error) {
        this.emit('ruleEvaluationError', { rule, error })
      }
    }
  }

  /**
   * Evaluate a single alert rule
   */
  private async evaluateRule(rule: AlertRule): Promise<void> {
    // This would typically query metrics backend (Prometheus, etc.)
    // For now, we'll simulate rule evaluation
    const isTriggered = await this.checkRuleCondition(rule)
    const alertId = this.generateAlertId(rule)

    if (isTriggered) {
      if (!this.activeAlerts.has(alertId)) {
        // New alert
        const alert: Alert = {
          id: alertId,
          name: rule.name,
          description: rule.description,
          severity: rule.severity,
          status: 'firing',
          labels: rule.labels,
          annotations: rule.annotations,
          startsAt: new Date(),
          fingerprint: this.generateFingerprint(rule),
          generatorURL: `http://localhost:3000/alerts/${alertId}`
        }

        this.activeAlerts.set(alertId, alert)
        this.alertHistory.push(alert)
        
        await this.handleNewAlert(alert)
        this.emit('alertFiring', alert)
      }
    } else {
      if (this.activeAlerts.has(alertId)) {
        // Resolve alert
        const alert = this.activeAlerts.get(alertId)!
        alert.status = 'resolved'
        alert.endsAt = new Date()

        this.activeAlerts.delete(alertId)
        await this.handleResolvedAlert(alert)
        this.emit('alertResolved', alert)
      }
    }
  }

  /**
   * Check if rule condition is met
   */
  private async checkRuleCondition(rule: AlertRule): Promise<boolean> {
    // Simulate rule evaluation based on metrics
    // In a real implementation, this would query the metrics backend
    
    switch (rule.name) {
      case 'HighTestFailureRate':
        return Math.random() > 0.9 // 10% chance of triggering
      case 'HighMemoryUsage':
        return Math.random() > 0.95 // 5% chance of triggering
      case 'TestingAgentDown':
        return Math.random() > 0.99 // 1% chance of triggering
      case 'DatabaseConnectionFailure':
        return Math.random() > 0.98 // 2% chance of triggering
      default:
        return false
    }
  }

  /**
   * Handle new alert
   */
  private async handleNewAlert(alert: Alert): Promise<void> {
    if (this.silencedAlerts.has(alert.fingerprint)) {
      alert.status = 'silenced'
      return
    }

    // Find applicable escalation policy
    const policy = this.findEscalationPolicy(alert)
    if (policy) {
      await this.startEscalation(alert, policy)
    } else {
      // Send immediate notification
      await this.sendNotifications(alert, this.getDefaultChannels(alert.severity))
    }
  }

  /**
   * Handle resolved alert
   */
  private async handleResolvedAlert(alert: Alert): Promise<void> {
    // Cancel escalation if running
    const escalationTimer = this.escalationTimers.get(alert.id)
    if (escalationTimer) {
      clearTimeout(escalationTimer)
      this.escalationTimers.delete(alert.id)
    }

    // Send resolution notification
    await this.sendNotifications(alert, this.getDefaultChannels(alert.severity))
  }

  /**
   * Start escalation process
   */
  private async startEscalation(alert: Alert, policy: EscalationPolicy): Promise<void> {
    let ruleIndex = 0

    const escalate = async () => {
      if (ruleIndex >= policy.rules.length) return
      if (alert.status !== 'firing') return

      const rule = policy.rules[ruleIndex]
      if (alert.severity === rule.severity || rule.severity === 'low') {
        const channels = rule.channels.map(id => this.config.channels.find(c => c.id === id)).filter(Boolean) as NotificationChannel[]
        await this.sendNotifications(alert, channels)
      }

      ruleIndex++
      if (ruleIndex < policy.rules.length) {
        const nextRule = policy.rules[ruleIndex]
        const timer = setTimeout(escalate, nextRule.delay * 60 * 1000) // Convert minutes to milliseconds
        this.escalationTimers.set(alert.id, timer)
      }
    }

    // Start with first rule
    if (policy.rules.length > 0) {
      const firstRule = policy.rules[0]
      const timer = setTimeout(escalate, firstRule.delay * 60 * 1000)
      this.escalationTimers.set(alert.id, timer)
    }
  }

  /**
   * Send notifications through configured channels
   */
  private async sendNotifications(alert: Alert, channels: NotificationChannel[]): Promise<void> {
    const promises = channels.map(channel => this.sendNotification(alert, channel))
    await Promise.allSettled(promises)
  }

  /**
   * Send notification through a specific channel
   */
  private async sendNotification(alert: Alert, channel: NotificationChannel): Promise<void> {
    if (!channel.enabled) return

    try {
      switch (channel.type) {
        case 'email':
          await this.sendEmailNotification(alert, channel)
          break
        case 'slack':
          await this.sendSlackNotification(alert, channel)
          break
        case 'webhook':
          await this.sendWebhookNotification(alert, channel)
          break
        case 'pagerduty':
          await this.sendPagerDutyNotification(alert, channel)
          break
        case 'sms':
          await this.sendSMSNotification(alert, channel)
          break
        default:
          throw new Error(`Unsupported notification channel type: ${channel.type}`)
      }

      this.emit('notificationSent', { alert, channel })
    } catch (error) {
      this.emit('notificationError', { alert, channel, error })
    }
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(alert: Alert, channel: NotificationChannel): Promise<void> {
    const transporter = nodemailer.createTransporter({
      host: channel.config.host,
      port: channel.config.port,
      secure: channel.config.secure,
      auth: {
        user: channel.config.username,
        pass: channel.config.password
      }
    })

    const subject = `[${alert.severity.toUpperCase()}] ${alert.name}`
    const html = this.generateEmailTemplate(alert)

    await transporter.sendMail({
      from: channel.config.from,
      to: channel.config.to,
      subject,
      html
    })
  }

  /**
   * Send Slack notification
   */
  private async sendSlackNotification(alert: Alert, channel: NotificationChannel): Promise<void> {
    const color = this.getSeverityColor(alert.severity)
    const payload = {
      text: `Alert: ${alert.name}`,
      attachments: [{
        color,
        title: alert.name,
        text: alert.description,
        fields: [
          { title: 'Severity', value: alert.severity, short: true },
          { title: 'Status', value: alert.status, short: true },
          { title: 'Started At', value: alert.startsAt.toISOString(), short: true }
        ],
        footer: 'GoCars Testing Agent',
        ts: Math.floor(alert.startsAt.getTime() / 1000)
      }]
    }

    await axios.post(channel.config.webhookUrl, payload)
  }

  /**
   * Send webhook notification
   */
  private async sendWebhookNotification(alert: Alert, channel: NotificationChannel): Promise<void> {
    const payload = {
      alert,
      timestamp: new Date().toISOString(),
      source: 'gocars-testing-agent'
    }

    await axios.post(channel.config.url, payload, {
      headers: channel.config.headers || {},
      timeout: channel.config.timeout || 10000
    })
  }

  /**
   * Send PagerDuty notification
   */
  private async sendPagerDutyNotification(alert: Alert, channel: NotificationChannel): Promise<void> {
    const eventAction = alert.status === 'firing' ? 'trigger' : 'resolve'
    const payload = {
      routing_key: channel.config.integrationKey,
      event_action: eventAction,
      dedup_key: alert.fingerprint,
      payload: {
        summary: alert.name,
        source: 'gocars-testing-agent',
        severity: alert.severity,
        component: alert.labels.component || 'unknown',
        group: alert.labels.group || 'testing',
        class: alert.labels.class || 'alert',
        custom_details: {
          description: alert.description,
          labels: alert.labels,
          annotations: alert.annotations
        }
      }
    }

    await axios.post('https://events.pagerduty.com/v2/enqueue', payload)
  }

  /**
   * Send SMS notification
   */
  private async sendSMSNotification(alert: Alert, channel: NotificationChannel): Promise<void> {
    // This would integrate with SMS service like Twilio
    const message = `[${alert.severity.toUpperCase()}] ${alert.name}: ${alert.description}`
    
    // Placeholder for SMS integration
    console.log(`SMS to ${channel.config.phoneNumber}: ${message}`)
  }

  /**
   * Create a new alert rule
   */
  public createAlertRule(rule: Omit<AlertRule, 'id'>): AlertRule {
    const newRule: AlertRule = {
      id: this.generateRuleId(),
      ...rule
    }

    this.config.rules.push(newRule)
    return newRule
  }

  /**
   * Update an alert rule
   */
  public updateAlertRule(id: string, updates: Partial<AlertRule>): AlertRule | null {
    const ruleIndex = this.config.rules.findIndex(r => r.id === id)
    if (ruleIndex === -1) return null

    this.config.rules[ruleIndex] = { ...this.config.rules[ruleIndex], ...updates }
    return this.config.rules[ruleIndex]
  }

  /**
   * Delete an alert rule
   */
  public deleteAlertRule(id: string): boolean {
    const ruleIndex = this.config.rules.findIndex(r => r.id === id)
    if (ruleIndex === -1) return false

    this.config.rules.splice(ruleIndex, 1)
    return true
  }

  /**
   * Silence an alert
   */
  public silenceAlert(fingerprint: string, duration: number): void {
    this.silencedAlerts.add(fingerprint)
    
    // Auto-remove silence after duration
    setTimeout(() => {
      this.silencedAlerts.delete(fingerprint)
    }, duration)
  }

  /**
   * Get active alerts
   */
  public getActiveAlerts(): Alert[] {
    return Array.from(this.activeAlerts.values())
  }

  /**
   * Get alert history
   */
  public getAlertHistory(limit: number = 100): Alert[] {
    return this.alertHistory.slice(-limit)
  }

  /**
   * Get alert statistics
   */
  public getAlertStatistics(): {
    total: number
    active: number
    resolved: number
    silenced: number
    bySeverity: Record<string, number>
  } {
    const active = this.getActiveAlerts()
    const total = this.alertHistory.length

    const bySeverity = this.alertHistory.reduce((acc, alert) => {
      acc[alert.severity] = (acc[alert.severity] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      total,
      active: active.length,
      resolved: total - active.length,
      silenced: this.silencedAlerts.size,
      bySeverity
    }
  }

  /**
   * Test notification channel
   */
  public async testNotificationChannel(channelId: string): Promise<boolean> {
    const channel = this.config.channels.find(c => c.id === channelId)
    if (!channel) return false

    const testAlert: Alert = {
      id: 'test-alert',
      name: 'Test Alert',
      description: 'This is a test alert to verify notification channel configuration',
      severity: 'low',
      status: 'firing',
      labels: { test: 'true' },
      annotations: { test: 'true' },
      startsAt: new Date(),
      fingerprint: 'test-fingerprint'
    }

    try {
      await this.sendNotification(testAlert, channel)
      return true
    } catch (error) {
      return false
    }
  }

  /**
   * Shutdown alerting service
   */
  public shutdown(): void {
    if (this.evaluationTimer) {
      clearInterval(this.evaluationTimer)
    }

    // Clear all escalation timers
    this.escalationTimers.forEach(timer => clearTimeout(timer))
    this.escalationTimers.clear()

    this.removeAllListeners()
  }

  // Private helper methods

  private generateAlertId(rule: AlertRule): string {
    return `${rule.id}_${Date.now()}`
  }

  private generateRuleId(): string {
    return `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateFingerprint(rule: AlertRule): string {
    const data = `${rule.name}_${JSON.stringify(rule.labels)}`
    return Buffer.from(data).toString('base64')
  }

  private findEscalationPolicy(alert: Alert): EscalationPolicy | undefined {
    return this.config.escalationPolicies.find(policy => 
      policy.rules.some(rule => rule.severity === alert.severity)
    )
  }

  private getDefaultChannels(severity: string): NotificationChannel[] {
    // Return channels based on severity
    return this.config.channels.filter(channel => {
      if (severity === 'critical') return true
      if (severity === 'high' && channel.type !== 'sms') return true
      if (severity === 'medium' && ['email', 'slack'].includes(channel.type)) return true
      if (severity === 'low' && channel.type === 'email') return true
      return false
    })
  }

  private getSeverityColor(severity: string): string {
    const colors = {
      low: '#36a64f',      // Green
      medium: '#ff9500',   // Orange
      high: '#ff0000',     // Red
      critical: '#8b0000'  // Dark Red
    }
    return colors[severity as keyof typeof colors] || '#808080'
  }

  private generateEmailTemplate(alert: Alert): string {
    return `
      <html>
        <body style="font-family: Arial, sans-serif; margin: 20px;">
          <div style="border-left: 4px solid ${this.getSeverityColor(alert.severity)}; padding-left: 20px;">
            <h2 style="color: ${this.getSeverityColor(alert.severity)};">
              [${alert.severity.toUpperCase()}] ${alert.name}
            </h2>
            <p><strong>Description:</strong> ${alert.description}</p>
            <p><strong>Status:</strong> ${alert.status}</p>
            <p><strong>Started At:</strong> ${alert.startsAt.toISOString()}</p>
            ${alert.endsAt ? `<p><strong>Ended At:</strong> ${alert.endsAt.toISOString()}</p>` : ''}
            
            <h3>Labels:</h3>
            <ul>
              ${Object.entries(alert.labels).map(([key, value]) => `<li><strong>${key}:</strong> ${value}</li>`).join('')}
            </ul>
            
            <h3>Annotations:</h3>
            <ul>
              ${Object.entries(alert.annotations).map(([key, value]) => `<li><strong>${key}:</strong> ${value}</li>`).join('')}
            </ul>
            
            <p style="margin-top: 20px; font-size: 12px; color: #666;">
              Generated by GoCars Testing Agent
            </p>
          </div>
        </body>
      </html>
    `
  }
}

// Singleton instance
let alertingServiceInstance: AlertingService | null = null

/**
 * Get singleton alerting service instance
 */
export function getAlertingService(config?: AlertingConfig): AlertingService {
  if (!alertingServiceInstance) {
    const defaultConfig: AlertingConfig = {
      evaluationInterval: 30000, // 30 seconds
      retentionPeriod: 7 * 24 * 60 * 60 * 1000, // 7 days
      groupWait: 10000, // 10 seconds
      groupInterval: 300000, // 5 minutes
      repeatInterval: 3600000, // 1 hour
      channels: [],
      escalationPolicies: [],
      rules: []
    }

    alertingServiceInstance = new AlertingService(config || defaultConfig)
  }

  return alertingServiceInstance
}

/**
 * Initialize alerting service with configuration
 */
export function initializeAlerting(config: AlertingConfig): AlertingService {
  alertingServiceInstance = new AlertingService(config)
  return alertingServiceInstance
}