'use client';

import React, { useRef, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTouch } from '@/hooks/useTouch';
import { cn } from '@/lib/utils';
import { 
  ArrowLeft, ArrowRight, ArrowUp, ArrowDown, 
  RotateCcw, Menu, X, Home, Search
} from 'lucide-react';

interface GestureNavigationProps {
  children: React.ReactNode;
  enableSwipeNavigation?: boolean;
  enablePullToRefresh?: boolean;
  enableSwipeToGoBack?: boolean;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onPullToRefresh?: () => Promise<void>;
  className?: string;
}

export function GestureNavigation({
  children,
  enableSwipeNavigation = true,
  enablePullToRefresh = true,
  enableSwipeToGoBack = true,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  onPullToRefresh,
  className
}: GestureNavigationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { addGestureListeners, vibrate, isTouchDevice } = useTouch();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [showGestureHint, setShowGestureHint] = useState<{
    type: 'swipe' | 'pull';
    direction: string;
    show: boolean;
  }>({ type: 'swipe', direction: '', show: false });

  const [swipeProgress, setSwipeProgress] = useState<{
    direction: string | null;
    progress: number;
  }>({ direction: null, progress: 0 });

  useEffect(() => {
    if (!containerRef.current || !isTouchDevice()) return;

    let startY = 0;
    let currentY = 0;
    let isPulling = false;
    let isScrolledToTop = false;

    const cleanup = addGestureListeners(containerRef.current, {
      onSwipe: async (direction, distance, velocity) => {
        if (!enableSwipeNavigation) return;

        // Provide haptic feedback for gestures
        vibrate(20);

        // Show gesture hint
        setShowGestureHint({
          type: 'swipe',
          direction,
          show: true
        });

        setTimeout(() => {
          setShowGestureHint(prev => ({ ...prev, show: false }));
        }, 1000);

        // Handle swipe gestures
        switch (direction) {
          case 'left':
            if (onSwipeLeft) {
              onSwipeLeft();
            } else if (enableSwipeToGoBack) {
              // Default: go forward in history or navigate to next page
              router.forward();
            }
            break;
          
          case 'right':
            if (onSwipeRight) {
              onSwipeRight();
            } else if (enableSwipeToGoBack) {
              // Default: go back in history
              router.back();
            }
            break;
          
          case 'up':
            if (onSwipeUp) {
              onSwipeUp();
            }
            break;
          
          case 'down':
            if (onSwipeDown) {
              onSwipeDown();
            } else if (enablePullToRefresh && isScrolledToTop && onPullToRefresh) {
              // Pull to refresh
              setIsRefreshing(true);
              try {
                await onPullToRefresh();
              } finally {
                setIsRefreshing(false);
                setPullDistance(0);
              }
            }
            break;
        }
      },

      onPan: (deltaX, deltaY) => {
        // Handle pull to refresh
        if (enablePullToRefresh && deltaY > 0 && window.scrollY === 0) {
          isPulling = true;
          isScrolledToTop = true;
          const pullDist = Math.min(deltaY, 100);
          setPullDistance(pullDist);

          if (pullDist > 60) {
            setShowGestureHint({
              type: 'pull',
              direction: 'refresh',
              show: true
            });
          }
        }

        // Handle swipe progress indication
        const threshold = 50;
        let direction = null;
        let progress = 0;

        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          // Horizontal swipe
          if (Math.abs(deltaX) > 20) {
            direction = deltaX > 0 ? 'right' : 'left';
            progress = Math.min(Math.abs(deltaX) / threshold, 1);
          }
        } else {
          // Vertical swipe
          if (Math.abs(deltaY) > 20) {
            direction = deltaY > 0 ? 'down' : 'up';
            progress = Math.min(Math.abs(deltaY) / threshold, 1);
          }
        }

        setSwipeProgress({ direction, progress });
      },

      onTap: (x, y) => {
        // Reset any gesture states on tap
        setPullDistance(0);
        setSwipeProgress({ direction: null, progress: 0 });
        setShowGestureHint(prev => ({ ...prev, show: false }));
      }
    });

    // Handle scroll events for pull to refresh
    const handleScroll = () => {
      isScrolledToTop = window.scrollY === 0;
      if (!isScrolledToTop) {
        setPullDistance(0);
        isPulling = false;
      }
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      cleanup();
      window.removeEventListener('scroll', handleScroll);
    };
  }, [
    addGestureListeners, 
    enableSwipeNavigation, 
    enablePullToRefresh, 
    enableSwipeToGoBack,
    onSwipeLeft, 
    onSwipeRight, 
    onSwipeUp, 
    onSwipeDown, 
    onPullToRefresh,
    router,
    vibrate,
    isTouchDevice
  ]);

  const getSwipeIcon = (direction: string) => {
    switch (direction) {
      case 'left': return <ArrowLeft className="h-6 w-6" />;
      case 'right': return <ArrowRight className="h-6 w-6" />;
      case 'up': return <ArrowUp className="h-6 w-6" />;
      case 'down': return <ArrowDown className="h-6 w-6" />;
      default: return null;
    }
  };

  const getSwipeAction = (direction: string) => {
    switch (direction) {
      case 'left': return onSwipeLeft ? 'Custom Action' : 'Go Forward';
      case 'right': return onSwipeRight ? 'Custom Action' : 'Go Back';
      case 'up': return onSwipeUp ? 'Custom Action' : 'Scroll Up';
      case 'down': return onSwipeDown ? 'Custom Action' : 'Pull to Refresh';
      default: return '';
    }
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative min-h-screen touch-pan-y',
        'overscroll-behavior-y-none', // Prevent browser pull-to-refresh
        className
      )}
      style={{
        transform: pullDistance > 0 ? `translateY(${pullDistance * 0.5}px)` : undefined,
        transition: isRefreshing ? 'transform 0.3s ease-out' : undefined,
      }}
    >
      {/* Pull to Refresh Indicator */}
      {enablePullToRefresh && pullDistance > 0 && (
        <div 
          className="absolute top-0 left-0 right-0 flex items-center justify-center z-50"
          style={{ 
            transform: `translateY(-${Math.max(0, 60 - pullDistance)}px)`,
            opacity: pullDistance / 60
          }}
        >
          <div className="bg-white rounded-full p-3 shadow-lg border">
            <RotateCcw 
              className={cn(
                'h-6 w-6 text-blue-600',
                isRefreshing && 'animate-spin',
                pullDistance > 60 && !isRefreshing && 'animate-pulse'
              )} 
            />
          </div>
        </div>
      )}

      {/* Swipe Progress Indicators */}
      {swipeProgress.direction && swipeProgress.progress > 0.2 && (
        <div className="fixed inset-0 pointer-events-none z-40">
          {/* Left swipe indicator */}
          {swipeProgress.direction === 'left' && (
            <div 
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-70 text-white rounded-full p-3 transition-all duration-150"
              style={{ 
                opacity: swipeProgress.progress,
                transform: `translateY(-50%) translateX(${(1 - swipeProgress.progress) * 50}px)`
              }}
            >
              <ArrowLeft className="h-6 w-6" />
            </div>
          )}

          {/* Right swipe indicator */}
          {swipeProgress.direction === 'right' && (
            <div 
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-70 text-white rounded-full p-3 transition-all duration-150"
              style={{ 
                opacity: swipeProgress.progress,
                transform: `translateY(-50%) translateX(-${(1 - swipeProgress.progress) * 50}px)`
              }}
            >
              <ArrowRight className="h-6 w-6" />
            </div>
          )}

          {/* Up swipe indicator */}
          {swipeProgress.direction === 'up' && (
            <div 
              className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-70 text-white rounded-full p-3 transition-all duration-150"
              style={{ 
                opacity: swipeProgress.progress,
                transform: `translateX(-50%) translateY(${(1 - swipeProgress.progress) * 50}px)`
              }}
            >
              <ArrowUp className="h-6 w-6" />
            </div>
          )}

          {/* Down swipe indicator */}
          {swipeProgress.direction === 'down' && (
            <div 
              className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-70 text-white rounded-full p-3 transition-all duration-150"
              style={{ 
                opacity: swipeProgress.progress,
                transform: `translateX(-50%) translateY(-${(1 - swipeProgress.progress) * 50}px)`
              }}
            >
              <ArrowDown className="h-6 w-6" />
            </div>
          )}
        </div>
      )}

      {/* Gesture Hint Toast */}
      {showGestureHint.show && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-top duration-300">
          <div className="bg-black bg-opacity-80 text-white px-4 py-2 rounded-full flex items-center space-x-2">
            {showGestureHint.type === 'pull' ? (
              <RotateCcw className="h-4 w-4" />
            ) : (
              getSwipeIcon(showGestureHint.direction)
            )}
            <span className="text-sm">
              {showGestureHint.type === 'pull' 
                ? 'Release to refresh' 
                : getSwipeAction(showGestureHint.direction)
              }
            </span>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="relative z-10">
        {children}
      </div>

      {/* Gesture Tutorial Overlay (for first-time users) */}
      {isTouchDevice() && (
        <div className="fixed bottom-4 right-4 z-30">
          <div className="bg-blue-600 text-white p-2 rounded-full shadow-lg opacity-20 hover:opacity-100 transition-opacity">
            <div className="flex items-center space-x-1">
              <ArrowLeft className="h-3 w-3" />
              <ArrowRight className="h-3 w-3" />
              <ArrowUp className="h-3 w-3" />
              <ArrowDown className="h-3 w-3" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}