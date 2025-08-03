'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { 
  Calendar, 
  Clock, 
  Mail, 
  Plus, 
  Minus,
  Save,
  Play,
  Pause,
  Edit,
  Trash2,
  Users,
  Settings,
  AlertCircle
} from 'lucide-react';
import { 
  reportingService, 
  ReportTemplate, 
  ReportSchedule 
} from '@/services/reportingService';
import { useToast } from '@/hooks/use-toast';

interface ReportSchedulerProps {
  templates: ReportTemplate[];
  onScheduleCreated?: (schedule: ReportSchedule) => void;
  onScheduleUpdated?: (schedule: ReportSchedule) => void;
}

export function ReportScheduler({ templates, onScheduleCreated, onScheduleUpdated }: ReportSchedulerProps) {
  const [schedules, setSchedules] = useState<ReportSchedule[]>([]);
  const [selectedSchedule, setSelectedSchedule] = useState<ReportSchedule | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    templateId: '',
    frequency: 'weekly' as const,
    time: '09:00',
    dayOfWeek: 1, // Monday
    dayOfMonth: 1,
    timezone: 'UTC',
    format: 'pdf' as const,
    recipients: [{ email: '', name: '', role: '' }],
    isActive: true
  });

  useEffect(() => {
    loadSchedules();
  }, []);

  const loadSchedules = async () => {
    try {
      setLoading(true);
      const schedulesData = await reportingService.getReportSchedules();
      setSchedules(schedulesData);
    } catch (error) {
      console.error('Error loading schedules:', error);
      toast({
        title: 'Error',
        description: 'Failed to load report schedules.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSchedule = async () => {
    if (!formData.name || !formData.templateId || formData.recipients.length === 0) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields.',
        variant: 'destructive'
      });
      return;
    }

    try {
      const nextRun = calculateNextRun(formData.frequency, formData.time, formData.dayOfWeek, formData.dayOfMonth);
      
      const scheduleId = await reportingService.createReportSchedule({
        ...formData,
        schedule: {
          time: formData.time,
          dayOfWeek: formData.frequency === 'weekly' ? formData.dayOfWeek : undefined,
          dayOfMonth: formData.frequency === 'monthly' ? formData.dayOfMonth : undefined,
          timezone: formData.timezone
        },
        parameters: {},
        filters: [],
        nextRun,
        createdBy: 'current-user' // Replace with actual user ID
      });

      toast({
        title: 'Success',
        description: 'Report schedule created successfully.',
      });

      setShowCreateForm(false);
      resetForm();
      await loadSchedules();
      
      if (onScheduleCreated) {
        const newSchedule = schedules.find(s => s.id === scheduleId);
        if (newSchedule) onScheduleCreated(newSchedule);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create schedule. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const handleToggleSchedule = async (scheduleId: string, isActive: boolean) => {
    try {
      await reportingService.updateReportSchedule(scheduleId, { isActive });
      
      setSchedules(prev => prev.map(schedule => 
        schedule.id === scheduleId ? { ...schedule, isActive } : schedule
      ));

      toast({
        title: 'Success',
        description: `Schedule ${isActive ? 'activated' : 'deactivated'} successfully.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update schedule status.',
        variant: 'destructive'
      });
    }
  };

  const calculateNextRun = (frequency: string, time: string, dayOfWeek?: number, dayOfMonth?: number): Date => {
    const now = new Date();
    const [hours, minutes] = time.split(':').map(Number);
    
    let nextRun = new Date();
    nextRun.setHours(hours, minutes, 0, 0);

    switch (frequency) {
      case 'daily':
        if (nextRun <= now) {
          nextRun.setDate(nextRun.getDate() + 1);
        }
        break;
      case 'weekly':
        const currentDay = nextRun.getDay();
        const targetDay = dayOfWeek || 1;
        const daysUntilTarget = (targetDay - currentDay + 7) % 7;
        
        if (daysUntilTarget === 0 && nextRun <= now) {
          nextRun.setDate(nextRun.getDate() + 7);
        } else {
          nextRun.setDate(nextRun.getDate() + daysUntilTarget);
        }
        break;
      case 'monthly':
        nextRun.setDate(dayOfMonth || 1);
        if (nextRun <= now) {
          nextRun.setMonth(nextRun.getMonth() + 1);
        }
        break;
    }

    return nextRun;
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      templateId: '',
      frequency: 'weekly',
      time: '09:00',
      dayOfWeek: 1,
      dayOfMonth: 1,
      timezone: 'UTC',
      format: 'pdf',
      recipients: [{ email: '', name: '', role: '' }],
      isActive: true
    });
  };

  const addRecipient = () => {
    setFormData(prev => ({
      ...prev,
      recipients: [...prev.recipients, { email: '', name: '', role: '' }]
    }));
  };

  const removeRecipient = (index: number) => {
    setFormData(prev => ({
      ...prev,
      recipients: prev.recipients.filter((_, i) => i !== index)
    }));
  };

  const updateRecipient = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      recipients: prev.recipients.map((recipient, i) => 
        i === index ? { ...recipient, [field]: value } : recipient
      )
    }));
  };

  const getFrequencyText = (schedule: ReportSchedule) => {
    const { frequency, schedule: scheduleConfig } = schedule;
    const time = scheduleConfig.time;
    
    switch (frequency) {
      case 'daily':
        return `Daily at ${time}`;
      case 'weekly':
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayName = days[scheduleConfig.dayOfWeek || 1];
        return `Weekly on ${dayName} at ${time}`;
      case 'monthly':
        return `Monthly on day ${scheduleConfig.dayOfMonth} at ${time}`;
      case 'quarterly':
        return `Quarterly at ${time}`;
      case 'yearly':
        return `Yearly at ${time}`;
      default:
        return frequency;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Report Scheduler</h2>
          <p className="text-gray-600">Automate report generation and delivery</p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Schedule
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Schedules List */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Active Schedules</CardTitle>
            <CardDescription>Manage your automated report schedules</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              <div className="space-y-3">
                {schedules.map((schedule) => (
                  <div 
                    key={schedule.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedSchedule?.id === schedule.id ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedSchedule(schedule)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{schedule.name}</h4>
                      <div className="flex items-center space-x-2">
                        <Badge variant={schedule.isActive ? 'default' : 'secondary'}>
                          {schedule.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        <Switch
                          checked={schedule.isActive}
                          onCheckedChange={(checked) => handleToggleSchedule(schedule.id, checked)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2">{schedule.description}</p>
                    
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-4">
                        <span className="flex items-center text-gray-500">
                          <Clock className="h-4 w-4 mr-1" />
                          {getFrequencyText(schedule)}
                        </span>
                        <span className="flex items-center text-gray-500">
                          <Mail className="h-4 w-4 mr-1" />
                          {schedule.recipients.length} recipients
                        </span>
                      </div>
                      <div className="text-gray-500">
                        Next: {schedule.nextRun.toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
                
                {schedules.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>No schedules created yet. Click "New Schedule" to get started.</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Schedule Form / Details */}
        <Card>
          <CardHeader>
            <CardTitle>
              {showCreateForm ? 'Create Schedule' : selectedSchedule ? 'Schedule Details' : 'Schedule Info'}
            </CardTitle>
            <CardDescription>
              {showCreateForm 
                ? 'Set up automated report delivery'
                : selectedSchedule 
                  ? 'View and manage schedule settings'
                  : 'Select a schedule to view details'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {showCreateForm ? (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Schedule Name</label>
                  <Input
                    placeholder="Enter schedule name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    placeholder="Describe this schedule"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows={2}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Report Template</label>
                  <Select 
                    value={formData.templateId} 
                    onValueChange={(value) => setFormData({...formData, templateId: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select template" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium">Frequency</label>
                    <Select 
                      value={formData.frequency} 
                      onValueChange={(value: any) => setFormData({...formData, frequency: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Time</label>
                    <Input
                      type="time"
                      value={formData.time}
                      onChange={(e) => setFormData({...formData, time: e.target.value})}
                    />
                  </div>
                </div>
                
                {formData.frequency === 'weekly' && (
                  <div>
                    <label className="text-sm font-medium">Day of Week</label>
                    <Select 
                      value={formData.dayOfWeek.toString()} 
                      onValueChange={(value) => setFormData({...formData, dayOfWeek: parseInt(value)})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Sunday</SelectItem>
                        <SelectItem value="1">Monday</SelectItem>
                        <SelectItem value="2">Tuesday</SelectItem>
                        <SelectItem value="3">Wednesday</SelectItem>
                        <SelectItem value="4">Thursday</SelectItem>
                        <SelectItem value="5">Friday</SelectItem>
                        <SelectItem value="6">Saturday</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                {formData.frequency === 'monthly' && (
                  <div>
                    <label className="text-sm font-medium">Day of Month</label>
                    <Input
                      type="number"
                      min="1"
                      max="31"
                      value={formData.dayOfMonth}
                      onChange={(e) => setFormData({...formData, dayOfMonth: parseInt(e.target.value)})}
                    />
                  </div>
                )}
                
                <div>
                  <label className="text-sm font-medium">Export Format</label>
                  <Select 
                    value={formData.format} 
                    onValueChange={(value: any) => setFormData({...formData, format: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="excel">Excel</SelectItem>
                      <SelectItem value="csv">CSV</SelectItem>
                      <SelectItem value="json">JSON</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium">Recipients</label>
                    <Button variant="outline" size="sm" onClick={addRecipient}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    {formData.recipients.map((recipient, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Input
                          placeholder="Email"
                          value={recipient.email}
                          onChange={(e) => updateRecipient(index, 'email', e.target.value)}
                          className="flex-1"
                        />
                        <Input
                          placeholder="Name"
                          value={recipient.name}
                          onChange={(e) => updateRecipient(index, 'name', e.target.value)}
                          className="flex-1"
                        />
                        {formData.recipients.length > 1 && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => removeRecipient(index)}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({...formData, isActive: !!checked})}
                  />
                  <label htmlFor="isActive" className="text-sm">
                    Activate schedule immediately
                  </label>
                </div>
                
                <div className="flex items-center space-x-2 pt-4">
                  <Button onClick={handleCreateSchedule}>
                    <Save className="h-4 w-4 mr-2" />
                    Create Schedule
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowCreateForm(false);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : selectedSchedule ? (
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Schedule Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Template:</span>
                      <span>{templates.find(t => t.id === selectedSchedule.templateId)?.name || 'Unknown'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Frequency:</span>
                      <span>{getFrequencyText(selectedSchedule)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Format:</span>
                      <span className="uppercase">{selectedSchedule.format}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Recipients:</span>
                      <span>{selectedSchedule.recipients.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Next Run:</span>
                      <span>{selectedSchedule.nextRun.toLocaleString()}</span>
                    </div>
                    {selectedSchedule.lastRun && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Last Run:</span>
                        <span>{selectedSchedule.lastRun.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Recipients</h4>
                  <div className="space-y-1">
                    {selectedSchedule.recipients.map((recipient, index) => (
                      <div key={index} className="flex items-center space-x-2 text-sm">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span>{recipient.name || recipient.email}</span>
                        <span className="text-gray-500">({recipient.email})</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Actions</h4>
                  <div className="space-y-2">
                    <Button variant="outline" size="sm" className="w-full">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Schedule
                    </Button>
                    <Button variant="outline" size="sm" className="w-full">
                      <Play className="h-4 w-4 mr-2" />
                      Run Now
                    </Button>
                    <Button variant="outline" size="sm" className="w-full text-red-600">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Schedule
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <Settings className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>Select a schedule to view details and manage settings</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}