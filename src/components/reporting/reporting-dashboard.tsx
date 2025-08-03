'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { 
  FileText, 
  Plus, 
  Download, 
  Calendar, 
  Clock,
  Users,
  BarChart3,
  Settings,
  Play,
  Pause,
  Edit,
  Copy,
  Trash2,
  Eye,
  Mail,
  RefreshCw,
  Filter,
  Search,
  FileSpreadsheet,
  FileImage,
  FilePdf,
  FileJson,
  User
} from 'lucide-react';
import { 
  reportingService, 
  ReportTemplate, 
  GeneratedReport, 
  ReportSchedule,
  ReportSubscription,
  ReportAnalytics
} from '@/services/reportingService';
import { useToast } from '@/hooks/use-toast';

interface ReportingDashboardProps {
  userId: string;
  userRole: 'admin' | 'manager' | 'analyst';
}

export function ReportingDashboard({ userId, userRole }: ReportingDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('templates');
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [generatedReports, setGeneratedReports] = useState<GeneratedReport[]>([]);
  const [schedules, setSchedules] = useState<ReportSchedule[]>([]);
  const [subscriptions, setSubscriptions] = useState<ReportSubscription[]>([]);
  const [analytics, setAnalytics] = useState<ReportAnalytics | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const [showTemplateBuilder, setShowTemplateBuilder] = useState(false);
  const { toast } = useToast();

  // Template builder state
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    category: 'operational' as const,
    type: 'summary' as const
  });

  // Report generation state
  const [generationParams, setGenerationParams] = useState({
    format: 'pdf' as const,
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    endDate: new Date()
  });

  useEffect(() => {
    loadDashboardData();
  }, [userId]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      const [
        templatesData,
        reportsData,
        schedulesData,
        subscriptionsData,
        analyticsData
      ] = await Promise.all([
        reportingService.getReportTemplates(),
        reportingService.getGeneratedReports(userId),
        reportingService.getReportSchedules(userId),
        reportingService.getReportSubscriptions(userId),
        reportingService.getReportAnalytics()
      ]);

      setTemplates(templatesData);
      setGeneratedReports(reportsData);
      setSchedules(schedulesData);
      setSubscriptions(subscriptionsData);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Error loading reporting data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load reporting data. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async (templateId: string) => {
    try {
      const reportId = await reportingService.generateReport(
        templateId,
        {
          startDate: generationParams.startDate,
          endDate: generationParams.endDate
        },
        [],
        generationParams.format,
        userId
      );

      toast({
        title: 'Success',
        description: 'Report generation started. You will be notified when it\'s ready.',
      });

      // Refresh generated reports
      setTimeout(() => {
        loadDashboardData();
      }, 3000);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate report. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const handleCreateTemplate = async () => {
    if (!newTemplate.name || !newTemplate.description) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields.',
        variant: 'destructive'
      });
      return;
    }

    try {
      const defaultTemplates = await reportingService.getDefaultTemplates();
      const baseTemplate = defaultTemplates.find(t => t.category === newTemplate.category);
      
      await reportingService.createReportTemplate({
        ...newTemplate,
        sections: baseTemplate?.sections || [],
        filters: [],
        parameters: [],
        layout: {
          pageSize: 'A4',
          orientation: 'portrait',
          margins: { top: 20, right: 20, bottom: 20, left: 20 },
          columns: 1,
          spacing: 10
        },
        styling: {
          theme: 'default',
          primaryColor: '#2563eb',
          secondaryColor: '#64748b',
          fontFamily: 'Inter',
          fontSize: 12,
          showLogo: true,
          showPageNumbers: true,
          showTimestamp: true
        },
        isPublic: false,
        createdBy: userId
      });

      setNewTemplate({
        name: '',
        description: '',
        category: 'operational',
        type: 'summary'
      });
      setShowTemplateBuilder(false);
      
      toast({
        title: 'Success',
        description: 'Report template created successfully.',
      });

      await loadDashboardData();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create template. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'generating': return 'bg-blue-100 text-blue-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'expired': return 'bg-gray-100 text-gray-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'pdf': return <FilePdf className="h-4 w-4 text-red-600" />;
      case 'excel': return <FileSpreadsheet className="h-4 w-4 text-green-600" />;
      case 'csv': return <FileSpreadsheet className="h-4 w-4 text-blue-600" />;
      case 'json': return <FileJson className="h-4 w-4 text-purple-600" />;
      default: return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
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
          <h1 className="text-3xl font-bold text-gray-900">Reporting Center</h1>
          <p className="text-gray-600">Create, manage, and distribute comprehensive reports</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={loadDashboardData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setShowTemplateBuilder(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Template
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <FileText className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Templates</p>
                <p className="text-2xl font-bold">{templates.length}</p>
                <p className="text-xs text-gray-500">
                  {templates.filter(t => t.createdBy === userId).length} created by you
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Download className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Generated Reports</p>
                <p className="text-2xl font-bold">{generatedReports.length}</p>
                <p className="text-xs text-gray-500">
                  {generatedReports.filter(r => r.status === 'completed').length} completed
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Calendar className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Scheduled Reports</p>
                <p className="text-2xl font-bold">{schedules.length}</p>
                <p className="text-xs text-gray-500">
                  {schedules.filter(s => s.isActive).length} active
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Mail className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Subscriptions</p>
                <p className="text-2xl font-bold">{subscriptions.length}</p>
                <p className="text-xs text-gray-500">
                  {subscriptions.filter(s => s.isActive).length} active
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="reports">Generated Reports</TabsTrigger>
          <TabsTrigger value="schedules">Schedules</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Templates List */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Report Templates</CardTitle>
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input placeholder="Search templates..." className="pl-10 w-64" />
                    </div>
                    <Button variant="outline" size="sm">
                      <Filter className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-3">
                    {templates.map((template) => (
                      <div 
                        key={template.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedTemplate?.id === template.id ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                        }`}
                        onClick={() => setSelectedTemplate(template)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{template.name}</h4>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline">{template.category}</Badge>
                            <Badge variant="secondary">{template.type}</Badge>
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                        
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center space-x-4">
                            <span className="text-gray-500">
                              {template.sections.length} sections
                            </span>
                            <span className="text-gray-500">
                              Used {template.usageCount} times
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button 
                              size="sm" 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleGenerateReport(template.id);
                              }}
                            >
                              <Play className="h-4 w-4 mr-1" />
                              Generate
                            </Button>
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Template Details / Builder */}
            <Card>
              <CardHeader>
                <CardTitle>
                  {showTemplateBuilder ? 'Create Template' : 'Template Details'}
                </CardTitle>
                <CardDescription>
                  {showTemplateBuilder 
                    ? 'Create a new report template'
                    : selectedTemplate 
                      ? 'Template configuration and actions'
                      : 'Select a template to view details'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {showTemplateBuilder ? (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Template Name</label>
                      <Input
                        placeholder="Enter template name"
                        value={newTemplate.name}
                        onChange={(e) => setNewTemplate({...newTemplate, name: e.target.value})}
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Description</label>
                      <Textarea
                        placeholder="Describe what this template generates"
                        value={newTemplate.description}
                        onChange={(e) => setNewTemplate({...newTemplate, description: e.target.value})}
                        rows={3}
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Category</label>
                      <Select 
                        value={newTemplate.category} 
                        onValueChange={(value: any) => setNewTemplate({...newTemplate, category: value})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="operational">Operational</SelectItem>
                          <SelectItem value="financial">Financial</SelectItem>
                          <SelectItem value="customer">Customer</SelectItem>
                          <SelectItem value="driver">Driver</SelectItem>
                          <SelectItem value="performance">Performance</SelectItem>
                          <SelectItem value="custom">Custom</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Type</label>
                      <Select 
                        value={newTemplate.type} 
                        onValueChange={(value: any) => setNewTemplate({...newTemplate, type: value})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="dashboard">Dashboard</SelectItem>
                          <SelectItem value="table">Table</SelectItem>
                          <SelectItem value="chart">Chart</SelectItem>
                          <SelectItem value="summary">Summary</SelectItem>
                          <SelectItem value="detailed">Detailed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex items-center space-x-2 pt-4">
                      <Button onClick={handleCreateTemplate}>
                        Create Template
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setShowTemplateBuilder(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : selectedTemplate ? (
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Template Information</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Category:</span>
                          <Badge variant="outline">{selectedTemplate.category}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Type:</span>
                          <span>{selectedTemplate.type}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Sections:</span>
                          <span>{selectedTemplate.sections.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Usage:</span>
                          <span>{selectedTemplate.usageCount} times</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Generate Report</h4>
                      <div className="space-y-3">
                        <Select 
                          value={generationParams.format} 
                          onValueChange={(value: any) => setGenerationParams({...generationParams, format: value})}
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
                        
                        <Button 
                          className="w-full"
                          onClick={() => handleGenerateReport(selectedTemplate.id)}
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Generate Report
                        </Button>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Actions</h4>
                      <div className="space-y-2">
                        <Button variant="outline" size="sm" className="w-full">
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Template
                        </Button>
                        <Button variant="outline" size="sm" className="w-full">
                          <Copy className="h-4 w-4 mr-2" />
                          Duplicate
                        </Button>
                        <Button variant="outline" size="sm" className="w-full">
                          <Calendar className="h-4 w-4 mr-2" />
                          Schedule
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>Select a template to view details and generate reports</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Generated Reports Tab */}
        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Generated Reports</CardTitle>
              <CardDescription>View and download your generated reports</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {generatedReports.map((report) => (
                    <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getFormatIcon(report.format)}
                        <div>
                          <h4 className="font-medium">{report.title}</h4>
                          <p className="text-sm text-gray-600">
                            Generated {report.generatedAt.toLocaleDateString()} • 
                            {report.fileSize ? formatFileSize(report.fileSize) : 'Processing...'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <Badge className={getStatusColor(report.status)}>
                          {report.status}
                        </Badge>
                        
                        {report.status === 'completed' && (
                          <Button size="sm">
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                        )}
                        
                        {report.status === 'generating' && (
                          <div className="flex items-center space-x-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                            <span className="text-sm text-gray-600">Processing...</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Schedules Tab */}
        <TabsContent value="schedules" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Scheduled Reports</CardTitle>
                  <CardDescription>Automated report generation and delivery</CardDescription>
                </div>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Schedule
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {schedules.map((schedule) => (
                    <div key={schedule.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{schedule.name}</h4>
                        <div className="flex items-center space-x-2">
                          <Badge variant={schedule.isActive ? "default" : "secondary"}>
                            {schedule.isActive ? "Active" : "Inactive"}
                          </Badge>
                          <Switch
                            checked={schedule.isActive}
                            onCheckedChange={(checked) => {
                              // Handle schedule toggle
                              setSchedules(prev => prev.map(s => 
                                s.id === schedule.id ? { ...s, isActive: checked } : s
                              ));
                            }}
                          />
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2">{schedule.description}</p>
                      
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-4">
                          <span className="flex items-center text-gray-500">
                            <Clock className="h-4 w-4 mr-1" />
                            {schedule.frequency}
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
                      <p>No scheduled reports yet. Create your first automated report.</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Subscriptions Tab */}
        <TabsContent value="subscriptions" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Report Subscriptions</CardTitle>
                  <CardDescription>Manage your report subscriptions and preferences</CardDescription>
                </div>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Subscription
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {subscriptions.map((subscription) => (
                    <div key={subscription.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">
                          {subscription.templateId ? 
                            templates.find(t => t.id === subscription.templateId)?.name || 'Unknown Template' :
                            `${subscription.category} Reports`
                          }
                        </h4>
                        <div className="flex items-center space-x-2">
                          <Badge variant={subscription.isActive ? "default" : "secondary"}>
                            {subscription.isActive ? "Active" : "Inactive"}
                          </Badge>
                          <Switch
                            checked={subscription.isActive}
                            onCheckedChange={(checked) => {
                              // Handle subscription toggle
                              setSubscriptions(prev => prev.map(s => 
                                s.id === subscription.id ? { ...s, isActive: checked } : s
                              ));
                            }}
                          />
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-4">
                          <span className="text-gray-500">
                            {subscription.preferences.frequency}
                          </span>
                          <span className="text-gray-500 uppercase">
                            {subscription.preferences.format}
                          </span>
                          <span className="text-gray-500">
                            {subscription.preferences.deliveryTime}
                          </span>
                        </div>
                        <div className="text-gray-500">
                          {subscription.userEmail}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {subscriptions.length === 0 && (
                    <div className="text-center text-gray-500 py-8">
                      <Mail className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p>No active subscriptions. Subscribe to reports for automatic delivery.</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Generations</p>
                    <p className="text-2xl font-bold">{analytics?.totalGenerations || 0}</p>
                    <p className="text-xs text-gray-500">
                      Avg: {analytics?.averageGenerationTime || 0}s
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Download className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Downloads</p>
                    <p className="text-2xl font-bold">{analytics?.totalDownloads || 0}</p>
                    <p className="text-xs text-gray-500">
                      {analytics ? Math.round((analytics.totalDownloads / analytics.totalGenerations) * 100) : 0}% download rate
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Users className="h-8 w-8 text-purple-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Users</p>
                    <p className="text-2xl font-bold">{analytics?.usageByUser.length || 0}</p>
                    <p className="text-xs text-gray-500">
                      This month
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <FileText className="h-8 w-8 text-orange-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Popular Format</p>
                    <p className="text-2xl font-bold">
                      {analytics?.popularFormats[0]?.format || 'PDF'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {analytics?.popularFormats[0]?.percentage || 0}% of exports
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Popular Formats</CardTitle>
                <CardDescription>Export format preferences</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics?.popularFormats.map((format, index) => (
                    <div key={format.format} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${
                          index === 0 ? 'bg-blue-600' :
                          index === 1 ? 'bg-green-600' :
                          index === 2 ? 'bg-purple-600' : 'bg-gray-600'
                        }`} />
                        <span className="font-medium">{format.format}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">{format.count}</span>
                        <Badge variant="outline">{format.percentage}%</Badge>
                      </div>
                    </div>
                  )) || []}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Users</CardTitle>
                <CardDescription>Most active report generators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics?.usageByUser.slice(0, 5).map((user, index) => (
                    <div key={user.userId} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-gray-600" />
                        </div>
                        <span className="font-medium">{user.userName}</span>
                      </div>
                      <Badge variant="outline">{user.count} reports</Badge>
                    </div>
                  )) || []}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}