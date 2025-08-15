'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TouchOptimizedButton } from './TouchOptimizedButton';
import { useHapticFeedback } from './HapticFeedback';
import { useTouch } from '@/hooks/useTouch';
import { cn } from '@/lib/utils';
import {
  Car, MapPin, Clock, CreditCard, User, Phone, Star,
  Home, Search, Menu, Settings, Bell, Heart, Share,
  Navigation, Camera, Mic, MessageCircle, Shield,
  Zap, TrendingUp, Calendar, FileText, HelpCircle
} from 'lucide-react';

interface ShortcutAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  action: () => void;
  color?: string;
  badge?: string | number;
  longPressAction?: () => void;
  category: 'primary' | 'secondary' | 'utility' | 'emergency';
}

interface MobileShortcutsProps {
  shortcuts?: ShortcutAction[];
  layout?: 'grid' | 'carousel' | 'dock';
  showLabels?: boolean;
  maxVisible?: number;
  onShortcutPress?: (shortcut: ShortcutAction) => void;
}

const defaultShortcuts: ShortcutAction[] = [
  {
    id: 'book-ride',
    label: 'Book Ride',
    icon: <Car className="h-6 w-6" />,
    action: () => console.log('Book ride'),
    color: 'bg-blue-600',
    category: 'primary'
  },
  {
    id: 'find-location',
    label: 'Find Location',
    icon: <MapPin className="h-6 w-6" />,
    action: () => console.log('Find location'),
    color: 'bg-green-600',
    category: 'primary'
  },
  {
    id: 'ride-history',
    label: 'History',
    icon: <Clock className="h-6 w-6" />,
    action: () => console.log('Ride history'),
    color: 'bg-purple-600',
    category: 'secondary'
  },
  {
    id: 'payment',
    label: 'Payment',
    icon: <CreditCard className="h-6 w-6" />,
    action: () => console.log('Payment'),
    color: 'bg-orange-600',
    category: 'secondary'
  },
  {
    id: 'profile',
    label: 'Profile',
    icon: <User className="h-6 w-6" />,
    action: () => console.log('Profile'),
    color: 'bg-gray-600',
    category: 'utility'
  },
  {
    id: 'emergency',
    label: 'Emergency',
    icon: <Phone className="h-6 w-6" />,
    action: () => console.log('Emergency'),
    longPressAction: () => console.log('Emergency call'),
    color: 'bg-red-600',
    category: 'emergency'
  }
];

