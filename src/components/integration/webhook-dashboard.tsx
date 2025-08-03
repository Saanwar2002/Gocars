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
  Webhook, 
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
  Send,
  Activity,
  Zap,
  Globe,
  Shield,
  Filter,
  Search
} from 'lucide-react';
import { 
  webhookService, 
  WebhookEndpoint, 
  WebhookDelivery,
  EventStream,
  RealTimeEvent
} from '@/services/webhookService';
import { useToast } from '@/hooks/use-toast';

interface WebhookDashboardProps {
  userId: string;
  userRole: 'admin' | 'developer' | 'analyst';
}

export function WebhookDashboard({ userId, userRole }: WebhookDashboardProps) {
  const [webhooks, setWebhooks] = useState<WebhookEndpoint[]>([]);
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
  const [streams, setStreams] = useState<EventStream[]>([]);
  const [selectedWebhook, setSelectedWebhook] = useState<WebhookEndpoint | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('webhooks');
  const { toast } = useToast();

  // Create webhook form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newWebhook, setNewWebhook] = useState({
    name: '',
    url: '',
    description: '',
    events: [] as string[],
    timeout: 30000,
    isActive: true
  });

  // Test webhook state
  const [testEvent, setTestEvent] = useState({
    type: 'ride.created',
    data: JSON.stringify({
      rideId: 'ride_123',
      passengerId: 'user_456',
      status: 'requested'
    }, null, 2)
  });

  useEffect(() => {
    loadWebhookData();
  }, [userId]);

  const loadWebhookData = async () => {
    try {
      setLoading(true);
      
      const [webhooksData, deliveriesData, streamsData] = await Promise.all([
        webhookService.getWebhooks(userId),
        webhookService.getWebhookDeliveries(),
        webhookService.getEventStreams()
      ]);

      setWebhooks(webhooksData);
      setDeliveries(deliveriesData);
      setStreams(streamsData);
    } catch (error) {
      console.error('Error loading webhook data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load webhook data.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWebhook = async () => {
    if (!newWebhook.name || !newWebhook.url) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields.',
        variant: 'destructive'
      });
      return;
    }

    try {
      const availableEvents = webhookService.getAvailableEvents();
      const defaultRetryPolicy = webhookService.getDefaultRetryPolicy();

      await webhookService.createWebhook({
        name: newWebhook.name,
        url: newWebhook.url,
        description: newWebhook.description,
        events: availableEvents.filter(e => newWebhook.events.includes(e.type)),
        isActive: newWebhook.isActive,
        retryPolicy: defaultRetryPolicy,
        filters: [],
        headers: {},
        timeout: newWebhook.timeout,
        createdBy: userId
      });

      setNewWebhook({
        name: '',
        url: '',
        description: '',
        events: [],
        timeout: 30000,
        isActive: true
      });
      setShowCreateForm(false);
      
      toast({
        title: 'Success',
        description: 'Webhook created successfully.',
      });

      await loadWebhookData();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create webhook.',
        variant: 'destructive'
      });
    }
  };

  const handleToggleWebhook = async (webhookId: string, isActive: boolean) => {
    try {
      await webhookService.updateWebhook(webhookId, { isActive });
      
      setWebhooks(prev => prev.map(webhook => 
        webhook.id === webhookId ? { ...webhook, isActive } : webhook
      ));

      toast({
        title: 'Success',
        description: `Webhook ${isActive ? 'activated' : 'deactivated'} successfully.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update webhook status.',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteWebhook = async (webhookId: string) => {
    try {
      await webhookService.deleteWebhook(webhookId);
      
      setWebhooks(prev => prev.filter(w => w.id !== webhookId));
      if (selectedWebhook?.id === webhookId) {
        setSelectedWebhook(null);
      }

      toast({
        title: 'Success',
        description: 'Webhook deleted successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete webhook.',
        variant: 'destructive'
      });
    }
  };

  const handleTestWebhook = async () => {
    if (!selectedWebhook) return;

    try {
      const eventData = JSON.parse(testEvent.data);
      
      await webhookService.publishEvent({
        type: testEvent.type,
        source: 'webhook-dashboard',
        data: eventData
      }, {
        userId: userId
      });

      toast({
        title: 'Test Event Sent',
        description: 'Test event has been published to the webhook.',
      });

      // Refresh deliveries after a short delay
      setTimeout(() => {
        loadWebhookData();
      }, 2000);

    } catch (error) {
      toast({
        title: 'Test Failed',
        description: 'Failed to send test event.',
        variant: 'destructive'
      });
    }
  };

  const copyWebhookSecret = async (secret: string) => {
    try {
      await navigator.clipboard.writeText(secret);
      toast({
        title: 'Copied',
        description: 'Webhook secret copied to clipboard.',
      });
    } catch (error) {
      toast({
        title: 'Copy Failed',
        description: 'Failed to copy secret to clipboard.',
        variant: 'destructive'
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'retrying': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'retrying':
        return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const availableEvents = webhookService.getAvailableEvents();

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
          <h1 className="text-3xl font-bold text-gray-900">Webhook Management</h1>
          <p className="text-gray-600">Manage real-time event streaming and webhook endpoints</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={loadWebhookData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Webhook
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Webhook className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Webhooks</p>
                <p className="text-2xl font-bold">{webhooks.length}</p>
                <p className="text-xs text-gray-500">
                  {webhooks.filter(w => w.isActive).length} active
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Send className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Deliveries</p>
                <p className="text-2xl font-bold">{deliveries.length}</p>
                <p className="text-xs text-gray-500">
                  {deliveries.filter(d => d.status === 'success').length} successful
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Activity className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold">
                  {deliveries.length > 0 
                    ? Math.round((deliveries.filter(d => d.status === 'success').length / deliveries.length) * 100)
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
              <Zap className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Event Streams</p>
                <p className="text-2xl font-bold">{streams.length}</p>
                <p className="text-xs text-gray-500">
                  {streams.filter(s => s.isActive).length} active
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="deliveries">Deliveries</TabsTrigger>
          <TabsTrigger value="streams">Event Streams</TabsTrigger>
          <TabsTrigger value="testing">Testing</TabsTrigger>
        </TabsList>

        {/* Webhooks Tab */}
        <TabsContent value="webhooks" className="space-y-4">
          {/* Create Webhook Form */}
          {showCreateForm && (
            <Card>
              <CardHeader>
                <CardTitle>Create New Webhook</CardTitle>
                <CardDescription>Set up a new webhook endpoint for real-time events</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Webhook Name</label>
                    <Input
                      placeholder="Enter webhook name"
                      value={newWebhook.name}
                      onChange={(e) => setNewWebhook({...newWebhook, name: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Endpoint URL</label>
                    <Input
                      placeholder="https://your-app.com/webhooks"
                      value={newWebhook.url}
                      onChange={(e) => setNewWebhook({...newWebhook, url: e.target.value})}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    placeholder="Describe what this webhook is used for"
                    value={newWebhook.description}
                    onChange={(e) => setNewWebhook({...newWebhook, description: e.target.value})}
                    rows={2}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Event Types</label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {availableEvents.map((event) => (
                      <div key={event.type} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={event.type}
                          checked={newWebhook.events.includes(event.type)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewWebhook({
                                ...newWebhook,
                                events: [...newWebhook.events, event.type]
                              });
                            } else {
                              setNewWebhook({
                                ...newWebhook,
                                events: newWebhook.events.filter(t => t !== event.type)
                              });
                            }
                          }}
                        />
                        <label htmlFor={event.type} className="text-sm">
                          {event.type}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Timeout (ms)</label>
                    <Input
                      type="number"
                      value={newWebhook.timeout}
                      onChange={(e) => setNewWebhook({...newWebhook, timeout: parseInt(e.target.value)})}
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2 pt-6">
                    <Switch
                      checked={newWebhook.isActive}
                      onCheckedChange={(checked) => setNewWebhook({...newWebhook, isActive: checked})}
                    />
                    <label className="text-sm">Active</label>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button onClick={handleCreateWebhook}>
                    Create Webhook
                  </Button>
                  <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Webhooks List */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Webhook Endpoints</CardTitle>
                <CardDescription>Manage your webhook endpoints and configurations</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-3">
                    {webhooks.map((webhook) => (
                      <div 
                        key={webhook.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedWebhook?.id === webhook.id ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                        }`}
                        onClick={() => setSelectedWebhook(webhook)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{webhook.name}</h4>
                          <div className="flex items-center space-x-2">
                            <Badge variant={webhook.isActive ? "default" : "secondary"}>
                              {webhook.isActive ? "Active" : "Inactive"}
                            </Badge>
                            <Switch
                              checked={webhook.isActive}
                              onCheckedChange={(checked) => handleToggleWebhook(webhook.id, checked)}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-2">{webhook.description}</p>
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">{webhook.url}</code>
                        
                        <div className="flex items-center justify-between mt-3 text-sm">
                          <div className="flex items-center space-x-4">
                            <span className="text-gray-500">
                              {webhook.events.length} events
                            </span>
                            <span className="text-green-600">
                              ✓ {webhook.successCount}
                            </span>
                            <span className="text-red-600">
                              ✗ {webhook.failureCount}
                            </span>
                          </div>
                          <div className="text-gray-500">
                            {webhook.lastTriggered 
                              ? `Last: ${webhook.lastTriggered.toLocaleDateString()}`
                              : 'Never triggered'
                            }
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {webhooks.length === 0 && (
                      <div className="text-center text-gray-500 py-8">
                        <Webhook className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                        <p>No webhooks created yet. Click "New Webhook" to get started.</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Webhook Details */}
            <Card>
              <CardHeader>
                <CardTitle>Webhook Details</CardTitle>
                <CardDescription>
                  {selectedWebhook ? 'Manage webhook configuration' : 'Select a webhook to view details'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedWebhook ? (
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Configuration</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Status:</span>
                          <Badge variant={selectedWebhook.isActive ? "default" : "secondary"}>
                            {selectedWebhook.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Events:</span>
                          <span>{selectedWebhook.events.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Timeout:</span>
                          <span>{selectedWebhook.timeout}ms</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Success:</span>
                          <span className="text-green-600">{selectedWebhook.successCount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Failures:</span>
                          <span className="text-red-600">{selectedWebhook.failureCount}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Webhook Secret</h4>
                      <div className="flex items-center space-x-2">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded flex-1">
                          {selectedWebhook.secret.substring(0, 20)}...
                        </code>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => copyWebhookSecret(selectedWebhook.secret)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Event Types</h4>
                      <div className="space-y-1">
                        {selectedWebhook.events.map((event) => (
                          <Badge key={event.type} variant="secondary" className="text-xs mr-1 mb-1">
                            {event.type}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Actions</h4>
                      <div className="space-y-2">
                        <Button variant="outline" size="sm" className="w-full">
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Webhook
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full"
                          onClick={() => setActiveTab('testing')}
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Test Webhook
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full text-red-600"
                          onClick={() => handleDeleteWebhook(selectedWebhook.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Webhook
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <Settings className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>Select a webhook to view its configuration</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Deliveries Tab */}
        <TabsContent value="deliveries" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Webhook Deliveries</CardTitle>
              <CardDescription>Monitor webhook delivery status and performance</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {deliveries.map((delivery) => (
                    <div key={delivery.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(delivery.status)}
                          <div>
                            <h4 className="font-medium">{delivery.eventType}</h4>
                            <p className="text-sm text-gray-600">
                              {webhooks.find(w => w.id === delivery.webhookId)?.name || 'Unknown Webhook'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={getStatusColor(delivery.status)}>
                            {delivery.status}
                          </Badge>
                          {delivery.httpStatus && (
                            <Badge variant="outline">
                              {delivery.httpStatus}
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>
                          {delivery.attempts.length} attempt{delivery.attempts.length !== 1 ? 's' : ''}
                        </span>
                        <span>
                          {delivery.createdAt.toLocaleString()}
                        </span>
                      </div>

                      {delivery.status === 'retrying' && delivery.nextRetryAt && (
                        <div className="mt-2">
                          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                            <span>Next retry</span>
                            <span>{delivery.nextRetryAt.toLocaleString()}</span>
                          </div>
                          <Progress value={75} className="h-1" />
                        </div>
                      )}

                      {delivery.error && (
                        <div className="mt-2 p-2 bg-red-50 rounded text-sm text-red-700">
                          {delivery.error}
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {deliveries.length === 0 && (
                    <div className="text-center text-gray-500 py-8">
                      <Send className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p>No webhook deliveries yet. Create a webhook and trigger some events.</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Event Streams Tab */}
        <TabsContent value="streams" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Event Streams</CardTitle>
              <CardDescription>Real-time event streaming and subscription management</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {streams.map((stream) => (
                    <div key={stream.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{stream.name}</h4>
                        <div className="flex items-center space-x-2">
                          <Badge variant={stream.isActive ? "default" : "secondary"}>
                            {stream.isActive ? "Active" : "Inactive"}
                          </Badge>
                          <Badge variant="outline">
                            {stream.subscribers.length} subscribers
                          </Badge>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2">{stream.description}</p>
                      
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-4">
                          <span className="text-gray-500">
                            {stream.events.length} event types
                          </span>
                          <span className="text-gray-500">
                            Retention: {stream.retentionPeriod} days
                          </span>
                        </div>
                        <div className="text-gray-500">
                          Created: {stream.createdAt.toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {streams.length === 0 && (
                    <div className="text-center text-gray-500 py-8">
                      <Activity className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p>No event streams configured yet.</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Testing Tab */}
        <TabsContent value="testing" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Test Webhook</CardTitle>
                <CardDescription>Send test events to your webhook endpoints</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedWebhook ? (
                  <>
                    <div>
                      <h4 className="font-medium mb-2">Selected Webhook</h4>
                      <div className="p-3 bg-gray-50 rounded">
                        <div className="font-medium">{selectedWebhook.name}</div>
                        <code className="text-sm text-gray-600">{selectedWebhook.url}</code>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium">Event Type</label>
                      <Select 
                        value={testEvent.type} 
                        onValueChange={(value) => setTestEvent({...testEvent, type: value})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {availableEvents.map((event) => (
                            <SelectItem key={event.type} value={event.type}>
                              {event.type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium">Event Data</label>
                      <Textarea
                        value={testEvent.data}
                        onChange={(e) => setTestEvent({...testEvent, data: e.target.value})}
                        rows={8}
                        className="font-mono text-sm"
                        placeholder="Enter JSON event data"
                      />
                    </div>

                    <Button onClick={handleTestWebhook} className="w-full">
                      <Send className="h-4 w-4 mr-2" />
                      Send Test Event
                    </Button>
                  </>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <Play className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>Select a webhook from the Webhooks tab to test it</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Available Events</CardTitle>
                <CardDescription>Event types you can subscribe to</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-3">
                    {availableEvents.map((event) => (
                      <div key={event.type} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <code className="text-sm font-mono">{event.type}</code>
                          <Badge variant="outline">Event</Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{event.description}</p>
                        <div className="bg-gray-50 p-2 rounded text-xs">
                          <pre>{JSON.stringify(event.example, null, 2)}</pre>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}