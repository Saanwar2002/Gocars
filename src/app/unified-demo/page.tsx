'use client';

import React, { useState, useEffect } from 'react';
import { UnifiedLayout, ResponsiveGrid, PlatformSpacing } from '@/components/unified/UnifiedLayout';
import { PlatformOptimizer, PlatformSpecific, ResponsiveComponent, TouchOptimizedElement, PlatformImage, PlatformText } from '@/components/unified/PlatformOptimizer';
import { HandoffManager, HandoffReceiver } from '@/components/unified/HandoffManager';
import { usePlatformDetection } from '@/hooks/usePlatformDetection';
import { useNotificationManager } from '@/hooks/useNotificationManager';
import { useDevicePreferences } from '@/hooks/useDevicePreferences';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
    Smartphone, Monitor, Tablet, Zap, Bell, Share,
    Settings, Eye, Palette, Type, Volume2, Vibrate,
    Wifi, Battery, Camera, Mic, MapPin, Star
} from 'lucide-react';

const DEMO_USER_ID = 'unified_demo_user';

export default function UnifiedDemoPage() {
    const [activeTab, setActiveTab] = useState('overview');
    const [showHandoff, setShowHandoff] = useState(false);

    const {
        platformInfo,
        capabilities,
        isMobile,
        isTablet,
        isDesktop,
        isPWA,
        getLayoutConfig,
        getPlatformClasses,
        getInteractionPatterns
    } = usePlatformDetection();

    const {
        notificationState,
        requestPermission,
        showNotification,
        showRideNotification
    } = useNotificationManager(DEMO_USER_ID);

    const {
        preferences,
        updatePreference,
        capabilities: deviceCapabilities
    } = useDevicePreferences(DEMO_USER_ID);

    const layoutConfig = getLayoutConfig();
    const interactionPatterns = getInteractionPatterns();

    const handleTestNotification = () => {
        showNotification({
            title: 'Test Notification',
            body: 'This is a cross-platform notification test',
            category: 'system',
            priority: 'normal',
        });
    };

    const handleRideNotification = () => {
        showRideNotification('request', {
            destination: 'Downtown Mall',
            fare: '$15.50',
            driverName: 'John Doe'
        });
    };

    const handleHandoffReceived = (data: any) => {
        console.log('Handoff received:', data);
        // Apply handoff data to your app state
    };

    return (
        <PlatformOptimizer
            enableAutoOptimization={true}
            enablePerformanceMode={true}
            enableAccessibilityMode={true}
        >
            <UnifiedLayout
                title="Unified Experience Demo"
                showBackButton={false}
                showSearch={true}
                showNotifications={true}
                showProfile={true}
                onSearch={() => console.log('Search clicked')}
                onNotifications={() => console.log('Notifications clicked')}
                onProfile={() => console.log('Profile clicked')}
                bottomNavigation={isMobile() ? (
                    <nav className="flex justify-around items-center py-2 px-4 h-16">
                        {[
                            { icon: <Monitor className="h-5 w-5" />, label: 'Demo' },
                            { icon: <Settings className="h-5 w-5" />, label: 'Settings' },
                            { icon: <Share className="h-5 w-5" />, label: 'Handoff' },
                            { icon: <Bell className="h-5 w-5" />, label: 'Notify' },
                        ].map((item, index) => (
                            <TouchOptimizedElement
                                key={index}
                                className="flex flex-col items-center space-y-1 p-2 rounded-lg transition-colors text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                                onClick={() => {
                                    if (item.label === 'Handoff') setShowHandoff(true);
                                    if (item.label === 'Notify') handleTestNotification();
                                }}
                            >
                                {item.icon}
                                <span className="text-xs">{item.label}</span>
                            </TouchOptimizedElement>
                        ))}
                    </nav>
                ) : undefined}
            >
                <PlatformSpacing size="default">
                    {/* Header Section */}
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-lg mb-8">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold mb-2">Unified Cross-Platform Experience</h1>
                                <PlatformText size="base" className="text-indigo-100">
                                    Seamless experience across all devices with intelligent optimization
                                </PlatformText>
                            </div>
                            <div className="text-right">
                                <div className="flex items-center space-x-2 mb-2">
                                    {platformInfo.type === 'mobile' && <Smartphone className="h-5 w-5" />}
                                    {platformInfo.type === 'tablet' && <Tablet className="h-5 w-5" />}
                                    {platformInfo.type === 'desktop' && <Monitor className="h-5 w-5" />}
                                    <span className="capitalize">{platformInfo.type}</span>
                                </div>
                                <div className="text-sm text-indigo-200">
                                    {platformInfo.os} • {platformInfo.browser}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Platform Detection Overview */}
                    <ResponsiveGrid className="mb-8">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm flex items-center">
                                    <Eye className="h-4 w-4 mr-2" />
                                    Platform Detection
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span>Device Type:</span>
                                        <Badge variant="outline">{platformInfo.type}</Badge>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Operating System:</span>
                                        <span className="capitalize">{platformInfo.os}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Browser:</span>
                                        <span className="capitalize">{platformInfo.browser} {platformInfo.version}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Touch Support:</span>
                                        <span>{platformInfo.isTouch ? 'Yes' : 'No'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>PWA Mode:</span>
                                        <span>{isPWA() ? 'Yes' : 'No'}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm flex items-center">
                                    <Zap className="h-4 w-4 mr-2" />
                                    Device Capabilities
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    {Object.entries(capabilities).map(([key, value]) => (
                                        <div key={key} className="flex items-center space-x-2">
                                            <div className={`w-2 h-2 rounded-full ${value ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                            <span className="capitalize">{key.replace('has', '').replace(/([A-Z])/g, ' $1').trim()}</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm flex items-center">
                                    <Settings className="h-4 w-4 mr-2" />
                                    Layout Configuration
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span>Columns:</span>
                                        <span>{layoutConfig.columns}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Navigation:</span>
                                        <span className="capitalize">{layoutConfig.navigation}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Touch Target:</span>
                                        <span>{layoutConfig.touchTargetSize}px</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Header Height:</span>
                                        <span>{layoutConfig.headerHeight}px</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </ResponsiveGrid>

                    {/* Main Content Tabs */}
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="overview">Overview</TabsTrigger>
                            <TabsTrigger value="optimization">Optimization</TabsTrigger>
                            <TabsTrigger value="notifications">Notifications</TabsTrigger>
                            <TabsTrigger value="handoff">Handoff</TabsTrigger>
                        </TabsList>

                        {/* Overview Tab */}
                        <TabsContent value="overview" className="space-y-6 mt-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Platform-Specific Rendering</CardTitle>
                                    <CardDescription>
                                        Different content based on device type
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <PlatformSpecific
                                        mobile={
                                            <Alert>
                                                <Smartphone className="h-4 w-4" />
                                                <AlertDescription>
                                                    You're viewing the mobile-optimized version with touch-friendly controls and compact layout.
                                                </AlertDescription>
                                            </Alert>
                                        }
                                        tablet={
                                            <Alert>
                                                <Tablet className="h-4 w-4" />
                                                <AlertDescription>
                                                    You're viewing the tablet-optimized version with balanced layout and hybrid interactions.
                                                </AlertDescription>
                                            </Alert>
                                        }
                                        desktop={
                                            <Alert>
                                                <Monitor className="h-4 w-4" />
                                                <AlertDescription>
                                                    You're viewing the desktop version with full sidebar navigation and hover interactions.
                                                </AlertDescription>
                                            </Alert>
                                        }
                                        fallback={
                                            <Alert>
                                                <AlertDescription>
                                                    Platform-specific content will appear here based on your device.
                                                </AlertDescription>
                                            </Alert>
                                        }
                                    />
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Interaction Patterns</CardTitle>
                                    <CardDescription>
                                        Optimized interaction methods for your platform
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        {Object.entries(interactionPatterns).map(([action, method]) => (
                                            <div key={action} className="flex justify-between p-2 bg-gray-50 rounded">
                                                <span className="capitalize">{action.replace(/([A-Z])/g, ' $1')}:</span>
                                                <span className="font-medium capitalize">{method}</span>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            <ResponsiveComponent>
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Responsive Component</CardTitle>
                                        <CardDescription>
                                            This component adapts its layout based on screen size
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid gap-4 responsive-grid">
                                            <div className="p-4 bg-blue-50 rounded-lg">
                                                <h4 className="font-medium">Feature 1</h4>
                                                <PlatformText size="sm" className="text-gray-600">
                                                    Adapts to your screen size and platform
                                                </PlatformText>
                                            </div>
                                            <div className="p-4 bg-green-50 rounded-lg">
                                                <h4 className="font-medium">Feature 2</h4>
                                                <PlatformText size="sm" className="text-gray-600">
                                                    Optimized for your device capabilities
                                                </PlatformText>
                                            </div>
                                            <div className="p-4 bg-purple-50 rounded-lg">
                                                <h4 className="font-medium">Feature 3</h4>
                                                <PlatformText size="sm" className="text-gray-600">
                                                    Consistent experience across platforms
                                                </PlatformText>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </ResponsiveComponent>
                        </TabsContent>

                        {/* Optimization Tab */}
                        <TabsContent value="optimization" className="space-y-6 mt-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Platform Optimizations</CardTitle>
                                    <CardDescription>
                                        Automatic optimizations applied to your platform
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-3">
                                                <h4 className="font-medium">Performance</h4>
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <Label htmlFor="animations">Animations</Label>
                                                        <Switch
                                                            id="animations"
                                                            checked={preferences.animationsEnabled}
                                                            onCheckedChange={(checked) => updatePreference('animationsEnabled', checked)}
                                                        />
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <Label htmlFor="preload">Preload Content</Label>
                                                        <Switch
                                                            id="preload"
                                                            checked={preferences.preloadContent}
                                                            onCheckedChange={(checked) => updatePreference('preloadContent', checked)}
                                                        />
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <Label htmlFor="imageQuality">Image Quality</Label>
                                                        <select
                                                            value={preferences.imageQuality}
                                                            onChange={(e) => updatePreference('imageQuality', e.target.value as any)}
                                                            className="border rounded px-2 py-1 text-sm"
                                                        >
                                                            <option value="low">Low</option>
                                                            <option value="medium">Medium</option>
                                                            <option value="high">High</option>
                                                            <option value="auto">Auto</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <h4 className="font-medium">Accessibility</h4>
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <Label htmlFor="reducedMotion">Reduced Motion</Label>
                                                        <Switch
                                                            id="reducedMotion"
                                                            checked={preferences.reducedMotion}
                                                            onCheckedChange={(checked) => updatePreference('reducedMotion', checked)}
                                                        />
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <Label htmlFor="highContrast">High Contrast</Label>
                                                        <Switch
                                                            id="highContrast"
                                                            checked={preferences.highContrast}
                                                            onCheckedChange={(checked) => updatePreference('highContrast', checked)}
                                                        />
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <Label htmlFor="largeText">Large Text</Label>
                                                        <Switch
                                                            id="largeText"
                                                            checked={preferences.largeText}
                                                            onCheckedChange={(checked) => updatePreference('largeText', checked)}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-4 border-t">
                                            <h4 className="font-medium mb-3">Platform-Optimized Image</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <PlatformImage
                                                    src="https://picsum.photos/300/200?random=1"
                                                    alt="Sample image"
                                                    quality="auto"
                                                    className="rounded-lg"
                                                />
                                                <PlatformImage
                                                    src="https://picsum.photos/300/200?random=2"
                                                    alt="Sample image"
                                                    quality="medium"
                                                    className="rounded-lg"
                                                />
                                                <PlatformImage
                                                    src="https://picsum.photos/300/200?random=3"
                                                    alt="Sample image"
                                                    quality="high"
                                                    className="rounded-lg"
                                                />
                                            </div>
                                            <p className="text-sm text-gray-600 mt-2">
                                                Images automatically optimize based on your device and network conditions
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Notifications Tab */}
                        <TabsContent value="notifications" className="space-y-6 mt-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Cross-Platform Notifications</CardTitle>
                                    <CardDescription>
                                        Unified notification system across all devices
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <h4 className="font-medium mb-2">Notification Status</h4>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between">
                                                    <span>Permission:</span>
                                                    <Badge variant={notificationState.permission === 'granted' ? 'default' : 'destructive'}>
                                                        {notificationState.permission}
                                                    </Badge>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>Supported:</span>
                                                    <span>{notificationState.isSupported ? 'Yes' : 'No'}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>Enabled:</span>
                                                    <span>{notificationState.isEnabled ? 'Yes' : 'No'}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>Active:</span>
                                                    <span>{notificationState.activeNotifications.length}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <h4 className="font-medium mb-2">Test Notifications</h4>
                                            <div className="space-y-2">
                                                {notificationState.permission !== 'granted' && (
                                                    <Button
                                                        onClick={requestPermission}
                                                        className="w-full"
                                                        size="sm"
                                                    >
                                                        <Bell className="h-4 w-4 mr-2" />
                                                        Request Permission
                                                    </Button>
                                                )}

                                                <Button
                                                    onClick={handleTestNotification}
                                                    variant="outline"
                                                    className="w-full"
                                                    size="sm"
                                                    disabled={!notificationState.isEnabled}
                                                >
                                                    Test Notification
                                                </Button>

                                                <Button
                                                    onClick={handleRideNotification}
                                                    variant="outline"
                                                    className="w-full"
                                                    size="sm"
                                                    disabled={!notificationState.isEnabled}
                                                >
                                                    Test Ride Notification
                                                </Button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t">
                                        <h4 className="font-medium mb-2">Notification History</h4>
                                        <div className="space-y-2 max-h-48 overflow-y-auto">
                                            {notificationState.notificationHistory.length === 0 ? (
                                                <p className="text-sm text-gray-500 text-center py-4">
                                                    No notifications yet. Test the notification system above.
                                                </p>
                                            ) : (
                                                notificationState.notificationHistory.slice(0, 5).map((notification) => (
                                                    <div key={notification.id} className="p-2 bg-gray-50 rounded text-sm">
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <p className="font-medium">{notification.title}</p>
                                                                <p className="text-gray-600">{notification.body}</p>
                                                            </div>
                                                            <Badge variant="outline" className="text-xs">
                                                                {notification.category}
                                                            </Badge>
                                                        </div>
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            {new Date(notification.timestamp).toLocaleTimeString()}
                                                        </p>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Handoff Tab */}
                        <TabsContent value="handoff" className="space-y-6 mt-6">
                            <HandoffManager
                                userId={DEMO_USER_ID}
                                currentPath={window.location.pathname}
                                currentState={{ activeTab, preferences }}
                                onHandoffComplete={(deviceId) => {
                                    console.log('Handoff completed to:', deviceId);
                                }}
                                onHandoffReceived={handleHandoffReceived}
                            />
                        </TabsContent>
                    </Tabs>
                </PlatformSpacing>

                {/* Handoff Receiver */}
                <HandoffReceiver onHandoffReceived={handleHandoffReceived} />
            </UnifiedLayout>
        </PlatformOptimizer>
    );
}