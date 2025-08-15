'use client';

import { useState, useEffect, useCallback } from 'react';

interface PlatformInfo {
  type: 'mobile' | 'tablet' | 'desktop';
  os: 'ios' | 'android' | 'windows' | 'macos' | 'linux' | 'unknown';
  browser: 'chrome' | 'firefox' | 'safari' | 'edge' | 'opera' | 'unknown';
  version: string;
  isTouch: boolean;
  isPWA: boolean;
  isStandalone: boolean;
  supportsHover: boolean;
  screenSize: {
    width: number;
    height: number;
    ratio: number;
  };
  orientation: 'portrait' | 'landscape';
  colorScheme: 'light' | 'dark';
  reducedMotion: boolean;
  highContrast: boolean;
}

interface PlatformCapabilities {
  hasCamera: boolean;
  hasMicrophone: boolean;
  hasGeolocation: boolean;
  hasAccelerometer: boolean;
  hasGyroscope: boolean;
  hasVibration: boolean;
  hasBattery: boolean;
  hasNetworkInfo: boolean;
  hasNotifications: boolean;
  hasServiceWorker: boolean;
  hasWebGL: boolean;
  hasWebRTC: boolean;
  hasFileSystem: boolean;
  hasClipboard: boolean;
  hasShare: boolean;
}

