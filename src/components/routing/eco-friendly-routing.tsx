'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    Leaf,
    Fuel,
    DollarSign,
    TrendingDown,
    Award,
    TreePine,
    Zap,
    Globe,
    Calculator,
    Target
} from 'lucide-react'
import { GeoPoint } from 'firebase/firestore'
import { routeOptimizationService, OptimizedRoute } from '@/services/routeOptimizationService'

interface EcoFriendlyRoutingProps {
    startLocation?: GeoPoint
    endLocation?: GeoPoint
    vehicleType?: string
    onEcoRouteSelected?: (route: OptimizedRoute, savings: EcoSavings) => void
}

interface EcoSavings {
    carbonSavings: number
    fuelSavings: number
    costSavings: number
    treesEquivalent: number
    carbonOffset: number
}

interface EcoMetrics {
    totalCarbonSaved: number
    totalFuelSaved: number
    totalCostSaved: number
    totalTrips: number
    ecoScore: number
    achievements: EcoAchievement[]
}

interface EcoAchievement {
    id: string
    title: string
    description: string
    icon: string
    unlockedAt: Date
    progress: number
    target: number
}

export function EcoFriendlyRouting({
    startLocation,
    endLocation,
    vehicleType = 'car',
    onEcoRouteSelected
}: EcoFriendlyRoutingProps) {
    const [ecoRoute, setEcoRoute] = useState<OptimizedRoute | null>(null)
    const [standardRoute, setStandardRoute] = useState<OptimizedRoute | null>(null)
    const [savings, setSavings] = useState<EcoSavings | null>(null)
    const [isCalculating, setIsCalculating] = useState(false)
    const [userMetrics, setUserMetrics] = useState<EcoMetrics>({
        totalCarbonSaved: 45.7,
        totalFuelSaved: 23.2,
        totalCostSaved: 156.80,
        totalTrips: 28,
        ecoScore: 87,
        achievements: [
            {
                id: 'eco_warrior',
                title: 'Eco Warrior',
                description: 'Saved 50kg of CO₂ emissions',
                icon: '🌱',
                unlockedAt: new Date('2024-01-15'),
                progress: 45.7,
                target: 50
            },
            {
                id: 'fuel_saver',
                title: 'Fuel Saver',
                description: 'Saved 25 litres of fuel',
                icon: '⛽',
                unlockedAt: new Date('2024-01-20'),
                progress: 23.2,
                target: 25
            }
        ]
    })

    useEffect(() => {
        if (startLocation && endLocation) {
            calculateEcoRoute()
        }
    }, [startLocation, endLocation, vehicleType])

    const calculateEcoRoute = async () => {
        if (!startLocation || !endLocation) return

        setIsCalculating(true)
        try {
            // Get eco-friendly route
            const ecoResult = await routeOptimizationService.getEcoFriendlyRoute(
                startLocation,
                endLocation,
                vehicleType
            )

            setEcoRoute(ecoResult.route)
            setSavings({
                carbonSavings: ecoResult.carbonSavings,
                fuelSavings: ecoResult.fuelSavings,
                costSavings: ecoResult.costSavings,
                treesEquivalent: ecoResult.carbonSavings / 22, // 1 tree absorbs ~22kg CO2/year
                carbonOffset: ecoResult.carbonSavings * 2.5 // Carbon offset cost multiplier
            })

            // For comparison, calculate standard fastest route
            // This would be done by the service internally, but shown here for clarity

        } catch (error) {
            console.error('Failed to calculate eco route:', error)
        } finally {
            setIsCalculating(false)
        }
    }

    const handleSelectEcoRoute = () => {
        if (ecoRoute && savings) {
            onEcoRouteSelected?.(ecoRoute, savings)
        }
    }

    const getEcoScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-600 bg-green-100'
        if (score >= 60) return 'text-yellow-600 bg-yellow-100'
        return 'text-red-600 bg-red-100'
    }

    const calculateCarbonFootprint = (route: OptimizedRoute) => {
        // Calculate carbon footprint per passenger
        const avgPassengers = 1.2 // Average passengers per ride
        return route.carbonEmissions / avgPassengers
    }

    return (
        <div className="space-y-6">
            {/* Eco Route Comparison */}
            {ecoRoute && savings && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Leaf className="h-5 w-5 text-green-600" />
                            Eco-Friendly Route
                        </CardTitle>
                        <CardDescription>
                            Optimized for minimal environmental impact
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            <div className="text-center p-4 bg-green-50 rounded-lg">
                                <div className="flex items-center justify-center gap-1 text-2xl font-bold text-green-600 mb-1">
                                    <Leaf className="h-6 w-6" />
                                    {savings.carbonSavings.toFixed(1)}
                                </div>
                                <p className="text-sm text-muted-foreground">kg CO₂ Saved</p>
                            </div>
                            <div className="text-center p-4 bg-blue-50 rounded-lg">
                                <div className="flex items-center justify-center gap-1 text-2xl font-bold text-blue-600 mb-1">
                                    <Fuel className="h-6 w-6" />
                                    {savings.fuelSavings.toFixed(1)}
                                </div>
                                <p className="text-sm text-muted-foreground">Litres Saved</p>
                            </div>
                            <div className="text-center p-4 bg-purple-50 rounded-lg">
                                <div className="flex items-center justify-center gap-1 text-2xl font-bold text-purple-600 mb-1">
                                    £{savings.costSavings.toFixed(2)}
                                </div>
                                <p className="text-sm text-muted-foreground">Cost Saved (GBP)</p>
                            </div>
                            <div className="text-center p-4 bg-orange-50 rounded-lg">
                                <div className="flex items-center justify-center gap-1 text-2xl font-bold text-orange-600 mb-1">
                                    <TreePine className="h-6 w-6" />
                                    {savings.treesEquivalent.toFixed(1)}
                                </div>
                                <p className="text-sm text-muted-foreground">Trees Equivalent</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                <div>
                                    <h4 className="font-medium">Environmental Impact</h4>
                                    <p className="text-sm text-muted-foreground">
                                        This route reduces your carbon footprint by {Math.round((savings.carbonSavings / ecoRoute.carbonEmissions) * 100)}%
                                    </p>
                                </div>
                                <Badge className="bg-green-100 text-green-800">
                                    {Math.round((savings.carbonSavings / ecoRoute.carbonEmissions) * 100)}% Better
                                </Badge>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium">Route Efficiency</span>
                                        <span className="text-sm text-muted-foreground">
                                            {Math.round(ecoRoute.optimizationScore * 100)}%
                                        </span>
                                    </div>
                                    <Progress value={ecoRoute.optimizationScore * 100} className="h-2" />
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium">Eco Score</span>
                                        <span className="text-sm text-muted-foreground">
                                            {Math.round(85)}% {/* Calculated eco score */}
                                        </span>
                                    </div>
                                    <Progress value={85} className="h-2 bg-green-100" />
                                </div>
                            </div>

                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                    <Globe className="h-4 w-4" />
                                    <span>Carbon footprint: {calculateCarbonFootprint(ecoRoute).toFixed(2)} kg CO₂</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Calculator className="h-4 w-4" />
                                    <span>Offset cost: £{savings.carbonOffset.toFixed(2)}</span>
                                </div>
                            </div>

                            <Button onClick={handleSelectEcoRoute} className="w-full bg-green-600 hover:bg-green-700">
                                <Leaf className="h-4 w-4 mr-2" />
                                Choose Eco-Friendly Route
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Loading State */}
            {isCalculating && (
                <Card>
                    <CardContent className="flex items-center justify-center py-12">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                            <p className="text-lg font-medium">Calculating Eco-Friendly Route...</p>
                            <p className="text-sm text-muted-foreground">Finding the most environmentally conscious path</p>
                        </div>
                    </CardContent>
                </Card>
            )}

            <Tabs defaultValue="metrics" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="metrics">Your Impact</TabsTrigger>
                    <TabsTrigger value="achievements">Achievements</TabsTrigger>
                    <TabsTrigger value="tips">Eco Tips</TabsTrigger>
                </TabsList>

                {/* User Eco Metrics */}
                <TabsContent value="metrics">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingDown className="h-5 w-5 text-green-600" />
                                Your Environmental Impact
                            </CardTitle>
                            <CardDescription>
                                Track your contribution to a greener planet
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div className="text-center p-6 bg-green-50 rounded-lg">
                                        <div className="text-3xl font-bold text-green-600 mb-2">
                                            {userMetrics.ecoScore}
                                        </div>
                                        <p className="text-sm text-muted-foreground">Eco Score</p>
                                        <Badge className={getEcoScoreColor(userMetrics.ecoScore)}>
                                            {userMetrics.ecoScore >= 80 ? 'Excellent' :
                                                userMetrics.ecoScore >= 60 ? 'Good' : 'Needs Improvement'}
                                        </Badge>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium">Progress to Next Level</span>
                                            <span className="text-sm text-muted-foreground">87/100</span>
                                        </div>
                                        <Progress value={87} className="h-3" />
                                        <p className="text-xs text-muted-foreground">
                                            13 more eco points to reach "Eco Champion" level
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="text-center p-4 border rounded-lg">
                                            <div className="text-xl font-bold text-green-600">
                                                {userMetrics.totalCarbonSaved.toFixed(1)}
                                            </div>
                                            <p className="text-xs text-muted-foreground">kg CO₂ Saved</p>
                                        </div>
                                        <div className="text-center p-4 border rounded-lg">
                                            <div className="text-xl font-bold text-blue-600">
                                                {userMetrics.totalFuelSaved.toFixed(1)}
                                            </div>
                                            <p className="text-xs text-muted-foreground">Litres Saved</p>
                                        </div>
                                        <div className="text-center p-4 border rounded-lg">
                                            <div className="text-xl font-bold text-purple-600">
                                                £{userMetrics.totalCostSaved.toFixed(0)}
                                            </div>
                                            <p className="text-xs text-muted-foreground">Money Saved</p>
                                        </div>
                                        <div className="text-center p-4 border rounded-lg">
                                            <div className="text-xl font-bold text-orange-600">
                                                {userMetrics.totalTrips}
                                            </div>
                                            <p className="text-xs text-muted-foreground">Eco Trips</p>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-blue-50 rounded-lg">
                                        <h4 className="font-medium text-blue-800 mb-2">Monthly Goal</h4>
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between text-sm">
                                                <span>Save 50kg CO₂</span>
                                                <span>{userMetrics.totalCarbonSaved.toFixed(1)}/50kg</span>
                                            </div>
                                            <Progress value={(userMetrics.totalCarbonSaved / 50) * 100} className="h-2" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Achievements */}
                <TabsContent value="achievements">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Award className="h-5 w-5 text-yellow-600" />
                                Eco Achievements
                            </CardTitle>
                            <CardDescription>
                                Unlock badges for your environmental contributions
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {userMetrics.achievements.map((achievement) => (
                                    <div key={achievement.id} className="border rounded-lg p-4">
                                        <div className="flex items-start gap-3">
                                            <div className="text-2xl">{achievement.icon}</div>
                                            <div className="flex-1">
                                                <h4 className="font-medium">{achievement.title}</h4>
                                                <p className="text-sm text-muted-foreground mb-2">
                                                    {achievement.description}
                                                </p>
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between text-sm">
                                                        <span>Progress</span>
                                                        <span>{achievement.progress.toFixed(1)}/{achievement.target}</span>
                                                    </div>
                                                    <Progress
                                                        value={(achievement.progress / achievement.target) * 100}
                                                        className="h-2"
                                                    />
                                                </div>
                                                {achievement.progress >= achievement.target && (
                                                    <Badge className="mt-2 bg-yellow-100 text-yellow-800">
                                                        Unlocked!
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {/* Locked Achievements */}
                                <div className="border rounded-lg p-4 opacity-60">
                                    <div className="flex items-start gap-3">
                                        <div className="text-2xl">🌍</div>
                                        <div className="flex-1">
                                            <h4 className="font-medium">Planet Protector</h4>
                                            <p className="text-sm text-muted-foreground mb-2">
                                                Save 100kg of CO₂ emissions
                                            </p>
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between text-sm">
                                                    <span>Progress</span>
                                                    <span>45.7/100</span>
                                                </div>
                                                <Progress value={45.7} className="h-2" />
                                            </div>
                                            <Badge variant="outline" className="mt-2">
                                                Locked
                                            </Badge>
                                        </div>
                                    </div>
                                </div>

                                <div className="border rounded-lg p-4 opacity-60">
                                    <div className="flex items-start gap-3">
                                        <div className="text-2xl">⚡</div>
                                        <div className="flex-1">
                                            <h4 className="font-medium">Efficiency Expert</h4>
                                            <p className="text-sm text-muted-foreground mb-2">
                                                Maintain 90%+ eco score for 30 days
                                            </p>
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between text-sm">
                                                    <span>Progress</span>
                                                    <span>12/30 days</span>
                                                </div>
                                                <Progress value={40} className="h-2" />
                                            </div>
                                            <Badge variant="outline" className="mt-2">
                                                Locked
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Eco Tips */}
                <TabsContent value="tips">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Target className="h-5 w-5 text-blue-600" />
                                Eco-Friendly Tips
                            </CardTitle>
                            <CardDescription>
                                Learn how to reduce your environmental impact
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="border-l-4 border-green-500 pl-4 py-2">
                                    <h4 className="font-medium text-green-800">Choose Off-Peak Hours</h4>
                                    <p className="text-sm text-muted-foreground">
                                        Travel during off-peak hours to avoid traffic congestion and reduce fuel consumption by up to 20%.
                                    </p>
                                </div>

                                <div className="border-l-4 border-blue-500 pl-4 py-2">
                                    <h4 className="font-medium text-blue-800">Share Your Ride</h4>
                                    <p className="text-sm text-muted-foreground">
                                        Ride sharing can reduce your carbon footprint by 50% or more by splitting emissions with other passengers.
                                    </p>
                                </div>

                                <div className="border-l-4 border-purple-500 pl-4 py-2">
                                    <h4 className="font-medium text-purple-800">Plan Multi-Stop Trips</h4>
                                    <p className="text-sm text-muted-foreground">
                                        Combine multiple errands into one trip to minimize total distance traveled and reduce overall emissions.
                                    </p>
                                </div>

                                <div className="border-l-4 border-orange-500 pl-4 py-2">
                                    <h4 className="font-medium text-orange-800">Choose Eco-Friendly Vehicles</h4>
                                    <p className="text-sm text-muted-foreground">
                                        Select hybrid or electric vehicles when available to significantly reduce your carbon footprint.
                                    </p>
                                </div>

                                <div className="border-l-4 border-red-500 pl-4 py-2">
                                    <h4 className="font-medium text-red-800">Avoid Peak Hours</h4>
                                    <p className="text-sm text-muted-foreground">
                                        Heavy traffic increases fuel consumption. Plan trips outside peak hours (7-9am, 5-7pm) for better efficiency.
                                    </p>
                                </div>

                                <div className="p-4 bg-green-50 rounded-lg">
                                    <h4 className="font-medium text-green-800 mb-2">💡 Pro Tip</h4>
                                    <p className="text-sm text-green-700">
                                        Every eco-friendly trip you take contributes to cleaner air and a healthier planet.
                                        Small choices make a big difference when multiplied across millions of rides!
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}