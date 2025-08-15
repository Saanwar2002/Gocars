'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { useTouch } from '@/hooks/useTouch';
import { cn } from '@/lib/utils';

interface TouchOptimizedButtonProps extends ButtonProps {
  hapticFeedback?: boolean;
  rippleEffect?: boolean;
  touchTargetSize?: 'small' | 'medium' | 'large';
  onTouchStart?: () => void;
  onTouchEnd?: () => void;
  longPressAction?: () => void;
  longPressDelay?: number;
}

export function TouchOptimizedButton({
  children,
  className,
  hapticFeedback = true,
  rippleEffect = true,
  touchTargetSize = 'medium',
  onTouchStart,
  onTouchEnd,
  longPressAction,
  longPressDelay = 500,
  onClick,
  disabled,
  ...props
}: TouchOptimizedButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isPressed, setIsPressed] = useState(false);
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const rippleIdRef = useRef(0);

  const { vibrate, isTouchDevice, getOptimalTouchTargetSize } = useTouch();

  const getTouchTargetSize = () => {
    const baseSize = getOptimalTouchTargetSize();
    switch (touchTargetSize) {
      case 'small': return Math.max(baseSize - 4, 40);
      case 'large': return baseSize + 8;
      default: return baseSize;
    }
  };

  const handleTouchStart = (event: React.TouchEvent) => {
    if (disabled) return;

    setIsPressed(true);
    onTouchStart?.();

    // Haptic feedback
    if (hapticFeedback && isTouchDevice()) {
      vibrate(10); // Short vibration
    }

    // Ripple effect
    if (rippleEffect && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const touch = event.touches[0];
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      
      const rippleId = rippleIdRef.current++;
      setRipples(prev => [...prev, { id: rippleId, x, y }]);

      // Remove ripple after animation
      setTimeout(() => {
        setRipples(prev => prev.filter(ripple => ripple.id !== rippleId));
      }, 600);
    }

    // Long press detection
    if (longPressAction) {
      longPressTimerRef.current = setTimeout(() => {
        if (hapticFeedback && isTouchDevice()) {
          vibrate([50, 50, 50]); // Pattern for long press
        }
        longPressAction();
      }, longPressDelay);
    }
  };

  const handleTouchEnd = () => {
    if (disabled) return;

    setIsPressed(false);
    onTouchEnd?.();

    // Clear long press timer
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;

    // Provide haptic feedback for non-touch clicks too
    if (hapticFeedback && isTouchDevice()) {
      vibrate(10);
    }

    onClick?.(event);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

  const touchTargetSizePx = getTouchTargetSize();

  return (
    <Button
      ref={buttonRef}
      className={cn(
        'relative overflow-hidden transition-all duration-150',
        'select-none touch-manipulation', // Prevent text selection and optimize for touch
        isPressed && 'scale-95 brightness-90',
        isTouchDevice() && 'active:scale-95',
        className
      )}
      style={{
        minHeight: touchTargetSizePx,
        minWidth: touchTargetSizePx,
        // Ensure adequate padding for touch targets
        padding: isTouchDevice() ? '12px 16px' : undefined,
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      onClick={handleClick}
      disabled={disabled}
      {...props}
    >
      {children}
      
      {/* Ripple effects */}
      {rippleEffect && ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="absolute pointer-events-none"
          style={{
            left: ripple.x,
            top: ripple.y,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <span className="block w-0 h-0 rounded-full bg-white bg-opacity-30 animate-ping" 
                style={{ 
                  animation: 'ripple 0.6s linear',
                  animationFillMode: 'forwards'
                }} 
          />
        </span>
      ))}

      {/* Press state overlay */}
      {isPressed && (
        <div className="absolute inset-0 bg-black bg-opacity-10 pointer-events-none" />
      )}

      <style jsx>{`
        @keyframes ripple {
          to {
            width: 100px;
            height: 100px;
            opacity: 0;
          }
        }
      `}</style>
    </Button>
  );
}