/**
 * Enhanced Notification System Component for GoCars
 * Demonstrates Firebase Cloud Messaging integration, scheduling, and analytics
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Bell, 
  Send, 
  Calendar, 
  BarChart3, 
  Settings, 
  Clock,
  TrendingUp,
  Users,
  AlertTriangle,
  Gift,
  Car,
  CreditCard,
  Shield
} from 'lucide-react'
import { db } from '@/lib/firebase'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { pushNotificationService } from '@/services/pushNotificationService'
import { usePushNotifications } from '@/hooks/usePushNotifications'

interface NotificationTemplate {
  id: string
  name: string
  title: string
  body: string
  category: 'ride' | 'payment' | 'system' | 'promotion' | 'emergency'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  icon?: string
  variables?: string[]
}

interface ScheduledNotification {
  id: string
  templateId: string
  scheduledTime: Date
  status: 'pending' | 'sent' | 'cancelled'
  recurring?: {
    frequency: 'daily' | 'weekly' | 'monthly'
    interval: number
  }
}

const EnhancedNotificationSystem: React.FC = () => {
  const [activeTab, setActiveTab] = useState('send')
  const [templates, setTemplates] = useState<NotificationTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [customTitle, setCustomTitle] = useState('')
  const [customBody, setCustomBody] = useState('')
  const [templateVariables, setTemplateVariables] = useState<Record<string, string>>({})
  const [scheduledTime, setScheduledTime] = useState('')
  const [isRecurring, setIsRecurring] = useState(false)
  const [recurringFrequency, setRecurringFrequency] = useState<'daily' | 'weekly' | 'monthly'>('daily')
  const [recurringInterval, setRecurringInterval] = useState(1)
  const [targetUserId, setTargetUserId] = useState('')
  const [deliveryStats, setDeliveryStats] = useState<any>(null)
  const [userAnalytics, setUserAnalytics] = useState<any>(null)
  const [personalizationData, setPersonalizationData] = useState<any>(null)
  const [scheduledNotifications, setScheduledNotifications] = useState<ScheduledNotification[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const {
    isRegistered,
    deviceToken,
    settings,
    error,
    registerDevice,
    unregisterDevice,
    updateSettings,
    sendTestNotification,
    sendTemplateNotification
  } = usePushNotifications(targetUserId)

  useEffect(() => {
    loadTemplates()
  }, [])

  useEffect(() => {
    if (targetUserId) {
      loadDeliveryStats()
      loadUserAnalytics()
      loadPersonalizationData()
      loadScheduledNotifications()
    }
  }, [targetUserId])

  const loadTemplates = () => {
    const availableTemplates = pushNotificationService.getTemplates()
    setTemplates(availableTemplates)
  }

  const loadDeliveryStats = async () => {
    if (!targetUserId) return
    
    try {
      const stats = await pushNotificationService.getDeliveryStats(targetUserId)
      setDeliveryStats(stats)
    } catch (error) {
      console.error('Error loading delivery stats:', error)
    }
  }

  const loadUserAnalytics = async () => {
    if (!targetUserId) return
    
    try {
      const analytics = await pushNotificationService.getUserAnalytics(targetUserId)
      setUserAnalytics(analytics)
    } catch (error) {
      console.error('Error loading user analytics:', error)
    }
  }

  const loadPersonalizationData = async () => {
    if (!targetUserId) return
    
    try {
      const data = await pushNotificationService.getPersonalizationData(targetUserId)
      setPersonalizationData(data)
    } catch (error) {
      console.error('Error loading personalization data:', error)
    }
  }

  const loadScheduledNotifications = async () => {
    if (!targetUserId) return
    
    try {
      // Fetch real scheduled notifications from Firebase
      const scheduledQuery = query(
        collection(db, 'notificationSchedules'),
        where('userId', '==', targetUserId),
        where('status', '==', 'pending')
      )
      
      const scheduledSnapshot = await getDocs(scheduledQuery)
      const notifications = scheduledSnapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          templateId: data.templateId,
          scheduledTime: data.scheduledTime.toDate(),
          status: data.status,
          recurring: data.recurring
        }
      })
      
      setScheduledNotifications(notifications)
    } catch (error) {
      console.error('Error loading scheduled notifications:', error)
      setScheduledNotifications([])
    }
  }

  const handleSendNotification = async () => {
    if (!selectedTemplate && (!customTitle || !customBody)) {
      setMessage({ type: 'error', text: 'Please select a template or enter custom title and body' })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      if (selectedTemplate) {
        await sendTemplateNotification(selectedTemplate, templateVariables)
        setMessage({ type: 'success', text: 'Template notification sent successfully!' })
      } else {
        await sendTestNotification(customTitle, customBody)
        setMessage({ type: 'success', text: 'Custom notification sent successfully!' })
      }
      
      // Reload stats
      await loadDeliveryStats()
      await loadUserAnalytics()
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to send notification' })
    } finally {
      setLoading(false)
    }
  }

  const handleScheduleNotification = async () => {
    if (!selectedTemplate || !scheduledTime) {
      setMessage({ type: 'error', text: 'Please select a template and scheduled time' })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const scheduleDate = new Date(scheduledTime)
      const recurring = isRecurring ? {
        frequency: recurringFrequency,
        interval: recurringInterval
      } : undefined

      const scheduleId = await pushNotificationService.scheduleNotification(
        targetUserId,
        selectedTemplate,
        templateVariables,
        scheduleDate,
        'UTC',
        recurring
      )

      setMessage({ type: 'success', text: `Notification scheduled successfully! ID: ${scheduleId}` })
      await loadScheduledNotifications()
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to schedule notification' })
    } finally {
      setLoading(false)
    }
  }

  const handleCancelScheduled = async (scheduleId: string) => {
    try {
      await pushNotificationService.cancelScheduledNotification(scheduleId)
      setMessage({ type: 'success', text: 'Scheduled notification cancelled' })
      await loadScheduledNotifications()
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to cancel scheduled notification' })
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'ride': return <Car className="h-4 w-4" />
      case 'payment': return <CreditCard className="h-4 w-4" />
      case 'emergency': return <Shield className="h-4 w-4" />
      case 'promotion': return <Gift className="h-4 w-4" />
      default: return <Bell className="h-4 w-4" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive'
      case 'high': return 'default'
      case 'normal': return 'secondary'
      case 'low': return 'outline'
      default: return 'secondary'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Bell className="h-6 w-6 text-blue-600" />
        <h2 className="text-2xl font-bold">Enhanced Notification System</h2>
      </div>

      {message && (
        <Alert className={message.type === 'error' ? 'border-red-500' : 'border-green-500'}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="send">Send</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="send" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Send Notification
              </CardTitle>
              <CardDescription>
                Send immediate notifications using templates or custom content
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="targetUser">Target User ID</Label>
                  <Input
                    id="targetUser"
                    value={targetUserId}
                    onChange={(e) => setTargetUserId(e.target.value)}
                    placeholder="Enter user ID"
                  />
                </div>
                <div>
                  <Label htmlFor="template">Notification Template</Label>
                  <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select template" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Custom Notification</SelectItem>
                      {templates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          <div className="flex items-center gap-2">
                            {getCategoryIcon(template.category)}
                            {template.name}
                            <Badge variant={getPriorityColor(template.priority) as any}>
                              {template.priority}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {selectedTemplate ? (
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium mb-2">Template Preview</h4>
                    {(() => {
                      const template = templates.find(t => t.id === selectedTemplate)
                      return template ? (
                        <div>
                          <p><strong>Title:</strong> {template.title}</p>
                          <p><strong>Body:</strong> {template.body}</p>
                          <p><strong>Category:</strong> {template.category}</p>
                          <p><strong>Priority:</strong> {template.priority}</p>
                        </div>
                      ) : null
                    })()}
                  </div>

                  {(() => {
                    const template = templates.find(t => t.id === selectedTemplate)
                    return template?.variables && template.variables.length > 0 ? (
                      <div className="space-y-2">
                        <Label>Template Variables</Label>
                        {template.variables.map((variable) => (
                          <div key={variable}>
                            <Label htmlFor={variable}>{variable}</Label>
                            <Input
                              id={variable}
                              value={templateVariables[variable] || ''}
                              onChange={(e) => setTemplateVariables(prev => ({
                                ...prev,
                                [variable]: e.target.value
                              }))}
                              placeholder={`Enter ${variable}`}
                            />
                          </div>
                        ))}
                      </div>
                    ) : null
                  })()}
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="customTitle">Custom Title</Label>
                    <Input
                      id="customTitle"
                      value={customTitle}
                      onChange={(e) => setCustomTitle(e.target.value)}
                      placeholder="Enter notification title"
                    />
                  </div>
                  <div>
                    <Label htmlFor="customBody">Custom Body</Label>
                    <Textarea
                      id="customBody"
                      value={customBody}
                      onChange={(e) => setCustomBody(e.target.value)}
                      placeholder="Enter notification body"
                      rows={3}
                    />
                  </div>
                </div>
              )}

              <Button 
                onClick={handleSendNotification} 
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Sending...' : 'Send Notification'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Schedule Notification
              </CardTitle>
              <CardDescription>
                Schedule notifications for future delivery with recurring options
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="scheduleTemplate">Template</Label>
                  <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select template" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          <div className="flex items-center gap-2">
                            {getCategoryIcon(template.category)}
                            {template.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="scheduledTime">Scheduled Time</Label>
                  <Input
                    id="scheduledTime"
                    type="datetime-local"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="recurring"
                  checked={isRecurring}
                  onCheckedChange={setIsRecurring}
                />
                <Label htmlFor="recurring">Recurring Notification</Label>
              </div>

              {isRecurring && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="frequency">Frequency</Label>
                    <Select value={recurringFrequency} onValueChange={(value: any) => setRecurringFrequency(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="interval">Interval</Label>
                    <Input
                      id="interval"
                      type="number"
                      min="1"
                      value={recurringInterval}
                      onChange={(e) => setRecurringInterval(parseInt(e.target.value))}
                    />
                  </div>
                </div>
              )}

              <Button 
                onClick={handleScheduleNotification} 
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Scheduling...' : 'Schedule Notification'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Scheduled Notifications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {scheduledNotifications.map((notification) => (
                  <div key={notification.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{notification.templateId}</p>
                      <p className="text-sm text-gray-500">
                        {notification.scheduledTime.toLocaleString()}
                        {notification.recurring && (
                          <span className="ml-2 text-blue-600">
                            (Recurring {notification.recurring.frequency})
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={notification.status === 'pending' ? 'default' : 'secondary'}>
                        {notification.status}
                      </Badge>
                      {notification.status === 'pending' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCancelScheduled(notification.id)}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Delivery Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                {deliveryStats ? (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Total Sent:</span>
                      <span className="font-medium">{deliveryStats.total}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Success Rate:</span>
                      <span className="font-medium">{deliveryStats.successRate.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Click Rate:</span>
                      <span className="font-medium">{deliveryStats.clickRate.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Avg Delivery:</span>
                      <span className="font-medium">{deliveryStats.avgDeliveryTime}ms</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500">No data available</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  User Engagement
                </CardTitle>
              </CardHeader>
              <CardContent>
                {userAnalytics ? (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Engagement Rate:</span>
                      <span className="font-medium">{userAnalytics.engagementRate.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Clicked:</span>
                      <span className="font-medium">{userAnalytics.totalClicked}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Dismissed:</span>
                      <span className="font-medium">{userAnalytics.totalDismissed}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500">No data available</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Personalization
                </CardTitle>
              </CardHeader>
              <CardContent>
                {personalizationData ? (
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm text-gray-500">Preferred Categories:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {personalizationData.preferredCategories.map((category: string) => (
                          <Badge key={category} variant="outline" className="text-xs">
                            {category}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Optimal Times:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {personalizationData.optimalTimes.map((time: string) => (
                          <Badge key={time} variant="outline" className="text-xs">
                            {time}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span>Engagement Score:</span>
                      <span className="font-medium">{personalizationData.engagementScore}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500">No data available</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Notification Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Device Registration</Label>
                  <p className="text-sm text-gray-500">
                    {isRegistered ? 'Device is registered for notifications' : 'Device is not registered'}
                  </p>
                </div>
                <Button
                  onClick={isRegistered ? unregisterDevice : registerDevice}
                  variant={isRegistered ? 'outline' : 'default'}
                >
                  {isRegistered ? 'Unregister' : 'Register'}
                </Button>
              </div>

              {deviceToken && (
                <div>
                  <Label>Device Token</Label>
                  <p className="text-xs text-gray-500 font-mono break-all">
                    {deviceToken}
                  </p>
                </div>
              )}

              {settings && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Notifications Enabled</Label>
                    <Switch
                      checked={settings.enabled}
                      onCheckedChange={(enabled) => updateSettings({ enabled })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Category Preferences</Label>
                    {Object.entries(settings.categories).map(([category, enabled]) => (
                      <div key={category} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getCategoryIcon(category)}
                          <span className="capitalize">{category}</span>
                        </div>
                        <Switch
                          checked={enabled}
                          onCheckedChange={(value) => updateSettings({
                            categories: { ...settings.categories, [category]: value }
                          })}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <Label>Quiet Hours</Label>
                    <div className="flex items-center justify-between">
                      <span>Enable Quiet Hours</span>
                      <Switch
                        checked={settings.quietHours.enabled}
                        onCheckedChange={(enabled) => updateSettings({
                          quietHours: { ...settings.quietHours, enabled }
                        })}
                      />
                    </div>
                    {settings.quietHours.enabled && (
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label htmlFor="quietStart">Start Time</Label>
                          <Input
                            id="quietStart"
                            type="time"
                            value={settings.quietHours.start}
                            onChange={(e) => updateSettings({
                              quietHours: { ...settings.quietHours, start: e.target.value }
                            })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="quietEnd">End Time</Label>
                          <Input
                            id="quietEnd"
                            type="time"
                            value={settings.quietHours.end}
                            onChange={(e) => updateSettings({
                              quietHours: { ...settings.quietHours, end: e.target.value }
                            })}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>


      </Tabs>
    </div>
  )
}

export default EnhancedNotificationSystem