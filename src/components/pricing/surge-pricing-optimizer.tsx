'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Zap, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Clock,
  Settings,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Info,
  Target,
  Activity
} from 'lucide-react'

interface SurgeZone {
  id: string
  name: string
  coordinates: { lat: number; lng: number }
  currentDemand: number
  currentSupply: number
  surgeMultiplier: number
  isActive: boolean
  revenue: number
  customerSatisfaction: number
}

interface SurgeConfig {
  enabled: boolean
  maxMultiplier: number
  minMultiplier: number
  demandThreshold: number
  supplyThreshold: number
  cooldownPeriod: number
  priceElasticity: number
}

export default function SurgePricingOptimizer() {
  const [surgeZones, setSurgeZones] = useState<SurgeZone[]>([])
  const [surgeConfig, setSurgeConfig] = useState<SurgeConfig>({
    enabled: true,
    maxMultiplier: 3.0,
    minMultiplier: 0.8,
    demandThreshold: 25,
    supplyThreshold: 10,
    cooldownPeriod: 15,
    priceElasticity: -0.8
  })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('zones')

  useEffect(() => {
    loadSurgeData()
    const interval = setInterval(loadSurgeData, 30000) // Update every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const loadSurgeData = async () => {
    try {
      setLoading(true)
      // Mock data - in real implementation, load from predictive analytics service
      const mockZones: SurgeZone[] = [
        {
          id: '1',
          name: 'City Center',
          coordinates: { lat: 51.5074, lng: -0.1278 },
          currentDemand: 35,
          currentSupply: 8,
          surgeMultiplier: 2.1,
          isActive: true,
          revenue: 1250.50,
          customerSatisfaction: 4.2
        },
        {
          id: '2',
          name: 'Business District',
          coordinates: { lat: 51.5155, lng: -0.0922 },
          currentDemand: 28,
          currentSupply: 12,
          surgeMultiplier: 1.6,
          isActive: true,
          revenue: 980.30,
          customerSatisfaction: 4.5
        },
        {
          id: '3',
          name: 'Airport',
          coordinates: { lat: 51.4700, lng: -0.4543 },
          currentDemand: 42,
          currentSupply: 6,
          surgeMultiplier: 2.8,
          isActive: true,
          revenue: 1680.75,
          customerSatisfaction: 3.9
        },
        {
          id: '4',
          name: 'Shopping District',
          coordinates: { lat: 51.5145, lng: -0.1447 },
          currentDemand: 18,
          currentSupply: 15,
          surgeMultiplier: 1.0,
          isActive: false,
          revenue: 650.20,
          customerSatisfaction: 4.7
        },
        {
          id: '5',
          name: 'Entertainment Quarter',
          coordinates: { lat: 51.5101, lng: -0.1340 },
          currentDemand: 31,
          currentSupply: 9,
          surgeMultiplier: 1.9,
          isActive: true,
          revenue: 1120.40,
          customerSatisfaction: 4.3
        }
      ]
      setSurgeZones(mockZones)
    } catch (error) {
      console.error('Error loading surge data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleConfigUpdate = (key: keyof SurgeConfig, value: any) => {
    setSurgeConfig(prev => ({ ...prev, [key]: value }))
  }

  const handleZoneToggle = (zoneId: string) => {
    setSurgeZones(zones => 
      zones.map(zone => 
        zone.id === zoneId 
          ? { ...zone, isActive: !zone.isActive }
          : zone
      )
    )
  }

  const calculateOptimalMultiplier = (demand: number, supply: number): number => {
    const demandSupplyRatio = demand / Math.max(supply, 1)
    let multiplier = 1.0

    if (demandSupplyRatio > 3.0) {
      multiplier = Math.min(surgeConfig.maxMultiplier, 1.0 + (demandSupplyRatio - 1) * 0.3)
    } else if (demandSupplyRatio < 1.5) {
      multiplier = Math.max(surgeConfig.minMultiplier, 1.0 - (1.5 - demandSupplyRatio) * 0.1)
    }

    return Math.round(multiplier * 10) / 10
  }

  const getSurgeColor = (multiplier: number) => {
    if (multiplier >= 2.5) return 'text-red-600 bg-red-100'
    if (multiplier >= 1.5) return 'text-orange-600 bg-orange-100'
    if (multiplier > 1.0) return 'text-yellow-600 bg-yellow-100'
    return 'text-green-600 bg-green-100'
  }

  const getSurgeText = (multiplier: number) => {
    if (multiplier >= 2.5) return 'High Surge'
    if (multiplier >= 1.5) return 'Medium Surge'
    if (multiplier > 1.0) return 'Low Surge'
    return 'No Surge'
  }

  const renderSurgeZones = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">
              {surgeZones.filter(z => z.isActive).length}
            </div>
            <div className="text-sm text-muted-foreground">Active Zones</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">
              {surgeZones.filter(z => z.surgeMultiplier >= 2.0).length}
            </div>
            <div className="text-sm text-muted-foreground">High Surge Zones</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              £{surgeZones.reduce((sum, z) => sum + z.revenue, 0).toFixed(0)}
            </div>
            <div className="text-sm text-muted-foreground">Total Revenue</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {(surgeZones.reduce((sum, z) => sum + z.customerSatisfaction, 0) / surgeZones.length).toFixed(1)}
            </div>
            <div className="text-sm text-muted-foreground">Avg Satisfaction</div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        {surgeZones.map((zone) => {
          const optimalMultiplier = calculateOptimalMultiplier(zone.currentDemand, zone.currentSupply)
          const isOptimal = Math.abs(zone.surgeMultiplier - optimalMultiplier) < 0.2

          return (
            <Card key={zone.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <Zap className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium">{zone.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        Demand: {zone.currentDemand} | Supply: {zone.currentSupply}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={getSurgeColor(zone.surgeMultiplier)}>
                      {zone.surgeMultiplier.toFixed(1)}x
                    </Badge>
                    <div className="text-sm text-muted-foreground mt-1">
                      {getSurgeText(zone.surgeMultiplier)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-3">
                  <div>
                    <span className="text-muted-foreground">Revenue</span>
                    <p className="font-medium">£{zone.revenue.toFixed(2)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Satisfaction</span>
                    <p className="font-medium">{zone.customerSatisfaction.toFixed(1)}/5</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">D/S Ratio</span>
                    <p className="font-medium">{(zone.currentDemand / Math.max(zone.currentSupply, 1)).toFixed(1)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Optimal</span>
                    <p className="font-medium">{optimalMultiplier.toFixed(1)}x</p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={zone.isActive}
                      onCheckedChange={() => handleZoneToggle(zone.id)}
                    />
                    <span className="text-sm">Surge Active</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {isOptimal ? (
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm">Optimal</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-orange-600">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="text-sm">Needs Adjustment</span>
                      </div>
                    )}
                  </div>
                </div>

                {!isOptimal && (
                  <div className="mt-3 p-2 bg-orange-50 rounded-lg">
                    <div className="flex items-center gap-2 text-orange-800">
                      <Target className="h-4 w-4" />
                      <span className="text-sm">
                        Recommended: {optimalMultiplier.toFixed(1)}x 
                        ({optimalMultiplier > zone.surgeMultiplier ? 'increase' : 'decrease'} by {Math.abs(optimalMultiplier - zone.surgeMultiplier).toFixed(1)})
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
 const renderConfiguration = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Surge Pricing Configuration
          </CardTitle>
          <CardDescription>
            Configure global surge pricing parameters and thresholds
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">Enable Surge Pricing</Label>
              <p className="text-sm text-muted-foreground">
                Globally enable or disable surge pricing across all zones
              </p>
            </div>
            <Switch
              checked={surgeConfig.enabled}
              onCheckedChange={(checked) => handleConfigUpdate('enabled', checked)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label>Maximum Surge Multiplier</Label>
                <div className="flex items-center gap-4 mt-2">
                  <Slider
                    value={[surgeConfig.maxMultiplier]}
                    onValueChange={([value]) => handleConfigUpdate('maxMultiplier', value)}
                    max={5.0}
                    min={1.0}
                    step={0.1}
                    className="flex-1"
                  />
                  <span className="font-medium min-w-[60px]">
                    {surgeConfig.maxMultiplier.toFixed(1)}x
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Maximum surge multiplier allowed
                </p>
              </div>

              <div>
                <Label>Minimum Surge Multiplier</Label>
                <div className="flex items-center gap-4 mt-2">
                  <Slider
                    value={[surgeConfig.minMultiplier]}
                    onValueChange={([value]) => handleConfigUpdate('minMultiplier', value)}
                    max={1.0}
                    min={0.5}
                    step={0.1}
                    className="flex-1"
                  />
                  <span className="font-medium min-w-[60px]">
                    {surgeConfig.minMultiplier.toFixed(1)}x
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Minimum multiplier (can be below 1.0 for discounts)
                </p>
              </div>

              <div>
                <Label>Demand Threshold</Label>
                <div className="flex items-center gap-4 mt-2">
                  <Slider
                    value={[surgeConfig.demandThreshold]}
                    onValueChange={([value]) => handleConfigUpdate('demandThreshold', value)}
                    max={50}
                    min={5}
                    step={1}
                    className="flex-1"
                  />
                  <span className="font-medium min-w-[60px]">
                    {surgeConfig.demandThreshold}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Minimum demand to trigger surge pricing
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label>Supply Threshold</Label>
                <div className="flex items-center gap-4 mt-2">
                  <Slider
                    value={[surgeConfig.supplyThreshold]}
                    onValueChange={([value]) => handleConfigUpdate('supplyThreshold', value)}
                    max={30}
                    min={1}
                    step={1}
                    className="flex-1"
                  />
                  <span className="font-medium min-w-[60px]">
                    {surgeConfig.supplyThreshold}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Maximum supply to maintain surge pricing
                </p>
              </div>

              <div>
                <Label>Cooldown Period (minutes)</Label>
                <div className="flex items-center gap-4 mt-2">
                  <Slider
                    value={[surgeConfig.cooldownPeriod]}
                    onValueChange={([value]) => handleConfigUpdate('cooldownPeriod', value)}
                    max={60}
                    min={5}
                    step={5}
                    className="flex-1"
                  />
                  <span className="font-medium min-w-[60px]">
                    {surgeConfig.cooldownPeriod}m
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Minimum time between surge adjustments
                </p>
              </div>

              <div>
                <Label>Price Elasticity</Label>
                <div className="flex items-center gap-4 mt-2">
                  <Slider
                    value={[Math.abs(surgeConfig.priceElasticity)]}
                    onValueChange={([value]) => handleConfigUpdate('priceElasticity', -value)}
                    max={2.0}
                    min={0.1}
                    step={0.1}
                    className="flex-1"
                  />
                  <span className="font-medium min-w-[60px]">
                    {surgeConfig.priceElasticity.toFixed(1)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Price sensitivity of demand (negative value)
                </p>
              </div>
            </div>
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium">Configuration Impact</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Higher max multiplier increases revenue potential but may reduce demand</li>
                  <li>Lower demand threshold triggers surge pricing more frequently</li>
                  <li>Longer cooldown periods provide price stability but slower adjustments</li>
                  <li>Price elasticity affects how demand responds to price changes</li>
                </ul>
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Algorithm Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">87%</div>
              <div className="text-sm text-muted-foreground">Revenue Optimization</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">4.3</div>
              <div className="text-sm text-muted-foreground">Avg Customer Satisfaction</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">92%</div>
              <div className="text-sm text-muted-foreground">Algorithm Accuracy</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderAnalytics = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Revenue Impact</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Base Revenue</span>
                <span className="font-medium">£4,250</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Surge Revenue</span>
                <span className="font-medium text-green-600">+£1,430</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Revenue</span>
                <span className="font-medium text-lg">£5,680</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Revenue Increase</span>
                <span className="font-medium text-green-600">+33.6%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Customer Impact</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Avg Wait Time</span>
                <span className="font-medium">3.2 min</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Satisfaction Score</span>
                <span className="font-medium">4.3/5</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Completion Rate</span>
                <span className="font-medium">94.2%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Repeat Customers</span>
                <span className="font-medium">78.5%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Surge Effectiveness Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {surgeZones.filter(z => z.isActive).map((zone) => {
              const effectiveness = (zone.revenue / 1000) * zone.customerSatisfaction
              return (
                <div key={zone.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">{zone.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {zone.surgeMultiplier.toFixed(1)}x multiplier
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">
                      {effectiveness.toFixed(1)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Effectiveness Score
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Alert className="border-green-200 bg-green-50/50">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription>
          <div className="space-y-2">
            <p className="font-medium text-green-800">Optimization Insights</p>
            <ul className="list-disc list-inside space-y-1 text-sm text-green-700">
              <li>Surge pricing is generating 33.6% additional revenue</li>
              <li>Customer satisfaction remains high at 4.3/5 average</li>
              <li>Airport zone shows highest effectiveness with 2.8x multiplier</li>
              <li>Consider reducing surge in Shopping District to improve satisfaction</li>
            </ul>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  )

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-2 text-muted-foreground">Loading surge pricing data...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="h-6 w-6" />
            Surge Pricing Optimizer
          </h2>
          <p className="text-muted-foreground">
            AI-powered dynamic pricing optimization for maximum revenue and customer satisfaction
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={surgeConfig.enabled ? "default" : "secondary"}>
            {surgeConfig.enabled ? "Enabled" : "Disabled"}
          </Badge>
          <Button onClick={loadSurgeData} variant="outline">
            Refresh
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="zones" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Surge Zones
          </TabsTrigger>
          <TabsTrigger value="config" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configuration
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="zones" className="mt-6">
          {renderSurgeZones()}
        </TabsContent>

        <TabsContent value="config" className="mt-6">
          {renderConfiguration()}
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          {renderAnalytics()}
        </TabsContent>
      </Tabs>
    </div>
  )
}