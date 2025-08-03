'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  ReportingDashboard,
  ReportTemplateBuilder,
  ReportScheduler,
  ReportCharts,
  ReportExporter,
  ReportPermissions
} from '@/components/reporting';
import { 
  BarChart3, 
  FileText, 
  Calendar, 
  Download, 
  Share2,
  Settings,
  TrendingUp,
  Users,
  Clock,
  Shield
} from 'lucide-react';

export default function ReportingPage() {
  const [activeView, setActiveView] = useState<'dashboard' | 'builder' | 'scheduler' | 'charts' | 'exporter' | 'permissions'>('dashboard');
  const [selectedReport, setSelectedReport] = useState<any>(null);

  // Mock user data
  const currentUser = {
    id: 'user123',
    role: 'admin' as const,
    email: 'admin@gocars.com',
    name: 'Admin User'
  };

  // Mock report data for demonstrations
  const mockReportData = {
    id: 'report_123',
    title: 'Monthly Operations Report',
    data: [
      { name: 'Jan', rides: 1200, revenue: 24000, drivers: 45 },
      { name: 'Feb', rides: 1350, revenue: 27000, drivers: 48 },
      { name: 'Mar', rides: 1100, revenue: 22000, drivers: 42 },
      { name: 'Apr', rides: 1450, revenue: 29000, drivers: 52 },
      { name: 'May', rides: 1600, revenue: 32000, drivers: 55 },
      { name: 'Jun', rides: 1750, revenue: 35000, drivers: 58 }
    ]
  };

  const mockTemplates = [
    {
      id: 'template1',
      name: 'Daily Operations Summary',
      description: 'Daily overview of rides, revenue, and key metrics',
      category: 'operational' as const,
      type: 'summary' as const,
      sections: [],
      filters: [],
      parameters: [],
      layout: {
        pageSize: 'A4' as const,
        orientation: 'portrait' as const,
        margins: { top: 20, right: 20, bottom: 20, left: 20 },
        columns: 1,
        spacing: 10
      },
      styling: {
        theme: 'default' as const,
        primaryColor: '#2563eb',
        secondaryColor: '#64748b',
        fontFamily: 'Inter',
        fontSize: 12,
        showLogo: true,
        showPageNumbers: true,
        showTimestamp: true
      },
      isPublic: false,
      createdBy: 'user123',
      createdAt: new Date(),
      updatedAt: new Date(),
      usageCount: 25
    }
  ];

  const features = [
    {
      id: 'dashboard',
      title: 'Reporting Dashboard',
      description: 'Central hub for all reporting activities',
      icon: BarChart3,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      features: [
        'Template management',
        'Report generation',
        'Usage analytics',
        'Quick actions'
      ]
    },
    {
      id: 'builder',
      title: 'Template Builder',
      description: 'Create and customize report templates',
      icon: FileText,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      features: [
        'Drag & drop sections',
        'Custom layouts',
        'Data source configuration',
        'Styling options'
      ]
    },
    {
      id: 'scheduler',
      title: 'Report Scheduler',
      description: 'Automate report generation and delivery',
      icon: Calendar,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      features: [
        'Flexible scheduling',
        'Email distribution',
        'Multiple recipients',
        'Timezone support'
      ]
    },
    {
      id: 'charts',
      title: 'Data Visualization',
      description: 'Interactive charts and graphs',
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      features: [
        'Multiple chart types',
        'Real-time data',
        'Interactive elements',
        'Export capabilities'
      ]
    },
    {
      id: 'exporter',
      title: 'Multi-Format Export',
      description: 'Export reports in various formats',
      icon: Download,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      features: [
        'PDF, Excel, CSV, JSON',
        'Custom formatting',
        'Batch processing',
        'Cloud storage'
      ]
    },
    {
      id: 'permissions',
      title: 'Access Control',
      description: 'Manage user permissions and sharing',
      icon: Shield,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      features: [
        'User permissions',
        'Share links',
        'Access tracking',
        'Security controls'
      ]
    }
  ];

  const renderActiveView = () => {
    switch (activeView) {
      case 'dashboard':
        return (
          <ReportingDashboard
            userId={currentUser.id}
            userRole={currentUser.role}
          />
        );
      case 'builder':
        return (
          <ReportTemplateBuilder
            onSave={(template) => {
              console.log('Template saved:', template);
            }}
            onCancel={() => setActiveView('dashboard')}
          />
        );
      case 'scheduler':
        return (
          <ReportScheduler
            templates={mockTemplates}
            onScheduleCreated={(schedule) => {
              console.log('Schedule created:', schedule);
            }}
          />
        );
      case 'charts':
        return (
          <ReportCharts
            data={mockReportData.data}
            config={{
              title: 'Monthly Performance',
              type: 'line',
              xAxis: 'name',
              yAxis: 'rides'
            }}
            editable={true}
          />
        );
      case 'exporter':
        return (
          <ReportExporter
            reportData={mockReportData.data}
            reportTitle={mockReportData.title}
            onExportComplete={(job) => {
              console.log('Export completed:', job);
            }}
          />
        );
      case 'permissions':
        return (
          <ReportPermissions
            reportId={mockReportData.id}
            reportTitle={mockReportData.title}
            ownerId={currentUser.id}
            currentUserId={currentUser.id}
            currentUserRole={currentUser.role}
            onPermissionsChange={(permissions) => {
              console.log('Permissions updated:', permissions);
            }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                GoCars Reporting System
              </h1>
              <p className="text-xl text-gray-600">
                Comprehensive reporting and analytics platform
              </p>
            </div>
            <Badge variant="outline" className="text-lg px-4 py-2">
              Task 8.3.1 Complete
            </Badge>
          </div>
        </div>

        {/* Feature Overview */}
        {activeView === 'dashboard' && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">System Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <Card 
                    key={feature.id}
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => setActiveView(feature.id as any)}
                  >
                    <CardHeader>
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${feature.bgColor}`}>
                          <Icon className={`h-6 w-6 ${feature.color}`} />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{feature.title}</CardTitle>
                          <CardDescription>{feature.description}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-1">
                        {feature.features.map((item, index) => (
                          <li key={index} className="text-sm text-gray-600 flex items-center">
                            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-8 w-8 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Templates</p>
                      <p className="text-2xl font-bold">12</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <BarChart3 className="h-8 w-8 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Reports Generated</p>
                      <p className="text-2xl font-bold">1,247</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-8 w-8 text-purple-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Scheduled</p>
                      <p className="text-2xl font-bold">8</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <Users className="h-8 w-8 text-orange-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Active Users</p>
                      <p className="text-2xl font-bold">45</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Navigation */}
        {activeView !== 'dashboard' && (
          <div className="mb-6">
            <div className="flex items-center space-x-2 mb-4">
              <Button 
                variant="outline" 
                onClick={() => setActiveView('dashboard')}
              >
                ← Back to Dashboard
              </Button>
              <div className="text-sm text-gray-500">
                {features.find(f => f.id === activeView)?.title}
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-sm">
          {renderActiveView()}
        </div>

        {/* Implementation Status */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>Task 8.3.1 Implementation Status</span>
            </CardTitle>
            <CardDescription>
              Comprehensive reporting system implementation progress
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-3">✅ Completed Features</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span>Advanced reporting dashboard with custom report generation</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span>Scheduled report delivery and automated distribution</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span>Multi-format export capabilities (PDF, Excel, CSV, JSON)</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span>Report templates and customization options</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span>Data visualization and chart generation</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span>User access controls and sharing permissions</span>
                  </li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium mb-3">🔧 Technical Implementation</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    <span>React components with TypeScript</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    <span>Firebase integration for data persistence</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    <span>Recharts for data visualization</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    <span>Comprehensive service layer</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    <span>Modern UI with shadcn/ui components</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    <span>Responsive design for all devices</span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}