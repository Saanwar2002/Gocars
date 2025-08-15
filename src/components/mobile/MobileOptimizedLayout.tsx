'use client';

import React, { useState, useEffect } from 'react';
import { useTouch } from '@/hooks/useTouch';
import { useHapticFeedback } from './HapticFeedback';
import { GestureNavigation } from './GestureNavigation';
import { MobileShortcuts } from './MobileShortcuts';
import { cn } from '@/lib/utils';
import { 
  Menu, X, ArrowLeft, MoreVertical, Search, 
  Bell, User, Settings, Home, ChevronDown
} from 'lucide-react';

interface MobileOptimizedLayoutProps {
  children: React.ReactNode;
  title?: string;
  showBackButton?: boolean;
  showMenuButton?: boolean;
  showSearchButton?: boolean;
  showNotificationButton?: boolean;
  showUserButton?: boolean;
  headerActions?: React.ReactNode;
  bottomNavigation?: React.ReactNode;
  shortcuts?: boolean;
  onBack?: () => void;
  onMenuToggle?: () => void;
  onSearch?: () => void;
  onNotifications?: () => void;
  onUserProfile?: () => void;
  className?: string;
}

export function MobileOptimizedLayout({
  children,
  title,
  showBackButton = false,
  showMenuButton = true,
  showSearchButton = true,
  showNotificationButton = true,
  showUserButton = true,
  headerActions,
  bottomNavigation,
  shortcuts = true,
  onBack,
  onMenuToggle,
  onSearch,
  onNotifications,
  onUserProfile,
  className
}: MobileOptimizedLayoutProps) {
  const { touchState, isTouchDevice } = useTouch();
  const { triggerHaptic } = useHapticFeedback();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [headerVisible, setHeaderVisible] = useState(true);

  // Auto-hide header on scroll for mobile
  useEffect(() => {
    if (!isTouchDevice()) return;

    let lastScrollY = 0;
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down
        setHeaderVisible(false);
      } else {
        // Scrolling up
        setHeaderVisible(true);
      }
      
      lastScrollY = currentScrollY;
      setScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isTouchDevice]);

  const handleMenuToggle = () => {
    triggerHaptic('medium');
    setIsMenuOpen(!isMenuOpen);
    onMenuToggle?.();
  };

  const handleBack = () => {
    triggerHaptic('medium');
    onBack?.();
  };

  const handleAction = (action?: () => void, hapticType: 'light' | 'medium' = 'medium') => {
    triggerHaptic(hapticType);
    action?.();
  };

  const getOptimalHeaderHeight = () => {
    if (touchState.screenSize === 'small') return 'h-14';
    if (touchState.screenSize === 'medium') return 'h-16';
    return 'h-18';
  };

  return (
    <GestureNavigation
      enableSwipeNavigation={true}
      enablePullToRefresh={true}
      enableSwipeToGoBack={showBackButton}
      onSwipeRight={showBackButton ? onBack : undefined}
      className={className}
    >
      <div className="min-h-screen bg-gray-50">
        {/* Mobile Header */}
        <header 
          className={cn(
            'fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-40 transition-transform duration-300',
            getOptimalHeaderHeight(),
            headerVisible ? 'translate-y-0' : '-translate-y-full',
            'safe-area-pt' // Account for notch/status bar
          )}
        >
          <div className="flex items-center justify-between h-full px-4">
            {/* Left Section */}
            <div className="flex items-center space-x-3">
              {showBackButton && (
                <button
                  onClick={handleBack}
                  className="p-2 -ml-2 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors"
                  style={{ minHeight: 44, minWidth: 44 }} // Touch target size
                >
                  <ArrowLeft className="h-6 w-6" />
                </button>
              )}
              
              {showMenuButton && !showBackButton && (
                <button
                  onClick={handleMenuToggle}
                  className="p-2 -ml-2 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors"
                  style={{ minHeight: 44, minWidth: 44 }}
                >
                  {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
              )}
              
              {title && (
                <h1 className="text-lg font-semibold text-gray-900 truncate">
                  {title}
                </h1>
              )}
            </div>

            {/* Right Section */}
            <div className="flex items-center space-x-2">
              {headerActions}
              
              {showSearchButton && (
                <button
                  onClick={() => handleAction(onSearch)}
                  className="p-2 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors"
                  style={{ minHeight: 44, minWidth: 44 }}
                >
                  <Search className="h-5 w-5" />
                </button>
              )}
              
              {showNotificationButton && (
                <button
                  onClick={() => handleAction(onNotifications)}
                  className="p-2 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors relative"
                  style={{ minHeight: 44, minWidth: 44 }}
                >
                  <Bell className="h-5 w-5" />
                  {/* Notification badge */}
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>
              )}
              
              {showUserButton && (
                <button
                  onClick={() => handleAction(onUserProfile)}
                  className="p-2 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors"
                  style={{ minHeight: 44, minWidth: 44 }}
                >
                  <User className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Side Menu Overlay */}
        {isMenuOpen && (
          <>
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-50"
              onClick={() => setIsMenuOpen(false)}
            />
            <div className="fixed top-0 left-0 h-full w-80 max-w-[80vw] bg-white z-50 transform transition-transform duration-300 shadow-xl">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Menu</h2>
                  <button
                    onClick={() => setIsMenuOpen(false)}
                    className="p-2 rounded-full hover:bg-gray-100"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
              
              <nav className="p-4 space-y-2">
                <a href="#" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100">
                  <Home className="h-5 w-5" />
                  <span>Home</span>
                </a>
                <a href="#" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100">
                  <User className="h-5 w-5" />
                  <span>Profile</span>
                </a>
                <a href="#" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100">
                  <Settings className="h-5 w-5" />
                  <span>Settings</span>
                </a>
              </nav>
            </div>
          </>
        )}

        {/* Main Content */}
        <main 
          className={cn(
            'pt-16 pb-20', // Account for fixed header and bottom nav
            touchState.screenSize === 'small' && 'pt-14',
            touchState.screenSize === 'large' && 'pt-18'
          )}
        >
          {/* Shortcuts */}
          {shortcuts && isTouchDevice() && (
            <div className="bg-white border-b border-gray-200">
              <MobileShortcuts layout="carousel" showLabels={false} maxVisible={8} />
            </div>
          )}
          
          {children}
        </main>

        {/* Bottom Navigation */}
        {bottomNavigation && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 safe-area-pb">
            {bottomNavigation}
          </div>
        )}

        {/* Scroll to Top Button */}
        {scrollY > 300 && (
          <button
            onClick={() => {
              triggerHaptic('medium');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="fixed bottom-20 right-4 w-12 h-12 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center z-30 hover:bg-blue-700 transition-colors"
          >
            <ChevronDown className="h-6 w-6 rotate-180" />
          </button>
        )}
      </div>
    </GestureNavigation>
  );
}

export function MobileBottomNavigation({ 
  items, 
  activeItem, 
  onItemPress 
}: {
  items: Array<{
    id: string;
    label: string;
    icon: React.ReactNode;
    badge?: string | number;
  }>;
  activeItem: string;
  onItemPress: (id: string) => void;
}) {
  const { triggerHaptic } = useHapticFeedback();

  const handleItemPress = (id: string) => {
    triggerHaptic('selection');
    onItemPress(id);
  };

  return (
    <div className="flex justify-around items-center py-2 px-4 h-16">
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => handleItemPress(item.id)}
          className={cn(
            'flex flex-col items-center space-y-1 p-2 rounded-lg transition-colors min-w-0 flex-1',
            activeItem === item.id 
              ? 'text-blue-600 bg-blue-50' 
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          )}
          style={{ minHeight: 44 }} // Touch target size
        >
          <div className="relative">
            {item.icon}
            {item.badge && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                {item.badge}
              </span>
            )}
          </div>
          <span className="text-xs truncate max-w-full">
            {item.label}
          </span>
        </button>
      ))}
    </div>
  );
}

