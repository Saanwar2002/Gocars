'use client';

import React, { useState, useEffect } from 'react';
import { usePlatformDetection } from '@/hooks/usePlatformDetection';
import { useSessionSync } from '@/hooks/useSessionSync';
import { cn } from '@/lib/utils';
import {
  Menu, X, ArrowLeft, Search, Bell, User, Settings,
  Home, Car, Clock, CreditCard, MoreHorizontal
} from 'lucide-react';

interface UnifiedLayoutProps {
  children: React.ReactNode;
  title?: string;
  showBackButton?: boolean;
  showSearch?: boolean;
  showNotifications?: boolean;
  showProfile?: boolean;
  headerActions?: React.ReactNode;
  sidebarContent?: React.ReactNode;
  bottomNavigation?: React.ReactNode;
  className?: string;
  onBack?: () => void;
  onSearch?: () => void;
  onNotifications?: () => void;
  onProfile?: () => void;
}

export function UnifiedLayout({
  children,
  title,
  showBackButton = false,
  showSearch = true,
  showNotifications = true,
  showProfile = true,
  headerActions,
  sidebarContent,
  bottomNavigation,
  className,
  onBack,
  onSearch,
  onNotifications,
  onProfile,
}: UnifiedLayoutProps) {
  const { 
    platformInfo, 
    isMobile, 
    isTablet, 
    isDesktop, 
    getLayoutConfig, 
    getPlatformClasses 
  } = usePlatformDetection();
  
  const { updateActivity } = useSessionSync('demo_user');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [headerVisible, setHeaderVisible] = useState(true);
  
  const layoutConfig = getLayoutConfig();
  const platformClasses = getPlatformClasses();

  // Auto-hide header on mobile scroll
  useEffect(() => {
    if (!isMobile()) return;

    let lastScrollY = 0;
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setHeaderVisible(false);
      } else {
        setHeaderVisible(true);
      }
      
      lastScrollY = currentScrollY;
      updateActivity();
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMobile, updateActivity]);

  // Handle platform-specific interactions
  const handleInteraction = (action: () => void) => {
    updateActivity();
    action();
  };

  const HeaderContent = () => (
    <header 
      className={cn(
        'fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 transition-transform duration-300',
        !headerVisible && isMobile() && '-translate-y-full',
        isMobile() && 'h-14',
        isTablet() && 'h-16',
        isDesktop() && 'h-16'
      )}
      style={{ 
        paddingTop: platformInfo.isPWA ? 'env(safe-area-inset-top)' : undefined 
      }}
    >
      <div className="flex items-center justify-between h-full px-4">
        {/* Left Section */}
        <div className="flex items-center space-x-3">
          {showBackButton && (
            <button
              onClick={() => handleInteraction(onBack || (() => window.history.back()))}
              className={cn(
                'p-2 rounded-full hover:bg-gray-100 transition-colors',
                `min-h-[${layoutConfig.touchTargetSize}px] min-w-[${layoutConfig.touchTargetSize}px]`
              )}
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          
          {!showBackButton && (isMobile() || isTablet()) && (
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={cn(
                'p-2 rounded-full hover:bg-gray-100 transition-colors',
                `min-h-[${layoutConfig.touchTargetSize}px] min-w-[${layoutConfig.touchTargetSize}px]`
              )}
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          )}
          
          {title && (
            <h1 className={cn(
              'font-semibold text-gray-900 truncate',
              isMobile() && 'text-lg',
              isTablet() && 'text-xl',
              isDesktop() && 'text-xl'
            )}>
              {title}
            </h1>
          )}
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-2">
          {headerActions}
          
          {showSearch && (
            <button
              onClick={() => handleInteraction(onSearch || (() => {}))}
              className={cn(
                'p-2 rounded-full hover:bg-gray-100 transition-colors',
                `min-h-[${layoutConfig.touchTargetSize}px] min-w-[${layoutConfig.touchTargetSize}px]`
              )}
            >
              <Search className="h-5 w-5" />
            </button>
          )}
          
          {showNotifications && (
            <button
              onClick={() => handleInteraction(onNotifications || (() => {}))}
              className={cn(
                'p-2 rounded-full hover:bg-gray-100 transition-colors relative',
                `min-h-[${layoutConfig.touchTargetSize}px] min-w-[${layoutConfig.touchTargetSize}px]`
              )}
            >
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
          )}
          
          {showProfile && (
            <button
              onClick={() => handleInteraction(onProfile || (() => {}))}
              className={cn(
                'p-2 rounded-full hover:bg-gray-100 transition-colors',
                `min-h-[${layoutConfig.touchTargetSize}px] min-w-[${layoutConfig.touchTargetSize}px]`
              )}
            >
              <User className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
    </header>
  );

  const SidebarContent = () => (
    <>
      {/* Overlay */}
      {sidebarOpen && (isMobile() || isTablet()) && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside className={cn(
        'fixed top-0 h-full bg-white border-r border-gray-200 z-50 transition-transform duration-300',
        isDesktop() && 'left-0 w-64 translate-x-0',
        (isMobile() || isTablet()) && cn(
          'left-0 w-80 max-w-[80vw]',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )
      )}
      style={{ 
        paddingTop: platformInfo.isPWA ? 'env(safe-area-inset-top)' : undefined 
      }}>
        <div className={cn(
          'p-4 border-b border-gray-200',
          isMobile() && 'h-14',
          isTablet() && 'h-16',
          isDesktop() && 'h-16'
        )}>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">GoCars</h2>
            {(isMobile() || isTablet()) && (
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 rounded-full hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
        
        <nav className="p-4 space-y-2">
          {sidebarContent || (
            <>
              <SidebarItem icon={<Home className="h-5 w-5" />} label="Dashboard" />
              <SidebarItem icon={<Car className="h-5 w-5" />} label="Book Ride" />
              <SidebarItem icon={<Clock className="h-5 w-5" />} label="History" />
              <SidebarItem icon={<CreditCard className="h-5 w-5" />} label="Payment" />
              <SidebarItem icon={<Settings className="h-5 w-5" />} label="Settings" />
            </>
          )}
        </nav>
      </aside>
    </>
  );

  const BottomNavigationContent = () => {
    if (!isMobile() || !bottomNavigation) return null;

    const defaultBottomNav = (
      <nav className="flex justify-around items-center py-2 px-4 h-16">
        {[
          { icon: <Home className="h-5 w-5" />, label: 'Home' },
          { icon: <Car className="h-5 w-5" />, label: 'Rides' },
          { icon: <Search className="h-5 w-5" />, label: 'Search' },
          { icon: <User className="h-5 w-5" />, label: 'Profile' },
        ].map((item, index) => (
          <button
            key={index}
            className={cn(
              'flex flex-col items-center space-y-1 p-2 rounded-lg transition-colors',
              'text-gray-600 hover:text-gray-900 hover:bg-gray-50',
              `min-h-[${layoutConfig.touchTargetSize}px] min-w-[${layoutConfig.touchTargetSize}px]`
            )}
            onClick={() => updateActivity()}
          >
            {item.icon}
            <span className="text-xs">{item.label}</span>
          </button>
        ))}
      </nav>
    );

    return (
      <div 
        className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40"
        style={{ 
          paddingBottom: platformInfo.isPWA ? 'env(safe-area-inset-bottom)' : undefined 
        }}
      >
        {bottomNavigation || defaultBottomNav}
      </div>
    );
  };

  return (
    <div className={cn('min-h-screen bg-gray-50', platformClasses, className)}>
      <HeaderContent />
      
      {(isDesktop() || sidebarContent) && <SidebarContent />}
      
      {/* Main Content */}
      <main className={cn(
        'transition-all duration-300',
        // Top padding for header
        isMobile() && 'pt-14',
        isTablet() && 'pt-16',
        isDesktop() && 'pt-16',
        // Left padding for sidebar on desktop
        isDesktop() && sidebarContent && 'pl-64',
        // Bottom padding for mobile navigation
        isMobile() && bottomNavigation && 'pb-16'
      )}>
        {children}
      </main>
      
      <BottomNavigationContent />
    </div>
  );
}

// Sidebar item component
function SidebarItem({ 
  icon, 
  label, 
  active = false, 
  onClick 
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  const { getLayoutConfig } = usePlatformDetection();
  const layoutConfig = getLayoutConfig();

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center space-x-3 p-3 rounded-lg transition-colors text-left',
        active 
          ? 'bg-blue-50 text-blue-600 border border-blue-200' 
          : 'text-gray-700 hover:bg-gray-100',
        `min-h-[${layoutConfig.touchTargetSize}px]`
      )}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </button>
  );
}

// Responsive grid component
export function ResponsiveGrid({ 
  children, 
  className 
}: { 
  children: React.ReactNode; 
  className?: string; 
}) {
  const { getLayoutConfig } = usePlatformDetection();
  const layoutConfig = getLayoutConfig();

  return (
    <div 
      className={cn('grid gap-4', className)}
      style={{
        gridTemplateColumns: `repeat(${layoutConfig.columns}, 1fr)`,
      }}
    >
      {children}
    </div>
  );
}

// Platform-aware spacing component
export function PlatformSpacing({ 
  children, 
  size = 'default' 
}: { 
  children: React.ReactNode; 
  size?: 'compact' | 'default' | 'comfortable'; 
}) {
  const { isMobile, isTablet } = usePlatformDetection();
  
  const getSpacing = () => {
    const baseSpacing = {
      compact: isMobile() ? 'p-2' : 'p-3',
      default: isMobile() ? 'p-4' : isTablet() ? 'p-5' : 'p-6',
      comfortable: isMobile() ? 'p-6' : isTablet() ? 'p-8' : 'p-10',
    };
    
    return baseSpacing[size];
  };

  return (
    <div className={getSpacing()}>
      {children}
    </div>
  );
}