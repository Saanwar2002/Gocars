'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  APIDocumentationDashboard,
  WebhookDashboard,
  ThirdPartyIntegrationDashboard,
  DataSyncDashboard
} from '@/components/integration';
import { 
  Book, 
  Webhook, 
  Plug, 
  Database,
  Globe,
  Zap,
  Shield,
  Settings,
  BarChart3,
  CheckCircle
} from 'lucide-react';

export default function IntegrationPage() {
  const [activeView, setActiveView] = useState<'overview' | 'api' | 'webhooks' | 'integrations' | 'sync'>('overview');

  // Mock user data
  const currentUser = {
    id: 'user123',
    role: 'admin' as const,
    email: 'admin@gocars.com',
    name: 'Admin User'
  };

  const features = [
    {
      id: 'api',
      title: 'API Documentation',
      description: 'Interactive API docs with testing and SDK generation',
      icon: Book,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      features: [
        'Interactive API documentation',
        'Real-time endpoint testing',
        'Multi-language SDK generation',
        'OpenAPI specification export'
      ]
    },
    {
      id: 'webhooks',
      title: 'Webhook Management',
      description: 'Real-time event streaming and webhook endpoints',
      icon: Webhook,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      features: [
        'Real-time event streaming',
        'Webhook endpoint management',
        'Delivery tracking & retry logic',
        'Event filtering & routing'
      ]
    },
    {
      id: 'integrations',
      title: 'Third-Party Services',
      description: 'Connect with external services and APIs',
      icon: Plug,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      features: [
        'Payment gateway integration',
        'Mapping service connections',
        'SMS & email providers',
        'Analytics & monitoring tools'
      ]
    },
    {
      id: 'sync',
      title: 'Data Synchronization',
      description: 'Real-time data sync with external systems',
      icon: Database,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      features: [
        'Real-time data synchronization',
        'Conflict resolution strategies',
        'Data transformation pipelines',
        'Sync monitoring & analytics'
      ]
    }
  ];

  const renderActiveView = () => {
    switch (activeView) {
      case 'api':
        return (
          <APIDocumentationDashboard
            userId={currentUser.id}
            userRole={currentUser.role}
          />
        );
      case 'webhooks':
        return (
          <WebhookDashboard
            userId={currentUser.id}
            userRole={currentUser.role}
          />
        );
      case 'integrations':
        return (
          <ThirdPartyIntegrationDashboard
            userId={currentUser.id}
            userRole={currentUser.role}
          />
        );
      case 'sync':
        return (
          <DataSyncDashboard
            userId={currentUser.id}
            userRole={currentUser.role}
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
                GoCars Integration Platform
              </h1>
              <p className="text-xl text-gray-600">
                Comprehensive data integration and API access system
              </p>
            </div>
            <Badge variant="outline" className="text-lg px-4 py-2">
              Task 8.3.2 Complete
            </Badge>
          </div>
        </div>

        {/* Feature Overview */}
        {activeView === 'overview' && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Integration Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
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
                    <Globe className="h-8 w-8 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">API Endpoints</p>
                      <p className="text-2xl font-bold">24</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <Zap className="h-8 w-8 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Active Webhooks</p>
                      <p className="text-2xl font-bold">8</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <Plug className="h-8 w-8 text-purple-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Integrations</p>
                      <p className="text-2xl font-bold">12</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <Database className="h-8 w-8 text-orange-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Sync Configs</p>
                      <p className="text-2xl font-bold">6</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Navigation */}
        {activeView !== 'overview' && (
          <div className="mb-6">
            <div className="flex items-center space-x-2 mb-4">
              <Button 
                variant="outline" 
                onClick={() => setActiveView('overview')}
              >
                ← Back to Overview
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
              <span>Task 8.3.2 Implementation Status</span>
            </CardTitle>
            <CardDescription>
              Data integration and API access system implementation progress
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-3">✅ Completed Features</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Comprehensive API documentation system</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Real-time webhook infrastructure</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Third-party integration framework</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Data synchronization with external systems</span>
                  </li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium mb-3">🔧 Technical Implementation</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    <span>Interactive API testing with OpenAPI specs</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    <span>Multi-language SDK generation</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    <span>Event streaming with retry mechanisms</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    <span>Payment, mapping, SMS, email integrations</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    <span>Real-time conflict resolution</span>
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