export function MobileShortcuts({
  shortcuts = defaultShortcuts,
  layout = 'grid',
  showLabels = true,
  maxVisible = 6,
  onShortcutPress
}: MobileShortcutsProps) {
  const { triggerHaptic } = useHapticFeedback();
  const { isTouchDevice } = useTouch();
  const [visibleShortcuts, setVisibleShortcuts] = useState(shortcuts.slice(0, maxVisible));
  const [showMore, setShowMore] = useState(false);

  const handleShortcutPress = (shortcut: ShortcutAction) => {
    triggerHaptic('medium');
    shortcut.action();
    onShortcutPress?.(shortcut);
  };

  const handleLongPress = (shortcut: ShortcutAction) => {
    if (shortcut.longPressAction) {
      triggerHaptic('heavy');
      shortcut.longPressAction();
    }
  };

  const toggleShowMore = () => {
    triggerHaptic('light');
    setShowMore(!showMore);
    setVisibleShortcuts(
      showMore ? shortcuts.slice(0, maxVisible) : shortcuts
    );
  };

  if (layout === 'dock') {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-pb z-50">
        <div className="flex justify-around items-center py-2 px-4">
          {visibleShortcuts.map((shortcut) => (
            <TouchOptimizedButton
              key={shortcut.id}
              variant="ghost"
              className="flex-col space-y-1 h-16 w-16 p-2"
              onClick={() => handleShortcutPress(shortcut)}
              longPressAction={() => handleLongPress(shortcut)}
              hapticFeedback={true}
            >
              <div className={cn(
                'p-2 rounded-full text-white relative',
                shortcut.color || 'bg-gray-600'
              )}>
                {shortcut.icon}
                {shortcut.badge && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {shortcut.badge}
                  </span>
                )}
              </div>
              {showLabels && (
                <span className="text-xs text-gray-600 truncate max-w-full">
                  {shortcut.label}
                </span>
              )}
            </TouchOptimizedButton>
          ))}
        </div>
      </div>
    );
  }

  if (layout === 'carousel') {
    return (
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex space-x-4 p-4 min-w-max">
          {shortcuts.map((shortcut) => (
            <TouchOptimizedButton
              key={shortcut.id}
              variant="outline"
              className="flex-col space-y-2 h-20 w-20 p-3 flex-shrink-0"
              onClick={() => handleShortcutPress(shortcut)}
              longPressAction={() => handleLongPress(shortcut)}
              hapticFeedback={true}
            >
              <div className={cn(
                'p-2 rounded-full text-white relative',
                shortcut.color || 'bg-gray-600'
              )}>
                {shortcut.icon}
                {shortcut.badge && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                    {shortcut.badge}
                  </span>
                )}
              </div>
              {showLabels && (
                <span className="text-xs text-center truncate max-w-full">
                  {shortcut.label}
                </span>
              )}
            </TouchOptimizedButton>
          ))}
        </div>
      </div>
    );
  }

  // Grid layout (default)
  return (
    <div className="p-4">
      <div className="grid grid-cols-3 gap-4">
        {visibleShortcuts.map((shortcut) => (
          <TouchOptimizedButton
            key={shortcut.id}
            variant="outline"
            className="flex-col space-y-2 h-24 p-3"
            onClick={() => handleShortcutPress(shortcut)}
            longPressAction={() => handleLongPress(shortcut)}
            hapticFeedback={true}
          >
            <div className={cn(
              'p-3 rounded-full text-white relative',
              shortcut.color || 'bg-gray-600'
            )}>
              {shortcut.icon}
              {shortcut.badge && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {shortcut.badge}
                </span>
              )}
            </div>
            {showLabels && (
              <span className="text-sm text-center truncate max-w-full">
                {shortcut.label}
              </span>
            )}
          </TouchOptimizedButton>
        ))}
      </div>

      {shortcuts.length > maxVisible && (
        <div className="mt-4 text-center">
          <TouchOptimizedButton
            variant="ghost"
            onClick={toggleShowMore}
            className="text-blue-600"
          >
            {showMore ? 'Show Less' : `Show ${shortcuts.length - maxVisible} More`}
          </TouchOptimizedButton>
        </div>
      )}
    </div>
  );
}

export function QuickActionFAB() {
  const [isExpanded, setIsExpanded] = useState(false);
  const { triggerHaptic } = useHapticFeedback();
  const { isTouchDevice } = useTouch();

  const quickActions = [
    {
      id: 'book-ride',
      label: 'Book Ride',
      icon: <Car className="h-5 w-5" />,
      color: 'bg-blue-600',
      action: () => console.log('Book ride')
    },
    {
      id: 'emergency',
      label: 'Emergency',
      icon: <Phone className="h-5 w-5" />,
      color: 'bg-red-600',
      action: () => console.log('Emergency')
    },
    {
      id: 'share-location',
      label: 'Share Location',
      icon: <Share className="h-5 w-5" />,
      color: 'bg-green-600',
      action: () => console.log('Share location')
    },
    {
      id: 'call-support',
      label: 'Support',
      icon: <HelpCircle className="h-5 w-5" />,
      color: 'bg-purple-600',
      action: () => console.log('Call support')
    }
  ];

  const toggleExpanded = () => {
    triggerHaptic('medium');
    setIsExpanded(!isExpanded);
  };

  const handleActionPress = (action: () => void) => {
    triggerHaptic('heavy');
    action();
    setIsExpanded(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Expanded Actions */}
      {isExpanded && (
        <div className="absolute bottom-16 right-0 space-y-3 animate-in slide-in-from-bottom duration-200">
          {quickActions.map((action, index) => (
            <div
              key={action.id}
              className="flex items-center space-x-3 animate-in slide-in-from-right duration-200"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <span className="bg-black bg-opacity-70 text-white px-3 py-1 rounded-full text-sm whitespace-nowrap">
                {action.label}
              </span>
              <TouchOptimizedButton
                className={cn(
                  'w-12 h-12 rounded-full shadow-lg text-white',
                  action.color
                )}
                onClick={() => handleActionPress(action.action)}
                hapticFeedback={true}
              >
                {action.icon}
              </TouchOptimizedButton>
            </div>
          ))}
        </div>
      )}

      {/* Main FAB */}
      <TouchOptimizedButton
        className={cn(
          'w-14 h-14 rounded-full shadow-lg transition-all duration-200',
          isExpanded 
            ? 'bg-red-600 hover:bg-red-700 rotate-45' 
            : 'bg-blue-600 hover:bg-blue-700'
        )}
        onClick={toggleExpanded}
        hapticFeedback={true}
      >
        {isExpanded ? (
          <span className="text-2xl">×</span>
        ) : (
          <span className="text-2xl">+</span>
        )}
      </TouchOptimizedButton>

      {/* Backdrop */}
      {isExpanded && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-20 -z-10"
          onClick={() => setIsExpanded(false)}
        />
      )}
    </div>
  );
}

