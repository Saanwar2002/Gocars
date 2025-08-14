'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { Button } from './button';
import { Badge } from './badge';
import {
    ResponsiveGrid,
    ResponsiveContainer,
    ResponsiveStack,
    ResponsiveShowHide,
    ResponsiveText
} from './responsive-grid-system';
import {
    MobileDrawer,
    MobileCardList,
    MobileTabs,
    MobileActionSheet,
    MobileFAB,
    MobilePullToRefresh
} from './mobile-optimized';
import {
    TabletSplitView,
    TabletAdaptiveGrid,
    TabletCardGrid,
    TabletSidebar,
    TabletMultiPanel
} from './tablet-optimized';
import {
    DesktopWindow,
    DesktopLayoutManager,
    DesktopMultiMonitor,
    DesktopContextMenu,
    DesktopTaskbar
} from './desktop-optimized';
import {
    Smartphone,
    Tablet,
    Monitor,
    Grid3X3,
    Layout,
    Layers,
    Maximize2,
    Menu,
    Eye,
    EyeOff,
    Type,
    Columns,
    MoreHorizontal,
    Settings,
    Home,
    User,
    Bell,
    Search,
    Car,
    MapPin,
    Clock,
    Star,
    Plus,
    Download,
    Share,
    Edit,
    Trash2
} from 'lucide-react';

