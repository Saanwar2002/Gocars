'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
    Shield,
    AlertTriangle,
    TrendingUp,
    Users,
    CreditCard,
    MapPin,
    Clock,
    Eye,
    Ban,
    CheckCircle,
    XCircle,
    Activity
} from 'lucide-react';
import { fraudDetectionService, FraudAlert, RiskProfile, TransactionAnalysis } from '@/services/fraudDetectionService';

interface FraudMetrics {
    totalAlerts: number;
    activeAlerts: number;
    resolvedAlerts: number;
    falsePositives: number;
    criticalAlerts: number;
    highRiskUsers: number;
    blockedAccounts: number;
    averageRiskScore: number;
}

interface AlertsByType {
    payment: number;
    account: number;
    ride: number;
    identity: number;
    behavioral: number;
}

export default function FraudMonitoringDashboard() {
    const [metrics, setMetrics] = useState<FraudMetrics>({
        totalAlerts: 0,
        activeAlerts: 0,
        resolvedAlerts: 0,
        falsePositives: 0,
        criticalAlerts: 0,
        highRiskUsers: 0,
        blockedAccounts: 0,
        averageRiskScore: 0
    });

    const [recentAlerts, setRecentAlerts] = useState<FraudAlert[]>([]);
    const [alertsByType, setAlertsByType] = useState<AlertsByType>({
        payment: 0,
        account: 0,
        ride: 0,
        identity: 0,
        behavioral: 0
    });
    const [highRiskUsers, setHighRiskUsers] = useState<RiskProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedAlert, setSelectedAlert] = useState<FraudAlert | null>(null);

    useEffect(() => {
        loadDashboardData();
        const interval = setInterval(loadDashboardData, 30000); // Refresh every 30 seconds
        return () => clearInterval(interval);
    }, []);

    const loadDashboardData = async () => {
        try {
            setLoading(true);

            // Load fraud metrics (mock data for demo)
            const mockMetrics: FraudMetrics = {
                totalAlerts: 1247,
                activeAlerts: 23,
                resolvedAlerts: 1198,
                falsePositives: 26,
                criticalAlerts: 3,
                highRiskUsers: 15,
                blockedAccounts: 8,
                averageRiskScore: 32
            };
            setMetrics(mockMetrics);

            // Load recent alerts (mock data)
            const mockAlerts: FraudAlert[] = [
                {
                    id: 'alert_001',
                    userId: 'user_123',
                    type: 'payment',
                    severity: 'high',
                    description: 'Multiple failed payment attempts with different cards',
                    riskScore: 85,
                    detectedAt: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
                    status: 'active',
                    evidence: [
                        {
                            type: 'payment',
                            description: '5 failed payment attempts in 10 minutes',
                            data: { attempts: 5, timeframe: '10 minutes' },
                            confidence: 0.9
                        }
                    ],
                    actions: [
                        {
                            type: 'require_verification',
                            description: 'Additional verification required',
                            executedAt: new Date(),
                            automated: true
                        }
                    ]
                },
                {
                    id: 'alert_002',
                    userId: 'user_456',
                    type: 'account',
                    severity: 'critical',
                    description: 'Potential account takeover detected',
                    riskScore: 95,
                    detectedAt: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
                    status: 'investigating',
                    evidence: [
                        {
                            type: 'location',
                            description: 'Login from unusual location',
                            data: { location: 'Unknown Country' },
                            confidence: 0.8
                        },
                        {
                            type: 'device',
                            description: 'New device fingerprint',
                            data: { device: 'Unknown Device' },
                            confidence: 0.7
                        }
                    ],
                    actions: [
                        {
                            type: 'block_account',
                            description: 'Account temporarily blocked',
                            executedAt: new Date(),
                            automated: true
                        }
                    ]
                },
                {
                    id: 'alert_003',
                    userId: 'user_789',
                    type: 'behavioral',
                    severity: 'medium',
                    description: 'Unusual booking patterns detected',
                    riskScore: 65,
                    detectedAt: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
                    status: 'resolved',
                    evidence: [
                        {
                            type: 'behavior',
                            description: 'Booking frequency 300% above normal',
                            data: { increase: '300%' },
                            confidence: 0.6
                        }
                    ],
                    actions: [
                        {
                            type: 'flag_transaction',
                            description: 'Transactions flagged for review',
                            executedAt: new Date(),
                            automated: true
                        }
                    ]
                }
            ];
            setRecentAlerts(mockAlerts);

            // Calculate alerts by type
            const typeCount = mockAlerts.reduce((acc, alert) => {
                acc[alert.type] = (acc[alert.type] || 0) + 1;
                return acc;
            }, {} as any);
            setAlertsByType({
                payment: typeCount.payment || 0,
                account: typeCount.account || 0,
                ride: typeCount.ride || 0,
                identity: typeCount.identity || 0,
                behavioral: typeCount.behavioral || 0
            });

            // Load high-risk users (mock data)
            const mockHighRiskUsers: RiskProfile[] = [
                {
                    userId: 'user_123',
                    overallRiskScore: 85,
                    riskFactors: [
                        {
                            type: 'payment',
                            description: 'Multiple failed payments',
                            score: 30,
                            weight: 0.8,
                            lastDetected: new Date()
                        }
                    ],
                    lastUpdated: new Date(),
                    accountAge: 30,
                    verificationLevel: 'basic',
                    suspiciousActivityCount: 3,
                    trustScore: 25
                },
                {
                    userId: 'user_456',
                    overallRiskScore: 95,
                    riskFactors: [
                        {
                            type: 'location',
                            description: 'Unusual location patterns',
                            score: 40,
                            weight: 0.9,
                            lastDetected: new Date()
                        }
                    ],
                    lastUpdated: new Date(),
                    accountAge: 15,
                    verificationLevel: 'none',
                    suspiciousActivityCount: 5,
                    trustScore: 10
                }
            ];
            setHighRiskUsers(mockHighRiskUsers);

        } catch (error) {
            console.error('Error loading fraud dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAlertAction = async (alertId: string, action: 'resolve' | 'investigate' | 'false_positive') => {
        try {
            // In production, this would call the fraud detection service
            console.log(`Executing action ${action} on alert ${alertId}`);

            // Update local state
            setRecentAlerts(prev =>
                prev.map(alert =>
                    alert.id === alertId
                        ? { ...alert, status: action === 'resolve' ? 'resolved' : action === 'false_positive' ? 'false_positive' : 'investigating' }
                        : alert
                )
            );
        } catch (error) {
            console.error('Error executing alert action:', error);
        }
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'critical': return 'bg-red-500';
            case 'high': return 'bg-orange-500';
            case 'medium': return 'bg-yellow-500';
            case 'low': return 'bg-blue-500';
            default: return 'bg-gray-500';
        }
    };

    const getSeverityBadgeVariant = (severity: string) => {
        switch (severity) {
            case 'critical': return 'destructive';
            case 'high': return 'destructive';
            case 'medium': return 'default';
            case 'low': return 'secondary';
            default: return 'outline';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'active': return <AlertTriangle className="h-4 w-4 text-red-500" />;
            case 'investigating': return <Eye className="h-4 w-4 text-orange-500" />;
            case 'resolved': return <CheckCircle className="h-4 w-4 text-green-500" />;
            case 'false_positive': return <XCircle className="h-4 w-4 text-gray-500" />;
            default: return <Activity className="h-4 w-4" />;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Fraud Monitoring Dashboard</h1>
                    <p className="text-muted-foreground">
                        Real-time fraud detection and prevention monitoring
                    </p>
                </div>
                <Button onClick={loadDashboardData} variant="outline">
                    <Activity className="h-4 w-4 mr-2" />
                    Refresh
                </Button>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Alerts</CardTitle>
                        <Shield className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metrics.totalAlerts.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">
                            {metrics.activeAlerts} active
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Critical Alerts</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{metrics.criticalAlerts}</div>
                        <p className="text-xs text-muted-foreground">
                            Require immediate attention
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">High Risk Users</CardTitle>
                        <Users className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-600">{metrics.highRiskUsers}</div>
                        <p className="text-xs text-muted-foreground">
              Risk score > 70
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Blocked Accounts</CardTitle>
                        <Ban className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metrics.blockedAccounts}</div>
                        <p className="text-xs text-muted-foreground">
                            Automatically blocked
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content Tabs */}
            <Tabs defaultValue="alerts" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="alerts">Recent Alerts</TabsTrigger>
                    <TabsTrigger value="analytics">Analytics</TabsTrigger>
                    <TabsTrigger value="users">High Risk Users</TabsTrigger>
                    <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>

                <TabsContent value="alerts" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Fraud Alerts</CardTitle>
                            <CardDescription>
                                Latest fraud detection alerts requiring attention
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {recentAlerts.map((alert) => (
                                    <div
                                        key={alert.id}
                                        className="flex items-start space-x-4 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
                                        onClick={() => setSelectedAlert(alert)}
                                    >
                                        <div className="flex-shrink-0">
                                            {getStatusIcon(alert.status)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-2">
                                                    <Badge variant={getSeverityBadgeVariant(alert.severity)}>
                                                        {alert.severity.toUpperCase()}
                                                    </Badge>
                                                    <Badge variant="outline">{alert.type}</Badge>
                                                </div>
                                                <div className="text-sm text-muted-foreground">
                                                    {new Date(alert.detectedAt).toLocaleTimeString()}
                                                </div>
                                            </div>
                                            <p className="text-sm font-medium mt-1">{alert.description}</p>
                                            <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                                                <span>User: {alert.userId}</span>
                                                <span>Risk Score: {alert.riskScore}</span>
                                                <span>Evidence: {alert.evidence.length} items</span>
                                            </div>
                                            <div className="flex items-center space-x-2 mt-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleAlertAction(alert.id, 'resolve');
                                                    }}
                                                >
                                                    Resolve
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleAlertAction(alert.id, 'investigate');
                                                    }}
                                                >
                                                    Investigate
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleAlertAction(alert.id, 'false_positive');
                                                    }}
                                                >
                                                    False Positive
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="analytics" className="space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Alerts by Type</CardTitle>
                                <CardDescription>Distribution of fraud alert types</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="flex items-center">
                                            <CreditCard className="h-4 w-4 mr-2" />
                                            Payment
                                        </span>
                                        <span className="font-medium">{alertsByType.payment}</span>
                                    </div>
                                    <Progress value={(alertsByType.payment / Math.max(1, Object.values(alertsByType).reduce((a, b) => a + b, 0))) * 100} />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="flex items-center">
                                            <Users className="h-4 w-4 mr-2" />
                                            Account
                                        </span>
                                        <span className="font-medium">{alertsByType.account}</span>
                                    </div>
                                    <Progress value={(alertsByType.account / Math.max(1, Object.values(alertsByType).reduce((a, b) => a + b, 0))) * 100} />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="flex items-center">
                                            <Activity className="h-4 w-4 mr-2" />
                                            Behavioral
                                        </span>
                                        <span className="font-medium">{alertsByType.behavioral}</span>
                                    </div>
                                    <Progress value={(alertsByType.behavioral / Math.max(1, Object.values(alertsByType).reduce((a, b) => a + b, 0))) * 100} />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>System Performance</CardTitle>
                                <CardDescription>Fraud detection system metrics</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span>Average Risk Score</span>
                                        <span className="font-medium">{metrics.averageRiskScore}</span>
                                    </div>
                                    <Progress value={metrics.averageRiskScore} />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span>Resolution Rate</span>
                                        <span className="font-medium">
                                            {Math.round((metrics.resolvedAlerts / metrics.totalAlerts) * 100)}%
                                        </span>
                                    </div>
                                    <Progress value={(metrics.resolvedAlerts / metrics.totalAlerts) * 100} />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span>False Positive Rate</span>
                                        <span className="font-medium">
                                            {Math.round((metrics.falsePositives / metrics.totalAlerts) * 100)}%
                                        </span>
                                    </div>
                                    <Progress value={(metrics.falsePositives / metrics.totalAlerts) * 100} />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="users" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>High Risk Users</CardTitle>
                            <CardDescription>Users with elevated fraud risk scores</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {highRiskUsers.map((user) => (
                                    <div key={user.userId} className="flex items-center justify-between p-4 border rounded-lg">
                                        <div className="space-y-1">
                                            <div className="flex items-center space-x-2">
                                                <span className="font-medium">User: {user.userId}</span>
                                                <Badge variant={user.overallRiskScore >= 80 ? 'destructive' : 'default'}>
                                                    Risk: {user.overallRiskScore}
                                                </Badge>
                                                <Badge variant="outline">
                                                    {user.verificationLevel}
                                                </Badge>
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                Account Age: {user.accountAge} days |
                                                Suspicious Activities: {user.suspiciousActivityCount} |
                                                Trust Score: {user.trustScore}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                Last Updated: {user.lastUpdated.toLocaleString()}
                                            </div>
                                        </div>
                                        <div className="flex space-x-2">
                                            <Button size="sm" variant="outline">
                                                View Details
                                            </Button>
                                            <Button size="sm" variant="outline">
                                                Take Action
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="settings" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Fraud Detection Settings</CardTitle>
                            <CardDescription>Configure fraud detection parameters and thresholds</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Alert>
                                <AlertTriangle className="h-4 w-4" />
                                <AlertDescription>
                                    Fraud detection settings configuration would be implemented here.
                                    This includes risk thresholds, ML model parameters, and automated action rules.
                                </AlertDescription>
                            </Alert>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Alert Detail Modal */}
            {selectedAlert && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>Alert Details</CardTitle>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSelectedAlert(null)}
                                >
                                    ×
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium">Alert ID</label>
                                    <p className="text-sm text-muted-foreground">{selectedAlert.id}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium">User ID</label>
                                    <p className="text-sm text-muted-foreground">{selectedAlert.userId}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Type</label>
                                    <Badge variant="outline">{selectedAlert.type}</Badge>
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Severity</label>
                                    <Badge variant={getSeverityBadgeVariant(selectedAlert.severity)}>
                                        {selectedAlert.severity}
                                    </Badge>
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Risk Score</label>
                                    <p className="text-sm text-muted-foreground">{selectedAlert.riskScore}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Status</label>
                                    <div className="flex items-center space-x-2">
                                        {getStatusIcon(selectedAlert.status)}
                                        <span className="text-sm">{selectedAlert.status}</span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium">Description</label>
                                <p className="text-sm text-muted-foreground mt-1">{selectedAlert.description}</p>
                            </div>

                            <div>
                                <label className="text-sm font-medium">Evidence</label>
                                <div className="space-y-2 mt-2">
                                    {selectedAlert.evidence.map((evidence, index) => (
                                        <div key={index} className="p-3 border rounded-lg">
                                            <div className="flex items-center justify-between">
                                                <Badge variant="outline">{evidence.type}</Badge>
                                                <span className="text-xs text-muted-foreground">
                                                    Confidence: {Math.round(evidence.confidence * 100)}%
                                                </span>
                                            </div>
                                            <p className="text-sm mt-1">{evidence.description}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium">Actions Taken</label>
                                <div className="space-y-2 mt-2">
                                    {selectedAlert.actions.map((action, index) => (
                                        <div key={index} className="p-3 border rounded-lg">
                                            <div className="flex items-center justify-between">
                                                <Badge variant="outline">{action.type}</Badge>
                                                <span className="text-xs text-muted-foreground">
                                                    {action.automated ? 'Automated' : 'Manual'}
                                                </span>
                                            </div>
                                            <p className="text-sm mt-1">{action.description}</p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Executed: {action.executedAt.toLocaleString()}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}