export function ContextualShortcuts({ context }: { context: 'booking' | 'ride' | 'payment' | 'profile' }) {
  const contextShortcuts = {
    booking: [
      { id: 'quick-home', label: 'Home', icon: <Home className="h-4 w-4" />, action: () => {} },
      { id: 'quick-work', label: 'Work', icon: <Car className="h-4 w-4" />, action: () => {} },
      { id: 'quick-airport', label: 'Airport', icon: <Navigation className="h-4 w-4" />, action: () => {} },
      { id: 'schedule', label: 'Schedule', icon: <Calendar className="h-4 w-4" />, action: () => {} }
    ],
    ride: [
      { id: 'call-driver', label: 'Call', icon: <Phone className="h-4 w-4" />, action: () => {} },
      { id: 'message-driver', label: 'Message', icon: <MessageCircle className="h-4 w-4" />, action: () => {} },
      { id: 'share-trip', label: 'Share', icon: <Share className="h-4 w-4" />, action: () => {} },
      { id: 'emergency', label: 'SOS', icon: <Shield className="h-4 w-4" />, action: () => {} }
    ],
    payment: [
      { id: 'add-card', label: 'Add Card', icon: <CreditCard className="h-4 w-4" />, action: () => {} },
      { id: 'promo-code', label: 'Promo', icon: <Zap className="h-4 w-4" />, action: () => {} },
      { id: 'receipt', label: 'Receipt', icon: <FileText className="h-4 w-4" />, action: () => {} },
      { id: 'split-fare', label: 'Split', icon: <Share className="h-4 w-4" />, action: () => {} }
    ],
    profile: [
      { id: 'edit-profile', label: 'Edit', icon: <User className="h-4 w-4" />, action: () => {} },
      { id: 'preferences', label: 'Settings', icon: <Settings className="h-4 w-4" />, action: () => {} },
      { id: 'help', label: 'Help', icon: <HelpCircle className="h-4 w-4" />, action: () => {} },
      { id: 'feedback', label: 'Feedback', icon: <Star className="h-4 w-4" />, action: () => {} }
    ]
  };

  const shortcuts = contextShortcuts[context] || [];

  return (
    <Card className="m-4">
      <CardContent className="p-3">
        <div className="flex space-x-2 overflow-x-auto scrollbar-hide">
          {shortcuts.map((shortcut) => (
            <TouchOptimizedButton
              key={shortcut.id}
              variant="outline"
              size="sm"
              className="flex-col space-y-1 h-16 w-16 flex-shrink-0"
              onClick={shortcut.action}
              hapticFeedback={true}
            >
              {shortcut.icon}
              <span className="text-xs">{shortcut.label}</span>
            </TouchOptimizedButton>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Custom hook for managing shortcuts
export function useShortcuts() {
  const [shortcuts, setShortcuts] = useState<ShortcutAction[]>(defaultShortcuts);
  const { triggerHaptic } = useHapticFeedback();

  const addShortcut = (shortcut: ShortcutAction) => {
    setShortcuts(prev => [...prev, shortcut]);
    triggerHaptic('success');
  };

  const removeShortcut = (id: string) => {
    setShortcuts(prev => prev.filter(s => s.id !== id));
    triggerHaptic('light');
  };

  const reorderShortcuts = (fromIndex: number, toIndex: number) => {
    setShortcuts(prev => {
      const newShortcuts = [...prev];
      const [removed] = newShortcuts.splice(fromIndex, 1);
      newShortcuts.splice(toIndex, 0, removed);
      return newShortcuts;
    });
    triggerHaptic('medium');
  };

  const updateShortcut = (id: string, updates: Partial<ShortcutAction>) => {
    setShortcuts(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    triggerHaptic('light');
  };

  return {
    shortcuts,
    addShortcut,
    removeShortcut,
    reorderShortcuts,
    updateShortcut
  };
}