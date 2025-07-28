'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import {
    FlaskConical,
    TrendingUp,
    Users,
    Clock,
    Star,
    DollarSign,
    BarChart3,
    Settings,
    Play,
    Pause,
    StopCircle,
    Plus,
    Edit,
    Trash2,
    CheckCircle,
    AlertTriangle,
    Info
} from 'lucide-react'

interface ABTestVariant {
    id: string
    name: string
    description: string
    isActive: boolean
    trafficPercentage: number
    algorithm: 'standard' | 'ml_enhanced' | 'preference_weighted' | 'performance_optimized'
    parameters: Record<string, any>
    metrics: {
        matchSuccessRate: number
        averageWaitTime: number
        customerSatisfaction: number
        driverUtilization: number
        revenue: number
    }
    createdAt: Date
}

interface ABTestResults {
    variantId: string
    variantName: string
    sampleSize: number
    conversionRate: number
    averageWaitTime: number
    customerSatisfaction: number
    revenue: number
    confidenceLevel: number
    isStatisticallySignificant: boolean
}

export default function ABTestingFramework() {
    const [variants, setVariants] = useState<ABTestVariant[]>([])
    const [results, setResults] = useState<ABTestResults[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('variants')
    const [isCreating, setIsCreating] = useState(false)
    const [editingVariant, setEditingVariant] = useState<ABTestVariant | null>(null)

    // Form state for creating/editing variants
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        algorithm: 'standard' as const,
        trafficPercentage: 10,
        parameters: {}
    })

    useEffect(() => {
        loadVariants()
        loadResults()
    }, [])

    const loadVariants = async () => {
        try {
            setLoading(true)
            // Mock data - in real implementation, load from Firebase
            const mockVariants: ABTestVariant[] = [
                {
                    id: '1',
                    name: 'ML Enhanced Matching',
                    description: 'Uses machine learning to improve driver-passenger matching',
                    isActive: true,
                    trafficPercentage: 50,
                    algorithm: 'ml_enhanced',
                    parameters: {
                        mlWeight: 0.3,
                        historicalDataWeight: 0.4,
                        preferenceWeight: 0.3
                    },
                    metrics: {
                        matchSuccessRate: 0.87,
                        averageWaitTime: 4.2,
                        customerSatisfaction: 4.6,
                        driverUtilization: 0.78,
                        revenue: 125.50
                    },
                    createdAt: new Date('2024-01-15')
                },
                {
                    id: '2',
                    name: 'Preference Weighted',
                    description: 'Prioritizes passenger preferences in matching algorithm',
                    isActive: true,
                    trafficPercentage: 25,
                    algorithm: 'preference_weighted',
                    parameters: {
                        preferenceMultiplier: 2.0,
                        distanceWeight: 0.2,
                        performanceWeight: 0.3
                    },
                    metrics: {
                        matchSuccessRate: 0.82,
                        averageWaitTime: 5.1,
                        customerSatisfaction: 4.8,
                        driverUtilization: 0.72,
                        revenue: 118.30
                    },
                    createdAt: new Date('2024-01-20')
                },
                {
                    id: '3',
                    name: 'Performance Optimized',
                    description: 'Focuses on driver performance metrics for matching',
                    isActive: false,
                    trafficPercentage: 25,
                    algorithm: 'performance_optimized',
                    parameters: {
                        performanceMultiplier: 1.8,
                        ratingThreshold: 4.5,
                        reliabilityWeight: 0.4
                    },
                    metrics: {
                        matchSuccessRate: 0.85,
                        averageWaitTime: 3.8,
                        customerSatisfaction: 4.4,
                        driverUtilization: 0.81,
                        revenue: 132.20
                    },
                    createdAt: new Date('2024-02-01')
                }
            ]
            setVariants(mockVariants)
        } catch (error) {
            console.error('Error loading variants:', error)
        } finally {
            setLoading(false)
        }
    }

    const loadResults = async () => {
        try {
            // Mock results data
            const mockResults: ABTestResults[] = [
                {
                    variantId: '1',
                    variantName: 'ML Enhanced Matching',
                    sampleSize: 2450,
                    conversionRate: 0.87,
                    averageWaitTime: 4.2,
                    customerSatisfaction: 4.6,
                    revenue: 125.50,
                    confidenceLevel: 0.95,
                    isStatisticallySignificant: true
                },
                {
                    variantId: '2',
                    variantName: 'Preference Weighted',
                    sampleSize: 1225,
                    conversionRate: 0.82,
                    averageWaitTime: 5.1,
                    customerSatisfaction: 4.8,
                    revenue: 118.30,
                    confidenceLevel: 0.92,
                    isStatisticallySignificant: true
                },
                {
                    variantId: '3',
                    variantName: 'Performance Optimized',
                    sampleSize: 1180,
                    conversionRate: 0.85,
                    averageWaitTime: 3.8,
                    customerSatisfaction: 4.4,
                    revenue: 132.20,
                    confidenceLevel: 0.89,
                    isStatisticallySignificant: false
                }
            ]
            setResults(mockResults)
        } catch (error) {
            console.error('Error loading results:', error)
        }
    }

    const handleCreateVariant = async () => {
        try {
            const newVariant: ABTestVariant = {
                id: Date.now().toString(),
                name: formData.name,
                description: formData.description,
                isActive: false,
                trafficPercentage: formData.trafficPercentage,
                algorithm: formData.algorithm,
                parameters: formData.parameters,
                metrics: {
                    matchSuccessRate: 0,
                    averageWaitTime: 0,
                    customerSatisfaction: 0,
                    driverUtilization: 0,
                    revenue: 0
                },
                createdAt: new Date()
            }

            setVariants([...variants, newVariant])
            setIsCreating(false)
            setFormData({
                name: '',
                description: '',
                algorithm: 'standard',
                trafficPercentage: 10,
                parameters: {}
            })
        } catch (error) {
            console.error('Error creating variant:', error)
        }
    }

    const handleToggleVariant = async (variantId: string) => {
        try {
            setVariants(variants.map(variant =>
                variant.id === variantId
                    ? { ...variant, isActive: !variant.isActive }
                    : variant
            ))
        } catch (error) {
            console.error('Error toggling variant:', error)
        }
    }

    const handleDeleteVariant = async (variantId: string) => {
        try {
            setVariants(variants.filter(variant => variant.id !== variantId))
        } catch (error) {
            console.error('Error deleting variant:', error)
        }
    }

    const getAlgorithmDescription = (algorithm: string) => {
        switch (algorithm) {
            case 'ml_enhanced':
                return 'Uses machine learning models to optimize matching based on historical data'
            case 'preference_weighted':
                return 'Prioritizes passenger preferences with higher weighting in the algorithm'
            case 'performance_optimized':
                return 'Focuses on driver performance metrics for optimal service quality'
            case 'standard':
                return 'Standard matching algorithm with balanced factors'
            default:
                return 'Custom algorithm configuration'
        }
    }

    const getConfidenceColor = (confidence: number) => {
        if (confidence >= 0.95) return 'text-green-600 bg-green-100'
        if (confidence >= 0.90) return 'text-yellow-600 bg-yellow-100'
        return 'text-red-600 bg-red-100'
    }

    const renderVariantCard = (variant: ABTestVariant) => (
        <Card key={variant.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                        <div className="bg-primary/10 p-2 rounded-full">
                            <FlaskConical className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h4 className="font-medium">{variant.name}</h4>
                            <p className="text-sm text-muted-foreground">{variant.description}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {variant.isActive ? (
                            <Badge className="bg-green-100 text-green-800">Active</Badge>
                        ) : (
                            <Badge variant="secondary">Inactive</Badge>
                        )}
                        <div className="flex gap-1">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingVariant(variant)}
                            >
                                <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteVariant(variant.id)}
                            >
                                <Trash2 className="h-3 w-3" />
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-sm">Traffic Allocation</span>
                        <div className="flex items-center gap-2">
                            <Progress value={variant.trafficPercentage} className="w-20 h-2" />
                            <span className="text-sm font-medium">{variant.trafficPercentage}%</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                            <span className="text-muted-foreground">Algorithm</span>
                            <p className="font-medium capitalize">{variant.algorithm.replace('_', ' ')}</p>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Success Rate</span>
                            <p className="font-medium">{(variant.metrics.matchSuccessRate * 100).toFixed(1)}%</p>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Avg Wait Time</span>
                            <p className="font-medium">{variant.metrics.averageWaitTime.toFixed(1)} min</p>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Satisfaction</span>
                            <p className="font-medium">{variant.metrics.customerSatisfaction.toFixed(1)}/5</p>
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t">
                        <Switch
                            checked={variant.isActive}
                            onCheckedChange={() => handleToggleVariant(variant.id)}
                        />
                        <span className="text-xs text-muted-foreground">
                            Created {variant.createdAt.toLocaleDateString()}
                        </span>
                    </div>
                </div>
            </CardContent>
        </Card>
    )

    const renderResults = () => (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Test Results Overview
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-primary">
                                {results.reduce((sum, r) => sum + r.sampleSize, 0).toLocaleString()}
                            </div>
                            <div className="text-sm text-muted-foreground">Total Sample Size</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">
                                {results.filter(r => r.isStatisticallySignificant).length}
                            </div>
                            <div className="text-sm text-muted-foreground">Significant Results</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">
                                {(results.reduce((sum, r) => sum + r.conversionRate, 0) / results.length * 100).toFixed(1)}%
                            </div>
                            <div className="text-sm text-muted-foreground">Avg Conversion</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-purple-600">
                                £{(results.reduce((sum, r) => sum + r.revenue, 0) / results.length).toFixed(2)}
                            </div>
                            <div className="text-sm text-muted-foreground">Avg Revenue</div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {results.map((result) => (
                            <Card key={result.variantId} className="border-l-4 border-l-primary">
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <h4 className="font-medium">{result.variantName}</h4>
                                            <p className="text-sm text-muted-foreground">
                                                Sample size: {result.sampleSize.toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge className={getConfidenceColor(result.confidenceLevel)}>
                                                {(result.confidenceLevel * 100).toFixed(0)}% confidence
                                            </Badge>
                                            {result.isStatisticallySignificant ? (
                                                <Badge className="bg-green-100 text-green-800">
                                                    <CheckCircle className="h-3 w-3 mr-1" />
                                                    Significant
                                                </Badge>
                                            ) : (
                                                <Badge variant="secondary">
                                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                                    Not Significant
                                                </Badge>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                                        <div>
                                            <span className="text-muted-foreground">Conversion</span>
                                            <p className="font-medium">{(result.conversionRate * 100).toFixed(1)}%</p>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Wait Time</span>
                                            <p className="font-medium">{result.averageWaitTime.toFixed(1)} min</p>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Satisfaction</span>
                                            <p className="font-medium">{result.customerSatisfaction.toFixed(1)}/5</p>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Revenue</span>
                                            <p className="font-medium">£{result.revenue.toFixed(2)}</p>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Performance</span>
                                            <div className="flex items-center gap-1">
                                                {result.conversionRate > 0.85 ? (
                                                    <TrendingUp className="h-3 w-3 text-green-600" />
                                                ) : (
                                                    <TrendingUp className="h-3 w-3 text-yellow-600" />
                                                )}
                                                <span className="font-medium">
                                                    {result.conversionRate > 0.85 ? 'Excellent' : 'Good'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Winner Analysis */}
            {results.length > 0 && (
                <Card className="border-green-200 bg-green-50/50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-green-800">
                            <CheckCircle className="h-5 w-5" />
                            Winning Variant Analysis
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {(() => {
                                const winner = results.reduce((prev, current) =>
                                    current.conversionRate > prev.conversionRate ? current : prev
                                )
                                return (
                                    <div>
                                        <h4 className="font-medium text-green-900">{winner.variantName}</h4>
                                        <p className="text-sm text-green-700 mb-2">
                                            Best performing variant with {(winner.conversionRate * 100).toFixed(1)}% conversion rate
                                        </p>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                            <div>
                                                <span className="text-green-600">Conversion Rate</span>
                                                <p className="font-medium">{(winner.conversionRate * 100).toFixed(1)}%</p>
                                            </div>
                                            <div>
                                                <span className="text-green-600">Customer Satisfaction</span>
                                                <p className="font-medium">{winner.customerSatisfaction.toFixed(1)}/5</p>
                                            </div>
                                            <div>
                                                <span className="text-green-600">Average Wait Time</span>
                                                <p className="font-medium">{winner.averageWaitTime.toFixed(1)} min</p>
                                            </div>
                                            <div>
                                                <span className="text-green-600">Revenue per Ride</span>
                                                <p className="font-medium">£{winner.revenue.toFixed(2)}</p>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })()}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )

    if (loading) {
        return (
            <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-muted-foreground">Loading A/B test data...</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <FlaskConical className="h-6 w-6" />
                        A/B Testing Framework
                    </h2>
                    <p className="text-muted-foreground">
                        Test and optimize AI matching algorithms with data-driven insights
                    </p>
                </div>
                <Button onClick={() => setIsCreating(true)} className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    New Test
                </Button>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="variants" className="flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        Test Variants ({variants.length})
                    </TabsTrigger>
                    <TabsTrigger value="results" className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        Results & Analytics
                    </TabsTrigger>
                    <TabsTrigger value="insights" className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Insights
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="variants" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {variants.map(variant => renderVariantCard(variant))}
                    </div>
                </TabsContent>

                <TabsContent value="results">
                    {renderResults()}
                </TabsContent>

                <TabsContent value="insights" className="space-y-4">
                    <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                            <div className="space-y-2">
                                <p className="font-medium">Key Insights from A/B Testing</p>
                                <ul className="list-disc list-inside space-y-1 text-sm">
                                    <li>ML Enhanced matching shows 5% higher conversion rates</li>
                                    <li>Preference weighted algorithm improves customer satisfaction by 0.4 points</li>
                                    <li>Performance optimized reduces wait times but may impact satisfaction</li>
                                    <li>Statistical significance achieved with 95% confidence for top variants</li>
                                </ul>
                            </div>
                        </AlertDescription>
                    </Alert>
                </TabsContent>
            </Tabs>

            {/* Create Variant Dialog */}
            <Dialog open={isCreating} onOpenChange={setIsCreating}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Create New A/B Test Variant</DialogTitle>
                        <DialogDescription>
                            Configure a new algorithm variant to test against existing implementations
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="variantName">Variant Name</Label>
                                <Input
                                    id="variantName"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g., Distance Optimized"
                                />
                            </div>

                            <div>
                                <Label htmlFor="trafficPercentage">Traffic Percentage</Label>
                                <Input
                                    id="trafficPercentage"
                                    type="number"
                                    min="1"
                                    max="100"
                                    value={formData.trafficPercentage}
                                    onChange={(e) => setFormData({ ...formData, trafficPercentage: parseInt(e.target.value) || 0 })}
                                />
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Describe what this variant tests..."
                                rows={3}
                            />
                        </div>

                        <div>
                            <Label htmlFor="algorithm">Algorithm Type</Label>
                            <Select
                                value={formData.algorithm}
                                onValueChange={(value: any) => setFormData({ ...formData, algorithm: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="standard">Standard Algorithm</SelectItem>
                                    <SelectItem value="ml_enhanced">ML Enhanced</SelectItem>
                                    <SelectItem value="preference_weighted">Preference Weighted</SelectItem>
                                    <SelectItem value="performance_optimized">Performance Optimized</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground mt-1">
                                {getAlgorithmDescription(formData.algorithm)}
                            </p>
                        </div>

                        <div className="flex gap-2">
                            <Button onClick={handleCreateVariant} className="flex-1">
                                Create Variant
                            </Button>
                            <Button variant="outline" onClick={() => setIsCreating(false)}>
                                Cancel
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}