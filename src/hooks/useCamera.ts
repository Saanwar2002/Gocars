'use client';

import { useState, useRef, useCallback } from 'react';

interface CameraState {
  isSupported: boolean;
  isActive: boolean;
  hasPermission: boolean;
  error: string | null;
  devices: MediaDeviceInfo[];
  currentDeviceId: string | null;
}

interface CameraCapture {
  dataUrl: string;
  blob: Blob;
  timestamp: number;
}

interface CameraConstraints {
  width?: number;
  height?: number;
  facingMode?: 'user' | 'environment';
  deviceId?: string;
}

export function useCamera() {
  const [state, setState] = useState<CameraState>({
    isSupported: typeof navigator !== 'undefined' && 'mediaDevices' in navigator,
    isActive: false,
    hasPermission: false,
    error: null,
    devices: [],
    currentDeviceId: null,
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const checkPermissions = useCallback(async (): Promise<boolean> => {
    if (!state.isSupported) {
      setState(prev => ({ ...prev, error: 'Camera not supported' }));
      return false;
    }

    try {
      const permission = await navigator.permissions.query({ name: 'camera' as PermissionName });
      const hasPermission = permission.state === 'granted';
      
      setState(prev => ({ 
        ...prev, 
        hasPermission,
        error: permission.state === 'denied' ? 'Camera permission denied' : null
      }));
      
      return hasPermission;
    } catch (error) {
      console.error('Error checking camera permissions:', error);
      setState(prev => ({ ...prev, error: 'Failed to check camera permissions' }));
      return false;
    }
  }, [state.isSupported]);

  const getDevices = useCallback(async (): Promise<MediaDeviceInfo[]> => {
    if (!state.isSupported) return [];

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      setState(prev => ({ ...prev, devices: videoDevices }));
      return videoDevices;
    } catch (error) {
      console.error('Error getting camera devices:', error);
      setState(prev => ({ ...prev, error: 'Failed to get camera devices' }));
      return [];
    }
  }, [state.isSupported]);

  const startCamera = useCallback(async (constraints: CameraConstraints = {}): Promise<boolean> => {
    if (!state.isSupported) {
      setState(prev => ({ ...prev, error: 'Camera not supported' }));
      return false;
    }

    try {
      // Stop existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const mediaConstraints: MediaStreamConstraints = {
        video: {
          width: constraints.width || 1280,
          height: constraints.height || 720,
          facingMode: constraints.facingMode || 'environment',
          ...(constraints.deviceId && { deviceId: { exact: constraints.deviceId } })
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(mediaConstraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setState(prev => ({ 
        ...prev, 
        isActive: true, 
        hasPermission: true,
        error: null,
        currentDeviceId: constraints.deviceId || null
      }));

      // Get available devices after successful camera start
      await getDevices();

      return true;
    } catch (error) {
      console.error('Error starting camera:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to start camera';
      setState(prev => ({ 
        ...prev, 
        isActive: false,
        hasPermission: false,
        error: errorMessage
      }));
      return false;
    }
  }, [state.isSupported, getDevices]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setState(prev => ({ ...prev, isActive: false, currentDeviceId: null }));
  }, []);

  const capturePhoto = useCallback(async (quality: number = 0.9): Promise<CameraCapture | null> => {
    if (!videoRef.current || !state.isActive) {
      setState(prev => ({ ...prev, error: 'Camera not active' }));
      return null;
    }

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current || document.createElement('canvas');
      const context = canvas.getContext('2d');

      if (!context) {
        setState(prev => ({ ...prev, error: 'Failed to get canvas context' }));
        return null;
      }

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert to data URL and blob
      const dataUrl = canvas.toDataURL('image/jpeg', quality);
      
      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) {
            resolve({
              dataUrl,
              blob,
              timestamp: Date.now()
            });
          } else {
            setState(prev => ({ ...prev, error: 'Failed to create image blob' }));
            resolve(null);
          }
        }, 'image/jpeg', quality);
      });
    } catch (error) {
      console.error('Error capturing photo:', error);
      setState(prev => ({ ...prev, error: 'Failed to capture photo' }));
      return null;
    }
  }, [state.isActive]);

  const switchCamera = useCallback(async (deviceId: string): Promise<boolean> => {
    if (!state.isActive) return false;

    return await startCamera({ deviceId });
  }, [state.isActive, startCamera]);

  const toggleFlash = useCallback(async (enabled: boolean): Promise<boolean> => {
    if (!streamRef.current) return false;

    try {
      const track = streamRef.current.getVideoTracks()[0];
      const capabilities = track.getCapabilities();

      if ('torch' in capabilities) {
        await track.applyConstraints({
          advanced: [{ torch: enabled } as any]
        });
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error toggling flash:', error);
      return false;
    }
  }, []);

  const getCapabilities = useCallback((): MediaTrackCapabilities | null => {
    if (!streamRef.current) return null;

    try {
      const track = streamRef.current.getVideoTracks()[0];
      return track.getCapabilities();
    } catch (error) {
      console.error('Error getting camera capabilities:', error);
      return null;
    }
  }, []);

  const setZoom = useCallback(async (zoomLevel: number): Promise<boolean> => {
    if (!streamRef.current) return false;

    try {
      const track = streamRef.current.getVideoTracks()[0];
      const capabilities = track.getCapabilities();

      if ('zoom' in capabilities) {
        const settings = track.getSettings();
        const constraints = {
          advanced: [{ 
            zoom: Math.max(
              capabilities.zoom?.min || 1,
              Math.min(capabilities.zoom?.max || 1, zoomLevel)
            )
          } as any]
        };

        await track.applyConstraints(constraints);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error setting zoom:', error);
      return false;
    }
  }, []);

  return {
    ...state,
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
    setZoom,
  };
}