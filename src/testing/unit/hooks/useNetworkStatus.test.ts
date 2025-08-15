// Unit tests for useNetworkStatus hook

import { renderHook, act, waitFor } from '@testing-library/react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

// Mock navigator.connection
const mockConnection = {
  effectiveType: '4g' as const,
  downlink: 10,
  rtt: 100,
  saveData: false,
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
};

// Mock navigator
Object.defineProperty(navigator, 'connection', {
  writable: true,
  value: mockConnection,
});

Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true,
});

describe('useNetworkStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockConnection.effectiveType = '4g';
    mockConnection.downlink = 10;
    mockConnection.rtt = 100;
    mockConnection.saveData = false;
    navigator.onLine = true;
  });

  describe('Initial State', () => {
    it('returns correct initial network status', () => {
      const { result } = renderHook(() => useNetworkStatus());
      
      expect(result.current.networkStatus).toEqual({
        isOnline: true,
        connectionType: '4g',
        effectiveType: '4g',
        downlink: 10,
        rtt: 100,
        saveData: false,
      });
    });

    it('detects offline state', () => {
      navigator.onLine = false;
      
      const { result } = renderHook(() => useNetworkStatus());
      
      expect(result.current.networkStatus.isOnline).toBe(false);
    });
  });

  describe('Connection Type Detection', () => {
    it('detects slow connection', () => {
      mockConnection.effectiveType = 'slow-2g';
      
      const { result } = renderHook(() => useNetworkStatus());
      
      expect(result.current.isSlowConnection()).toBe(true);
    });

    it('detects fast connection', () => {
      mockConnection.effectiveType = '4g';
      mockConnection.downlink = 15;
      
      const { result } = renderHook(() => useNetworkStatus());
      
      expect(result.current.isFastConnection()).toBe(true);
    });

    it('detects data saver mode', () => {
      mockConnection.saveData = true;
      
      const { result } = renderHook(() => useNetworkStatus());
      
      expect(result.current.shouldReduceData()).toBe(true);
    });
  });

  describe('Image Quality Optimization', () => {
    it('returns low quality for slow connections', () => {
      mockConnection.effectiveType = 'slow-2g';
      
      const { result } = renderHook(() => useNetworkStatus());
      
      expect(result.current.getOptimalImageQuality()).toBe('low');
    });

    it('returns high quality for fast connections', () => {
      mockConnection.effectiveType = '4g';
      mockConnection.downlink = 15;
      
      const { result } = renderHook(() => useNetworkStatus());
      
      expect(result.current.getOptimalImageQuality()).toBe('high');
    });

    it('returns medium quality for moderate connections', () => {
      mockConnection.effectiveType = '3g';
      mockConnection.downlink = 5;
      
      const { result } = renderHook(() => useNetworkStatus());
      
      expect(result.current.getOptimalImageQuality()).toBe('medium');
    });
  });

  describe('Chunk Size Optimization', () => {
    it('returns small chunks for slow connections', () => {
      mockConnection.effectiveType = 'slow-2g';
      
      const { result } = renderHook(() => useNetworkStatus());
      
      expect(result.current.getOptimalChunkSize()).toBe('small');
    });

    it('returns large chunks for fast connections', () => {
      mockConnection.effectiveType = '4g';
      mockConnection.downlink = 15;
      
      const { result } = renderHook(() => useNetworkStatus());
      
      expect(result.current.getOptimalChunkSize()).toBe('large');
    });
  });

  describe('Event Handling', () => {
    it('updates status when connection changes', async () => {
      const { result } = renderHook(() => useNetworkStatus());
      
      // Simulate connection change
      act(() => {
        mockConnection.effectiveType = '2g';
        mockConnection.downlink = 1;
        
        // Trigger the connection change event
        const changeHandler = mockConnection.addEventListener.mock.calls
          .find(call => call[0] === 'change')?.[1];
        
        if (changeHandler) {
          changeHandler();
        }
      });
      
      await waitFor(() => {
        expect(result.current.networkStatus.effectiveType).toBe('2g');
        expect(result.current.networkStatus.downlink).toBe(1);
      });
    });

    it('updates status when online/offline changes', async () => {
      const { result } = renderHook(() => useNetworkStatus());
      
      expect(result.current.networkStatus.isOnline).toBe(true);
      
      // Simulate going offline
      act(() => {
        navigator.onLine = false;
        window.dispatchEvent(new Event('offline'));
      });
      
      await waitFor(() => {
        expect(result.current.networkStatus.isOnline).toBe(false);
      });
      
      // Simulate coming back online
      act(() => {
        navigator.onLine = true;
        window.dispatchEvent(new Event('online'));
      });
      
      await waitFor(() => {
        expect(result.current.networkStatus.isOnline).toBe(true);
      });
    });
  });

  describe('Performance', () => {
    it('does not cause unnecessary re-renders', () => {
      const { result, rerender } = renderHook(() => useNetworkStatus());
      
      const initialResult = result.current;
      
      // Re-render without changing network status
      rerender();
      
      // Should return the same object references
      expect(result.current.networkStatus).toBe(initialResult.networkStatus);
    });

    it('debounces rapid connection changes', async () => {
      const { result } = renderHook(() => useNetworkStatus());
      
      const initialEffectiveType = result.current.networkStatus.effectiveType;
      
      // Simulate rapid connection changes
      act(() => {
        for (let i = 0; i < 10; i++) {
          mockConnection.effectiveType = i % 2 === 0 ? '2g' : '4g';
          
          const changeHandler = mockConnection.addEventListener.mock.calls
            .find(call => call[0] === 'change')?.[1];
          
          if (changeHandler) {
            changeHandler();
          }
        }
      });
      
      // Should eventually settle to the final value
      await waitFor(() => {
        expect(result.current.networkStatus.effectiveType).toBe('4g');
      }, { timeout: 1000 });
    });
  });

  describe('Edge Cases', () => {
    it('handles missing navigator.connection gracefully', () => {
      // Temporarily remove connection API
      const originalConnection = navigator.connection;
      delete (navigator as any).connection;
      
      const { result } = renderHook(() => useNetworkStatus());
      
      expect(result.current.networkStatus.effectiveType).toBe('4g'); // Default value
      expect(result.current.networkStatus.downlink).toBe(10); // Default value
      
      // Restore connection API
      (navigator as any).connection = originalConnection;
    });

    it('handles connection API without saveData property', () => {
      const connectionWithoutSaveData = { ...mockConnection };
      delete (connectionWithoutSaveData as any).saveData;
      
      Object.defineProperty(navigator, 'connection', {
        value: connectionWithoutSaveData,
      });
      
      const { result } = renderHook(() => useNetworkStatus());
      
      expect(result.current.networkStatus.saveData).toBe(false); // Default value
    });

    it('handles invalid connection values', () => {
      mockConnection.downlink = -1;
      mockConnection.rtt = -1;
      
      const { result } = renderHook(() => useNetworkStatus());
      
      // Should handle negative values gracefully
      expect(result.current.networkStatus.downlink).toBe(-1);
      expect(result.current.networkStatus.rtt).toBe(-1);
      expect(result.current.isFastConnection()).toBe(false);
    });
  });

  describe('Cleanup', () => {
    it('removes event listeners on unmount', () => {
      const { unmount } = renderHook(() => useNetworkStatus());
      
      // Clear previous calls
      mockConnection.removeEventListener.mockClear();
      
      unmount();
      
      expect(mockConnection.removeEventListener).toHaveBeenCalledWith(
        'change',
        expect.any(Function)
      );
    });
  });
});