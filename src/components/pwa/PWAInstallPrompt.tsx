'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { usePWA } from '@/hooks/usePWA';
import {
    Download, X, Smartphone, Zap, Wifi, Bell,
    CheckCircle, Star, ArrowRight, Settings
} from 'lucide-react';

interface PWAInstallPromptProps {
    onClose?: () => void;
    showOnlyIfInstallable?: boolean;
    variant?: 'banner' | 'modal' | 'card';
}

export function PWAInstallPrompt({
    onClose,
    showOnlyIfInstallable = true,
    variant = 'banner'
}: PWAInstallPromptProps) {
    const {
        isInstallable,
        isInstalled,
        isStandalone,
        installPWA,
        registerServiceWorker,
        requestNotificationPermission
    } = usePWA();

    const [isVisible, setIsVisible] = useState(false);
    const [isInstalling, setIsInstalling] = useState(false);
    const [installStep, setInstallStep] = useState<'prompt' | 'installing' | 'success' | 'features'>('prompt');

    useEffect(() => {
        // Show prompt if installable or if we want to show features for installed app
        if (showOnlyIfInstallable) {
            setIsVisible(isInstallable && !isInstalled);
        } else {
            setIsVisible(!isInstalled || isStandalone);
        }
    }, [isInstallable, isInstalled, isStandalone, showOnlyIfInstallable]);

    useEffect(() => {
        // Register service worker on component mount
        registerServiceWorker();
    }, [registerServiceWorker]);

    const handleInstall = async () => {
        setIsInstalling(true);
        setInstallStep('installing');

        const success = await installPWA();

        if (success) {
            setInstallStep('success');
            setTimeout(() => {
                setInstallStep('features');
            }, 2000);
        } else {
            setIsInstalling(false);
            setInstallStep('prompt');
        }
    };

    const handleClose = () => {
        setIsVisible(false);
        onClose?.();
    };

    const handleEnableNotifications = async () => {
        await requestNotificationPermission();
    };

    if (!isVisible) return null;

    const features = [
        {
            icon: <Zap className="h-5 w-5 text-blue-600" />,
            title: 'Lightning Fast',
            description: 'Instant loading with offline support'
        },
        {
            icon: <Wifi className="h-5 w-5 text-green-600" />,
            title: 'Works Offline',
            description: 'Access your data even without internet'
        },
        {
            icon: <Bell className="h-5 w-5 text-purple-600" />,
            title: 'Push Notifications',
            description: 'Get real-time updates about your rides'
        },
        {
            icon: <Smartphone className="h-5 w-5 text-orange-600" />,
            title: 'Native Experience',
            description: 'App-like experience on your device'
        }
    ];

    if (variant === 'banner') {
        return (
            <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-md">
                <Card className="shadow-lg border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
                    <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <Download className="h-5 w-5 text-blue-600" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-semibold text-gray-900">Install GoCars</h4>
                                    <p className="text-sm text-gray-600 mt-1">
                                        Get the full app experience with offline support
                                    </p>
                                    <div className="flex items-center space-x-2 mt-2">
                                        <Button
                                            size="sm"
                                            onClick={handleInstall}
                                            disabled={isInstalling}
                                            className="bg-blue-600 hover:bg-blue-700"
                                        >
                                            {isInstalling ? 'Installing...' : 'Install'}
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={handleClose}
                                        >
                                            Later
                                        </Button>
                                    </div>
                                </div>
                            </div>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={handleClose}
                                className="p-1"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (variant === 'modal') {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
                <Card className="max-w-md w-full">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <Download className="h-6 w-6 text-blue-600" />
                                <CardTitle>Install GoCars</CardTitle>
                            </div>
                            <Button variant="ghost" size="sm" onClick={handleClose}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                        <CardDescription>
                            Transform your browser experience into a native app
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {installStep === 'prompt' && (
                            <>
                                <div className="grid grid-cols-2 gap-3">
                                    {features.map((feature, index) => (
                                        <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
                                            {feature.icon}
                                            <div>
                                                <p className="text-sm font-medium">{feature.title}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex space-x-2">
                                    <Button
                                        onClick={handleInstall}
                                        disabled={isInstalling}
                                        className="flex-1"
                                    >
                                        <Download className="h-4 w-4 mr-2" />
                                        Install Now
                                    </Button>
                                    <Button variant="outline" onClick={handleClose}>
                                        Maybe Later
                                    </Button>
                                </div>
                            </>
                        )}

                        {installStep === 'installing' && (
                            <div className="text-center py-8">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                                <p className="text-lg font-medium">Installing GoCars...</p>
                                <p className="text-sm text-gray-600">This will only take a moment</p>
                            </div>
                        )}

                        {installStep === 'success' && (
                            <div className="text-center py-8">
                                <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                                <p className="text-lg font-medium text-green-600">Successfully Installed!</p>
                                <p className="text-sm text-gray-600">GoCars is now available on your device</p>
                            </div>
                        )}

                        {installStep === 'features' && (
                            <div className="space-y-4">
                                <div className="text-center">
                                    <Star className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                                    <h3 className="text-lg font-semibold">Welcome to GoCars!</h3>
                                    <p className="text-sm text-gray-600">Enable these features for the best experience</p>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                                        <div className="flex items-center space-x-3">
                                            <Bell className="h-5 w-5 text-blue-600" />
                                            <div>
                                                <p className="font-medium">Push Notifications</p>
                                                <p className="text-sm text-gray-600">Get ride updates instantly</p>
                                            </div>
                                        </div>
                                        <Button size="sm" onClick={handleEnableNotifications}>
                                            Enable
                                        </Button>
                                    </div>

                                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                                        <div className="flex items-center space-x-3">
                                            <Wifi className="h-5 w-5 text-green-600" />
                                            <div>
                                                <p className="font-medium">Offline Mode</p>
                                                <p className="text-sm text-gray-600">Already enabled!</p>
                                            </div>
                                        </div>
                                        <CheckCircle className="h-5 w-5 text-green-600" />
                                    </div>
                                </div>

                                <Button onClick={handleClose} className="w-full">
                                    <ArrowRight className="h-4 w-4 mr-2" />
                                    Start Using GoCars
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Card variant (default)
    return (
        <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <Download className="h-6 w-6 text-blue-600" />
                        <div>
                            <CardTitle>Install GoCars App</CardTitle>
                            <CardDescription>Get the full native app experience</CardDescription>
                        </div>
                    </div>
                    <Badge variant="secondary">PWA</Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {features.map((feature, index) => (
                        <div key={index} className="flex items-start space-x-2">
                            {feature.icon}
                            <div>
                                <p className="text-sm font-medium">{feature.title}</p>
                                <p className="text-xs text-gray-600">{feature.description}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <Alert>
                    <Settings className="h-4 w-4" />
                    <AlertTitle>Progressive Web App</AlertTitle>
                    <AlertDescription>
                        Install GoCars for faster loading, offline access, and push notifications.
                        Works just like a native app!
                    </AlertDescription>
                </Alert>

                <div className="flex space-x-2">
                    <Button
                        onClick={handleInstall}
                        disabled={isInstalling}
                        className="flex-1"
                    >
                        <Download className="h-4 w-4 mr-2" />
                        {isInstalling ? 'Installing...' : 'Install App'}
                    </Button>
                    <Button variant="outline" onClick={handleClose}>
                        Not Now
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}