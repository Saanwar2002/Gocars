'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { Button } from './button';
import { AdvancedDashboardWidget, MetricWidget, ChartWidget, StatusWidget } from './advanced-dashboard-widget';
import { InteractiveChartAdvanced, LineChart, BarChart, AreaChart } from './interactive-chart-advanced';
import { EnhancedModal, ConfirmModal, AlertModal, LoadingModal } from './enhanced-modal';
import { ModernNavigation, Breadcrumbs } from './modern-navigation';
import { GoCarsLogo } from '@/components/brand/GoCarsLogo';
import {
    TrendingUp,
    Users,
    Car,
    DollarSign,
    Activity,
    BarChart3,
    PieChart,
    LineChart as LineChartIcon,
    Zap,
    Shield,
    Settings,
    Home,
    Dashboard,
    Analytics,
    Reports,
    User,
    Bell,
    Search,
    Calendar,
    MapPin,
    Clock,
    Star,
    Award,
    Target
} from 'lucide-react';

export function AdvancedComponentsShowcase() {
    const [showModal, setShowModal] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showAlertModal, setShowAlertModal] = useState(false);
    const [showLoadingModal, setShowLoadingModal] = useState(false);
    const [modalType, setModalType] = useState<'default' | 'success' | 'warning' | 'error'>('default');

    // Sample data for charts
    const sampleChartData = [
        { x: 0, y: 10, label: 'Jan', metadata: { rides: 150, revenue: 2500 } },
        { x: 1, y: 25, label: 'Feb', metadata: { rides: 280, revenue: 4200 } },
        { x: 2, y: 15, label: 'Mar', metadata: { rides: 220, revenue: 3300 } },
        { x: 3, y: 35, label: 'Apr', metadata: { rides: 380, revenue: 5700 } },
        { x: 4, y: 45, label: 'May', metadata: { rides: 450, revenue: 6800 } },
        { x: 5, y: 30, label: 'Jun', metadata: { rides: 320, revenue: 4800 } },
        { x: 6, y: 55, label: 'Jul', metadata: { rides: 520, revenue: 7800 } },
    ];

    // Sample navigation items
    const navigationItems = [
        {
            id: 'dashboard',
            label: 'Dashboard',
            href: '/dashboard',
            icon: <Dashboard className="h-4 w-4" />,
        },
        {
            id: 'analytics',
            label: 'Analytics',
            icon: <Analytics className="h-4 w-4" />,
            badge: { text: 'New', variant: 'success' as const },
            children: [
                {
                    id: 'rides',
                    label: 'Ride Analytics',
                    href: '/analytics/rides',
                    icon: <Car className="h-4 w-4" />,
                },
                {
                    id: 'revenue',
                    label: 'Revenue Reports',
                    href: '/analytics/revenue',
                    icon: <DollarSign className="h-4 w-4" />,
                },
            ],
        },
        {
            id: 'reports',
            label: 'Reports',
            href: '/reports',
            icon: <Reports className="h-4 w-4" />,
        },
        {
            id: 'settings',
            label: 'Settings',
            href: '/settings',
            icon: <Settings className="h-4 w-4" />,
        },
    ];

    const handleModalOpen = (type: typeof modalType) => {
        setModalType(type);
        setShowModal(true);
    };

    const handleLoadingDemo = () => {
        setShowLoadingModal(true);
        setTimeout(() => setShowLoadingModal(false), 3000);
    };

    return (
        <div className="space-y-8 p-6">
            <div className="text-center space-y-2">
                <h1 className="text-4xl font-bold font-display text-brand-secondary-900">
                    Advanced UI Components
                </h1>
                <p className="text-lg text-brand-secondary-600">
                    Interactive widgets, charts, modals, and navigation components
                </p>
            </div>

            {/* Modern Navigation */}
            <Card variant="elevated">
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <Shield className="h-5 w-5" />
                        <span>Modern Navigation</span>
                    </CardTitle>
                    <CardDescription>
                        Responsive navigation with breadcrumbs, search, and user menu
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="border border-brand-secondary-200 rounded-lg overflow-hidden">
                        <ModernNavigation
                            items={navigationItems}
                            logo={<GoCarsLogo size="sm" />}
                            userName="John Doe"
                            notificationCount={5}
                            showBreadcrumbs
                            showSearch
                            showNotifications
                            showUserMenu
                            onSearch={(query) => console.log('Search:', query)}
                            onNotificationClick={() => console.log('Notifications clicked')}
                            onLogout={() => console.log('Logout clicked')}
                        />
                    </div>

                    {/* Standalone Breadcrumbs */}
                    <div className="mt-6 p-4 bg-brand-secondary-50 rounded-lg">
                        <h3 className="text-sm font-medium text-brand-secondary-900 mb-2">Standalone Breadcrumbs</h3>
                        <Breadcrumbs
                            items={[
                                { label: 'Home', href: '/', icon: <Home className="h-4 w-4" /> },
                                { label: 'Dashboard', href: '/dashboard', icon: <Dashboard className="h-4 w-4" /> },
                                { label: 'Analytics', href: '/analytics', icon: <Analytics className="h-4 w-4" /> },
                                { label: 'Ride Reports' },
                            ]}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Advanced Dashboard Widgets */}
            <Card variant="elevated">
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <Activity className="h-5 w-5" />
                        <span>Advanced Dashboard Widgets</span>
                    </CardTitle>
                    <CardDescription>
                        Interactive widgets with real-time updates, actions, and animations
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Metric Widget */}
                        <MetricWidget
                            title="Total Rides"
                            description="Rides completed today"
                            value="1,234"
                            previousValue="1,156"
                            trend="up"
                            trendPercentage={6.7}
                            status="success"
                            icon={<Car className="h-5 w-5 text-brand-primary-500" />}
                            refreshable
                            expandable
                            downloadable
                            onRefresh={() => console.log('Refreshing rides data')}
                        />

                        {/* Status Widget with Real-time */}
                        <StatusWidget
                            title="Active Drivers"
                            description="Currently online"
                            value="89"
                            status="info"
                            realTimeUpdate
                            updateInterval={3000}
                            icon={<Users className="h-5 w-5 text-success-500" />}
                            refreshable
                            hideable
                        />

                        {/* Revenue Widget */}
                        <AdvancedDashboardWidget
                            title="Revenue"
                            description="Today's earnings"
                            value="$12,450"
                            previousValue="$11,200"
                            trend="up"
                            trendPercentage={11.2}
                            status="success"
                            icon={<DollarSign className="h-5 w-5 text-success-500" />}
                            refreshable
                            expandable
                            shareable
                            onRefresh={() => console.log('Refreshing revenue data')}
                        >
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-brand-secondary-600">Cash</span>
                                    <span className="font-medium">$8,200</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-brand-secondary-600">Card</span>
                                    <span className="font-medium">$4,250</span>
                                </div>
                            </div>
                        </AdvancedDashboardWidget>

                        {/* Chart Widget */}
                        <ChartWidget
                            title="Performance"
                            description="Weekly overview"
                            value="94%"
                            trend="up"
                            trendPercentage={2.1}
                            icon={<TrendingUp className="h-5 w-5 text-brand-primary-500" />}
                            expandable
                            downloadable
                        >
                            <div className="h-32 bg-gradient-to-r from-brand-primary-50 to-brand-primary-100 rounded-lg flex items-center justify-center">
                                <BarChart3 className="h-8 w-8 text-brand-primary-400" />
                            </div>
                        </ChartWidget>

                        {/* Loading Widget */}
                        <AdvancedDashboardWidget
                            title="System Status"
                            description="Checking system health"
                            value="Loading..."
                            loading
                            icon={<Shield className="h-5 w-5" />}
                        />

                        {/* Expandable Widget */}
                        <AdvancedDashboardWidget
                            title="Trip Analytics"
                            description="Detailed trip insights"
                            value="2,456"
                            trend="up"
                            trendPercentage={8.3}
                            icon={<Target className="h-5 w-5 text-brand-primary-500" />}
                            expandable
                            refreshable
                        >
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="space-y-1">
                                    <div className="text-brand-secondary-600">Avg Distance</div>
                                    <div className="font-medium">12.4 km</div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-brand-secondary-600">Avg Duration</div>
                                    <div className="font-medium">18 min</div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-brand-secondary-600">Rating</div>
                                    <div className="font-medium flex items-center">
                                        4.8 <Star className="h-3 w-3 text-warning-500 ml-1" />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-brand-secondary-600">Completion</div>
                                    <div className="font-medium">98.2%</div>
                                </div>
                            </div>
                        </AdvancedDashboardWidget>
                    </div>
                </CardContent>
            </Card>

            {/* Interactive Charts */}
            <Card variant="elevated">
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <BarChart3 className="h-5 w-5" />
                        <span>Interactive Charts</span>
                    </CardTitle>
                    <CardDescription>
                        Charts with tooltips, zoom, and real-time updates
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Line Chart */}
                        <LineChart
                            data={sampleChartData}
                            title="Ride Trends"
                            description="Monthly ride statistics"
                            showTooltip
                            showZoom
                            showGrid
                            showLegend
                            animated
                            onDataPointClick={(point, index) =>
                                console.log('Clicked point:', point, 'at index:', index)
                            }
                        />

                        {/* Bar Chart */}
                        <BarChart
                            data={sampleChartData}
                            title="Revenue by Month"
                            description="Monthly revenue breakdown"
                            showTooltip
                            showZoom
                            colors={['#22c55e', '#eab308', '#ef4444', '#8b5cf6', '#f97316']}
                            onDownload={() => console.log('Downloading chart')}
                        />

                        {/* Area Chart */}
                        <AreaChart
                            data={sampleChartData}
                            title="Driver Activity"
                            description="Active drivers over time"
                            showTooltip
                            showGrid
                            realTime
                            updateInterval={5000}
                            colors={['#0ea5e9']}
                        />

                        {/* Interactive Chart with Custom Features */}
                        <InteractiveChartAdvanced
                            data={sampleChartData}
                            type="line"
                            title="Custom Chart"
                            description="Fully customizable chart"
                            showTooltip
                            showZoom
                            showGrid
                            showLegend
                            animated
                            width={400}
                            height={300}
                            colors={['#0ea5e9', '#22c55e', '#eab308']}
                            onDataPointClick={(point, index) =>
                                console.log('Custom chart clicked:', point, index)
                            }
                            onZoom={(level) => console.log('Zoom level:', level)}
                            onDownload={() => console.log('Custom chart download')}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Enhanced Modals */}
            <Card variant="elevated">
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <Zap className="h-5 w-5" />
                        <span>Enhanced Modals</span>
                    </CardTitle>
                    <CardDescription>
                        Advanced modals with animations, dragging, and variants
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Button
                            onClick={() => handleModalOpen('default')}
                            variant="outline"
                        >
                            Default Modal
                        </Button>

                        <Button
                            onClick={() => handleModalOpen('success')}
                            variant="outline"
                        >
                            Success Modal
                        </Button>

                        <Button
                            onClick={() => handleModalOpen('warning')}
                            variant="outline"
                        >
                            Warning Modal
                        </Button>

                        <Button
                            onClick={() => handleModalOpen('error')}
                            variant="outline"
                        >
                            Error Modal
                        </Button>

                        <Button
                            onClick={() => setShowConfirmModal(true)}
                            variant="outline"
                        >
                            Confirm Modal
                        </Button>

                        <Button
                            onClick={() => setShowAlertModal(true)}
                            variant="outline"
                        >
                            Alert Modal
                        </Button>

                        <Button
                            onClick={handleLoadingDemo}
                            variant="outline"
                        >
                            Loading Modal
                        </Button>

                        <Button
                            onClick={() => handleModalOpen('default')}
                            variant="outline"
                        >
                            Draggable Modal
                        </Button>
                    </div>

                    {/* Modal Examples */}
                    <EnhancedModal
                        isOpen={showModal}
                        onClose={() => setShowModal(false)}
                        title="Enhanced Modal"
                        description="This is an advanced modal with multiple features"
                        variant={modalType}
                        size="lg"
                        draggable
                        fullscreenable
                        showFooter
                        onConfirm={() => {
                            console.log('Modal confirmed');
                            setShowModal(false);
                        }}
                        onCancel={() => setShowModal(false)}
                    >
                        <div className="space-y-4">
                            <p className="text-brand-secondary-600">
                                This modal demonstrates advanced features including:
                            </p>
                            <ul className="list-disc list-inside space-y-1 text-sm text-brand-secondary-600">
                                <li>Draggable functionality</li>
                                <li>Fullscreen capability</li>
                                <li>Multiple size options</li>
                                <li>Various animation types</li>
                                <li>Custom backdrop styles</li>
                                <li>Loading states</li>
                            </ul>
                        </div>
                    </EnhancedModal>

                    <ConfirmModal
                        isOpen={showConfirmModal}
                        onClose={() => setShowConfirmModal(false)}
                        title="Confirm Action"
                        description="Are you sure you want to delete this item?"
                        onConfirm={() => {
                            console.log('Action confirmed');
                            setShowConfirmModal(false);
                        }}
                        onCancel={() => setShowConfirmModal(false)}
                    >
                        <p className="text-brand-secondary-600">
                            This action cannot be undone. The item will be permanently deleted.
                        </p>
                    </ConfirmModal>

                    <AlertModal
                        isOpen={showAlertModal}
                        onClose={() => setShowAlertModal(false)}
                        title="Important Notice"
                        variant="info"
                    >
                        <p className="text-brand-secondary-600">
                            Your session will expire in 5 minutes. Please save your work.
                        </p>
                    </AlertModal>

                    <LoadingModal
                        isOpen={showLoadingModal}
                        onClose={() => setShowLoadingModal(false)}
                        title="Processing Request"
                        description="Please wait while we process your request..."
                    />
                </CardContent>
            </Card>
        </div>
    );
}