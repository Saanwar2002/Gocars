'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useDataSync } from './useDataSync';

interface SessionData {
  userId: string;
  deviceId: string;
  sessionId: string;
  isActive: boolean;
  lastActivity: number;
  location?: {
    pathname: string;
    search: string;
    hash: string;
  };
  preferences: Record<string, any>;
  state: Record<string, any>;
}

interface DeviceSession {
  deviceId: string;
  deviceName: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  browser: string;
  os: string;
  isCurrentDevice: boolean;
  lastSeen: number;
  isActive: boolean;
  location?: {
    pathname: string;
    search: string;
  };
}

interface SessionSyncOptions {
  syncInterval?: number;
  maxInactiveDuration?: number;
  enableLocationSync?: boolean;
  enableStateSync?: boolean;
  enablePreferenceSync?: boolean;
}

const DEFAULT_OPTIONS: SessionSyncOptions = {
  syncInterval: 10000, // 10 seconds
  maxInactiveDuration: 5 * 60 * 1000, // 5 minutes
  enableLocationSync: true,
  enableStateSync: true,
  enablePreferenceSync: true,
};

export function useSessionSync(userId: string, options: SessionSyncOptions = {}) {
  const fullOptions = { ...DEFAULT_OPTIONS, ...options };
  const { updateData, getData, getDataByType, deviceId } = useDataSync(userId);
  
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [activeSessions, setActiveSessions] = useState<DeviceSession[]>([]);
  const [currentSession, setCurrentSession] = useState<SessionData | null>(null);
  
  const lastActivityRef = useRef(Date.now());
  const locationRef = useRef<Location | null>(null);
  const stateRef = useRef<Record<string, any>>({});
  const preferencesRef = useRef<Record<string, any>>({});

  // Detect device information
  const getDeviceInfo = useCallback(() => {
    const userAgent = navigator.userAgent;
    
    // Detect device type
    let deviceType: 'mobile' | 'tablet' | 'desktop' = 'desktop';
    if (/Mobile|Android|iPhone|iPod/.test(userAgent)) {
      deviceType = 'mobile';
    } else if (/iPad|Tablet/.test(userAgent)) {
      deviceType = 'tablet';
    }

    // Detect browser
    let browser = 'Unknown';
    if (userAgent.includes('Chrome')) browser = 'Chrome';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Safari')) browser = 'Safari';
    else if (userAgent.includes('Edge')) browser = 'Edge';

    // Detect OS
    let os = 'Unknown';
    if (userAgent.includes('Windows')) os = 'Windows';
    else if (userAgent.includes('Mac')) os = 'macOS';
    else if (userAgent.includes('Linux')) os = 'Linux';
    else if (userAgent.includes('Android')) os = 'Android';
    else if (userAgent.includes('iOS')) os = 'iOS';

    return {
      deviceType,
      browser,
      os,
      deviceName: `${os} ${browser}`,
    };
  }, []);

  // Update session activity
  const updateActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    
    if (currentSession) {
      const updatedSession: SessionData = {
        ...currentSession,
        lastActivity: lastActivityRef.current,
        isActive: true,
      };
      
      setCurrentSession(updatedSession);
      updateData(sessionId, 'session', updatedSession);
    }
  }, [currentSession, sessionId, updateData]);

  // Update location
  const updateLocation = useCallback((location: Location) => {
    if (!fullOptions.enableLocationSync) return;
    
    locationRef.current = location;
    
    if (currentSession) {
      const updatedSession: SessionData = {
        ...currentSession,
        location: {
          pathname: location.pathname,
          search: location.search,
          hash: location.hash,
        },
        lastActivity: Date.now(),
      };
      
      setCurrentSession(updatedSession);
      updateData(sessionId, 'session', updatedSession);
    }
  }, [currentSession, sessionId, updateData, fullOptions.enableLocationSync]);

  // Update session state
  const updateSessionState = useCallback((key: string, value: any) => {
    if (!fullOptions.enableStateSync) return;
    
    stateRef.current = { ...stateRef.current, [key]: value };
    
    if (currentSession) {
      const updatedSession: SessionData = {
        ...currentSession,
        state: stateRef.current,
        lastActivity: Date.now(),
      };
      
      setCurrentSession(updatedSession);
      updateData(sessionId, 'session', updatedSession);
    }
  }, [currentSession, sessionId, updateData, fullOptions.enableStateSync]);

  // Update preferences
  const updatePreferences = useCallback((preferences: Record<string, any>) => {
    if (!fullOptions.enablePreferenceSync) return;
    
    preferencesRef.current = { ...preferencesRef.current, ...preferences };
    
    if (currentSession) {
      const updatedSession: SessionData = {
        ...currentSession,
        preferences: preferencesRef.current,
        lastActivity: Date.now(),
      };
      
      setCurrentSession(updatedSession);
      updateData(sessionId, 'session', updatedSession);
    }
  }, [currentSession, sessionId, updateData, fullOptions.enablePreferenceSync]);

  // Get session state
  const getSessionState = useCallback((key?: string) => {
    if (key) {
      return stateRef.current[key];
    }
    return stateRef.current;
  }, []);

  // Get preferences
  const getPreferences = useCallback((key?: string) => {
    if (key) {
      return preferencesRef.current[key];
    }
    return preferencesRef.current;
  }, []);

  // Initialize session
  const initializeSession = useCallback(() => {
    const deviceInfo = getDeviceInfo();
    
    const session: SessionData = {
      userId,
      deviceId,
      sessionId,
      isActive: true,
      lastActivity: Date.now(),
      location: fullOptions.enableLocationSync && typeof window !== 'undefined' ? {
        pathname: window.location.pathname,
        search: window.location.search,
        hash: window.location.hash,
      } : undefined,
      preferences: preferencesRef.current,
      state: stateRef.current,
    };
    
    setCurrentSession(session);
    updateData(sessionId, 'session', session);
  }, [userId, deviceId, sessionId, updateData, getDeviceInfo, fullOptions.enableLocationSync]);

  // End session
  const endSession = useCallback(() => {
    if (currentSession) {
      const endedSession: SessionData = {
        ...currentSession,
        isActive: false,
        lastActivity: Date.now(),
      };
      
      updateData(sessionId, 'session', endedSession);
      setCurrentSession(null);
    }
  }, [currentSession, sessionId, updateData]);

  // Get all active sessions
  const getActiveSessions = useCallback(() => {
    const allSessions = getDataByType('session') as SessionData[];
    const now = Date.now();
    
    const deviceSessions: DeviceSession[] = allSessions
      .filter(session => 
        session.userId === userId && 
        session.isActive &&
        (now - session.lastActivity) < fullOptions.maxInactiveDuration!
      )
      .map(session => {
        const deviceInfo = getDeviceInfo();
        return {
          deviceId: session.deviceId,
          deviceName: deviceInfo.deviceName,
          deviceType: deviceInfo.deviceType,
          browser: deviceInfo.browser,
          os: deviceInfo.os,
          isCurrentDevice: session.deviceId === deviceId,
          lastSeen: session.lastActivity,
          isActive: session.isActive,
          location: session.location,
        };
      });
    
    setActiveSessions(deviceSessions);
    return deviceSessions;
  }, [getDataByType, userId, deviceId, getDeviceInfo, fullOptions.maxInactiveDuration]);

  // Switch to another device's session
  const switchToDevice = useCallback((targetDeviceId: string) => {
    const targetSession = getDataByType('session').find(
      (session: SessionData) => session.deviceId === targetDeviceId && session.isActive
    ) as SessionData;
    
    if (targetSession && targetSession.location) {
      // Navigate to the same location as the target device
      if (typeof window !== 'undefined') {
        const targetUrl = `${targetSession.location.pathname}${targetSession.location.search}${targetSession.location.hash || ''}`;
        window.location.href = targetUrl;
      }
      
      // Sync state and preferences
      if (targetSession.state) {
        stateRef.current = { ...stateRef.current, ...targetSession.state };
      }
      
      if (targetSession.preferences) {
        preferencesRef.current = { ...preferencesRef.current, ...targetSession.preferences };
      }
      
      return true;
    }
    
    return false;
  }, [getDataByType]);

  // Handoff current session to another device
  const handoffToDevice = useCallback((targetDeviceId: string, includeState = true) => {
    if (!currentSession) return false;
    
    const handoffData = {
      location: currentSession.location,
      preferences: includeState ? currentSession.preferences : {},
      state: includeState ? currentSession.state : {},
      timestamp: Date.now(),
      fromDevice: deviceId,
    };
    
    // Create handoff data for target device
    updateData(`handoff_${targetDeviceId}_${Date.now()}`, 'handoff', handoffData);
    
    return true;
  }, [currentSession, deviceId, updateData]);

  // Check for incoming handoffs
  const checkForHandoffs = useCallback(() => {
    const handoffs = getDataByType('handoff').filter((handoff: any) => 
      handoff.id.includes(deviceId) && 
      (Date.now() - handoff.timestamp) < 60000 // Within last minute
    );
    
    if (handoffs.length > 0) {
      const latestHandoff = handoffs.sort((a: any, b: any) => b.timestamp - a.timestamp)[0];
      
      // Apply handoff data
      if (latestHandoff.data.location && fullOptions.enableLocationSync) {
        const targetUrl = `${latestHandoff.data.location.pathname}${latestHandoff.data.location.search}${latestHandoff.data.location.hash || ''}`;
        if (typeof window !== 'undefined' && window.location.href !== targetUrl) {
          window.location.href = targetUrl;
        }
      }
      
      if (latestHandoff.data.preferences && fullOptions.enablePreferenceSync) {
        updatePreferences(latestHandoff.data.preferences);
      }
      
      if (latestHandoff.data.state && fullOptions.enableStateSync) {
        Object.entries(latestHandoff.data.state).forEach(([key, value]) => {
          updateSessionState(key, value);
        });
      }
      
      return latestHandoff;
    }
    
    return null;
  }, [getDataByType, deviceId, fullOptions, updatePreferences, updateSessionState]);

  // Activity tracking
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const handleActivity = () => {
      updateActivity();
    };
    
    events.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });
    
    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [updateActivity]);

  // Location tracking
  useEffect(() => {
    if (!fullOptions.enableLocationSync || typeof window === 'undefined') return;
    
    const handleLocationChange = () => {
      updateLocation(window.location);
    };
    
    // Listen for navigation events
    window.addEventListener('popstate', handleLocationChange);
    
    // Override pushState and replaceState to catch programmatic navigation
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    
    history.pushState = function(...args) {
      originalPushState.apply(history, args);
      setTimeout(handleLocationChange, 0);
    };
    
    history.replaceState = function(...args) {
      originalReplaceState.apply(history, args);
      setTimeout(handleLocationChange, 0);
    };
    
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
    };
  }, [fullOptions.enableLocationSync, updateLocation]);

  // Initialize session on mount
  useEffect(() => {
    initializeSession();
    
    return () => {
      endSession();
    };
  }, [initializeSession, endSession]);

  // Periodic session updates
  useEffect(() => {
    const interval = setInterval(() => {
      updateActivity();
      getActiveSessions();
      checkForHandoffs();
    }, fullOptions.syncInterval);
    
    return () => clearInterval(interval);
  }, [fullOptions.syncInterval, updateActivity, getActiveSessions, checkForHandoffs]);

  // Cleanup on page unload
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleBeforeUnload = () => {
      endSession();
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [endSession]);

  return {
    currentSession,
    activeSessions,
    sessionId,
    deviceId,
    updateSessionState,
    getSessionState,
    updatePreferences,
    getPreferences,
    getActiveSessions,
    switchToDevice,
    handoffToDevice,
    checkForHandoffs,
    updateActivity,
  };
}