export function usePlatformDetection() {
  const [platformInfo, setPlatformInfo] = useState<PlatformInfo>({
    type: 'desktop',
    os: 'unknown',
    browser: 'unknown',
    version: '',
    isTouch: false,
    isPWA: false,
    isStandalone: false,
    supportsHover: true,
    screenSize: { width: 0, height: 0, ratio: 1 },
    orientation: 'landscape',
    colorScheme: 'light',
    reducedMotion: false,
    highContrast: false,
  });

  const [capabilities, setCapabilities] = useState<PlatformCapabilities>({
    hasCamera: false,
    hasMicrophone: false,
    hasGeolocation: false,
    hasAccelerometer: false,
    hasGyroscope: false,
    hasVibration: false,
    hasBattery: false,
    hasNetworkInfo: false,
    hasNotifications: false,
    hasServiceWorker: false,
    hasWebGL: false,
    hasWebRTC: false,
    hasFileSystem: false,
    hasClipboard: false,
    hasShare: false,
  });

  // Detect platform type
  const detectPlatformType = useCallback((): 'mobile' | 'tablet' | 'desktop' => {
    const userAgent = navigator.userAgent;
    const screenWidth = window.innerWidth;
    
    if (/iPhone|iPod|Android.*Mobile/i.test(userAgent) || screenWidth < 768) {
      return 'mobile';
    } else if (/iPad|Android(?!.*Mobile)/i.test(userAgent) || (screenWidth >= 768 && screenWidth < 1024)) {
      return 'tablet';
    } else {
      return 'desktop';
    }
  }, []);

  // Detect operating system
  const detectOS = useCallback((): PlatformInfo['os'] => {
    const userAgent = navigator.userAgent;
    const platform = navigator.platform;
    
    if (/iPhone|iPad|iPod/i.test(userAgent)) return 'ios';
    if (/Android/i.test(userAgent)) return 'android';
    if (/Win/i.test(platform)) return 'windows';
    if (/Mac/i.test(platform)) return 'macos';
    if (/Linux/i.test(platform)) return 'linux';
    
    return 'unknown';
  }, []);

  // Detect browser
  const detectBrowser = useCallback((): { browser: PlatformInfo['browser']; version: string } => {
    const userAgent = navigator.userAgent;
    
    if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
      const match = userAgent.match(/Chrome\/(\d+)/);
      return { browser: 'chrome', version: match ? match[1] : '' };
    }
    
    if (userAgent.includes('Firefox')) {
      const match = userAgent.match(/Firefox\/(\d+)/);
      return { browser: 'firefox', version: match ? match[1] : '' };
    }
    
    if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
      const match = userAgent.match(/Version\/(\d+)/);
      return { browser: 'safari', version: match ? match[1] : '' };
    }
    
    if (userAgent.includes('Edg')) {
      const match = userAgent.match(/Edg\/(\d+)/);
      return { browser: 'edge', version: match ? match[1] : '' };
    }
    
    if (userAgent.includes('Opera') || userAgent.includes('OPR')) {
      const match = userAgent.match(/(?:Opera|OPR)\/(\d+)/);
      return { browser: 'opera', version: match ? match[1] : '' };
    }
    
    return { browser: 'unknown', version: '' };
  }, []);

  // Detect capabilities
  const detectCapabilities = useCallback(async (): Promise<PlatformCapabilities> => {
    const caps: PlatformCapabilities = {
      hasCamera: false,
      hasMicrophone: false,
      hasGeolocation: 'geolocation' in navigator,
      hasAccelerometer: 'DeviceMotionEvent' in window,
      hasGyroscope: 'DeviceOrientationEvent' in window,
      hasVibration: 'vibrate' in navigator,
      hasBattery: 'getBattery' in navigator,
      hasNetworkInfo: 'connection' in navigator,
      hasNotifications: 'Notification' in window,
      hasServiceWorker: 'serviceWorker' in navigator,
      hasWebGL: !!document.createElement('canvas').getContext('webgl'),
      hasWebRTC: 'RTCPeerConnection' in window,
      hasFileSystem: 'showOpenFilePicker' in window,
      hasClipboard: 'clipboard' in navigator,
      hasShare: 'share' in navigator,
    };

    // Check media devices
    if ('mediaDevices' in navigator && 'enumerateDevices' in navigator.mediaDevices) {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        caps.hasCamera = devices.some(device => device.kind === 'videoinput');
        caps.hasMicrophone = devices.some(device => device.kind === 'audioinput');
      } catch (error) {
        console.warn('Could not enumerate media devices:', error);
      }
    }

    return caps;
  }, []);

  // Update platform info
  const updatePlatformInfo = useCallback(() => {
    const { browser, version } = detectBrowser();
    
    const info: PlatformInfo = {
      type: detectPlatformType(),
      os: detectOS(),
      browser,
      version,
      isTouch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
      isPWA: window.matchMedia('(display-mode: standalone)').matches,
      isStandalone: (window.navigator as any).standalone === true,
      supportsHover: window.matchMedia('(hover: hover)').matches,
      screenSize: {
        width: window.innerWidth,
        height: window.innerHeight,
        ratio: window.devicePixelRatio || 1,
      },
      orientation: window.innerHeight > window.innerWidth ? 'portrait' : 'landscape',
      colorScheme: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
      reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      highContrast: window.matchMedia('(prefers-contrast: high)').matches,
    };
    
    setPlatformInfo(info);
  }, [detectPlatformType, detectOS, detectBrowser]);

  // Platform-specific utilities
  const isMobile = useCallback(() => platformInfo.type === 'mobile', [platformInfo.type]);
  const isTablet = useCallback(() => platformInfo.type === 'tablet', [platformInfo.type]);
  const isDesktop = useCallback(() => platformInfo.type === 'desktop', [platformInfo.type]);
  const isIOS = useCallback(() => platformInfo.os === 'ios', [platformInfo.os]);
  const isAndroid = useCallback(() => platformInfo.os === 'android', [platformInfo.os]);
  const isSafari = useCallback(() => platformInfo.browser === 'safari', [platformInfo.browser]);
  const isChrome = useCallback(() => platformInfo.browser === 'chrome', [platformInfo.browser]);
  const isPWA = useCallback(() => platformInfo.isPWA || platformInfo.isStandalone, [platformInfo.isPWA, platformInfo.isStandalone]);

  // Get optimal layout configuration
  const getLayoutConfig = useCallback(() => {
    return {
      columns: isMobile() ? 1 : isTablet() ? 2 : 3,
      spacing: isMobile() ? 'compact' : 'comfortable',
      navigation: isMobile() ? 'bottom' : 'side',
      headerHeight: isMobile() ? 56 : 64,
      touchTargetSize: isMobile() ? 44 : 32,
      fontSize: platformInfo.type === 'mobile' ? 'base' : 'sm',
      iconSize: isMobile() ? 24 : 20,
    };
  }, [isMobile, isTablet, platformInfo.type]);

  // Get platform-specific CSS classes
  const getPlatformClasses = useCallback(() => {
    const classes = [
      `platform-${platformInfo.type}`,
      `os-${platformInfo.os}`,
      `browser-${platformInfo.browser}`,
      platformInfo.isTouch && 'touch-enabled',
      platformInfo.isPWA && 'pwa-mode',
      platformInfo.supportsHover && 'hover-enabled',
      platformInfo.reducedMotion && 'reduced-motion',
      platformInfo.highContrast && 'high-contrast',
      `orientation-${platformInfo.orientation}`,
      `color-scheme-${platformInfo.colorScheme}`,
    ].filter(Boolean);
    
    return classes.join(' ');
  }, [platformInfo]);

  // Check if feature is supported
  const isFeatureSupported = useCallback((feature: keyof PlatformCapabilities) => {
    return capabilities[feature];
  }, [capabilities]);

  // Get recommended interaction patterns
  const getInteractionPatterns = useCallback(() => {
    return {
      primaryAction: isMobile() ? 'tap' : 'click',
      secondaryAction: isMobile() ? 'long-press' : 'right-click',
      navigation: isMobile() ? 'swipe' : 'keyboard',
      selection: isMobile() ? 'tap' : 'click',
      contextMenu: isMobile() ? 'long-press' : 'right-click',
      zoom: isMobile() ? 'pinch' : 'scroll',
      scroll: isMobile() ? 'touch' : 'wheel',
    };
  }, [isMobile]);

  // Initialize platform detection
  useEffect(() => {
    updatePlatformInfo();
    detectCapabilities().then(setCapabilities);

    // Listen for changes
    const mediaQueries = [
      window.matchMedia('(prefers-color-scheme: dark)'),
      window.matchMedia('(prefers-reduced-motion: reduce)'),
      window.matchMedia('(prefers-contrast: high)'),
      window.matchMedia('(display-mode: standalone)'),
      window.matchMedia('(hover: hover)'),
    ];

    const handleChange = () => updatePlatformInfo();
    const handleResize = () => updatePlatformInfo();
    const handleOrientationChange = () => {
      setTimeout(updatePlatformInfo, 100);
    };

    mediaQueries.forEach(mq => mq.addEventListener('change', handleChange));
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      mediaQueries.forEach(mq => mq.removeEventListener('change', handleChange));
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, [updatePlatformInfo, detectCapabilities]);

  return {
    platformInfo,
    capabilities,
    isMobile,
    isTablet,
    isDesktop,
    isIOS,
    isAndroid,
    isSafari,
    isChrome,
    isPWA,
    getLayoutConfig,
    getPlatformClasses,
    isFeatureSupported,
    getInteractionPatterns,
    updatePlatformInfo,
  };
}