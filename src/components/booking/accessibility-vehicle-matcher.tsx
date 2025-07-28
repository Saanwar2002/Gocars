'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Car, 
  Wheelchair, 
  Baby, 
  Heart, 
  Languages, 
  Shield, 
  Star,
  Clock,
  MapPin,
  Phone,
  CheckCircle,
  AlertTriangle,
  Info,
  User,
  Award
} from 'lucide-react'
import { 
  accessibilityService, 
  AccessibilityVehicle, 
  AccessibilityProfile 
} from '@/services/accessibilityService'

interface AccessibilityVehicleMatcherProps {
  userId: string
  pickupLocation: { lat: number; lng: number }
  accessibilityProfile?: AccessibilityProfile
  onVehicleSelect?: (vehicle: AccessibilityVehicle) => void
}

export default function AccessibilityVehicleMatcher({
  userId,
  pickupLocation,
  accessibilityProfile,
  onVehicleSelect
}: AccessibilityVehicleMatcherProps) {
  const [availableVehicles, setAvailableVehicles] = useState<AccessibilityVehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedVehicle, setSelectedVehicle] = useState<AccessibilityVehicle | null>(null)
  const [matchingProgress, setMatchingProgress] = useState(0)

  useEffect(() => {
    findAccessibleVehicles()
  }, [pickupLocation, accessibilityProfile])

  const findAccessibleVehicles = async () => {
    try {
      setLoading(true)
      setMatchingProgress(0)

      // Simulate matching progress
      const progressInterval = setInterval(() => {
        setMatchingProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      const requirements = {
        wheelchairAccessible: accessibilityProfile?.mobilityNeeds.requiresWheelchairAccessibleVehicle || false,
        childSeatRequired: accessibilityProfile?.childNeeds.requiresChildSeat || false,
        serviceAnimalFriendly: accessibilityProfile?.animalNeeds.hasServiceAnimal || false,
        location: pickupLocation,
        radius: 10 // 10km radius
      }

      const vehicles = await accessibilityService.findAccessibleVehicles(requirements)
      
      // Sort by compatibility score
      const scoredVehicles = vehicles.map(vehicle => ({
        ...vehicle,
        compatibilityScore: calculateCompatibilityScore(vehicle, accessibilityProfile)
      })).sort((a, b) => b.compatibilityScore - a.compatibilityScore)

      setAvailableVehicles(scoredVehicles)
      setMatchingProgress(100)
      
      setTimeout(() => clearInterval(progressInterval), 100)
    } catch (error) {
      console.error('Error finding accessible vehicles:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateCompatibilityScore = (vehicle: AccessibilityVehicle, profile?: AccessibilityProfile): number => {
    if (!profile) return 0.5

    let score = 0
    let factors = 0

    // Mobility compatibility
    if (profile.mobilityNeeds.requiresWheelchairAccessibleVehicle) {
      factors++
      if (vehicle.features.wheelchairAccessible) score++
    }

    // Child safety compatibility
    if (profile.childNeeds.requiresChildSeat) {
      factors++
      if (vehicle.features.childSeatCapacity >= profile.childNeeds.numberOfChildren) score++
    }

    // Service animal compatibility
    if (profile.animalNeeds.hasServiceAnimal) {
      factors++
      if (vehicle.features.serviceAnimalFriendly) score++
    }

    // Language compatibility
    if (profile.languageNeeds.requiresTranslation) {
      factors++
      if (vehicle.driverCapabilities.languagesSpoken.includes(profile.languageNeeds.primaryLanguage)) {
        score++
      }
    }

    // Hearing accessibility
    if (profile.hearingNeeds.requiresSignLanguageInterpreter) {
      factors++
      if (vehicle.driverCapabilities.signLanguageCapable) score++
    }

    // Visual accessibility
    if (profile.visualNeeds.requiresAudioAnnouncements) {
      factors++
      if (vehicle.features.audioAnnouncements) score++
    }

    return factors > 0 ? score / factors : 0.5
  }

  const handleVehicleSelect = (vehicle: AccessibilityVehicle) => {
    setSelectedVehicle(vehicle)
    onVehicleSelect?.(vehicle)
  }

  const getFeatureIcon = (feature: string) => {
    switch (feature) {
      case 'wheelchairAccessible': return <Wheelchair className="h-4 w-4" />
      case 'childSeatCapacity': return <Baby className="h-4 w-4" />
      case 'serviceAnimalFriendly': return <Heart className="h-4 w-4" />
      case 'audioAnnouncements': return <Languages className="h-4 w-4" />
      default: return <CheckCircle className="h-4 w-4" />
    }
  }

  const getCompatibilityColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600 bg-green-100'
    if (score >= 0.6) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const getCompatibilityText = (score: number) => {
    if (score >= 0.8) return 'Excellent Match'
    if (score >= 0.6) return 'Good Match'
    if (score >= 0.4) return 'Partial Match'
    return 'Limited Match'
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Finding Accessible Vehicles
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Searching for compatible vehicles...</span>
              <span>{matchingProgress}%</span>
            </div>
            <Progress value={matchingProgress} className="h-2" />
          </div>
          <div className="text-sm text-muted-foreground">
            Analyzing accessibility requirements and driver capabilities
          </div>
        </CardContent>
      </Card>
    )
  }

  if (availableVehicles.length === 0) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-2">
            <p className="font-medium">No accessible vehicles found</p>
            <p>We couldn't find vehicles that match your accessibility requirements in your area. Please try:</p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Expanding your search radius</li>
              <li>Adjusting your requirements if possible</li>
              <li>Scheduling your ride for a later time</li>
              <li>Contacting our accessibility support team</li>
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
          <h3 className="text-lg font-semibold">Accessible Vehicles Available</h3>
          <p className="text-sm text-muted-foreground">
            {availableVehicles.length} vehicle{availableVehicles.length !== 1 ? 's' : ''} found matching your needs
          </p>
        </div>
        <Badge variant="secondary" className="bg-green-100 text-green-800">
          {availableVehicles.length} Available
        </Badge>
      </div>

      <div className="space-y-3">
        {availableVehicles.map((vehicle) => (
          <Card 
            key={vehicle.id} 
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedVehicle?.id === vehicle.id ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => handleVehicleSelect(vehicle)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <Car className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium">Accessible Vehicle #{vehicle.vehicleId.slice(-6)}</h4>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-3 w-3" />
                      <span>Driver ID: {vehicle.driverId.slice(-6)}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <Badge className={getCompatibilityColor((vehicle as any).compatibilityScore)}>
                    {getCompatibilityText((vehicle as any).compatibilityScore)}
                  </Badge>
                  <div className="flex items-center gap-1 mt-1">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-xs text-muted-foreground">
                      {((vehicle as any).compatibilityScore * 100).toFixed(0)}% match
                    </span>
                  </div>
                </div>
              </div>

              {/* Vehicle Features */}
              <div className="space-y-3">
                <div>
                  <h5 className="text-sm font-medium mb-2">Vehicle Features</h5>
                  <div className="flex flex-wrap gap-2">
                    {vehicle.features.wheelchairAccessible && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Wheelchair className="h-3 w-3" />
                        Wheelchair Accessible
                      </Badge>
                    )}
                    {vehicle.features.childSeatCapacity > 0 && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Baby className="h-3 w-3" />
                        {vehicle.features.childSeatCapacity} Child Seats
                      </Badge>
                    )}
                    {vehicle.features.serviceAnimalFriendly && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Heart className="h-3 w-3" />
                        Service Animal Friendly
                      </Badge>
                    )}
                    {vehicle.features.audioAnnouncements && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Languages className="h-3 w-3" />
                        Audio Announcements
                      </Badge>
                    )}
                    {vehicle.features.hearingLoopSystem && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Ear className="h-3 w-3" />
                        Hearing Loop
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Driver Capabilities */}
                <div>
                  <h5 className="text-sm font-medium mb-2">Driver Capabilities</h5>
                  <div className="flex flex-wrap gap-2">
                    {vehicle.driverCapabilities.disabilityAwarenessTraining && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Award className="h-3 w-3" />
                        Disability Awareness
                      </Badge>
                    )}
                    {vehicle.driverCapabilities.signLanguageCapable && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Languages className="h-3 w-3" />
                        Sign Language
                      </Badge>
                    )}
                    {vehicle.driverCapabilities.firstAidCertified && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Shield className="h-3 w-3" />
                        First Aid Certified
                      </Badge>
                    )}
                    {vehicle.driverCapabilities.childSafetyTraining && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Baby className="h-3 w-3" />
                        Child Safety
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Languages Spoken */}
                {vehicle.driverCapabilities.languagesSpoken.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium mb-2">Languages Spoken</h5>
                    <div className="flex flex-wrap gap-1">
                      {vehicle.driverCapabilities.languagesSpoken.map((lang, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {lang.toUpperCase()}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Equipment Available */}
                <div>
                  <h5 className="text-sm font-medium mb-2">Equipment Available</h5>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {vehicle.equipment.wheelchairSecurement && (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-600" />
                        <span>Wheelchair Securement</span>
                      </div>
                    )}
                    {vehicle.equipment.transferBoard && (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-600" />
                        <span>Transfer Board</span>
                      </div>
                    )}
                    {vehicle.equipment.childSeats.length > 0 && (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-600" />
                        <span>{vehicle.equipment.childSeats.join(', ')}</span>
                      </div>
                    )}
                    {vehicle.equipment.communicationDevices && (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-600" />
                        <span>Communication Devices</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Certification Info */}
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                  <div className="flex items-center gap-2">
                    <Shield className="h-3 w-3" />
                    <span>Last inspected: {vehicle.lastInspection.toDate().toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Award className="h-3 w-3" />
                    <span>Certified until: {vehicle.certificationExpiry.toDate().toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {selectedVehicle?.id === vehicle.id && (
                <div className="mt-4 p-3 bg-primary/5 rounded-lg">
                  <div className="flex items-center gap-2 text-primary">
                    <CheckCircle className="h-4 w-4" />
                    <span className="font-medium">Vehicle Selected</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    This vehicle has been selected for your accessible ride booking.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Additional Information */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-2">
            <p className="font-medium">Accessibility Support</p>
            <p className="text-sm">
              All our accessible vehicles undergo regular inspections and our drivers receive specialized training. 
              If you need additional assistance or have specific requirements, please contact our accessibility support team.
            </p>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Phone className="h-3 w-3" />
                <span>Accessibility Hotline: 0800-ACCESS</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3" />
                <span>24/7 Support Available</span>
              </div>
            </div>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  )
}