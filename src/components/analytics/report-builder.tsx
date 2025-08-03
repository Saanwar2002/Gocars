'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Minus, 
  Save, 
  Play, 
  Download, 
  Calendar, 
  Clock,
  Filter,
  BarChart3,
  PieChart,
  LineChart,
  Table,
  FileText,
  Settings,
  Eye,
  Edit,
  Trash2,
  Copy
} from 'lucide-react';
import { 
  businessIntelligenceService, 
  CustomReport, 
  ReportFilter, 
  ReportSchedule, 
  DateRange 
} from '@/services/businessIntelligenceService';
import { useToast } from '@/hooks/use-toast';

interface ReportBuilderProps {
  userId: string;
  onReportCreated?: (report: CustomReport) => void;
}

interface MetricOption {
  id: string;
  name: string;
  category: string;
  description: string;
  type: 'number' | 'currency' | 'percentage' | 'rating';
}

export function ReportBuilder({ userId, onReportCreated }: ReportBuilderProps) {
  const [activeTab, setActiveTab] = useState('builder');
  const [reports, setReports] = useState<CustomReport[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Report builder state
  const [reportName, setReportName] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [reportType, setReportType] = useState<'dashboard' | 'table' | 'chart' | 'export'>('dashboard');
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);
  const [filters, setFilters] = useState<ReportFilter[]>([]);
  const [dateRange, setDateRange] = useState<DateRange>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    end: new Date(),
    preset: 'last_30_days'
  });
  const [schedule, setSchedule] = useState<ReportSchedule>({
    frequency: 'weekly',
    time: '09:00',
    dayOfWeek: 1,
    timezone: 'UTC',
    enabled: false
  });
  const [reportFormat, setReportFormat] = useState<'pdf' | 'excel' | 'csv' | 'json'>('pdf');
  const [recipients, setRecipients] = useState<string[]>([]);
  const [newRecipient, setNewRecipient] = useState('');

  const availableMetrics: MetricOption[] = [
    // Financial Metrics
    { id: 'total_revenue', name: 'Total Revenue', category: 'Financial', description: 'Total revenue across all sources', type: 'currency' },
    { id: 'ride_revenue', name: 'Ride Revenue', category: 'Financial', description: 'Revenue from ride bookings', type: 'currency' },
    { id: 'subscription_revenue', name: 'Subscription Revenue', category: 'Financial', description: 'Revenue from subscriptions', type: 'currency' },
    { id: 'average_revenue_per_ride', name: 'Avg Revenue per Ride', category: 'Financial', description: 'Average revenue generated per ride', type: 'currency' },
    { id: 'average_revenue_per_user', name: 'Avg Revenue per User', category: 'Financial', description: 'Average revenue per active user', type: 'currency' },
    
    // Operational Metrics
    { id: 'total_rides', name: 'Total Rides', category: 'Operational', description: 'Total number of rides', type: 'number' },
    { id: 'completed_rides', name: 'Completed Rides', category: 'Operational', description: 'Number of successfully completed rides', type: 'number' },
    { id: 'cancelled_rides', name: 'Cancelled Rides', category: 'Operational', description: 'Number of cancelled rides', type: 'number' },
    { id: 'completion_rate', name: 'Completion Rate', category: 'Operational', description: 'Percentage of rides completed successfully', type: 'percentage' },
    { id: 'average_wait_time', name: 'Average Wait Time', category: 'Operational', description: 'Average time passengers wait for pickup', type: 'number' },
    { id: 'average_ride_time', name: 'Average Ride Time', category: 'Operational', description: 'Average duration of rides', type: 'number' },
    
    // Customer Metrics
    { id: 'total_users', name: 'Total Users', category: 'Customer', description: 'Total registered users', type: 'number' },
    { id: 'active_users', name: 'Active Users', category: 'Customer', description: 'Users active in the period', type: 'number' },
    { id: 'new_users', name: 'New Users', category: 'Customer', description: 'New user registrations', type: 'number' },
    { id: 'user_retention_rate', name: 'User Retention Rate', category: 'Customer', description: 'Percentage of users retained', type: 'percentage' },
    { id: 'customer_satisfaction', name: 'Customer Satisfaction', category: 'Customer', description: 'Average customer satisfaction rating', type: 'rating' },
    { id: 'net_promoter_score', name: 'Net Promoter Score', category: 'Customer', description: 'Customer loyalty metric', type: 'number' },
    
    // Driver Metrics
    { id: 'total_drivers', name: 'Total Drivers', category: 'Driver', description: 'Total registered drivers', type: 'number' },
    { id: 'active_drivers', name: 'Active Drivers', category: 'Driver', description: 'Drivers active in the period', type: 'number' },
    { id: 'new_drivers', name: 'New Drivers', category: 'Driver', description: 'New driver registrations', type: 'number' },
    { id: 'driver_retention_rate', name: 'Driver Retention Rate', category: 'Driver', description: 'Percentage of drivers retained', type: 'percentage' },
    { id: 'average_driver_rating', name: 'Average Driver Rating', category: 'Driver', description: 'Average driver rating', type: 'rating' },
    { id: 'average_driver_earnings', name: 'Average Driver Earnings', category: 'Driver', description: 'Average earnings per driver', type: 'currency' }
  ];

  const filterOperators = [
    { value: 'equals', label: 'Equals' },
    { value: 'not_equals', label: 'Not Equals' },
    { value: 'greater_than', label: 'Greater Than' },
    { value: 'less_than', label: 'Less Than' },
    { value: 'contains', label: 'Contains' },
    { value: 'in', label: 'In' },
    { value: 'between', label: 'Between' }
  ];

  useEffect(() => {
    loadReports();
  }, [userId]);

  const loadReports = async () => {
    try {
      const reportsData = await businessIntelligenceService.getCustomReports(userId);
      setReports(reportsData);
    } catch (error) {
      console.error('Error loading reports:', error);
      toast({
        title: 'Error',
        description: 'Failed to load reports. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const handleMetricToggle = (metricId: string) => {
    setSelectedMetrics(prev => 
      prev.includes(metricId) 
        ? prev.filter(id => id !== metricId)
        : [...prev, metricId]
    );
  };

  const addFilter = () => {
    const newFilter: ReportFilter = {
      field: '',
      operator: 'equals',
      value: '',
      label: ''
    };
    setFilters(prev => [...prev, newFilter]);
  };

  const updateFilter = (index: number, updates: Partial<ReportFilter>) => {
    setFilters(prev => prev.map((filter, i) => 
      i === index ? { ...filter, ...updates } : filter
    ));
  };

  const removeFilter = (index: number) => {
    setFilters(prev => prev.filter((_, i) => i !== index));
  };

  const addRecipient = () => {
    if (newRecipient && !recipients.includes(newRecipient)) {
      setRecipients(prev => [...prev, newRecipient]);
      setNewRecipient('');
    }
  };

  const removeRecipient = (email: string) => {
    setRecipients(prev => prev.filter(r => r !== email));
  };

  const handleCreateReport = async () => {
    if (!reportName || selectedMetrics.length === 0) {
      toast({
        title: 'Error',
        description: 'Please provide a report name and select at least one metric.',
        variant: 'destructive'
      });
      return;
    }

    try {
      setLoading(true);
      
      const reportData = {
        name: reportName,
        description: reportDescription,
        type: reportType,
        metrics: selectedMetrics,
        filters,
        dateRange,
        schedule: schedule.enabled ? schedule : undefined,
        format: reportFormat,
        recipients,
        createdBy: userId
      };

      const reportId = await businessIntelligenceService.createCustomReport(reportData);
      
      toast({
        title: 'Success',
        description: 'Report created successfully.',
      });

      // Reset form
      setReportName('');
      setReportDescription('');
      setSelectedMetrics([]);
      setFilters([]);
      setRecipients([]);
      
      // Reload reports
      await loadReports();
      
      if (onReportCreated) {
        onReportCreated({ id: reportId, ...reportData } as CustomReport);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create report. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async (reportId: string) => {
    try {
      const blob = await businessIntelligenceService.generateReport(reportId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report-${reportId}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: 'Success',
        description: 'Report generated and downloaded successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate report. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const getMetricsByCategory = (category: string) => {
    return availableMetrics.filter(metric => metric.category === category);
  };

  const categories = [...new Set(availableMetrics.map(metric => metric.category))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Report Builder</h1>
          <p className="text-gray-600">Create custom reports and schedule automated delivery</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="builder">Report Builder</TabsTrigger>
          <TabsTrigger value="reports">My Reports</TabsTrigger>
        </TabsList>

        {/* Report Builder Tab */}
        <TabsContent value="builder" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Report Configuration */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Report Configuration</CardTitle>
                <CardDescription>Configure your custom report settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="reportName">Report Name</Label>
                    <Input
                      id="reportName"
                      placeholder="Enter report name"
                      value={reportName}
                      onChange={(e) => setReportName(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="reportDescription">Description</Label>
                    <Textarea
                      id="reportDescription"
                      placeholder="Describe what this report shows"
                      value={reportDescription}
                      onChange={(e) => setReportDescription(e.target.value)}
                      rows={3}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="reportType">Report Type</Label>
                      <Select value={reportType} onValueChange={(value: any) => setReportType(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="dashboard">Dashboard</SelectItem>
                          <SelectItem value="table">Table</SelectItem>
                          <SelectItem value="chart">Chart</SelectItem>
                          <SelectItem value="export">Export</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="reportFormat">Format</Label>
                      <Select value={reportFormat} onValueChange={(value: any) => setReportFormat(value)}>
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
                  </div>
                </div>

                <Separator />

                {/* Metrics Selection */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Select Metrics</Label>
                    <Badge variant="secondary">
                      {selectedMetrics.length} selected
                    </Badge>
                  </div>
                  
                  <ScrollArea className="h-64 border rounded-lg p-4">
                    {categories.map(category => (
                      <div key={category} className="mb-4">
                        <h4 className="font-medium text-sm text-gray-700 mb-2">{category}</h4>
                        <div className="space-y-2">
                          {getMetricsByCategory(category).map(metric => (
                            <div key={metric.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={metric.id}
                                checked={selectedMetrics.includes(metric.id)}
                                onCheckedChange={() => handleMetricToggle(metric.id)}
                              />
                              <div className="flex-1">
                                <Label htmlFor={metric.id} className="text-sm font-medium">
                                  {metric.name}
                                </Label>
                                <p className="text-xs text-gray-500">{metric.description}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </ScrollArea>
                </div>

                <Separator />

                {/* Filters */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Filters</Label>
                    <Button variant="outline" size="sm" onClick={addFilter}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Filter
                    </Button>
                  </div>
                  
                  {filters.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No filters added. Click "Add Filter" to create one.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {filters.map((filter, index) => (
                        <div key={index} className="flex items-center space-x-2 p-3 border rounded-lg">
                          <Select 
                            value={filter.field} 
                            onValueChange={(value) => updateFilter(index, { field: value })}
                          >
                            <SelectTrigger className="w-40">
                              <SelectValue placeholder="Field" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableMetrics.map(metric => (
                                <SelectItem key={metric.id} value={metric.id}>
                                  {metric.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          
                          <Select 
                            value={filter.operator} 
                            onValueChange={(value: any) => updateFilter(index, { operator: value })}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {filterOperators.map(op => (
                                <SelectItem key={op.value} value={op.value}>
                                  {op.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          
                          <Input
                            placeholder="Value"
                            value={filter.value}
                            onChange={(e) => updateFilter(index, { value: e.target.value })}
                            className="flex-1"
                          />
                          
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => removeFilter(index)}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Separator />

                {/* Date Range */}
                <div className="space-y-4">
                  <Label>Date Range</Label>
                  <DatePickerWithRange
                    date={dateRange}
                    onDateChange={(range) => setDateRange(range || dateRange)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Schedule & Delivery */}
            <Card>
              <CardHeader>
                <CardTitle>Schedule & Delivery</CardTitle>
                <CardDescription>Configure automated report delivery</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Schedule */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="enableSchedule"
                      checked={schedule.enabled}
                      onCheckedChange={(checked) => 
                        setSchedule(prev => ({ ...prev, enabled: !!checked }))
                      }
                    />
                    <Label htmlFor="enableSchedule">Enable Scheduling</Label>
                  </div>
                  
                  {schedule.enabled && (
                    <div className="space-y-3 pl-6">
                      <div>
                        <Label>Frequency</Label>
                        <Select 
                          value={schedule.frequency} 
                          onValueChange={(value: any) => 
                            setSchedule(prev => ({ ...prev, frequency: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="quarterly">Quarterly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label>Time</Label>
                        <Input
                          type="time"
                          value={schedule.time}
                          onChange={(e) => 
                            setSchedule(prev => ({ ...prev, time: e.target.value }))
                          }
                        />
                      </div>
                      
                      {schedule.frequency === 'weekly' && (
                        <div>
                          <Label>Day of Week</Label>
                          <Select 
                            value={schedule.dayOfWeek?.toString()} 
                            onValueChange={(value) => 
                              setSchedule(prev => ({ ...prev, dayOfWeek: parseInt(value) }))
                            }
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
                    </div>
                  )}
                </div>

                <Separator />

                {/* Recipients */}
                <div className="space-y-3">
                  <Label>Email Recipients</Label>
                  
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Enter email address"
                      value={newRecipient}
                      onChange={(e) => setNewRecipient(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addRecipient()}
                    />
                    <Button variant="outline" onClick={addRecipient}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {recipients.length > 0 && (
                    <div className="space-y-2">
                      {recipients.map((email, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span className="text-sm">{email}</span>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => removeRecipient(email)}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Separator />

                {/* Actions */}
                <div className="space-y-2">
                  <Button 
                    onClick={handleCreateReport} 
                    disabled={loading}
                    className="w-full"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {loading ? 'Creating...' : 'Create Report'}
                  </Button>
                  
                  <Button variant="outline" className="w-full">
                    <Eye className="h-4 w-4 mr-2" />
                    Preview Report
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* My Reports Tab */}
        <TabsContent value="reports" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reports.length === 0 ? (
              <Card className="md:col-span-2 lg:col-span-3">
                <CardContent className="p-8 text-center">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No reports created yet. Use the Report Builder to create your first report.</p>
                </CardContent>
              </Card>
            ) : (
              reports.map((report) => (
                <Card key={report.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{report.name}</CardTitle>
                      <Badge variant="outline">{report.type}</Badge>
                    </div>
                    <CardDescription>{report.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-sm text-gray-600">
                      <p>Metrics: {report.metrics.length}</p>
                      <p>Format: {report.format.toUpperCase()}</p>
                      {report.schedule?.enabled && (
                        <p>Schedule: {report.schedule.frequency}</p>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button 
                        size="sm" 
                        onClick={() => handleGenerateReport(report.id)}
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Run
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}