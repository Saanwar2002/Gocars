'use client';

import React, { useState, useEffect } from 'react';
import { useSessionSync } from '@/hooks/useSessionSync';
import { usePlatformDetection } from '@/hooks/usePlatformDetection';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import {
  Smartphone, Monitor, Tablet, Share, ArrowRight,
  CheckCircle, Clock, Wifi, QrCode, Link, Copy
} from 'lucide-react';

interface HandoffManagerProps {
  userId: string;
  currentPath?: string;
  currentState?: Record<string, any>;
  onHandoffComplete?: (deviceId: string) => void;
  onHandoffReceived?: (data: any) => void;
  className?: string;
}

export function HandoffManager({
  userId,
  currentPath,
  currentState,
  onHandoffComplete,
  onHandoffReceived,
  className
}: HandoffManagerProps) {
  const {
    activeSessions,
    handoffToDevice,
    checkForHandoffs,
    currentSession,
    deviceId
  } = useSessionSync(userId);
  
  const { platformInfo, isMobile, isTablet, isDesktop } = usePlatformDetection();
  
  const [handoffInProgress, setHandoffInProgress] = useState(false);
  const [handoffProgress, setHandoffProgress] = useState(0);
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [showQRCode, setShowQRCode] = useState(false);
  const [handoffUrl, setHandoffUrl] = useState<string | null>(null);

  // Check for incoming handoffs
  useEffect(() => {
    const checkInterval = setInterval(() => {
      const handoff = checkForHandoffs();
      if (handoff && onHandoffReceived) {
        onHandoffReceived(handoff);
      }
    }, 2000);

    return () => clearInterval(checkInterval);
  }, [checkForHandoffs, onHandoffReceived]);

  // Generate handoff URL
  const generateHandoffUrl = (targetDeviceId?: string) => {
    const baseUrl = window.location.origin;
    const handoffData = {
      path: currentPath || window.location.pathname,
      state: currentState,
      timestamp: Date.now(),
      fromDevice: deviceId,
      toDevice: targetDeviceId,
    };

    const encodedData = btoa(JSON.stringify(handoffData));
    return `${baseUrl}/handoff?data=${encodedData}`;
  };

  // Handle device handoff
  const handleDeviceHandoff = async (targetDeviceId: string, includeState = true) => {
    setHandoffInProgress(true);
    setHandoffProgress(0);

    try {
      // Simulate handoff progress
      const progressInterval = setInterval(() => {
        setHandoffProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Perform handoff
      const success = handoffToDevice(targetDeviceId, includeState);
      
      if (success) {
        setHandoffProgress(100);
        setTimeout(() => {
          setHandoffInProgress(false);
          setHandoffProgress(0);
          onHandoffComplete?.(targetDeviceId);
        }, 1000);
      } else {
        throw new Error('Handoff failed');
      }
    } catch (error) {
      console.error('Handoff error:', error);
      setHandoffInProgress(false);
      setHandoffProgress(0);
    }
  };

  // Handle URL handoff
  const handleUrlHandoff = () => {
    const url = generateHandoffUrl();
    setHandoffUrl(url);
    setShowQRCode(true);
  };

  // Copy handoff URL
  const copyHandoffUrl = async () => {
    if (handoffUrl) {
      try {
        await navigator.clipboard.writeText(handoffUrl);
        // Show success feedback
      } catch (error) {
        console.error('Failed to copy URL:', error);
      }
    }
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'mobile': return <Smartphone className="h-5 w-5" />;
      case 'tablet': return <Tablet className="h-5 w-5" />;
      default: return <Monitor className="h-5 w-5" />;
    }
  };

  const availableDevices = activeSessions.filter(session => 
    session.deviceId !== deviceId && session.isActive
  );

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Share className="h-5 w-5 mr-2" />
          Device Handoff
        </CardTitle>
        <CardDescription>
          Continue your session on another device
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Current Device Info */}
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center space-x-3">
            {getDeviceIcon(platformInfo.type)}
            <div>
              <p className="font-medium text-blue-900">Current Device</p>
              <p className="text-sm text-blue-700">
                {platformInfo.os} {platformInfo.browser} • {deviceId.slice(-8)}
              </p>
            </div>
            <Badge variant="outline" className="ml-auto">
              Active
            </Badge>
          </div>
        </div>

        {/* Handoff Progress */}
        {handoffInProgress && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Handing off session...</span>
              <span>{handoffProgress}%</span>
            </div>
            <Progress value={handoffProgress} />
          </div>
        )}

        {/* Available Devices */}
        {availableDevices.length > 0 ? (
          <div className="space-y-3">
            <h4 className="font-medium">Available Devices</h4>
            {availableDevices.map((device) => (
              <div
                key={device.deviceId}
                className={cn(
                  'p-3 border rounded-lg cursor-pointer transition-colors',
                  selectedDevice === device.deviceId
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                )}
                onClick={() => setSelectedDevice(
                  selectedDevice === device.deviceId ? null : device.deviceId
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getDeviceIcon(device.deviceType)}
                    <div>
                      <p className="font-medium">{device.deviceName}</p>
                      <p className="text-sm text-gray-600">
                        {device.browser} on {device.os}
                      </p>
                      {device.location && (
                        <p className="text-xs text-gray-500">
                          At: {device.location.pathname}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1 text-sm text-gray-500">
                      <Wifi className="h-3 w-3" />
                      <Clock className="h-3 w-3" />
                      <span>
                        {Math.floor((Date.now() - device.lastSeen) / 60000)}m ago
                      </span>
                    </div>
                    
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeviceHandoff(device.deviceId);
                      }}
                      disabled={handoffInProgress}
                    >
                      <ArrowRight className="h-4 w-4 mr-1" />
                      Handoff
                    </Button>
                  </div>
                </div>

                {selectedDevice === device.deviceId && (
                  <div className="mt-3 pt-3 border-t space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Include current state:</span>
                      <input type="checkbox" defaultChecked className="rounded" />
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Include preferences:</span>
                      <input type="checkbox" defaultChecked className="rounded" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <Alert>
            <Smartphone className="h-4 w-4" />
            <AlertDescription>
              No other devices are currently active. Open GoCars on another device to enable handoff.
            </AlertDescription>
          </Alert>
        )}

        {/* URL Handoff */}
        <div className="pt-4 border-t">
          <h4 className="font-medium mb-2">Share via Link</h4>
          <p className="text-sm text-gray-600 mb-3">
            Generate a link to continue this session on any device
          </p>
          
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={handleUrlHandoff}
              className="flex-1"
            >
              <Link className="h-4 w-4 mr-2" />
              Generate Link
            </Button>
            
            <Button
              variant="outline"
              onClick={() => setShowQRCode(true)}
            >
              <QrCode className="h-4 w-4" />
            </Button>
          </div>

          {handoffUrl && (
            <div className="mt-3 p-3 bg-gray-50 rounded border">
              <div className="flex items-center justify-between">
                <code className="text-sm text-gray-700 truncate flex-1 mr-2">
                  {handoffUrl}
                </code>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={copyHandoffUrl}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* QR Code Modal */}
        {showQRCode && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-80">
              <CardHeader>
                <CardTitle>Scan to Continue</CardTitle>
                <CardDescription>
                  Scan this QR code with another device
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <div className="w-48 h-48 bg-gray-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
                  <QrCode className="h-16 w-16 text-gray-400" />
                  <span className="ml-2 text-gray-500">QR Code</span>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowQRCode(false)}
                  className="w-full"
                >
                  Close
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Handoff Instructions */}
        <div className="text-xs text-gray-500 space-y-1">
          <p>• Handoff preserves your current location and app state</p>
          <p>• Target device must be signed in to the same account</p>
          <p>• Session will continue seamlessly on the target device</p>
        </div>
      </CardContent>
    </Card>
  );
}

// Handoff receiver component
export function HandoffReceiver({
  onHandoffReceived,
  className
}: {
  onHandoffReceived?: (data: any) => void;
  className?: string;
}) {
  const [handoffData, setHandoffData] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // Check URL for handoff data
    const urlParams = new URLSearchParams(window.location.search);
    const handoffParam = urlParams.get('data');
    
    if (handoffParam) {
      try {
        const data = JSON.parse(atob(handoffParam));
        setHandoffData(data);
      } catch (error) {
        console.error('Failed to parse handoff data:', error);
      }
    }
  }, []);

  const acceptHandoff = async () => {
    if (!handoffData) return;

    setIsProcessing(true);
    
    try {
      // Apply handoff data
      if (handoffData.path && handoffData.path !== window.location.pathname) {
        window.history.pushState(null, '', handoffData.path);
      }
      
      if (handoffData.state) {
        // Apply state to your app
        onHandoffReceived?.(handoffData);
      }
      
      // Clear handoff data from URL
      const url = new URL(window.location.href);
      url.searchParams.delete('data');
      window.history.replaceState(null, '', url.toString());
      
      setHandoffData(null);
    } catch (error) {
      console.error('Failed to accept handoff:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const declineHandoff = () => {
    setHandoffData(null);
    
    // Clear handoff data from URL
    const url = new URL(window.location.href);
    url.searchParams.delete('data');
    window.history.replaceState(null, '', url.toString());
  };

  if (!handoffData) return null;

  return (
    <div className="fixed top-4 right-4 z-50">
      <Card className={cn('w-80', className)}>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Share className="h-5 w-5 mr-2" />
            Session Handoff
          </CardTitle>
          <CardDescription>
            Continue session from another device
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="text-sm">
            <p><strong>From:</strong> {handoffData.fromDevice?.slice(-8)}</p>
            <p><strong>Path:</strong> {handoffData.path}</p>
            <p><strong>Time:</strong> {new Date(handoffData.timestamp).toLocaleTimeString()}</p>
          </div>
          
          <div className="flex space-x-2">
            <Button
              onClick={acceptHandoff}
              disabled={isProcessing}
              className="flex-1"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Accept
                </>
              )}
            </Button>
            
            <Button
              variant="outline"
              onClick={declineHandoff}
              disabled={isProcessing}
            >
              Decline
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}