export function ResponsiveShowcase() {
    const [showMobileDrawer, setShowMobileDrawer] = useState(false);
    const [showActionSheet, setShowActionSheet] = useState(false);
    const [showContextMenu, setShowContextMenu] = useState(false);
    const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
    const [refreshing, setRefreshing] = useState(false);
    const [currentDevice, setCurrentDevice] = useState<'mobile' | 'tablet' | 'desktop'>('mobile');

    // Sample data
    const sampleItems = [
        {
            id: '1',
            title: 'Downtown Ride',
            description: 'Trip from Main St to Central Plaza',
            image: '/api/placeholder/60/60',
            badge: 'Completed',
            metadata: { duration: '15 min', fare: '$12.50', rating: '4.8' }
        },
        {
            id: '2',
            title: 'Airport Transfer',
            description: 'Scheduled pickup to International Airport',
            image: '/api/placeholder/60/60',
            badge: 'Scheduled',
            metadata: { duration: '45 min', fare: '$35.00', rating: '5.0' }
        },
        {
            id: '3',
            title: 'Shopping Mall',
            description: 'Quick trip to Westfield Shopping Center',
            image: '/api/placeholder/60/60',
            badge: 'In Progress',
            metadata: { duration: '20 min', fare: '$18.75', rating: '4.9' }
        },
    ];

    const sidebarItems = [
        {
            id: 'dashboard',
            label: 'Dashboard',
            icon: <Home className="h-4 w-4" />,
            active: true,
        },
        {
            id: 'rides',
            label: 'Rides',
            icon: <Car className="h-4 w-4" />,
            children: [
                { id: 'active', label: 'Active Rides', active: false },
                { id: 'history', label: 'Ride History', active: false },
            ],
        },
        {
            id: 'settings',
            label: 'Settings',
            icon: <Settings className="h-4 w-4" />,
        },
    ];

    const tabletPanels = [
        {
            id: 'sidebar',
            title: 'Navigation',
            width: 'sm' as const,
            collapsible: true,
            content: (
                <div className="p-4">
                    <TabletSidebar items={sidebarItems} />
                </div>
            ),
        },
        {
            id: 'main',
            title: 'Main Content',
            content: (
                <div className="p-6">
                    <h2 className="text-2xl font-bold mb-4">Main Content Area</h2>
                    <TabletCardGrid
                        items={sampleItems}
                        viewMode="grid"
                        onItemClick={(item) => console.log('Item clicked:', item)}
                    />
                </div>
            ),
        },
        {
            id: 'details',
            title: 'Details Panel',
            width: 'md' as const,
            collapsible: true,
            content: (
                <div className="p-4">
                    <h3 className="font-semibold mb-4">Details</h3>
                    <div className="space-y-3">
                        <div className="p-3 bg-brand-secondary-50 rounded-lg">
                            <div className="text-sm font-medium">Selected Item</div>
                            <div className="text-xs text-brand-secondary-600 mt-1">
                                Click an item to see details here
                            </div>
                        </div>
                    </div>
                </div>
            ),
        },
    ];

    const handleRefresh = async () => {
        setRefreshing(true);
        await new Promise(resolve => setTimeout(resolve, 2000));
        setRefreshing(false);
    };

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        setContextMenuPosition({ x: e.clientX, y: e.clientY });
        setShowContextMenu(true);
    };

    return (
        <div className="space-y-8 p-6">
            <div className="text-center space-y-2">
                <h1 className="text-4xl font-bold font-display text-brand-secondary-900">
                    Responsive Design System
                </h1>
                <p className="text-lg text-brand-secondary-600">
                    Adaptive layouts optimized for mobile, tablet, and desktop experiences
                </p>
            </div>

            {/* Device Selector */}
            <Card variant="elevated">
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <Layout className="h-5 w-5" />
                        <span>Device Preview</span>
                    </CardTitle>
                    <CardDescription>
                        Switch between different device layouts to see responsive behavior
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center space-x-2 mb-6">
                        <Button
                            variant={currentDevice === 'mobile' ? 'default' : 'outline'}
                            onClick={() => setCurrentDevice('mobile')}
                            className="flex items-center space-x-2"
                        >
                            <Smartphone className="h-4 w-4" />
                            <span>Mobile</span>
                        </Button>
                        <Button
                            variant={currentDevice === 'tablet' ? 'default' : 'outline'}
                            onClick={() => setCurrentDevice('tablet')}
                            className="flex items-center space-x-2"
                        >
                            <Tablet className="h-4 w-4" />
                            <span>Tablet</span>
                        </Button>
                        <Button
                            variant={currentDevice === 'desktop' ? 'default' : 'outline'}
                            onClick={() => setCurrentDevice('desktop')}
                            className="flex items-center space-x-2"
                        >
                            <Monitor className="h-4 w-4" />
                            <span>Desktop</span>
                        </Button>
                    </div>

                    {/* Device-specific layouts */}
                    <div className="border border-brand-secondary-200 rounded-lg overflow-hidden">
                        {currentDevice === 'mobile' && (
                            <div className="max-w-sm mx-auto bg-white">
                                <MobilePullToRefresh onRefresh={handleRefresh} refreshing={refreshing}>
                                    <div className="p-4">
                                        <div className="flex items-center justify-between mb-4">
                                            <h2 className="text-lg font-semibold">Mobile Layout</h2>
                                            <Button
                                                variant="ghost"
                                                size="icon-sm"
                                                onClick={() => setShowMobileDrawer(true)}
                                            >
                                                <Menu className="h-4 w-4" />
                                            </Button>
                                        </div>

                                        <MobileTabs
                                            tabs={[
                                                {
                                                    id: 'rides',
                                                    label: 'Rides',
                                                    icon: <Car className="h-4 w-4" />,
                                                    badge: 3,
                                                    content: (
                                                        <div className="p-4">
                                                            <MobileCardList
                                                                items={sampleItems}
                                                                onItemClick={(item) => console.log('Mobile item:', item)}
                                                                onItemAction={(item, action) => console.log('Action:', action, item)}
                                                            />
                                                        </div>
                                                    ),
                                                },
                                                {
                                                    id: 'map',
                                                    label: 'Map',
                                                    icon: <MapPin className="h-4 w-4" />,
                                                    content: (
                                                        <div className="p-4 h-64 bg-brand-secondary-100 rounded-lg flex items-center justify-center">
                                                            <div className="text-center">
                                                                <MapPin className="h-8 w-8 mx-auto mb-2 text-brand-secondary-400" />
                                                                <p className="text-sm text-brand-secondary-600">Map View</p>
                                                            </div>
                                                        </div>
                                                    ),
                                                },
                                                {
                                                    id: 'profile',
                                                    label: 'Profile',
                                                    icon: <User className="h-4 w-4" />,
                                                    content: (
                                                        <div className="p-4">
                                                            <div className="text-center">
                                                                <div className="w-16 h-16 bg-brand-primary-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                                                                    <User className="h-8 w-8 text-brand-primary-600" />
                                                                </div>
                                                                <h3 className="font-semibold">John Doe</h3>
                                                                <p className="text-sm text-brand-secondary-600">Premium Member</p>
                                                            </div>
                                                        </div>
                                                    ),
                                                },
                                            ]}
                                        />
                                    </div>
                                </MobilePullToRefresh>

                                <MobileFAB
                                    icon={<Plus className="h-5 w-5" />}
                                    onClick={() => setShowActionSheet(true)}
                                />
                            </div>
                        )}

                        {currentDevice === 'tablet' && (
                            <div className="h-96 bg-white">
                                <TabletMultiPanel panels={tabletPanels} />
                            </div>
                        )}

                        {currentDevice === 'desktop' && (
                            <div className="h-96 bg-brand-secondary-50 relative" onContextMenu={handleContextMenu}>
                                <DesktopLayoutManager layout="free">
                                    <DesktopWindow
                                        id="window1"
                                        title="Main Dashboard"
                                        initialPosition={{ x: 50, y: 50 }}
                                        initialSize={{ width: 400, height: 300 }}
                                    >
                                        <div className="p-4">
                                            <h3 className="font-semibold mb-4">Desktop Window</h3>
                                            <div className="grid grid-cols-2 gap-4">
                                                {sampleItems.slice(0, 2).map((item) => (
                                                    <Card key={item.id} variant="default">
                                                        <CardContent className="p-3">
                                                            <h4 className="font-medium text-sm">{item.title}</h4>
                                                            <p className="text-xs text-brand-secondary-600 mt-1">
                                                                {item.description}
                                                            </p>
                                                        </CardContent>
                                                    </Card>
                                                ))}
                                            </div>
                                        </div>
                                    </DesktopWindow>

                                    <DesktopWindow
                                        id="window2"
                                        title="Settings Panel"
                                        initialPosition={{ x: 300, y: 100 }}
                                        initialSize={{ width: 300, height: 250 }}
                                    >
                                        <div className="p-4">
                                            <h3 className="font-semibold mb-4">Settings</h3>
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm">Notifications</span>
                                                    <Badge variant="success" size="sm">On</Badge>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm">Auto-refresh</span>
                                                    <Badge variant="info" size="sm">5s</Badge>
                                                </div>
                                            </div>
                                        </div>
                                    </DesktopWindow>
                                </DesktopLayoutManager>

                                <DesktopTaskbar
                                    windows={[
                                        { id: 'window1', title: 'Main Dashboard', active: true, icon: <Home className="h-4 w-4" /> },
                                        { id: 'window2', title: 'Settings Panel', icon: <Settings className="h-4 w-4" /> },
                                    ]}
                                    onWindowClick={(id) => console.log('Window clicked:', id)}
                                    onWindowClose={(id) => console.log('Window closed:', id)}
                                />
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Responsive Grid System */}
            <Card variant="elevated">
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <Grid3X3 className="h-5 w-5" />
                        <span>Responsive Grid System</span>
                    </CardTitle>
                    <CardDescription>
                        Adaptive grids that change layout based on screen size
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer size="full" className="space-y-8">
                        {/* Basic Responsive Grid */}
                        <div>
                            <h3 className="text-lg font-semibold mb-4">Basic Responsive Grid</h3>
                            <ResponsiveGrid
                                cols={{ xs: 1, sm: 2, md: 3, lg: 4, xl: 5 }}
                                gap={{ xs: 4, md: 6 }}
                            >
                                {Array.from({ length: 10 }).map((_, index) => (
                                    <Card key={index} variant="default">
                                        <CardContent className="p-4 text-center">
                                            <div className="w-8 h-8 bg-brand-primary-100 rounded-full mx-auto mb-2 flex items-center justify-center">
                                                <span className="text-sm font-medium text-brand-primary-600">
                                                    {index + 1}
                                                </span>
                                            </div>
                                            <p className="text-sm">Grid Item {index + 1}</p>
                                        </CardContent>
                                    </Card>
                                ))}
                            </ResponsiveGrid>
                        </div>

                        {/* Responsive Stack */}
                        <div>
                            <h3 className="text-lg font-semibold mb-4">Responsive Stack</h3>
                            <ResponsiveStack
                                direction={{ xs: 'col', md: 'row' }}
                                gap={{ xs: 4, md: 6 }}
                                align={{ xs: 'stretch', md: 'center' }}
                                justify={{ xs: 'start', md: 'between' }}
                            >
                                <Card variant="default" className="flex-1">
                                    <CardContent className="p-4">
                                        <h4 className="font-medium mb-2">Stack Item 1</h4>
                                        <p className="text-sm text-brand-secondary-600">
                                            This stacks vertically on mobile and horizontally on desktop
                                        </p>
                                    </CardContent>
                                </Card>
                                <Card variant="default" className="flex-1">
                                    <CardContent className="p-4">
                                        <h4 className="font-medium mb-2">Stack Item 2</h4>
                                        <p className="text-sm text-brand-secondary-600">
                                            Responsive spacing and alignment
                                        </p>
                                    </CardContent>
                                </Card>
                                <Card variant="default" className="flex-1">
                                    <CardContent className="p-4">
                                        <h4 className="font-medium mb-2">Stack Item 3</h4>
                                        <p className="text-sm text-brand-secondary-600">
                                            Adapts to screen size automatically
                                        </p>
                                    </CardContent>
                                </Card>
                            </ResponsiveStack>
                        </div>

                        {/* Responsive Typography */}
                        <div>
                            <h3 className="text-lg font-semibold mb-4">Responsive Typography</h3>
                            <div className="space-y-4">
                                <ResponsiveText
                                    as="h1"
                                    size={{ xs: '2xl', md: '4xl', lg: '6xl' }}
                                    weight={{ xs: 'semibold', md: 'bold' }}
                                    align={{ xs: 'center', md: 'left' }}
                                    className="text-brand-secondary-900"
                                >
                                    Responsive Heading
                                </ResponsiveText>
                                <ResponsiveText
                                    as="p"
                                    size={{ xs: 'sm', md: 'base', lg: 'lg' }}
                                    align={{ xs: 'center', md: 'left' }}
                                    className="text-brand-secondary-600"
                                >
                                    This text scales with screen size and changes alignment from center on mobile to left on desktop.
                                </ResponsiveText>
                            </div>
                        </div>

                        {/* Show/Hide Elements */}
                        <div>
                            <h3 className="text-lg font-semibold mb-4">Responsive Visibility</h3>
                            <div className="space-y-4">
                                <ResponsiveShowHide show={{ md: true }}>
                                    <Card variant="default">
                                        <CardContent className="p-4">
                                            <div className="flex items-center space-x-2">
                                                <Eye className="h-4 w-4 text-brand-primary-500" />
                                                <span className="text-sm">Visible on desktop and tablet only</span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </ResponsiveShowHide>

                                <ResponsiveShowHide hide={{ md: true }}>
                                    <Card variant="default">
                                        <CardContent className="p-4">
                                            <div className="flex items-center space-x-2">
                                                <EyeOff className="h-4 w-4 text-warning-500" />
                                                <span className="text-sm">Hidden on desktop and tablet</span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </ResponsiveShowHide>
                            </div>
                        </div>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Mobile Components */}
            <MobileDrawer
                isOpen={showMobileDrawer}
                onClose={() => setShowMobileDrawer(false)}
                title="Navigation Menu"
                position="left"
                size="md"
            >
                <div className="space-y-4">
                    <div className="flex items-center space-x-3 p-3 bg-brand-secondary-50 rounded-lg">
                        <div className="w-10 h-10 bg-brand-primary-500 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <div className="font-medium">John Doe</div>
                            <div className="text-sm text-brand-secondary-600">Premium Member</div>
                        </div>
                    </div>

                    {sidebarItems.map((item) => (
                        <button
                            key={item.id}
                            className="flex items-center space-x-3 w-full p-3 text-left rounded-lg hover:bg-brand-secondary-100 transition-colors duration-200"
                        >
                            {item.icon}
                            <span>{item.label}</span>
                        </button>
                    ))}
                </div>
            </MobileDrawer>

            <MobileActionSheet
                isOpen={showActionSheet}
                onClose={() => setShowActionSheet(false)}
                title="Quick Actions"
                actions={[
                    {
                        id: 'book',
                        label: 'Book a Ride',
                        icon: <Car className="h-5 w-5" />,
                        onClick: () => console.log('Book ride'),
                    },
                    {
                        id: 'schedule',
                        label: 'Schedule Ride',
                        icon: <Clock className="h-5 w-5" />,
                        onClick: () => console.log('Schedule ride'),
                    },
                    {
                        id: 'favorites',
                        label: 'Favorite Locations',
                        icon: <Star className="h-5 w-5" />,
                        onClick: () => console.log('Favorites'),
                    },
                    {
                        id: 'share',
                        label: 'Share Location',
                        icon: <Share className="h-5 w-5" />,
                        onClick: () => console.log('Share'),
                    },
                ]}
            />

            {/* Desktop Context Menu */}
            {showContextMenu && (
                <DesktopContextMenu
                    position={contextMenuPosition}
                    onClose={() => setShowContextMenu(false)}
                    items={[
                        {
                            id: 'new',
                            label: 'New Window',
                            icon: <Plus className="h-4 w-4" />,
                            shortcut: 'Ctrl+N',
                            onClick: () => console.log('New window'),
                        },
                        {
                            id: 'refresh',
                            label: 'Refresh',
                            icon: <Download className="h-4 w-4" />,
                            shortcut: 'F5',
                            onClick: () => console.log('Refresh'),
                        },
                        { id: 'sep1', label: '', separator: true },
                        {
                            id: 'settings',
                            label: 'Settings',
                            icon: <Settings className="h-4 w-4" />,
                            onClick: () => console.log('Settings'),
                        },
                    ]}
                />
            )}
        </div>
    );
}