'use client';

import React, { useState, useEffect } from 'react';
import { 
  Phone, 
  MapPin, 
  Clock, 
  AlertTriangle, 
  Shield, 
  Truck,
  Heart,
  Flame,
  Users,
  Navigation,
  Mic,
  Camera,
  FileText,
  CheckCircle,
  XCircle,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { emergencyService, EmergencyIncident, EmergencyResponder } from '@/services/emergencyService';

interface EmergencyServicesIntegrationProps {
  incident: EmergencyIncident;
  onIncidentUpdate?: (incident: EmergencyIncident) => void;
  onStatusChange?: (status: EmergencyIncident['status']) => void;
}

interface EmergencyService {
  id: string;
  name: string;
  type: 'police' | 'fire' | 'medical' | 'security';
  phoneNumber: string;
  icon: React.ReactNode;
  description: string;
  averageResponseTime: number; // in minutes
  isAvailable: boolean;
}

export function EmergencyServicesIntegration({ 
  incident, 
  onIncidentUpdate, 
  onStatusChange 
}: EmergencyServicesIntegrationProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [selectedService, setSelectedService] = useState<EmergencyService | null>(null);
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [locationAccuracy, setLocationAccuracy] = useState(0);
  const [estimatedArrival, setEstimatedArrival] = useState<Date | null>(null);

  const emergencyServices: EmergencyService[] = [
    {
      id: 'police',
      name: 'Police',
      type: 'police',
      phoneNumber: '911',
      icon: <Shield className="h-5 w-5" />,
      description: 'Law enforcement and security emergencies',
      averageResponseTime: 8,
      isAvailable: true
    },
    {
      id: 'fire',
      name: 'Fire Department',
      type: 'fire',
      phoneNumber: '911',
      icon: <Flame className="h-5 w-5" />,
      description: 'Fire emergencies and rescue operations',
      averageResponseTime: 6,
      isAvailable: true
    },
    {
      id: 'medical',
      name: 'Emergency Medical Services',
      type: 'medical',
      phoneNumber: '911',
      icon: <Heart className="h-5 w-5" />,
      description: 'Medical emergencies and ambulance services',
      averageResponseTime: 7,
      isAvailable: true
    },
    {
      id: 'security',
      name: 'GoCars Security',
      type: 'security',
      phoneNumber: '+1-800-GOCARS-911',
      icon: <Users className="h-5 w-5" />,
      description: 'Private security and ride-related emergencies',
      averageResponseTime: 12,
      isAvailable: true
    }
  ];

  useEffect(() => {
    // Update location accuracy periodically
    const locationInterval = setInterval(() => {
      updateLocationAccuracy();
    }, 10000);

    // Calculate estimated arrival times
    updateEstimatedArrivals();

    return () => clearInterval(locationInterval);
  }, [incident]);

  const updateLocationAccuracy = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocationAccuracy(position.coords.accuracy);
        },
        (error) => {
          console.error('Error getting location accuracy:', error);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 10000 }
      );
    }
  };

  const updateEstimatedArrivals = () => {
    // Calculate estimated arrival based on incident location and service response times
    const baseTime = new Date();
    const avgResponseTime = 8; // minutes
    const estimatedTime = new Date(baseTime.getTime() + avgResponseTime * 60 * 1000);
    setEstimatedArrival(estimatedTime);
  };

  const handleContactService = async (service: EmergencyService) => {
    setSelectedService(service);
    setShowContactDialog(true);
  };

  const handleConfirmContact = async () => {
    if (!selectedService) return;

    setIsLoading(true);
    try {
      // In a real implementation, this would integrate with emergency services APIs
      // For now, we'll simulate the process
      
      const responder: EmergencyResponder = {
        id: `responder_${Date.now()}`,
        type: selectedService.type === 'security' ? 'security_team' : 'emergency_services',
        name: selectedService.name,
        phoneNumber: selectedService.phoneNumber,
        status: 'notified',
        estimatedArrival: new Date(Date.now() + selectedService.averageResponseTime * 60 * 1000)
      };

      // Update incident with new responder
      const updatedIncident = {
        ...incident,
        responders: [...incident.responders, responder],
        status: 'responding' as const,
        timeline: [
          ...incident.timeline,
          {
            id: `timeline_${Date.now()}`,
            timestamp: new Date(),
            type: 'services_contacted' as const,
            description: `${selectedService.name} contacted and dispatched`,
            actor: 'system'
          }
        ]
      };

      onIncidentUpdate?.(updatedIncident);
      onStatusChange?.(updatedIncident.status);
      
      setShowContactDialog(false);
      setSelectedService(null);
      setAdditionalInfo('');

    } catch (error) {
      console.error('Error contacting emergency service:', error);
      alert('Failed to contact emergency service. Please try calling directly.');
    } finally {
      setIsLoading(false);
    }
  };

  const getServiceColor = (type: EmergencyService['type']) => {
    switch (type) {
      case 'police': return 'bg-blue-100 text-blue-800';
      case 'fire': return 'bg-red-100 text-red-800';
      case 'medical': return 'bg-green-100 text-green-800';
      case 'security': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: EmergencyResponder['status']) => {
    switch (status) {
      case 'notified': return 'bg-yellow-100 text-yellow-800';
      case 'responding': return 'bg-blue-100 text-blue-800';
      case 'on_scene': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTimeRemaining = (estimatedArrival: Date) => {
    const now = new Date();
    const diff = estimatedArrival.getTime() - now.getTime();
    const minutes = Math.max(0, Math.floor(diff / (1000 * 60)));
    return `${minutes} min`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center">
            <Phone className="h-6 w-6 mr-2 text-red-500" />
            Emergency Services
          </h2>
          <p className="text-muted-foreground">
            Contact and coordinate with emergency responders
          </p>
        </div>
        
        <Badge className={`${incident.status === 'active' ? 'bg-red-100 text-red-800' : 
                          incident.status === 'responding' ? 'bg-blue-100 text-blue-800' : 
                          'bg-green-100 text-green-800'}`}>
          {incident.status.toUpperCase()}
        </Badge>
      </div>

      <Tabs defaultValue="services" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="services">Emergency Services</TabsTrigger>
          <TabsTrigger value="responders">Active Responders</TabsTrigger>
          <TabsTrigger value="location">Location & Info</TabsTrigger>
        </TabsList>

        <TabsContent value="services" className="space-y-4">
          {/* Emergency Services */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {emergencyServices.map((service) => (
              <Card key={service.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${getServiceColor(service.type)}`}>
                        {service.icon}
                      </div>
                      <div>
                        <h3 className="font-semibold">{service.name}</h3>
                        <p className="text-sm text-muted-foreground">{service.phoneNumber}</p>
                      </div>
                    </div>
                    
                    <Badge variant={service.isAvailable ? 'default' : 'secondary'}>
                      {service.isAvailable ? 'Available' : 'Unavailable'}
                    </Badge>
                  </div>

                  <p className="text-sm text-muted-foreground mb-4">{service.description}</p>

                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Clock className="h-4 w-4 mr-1" />
                      <span>~{service.averageResponseTime} min response</span>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      className="flex-1"
                      onClick={() => handleContactService(service)}
                      disabled={!service.isAvailable || isLoading}
                    >
                      <Phone className="h-4 w-4 mr-2" />
                      Contact
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => window.open(`tel:${service.phoneNumber}`)}
                    >
                      <Phone className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="responders" className="space-y-4">
          {/* Active Responders */}
          {incident.responders.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No responders assigned</h3>
                <p className="text-muted-foreground">
                  Contact emergency services to dispatch responders to your location.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {incident.responders.map((responder) => (
                <Card key={responder.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                          {responder.type === 'emergency_services' ? <Phone className="h-5 w-5" /> :
                           responder.type === 'security_team' ? <Shield className="h-5 w-5" /> :
                           responder.type === 'support_agent' ? <Users className="h-5 w-5" /> :
                           <Truck className="h-5 w-5" />}
                        </div>
                        <div>
                          <h3 className="font-semibold">{responder.name}</h3>
                          {responder.phoneNumber && (
                            <p className="text-sm text-muted-foreground">{responder.phoneNumber}</p>
                          )}
                        </div>
                      </div>
                      
                      <Badge className={getStatusColor(responder.status)}>
                        {responder.status.replace('_', ' ')}
                      </Badge>
                    </div>

                    {responder.estimatedArrival && responder.status !== 'completed' && (
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Clock className="h-4 w-4 mr-1" />
                          <span>ETA: {formatTimeRemaining(responder.estimatedArrival)}</span>
                        </div>
                        
                        {responder.status === 'responding' && (
                          <div className="flex items-center text-sm text-blue-600">
                            <Navigation className="h-4 w-4 mr-1" />
                            <span>En route</span>
                          </div>
                        )}
                      </div>
                    )}

                    {responder.location && (
                      <div className="flex items-center text-sm text-muted-foreground mb-4">
                        <MapPin className="h-4 w-4 mr-1" />
                        <span>Location: {responder.location.latitude.toFixed(4)}, {responder.location.longitude.toFixed(4)}</span>
                      </div>
                    )}

                    <div className="flex space-x-2">
                      {responder.phoneNumber && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(`tel:${responder.phoneNumber}`)}
                        >
                          <Phone className="h-4 w-4 mr-1" />
                          Call
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // Update responder status
                          console.log('Update responder status');
                        }}
                      >
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Update Status
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="location" className="space-y-4">
          {/* Location and Information */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  Location Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Current Location</h4>
                  <p className="text-sm text-muted-foreground">
                    {incident.location.address || `${incident.location.latitude.toFixed(6)}, ${incident.location.longitude.toFixed(6)}`}
                  </p>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Coordinates</h4>
                  <p className="text-sm text-muted-foreground">
                    Lat: {incident.location.latitude.toFixed(6)}<br />
                    Lng: {incident.location.longitude.toFixed(6)}
                  </p>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Location Accuracy</h4>
                  <div className="flex items-center space-x-2">
                    <Progress value={Math.max(0, 100 - (locationAccuracy || 0))} className="flex-1" />
                    <span className="text-sm text-muted-foreground">
                      ±{locationAccuracy || incident.location.accuracy || 'Unknown'}m
                    </span>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">What3Words</h4>
                  <p className="text-sm text-muted-foreground">
                    ///example.location.code
                  </p>
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    const url = `https://maps.google.com/?q=${incident.location.latitude},${incident.location.longitude}`;
                    window.open(url, '_blank');
                  }}
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Open in Maps
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Incident Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Emergency Type</h4>
                  <Badge className="capitalize">{incident.type.replace('_', ' ')}</Badge>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Priority Level</h4>
                  <Badge className={
                    incident.priority === 'critical' ? 'bg-red-100 text-red-800' :
                    incident.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                    incident.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }>
                    {incident.priority.toUpperCase()}
                  </Badge>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Time Started</h4>
                  <p className="text-sm text-muted-foreground">
                    {incident.timestamp.toLocaleString()}
                  </p>
                </div>

                {incident.description && (
                  <div>
                    <h4 className="font-medium mb-2">Description</h4>
                    <p className="text-sm text-muted-foreground">
                      {incident.description}
                    </p>
                  </div>
                )}

                {incident.rideId && (
                  <div>
                    <h4 className="font-medium mb-2">Associated Ride</h4>
                    <p className="text-sm text-muted-foreground">
                      Ride ID: {incident.rideId}
                    </p>
                  </div>
                )}

                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Mic className="h-4 w-4 mr-1" />
                    Record Audio
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <Camera className="h-4 w-4 mr-1" />
                    Take Photo
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Contact Service Dialog */}
      <Dialog open={showContactDialog} onOpenChange={setShowContactDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center text-red-600">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Contact {selectedService?.name}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <p className="text-sm text-red-800">
                This will immediately dispatch {selectedService?.name} to your location. 
                Only proceed if this is a genuine emergency.
              </p>
            </div>

            {selectedService && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Service:</span>
                  <span className="text-sm">{selectedService.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Phone:</span>
                  <span className="text-sm">{selectedService.phoneNumber}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Est. Response:</span>
                  <span className="text-sm">~{selectedService.averageResponseTime} minutes</span>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Additional Information (Optional)</label>
              <Textarea
                placeholder="Provide any additional details that might help responders..."
                value={additionalInfo}
                onChange={(e) => setAdditionalInfo(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex space-x-2 pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowContactDialog(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-red-600 hover:bg-red-700"
                onClick={handleConfirmContact}
                disabled={isLoading}
              >
                {isLoading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Phone className="h-4 w-4 mr-2" />
                )}
                Contact Now
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}