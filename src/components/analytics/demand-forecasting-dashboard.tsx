'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
    TrendingUp,
    MapPin,
    Clock,
    DollarSign,
    Users,
    BarChart3,
    Activity,
    Target,
    Zap,
    AlertTriangle,
    CheckCircle,
    Info,
    Calendar,
    Navigation
} from 'lucide-react'
import {
    predictiveAnalyticsService,
    DemandPrediction,
    PricingRecommendation,
    DriverPositioningRecommendation,
    MarketAnalytics
} from '@/services/predictiveAnalyticsService'
import { GeoPoint } from 'firebase/firestore'

interface DemandForecastingDashboardProps {
    selectedLocation?: { lat: number; lng: number; name: string }
    timeRange?: { start: Date; end: Date }
}

export default function DemandForecastingDashboard({
    selectedLocation = { lat: 51.5074, lng: -0.1278, name: 'London' },
    timeRange = {
        start: new Date(),
        end: new Date(Date.now() + 24 * 60 * 60 * 1000)
    }
}: DemandForecastingDashboardProps) {
    const [demandPredictions, setDemandPredictions] = useState<DemandPrediction[]>([])
    const [pricingRecommendations, setPricingRecommendations] = useState<PricingRecommendation[]>([])
    const [positioningRecommendations, setPositioningRecommendations] = useState<DriverPositioningRecommendation[]>([])
    const [marketAnalytics, setMarketAnalytics] = useState<MarketAnalytics | null>(null)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('demand')
    const [selectedTimeHorizon, setSelectedTimeHorizon] = useState('24h')

    useEffect(() => {
        loadAnalyticsData()
    }, [selectedLocation, timeRange])

    const loadAnalyticsData = async () => {
        try {
            setLoading(true)
            const location = new GeoPoint(selectedLocation.lat, selectedLocation.lng)

            // Generate demand predictions for next 24 hours
            const predictions: DemandPrediction[] = []
            for (let i = 0; i < 24; i++) {
                const targetTime = new Date(Date.now() + i * 60 * 60 * 1000)
                const prediction = await predictiveAnalyticsService.generateDemandPrediction(
                    location,
                    selectedLocation.name,
                    targetTime
                )
                predictions.push(prediction)
            }
            setDemandPredictions(predictions)

            // Generate pricing recommendations for next 12 hours
            const pricing: PricingRecommendation[] = []
            for (let i = 0; i < 12; i += 2) {
                const targetTime = new Date(Date.now() + i * 60 * 60 * 1000)
                const recommendation = await predictiveAnalyticsService.generatePricingRecommendation(
                    location,
                    targetTime
                )
                pricing.push(recommendation)
            }
            setPricingRecommendations(pricing)

            // Generate driver positioning recommendations
            const positioning = await predictiveAnalyticsService.generateDriverPositioningRecommendations(
                'mock-driver-id',
                location
            )
            setPositioningRecommendations(positioning)

            // Get market analytics
            const analytics = await predictiveAnalyticsService.getMarketAnalytics(
                location,
                timeRange
            )
            setMarketAnalytics(analytics)

        } catch (error) {
            console.error('Error loading analytics data:', error)
        } finally {
            setLoading(false)
        }
    }

    const getDemandLevelColor = (demand: number) => {
        if (demand >= 30) return 'text-red-600 bg-red-100'
        if (demand >= 20) return 'text-orange-600 bg-orange-100'
        if (demand >= 10) return 'text-yellow-600 bg-yellow-100'
        return 'text-green-600 bg-green-100'
    }

    const getDemandLevelText = (demand: number) => {
        if (demand >= 30) return 'Very High'
        if (demand >= 20) return 'High'
        if (demand >= 10) return 'Medium'
        return 'Low'
    }

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'urgent': return 'text-red-600 bg-red-100'
            case 'high': return 'text-orange-600 bg-orange-100'
            case 'medium': return 'text-yellow-600 bg-yellow-100'
            case 'low': return 'text-green-600 bg-green-100'
            default: return 'text-gray-600 bg-gray-100'
        }
    }

    const renderDemandPredictions = () => (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-primary">
                            {demandPredictions.length > 0 ? demandPredictions[0].predictedDemand.toFixed(0) : 0}
                        </div>
                        <div className="text-sm text-muted-foreground">Current Hour Demand</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-blue-600">
                            {demandPredictions.reduce((sum, p) => sum + p.predictedDemand, 0).toFixed(0)}
                        </div>
                        <div className="text-sm text-muted-foreground">24h Total Demand</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-green-600">
                            {demandPredictions.length > 0 ? (demandPredictions.reduce((sum, p) => sum + p.confidence, 0) / demandPredictions.length * 100).toFixed(0) : 0}%
                        </div>
                        <div className="text-sm text-muted-foreground">Avg Confidence</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-purple-600">
                            {Math.max(...demandPredictions.map(p => p.predictedDemand)).toFixed(0)}
                        </div>
                        <div className="text-sm text-muted-foreground">Peak Demand</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5" />
                        Hourly Demand Forecast
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {demandPredictions.slice(0, 12).map((prediction, index) => {
                            const hour = new Date(Date.now() + index * 60 * 60 * 1000).getHours()
                            return (
                                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-primary/10 p-2 rounded-full">
                                            <Clock className="h-4 w-4 text-primary" />
                                        </div>
                                        <div>
                                            <h4 className="font-medium">{hour}:00 - {hour + 1}:00</h4>
                                            <p className="text-sm text-muted-foreground">
                                                Confidence: {(prediction.confidence * 100).toFixed(0)}%
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <Badge className={getDemandLevelColor(prediction.predictedDemand)}>
                                            {getDemandLevelText(prediction.predictedDemand)}
                                        </Badge>
                                        <div className="text-lg font-bold mt-1">
                                            {prediction.predictedDemand.toFixed(0)} rides
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Prediction Factors Analysis
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {demandPredictions.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            {Object.entries(demandPredictions[0].factors).map(([factor, value]) => (
                                <div key={factor} className="text-center">
                                    <div className="text-lg font-bold">
                                        {(value * 100).toFixed(0)}%
                                    </div>
                                    <div className="text-sm text-muted-foreground capitalize">
                                        {factor}
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                                        <div
                                            className="bg-primary h-2 rounded-full"
                                            style={{ width: `${value * 100}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )  con
st renderPricingRecommendations = () => (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-primary">
                            £{pricingRecommendations.length > 0 ? pricingRecommendations[0].recommendedPrice.toFixed(2) : '0.00'}
                        </div>
                        <div className="text-sm text-muted-foreground">Current Price</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-green-600">
                            {pricingRecommendations.length > 0 ? pricingRecommendations[0].surgeMultiplier.toFixed(1) : '1.0'}x
                        </div>
                        <div className="text-sm text-muted-foreground">Surge Multiplier</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-blue-600">
                            £{pricingRecommendations.length > 0 ? pricingRecommendations[0].expectedRevenue.toFixed(2) : '0.00'}
                        </div>
                        <div className="text-sm text-muted-foreground">Expected Revenue</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-purple-600">
                            {pricingRecommendations.length > 0 ? pricingRecommendations[0].demandLevel.toUpperCase() : 'MEDIUM'}
                        </div>
                        <div className="text-sm text-muted-foreground">Demand Level</div>
                    </CardContent>
                </Card>
            </div>

            <div className="space-y-3">
                {pricingRecommendations.map((recommendation, index) => {
                    const hour = new Date(Date.now() + index * 2 * 60 * 60 * 1000).getHours()
                    return (
                        <Card key={index} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-primary/10 p-2 rounded-full">
                                            <DollarSign className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <h4 className="font-medium">{hour}:00 - {hour + 2}:00</h4>
                                            <p className="text-sm text-muted-foreground">
                                                {recommendation.reasoning}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <Badge className={getDemandLevelColor(20)}>
                                            {recommendation.demandLevel.toUpperCase()}
                                        </Badge>
                                        <div className="text-lg font-bold mt-1">
                                            £{recommendation.recommendedPrice.toFixed(2)}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                    <div>
                                        <span className="text-muted-foreground">Base Fare</span>
                                        <p className="font-medium">£{recommendation.baseFare.toFixed(2)}</p>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Surge</span>
                                        <p className="font-medium">{recommendation.surgeMultiplier.toFixed(1)}x</p>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Expected Revenue</span>
                                        <p className="font-medium">£{recommendation.expectedRevenue.toFixed(2)}</p>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Elasticity</span>
                                        <p className="font-medium">{recommendation.elasticity.toFixed(2)}</p>
                                    </div>
                                </div>

                                {recommendation.competitorPricing && (
                                    <div className="mt-3 p-2 bg-blue-50 rounded-lg">
                                        <div className="flex items-center gap-2 text-blue-800">
                                            <Info className="h-4 w-4" />
                                            <span className="text-sm">
                                                Competitor average: £{recommendation.competitorPricing.toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )
                })}
            </div>
        </div>
    )

    const renderDriverPositioning = () => (
        <div className="space-y-4">
            <Alert>
                <Navigation className="h-4 w-4" />
                <AlertDescription>
                    <div className="space-y-2">
                        <p className="font-medium">Driver Positioning Recommendations</p>
                        <p className="text-sm">
                            AI-powered recommendations for optimal driver positioning based on predicted demand patterns.
                        </p>
                    </div>
                </AlertDescription>
            </Alert>

            <div className="space-y-3">
                {positioningRecommendations.map((recommendation, index) => (
                    <Card key={index} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="bg-primary/10 p-2 rounded-full">
                                        <MapPin className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <h4 className="font-medium">{recommendation.recommendedLocationName}</h4>
                                        <p className="text-sm text-muted-foreground">
                                            {recommendation.reasoning}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <Badge className={getPriorityColor(recommendation.priority)}>
                                        {recommendation.priority.toUpperCase()}
                                    </Badge>
                                    <div className="text-sm text-muted-foreground mt-1">
                                        {(recommendation.confidence * 100).toFixed(0)}% confidence
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                                <div>
                                    <span className="text-muted-foreground">Expected Wait</span>
                                    <p className="font-medium">{recommendation.expectedWaitTime} min</p>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Expected Earnings</span>
                                    <p className="font-medium">£{recommendation.expectedEarnings.toFixed(2)}/hr</p>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Valid Until</span>
                                    <p className="font-medium">
                                        {recommendation.validUntil.toDate().toLocaleTimeString([], {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-3 flex gap-2">
                                <Button size="sm" className="flex-1">
                                    Navigate
                                </Button>
                                <Button variant="outline" size="sm">
                                    Save Location
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )

    const renderMarketAnalytics = () => (
        <div className="space-y-4">
            {marketAnalytics && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Current Metrics</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Total Rides</span>
                                    <span className="font-medium">{marketAnalytics.metrics.totalRides}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Avg Wait Time</span>
                                    <span className="font-medium">{marketAnalytics.metrics.averageWaitTime.toFixed(1)} min</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Avg Fare</span>
                                    <span className="font-medium">£{marketAnalytics.metrics.averageFare.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Driver Utilization</span>
                                    <span className="font-medium">{(marketAnalytics.metrics.driverUtilization * 100).toFixed(0)}%</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Satisfaction</span>
                                    <span className="font-medium">{marketAnalytics.metrics.customerSatisfaction.toFixed(1)}/5</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Market Trends</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Demand Growth</span>
                                    <span className="font-medium text-green-600">
                                        +{(marketAnalytics.trends.demandGrowth * 100).toFixed(1)}%
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Price Elasticity</span>
                                    <span className="font-medium">{marketAnalytics.trends.priceElasticity.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Seasonal Variation</span>
                                    <span className="font-medium">{(marketAnalytics.trends.seasonalVariation * 100).toFixed(0)}%</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Predictions</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Next Hour</span>
                                    <span className="font-medium">{marketAnalytics.predictions.nextHourDemand} rides</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Next Day</span>
                                    <span className="font-medium">{marketAnalytics.predictions.nextDayDemand} rides</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Next Week</span>
                                    <span className="font-medium">{marketAnalytics.predictions.nextWeekDemand} rides</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="border-green-200 bg-green-50/50">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-green-800">
                                <CheckCircle className="h-5 w-5" />
                                Market Insights
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2 text-green-700">
                                <p>• Demand is trending upward with {(marketAnalytics.trends.demandGrowth * 100).toFixed(1)}% growth</p>
                                <p>• Customer satisfaction is {marketAnalytics.metrics.customerSatisfaction > 4.5 ? 'excellent' : 'good'} at {marketAnalytics.metrics.customerSatisfaction.toFixed(1)}/5</p>
                                <p>• Driver utilization at {(marketAnalytics.metrics.driverUtilization * 100).toFixed(0)}% indicates {marketAnalytics.metrics.driverUtilization > 0.8 ? 'high efficiency' : 'room for improvement'}</p>
                                <p>• Price elasticity of {marketAnalytics.trends.priceElasticity.toFixed(2)} suggests {Math.abs(marketAnalytics.trends.priceElasticity) > 1 ? 'elastic' : 'inelastic'} demand</p>
                            </div>
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    )

    if (loading) {
        return (
            <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-muted-foreground">Loading predictive analytics...</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <TrendingUp className="h-6 w-6" />
                        Demand Forecasting & Analytics
                    </h2>
                    <p className="text-muted-foreground">
                        AI-powered demand prediction, dynamic pricing, and driver positioning
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Select value={selectedTimeHorizon} onValueChange={setSelectedTimeHorizon}>
                        <SelectTrigger className="w-32">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="1h">Next Hour</SelectItem>
                            <SelectItem value="24h">Next 24h</SelectItem>
                            <SelectItem value="7d">Next 7 Days</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button onClick={loadAnalyticsData} variant="outline">
                        Refresh
                    </Button>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="demand" className="flex items-center gap-2">
                        <Activity className="h-4 w-4" />
                        Demand Forecast
                    </TabsTrigger>
                    <TabsTrigger value="pricing" className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Dynamic Pricing
                    </TabsTrigger>
                    <TabsTrigger value="positioning" className="flex items-center gap-2">
                        <Navigation className="h-4 w-4" />
                        Driver Positioning
                    </TabsTrigger>
                    <TabsTrigger value="analytics" className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        Market Analytics
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="demand" className="mt-6">
                    {renderDemandPredictions()}
                </TabsContent>

                <TabsContent value="pricing" className="mt-6">
                    {renderPricingRecommendations()}
                </TabsContent>

                <TabsContent value="positioning" className="mt-6">
                    {renderDriverPositioning()}
                </TabsContent>

                <TabsContent value="analytics" className="mt-6">
                    {renderMarketAnalytics()}
                </TabsContent>
            </Tabs>
        </div>
    )
}