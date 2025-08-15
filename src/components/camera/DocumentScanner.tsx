'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useCamera } from '@/hooks/useCamera';
import { 
  Camera, CameraOff, RotateCcw, Zap, ZapOff, Download,
  FileText, CheckCircle, AlertCircle, Maximize, Settings,
  Trash2, Eye, Upload
} from 'lucide-react';

interface DocumentScannerProps {
  onCapture?: (capture: { dataUrl: string; blob: Blob; timestamp: number }) => void;
  onClose?: () => void;
  documentType?: 'license' | 'insurance' | 'registration' | 'id' | 'other';
  maxCaptures?: number;
}

export function DocumentScanner({ 
  onCapture, 
  onClose, 
  documentType = 'other',
  maxCaptures = 5 
}: DocumentScannerProps) {
  const {
    isSupported,
    isActive,
    hasPermission,
    error,
    devices,
    currentDeviceId,
    videoRef,
    canvasRef,
    checkPermissions,
    getDevices,
    startCamera,
    stopCamera,
    capturePhoto,
    switchCamera,
    toggleFlash,
    getCapabilities,
    setZoom
  } = useCamera();

  const [captures, setCaptures] = useState<Array<{ dataUrl: string; blob: Blob; timestamp: number }>>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [selectedCapture, setSelectedCapture] = useState<number | null>(null);
  const [capabilities, setCapabilities] = useState<MediaTrackCapabilities | null>(null);

  useEffect(() => {
    initializeCamera();
    return () => {
      stopCamera();
    };
  }, []);

  useEffect(() => {
    if (isActive) {
      const caps = getCapabilities();
      setCapabilities(caps);
    }
  }, [isActive, getCapabilities]);

  const initializeCamera = async () => {
    if (!isSupported) return;

    const hasPermission = await checkPermissions();
    if (hasPermission) {
      await getDevices();
      await startCamera({ facingMode: 'environment' });
    }
  };

  const handleCapture = async () => {
    if (captures.length >= maxCaptures) return;

    setIsCapturing(true);
    try {
      const capture = await capturePhoto(0.9);
      if (capture) {
        setCaptures(prev => [...prev, capture]);
        onCapture?.(capture);
      }
    } finally {
      setIsCapturing(false);
    }
  };

  const handleDeleteCapture = (index: number) => {
    setCaptures(prev => prev.filter((_, i) => i !== index));
    if (selectedCapture === index) {
      setSelectedCapture(null);
    }
  };

  const handleSwitchCamera = async () => {
    if (devices.length <= 1) return;

    const currentIndex = devices.findIndex(device => device.deviceId === currentDeviceId);
    const nextIndex = (currentIndex + 1) % devices.length;
    const nextDevice = devices[nextIndex];

    if (nextDevice) {
      await switchCamera(nextDevice.deviceId);
    }
  };

  const handleToggleFlash = async () => {
    const success = await toggleFlash(!flashEnabled);
    if (success) {
      setFlashEnabled(!flashEnabled);
    }
  };

  const handleZoomChange = async (newZoom: number) => {
    const success = await setZoom(newZoom);
    if (success) {
      setZoomLevel(newZoom);
    }
  };

  const downloadCapture = (capture: { dataUrl: string; blob: Blob; timestamp: number }, index: number) => {
    const link = document.createElement('a');
    link.href = capture.dataUrl;
    link.download = `${documentType}-scan-${index + 1}-${new Date(capture.timestamp).toISOString().split('T')[0]}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getDocumentTypeLabel = () => {
    const labels = {
      license: 'Driver\'s License',
      insurance: 'Insurance Card',
      registration: 'Vehicle Registration',
      id: 'ID Document',
      other: 'Document'
    };
    return labels[documentType];
  };

  if (!isSupported) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <span>Camera Not Supported</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            Your device doesn't support camera access. Please use a different device or upload files manually.
          </p>
          <Button onClick={onClose} className="w-full mt-4">
            Close
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (error && !hasPermission) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <span>Camera Permission Required</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Permission Needed</AlertTitle>
            <AlertDescription>
              Please allow camera access to scan documents. You can change this in your browser settings.
            </AlertDescription>
          </Alert>
          <div className="flex space-x-2">
            <Button onClick={initializeCamera} className="flex-1">
              <Camera className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            <Button onClick={onClose} variant="outline" className="flex-1">
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Scan {getDocumentTypeLabel()}</span>
              </CardTitle>
              <CardDescription>
                Position the document within the frame and tap capture
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline">
                {captures.length}/{maxCaptures} captures
              </Badge>
              {onClose && (
                <Button variant="outline" size="sm" onClick={onClose}>
                  Close
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Camera View */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-4">
              <div className="relative bg-black rounded-lg overflow-hidden aspect-[4/3]">
                {isActive ? (
                  <>
                    <video
                      ref={videoRef}
                      className="w-full h-full object-cover"
                      playsInline
                      muted
                    />
                    
                    {/* Overlay guides */}
                    <div className="absolute inset-4 border-2 border-white border-dashed rounded-lg opacity-50" />
                    <div className="absolute top-4 left-4 right-4">
                      <div className="bg-black bg-opacity-50 text-white text-sm p-2 rounded">
                        Position {getDocumentTypeLabel().toLowerCase()} within the frame
                      </div>
                    </div>

                    {/* Camera controls overlay */}
                    <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {capabilities?.torch && (
                          <Button
                            size="sm"
                            variant={flashEnabled ? "default" : "outline"}
                            onClick={handleToggleFlash}
                            className="bg-black bg-opacity-50 border-white"
                          >
                            {flashEnabled ? <Zap className="h-4 w-4" /> : <ZapOff className="h-4 w-4" />}
                          </Button>
                        )}
                        
                        {devices.length > 1 && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleSwitchCamera}
                            className="bg-black bg-opacity-50 border-white"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      {/* Capture button */}
                      <Button
                        size="lg"
                        onClick={handleCapture}
                        disabled={isCapturing || captures.length >= maxCaptures}
                        className="bg-white text-black hover:bg-gray-100 rounded-full w-16 h-16"
                      >
                        {isCapturing ? (
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black" />
                        ) : (
                          <Camera className="h-6 w-6" />
                        )}
                      </Button>

                      <div className="flex items-center space-x-2">
                        {capabilities?.zoom && (
                          <div className="flex items-center space-x-2 bg-black bg-opacity-50 p-2 rounded">
                            <span className="text-white text-sm">Zoom</span>
                            <input
                              type="range"
                              min={capabilities.zoom.min || 1}
                              max={capabilities.zoom.max || 3}
                              step={0.1}
                              value={zoomLevel}
                              onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
                              className="w-20"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center text-white">
                      <CameraOff className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg mb-2">Camera Inactive</p>
                      <Button onClick={initializeCamera} variant="outline">
                        <Camera className="h-4 w-4 mr-2" />
                        Start Camera
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {error && (
                <Alert className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Camera Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Captures Panel */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Captured Images</CardTitle>
              <CardDescription>
                Review and manage your scanned documents
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {captures.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No captures yet</p>
                  <p className="text-sm">Use the camera to scan documents</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {captures.map((capture, index) => (
                    <div key={index} className="relative group">
                      <div 
                        className={`border-2 rounded-lg overflow-hidden cursor-pointer transition-all ${
                          selectedCapture === index ? 'border-blue-500' : 'border-gray-200'
                        }`}
                        onClick={() => setSelectedCapture(selectedCapture === index ? null : index)}
                      >
                        <img
                          src={capture.dataUrl}
                          alt={`Capture ${index + 1}`}
                          className="w-full h-24 object-cover"
                        />
                        <div className="absolute top-2 right-2 flex space-x-1">
                          <Badge variant="secondary" className="text-xs">
                            {index + 1}
                          </Badge>
                        </div>
                      </div>
                      
                      {selectedCapture === index && (
                        <div className="mt-2 flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => downloadCapture(capture, index)}
                            className="flex-1"
                          >
                            <Download className="h-3 w-3 mr-1" />
                            Download
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteCapture(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {captures.length > 0 && (
                <div className="pt-4 border-t">
                  <Button className="w-full" onClick={() => {
                    captures.forEach((capture, index) => downloadCapture(capture, index));
                  }}>
                    <Download className="h-4 w-4 mr-2" />
                    Download All ({captures.length})
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Scanning Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-start space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                <span>Ensure good lighting for clear images</span>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                <span>Keep the document flat and within the frame</span>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                <span>Hold the device steady when capturing</span>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                <span>Use flash in low light conditions</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Hidden canvas for image processing */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}