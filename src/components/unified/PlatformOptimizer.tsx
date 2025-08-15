'use client';

import React, { useEffect, useState } from 'react';
import { usePlatformDetection } from '@/hooks/usePlatformDetection';
import { useDevicePreferences } from '@/hooks/useDevicePreferences';
import { cn } from '@/lib/utils';

interface PlatformOptimizerProps {
  children: React.ReactNode;
  enableAutoOptimization?: boolean;
  enablePerformanceMode?: boolean;
  enableAccessibilityMode?: boolean;
}

export function PlatformOptimizer({
  children,
  enableAutoOptimization = true,
  enablePerformanceMode = true,
  enableAccessibilityMode = true,
}: PlatformOptimizerProps) {
  const { 
    platformInfo, 
    capabilities, 
    isMobile, 
    isTablet, 
    isDesktop,
    isPWA,
    getPlatformClasses 
  } = usePlatformDetection();
  
  const { preferences } = useDevicePreferences('demo_user');
  const [optimizations, setOptimizations] = useState<string[]>([]);

  // Apply platform-specific optimizations
  useEffect(() => {
    if (!enableAutoOptimization) return;

    const appliedOptimizations: string[] = [];

    // Performance optimizations
    if (enablePerformanceMode) {
      // Reduce animations on low-end devices
      if (platformInfo.reducedMotion || preferences.dataUsage === 'minimal') {
        document.documentElement.style.setProperty('--animation-duration', '0s');
        appliedOptimizations.push('reduced-animations');
      }

      // Optimize for mobile performance
      if (isMobile()) {
        // Reduce image quality on mobile
        document.documentElement.style.setProperty('--image-quality', '0.8');
        appliedOptimizations.push('mobile-image-optimization');

        // Enable hardware acceleration
        document.documentElement.style.setProperty('--transform-3d', 'translateZ(0)');
        appliedOptimizations.push('hardware-acceleration');
      }

      // Battery optimization
      if (capabilities.hasBattery) {
        navigator.getBattery?.().then((battery: any) => {
          if (battery.level < 0.2) {
            // Enable power saving mode
            document.documentElement.classList.add('power-saving-mode');
            appliedOptimizations.push('power-saving');
          }
        });
      }
    }

    // Accessibility optimizations
    if (enableAccessibilityMode) {
      // High contrast mode
      if (preferences.highContrast || platformInfo.highContrast) {
        document.documentElement.classList.add('high-contrast');
        appliedOptimizations.push('high-contrast');
      }

      // Large text mode
      if (preferences.largeText) {
        document.documentElement.style.setProperty('--font-scale', '1.2');
        appliedOptimizations.push('large-text');
      }

      // Reduced transparency
      if (preferences.reduceTransparency) {
        document.documentElement.style.setProperty('--opacity-reduced', '1');
        appliedOptimizations.push('reduced-transparency');
      }

      // Focus indicators for keyboard navigation
      if (!platformInfo.isTouch) {
        document.documentElement.classList.add('keyboard-navigation');
        appliedOptimizations.push('keyboard-focus');
      }
    }

    // Platform-specific CSS classes
    const platformClasses = getPlatformClasses();
    document.documentElement.className = 
      document.documentElement.className.replace(/platform-\S+|os-\S+|browser-\S+/g, '') + 
      ' ' + platformClasses;

    setOptimizations(appliedOptimizations);

    // Cleanup
    return () => {
      if (enablePerformanceMode) {
        document.documentElement.style.removeProperty('--animation-duration');
        document.documentElement.style.removeProperty('--image-quality');
        document.documentElement.style.removeProperty('--transform-3d');
        document.documentElement.classList.remove('power-saving-mode');
      }

      if (enableAccessibilityMode) {
        document.documentElement.classList.remove('high-contrast', 'keyboard-navigation');
        document.documentElement.style.removeProperty('--font-scale');
        document.documentElement.style.removeProperty('--opacity-reduced');
      }
    };
  }, [
    enableAutoOptimization,
    enablePerformanceMode,
    enableAccessibilityMode,
    platformInfo,
    preferences,
    capabilities,
    isMobile,
    getPlatformClasses
  ]);

  // Apply theme optimizations
  useEffect(() => {
    const applyTheme = () => {
      let theme = preferences.theme;
      
      if (theme === 'auto') {
        theme = platformInfo.colorScheme;
      }
      
      document.documentElement.setAttribute('data-theme', theme);
      document.documentElement.classList.toggle('dark', theme === 'dark');
    };

    applyTheme();
  }, [preferences.theme, platformInfo.colorScheme]);

  // Apply font size optimizations
  useEffect(() => {
    const fontSize = preferences.fontSize;
    const fontSizeMap = {
      small: '14px',
      medium: '16px',
      large: '18px',
    };

    document.documentElement.style.setProperty('--base-font-size', fontSizeMap[fontSize]);
  }, [preferences.fontSize]);

  return (
    <div className={cn('platform-optimized', getPlatformClasses())}>
      {children}
      
      {/* Development mode optimization indicator */}
      {process.env.NODE_ENV === 'development' && optimizations.length > 0 && (
        <div className="fixed bottom-4 left-4 bg-black bg-opacity-75 text-white text-xs p-2 rounded z-50">
          <div className="font-semibold mb-1">Platform Optimizations:</div>
          <ul className="space-y-0.5">
            {optimizations.map((opt, index) => (
              <li key={index}>• {opt}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// Component for platform-specific rendering
export function PlatformSpecific({
  mobile,
  tablet,
  desktop,
  fallback,
}: {
  mobile?: React.ReactNode;
  tablet?: React.ReactNode;
  desktop?: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { isMobile, isTablet, isDesktop } = usePlatformDetection();

  if (isMobile() && mobile) return <>{mobile}</>;
  if (isTablet() && tablet) return <>{tablet}</>;
  if (isDesktop() && desktop) return <>{desktop}</>;
  
  return <>{fallback}</>;
}

// Responsive component wrapper
export function ResponsiveComponent({
  children,
  breakpoints = { mobile: 768, tablet: 1024 },
  className,
}: {
  children: React.ReactNode;
  breakpoints?: { mobile: number; tablet: number };
  className?: string;
}) {
  const { platformInfo } = usePlatformDetection();
  const [screenSize, setScreenSize] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');

  useEffect(() => {
    const updateScreenSize = () => {
      const width = window.innerWidth;
      if (width < breakpoints.mobile) {
        setScreenSize('mobile');
      } else if (width < breakpoints.tablet) {
        setScreenSize('tablet');
      } else {
        setScreenSize('desktop');
      }
    };

    updateScreenSize();
    window.addEventListener('resize', updateScreenSize);
    
    return () => window.removeEventListener('resize', updateScreenSize);
  }, [breakpoints]);

  return (
    <div 
      className={cn(
        'responsive-component',
        `screen-${screenSize}`,
        `platform-${platformInfo.type}`,
        className
      )}
      data-screen-size={screenSize}
      data-platform={platformInfo.type}
    >
      {children}
    </div>
  );
}

// Touch-optimized button component
export function TouchOptimizedElement({
  children,
  as: Component = 'button',
  className,
  ...props
}: {
  children: React.ReactNode;
  as?: React.ElementType;
  className?: string;
  [key: string]: any;
}) {
  const { isMobile, getLayoutConfig } = usePlatformDetection();
  const layoutConfig = getLayoutConfig();

  const touchOptimizedProps = isMobile() ? {
    style: {
      minHeight: `${layoutConfig.touchTargetSize}px`,
      minWidth: `${layoutConfig.touchTargetSize}px`,
      ...props.style,
    },
  } : {};

  return (
    <Component
      className={cn(
        'touch-optimized',
        isMobile() && 'touch-target',
        className
      )}
      {...touchOptimizedProps}
      {...props}
    >
      {children}
    </Component>
  );
}

// Platform-aware image component
export function PlatformImage({
  src,
  alt,
  className,
  quality = 'auto',
  ...props
}: {
  src: string;
  alt: string;
  className?: string;
  quality?: 'low' | 'medium' | 'high' | 'auto';
  [key: string]: any;
}) {
  const { isMobile } = usePlatformDetection();
  const { preferences } = useDevicePreferences('demo_user');

  const getOptimizedSrc = () => {
    let targetQuality = quality;
    
    if (quality === 'auto') {
      if (preferences.imageQuality !== 'auto') {
        targetQuality = preferences.imageQuality;
      } else if (isMobile() || preferences.dataUsage === 'minimal') {
        targetQuality = 'medium';
      } else {
        targetQuality = 'high';
      }
    }

    // In a real implementation, this would integrate with your image optimization service
    const qualityMap = { low: 40, medium: 70, high: 90 };
    const qualityValue = qualityMap[targetQuality as keyof typeof qualityMap] || 70;
    
    return `${src}?q=${qualityValue}`;
  };

  return (
    <img
      src={getOptimizedSrc()}
      alt={alt}
      className={cn('platform-image', className)}
      loading="lazy"
      {...props}
    />
  );
}

// Platform-aware text component
export function PlatformText({
  children,
  size = 'base',
  className,
  ...props
}: {
  children: React.ReactNode;
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl';
  className?: string;
  [key: string]: any;
}) {
  const { isMobile } = usePlatformDetection();
  const { preferences } = useDevicePreferences('demo_user');

  const getSizeClass = () => {
    const baseSizes = {
      xs: 'text-xs',
      sm: 'text-sm',
      base: 'text-base',
      lg: 'text-lg',
      xl: 'text-xl',
    };

    // Adjust for mobile and user preferences
    if (isMobile() || preferences.fontSize === 'large') {
      const mobileSizes = {
        xs: 'text-sm',
        sm: 'text-base',
        base: 'text-lg',
        lg: 'text-xl',
        xl: 'text-2xl',
      };
      return mobileSizes[size];
    }

    if (preferences.fontSize === 'small') {
      const smallSizes = {
        xs: 'text-xs',
        sm: 'text-xs',
        base: 'text-sm',
        lg: 'text-base',
        xl: 'text-lg',
      };
      return smallSizes[size];
    }

    return baseSizes[size];
  };

  return (
    <span
      className={cn(
        'platform-text',
        getSizeClass(),
        preferences.largeText && 'font-medium',
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}