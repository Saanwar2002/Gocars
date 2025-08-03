'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { 
  Plug, 
  Plus, 
  Settings, 
  Play,
  Pause,
  Edit,
  Trash2,
  Copy,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  CreditCard,
  Map,
  MessageSquare,
  Mail,
  BarChart3,
  Shield,
  Database,
  Users,
  DollarSign,
  Zap,
  Globe,
  Key,
  TestTube
} from 'lucide-react';
import { 
  thirdPartyIntegrationService, 
  Integration,
  IntegrationType,
  SyncOperation
} from '@/services/thirdPartyIntegrationService';
import { useToast } from '@/hooks/use-toast';

interface ThirdPartyIntegrationDashboardProps {
  userId: string;
  userRole: 'admin' | 'developer' | 'analyst';
}

export function ThirdPartyIntegrationDashboard({ userId, userRole }: ThirdPartyIntegrationDashboardProps) {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [syncOperations, setSyncOperations] = useState<SyncOperation[]>([]);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('integrations');
  const [selectedType, setSelectedType] = useState<IntegrationType | ''>('');
  const { toast } = useToast();

  // Create integration form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Partial<Integration> | null>(null);
  const [newIntegration, setNewIntegration] = useState({
    name: '',
    type: 'payment' as IntegrationType,
    provider: '',
    description: '',
    apiKey: '',
    clientId: '',
    clientSecret: '',
    baseUrl: '',
    isEnabled: true
  });

  // Test integration state
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  useEffect(() => {
    loadIntegrationData();
  }, []);

  const loadIntegrationData = async () => {
    try {
      setLoading(true);
      
      const [integrationsData, syncOpsData] = await Promise.all([
        thirdPartyIntegrationService.getIntegrations(),
        thirdPartyIntegrationService.getSyncOperations()
      ]);

      setIntegrations(integrationsData);
      setSyncOperations(syncOpsData);
    } catch (error) {
      console.error('Error loading integration data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load integration data.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateIntegration = async () => {
    if (!newIntegration.name || !newIntegration.provider) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields.',
        variant: 'destructive'
      });
      return;
    }

    try {
      const credentials: any = {
        type: 'api_key'
      };

      if (newIntegration.apiKey) {
        credentials.apiKey = newIntegration.apiKey;
      }
      if (newIntegration.clientId) {
        credentials.clientId = newIntegration.clientId;
      }
      if (newIntegration.clientSecret) {
        credentials.clientSecret = newIntegration.clientSecret;
      }

      await thirdPartyIntegrationService.createIntegration({
        name: newIntegration.name,
        type: newIntegration.type,
        provider: newIntegration.provider,
        description: newIntegration.description,
        config: {
          baseUrl: newIntegration.baseUrl,
          timeout: 30000,
          retryAttempts: 3
        },
        credentials,
        status: 'pending',
        isEnabled: newIntegration.isEnabled,
        createdBy: userId
      });

      setNewIntegration({
        name: '',
        type: 'payment',
        provider: '',
        description: '',
        apiKey: '',
        clientId: '',
        clientSecret: '',
        baseUrl: '',
        isEnabled: true
      });
      setShowCreateForm(false);
      setSelectedTemplate(null);
      
      toast({
        title: 'Success',
        description: 'Integration created successfully.',
      });

      await loadIntegrationData();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create integration.',
        variant: 'destructive'
      });
    }
  };

  const handleTestIntegration = async (integrationId: string) => {
    try {
      setTesting(true);
      setTestResult(null);
      
      const result = await thirdPartyIntegrationService.testIntegration(integrationId);
      setTestResult(result);
      
      toast({
        title: result.success ? 'Test Successful' : 'Test Failed',
        description: result.message,
        variant: result.success ? 'default' : 'destructive'
      });

      // Update integration status
      await thirdPartyIntegrationService.updateIntegration(integrationId, {
        status: result.success ? 'active' : 'error'
      });

      await loadIntegrationData();
    } catch (error) {
      toast({
        title: 'Test Error',
        description: 'Failed to test integration.',
        variant: 'destructive'
      });
    } finally {
      setTesting(false);
    }
  };

  const handleToggleIntegration = async (integrationId: string, isEnabled: boolean) => {
    try {
      await thirdPartyIntegrationService.updateIntegration(integrationId, { isEnabled });
      
      setIntegrations(prev => prev.map(integration => 
        integration.id === integrationId ? { ...integration, isEnabled } : integration
      ));

      toast({
        title: 'Success',
        description: `Integration ${isEnabled ? 'enabled' : 'disabled'} successfully.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update integration status.',
        variant: 'destructive'
      });
    }
  };

  const handleStartSync = async (integrationId: string, entity: string) => {
    try {
      const syncId = await thirdPartyIntegrationService.startSync(integrationId, entity, 'sync');
      
      toast({
        title: 'Sync Started',
        description: `Data synchronization has been initiated for ${entity}.`,
      });

      // Refresh sync operations after a short delay
      setTimeout(() => {
        loadIntegrationData();
      }, 2000);

    } catch (error) {
      toast({
        title: 'Sync Failed',
        description: 'Failed to start data synchronization.',
        variant: 'destructive'
      });
    }
  };

  const useTemplate = (template: Partial<Integration>) => {
    setSelectedTemplate(template);
    setNewIntegration({
      name: template.name || '',
      type: template.type || 'payment',
      provider: template.provider || '',
      description: template.description || '',
      apiKey: '',
      clientId: '',
      clientSecret: '',
      baseUrl: template.config?.baseUrl || '',
      isEnabled: true
    });
    setShowCreateForm(true);
  };

  const getIntegrationIcon = (type: IntegrationType) => {
    switch (type) {
      case 'payment': return <CreditCard className="h-5 w-5" />;
      case 'mapping': return <Map className="h-5 w-5" />;
      case 'sms': return <MessageSquare className="h-5 w-5" />;
      case 'email': return <Mail className="h-5 w-5" />;
      case 'analytics': return <BarChart3 className="h-5 w-5" />;
      case 'monitoring': return <Shield className="h-5 w-5" />;
      case 'storage': return <Database className="h-5 w-5" />;
      case 'authentication': return <Key className="h-5 w-5" />;
      case 'crm': return <Users className="h-5 w-5" />;
      case 'accounting': return <DollarSign className="h-5 w-5" />;
      default: return <Plug className="h-5 w-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'error': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'inactive':
        return <Pause className="h-4 w-4 text-gray-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getSyncStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'running': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredIntegrations = selectedType 
    ? integrations.filter(i => i.type === selectedType)
    : integrations;

  const integrationTemplates = thirdPartyIntegrationService.getIntegrationTemplates();

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
          <h1 className="text-3xl font-bold text-gray-900">Third-Party Integrations</h1>
          <p className="text-gray-600">Connect with external services and manage data synchronization</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={loadIntegrationData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Integration
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Plug className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Integrations</p>
                <p className="text-2xl font-bold">{integrations.length}</p>
                <p className="text-xs text-gray-500">
                  {integrations.filter(i => i.isEnabled).length} enabled
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold">
                  {integrations.filter(i => i.status === 'active').length}
                </p>
                <p className="text-xs text-gray-500">
                  {integrations.length > 0 
                    ? Math.round((integrations.filter(i => i.status === 'active').length / integrations.length) * 100)
                    : 0
                  }% success rate
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Zap className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Sync Operations</p>
                <p className="text-2xl font-bold">{syncOperations.length}</p>
                <p className="text-xs text-gray-500">
                  {syncOperations.filter(s => s.status === 'completed').length} completed
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Globe className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Integration Types</p>
                <p className="text-2xl font-bold">
                  {new Set(integrations.map(i => i.type)).size}
                </p>
                <p className="text-xs text-gray-500">
                  Different categories
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="sync">Data Sync</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Integrations Tab */}
        <TabsContent value="integrations" className="space-y-4">
          {/* Create Integration Form */}
          {showCreateForm && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {selectedTemplate ? `Create ${selectedTemplate.name}` : 'Create New Integration'}
                </CardTitle>
                <CardDescription>
                  {selectedTemplate 
                    ? `Set up ${selectedTemplate.description?.toLowerCase()}`
                    : 'Connect a new third-party service'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Integration Name</label>
                    <Input
                      placeholder="Enter integration name"
                      value={newIntegration.name}
                      onChange={(e) => setNewIntegration({...newIntegration, name: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Type</label>
                    <Select 
                      value={newIntegration.type} 
                      onValueChange={(value: IntegrationType) => setNewIntegration({...newIntegration, type: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="payment">Payment</SelectItem>
                        <SelectItem value="mapping">Mapping</SelectItem>
                        <SelectItem value="sms">SMS</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="analytics">Analytics</SelectItem>
                        <SelectItem value="monitoring">Monitoring</SelectItem>
                        <SelectItem value="storage">Storage</SelectItem>
                        <SelectItem value="authentication">Authentication</SelectItem>
                        <SelectItem value="crm">CRM</SelectItem>
                        <SelectItem value="accounting">Accounting</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Provider</label>
                    <Input
                      placeholder="e.g., stripe, google_maps, twilio"
                      value={newIntegration.provider}
                      onChange={(e) => setNewIntegration({...newIntegration, provider: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Base URL</label>
                    <Input
                      placeholder="https://api.provider.com"
                      value={newIntegration.baseUrl}
                      onChange={(e) => setNewIntegration({...newIntegration, baseUrl: e.target.value})}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    placeholder="Describe what this integration is used for"
                    value={newIntegration.description}
                    onChange={(e) => setNewIntegration({...newIntegration, description: e.target.value})}
                    rows={2}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">API Key</label>
                    <Input
                      type="password"
                      placeholder="Enter API key"
                      value={newIntegration.apiKey}
                      onChange={(e) => setNewIntegration({...newIntegration, apiKey: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Client ID (Optional)</label>
                    <Input
                      placeholder="Enter client ID"
                      value={newIntegration.clientId}
                      onChange={(e) => setNewIntegration({...newIntegration, clientId: e.target.value})}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Client Secret (Optional)</label>
                  <Input
                    type="password"
                    placeholder="Enter client secret"
                    value={newIntegration.clientSecret}
                    onChange={(e) => setNewIntegration({...newIntegration, clientSecret: e.target.value})}
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={newIntegration.isEnabled}
                    onCheckedChange={(checked) => setNewIntegration({...newIntegration, isEnabled: checked})}
                  />
                  <label className="text-sm">Enable integration</label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button onClick={handleCreateIntegration}>
                    Create Integration
                  </Button>
                  <Button variant="outline" onClick={() => {
                    setShowCreateForm(false);
                    setSelectedTemplate(null);
                  }}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Filter */}
          <div className="flex items-center space-x-4">
            <Select value={selectedType} onValueChange={(value: IntegrationType | '') => setSelectedType(value)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Types</SelectItem>
                <SelectItem value="payment">Payment</SelectItem>
                <SelectItem value="mapping">Mapping</SelectItem>
                <SelectItem value="sms">SMS</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="analytics">Analytics</SelectItem>
                <SelectItem value="monitoring">Monitoring</SelectItem>
                <SelectItem value="storage">Storage</SelectItem>
                <SelectItem value="authentication">Authentication</SelectItem>
                <SelectItem value="crm">CRM</SelectItem>
                <SelectItem value="accounting">Accounting</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Integrations List */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Active Integrations</CardTitle>
                <CardDescription>Manage your third-party service connections</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-3">
                    {filteredIntegrations.map((integration) => (
                      <div 
                        key={integration.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedIntegration?.id === integration.id ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                        }`}
                        onClick={() => setSelectedIntegration(integration)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-gray-100 rounded">
                              {getIntegrationIcon(integration.type)}
                            </div>
                            <div>
                              <h4 className="font-medium">{integration.name}</h4>
                              <p className="text-sm text-gray-600 capitalize">{integration.provider}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(integration.status)}
                            <Badge className={getStatusColor(integration.status)}>
                              {integration.status}
                            </Badge>
                            <Switch
                              checked={integration.isEnabled}
                              onCheckedChange={(checked) => handleToggleIntegration(integration.id, checked)}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-2">{integration.description}</p>
                        
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center space-x-4">
                            <Badge variant="outline" className="capitalize">
                              {integration.type}
                            </Badge>
                            <span className="text-green-600">
                              ✓ {integration.successCount}
                            </span>
                            <span className="text-red-600">
                              ✗ {integration.errorCount}
                            </span>
                          </div>
                          <div className="text-gray-500">
                            {integration.lastSync 
                              ? `Last sync: ${integration.lastSync.toLocaleDateString()}`
                              : 'Never synced'
                            }
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {filteredIntegrations.length === 0 && (
                      <div className="text-center text-gray-500 py-8">
                        <Plug className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                        <p>No integrations found. Create your first integration to get started.</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Integration Details */}
            <Card>
              <CardHeader>
                <CardTitle>Integration Details</CardTitle>
                <CardDescription>
                  {selectedIntegration ? 'Manage integration settings' : 'Select an integration to view details'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedIntegration ? (
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Configuration</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Status:</span>
                          <Badge className={getStatusColor(selectedIntegration.status)}>
                            {selectedIntegration.status}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Type:</span>
                          <span className="capitalize">{selectedIntegration.type}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Provider:</span>
                          <span className="capitalize">{selectedIntegration.provider}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Enabled:</span>
                          <span>{selectedIntegration.isEnabled ? 'Yes' : 'No'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Success:</span>
                          <span className="text-green-600">{selectedIntegration.successCount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Errors:</span>
                          <span className="text-red-600">{selectedIntegration.errorCount}</span>
                        </div>
                      </div>
                    </div>

                    {testResult && (
                      <div>
                        <h4 className="font-medium mb-2">Test Result</h4>
                        <div className={`p-3 rounded text-sm ${
                          testResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                        }`}>
                          <div className="flex items-center space-x-2 mb-1">
                            {testResult.success ? (
                              <CheckCircle className="h-4 w-4" />
                            ) : (
                              <AlertCircle className="h-4 w-4" />
                            )}
                            <span className="font-medium">
                              {testResult.success ? 'Success' : 'Failed'}
                            </span>
                          </div>
                          <p>{testResult.message}</p>
                          <p className="text-xs mt-1">Response time: {testResult.responseTime}ms</p>
                        </div>
                      </div>
                    )}

                    <div>
                      <h4 className="font-medium mb-2">Actions</h4>
                      <div className="space-y-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full"
                          onClick={() => handleTestIntegration(selectedIntegration.id)}
                          disabled={testing}
                        >
                          {testing ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                              Testing...
                            </>
                          ) : (
                            <>
                              <TestTube className="h-4 w-4 mr-2" />
                              Test Connection
                            </>
                          )}
                        </Button>
                        <Button variant="outline" size="sm" className="w-full">
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Integration
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full"
                          onClick={() => handleStartSync(selectedIntegration.id, 'users')}
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Sync Data
                        </Button>
                        <Button variant="outline" size="sm" className="w-full text-red-600">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Integration
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <Settings className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>Select an integration to view its configuration</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Integration Templates</CardTitle>
              <CardDescription>Pre-configured templates for popular services</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {integrationTemplates.map((template, index) => (
                  <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="p-2 bg-gray-100 rounded">
                          {getIntegrationIcon(template.type!)}
                        </div>
                        <div>
                          <h4 className="font-medium">{template.name}</h4>
                          <Badge variant="outline" className="text-xs capitalize">
                            {template.type}
                          </Badge>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-4">{template.description}</p>
                      
                      <Button 
                        size="sm" 
                        className="w-full"
                        onClick={() => useTemplate(template)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Use Template
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Sync Tab */}
        <TabsContent value="sync" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Data Synchronization</CardTitle>
              <CardDescription>Monitor data sync operations and status</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {syncOperations.map((operation) => (
                    <div key={operation.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <div>
                            <h4 className="font-medium capitalize">{operation.entity} Sync</h4>
                            <p className="text-sm text-gray-600">
                              {integrations.find(i => i.id === operation.integrationId)?.name || 'Unknown Integration'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={getSyncStatusColor(operation.status)}>
                            {operation.status}
                          </Badge>
                          <Badge variant="outline" className="capitalize">
                            {operation.type}
                          </Badge>
                        </div>
                      </div>
                      
                      {operation.status === 'running' && (
                        <div className="mb-2">
                          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                            <span>Progress</span>
                            <span>{operation.recordsProcessed} / {operation.recordsTotal}</span>
                          </div>
                          <Progress 
                            value={operation.recordsTotal > 0 ? (operation.recordsProcessed / operation.recordsTotal) * 100 : 0} 
                            className="h-2" 
                          />
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <div className="flex items-center space-x-4">
                          <span>Records: {operation.recordsProcessed}</span>
                          {operation.errors.length > 0 && (
                            <span className="text-red-600">Errors: {operation.errors.length}</span>
                          )}
                        </div>
                        <span>
                          {operation.startedAt.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                  
                  {syncOperations.length === 0 && (
                    <div className="text-center text-gray-500 py-8">
                      <RefreshCw className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p>No sync operations yet. Start a data sync from an integration.</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Success Rate</p>
                    <p className="text-2xl font-bold">
                      {integrations.length > 0 
                        ? Math.round((integrations.filter(i => i.status === 'active').length / integrations.length) * 100)
                        : 0
                      }%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Clock className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avg Response Time</p>
                    <p className="text-2xl font-bold">
                      {testResult ? `${testResult.responseTime}ms` : 'N/A'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Database className="h-8 w-8 text-purple-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Data Synced</p>
                    <p className="text-2xl font-bold">
                      {syncOperations.reduce((sum, op) => sum + op.recordsProcessed, 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Integration Performance</CardTitle>
              <CardDescription>Performance metrics for your integrations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {integrations.slice(0, 5).map((integration) => (
                  <div key={integration.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-white rounded">
                        {getIntegrationIcon(integration.type)}
                      </div>
                      <div>
                        <h4 className="font-medium">{integration.name}</h4>
                        <p className="text-sm text-gray-600 capitalize">{integration.provider}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 text-sm">
                      <div className="text-center">
                        <div className="text-green-600 font-medium">{integration.successCount}</div>
                        <div className="text-gray-500">Success</div>
                      </div>
                      <div className="text-center">
                        <div className="text-red-600 font-medium">{integration.errorCount}</div>
                        <div className="text-gray-500">Errors</div>
                      </div>
                      <Badge className={getStatusColor(integration.status)}>
                        {integration.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}