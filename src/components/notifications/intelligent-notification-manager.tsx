/**
 * Intelligent Notification Manager Component
 * Demonstrates advanced notification management features including DND, contextual filtering, and smart actions
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { 
  Moon, 
  Brain, 
  Filter, 
  Settings, 
  Clock,
  MapPin,
  Activity,
  Smartphone,
  Plus,
  Trash2,
  BarChart3,
  Users,
  Shield,
  Zap,
  Target
} from 'lucide-react'
import { intelligentNotificationManager } from '@/services/intelligentNotificationManager'

interface DoNotDisturbSchedule {
  id: string
  name: string
  startTime: string
  endTime: string
  days: number[]
  enabled: boolean
}

interface ContextRule {
  id: string
  name: string
  condition: {
    location?: string
    activity?: string
    timeRange?: { start: string; end: string }
    device?: string
  }
  action: 'allow' | 'suppress' | 'delay' | 'modify'
  parameters: Record<string, any>
}

const IntelligentNotificationManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dnd')
  const [userId, setUserId] = useState('user123')
  
  // DND Settings
  const [dndEnabled, setDndEnabled] = useState(false)
  const [emergencyOverride, setEmergencyOverride] = useState(true)
  const [smartMode, setSmartMode] = useState(true)
  const [allowedCategories, setAllowedCategories] = useState<string[]>(['emergency'])
  const [dndSchedules, setDndSchedules] = useState<DoNotDisturbSchedule[]>([])
  
  // Context Rules
  const [contextRules, setContextRules] = useState<ContextRule[]>([])
  const [newRuleName, setNewRuleName] = useState('')
  const [newRuleCondition, setNewRuleCondition] = useState<any>({})
  const [newRuleAction, setNewRuleAction] = useState<'allow' | 'suppress' | 'delay' | 'modify'>('suppress')
  
  // Action Button Preferences
  const [maxButtons, setMaxButtons] = useState(3)
  const [smartSuggestions, setSmartSuggestions] = useState(true)
  const [preferredActions, setPreferredActions] = useState<Record<string, string[]>>({
    ride: ['track', 'contact'],
    payment: ['receipt'],
    promotion: ['use', 'save'],
    emergency: ['view', 'call']
  })
  
  // Analytics
  const [analytics, setAnalytics] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    loadUserSettings()
    loadAnalytics()
  }, [userId])

  const loadUserSettings = async () => {
    // In a real implementation, this would load from the intelligent notification manager
    // For now, we'll set some default values
    setDndSchedules([
      {
        id: 'sleep',
        name: 'Sleep Hours',
        startTime: '23:00',
        endTime: '07:00',
        days: [0, 1, 2, 3, 4, 5, 6],
        enabled: true
      },
      {
        id: 'work',
        name: 'Work Focus',
        startTime: '09:00',
        endTime: '12:00',
        days: [1, 2, 3, 4, 5],
        enabled: false
      }
    ])

    setContextRules([
      {
        id: 'work_promo_filter',
        name: 'Filter promotions during work',
        condition: {
          timeRange: { start: '09:00', end: '17:00' },
          activity: 'working'
        },
        action: 'suppress',
        parameters: { categories: ['promotion'] }
      },
      {
        id: 'driving_quiet',
        name: 'Quiet notifications while driving',
        condition: {
          activity: 'driving'
        },
        action: 'modify',
        parameters: { makeQuiet: true }
      }
    ])
  }

  const loadAnalytics = async () => {
    try {
      const analyticsData = intelligentNotificationManager.getEnhancedAnalytics()
      setAnalytics(analyticsData)
    } catch (error) {
      console.error('Error loading analytics:', error)
    }
  }

  const handleUpdateDNDSettings = async () => {
    setLoading(true)
    setMessage(null)

    try {
      await intelligentNotificationManager.updateUserDNDSettings(userId, {
        enabled: dndEnabled,
        emergencyOverride,
        smartMode,
        allowedCategories,
        schedules: dndSchedules
      })

      setMessage({ type: 'success', text: 'DND settings updated successfully!' })
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update DND settings' })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateActionPreferences = async () => {
    setLoading(true)
    setMessage(null)

    try {
      await intelligentNotificationManager.updateActionButtonPreferences(userId, {
        maxButtons,
        smartSuggestions,
        preferredActions,
        customActions: []
      })

      setMessage({ type: 'success', text: 'Action preferences updated successfully!' })
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update action preferences' })
    } finally {
      setLoading(false)
    }
  }

  const handleAddContextRule = async () => {
    if (!newRuleName) {
      setMessage({ type: 'error', text: 'Please enter a rule name' })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const newRule: ContextRule = {
        id: `rule_${Date.now()}`,
        name: newRuleName,
        condition: newRuleCondition,
        action: newRuleAction,
        parameters: {}
      }

      await intelligentNotificationManager.addContextRule(userId, newRule)
      setContextRules([...contextRules, newRule])
      setNewRuleName('')
      setNewRuleCondition({})
      setMessage({ type: 'success', text: 'Context rule added successfully!' })
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to add context rule' })
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveContextRule = (ruleId: string) => {
    setContextRules(contextRules.filter(rule => rule.id !== ruleId))
    setMessage({ type: 'success', text: 'Context rule removed' })
  }

  const handleAddDNDSchedule = () => {
    const newSchedule: DoNotDisturbSchedule = {
      id: `schedule_${Date.now()}`,
      name: 'New Schedule',
      startTime: '22:00',
      endTime: '08:00',
      days: [0, 1, 2, 3, 4, 5, 6],
      enabled: true
    }
    setDndSchedules([...dndSchedules, newSchedule])
  }

  const handleRemoveDNDSchedule = (scheduleId: string) => {
    setDndSchedules(dndSchedules.filter(schedule => schedule.id !== scheduleId))
  }

  const handleUpdateDNDSchedule = (scheduleId: string, updates: Partial<DoNotDisturbSchedule>) => {
    setDndSchedules(dndSchedules.map(schedule => 
      schedule.id === scheduleId ? { ...schedule, ...updates } : schedule
    ))
  }

  const getDayName = (dayIndex: number): string => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    return days[dayIndex]
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'allow': return <Shield className="h-4 w-4 text-green-500" />
      case 'suppress': return <Moon className="h-4 w-4 text-red-500" />
      case 'delay': return <Clock className="h-4 w-4 text-yellow-500" />
      case 'modify': return <Settings className="h-4 w-4 text-blue-500" />
      default: return <Filter className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Brain className="h-6 w-6 text-purple-600" />
        <h2 className="text-2xl font-bold">Intelligent Notification Manager</h2>
      </div>

      {message && (
        <Alert className={message.type === 'error' ? 'border-red-500' : 'border-green-500'}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <div className="mb-4">
        <Label htmlFor="userId">User ID</Label>
        <Input
          id="userId"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          placeholder="Enter user ID"
          className="max-w-xs"
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dnd">Do Not Disturb</TabsTrigger>
          <TabsTrigger value="context">Context Rules</TabsTrigger>
          <TabsTrigger value="actions">Action Buttons</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="dnd" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Moon className="h-5 w-5" />
                Do Not Disturb Settings
              </CardTitle>
              <CardDescription>
                Configure when and how notifications should be filtered or suppressed
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable Do Not Disturb</Label>
                  <p className="text-sm text-gray-500">Master switch for DND functionality</p>
                </div>
                <Switch checked={dndEnabled} onCheckedChange={setDndEnabled} />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label>Emergency Override</Label>
                  <p className="text-sm text-gray-500">Allow emergency notifications even during DND</p>
                </div>
                <Switch checked={emergencyOverride} onCheckedChange={setEmergencyOverride} />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Smart Mode</Label>
                  <p className="text-sm text-gray-500">AI-powered DND based on user activity</p>
                </div>
                <Switch checked={smartMode} onCheckedChange={setSmartMode} />
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>DND Schedules</Label>
                  <Button size="sm" onClick={handleAddDNDSchedule}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Schedule
                  </Button>
                </div>

                {dndSchedules.map((schedule) => (
                  <Card key={schedule.id} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Input
                          value={schedule.name}
                          onChange={(e) => handleUpdateDNDSchedule(schedule.id, { name: e.target.value })}
                          className="max-w-xs"
                        />
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={schedule.enabled}
                            onCheckedChange={(enabled) => handleUpdateDNDSchedule(schedule.id, { enabled })}
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRemoveDNDSchedule(schedule.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Start Time</Label>
                          <Input
                            type="time"
                            value={schedule.startTime}
                            onChange={(e) => handleUpdateDNDSchedule(schedule.id, { startTime: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label>End Time</Label>
                          <Input
                            type="time"
                            value={schedule.endTime}
                            onChange={(e) => handleUpdateDNDSchedule(schedule.id, { endTime: e.target.value })}
                          />
                        </div>
                      </div>

                      <div>
                        <Label>Days</Label>
                        <div className="flex gap-2 mt-1">
                          {[0, 1, 2, 3, 4, 5, 6].map((day) => (
                            <Button
                              key={day}
                              size="sm"
                              variant={schedule.days.includes(day) ? 'default' : 'outline'}
                              onClick={() => {
                                const newDays = schedule.days.includes(day)
                                  ? schedule.days.filter(d => d !== day)
                                  : [...schedule.days, day]
                                handleUpdateDNDSchedule(schedule.id, { days: newDays })
                              }}
                            >
                              {getDayName(day)}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              <Button onClick={handleUpdateDNDSettings} disabled={loading} className="w-full">
                {loading ? 'Updating...' : 'Update DND Settings'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="context" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Contextual Filtering Rules
              </CardTitle>
              <CardDescription>
                Create rules to filter notifications based on location, activity, time, and device context
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Label>Existing Context Rules</Label>
                {contextRules.map((rule) => (
                  <Card key={rule.id} className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getActionIcon(rule.action)}
                        <div>
                          <p className="font-medium">{rule.name}</p>
                          <p className="text-sm text-gray-500">
                            Action: {rule.action}
                            {rule.condition.timeRange && (
                              <span className="ml-2">
                                Time: {rule.condition.timeRange.start} - {rule.condition.timeRange.end}
                              </span>
                            )}
                            {rule.condition.activity && (
                              <span className="ml-2">Activity: {rule.condition.activity}</span>
                            )}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRemoveContextRule(rule.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>

              <Separator />

              <div className="space-y-3">
                <Label>Add New Context Rule</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Rule Name</Label>
                    <Input
                      value={newRuleName}
                      onChange={(e) => setNewRuleName(e.target.value)}
                      placeholder="Enter rule name"
                    />
                  </div>
                  <div>
                    <Label>Action</Label>
                    <Select value={newRuleAction} onValueChange={(value: any) => setNewRuleAction(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="allow">Allow</SelectItem>
                        <SelectItem value="suppress">Suppress</SelectItem>
                        <SelectItem value="delay">Delay</SelectItem>
                        <SelectItem value="modify">Modify</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Start Time (Optional)</Label>
                    <Input
                      type="time"
                      onChange={(e) => setNewRuleCondition({
                        ...newRuleCondition,
                        timeRange: { ...newRuleCondition.timeRange, start: e.target.value }
                      })}
                    />
                  </div>
                  <div>
                    <Label>End Time (Optional)</Label>
                    <Input
                      type="time"
                      onChange={(e) => setNewRuleCondition({
                        ...newRuleCondition,
                        timeRange: { ...newRuleCondition.timeRange, end: e.target.value }
                      })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Activity (Optional)</Label>
                    <Select onValueChange={(value) => setNewRuleCondition({ ...newRuleCondition, activity: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select activity" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="working">Working</SelectItem>
                        <SelectItem value="sleeping">Sleeping</SelectItem>
                        <SelectItem value="driving">Driving</SelectItem>
                        <SelectItem value="leisure">Leisure</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Location (Optional)</Label>
                    <Select onValueChange={(value) => setNewRuleCondition({ ...newRuleCondition, location: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select location" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="home">Home</SelectItem>
                        <SelectItem value="work">Work</SelectItem>
                        <SelectItem value="commute">Commute</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button onClick={handleAddContextRule} disabled={loading}>
                  {loading ? 'Adding...' : 'Add Context Rule'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="actions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Action Button Preferences
              </CardTitle>
              <CardDescription>
                Configure smart action buttons that appear on notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Maximum Action Buttons</Label>
                  <Select value={maxButtons.toString()} onValueChange={(value) => setMaxButtons(parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 Button</SelectItem>
                      <SelectItem value="2">2 Buttons</SelectItem>
                      <SelectItem value="3">3 Buttons</SelectItem>
                      <SelectItem value="4">4 Buttons</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Smart Suggestions</Label>
                    <p className="text-sm text-gray-500">AI-powered action suggestions</p>
                  </div>
                  <Switch checked={smartSuggestions} onCheckedChange={setSmartSuggestions} />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <Label>Preferred Actions by Category</Label>
                {Object.entries(preferredActions).map(([category, actions]) => (
                  <div key={category} className="space-y-2">
                    <Label className="capitalize">{category} Notifications</Label>
                    <div className="flex flex-wrap gap-2">
                      {actions.map((action) => (
                        <Badge key={action} variant="outline" className="capitalize">
                          {action}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <Button onClick={handleUpdateActionPreferences} disabled={loading} className="w-full">
                {loading ? 'Updating...' : 'Update Action Preferences'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Total Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.activeUsers || 0}</div>
                <p className="text-sm text-gray-500">Active users with preferences</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Moon className="h-5 w-5" />
                  DND Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.dndUsers || 0}</div>
                <p className="text-sm text-gray-500">Users with DND enabled</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Smart DND
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.smartDndUsers || 0}</div>
                <p className="text-sm text-gray-500">Users with smart DND</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Context Rules
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.contextualFilteringUsers || 0}</div>
                <p className="text-sm text-gray-500">Users with context filtering</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Intelligent Management Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Average Engagement Score</Label>
                  <div className="text-xl font-semibold">
                    {analytics?.averageEngagementScore?.toFixed(1) || '0.0'}%
                  </div>
                </div>
                <div>
                  <Label>Active Optimization Rules</Label>
                  <div className="text-xl font-semibold">
                    {analytics?.optimizationRules || 0}
                  </div>
                </div>
                <div>
                  <Label>Notification Groups</Label>
                  <div className="text-xl font-semibold">
                    {analytics?.totalGroups || 0}
                  </div>
                </div>
                <div>
                  <Label>Batched Notifications</Label>
                  <div className="text-xl font-semibold">
                    {analytics?.totalBatches || 0}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default IntelligentNotificationManager