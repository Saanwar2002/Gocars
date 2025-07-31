'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
    MapPin,
    Users,
    Clock,
    TrendingUp,
    AlertTriangle,
    CheckCircle,
    XCircle,
    RefreshCw,
    Settings,
    Zap,
    Target,
    Activity,
    BarChart3,
    Navigation,
    Car,
    User,
    Phone,
    MessageSquare,
    Shield,
    Gauge,
    Timer,
    Star,
    DollarSign
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    intelligentDispatchService,
    RideRequest,
    DriverAvailability,
    DispatchAssignment,
    DispatchMetrics,
    EmergencyOverride
} from '@/services/intelligentDispatchService';

export default function IntelligentDispatchDashboard() {
    const [activeRides, setActiveRides] = useState<RideRequest[]>([]);
    const [availableDrivers, setAvailableDrivers] = useState<DriverAvailability[]>([]);
    const [pendingRequests, setPendingRequests] = useState<RideRequest[]>([]);
    const [recentAssignments, setRecentAssignments] = useState<DispatchAssignment[]>([]);
    const [metrics, setMetrics] = useState<DispatchMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [autoDispatch, setAutoDispatch] = useState(true);
    const [selectedRide, setSelectedRide] = useState<RideRequest | null>(null);
    const [showEmergencyOverride, setShowEmergencyOverride] = useState(false);

    useEffect(() => {
        loadDashboardData();
        const interval = setInterval(loadDashboardData, 5000); // Refresh every 5 seconds
        return () => clearInterval(interval);
    }, []);

    const loadDashboardData = async () => {
        try {
            setLoading(true);

            // Load all dashboard data
            await Promise.all([
                loadPendingRequests(),
                loadAvailableDrivers(),
                loadActiveRides(),
                loadRecentAssignments(),
                loadMetrics()
            ]);
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadPendingRequests = async () => {
        // Mock data - in real implementation, fetch from Firebase
        const mockRequests: RideRequest[] = [
            {
                id: 'ride-001',
                passengerId: 'passenger-001',
                pickupLocation: { latitude: 40.7128, longitude: -74.0060, address: '123 Main St, NYC' },
                dropoffLocation: { latitude: 40.7589, longitude: -73.9851, address: '456 Broadway, NYC' },
                requestedAt: new Date(Date.now() - 2 * 60 * 1000),
                vehicleType: 'sedan',
                priority: 'normal',
                estimatedFare: 25.50,
                estimatedDuration: 15,
                status: 'pending'
            },
            {
                id: 'ride-002',
                passengerId: 'passenger-002',
                pickupLocation: { latitude: 40.7505, longitude: -73.9934, address: '789 Times Square, NYC' },
                dropoffLocation: { latitude: 40.7831, longitude: -73.9712, address: '321 Central Park, NYC' },
                requestedAt: new Date(Date.now() - 5 * 60 * 1000),
                vehicleType: 'suv',
                priority: 'high',
                estimatedFare: 35.75,
                estimatedDuration: 20,
                status: 'pending'
            }
        ];
        setPendingRequests(mockRequests);
    };

    const loadAvailableDrivers = async () => {
        // Mock data - in real implementation, fetch from Firebase
        const mockDrivers: DriverAvailability[] = [
            {
                driverId: 'driver-001',
                currentLocation: { latitude: 40.7200, longitude: -74.0100 },
                status: 'available',
                vehicleType: 'sedan',
                rating: 4.8,
                acceptanceRate: 95,
                completedRides: 1250,
                workingHours: { start: '06:00', end: '22:00' },
                preferences: { preferredAreas: ['Manhattan'], maxDistance: 15, avoidTolls: false, acceptSharedRides: true, acceptLongDistance: true },
                performance: { averageResponseTime: 45, completionRate: 98, customerRating: 4.8, onTimePerformance: 92, fuelEfficiency: 85, safetyScore: 96 }
            },
            {
                driverId: 'driver-002',
                currentLocation: { latitude: 40.7400, longitude: -73.9900 },
                status: 'available',
                vehicleType: 'suv',
                rating: 4.6,
                acceptanceRate: 88,
                completedRides: 890,
                workingHours: { start: '08:00', end: '20:00' },
                preferences: { preferredAreas: ['Manhattan', 'Brooklyn'], maxDistance: 20, avoidTolls: true, acceptSharedRides: false, acceptLongDistance: true },
                performance: { averageResponseTime: 52, completionRate: 96, customerRating: 4.6, onTimePerformance: 89, fuelEfficiency: 78, safetyScore: 94 }
            }
        ];
        setAvailableDrivers(mockDrivers);
    };

    const loadActiveRides = async () => {
        // Mock data - in real implementation, fetch from Firebase
        const mockActiveRides: RideRequest[] = [
            {
                id: 'ride-003',
                passengerId: 'passenger-003',
                pickupLocation: { latitude: 40.7300, longitude: -74.0050 },
                dropoffLocation: { latitude: 40.7600, longitude: -73.9800 },
                requestedAt: new Date(Date.now() - 10 * 60 * 1000),
                vehicleType: 'sedan',
                priority: 'normal',
                estimatedFare: 28.25,
                estimatedDuration: 18,
                status: 'in_progress',
                assignedDriverId: 'driver-003',
                assignmentScore: 0.92
            }
        ];
        setActiveRides(mockActiveRides);
    };

    const loadRecentAssignments = async () => {
        // Mock data - in real implementation, fetch from Firebase
        const mockAssignments: DispatchAssignment[] = [
            {
                rideId: 'ride-003',
                driverId: 'driver-003',
                assignedAt: new Date(Date.now() - 10 * 60 * 1000),
                score: 0.92,
                factors: {
                    distance: 0.95,
                    driverRating: 0.88,
                    acceptanceRate: 0.92,
                    vehicleMatch: 1.0,
                    availability: 1.0,
                    efficiency: 0.89,
                    passengerPreference: 0.75,
                    trafficConditions: 0.85,
                    surge: 1.0,
                    loyalty: 0.82
                },
                estimatedPickupTime: 180,
                estimatedArrivalTime: new Date(Date.now() - 7 * 60 * 1000),
                confidence: 0.87,
                alternativeDrivers: []
            }
        ];
        setRecentAssignments(mockAssignments);
    };

    const loadMetrics = async () => {
        // Mock data - in real implementation, fetch from service
        const mockMetrics: DispatchMetrics = {
            totalAssignments: 1247,
            successfulAssignments: 1198,
            averageAssignmentTime: 12.5,
            averagePickupTime: 4.2,
            driverUtilization: 78.5,
            passengerSatisfaction: 4.6,
            cancellationRate: 3.9,
            emergencyResponseTime: 45
        };
        setMetrics(mockMetrics);
    };

    const handleManualDispatch = async (rideId: string) => {
        try {
            const ride = pendingRequests.find(r => r.id === rideId);
            if (!ride) return;

            const assignment = await intelligentDispatchService.dispatchRide(ride);
            if (assignment) {
                // Update UI
                setPendingRequests(prev => prev.filter(r => r.id !== rideId));
                setActiveRides(prev => [...prev, { ...ride, status: 'assigned', assignedDriverId: assignment.driverId }]);
                setRecentAssignments(prev => [assignment, ...prev.slice(0, 9)]);
            }
        } catch (error) {
            console.error('Manual dispatch failed:', error);
        }
    };

    const handleEmergencyOverride = async (rideId: string, newDriverId: string, reason: string) => {
        try {
            await intelligentDispatchService.emergencyOverride(
                rideId,
                newDriverId,
                'emergency',
                'dispatcher-001',
                reason
            );

            // Refresh data
            await loadDashboardData();
            setShowEmergencyOverride(false);
        } catch (error) {
            console.error('Emergency override failed:', error);
        }
    };

    if (loading && !metrics) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p>Loading dispatch dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Intelligent Dispatch</h1>
                    <p className="text-gray-600">AI-powered ride assignment and fleet optimization</p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Label htmlFor="auto-dispatch">Auto Dispatch</Label>
                        <input
                            id="auto-dispatch"
                            type="checkbox"
                            checked={autoDispatch}
                            onChange={(e) => setAutoDispatch(e.target.checked)}
                            className="rounded"
                        />
                    </div>
                    <Button onClick={loadDashboardData} variant="outline">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                    </Button>
                    <Button variant="outline">
                        <Settings className="h-4 w-4 mr-2" />
                        Settings
                    </Button>
                </div>
            </div>

            {/* Metrics Cards */}
            {metrics && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Assignment Success</p>
                                    <p className="text-2xl font-bold">
                                        {((metrics.successfulAssignments / metrics.totalAssignments) * 100).toFixed(1)}%
                                    </p>
                                </div>
                                <Target className="h-8 w-8 text-green-600" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Avg Assignment Time</p>
                                    <p className="text-2xl font-bold">{metrics.averageAssignmentTime}s</p>
                                </div>
                                <Timer className="h-8 w-8 text-blue-600" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Driver Utilization</p>
                                    <p className="text-2xl font-bold">{metrics.driverUtilization}%</p>
                                </div>
                                <Gauge className="h-8 w-8 text-purple-600" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Avg Pickup Time</p>
                                    <p className="text-2xl font-bold">{metrics.averagePickupTime}m</p>
                                </div>
                                <Clock className="h-8 w-8 text-orange-600" />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="pending">Pending ({pendingRequests.length})</TabsTrigger>
                    <TabsTrigger value="active">Active ({activeRides.length})</TabsTrigger>
                    <TabsTrigger value="drivers">Drivers ({availableDrivers.length})</TabsTrigger>
                    <TabsTrigger value="analytics">Analytics</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* System Status */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Activity className="h-5 w-5" />
                                    System Status
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm">Auto Dispatch</span>
                                        <Badge variant={autoDispatch ? 'default' : 'secondary'} className={autoDispatch ? 'bg-green-100 text-green-800' : ''}>
                                            {autoDispatch ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm">Available Drivers</span>
                                        <span className="font-semibold">{availableDrivers.length}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm">Pending Requests</span>
                                        <span className="font-semibold text-orange-600">{pendingRequests.length}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm">Active Rides</span>
                                        <span className="font-semibold text-blue-600">{activeRides.length}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Recent Activity */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Clock className="h-5 w-5" />
                                    Recent Assignments
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {recentAssignments.slice(0, 5).map((assignment) => (
                                        <div key={assignment.rideId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                            <div>
                                                <div className="text-sm font-medium">Ride #{assignment.rideId.slice(-3)}</div>
                                                <div className="text-xs text-gray-500">
                                                    Driver #{assignment.driverId.slice(-3)} • Score: {(assignment.score * 100).toFixed(0)}%
                                                </div>
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {assignment.assignedAt.toLocaleTimeString()}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Pending Requests Tab */}
                <TabsContent value="pending" className="space-y-4">
                    {pendingRequests.length === 0 ? (
                        <Card>
                            <CardContent className="p-8 text-center">
                                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                                <p className="text-gray-500">No pending ride requests</p>
                            </CardContent>
                        </Card>
                    ) : (
                        pendingRequests.map((ride) => (
                            <PendingRideCard
                                key={ride.id}
                                ride={ride}
                                onManualDispatch={handleManualDispatch}
                                availableDrivers={availableDrivers}
                            />
                        ))
                    )}
                </TabsContent>

                {/* Active Rides Tab */}
                <TabsContent value="active" className="space-y-4">
                    {activeRides.length === 0 ? (
                        <Card>
                            <CardContent className="p-8 text-center">
                                <Car className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                                <p className="text-gray-500">No active rides</p>
                            </CardContent>
                        </Card>
                    ) : (
                        activeRides.map((ride) => (
                            <ActiveRideCard
                                key={ride.id}
                                ride={ride}
                                onEmergencyOverride={() => {
                                    setSelectedRide(ride);
                                    setShowEmergencyOverride(true);
                                }}
                            />
                        ))
                    )}
                </TabsContent>

                {/* Drivers Tab */}
                <TabsContent value="drivers" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {availableDrivers.map((driver) => (
                            <DriverCard key={driver.driverId} driver={driver} />
                        ))}
                    </div>
                </TabsContent>

                {/* Analytics Tab */}
                <TabsContent value="analytics" className="space-y-6">
                    <AnalyticsDashboard metrics={metrics} />
                </TabsContent>
            </Tabs>

            {/* Emergency Override Dialog */}
            <Dialog open={showEmergencyOverride} onOpenChange={setShowEmergencyOverride}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Emergency Override</DialogTitle>
                        <DialogDescription>
                            Manually reassign this ride to a different driver
                        </DialogDescription>
                    </DialogHeader>

                    {selectedRide && (
                        <EmergencyOverrideForm
                            ride={selectedRide}
                            availableDrivers={availableDrivers}
                            onSubmit={handleEmergencyOverride}
                            onCancel={() => setShowEmergencyOverride(false)}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

// Pending Ride Card Component
function PendingRideCard({
    ride,
    onManualDispatch,
    availableDrivers
}: {
    ride: RideRequest;
    onManualDispatch: (rideId: string) => void;
    availableDrivers: DriverAvailability[];
}) {
    const waitTime = Math.floor((Date.now() - ride.requestedAt.getTime()) / 1000 / 60);
    const suitableDrivers = availableDrivers.filter(d => d.vehicleType === ride.vehicleType);

    return (
        <Card>
            <CardContent className="p-4">
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <Badge variant={ride.priority === 'high' ? 'destructive' : 'secondary'}>
                                {ride.priority.toUpperCase()}
                            </Badge>
                            <span className="text-sm text-gray-500">
                                Waiting {waitTime}m
                            </span>
                        </div>

                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm">
                                <MapPin className="h-4 w-4 text-green-600" />
                                <span>{ride.pickupLocation.address}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <MapPin className="h-4 w-4 text-red-600" />
                                <span>{ride.dropoffLocation.address}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                                <Car className="h-3 w-3" />
                                {ride.vehicleType}
                            </span>
                            <span className="flex items-center gap-1">
                                <DollarSign className="h-3 w-3" />
                                ${ride.estimatedFare}
                            </span>
                            <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {ride.estimatedDuration}m
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="text-right text-sm">
                            <div className="font-medium">{suitableDrivers.length} drivers</div>
                            <div className="text-gray-500">available</div>
                        </div>
                        <Button
                            onClick={() => onManualDispatch(ride.id)}
                            disabled={suitableDrivers.length === 0}
                        >
                            <Zap className="h-4 w-4 mr-2" />
                            Dispatch
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

// Active Ride Card Component
function ActiveRideCard({
    ride,
    onEmergencyOverride
}: {
    ride: RideRequest;
    onEmergencyOverride: () => void;
}) {
    const duration = Math.floor((Date.now() - ride.requestedAt.getTime()) / 1000 / 60);

    return (
        <Card>
            <CardContent className="p-4">
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <Badge className="bg-blue-100 text-blue-800">
                                {ride.status.toUpperCase()}
                            </Badge>
                            <span className="text-sm text-gray-500">
                                {duration}m ago
                            </span>
                            {ride.assignmentScore && (
                                <span className="text-sm text-green-600">
                                    Score: {(ride.assignmentScore * 100).toFixed(0)}%
                                </span>
                            )}
                        </div>

                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm">
                                <MapPin className="h-4 w-4 text-green-600" />
                                <span>{ride.pickupLocation.address}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <MapPin className="h-4 w-4 text-red-600" />
                                <span>{ride.dropoffLocation.address}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                Driver #{ride.assignedDriverId?.slice(-3)}
                            </span>
                            <span className="flex items-center gap-1">
                                <DollarSign className="h-3 w-3" />
                                ${ride.estimatedFare}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Contact
                        </Button>
                        <Button variant="outline" size="sm" onClick={onEmergencyOverride}>
                            <Shield className="h-4 w-4 mr-2" />
                            Override
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

// Driver Card Component
function DriverCard({ driver }: { driver: DriverAvailability }) {
    return (
        <Card>
            <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                            <div className="font-medium">Driver #{driver.driverId.slice(-3)}</div>
                            <div className="text-sm text-gray-500">{driver.vehicleType}</div>
                        </div>
                    </div>
                    <Badge variant={driver.status === 'available' ? 'default' : 'secondary'}
                        className={driver.status === 'available' ? 'bg-green-100 text-green-800' : ''}>
                        {driver.status}
                    </Badge>
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span>Rating</span>
                        <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            <span>{driver.rating}</span>
                        </div>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span>Acceptance</span>
                        <span>{driver.acceptanceRate}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span>Completed</span>
                        <span>{driver.completedRides}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

// Analytics Dashboard Component
function AnalyticsDashboard({ metrics }: { metrics: DispatchMetrics | null }) {
    if (!metrics) return null;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span>Assignment Success Rate</span>
                                <span>{((metrics.successfulAssignments / metrics.totalAssignments) * 100).toFixed(1)}%</span>
                            </div>
                            <Progress value={(metrics.successfulAssignments / metrics.totalAssignments) * 100} />
                        </div>

                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span>Driver Utilization</span>
                                <span>{metrics.driverUtilization}%</span>
                            </div>
                            <Progress value={metrics.driverUtilization} />
                        </div>

                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span>Passenger Satisfaction</span>
                                <span>{metrics.passengerSatisfaction}/5.0</span>
                            </div>
                            <Progress value={(metrics.passengerSatisfaction / 5) * 100} />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Response Times</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex justify-between">
                            <span className="text-sm">Average Assignment</span>
                            <span className="font-semibold">{metrics.averageAssignmentTime}s</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm">Average Pickup</span>
                            <span className="font-semibold">{metrics.averagePickupTime}m</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm">Emergency Response</span>
                            <span className="font-semibold">{metrics.emergencyResponseTime}s</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm">Cancellation Rate</span>
                            <span className="font-semibold">{metrics.cancellationRate}%</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

// Emergency Override Form Component
function EmergencyOverrideForm({
    ride,
    availableDrivers,
    onSubmit,
    onCancel
}: {
    ride: RideRequest;
    availableDrivers: DriverAvailability[];
    onSubmit: (rideId: string, newDriverId: string, reason: string) => void;
    onCancel: () => void;
}) {
    const [selectedDriver, setSelectedDriver] = useState('');
    const [reason, setReason] = useState('');

    const suitableDrivers = availableDrivers.filter(d => d.vehicleType === ride.vehicleType);

    const handleSubmit = () => {
        if (selectedDriver && reason) {
            onSubmit(ride.id, selectedDriver, reason);
        }
    };

    return (
        <div className="space-y-4">
            <div>
                <Label htmlFor="driver-select">Select New Driver</Label>
                <Select value={selectedDriver} onValueChange={setSelectedDriver}>
                    <SelectTrigger>
                        <SelectValue placeholder="Choose a driver" />
                    </SelectTrigger>
                    <SelectContent>
                        {suitableDrivers.map(driver => (
                            <SelectItem key={driver.driverId} value={driver.driverId}>
                                Driver #{driver.driverId.slice(-3)} - Rating: {driver.rating} - {driver.acceptanceRate}% acceptance
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div>
                <Label htmlFor="reason">Reason for Override</Label>
                <Input
                    id="reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Enter reason for emergency override"
                />
            </div>

            <DialogFooter>
                <Button variant="outline" onClick={onCancel}>
                    Cancel
                </Button>
                <Button
                    onClick={handleSubmit}
                    disabled={!selectedDriver || !reason}
                >
                    Execute Override
                </Button>
            </DialogFooter>
        </div>
    );
}