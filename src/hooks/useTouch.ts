'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface TouchState {
  isTouch: boolean;
  isMobile: boolean;
  orientation: 'portrait' | 'landscape';
  screenSize: 'small' | 'medium' | 'large';
  touchPoints: number;
}

interface GestureState {
  isGesturing: boolean;
  gestureType: 'tap' | 'swipe' | 'pinch' | 'pan' | 'long-press' | null;
  direction: 'up' | 'down' | 'left' | 'right' | null;
  distance: number;
  velocity: number;
  scale: number;
  rotation: number;
}

interface TouchPoint {
  x: number;
  y: number;
  timestamp: number;
}

export function useTouch() {
  const [touchState, setTouchState] = useState<TouchState>({
    isTouch: false,
    isMobile: false,
    orientation: 'portrait',
    screenSize: 'medium',
    touchPoints: 0,
  });

  const [gestureState, setGestureState] = useState<GestureState>({
    isGesturing: false,
    gestureType: null,
    direction: null,
    distance: 0,
    velocity: 0,
    scale: 1,
    rotation: 0,
  });

  const touchStartRef = useRef<TouchPoint | null>(null);
  const touchEndRef = useRef<TouchPoint | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const gestureCallbacksRef = useRef<{
    onSwipe?: (direction: string, distance: number, velocity: number) => void;
    onPinch?: (scale: number) => void;
    onTap?: (x: number, y: number) => void;
    onLongPress?: (x: number, y: number) => void;
    onPan?: (deltaX: number, deltaY: number) => void;
  }>({});

  const detectDeviceType = useCallback(() => {
    const userAgent = navigator.userAgent;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    const screenWidth = window.innerWidth;
    let screenSize: 'small' | 'medium' | 'large' = 'medium';
    
    if (screenWidth < 640) screenSize = 'small';
    else if (screenWidth < 1024) screenSize = 'medium';
    else screenSize = 'large';

    const orientation = window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';

    setTouchState(prev => ({
      ...prev,
      isTouch,
      isMobile,
      orientation,
      screenSize,
    }));
  }, []);

  const calculateDistance = useCallback((start: TouchPoint, end: TouchPoint): number => {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  const calculateVelocity = useCallback((start: TouchPoint, end: TouchPoint): number => {
    const distance = calculateDistance(start, end);
    const time = end.timestamp - start.timestamp;
    return time > 0 ? distance / time : 0;
  }, [calculateDistance]);

  const getSwipeDirection = useCallback((start: TouchPoint, end: TouchPoint): 'up' | 'down' | 'left' | 'right' => {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    
    if (Math.abs(dx) > Math.abs(dy)) {
      return dx > 0 ? 'right' : 'left';
    } else {
      return dy > 0 ? 'down' : 'up';
    }
  }, []);

  const handleTouchStart = useCallback((event: TouchEvent) => {
    const touch = event.touches[0];
    const touchPoint: TouchPoint = {
      x: touch.clientX,
      y: touch.clientY,
      timestamp: Date.now(),
    };

    touchStartRef.current = touchPoint;
    setTouchState(prev => ({ ...prev, touchPoints: event.touches.length }));

    // Start long press timer
    longPressTimerRef.current = setTimeout(() => {
      setGestureState(prev => ({
        ...prev,
        isGesturing: true,
        gestureType: 'long-press',
      }));
      
      gestureCallbacksRef.current.onLongPress?.(touchPoint.x, touchPoint.y);
    }, 500);

    setGestureState(prev => ({
      ...prev,
      isGesturing: true,
      gestureType: null,
    }));
  }, []);

  const handleTouchMove = useCallback((event: TouchEvent) => {
    if (!touchStartRef.current) return;

    // Clear long press timer on move
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    const touch = event.touches[0];
    const currentPoint: TouchPoint = {
      x: touch.clientX,
      y: touch.clientY,
      timestamp: Date.now(),
    };

    const distance = calculateDistance(touchStartRef.current, currentPoint);
    const deltaX = currentPoint.x - touchStartRef.current.x;
    const deltaY = currentPoint.y - touchStartRef.current.y;

    // Handle multi-touch gestures
    if (event.touches.length === 2) {
      const touch1 = event.touches[0];
      const touch2 = event.touches[1];
      
      const currentDistance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) + 
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      
      // This would need initial distance stored to calculate scale
      // For now, we'll use a simplified approach
      setGestureState(prev => ({
        ...prev,
        gestureType: 'pinch',
        scale: currentDistance / 100, // Simplified scale calculation
      }));

      gestureCallbacksRef.current.onPinch?.(currentDistance / 100);
    } else if (distance > 10) {
      // Single touch pan/swipe
      setGestureState(prev => ({
        ...prev,
        gestureType: distance > 50 ? 'swipe' : 'pan',
        distance,
        direction: getSwipeDirection(touchStartRef.current!, currentPoint),
      }));

      if (distance > 50) {
        const velocity = calculateVelocity(touchStartRef.current, currentPoint);
        const direction = getSwipeDirection(touchStartRef.current, currentPoint);
        gestureCallbacksRef.current.onSwipe?.(direction, distance, velocity);
      } else {
        gestureCallbacksRef.current.onPan?.(deltaX, deltaY);
      }
    }

    setTouchState(prev => ({ ...prev, touchPoints: event.touches.length }));
  }, [calculateDistance, calculateVelocity, getSwipeDirection]);

  const handleTouchEnd = useCallback((event: TouchEvent) => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    if (!touchStartRef.current) return;

    const touch = event.changedTouches[0];
    const touchPoint: TouchPoint = {
      x: touch.clientX,
      y: touch.clientY,
      timestamp: Date.now(),
    };

    touchEndRef.current = touchPoint;
    const distance = calculateDistance(touchStartRef.current, touchPoint);
    const timeDiff = touchPoint.timestamp - touchStartRef.current.timestamp;

    // Detect tap (short distance, short time)
    if (distance < 10 && timeDiff < 300) {
      setGestureState(prev => ({
        ...prev,
        gestureType: 'tap',
      }));
      
      gestureCallbacksRef.current.onTap?.(touchPoint.x, touchPoint.y);
    }

    // Reset gesture state
    setTimeout(() => {
      setGestureState(prev => ({
        ...prev,
        isGesturing: false,
        gestureType: null,
        direction: null,
        distance: 0,
        velocity: 0,
        scale: 1,
        rotation: 0,
      }));
    }, 100);

    setTouchState(prev => ({ ...prev, touchPoints: event.touches.length }));
    touchStartRef.current = null;
    touchEndRef.current = null;
  }, [calculateDistance]);

  const addGestureListeners = useCallback((
    element: HTMLElement,
    callbacks: {
      onSwipe?: (direction: string, distance: number, velocity: number) => void;
      onPinch?: (scale: number) => void;
      onTap?: (x: number, y: number) => void;
      onLongPress?: (x: number, y: number) => void;
      onPan?: (deltaX: number, deltaY: number) => void;
    }
  ) => {
    gestureCallbacksRef.current = callbacks;

    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  const vibrate = useCallback((pattern: number | number[]) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  }, []);

  const requestWakeLock = useCallback(async (): Promise<WakeLockSentinel | null> => {
    if ('wakeLock' in navigator) {
      try {
        const wakeLock = await (navigator as any).wakeLock.request('screen');
        return wakeLock;
      } catch (error) {
        console.error('Wake lock request failed:', error);
        return null;
      }
    }
    return null;
  }, []);

  const getOptimalTouchTargetSize = useCallback((): number => {
    // Return optimal touch target size based on device
    if (touchState.screenSize === 'small') return 44; // 44px minimum for mobile
    if (touchState.screenSize === 'medium') return 48; // 48px for tablets
    return 44; // Default
  }, [touchState.screenSize]);

  const isTouchDevice = useCallback((): boolean => {
    return touchState.isTouch;
  }, [touchState.isTouch]);

  const isMobileDevice = useCallback((): boolean => {
    return touchState.isMobile;
  }, [touchState.isMobile]);

  // Initialize device detection
  useEffect(() => {
    detectDeviceType();

    const handleResize = () => {
      detectDeviceType();
    };

    const handleOrientationChange = () => {
      setTimeout(detectDeviceType, 100); // Small delay for orientation change
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, [detectDeviceType]);

  return {
    touchState,
    gestureState,
    addGestureListeners,
    vibrate,
    requestWakeLock,
    getOptimalTouchTargetSize,
    isTouchDevice,
    isMobileDevice,
  };
}