// Hook for managing mobile layout state
export function useMobileLayout() {
  const { touchState, isTouchDevice } = useTouch();
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [safeAreaInsets, setSafeAreaInsets] = useState({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0
  });

  useEffect(() => {
    const updateOrientation = () => {
      setOrientation(window.innerHeight > window.innerWidth ? 'portrait' : 'landscape');
    };

    const updateSafeArea = () => {
      // Get CSS environment variables for safe area insets
      const computedStyle = getComputedStyle(document.documentElement);
      setSafeAreaInsets({
        top: parseInt(computedStyle.getPropertyValue('--safe-area-inset-top') || '0'),
        bottom: parseInt(computedStyle.getPropertyValue('--safe-area-inset-bottom') || '0'),
        left: parseInt(computedStyle.getPropertyValue('--safe-area-inset-left') || '0'),
        right: parseInt(computedStyle.getPropertyValue('--safe-area-inset-right') || '0'),
      });
    };

    updateOrientation();
    updateSafeArea();

    window.addEventListener('orientationchange', updateOrientation);
    window.addEventListener('resize', updateOrientation);

    return () => {
      window.removeEventListener('orientationchange', updateOrientation);
      window.removeEventListener('resize', updateOrientation);
    };
  }, []);

  return {
    isMobile: isTouchDevice(),
    touchState,
    orientation,
    safeAreaInsets,
    isSmallScreen: touchState.screenSize === 'small',
    isMediumScreen: touchState.screenSize === 'medium',
    isLargeScreen: touchState.screenSize === 'large',
  };
}