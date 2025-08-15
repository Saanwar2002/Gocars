'use client';

import { useState, useEffect, useCallback } from 'react';

interface NetworkStatus {
    isOnline: boolean;
    connectionType: 'slow-2g' | '2g' | '3g' | '4g' | 'wifi' | 'unknown';
    effectiveType: 'slow-2g' | '2g' | '3g' | '4g';
    downlink: number;
    rtt: number;
    saveData: boolean;
}

interface NetworkConnection extends EventTarget {
    effectiveType: '2g' | '3g' | '4g' | 'slow-2g';
    downlink: number;
    rtt: number;
    saveData: boolean;
    type?: string;
}

declare global {
    interface Navigator {
        connection?: NetworkConnection;
        mozConnection?: NetworkConnection;
        webkitConnection?: NetworkConnection;
    }
}

export function useNetworkStatus() {
    const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
        isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
        connectionType: 'unknown',
        effectiveType: '4g',
        downlink: 10,
        rtt: 100,
        saveData: false,
    });

    const getConnection = useCallback((): NetworkConnection | null => {
        return (
            navigator.connection ||
            navigator.mozConnection ||
            navigator.webkitConnection ||
            null
        );
    }, []);

    const updateNetworkStatus = useCallback(() => {
        const connection = getConnection();

        setNetworkStatus(prev => ({
            ...prev,
            isOnline: navigator.onLine,
            effectiveType: connection?.effectiveType || '4g',
            downlink: connection?.downlink || 10,
            rtt: connection?.rtt || 100,
            saveData: connection?.saveData || false,
            connectionType: getConnectionType(connection),
        }));
    }, [getConnection]);

    const getConnectionType = (connection: NetworkConnection | null): NetworkStatus['connectionType'] => {
        if (!connection) return 'unknown';

        if (connection.type) {
            if (connection.type === 'wifi') return 'wifi';
            if (connection.type === 'cellular') {
                return connection.effectiveType;
            }
        }

        return connection.effectiveType;
    };

    useEffect(() => {
        updateNetworkStatus();

        const handleOnline = () => updateNetworkStatus();
        const handleOffline = () => updateNetworkStatus();
        const handleConnectionChange = () => updateNetworkStatus();

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        const connection = getConnection();
        if (connection) {
            connection.addEventListener('change', handleConnectionChange);
        }

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);

            if (connection) {
                connection.removeEventListener('change', handleConnectionChange);
            }
        };
    }, [updateNetworkStatus, getConnection]);

    const isSlowConnection = useCallback(() => {
        return networkStatus.effectiveType === 'slow-2g' || networkStatus.effectiveType === '2g';
    }, [networkStatus.effectiveType]);

    const isFastConnection = useCallback(() => {
        return networkStatus.effectiveType === '4g' && networkStatus.downlink > 5;
    }, [networkStatus.effectiveType, networkStatus.downlink]);

    const shouldReduceData = useCallback(() => {
        return networkStatus.saveData || isSlowConnection();
    }, [networkStatus.saveData, isSlowConnection]);

    const getOptimalImageQuality = useCallback(() => {
        if (shouldReduceData()) return 'low';
        if (isSlowConnection()) return 'medium';
        if (isFastConnection()) return 'high';
        return 'medium';
    }, [shouldReduceData, isSlowConnection, isFastConnection]);

    const getOptimalChunkSize = useCallback(() => {
        if (isSlowConnection()) return 'small';
        if (isFastConnection()) return 'large';
        return 'medium';
    }, [isSlowConnection, isFastConnection]);

    return {
        networkStatus,
        isSlowConnection,
        isFastConnection,
        shouldReduceData,
        getOptimalImageQuality,
        getOptimalChunkSize,
        updateNetworkStatus,
    };
}