'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  AlertTriangle, 
  Phone, 
  Shield, 
  MapPin, 
  Mic, 
  Camera,
  Clock,
  X,
  Check,
  Volume2,
  VolumeX
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { emergencyService, EmergencyIncident } from '@/services/emergencyService';

interface EmergencySOSButtonProps {
  userId: string;
  rideId?: string;
  position?: 'fixed' | 'inline';
  size?: 'small' | 'medium' | 'large';
  discreteMode?: boolean;
  onEmergencyActivated?: (incident: EmergencyIncident) => void;
}

export function EmergencySOSButton({ 
  userId, 
  rideId, 
  position = 'fixed',
  size = 'medium',
  discreteMode = false,
  onEmergencyActivated 
}: EmergencySOSButtonProps) {
  const [isActivating, setIsActivating] = useState(false);
  const [activationProgress, setActivationProgress] = useState(0);
  const [showEmergencyDialog, setShowEmergencyDialog] = useState(false);
  const [selectedEmergencyType, setSelectedEmergencyType] = useState<EmergencyIncident['type']>('sos');
  const [emergencyDescription, setEmergencyDescription] = useState('');
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const [tapCount, setTapCount] = useState(0);
  const [lastTapTime, setLastTapTime] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [countdown, setCountdown] = useState(0);
  
  const activationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const tapTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Get current location on component mount
    getCurrentLocation();
    
    // Cleanup timers on unmount
    return () => {
      if (activationTimerRef.current) clearTimeout(activationTimerRef.current);
      if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, []);

  const getCurrentLocation = async () => {
    setIsLocationLoading(true);
    try {
      if (!navigator.geolocation) {
        console.warn('Geolocation not supported');
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setIsLocationLoading(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          setIsLocationLoading(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    } catch (error) {
      console.error('Error getting location:', error);
      setIsLocationLoading(false);
    }
  };

  const handleSOSPress = () => {
    if (discreteMode) {
      // In discrete mode, show dialog immediately
      setShowEmergencyDialog(true);
      return;
    }

    // Handle triple-tap activation
    const now = Date.now();
    const timeSinceLastTap = now - lastTapTime;
    
    if (timeSinceLastTap < 500) { // Within 500ms of last tap
      setTapCount(prev => prev + 1);
    } else {
      setTapCount(1);
    }
    
    setLastTapTime(now);

    // Clear existing tap timer
    if (tapTimerRef.current) {
      clearTimeout(tapTimerRef.current);
    }

    // Set new tap timer
    tapTimerRef.current = setTimeout(() => {
      setTapCount(0);
    }, 1000);

    // Check for triple tap
    if (tapCount >= 2) { // Third tap (0-indexed)
      startEmergencyActivation();
      setTapCount(0);
    }
  };

  const handleLongPress = () => {
    if (discreteMode) return;
    startEmergencyActivation();
  };

  const startEmergencyActivation = () => {
    setIsActivating(true);
    setActivationProgress(0);
    setCountdown(5);

    // Start countdown
    countdownTimerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          // Countdown finished, activate emergency
          activateEmergency();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Progress animation
    let progress = 0;
    const progressInterval = setInterval(() => {
      progress += 2; // 2% every 100ms = 5 seconds total
      setActivationProgress(progress);
      
      if (progress >= 100) {
        clearInterval(progressInterval);
      }
    }, 100);

    // Auto-activate after 5 seconds
    activationTimerRef.current = setTimeout(() => {
      activateEmergency();
    }, 5000);
  };

  const cancelActivation = () => {
    setIsActivating(false);
    setActivationProgress(0);
    setCountdown(0);
    
    if (activationTimerRef.current) {
      clearTimeout(activationTimerRef.current);
      activationTimerRef.current = null;
    }
    
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
  };

  const activateEmergency = async () => {
    try {
      setIsActivating(false);
      setActivationProgress(0);
      setCountdown(0);
      
      if (!currentLocation) {
        await getCurrentLocation();
      }

      if (!currentLocation) {
        alert('Unable to get your location. Please enable location services and try again.');
        return;
      }

      const incident = await emergencyService.createEmergencyIncident(
        userId,
        selectedEmergencyType,
        {
          latitude: currentLocation.lat,
          longitude: currentLocation.lng,
          accuracy: 10,
          timestamp: new Date()
        },
        {
          rideId,
          description: emergencyDescription,
          discreteMode
        }
      );

      onEmergencyActivated?.(incident);
      
      // Show success feedback
      if (!discreteMode) {
        alert('Emergency services have been notified. Help is on the way.');
      }

    } catch (error) {
      console.error('Error activating emergency:', error);
      alert('Failed to activate emergency. Please try again or call 911 directly.');
    }
  };

  const handleManualActivation = async () => {
    setShowEmergencyDialog(false);
    await activateEmergency();
  };

  const getButtonSize = () => {
    switch (size) {
      case 'small': return 'h-12 w-12';
      case 'large': return 'h-20 w-20';
      default: return 'h-16 w-16';
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'small': return 'h-5 w-5';
      case 'large': return 'h-10 w-10';
      default: return 'h-8 w-8';
    }
  };

  const emergencyTypes = [
    { value: 'sos', label: 'General Emergency', icon: AlertTriangle },
    { value: 'medical', label: 'Medical Emergency', icon: Phone },
    { value: 'accident', label: 'Accident', icon: AlertTriangle },
    { value: 'harassment', label: 'Harassment', icon: Shield },
    { value: 'panic', label: 'Panic/Threat', icon: AlertTriangle },
    { value: 'vehicle_issue', label: 'Vehicle Issue', icon: AlertTriangle },
    { value: 'other', label: 'Other', icon: AlertTriangle }
  ];

  return (
    <>
      {/* SOS Button */}
      <div className={position === 'fixed' ? 'fixed bottom-6 right-6 z-50' : ''}>
        <div className="relative">
          {/* Activation Progress Ring */}
          {isActivating && (
            <div className="absolute inset-0 -m-2">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                  className="text-red-200"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 45}`}
                  strokeDashoffset={`${2 * Math.PI * 45 * (1 - activationProgress / 100)}`}
                  className="text-red-500 transition-all duration-100"
                />
              </svg>
            </div>
          )}

          {/* Main Button */}
          <Button
            className={`${getButtonSize()} rounded-full bg-red-600 hover:bg-red-700 text-white shadow-lg transition-all duration-200 ${
              isActivating ? 'animate-pulse scale-110' : ''
            } ${discreteMode ? 'bg-gray-600 hover:bg-gray-700' : ''}`}
            onMouseDown={handleLongPress}
            onTouchStart={handleLongPress}
            onClick={handleSOSPress}
            disabled={isActivating}
          >
            {isActivating ? (
              <div className="flex flex-col items-center">
                <AlertTriangle className={`${getIconSize()} animate-bounce`} />
                {countdown > 0 && (
                  <span className="text-xs font-bold mt-1">{countdown}</span>
                )}
              </div>
            ) : (
              <AlertTriangle className={getIconSize()} />
            )}
          </Button>

          {/* Tap Counter */}
          {tapCount > 0 && !isActivating && (
            <div className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
              {tapCount}
            </div>
          )}

          {/* Cancel Button (during activation) */}
          {isActivating && (
            <Button
              className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 text-sm"
              onClick={cancelActivation}
            >
              Cancel
            </Button>
          )}
        </div>

        {/* Discrete Mode Indicator */}
        {discreteMode && (
          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
            <Badge variant="secondary" className="text-xs">
              Discrete
            </Badge>
          </div>
        )}
      </div>

      {/* Emergency Dialog */}
      <Dialog open={showEmergencyDialog} onOpenChange={setShowEmergencyDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center text-red-600">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Emergency Activation
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <p className="text-sm text-red-800">
                This will immediately notify emergency contacts and services. Only use in genuine emergencies.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Emergency Type</label>
              <Select value={selectedEmergencyType} onValueChange={(value: any) => setSelectedEmergencyType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {emergencyTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center">
                        <type.icon className="h-4 w-4 mr-2" />
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description (Optional)</label>
              <Textarea
                placeholder="Briefly describe the emergency..."
                value={emergencyDescription}
                onChange={(e) => setEmergencyDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>
                {isLocationLoading ? 'Getting location...' : 
                 currentLocation ? 'Location will be shared' : 'Location unavailable'}
              </span>
            </div>

            <div className="flex space-x-2 pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowEmergencyDialog(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-red-600 hover:bg-red-700"
                onClick={handleManualActivation}
                disabled={isLocationLoading}
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Activate Emergency
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}