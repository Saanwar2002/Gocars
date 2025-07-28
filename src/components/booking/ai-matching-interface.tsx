'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Brain, 
  Car, 
  Star, 
  Clock, 
  MapPin, 
  User, 
  TrendingUp,
  Shield,
  Zap,
  Target,
  CheckCircle,
  AlertTriangle,
  Info,
  BarChart3,
  Lightbulb,
  Award
} from 'lucide-react'
import { 
  aiMatchingService, 
  MatchScore, 
  MatchingRequest 
} from '@/services/aiMatchingService'
import { GeoPoint, Timestamp } from 'firebase/firestore'

interface AIMatchingInterfaceProps {
  userId: string
  pickupLocation: { lat: number; lng: number; address: string }
  dropoffLocation: { lat: number; lng: number; address: string }
  preferences: any
  onDriverSelect?: (match: MatchScore) => void
}

export default function AIMatchingInterface({
  userId,
  pickupLocation,
  dropoffLocation,
  preferences,
  onDriverSelect
}: AIMatchingInterfaceProps) {
  const [matches, setMatches] = useState<MatchScore[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedMatch, setSelectedMatch] = useState<MatchScore | null>(null)
  const [matchingProgress, setMatchingProgress] = useState(0)
  const [activeTab, setActiveTab] = useState('matches')

  useEffect(() => {
    if (pickupLocation && dropoffLocation) {
      findMatches()
    }
  }, [pickupLocation, dropoffLocation, preferences])

  const findMatches = async () => {
    try {
      setLoading(true)
      setMatchingProgress(0)

      // Simulate AI processing with progress updates
      const progressInterval = setInterval(() => {
        setMatchingProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 15
        })
      }, 300)

      const request: MatchingRequest = {
        passengerId: userId,
        pickupLocation: new GeoPoint(pickupLocation.lat, pickupLocation.lng),
        dropoffLocation: new GeoPoint(dropoffLocation.lat, dropoffLocation.lng),
        requestedTime: Timestamp.now(),
        vehicleType: preferences.vehicleType || 'any',
        preferences: {
          driverGender: preferences.driverGender,
          conversationLevel: preferences.conversationLevel || 'friendly',
          musicPreference: preferences.musicPreference || 'any',
          temperaturePreference: preferences.temperaturePreference,
          smokingTolerance: preferences.smokingTolerance || false,
          petTolerance: preferences.petTolerance || false,
          ratingThreshold: preferences.ratingThreshold || 4.0,
          languagePreference: preferences.languagePreference
        },
        urgency: preferences.urgency || 'medium',
        accessibilityNeeds: preferences.accessibilityNeeds,
        createdAt: Timestamp.now()
      }

      const foundMatches = await aiMatchingService.findOptimalMatches(request)
      setMatches(foundMatches)
      setMatchingProgress(100)
      
      setTimeout(() => clearInterval(progressInterval), 100)
    } catch (error) {
      console.error('Error finding matches:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDriverSelect = (match: MatchScore) => {
    setSelectedMatch(match)
    onDriverSelect?.(match)
  }

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600 bg-green-100'
    if (score >= 0.6) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const getScoreText = (score: number) => {
    if (score >= 0.9) return 'Excellent'
    if (score >= 0.8) return 'Very Good'
    if (score >= 0.7) return 'Good'
    if (score >= 0.6) return 'Fair'
    return 'Poor'
  }

  const getFactorIcon = (factor: string) => {
    switch (factor) {
      case 'distance': return <MapPin className="h-4 w-4" />
      case 'availability': return <Clock className="h-4 w-4" />
      case 'preferences': return <User className="h-4 w-4" />
      case 'performance': return <TrendingUp className="h-4 w-4" />
      case 'experience': return <Award className="h-4 w-4" />
      case 'compatibility': return <Target className="h-4 w-4" />
      case 'accessibility': return <Shield className="h-4 w-4" />
      default: return <Star className="h-4 w-4" />
    }
  }

  const renderMatchCard = (match: MatchScore) => (
    <Card 
      key={match.driverId} 
      className={`cursor-pointer transition-all hover:shadow-md ${
        selectedMatch?.driverId === match.driverId ? 'ring-2 ring-primary' : ''
      }`}
      onClick={() => handleDriverSelect(match)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-full">
              <Car className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h4 className="font-medium">Driver #{match.driverId.slice(-6)}</h4>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>{match.estimatedArrivalTime} min away</span>
                <span>•</span>
                <span>£{match.estimatedFare.toFixed(2)}</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <Badge className={getScoreColor(match.totalScore)}>
              {getScoreText(match.totalScore)}
            </Badge>
            <div className="flex items-center gap-1 mt-1">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <span className="text-xs text-muted-foreground">
                {(match.totalScore * 100).toFixed(0)}% match
              </span>
            </div>
          </div>
        </div>

        {/* AI Explanation */}
        <div className="mb-3 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-start gap-2">
            <Brain className="h-4 w-4 text-blue-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-900">AI Analysis</p>
              <p className="text-xs text-blue-700 mt-1">{match.explanation}</p>
            </div>
          </div>
        </div>

        {/* Factor Breakdown */}
        <div className="space-y-2">
          <h5 className="text-sm font-medium">Match Factors</h5>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(match.factors).map(([key, factor]) => (
              <div key={key} className="flex items-center gap-2 text-xs">
                {getFactorIcon(key)}
                <span className="capitalize">{key}</span>
                <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                  <div 
                    className="bg-primary h-1.5 rounded-full" 
                    style={{ width: `${factor.score * 100}%` }}
                  />
                </div>
                <span className="text-muted-foreground">
                  {(factor.score * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Confidence and Risk */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t text-xs">
          <div className="flex items-center gap-2">
            <Zap className="h-3 w-3 text-green-600" />
            <span>Confidence: {(match.confidence * 100).toFixed(0)}%</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="h-3 w-3 text-blue-600" />
            <span>Risk: {(match.riskScore * 100).toFixed(0)}%</span>
          </div>
        </div>

        {selectedMatch?.driverId === match.driverId && (
          <div className="mt-3 p-3 bg-primary/5 rounded-lg">
            <div className="flex items-center gap-2 text-primary">
              <CheckCircle className="h-4 w-4" />
              <span className="font-medium">Driver Selected</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              This driver has been selected based on AI analysis of your preferences and requirements.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )

  const renderAnalytics = () => (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Matching Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{matches.length}</div>
              <div className="text-sm text-muted-foreground">Available Drivers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {matches.length > 0 ? (matches[0].totalScore * 100).toFixed(0) : 0}%
              </div>
              <div className="text-sm text-muted-foreground">Best Match Score</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {matches.length > 0 ? matches[0].estimatedArrivalTime : 0}
              </div>
              <div className="text-sm text-muted-foreground">Min ETA</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {matches.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              AI Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900">Best Match Analysis</p>
                  <p className="text-xs text-blue-700 mt-1">
                    {matches[0].explanation}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 bg-green-50 rounded-lg">
                  <h4 className="text-sm font-medium text-green-900 mb-2">Strengths</h4>
                  <ul className="text-xs text-green-700 space-y-1">
                    {Object.entries(matches[0].factors)
                      .filter(([_, factor]) => factor.score > 0.7)
                      .map(([key, factor]) => (
                        <li key={key} className="flex items-center gap-2">
                          <CheckCircle className="h-3 w-3" />
                          <span className="capitalize">{key}: {factor.explanation}</span>
                        </li>
                      ))}
                  </ul>
                </div>

                <div className="p-3 bg-yellow-50 rounded-lg">
                  <h4 className="text-sm font-medium text-yellow-900 mb-2">Considerations</h4>
                  <ul className="text-xs text-yellow-700 space-y-1">
                    {Object.entries(matches[0].factors)
                      .filter(([_, factor]) => factor.score <= 0.7)
                      .map(([key, factor]) => (
                        <li key={key} className="flex items-center gap-2">
                          <AlertTriangle className="h-3 w-3" />
                          <span className="capitalize">{key}: {factor.explanation}</span>
                        </li>
                      ))}
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Driver Matching
          </CardTitle>
          <CardDescription>
            Using machine learning to find your perfect driver match
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Analyzing preferences and driver compatibility...</span>
              <span>{matchingProgress}%</span>
            </div>
            <Progress value={matchingProgress} className="h-2" />
          </div>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
              <span>Processing location and route data</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
              <span>Analyzing driver availability and performance</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
              <span>Calculating compatibility scores</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
              <span>Applying machine learning optimizations</span>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (matches.length === 0) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-2">
            <p className="font-medium">No drivers found</p>
            <p>Our AI couldn't find any drivers matching your criteria. Try:</p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Adjusting your preferences</li>
              <li>Expanding your pickup area</li>
              <li>Scheduling for a different time</li>
            </ul>
          </div>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI-Powered Driver Matching
          </h3>
          <p className="text-sm text-muted-foreground">
            {matches.length} driver{matches.length !== 1 ? 's' : ''} found using machine learning analysis
          </p>
        </div>
        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
          AI Enhanced
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="matches" className="flex items-center gap-2">
            <Car className="h-4 w-4" />
            Driver Matches ({matches.length})
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            AI Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="matches" className="space-y-3">
          {matches.map(match => renderMatchCard(match))}
        </TabsContent>

        <TabsContent value="analytics">
          {renderAnalytics()}
        </TabsContent>
      </Tabs>

      {/* AI Explanation Footer */}
      <Alert>
        <Brain className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-2">
            <p className="font-medium">How AI Matching Works</p>
            <p className="text-sm">
              Our machine learning algorithm analyzes multiple factors including distance, driver performance, 
              your preferences, accessibility needs, and historical success patterns to find the best driver match. 
              The system continuously learns from feedback to improve future recommendations.
            </p>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  )
}