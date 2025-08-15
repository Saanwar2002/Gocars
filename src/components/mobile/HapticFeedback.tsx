'use client';

import React, { createContext, useContext, useCallback } from 'react';
import { useTouch } from '@/hooks/useTouch';

interface HapticFeedbackContextType {
  triggerHaptic: (type: HapticType) => void;
  isHapticSupported: boolean;
  enableHaptics: boolean;
  setEnableHaptics: (enabled: boolean) => void;
}

type HapticType = 
  | 'light'      // 10ms - UI feedback
  | 'medium'     // 20ms - Button press
  | 'heavy'      // 30ms - Important action
  | 'success'    // Pattern for success
  | 'warning'    // Pattern for warning
  | 'error'      // Pattern for error
  | 'selection'  // Pattern for selection
  | 'impact'     // Pattern for impact
  | 'notification'; // Pattern for notification

const HapticFeedbackContext = createContext<HapticFeedbackContextType | null>(null);

export function HapticFeedbackProvider({ children }: { children: React.ReactNode }) {
  const { vibrate, isTouchDevice } = useTouch();
  const [enableHaptics, setEnableHaptics] = React.useState(true);

  const isHapticSupported = isTouchDevice() && 'vibrate' in navigator;

  const getHapticPattern = (type: HapticType): number | number[] => {
    switch (type) {
      case 'light': return 10;
      case 'medium': return 20;
      case 'heavy': return 30;
      case 'success': return [50, 50, 100];
      case 'warning': return [100, 50, 100];
      case 'error': return [200, 100, 200];
      case 'selection': return 15;
      case 'impact': return [25, 25, 50];
      case 'notification': return [100, 50, 100, 50, 100];
      default: return 20;
    }
  };

  const triggerHaptic = useCallback((type: HapticType) => {
    if (!enableHaptics || !isHapticSupported) return;
    
    const pattern = getHapticPattern(type);
    vibrate(pattern);
  }, [enableHaptics, isHapticSupported, vibrate]);

  return (
    <HapticFeedbackContext.Provider value={{
      triggerHaptic,
      isHapticSupported,
      enableHaptics,
      setEnableHaptics
    }}>
      {children}
    </HapticFeedbackContext.Provider>
  );
}

export function useHapticFeedback() {
  const context = useContext(HapticFeedbackContext);
  if (!context) {
    throw new Error('useHapticFeedback must be used within a HapticFeedbackProvider');
  }
  return context;
}

// Higher-order component for adding haptic feedback to any component
export function withHapticFeedback<T extends object>(
  Component: React.ComponentType<T>,
  hapticType: HapticType = 'medium'
) {
  return function HapticEnhancedComponent(props: T & { 
    onClick?: () => void;
    onHapticTrigger?: (type: HapticType) => void;
  }) {
    const { triggerHaptic } = useHapticFeedback();

    const handleClick = () => {
      triggerHaptic(hapticType);
      props.onHapticTrigger?.(hapticType);
      props.onClick?.();
    };

    return <Component {...props} onClick={handleClick} />;
  };
}

// Haptic feedback hooks for common interactions
export function useHapticInteractions() {
  const { triggerHaptic } = useHapticFeedback();

  return {
    onButtonPress: () => triggerHaptic('medium'),
    onSuccess: () => triggerHaptic('success'),
    onError: () => triggerHaptic('error'),
    onWarning: () => triggerHaptic('warning'),
    onSelection: () => triggerHaptic('selection'),
    onImpact: () => triggerHaptic('impact'),
    onNotification: () => triggerHaptic('notification'),
    onLightTouch: () => triggerHaptic('light'),
    onHeavyTouch: () => triggerHaptic('heavy'),
  };
}