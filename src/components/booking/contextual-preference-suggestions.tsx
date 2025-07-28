'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Brain, 
  MapPin, 
  Clock, 
  Calendar, 
  Cloud, 
  TrendingUp,
  Lightbulb,
  Target,
  Zap,
  CheckCircle,
  X
} from 'lucide-react'
import { 
  bookingPreferenceService, 
  BookingPreference, 
  PreferenceSuggestion,
  ContextualPreferences 
} from '@/services/bookingPreferenceService'

interface ContextualPreferenceSuggestionsProps {
  userId: string
  currentContext: ContextualPreferences
  onApplySuggestion?: (suggestion: PreferenceSuggestion) => void
  onDismissSuggestion?: (suggestionId: string) => void
}

export default function ContextualPreferenceSuggestions({
  userId,
  currentContext,
  onApplySuggestion,
  onDismissSuggestion
}: ContextualPreferenceSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<PreferenceSuggestion[]>([])
  const [contextualPreference, setContextualPreference] = useState<BookingPreference | null>(null)
  const [loading, setLoading] = useState(true)
  const [appliedSuggestions, setAppliedSuggestions] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadContextualSuggestions()
  }, [userId, currentContext])

  const loadContextualSuggestions = async () => {
    try {
      setLoading(true)
      
      // Get contextual preferences
      const contextPref = await bookingPreferenceService.getContextualPreferences(userId, currentContext)
      setContextualPreference(contextPref)
      
      // Generate contextual suggestions
      const contextSuggestions = await generateContextualSuggestions(currentContext, contextPref)
      setSuggestions(contextSuggestions)
    } catch (error) {
      console.error('Error loading contextual suggestions:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateContextualSuggestions = async (
    context: ContextualPreferences, 
    preference: BookingPreference | null
  ): Promise<PreferenceSuggestion[]> => {
    const suggestions: PreferenceSuggestion[] = []

    if (!preference) return suggestions

    // Time-based suggestions
    if (context.timeOfDay === 'morning' && context.dayOfWeek === 'weekday') {
      suggestions.push({
        id: `morning_commute_${Date.now()}`,
        type: 'route',
        suggestion: 'Enable fastest route for morning commute',
        reasoning: 'Morning commutes typically benefit from the fastest route to avoid traffic delays',
        confidence: 0.9,
        impact: 'medium',
        context: 'work_commute',
        data: { routePreference: 'fastest', avoidTolls: false }
      })

      if (!preference.vehicleFeatures.phoneCharger) {
        suggestions.push({
          id: `phone_charger_${Date.now()}`,
          type: 'vehicle',
          suggestion: 'Request phone charger for morning rides',
          reasoning: 'Start your day with a fully charged phone for work',
          confidence: 0.8,
          impact: 'low',
          context: 'work_commute',
          data: { vehicleFeature: 'phoneCharger' }
        })
      }
    }

    // Evening/night suggestions
    if (context.timeOfDay === 'evening' || context.timeOfDay === 'night') {
      suggestions.push({
        id: `evening_safety_${Date.now()}`,
        type: 'safety',
        suggestion: 'Enable enhanced safety features for evening rides',
        reasoning: 'Evening rides benefit from additional safety measures like location sharing',
        confidence: 0.85,
        impact: 'high',
        context: 'evening_safety',
        data: { 
          shareLocationWithContacts: true, 
          requireDriverPhoto: true,
          emergencyContactNotification: true 
        }
      })

      if (preference.driverPreferences.conversationLevel === 'chatty') {
        suggestions.push({
          id: `quiet_evening_${Date.now()}`,
          type: 'driver',
          suggestion: 'Consider quiet drivers for evening rides',
          reasoning: 'Evening rides are often more relaxing with minimal conversation',
          confidence: 0.7,
          impact: 'low',
          context: 'evening_comfort',
          data: { conversationLevel: 'quiet' }
        })
      }
    }

    // Weekend suggestions
    if (context.dayOfWeek === 'weekend') {
      suggestions.push({
        id: `weekend_scenic_${Date.now()}`,
        type: 'route',
        suggestion: 'Try scenic routes for weekend trips',
        reasoning: 'Weekend rides are perfect for enjoying scenic routes and exploring',
        confidence: 0.75,
        impact: 'medium',
        context: 'weekend_leisure',
        data: { preferScenicRoute: true, allowDetours: true }
      })

      if (preference.vehicleType === 'economy') {
        suggestions.push({
          id: `weekend_comfort_${Date.now()}`,
          type: 'vehicle',
          suggestion: 'Upgrade to comfort vehicles for weekend trips',
          reasoning: 'Weekend trips are more enjoyable with comfortable vehicles',
          confidence: 0.6,
          impact: 'medium',
          context: 'weekend_comfort',
          data: { vehicleType: 'comfort' }
        })
      }
    }

    // Weather-based suggestions
    if (context.weather === 'rain' || context.weather === 'snow') {
      suggestions.push({
        id: `weather_safety_${Date.now()}`,
        type: 'route',
        suggestion: 'Avoid highways in bad weather',
        reasoning: 'Highway driving can be more dangerous in rain or snow conditions',
        confidence: 0.9,
        impact: 'high',
        context: 'weather_safety',
        data: { avoidHighways: true, preferFastestRoute: false }
      })
    }

    // Traffic-based suggestions
    if (context.traffic === 'heavy') {
      suggestions.push({
        id: `traffic_route_${Date.now()}`,
        type: 'route',
        suggestion: 'Allow detours to avoid heavy traffic',
        reasoning: 'Detours can significantly reduce travel time during heavy traffic',
        confidence: 0.85,
        impact: 'high',
        context: 'traffic_optimization',
        data: { allowDetours: true, maxDetourMinutes: 20 }
      })
    }

    // Distance-based suggestions
    const distance = calculateDistance(context.location, context.destination)
    if (distance > 50) { // Long distance trip
      suggestions.push({
        id: `long_distance_${Date.now()}`,
        type: 'comfort',
        suggestion: 'Upgrade comfort settings for long trips',
        reasoning: 'Long distance trips are more comfortable with premium features',
        confidence: 0.8,
        impact: 'medium',
        context: 'long_distance',
        data: { 
          vehicleType: 'comfort',
          musicVolume: 'low',
          temperature: 22
        }
      })
    }

    // Purpose-based suggestions
    if (context.purpose === 'business') {
      suggestions.push({
        id: `business_professional_${Date.now()}`,
        type: 'vehicle',
        suggestion: 'Select premium vehicle for business meetings',
        reasoning: 'Professional appearance matters for business meetings',
        confidence: 0.9,
        impact: 'high',
        context: 'business_professional',
        data: { 
          vehicleType: 'premium',
          conversationLevel: 'quiet',
          requireVehiclePhoto: true
        }
      })
    }

    if (context.purpose === 'airport') {
      suggestions.push({
        id: `airport_luggage_${Date.now()}`,
        type: 'vehicle',
        suggestion: 'Request larger vehicle for airport trips',
        reasoning: 'Airport trips often involve luggage and benefit from extra space',
        confidence: 0.85,
        impact: 'medium',
        context: 'airport_travel',
        data: { 
          vehicleType: 'comfort',
          allowDetours: false,
          preferFastestRoute: true
        }
      })
    }

    return suggestions.filter(s => !appliedSuggestions.has(s.id))
  }

  const calculateDistance = (from: { lat: number; lng: number }, to: { lat: number; lng: number }): number => {
    const R = 6371 // Earth's radius in km
    const dLat = (to.lat - from.lat) * Math.PI / 180
    const dLng = (to.lng - from.lng) * Math.PI / 180
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(from.lat * Math.PI / 180) * Math.cos(to.lat * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  const handleApplySuggestion = async (suggestion: PreferenceSuggestion) => {
    try {
      setAppliedSuggestions(prev => new Set([...prev, suggestion.id]))
      onApplySuggestion?.(suggestion)
    } catch (error) {
      console.error('Error applying suggestion:', error)
      setAppliedSuggestions(prev => {
        const newSet = new Set(prev)
        newSet.delete(suggestion.id)
        return newSet
      })
    }
  }

  const handleDismissSuggestion = (suggestionId: string) => {
    setSuggestions(prev => prev.filter(s => s.id !== suggestionId))
    onDismissSuggestion?.(suggestionId)
  }

  const getContextDescription = (context: ContextualPreferences): string => {
    const parts = []
    
    if (context.timeOfDay) {
      parts.push(context.timeOfDay)
    }
    
    if (context.dayOfWeek) {
      parts.push(context.dayOfWeek)
    }
    
    if (context.purpose) {
      parts.push(context.purpose)
    }
    
    if (context.weather) {
      parts.push(`${context.weather} weather`)
    }
    
    if (context.traffic) {
      parts.push(`${context.traffic} traffic`)
    }
    
    return parts.join(', ')
  }

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'vehicle': return <Target className="h-4 w-4" />
      case 'driver': return <Target className="h-4 w-4" />
      case 'route': return <MapPin className="h-4 w-4" />
      case 'comfort': return <Zap className="h-4 w-4" />
      case 'safety': return <CheckCircle className="h-4 w-4" />
      default: return <Lightbulb className="h-4 w-4" />
    }
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <span className="ml-2 text-muted-foreground">Analyzing context...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (suggestions.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-6">
          <Brain className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-muted-foreground">
            No contextual suggestions available for this trip
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Context Header */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg text-blue-900">Smart Suggestions</CardTitle>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              AI-Powered
            </Badge>
          </div>
          <CardDescription className="text-blue-700">
            Based on your current context: {getContextDescription(currentContext)}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Context Details */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
          <Clock className="h-4 w-4 text-gray-600" />
          <span className="text-sm capitalize">{currentContext.timeOfDay}</span>
        </div>
        <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
          <Calendar className="h-4 w-4 text-gray-600" />
          <span className="text-sm capitalize">{currentContext.dayOfWeek}</span>
        </div>
        {currentContext.weather && (
          <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
            <Cloud className="h-4 w-4 text-gray-600" />
            <span className="text-sm capitalize">{currentContext.weather}</span>
          </div>
        )}
        {currentContext.traffic && (
          <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
            <TrendingUp className="h-4 w-4 text-gray-600" />
            <span className="text-sm capitalize">{currentContext.traffic} traffic</span>
          </div>
        )}
      </div>

      {/* Suggestions */}
      <div className="space-y-3">
        {suggestions.map((suggestion) => (
          <Card 
            key={suggestion.id} 
            className={`transition-all hover:shadow-md ${
              appliedSuggestions.has(suggestion.id) ? 'opacity-50' : ''
            }`}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className="bg-primary/10 p-2 rounded-full">
                    {getSuggestionIcon(suggestion.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="capitalize">
                        {suggestion.type}
                      </Badge>
                      <Badge className={getImpactColor(suggestion.impact)}>
                        {suggestion.impact} impact
                      </Badge>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span className="text-xs text-muted-foreground">
                          {(suggestion.confidence * 100).toFixed(0)}% confidence
                        </span>
                      </div>
                    </div>
                    <h4 className="font-medium mb-1">{suggestion.suggestion}</h4>
                    <p className="text-sm text-muted-foreground mb-2">{suggestion.reasoning}</p>
                    {suggestion.context && (
                      <Badge variant="secondary" className="text-xs">
                        {suggestion.context.replace('_', ' ')}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  {!appliedSuggestions.has(suggestion.id) ? (
                    <>
                      <Button
                        size="sm"
                        onClick={() => handleApplySuggestion(suggestion)}
                        className="flex items-center gap-1"
                      >
                        <CheckCircle className="h-3 w-3" />
                        Apply
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDismissSuggestion(suggestion.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </>
                  ) : (
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Applied
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Summary */}
      <Card className="border-green-200 bg-green-50/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-green-800">
            <Lightbulb className="h-4 w-4" />
            <span className="text-sm font-medium">
              {suggestions.length} suggestions available to optimize your ride experience
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}