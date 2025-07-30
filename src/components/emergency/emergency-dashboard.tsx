'use client';

import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  Shield, 
  Phone, 
  MapPin, 
  Clock, 
  Users,
  Settings,
  Activity,
  FileText,
  CheckCircle,
  XCircle,
  RefreshCw,
  Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EmergencySOSButton } from './emergency-sos-button';
import { EmergencyContactsManager } from './emergency-contacts-manager';
import { EmergencyServicesIntegration } from './emergency-services-integration';
import { emergencyService, EmergencyIncident, EmergencySettings } from '@/services/emergencyService';

interface EmergencyDashboardProps {
  userId: string;
  userRole?: 'passenger' | 'driver' | 'operator' | 'admin';
  rideId?: string;
}

interface EmergencyStats {
  totalIncidents: number;
  activeIncidents: number;
  resolvedIncidents: number;
  averageResponseTime: number;
  emergencyContacts: number;
  lastIncident?: Date;
}

export function EmergencyDashboard({ 
  userId, 
  userRole = 'passenger', 
  rideId 
}: EmergencyDashboardProps) {
  const [activeIncidents, setActiveIncidents] = useState<EmergencyIncident[]>([]);
  const [emergencySettings, setEmergencySettings] = useState<EmergencySettings | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<EmergencyIncident | null>(null);
  const [stats, setStats] = useState<EmergencyStats>({
    totalIncidents: 0,
    activeIncidents: 0,
    resolvedIncidents: 0,
    averageResponseTime: 0,
    emergencyContacts: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [showIncidentDialog, setShowIncidentDialog] = useState(false);

  useEffect(() => {
    loadEmergencyData();
    
    // Set up periodic refresh for active incidents
    const interval = setInterval(loadActiveIncidents, 30000); // Every 30 seconds
    
    return () => clearInterval(interval);
  }, [userId]);

  const loadEmergencyData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadActiveIncidents(),
        loadEmergencySettings(),
        loadEmergencyStats()
      ]);
    } catch (error) {
      console.error('Error loading emergency data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadActiveIncidents = async () => {
    try {
      const incidents = await emergencyService.getActiveIncidents(userId);
      setActiveIncidents(incidents);
    } catch (error) {
      console.error('Error loading active incidents:', error);
    }
  };

  const loadEmergencySettings = async () => {
    try {
      const settings = await emergencyService.getEmergencySettings(userId);
      setEmergencySettings(settings);
    } catch (error) {
      console.error('Error loading emergency settings:', error);
    }
  };

  const loadEmergencyStats = async () => {
    try {
      // In a real implementation, this would fetch from analytics service
      const mockStats: EmergencyStats = {
        totalIncidents: 3,
        activeIncidents: activeIncidents.length,
        resolvedIncidents: 3,
        averageResponseTime: 8.5,
        emergencyContacts: emergencySettings?.emergencyContacts.length || 0,
        lastIncident: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
      };
      setStats(mockStats);
    } catch (error) {
      console.error('Error loading emergency stats:', error);
    }
  };

  const handleEmergencyActivated = (incident: EmergencyIncident) => {
    setActiveIncidents(prev => [incident, ...prev]);
    setSelectedIncident(incident);
    setShowIncidentDialog(true);
  };

  const handleIncidentUpdate = (updatedIncident: EmergencyIncident) => {
    setActiveIncidents(prev => 
      prev.map(incident => 
        incident.id === updatedIncident.id ? updatedIncident : incident
      )
    );
    
    if (selectedIncident?.id === updatedIncident.id) {
      setSelectedIncident(updatedIncident);
    }
  };

  const handleResolveIncident = async (incidentId: string) => {
    try {
      const success = await emergencyService.resolveIncident(
        incidentId,
        userId,
        'Resolved by user',
        false
      );
      
      if (success) {
        setActiveIncidents(prev => prev.filter(incident => incident.id !== incidentId));
        if (selectedIncident?.id === incidentId) {
          setSelectedIncident(null);
          setShowIncidentDialog(false);
        }
      }
    } catch (error) {
      console.error('Error resolving incident:', error);
      alert('Failed to resolve incident. Please try again.');
    }
  };

  const getIncidentStatusColor = (status: EmergencyIncident['status']) => {
    switch (status) {
      case 'active': return 'bg-red-100 text-red-800';
      case 'responding': return 'bg-blue-100 text-blue-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'false_alarm': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: EmergencyIncident['priority']) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Loading emergency dashboard...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center">
            <Shield className="h-8 w-8 mr-3 text-red-500" />
            Emergency Center
          </h1>
          <p className="text-muted-foreground">
            Your safety is our priority - emergency help is always one tap away
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={loadEmergencyData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Emergency SOS Button */}
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-red-800 mb-2">Emergency SOS</h2>
              <p className="text-red-700 mb-4">
                In case of emergency, press and hold the SOS button or triple-tap for immediate help.
              </p>
              <div className="flex items-center space-x-4 text-sm text-red-600">
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-1" />
                  <span>Auto-contacts emergency services</span>
                </div>
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span>Shares your location</span>
                </div>
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-1" />
                  <span>Notifies emergency contacts</span>
                </div>
              </div>
            </div>
            
            <EmergencySOSButton
              userId={userId}
              rideId={rideId}
              position="inline"
              size="large"
              discreteMode={emergencySettings?.discreteMode}
              onEmergencyActivated={handleEmergencyActivated}
            />
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Incidents</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.activeIncidents}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalIncidents} total incidents
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Emergency Contacts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.emergencyContacts}</div>
            <p className="text-xs text-muted-foreground">
              Configured contacts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageResponseTime.toFixed(1)}m</div>
            <p className="text-xs text-green-600">
              ↓ 15% improvement
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Incident</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.lastIncident ? formatTimeAgo(stats.lastIncident) : 'None'}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.resolvedIncidents} resolved
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="incidents" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="incidents">Active Incidents</TabsTrigger>
          <TabsTrigger value="contacts">Emergency Contacts</TabsTrigger>
          <TabsTrigger value="services">Emergency Services</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="incidents" className="space-y-4">
          {/* Active Incidents */}
          {activeIncidents.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No active emergencies</h3>
                <p className="text-muted-foreground">
                  All clear! Your emergency contacts and services are ready if needed.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {activeIncidents.map((incident) => (
                <Card key={incident.id} className="border-red-200">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-lg bg-red-100 text-red-600">
                          <AlertTriangle className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-semibold capitalize">
                            {incident.type.replace('_', ' ')} Emergency
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Started {formatTimeAgo(incident.timestamp)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Badge className={getPriorityColor(incident.priority)}>
                          {incident.priority}
                        </Badge>
                        <Badge className={getIncidentStatusColor(incident.status)}>
                          {incident.status}
                        </Badge>
                      </div>
                    </div>

                    {incident.description && (
                      <p className="text-sm text-muted-foreground mb-4">
                        {incident.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4 mr-1" />
                        <span>{incident.location.address || 'Location shared'}</span>
                      </div>
                      
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Users className="h-4 w-4 mr-1" />
                        <span>{incident.responders.length} responders</span>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedIncident(incident);
                          setShowIncidentDialog(true);
                        }}
                      >
                        <FileText className="h-4 w-4 mr-1" />
                        View Details
                      </Button>
                      
                      {incident.status === 'active' && (
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => handleResolveIncident(incident.id)}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Mark Resolved
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="contacts">
          <EmergencyContactsManager
            userId={userId}
            onSettingsUpdate={setEmergencySettings}
          />
        </TabsContent>

        <TabsContent value="services">
          {selectedIncident ? (
            <EmergencyServicesIntegration
              incident={selectedIncident}
              onIncidentUpdate={handleIncidentUpdate}
            />
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Phone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No active emergency</h3>
                <p className="text-muted-foreground">
                  Emergency services integration will be available during active incidents.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="settings">
          <EmergencyContactsManager
            userId={userId}
            onSettingsUpdate={setEmergencySettings}
          />
        </TabsContent>
      </Tabs>

      {/* Incident Details Dialog */}
      <Dialog open={showIncidentDialog} onOpenChange={setShowIncidentDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center text-red-600">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Emergency Incident Details
            </DialogTitle>
          </DialogHeader>
          
          {selectedIncident && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Incident Type</h4>
                  <Badge className="capitalize">
                    {selectedIncident.type.replace('_', ' ')}
                  </Badge>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Status</h4>
                  <Badge className={getIncidentStatusColor(selectedIncident.status)}>
                    {selectedIncident.status}
                  </Badge>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Priority</h4>
                  <Badge className={getPriorityColor(selectedIncident.priority)}>
                    {selectedIncident.priority}
                  </Badge>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Started</h4>
                  <p className="text-sm">{selectedIncident.timestamp.toLocaleString()}</p>
                </div>
              </div>

              {selectedIncident.description && (
                <div>
                  <h4 className="font-medium mb-2">Description</h4>
                  <p className="text-sm text-muted-foreground">{selectedIncident.description}</p>
                </div>
              )}

              <div>
                <h4 className="font-medium mb-2">Location</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedIncident.location.address || 
                   `${selectedIncident.location.latitude.toFixed(6)}, ${selectedIncident.location.longitude.toFixed(6)}`}
                </p>
              </div>

              <div>
                <h4 className="font-medium mb-2">Timeline</h4>
                <div className="space-y-2">
                  {selectedIncident.timeline.map((event) => (
                    <div key={event.id} className="flex items-start space-x-3 p-2 bg-muted rounded">
                      <Clock className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-sm">{event.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {event.timestamp.toLocaleString()} • {event.actor}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex space-x-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setShowIncidentDialog(false)}
                >
                  Close
                </Button>
                {selectedIncident.status === 'active' && (
                  <Button
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => {
                      handleResolveIncident(selectedIncident.id);
                      setShowIncidentDialog(false);
                    }}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Mark Resolved
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}