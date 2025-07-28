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
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Accessibility, 
  Wheelchair, 
  Baby, 
  Heart, 
  Languages, 
  Eye, 
  Ear, 
  Brain,
  Shield,
  Phone,
  AlertTriangle,
  CheckCircle,
  Info,
  Plus,
  Minus,
  User
} from 'lucide-react'
import { 
  accessibilityService, 
  AccessibilityProfile 
} from '@/services/accessibilityService'

interface AccessibilityBookingProps {
  userId: string
  onProfileUpdate?: (profile: AccessibilityProfile) => void
  onBookingRequirements?: (requirements: any) => void
}

export default function AccessibilityBooking({ 
  userId, 
  onProfileUpdate, 
  onBookingRequirements 
}: AccessibilityBookingProps) {
  const [profile, setProfile] = useState<AccessibilityProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('mobility')
  const [recommendations, setRecommendations] = useState<any>(null)

  useEffect(() => {
    loadAccessibilityProfile()
  }, [userId])

  const loadAccessibilityProfile = async () => {
    try {
      setLoading(true)
      const profiles = await accessibilityService.getUserAccessibilityProfiles(userId)
      
      if (profiles.length === 0) {
        // Create default profile
        const defaultProfile = accessibilityService.createDefaultAccessibilityProfile(userId)
        const profileId = await accessibilityService.createAccessibilityProfile(defaultProfile)
        const newProfile = { ...defaultProfile, id: profileId } as AccessibilityProfile
        setProfile(newProfile)
      } else {
        setProfile(profiles[0])
      }
      
      // Get recommendations
      const recs = await accessibilityService.getAccessibilityRecommendations(userId, {})
      setRecommendations(recs)
    } catch (error) {
      console.error('Error loading accessibility profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateProfile = async (updates: Partial<AccessibilityProfile>) => {
    if (!profile?.id) return

    try {
      setSaving(true)
      const updatedProfile = { ...profile, ...updates }
      await accessibilityService.updateAccessibilityProfile(profile.id, updates)
      setProfile(updatedProfile)
      onProfileUpdate?.(updatedProfile)
      
      // Update recommendations
      const recs = await accessibilityService.getAccessibilityRecommendations(userId, {})
      setRecommendations(recs)
    } catch (error) {
      console.error('Error updating profile:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleEmergencyContactChange = (index: number, field: string, value: string) => {
    if (!profile) return

    const updatedContacts = [...profile.emergencyInfo.emergencyContacts]
    updatedContacts[index] = { ...updatedContacts[index], [field]: value }
    
    handleUpdateProfile({
      emergencyInfo: {
        ...profile.emergencyInfo,
        emergencyContacts: updatedContacts
      }
    })
  }

  const addEmergencyContact = () => {
    if (!profile) return

    const newContact = {
      name: '',
      relationship: '',
      phone: '',
      isCaregiver: false
    }

    handleUpdateProfile({
      emergencyInfo: {
        ...profile.emergencyInfo,
        emergencyContacts: [...profile.emergencyInfo.emergencyContacts, newContact]
      }
    })
  }

  const removeEmergencyContact = (index: number) => {
    if (!profile) return

    const updatedContacts = profile.emergencyInfo.emergencyContacts.filter((_, i) => i !== index)
    
    handleUpdateProfile({
      emergencyInfo: {
        ...profile.emergencyInfo,
        emergencyContacts: updatedContacts
      }
    })
  }

  const validateAndGetBookingRequirements = () => {
    if (!profile) return

    const validation = accessibilityService.validateAccessibilityRequirements(profile)
    
    if (!validation.isValid) {
      alert(`Please fix the following issues:\n${validation.errors.join('\n')}`)
      return
    }

    const requirements = {
      wheelchairAccessible: profile.mobilityNeeds.requiresWheelchairAccessibleVehicle,
      childSeatRequired: profile.childNeeds.requiresChildSeat,
      serviceAnimalFriendly: profile.animalNeeds.hasServiceAnimal,
      languageRequirements: profile.languageNeeds.requiresTranslation ? profile.languageNeeds.preferredLanguages : [],
      specialInstructions: profile.emergencyInfo.specialInstructions,
      estimatedAdditionalCost: recommendations?.estimatedAdditionalCost || 0
    }

    onBookingRequirements?.(requirements)
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-2 text-muted-foreground">Loading accessibility settings...</p>
      </div>
    )
  }

  if (!profile) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Unable to load accessibility profile. Please try again.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Accessibility className="h-6 w-6" />
            Accessibility & Special Needs
          </h2>
          <p className="text-muted-foreground">
            Configure your accessibility requirements for a comfortable ride experience
          </p>
        </div>
        <Button 
          onClick={validateAndGetBookingRequirements}
          className="flex items-center gap-2"
        >
          <CheckCircle className="h-4 w-4" />
          Apply to Booking
        </Button>
      </div>

      {/* Recommendations */}
      {recommendations && recommendations.recommendedAccommodations.length > 0 && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium">Recommended accommodations for your needs:</p>
              <ul className="list-disc list-inside space-y-1">
                {recommendations.recommendedAccommodations.map((rec: string, index: number) => (
                  <li key={index} className="text-sm">{rec}</li>
                ))}
              </ul>
              {recommendations.estimatedAdditionalCost > 0 && (
                <p className="text-sm font-medium">
                  Estimated additional cost: £{recommendations.estimatedAdditionalCost.toFixed(2)}
                </p>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="mobility" className="flex items-center gap-1">
            <Wheelchair className="h-3 w-3" />
            Mobility
          </TabsTrigger>
          <TabsTrigger value="visual" className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            Visual
          </TabsTrigger>
          <TabsTrigger value="hearing" className="flex items-center gap-1">
            <Ear className="h-3 w-3" />
            Hearing
          </TabsTrigger>
          <TabsTrigger value="cognitive" className="flex items-center gap-1">
            <Brain className="h-3 w-3" />
            Cognitive
          </TabsTrigger>
          <TabsTrigger value="child" className="flex items-center gap-1">
            <Baby className="h-3 w-3" />
            Child
          </TabsTrigger>
          <TabsTrigger value="animal" className="flex items-center gap-1">
            <Heart className="h-3 w-3" />
            Animal
          </TabsTrigger>
          <TabsTrigger value="language" className="flex items-center gap-1">
            <Languages className="h-3 w-3" />
            Language
          </TabsTrigger>
        </TabsList>

        <TabsContent value="mobility" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wheelchair className="h-5 w-5" />
                Mobility Accessibility
              </CardTitle>
              <CardDescription>
                Configure mobility assistance and wheelchair accessibility options
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>I am a wheelchair user</Label>
                <Switch
                  checked={profile.mobilityNeeds.wheelchairUser}
                  onCheckedChange={(checked) =>
                    handleUpdateProfile({
                      mobilityNeeds: { ...profile.mobilityNeeds, wheelchairUser: checked }
                    })
                  }
                />
              </div>

              {profile.mobilityNeeds.wheelchairUser && (
                <div className="space-y-4 pl-4 border-l-2 border-blue-200">
                  <div>
                    <Label>Wheelchair Type</Label>
                    <Select
                      value={profile.mobilityNeeds.wheelchairType}
                      onValueChange={(value: any) =>
                        handleUpdateProfile({
                          mobilityNeeds: { ...profile.mobilityNeeds, wheelchairType: value }
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual">Manual wheelchair</SelectItem>
                        <SelectItem value="electric">Electric wheelchair</SelectItem>
                        <SelectItem value="scooter">Mobility scooter</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Requires wheelchair accessible vehicle</Label>
                    <Switch
                      checked={profile.mobilityNeeds.requiresWheelchairAccessibleVehicle}
                      onCheckedChange={(checked) =>
                        handleUpdateProfile({
                          mobilityNeeds: { ...profile.mobilityNeeds, requiresWheelchairAccessibleVehicle: checked }
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Requires ramp access</Label>
                    <Switch
                      checked={profile.mobilityNeeds.requiresRampAccess}
                      onCheckedChange={(checked) =>
                        handleUpdateProfile({
                          mobilityNeeds: { ...profile.mobilityNeeds, requiresRampAccess: checked }
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Requires lift access</Label>
                    <Switch
                      checked={profile.mobilityNeeds.requiresLiftAccess}
                      onCheckedChange={(checked) =>
                        handleUpdateProfile({
                          mobilityNeeds: { ...profile.mobilityNeeds, requiresLiftAccess: checked }
                        })
                      }
                    />
                  </div>
                </div>
              )}

              <div>
                <Label>Mobility aid type (if applicable)</Label>
                <Select
                  value={profile.mobilityNeeds.mobilityAidType || 'none'}
                  onValueChange={(value) =>
                    handleUpdateProfile({
                      mobilityNeeds: { 
                        ...profile.mobilityNeeds, 
                        mobilityAidType: value === 'none' ? undefined : value as any
                      }
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="walker">Walker</SelectItem>
                    <SelectItem value="crutches">Crutches</SelectItem>
                    <SelectItem value="cane">Cane</SelectItem>
                    <SelectItem value="prosthetic">Prosthetic</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label>Requires transfer assistance</Label>
                <Switch
                  checked={profile.mobilityNeeds.transferAssistanceNeeded}
                  onCheckedChange={(checked) =>
                    handleUpdateProfile({
                      mobilityNeeds: { ...profile.mobilityNeeds, transferAssistanceNeeded: checked }
                    })
                  }
                />
              </div>

              <div>
                <Label>Preferred seating position</Label>
                <Select
                  value={profile.mobilityNeeds.preferredSeatingPosition}
                  onValueChange={(value: any) =>
                    handleUpdateProfile({
                      mobilityNeeds: { ...profile.mobilityNeeds, preferredSeatingPosition: value }
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="front">Front seat</SelectItem>
                    <SelectItem value="back">Back seat</SelectItem>
                    <SelectItem value="wheelchair_space">Wheelchair space</SelectItem>
                    <SelectItem value="any">Any</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="visual" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Visual Accessibility
              </CardTitle>
              <CardDescription>
                Configure visual assistance and display preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>I am blind</Label>
                <Switch
                  checked={profile.visualNeeds.isBlind}
                  onCheckedChange={(checked) =>
                    handleUpdateProfile({
                      visualNeeds: { ...profile.visualNeeds, isBlind: checked }
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>I am partially blind</Label>
                <Switch
                  checked={profile.visualNeeds.isPartiallyBlind}
                  onCheckedChange={(checked) =>
                    handleUpdateProfile({
                      visualNeeds: { ...profile.visualNeeds, isPartiallyBlind: checked }
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>I have a service animal</Label>
                <Switch
                  checked={profile.visualNeeds.requiresServiceAnimal}
                  onCheckedChange={(checked) =>
                    handleUpdateProfile({
                      visualNeeds: { ...profile.visualNeeds, requiresServiceAnimal: checked }
                    })
                  }
                />
              </div>

              {profile.visualNeeds.requiresServiceAnimal && (
                <div className="pl-4 border-l-2 border-blue-200">
                  <Label>Service animal type</Label>
                  <Select
                    value={profile.visualNeeds.serviceAnimalType || 'guide_dog'}
                    onValueChange={(value: any) =>
                      handleUpdateProfile({
                        visualNeeds: { ...profile.visualNeeds, serviceAnimalType: value }
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="guide_dog">Guide dog</SelectItem>
                      <SelectItem value="other">Other service animal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex items-center justify-between">
                <Label>Requires audio announcements</Label>
                <Switch
                  checked={profile.visualNeeds.requiresAudioAnnouncements}
                  onCheckedChange={(checked) =>
                    handleUpdateProfile({
                      visualNeeds: { ...profile.visualNeeds, requiresAudioAnnouncements: checked }
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Requires large text display</Label>
                <Switch
                  checked={profile.visualNeeds.requiresLargeTextDisplay}
                  onCheckedChange={(checked) =>
                    handleUpdateProfile({
                      visualNeeds: { ...profile.visualNeeds, requiresLargeTextDisplay: checked }
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Requires high contrast display</Label>
                <Switch
                  checked={profile.visualNeeds.requiresHighContrast}
                  onCheckedChange={(checked) =>
                    handleUpdateProfile({
                      visualNeeds: { ...profile.visualNeeds, requiresHighContrast: checked }
                    })
                  }
                />
              </div>

              <div>
                <Label>Preferred font size</Label>
                <Select
                  value={profile.visualNeeds.preferredFontSize}
                  onValueChange={(value: any) =>
                    handleUpdateProfile({
                      visualNeeds: { ...profile.visualNeeds, preferredFontSize: value }
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="large">Large</SelectItem>
                    <SelectItem value="extra_large">Extra Large</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hearing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ear className="h-5 w-5" />
                Hearing Accessibility
              </CardTitle>
              <CardDescription>
                Configure hearing assistance and communication preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>I am deaf</Label>
                <Switch
                  checked={profile.hearingNeeds.isDeaf}
                  onCheckedChange={(checked) =>
                    handleUpdateProfile({
                      hearingNeeds: { ...profile.hearingNeeds, isDeaf: checked }
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>I am hard of hearing</Label>
                <Switch
                  checked={profile.hearingNeeds.isHardOfHearing}
                  onCheckedChange={(checked) =>
                    handleUpdateProfile({
                      hearingNeeds: { ...profile.hearingNeeds, isHardOfHearing: checked }
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Requires sign language interpreter</Label>
                <Switch
                  checked={profile.hearingNeeds.requiresSignLanguageInterpreter}
                  onCheckedChange={(checked) =>
                    handleUpdateProfile({
                      hearingNeeds: { ...profile.hearingNeeds, requiresSignLanguageInterpreter: checked }
                    })
                  }
                />
              </div>

              {profile.hearingNeeds.requiresSignLanguageInterpreter && (
                <div className="pl-4 border-l-2 border-blue-200">
                  <Label>Preferred sign language</Label>
                  <Input
                    value={profile.hearingNeeds.preferredSignLanguage || ''}
                    onChange={(e) =>
                      handleUpdateProfile({
                        hearingNeeds: { ...profile.hearingNeeds, preferredSignLanguage: e.target.value }
                      })
                    }
                    placeholder="e.g., BSL, ASL"
                  />
                </div>
              )}

              <div className="flex items-center justify-between">
                <Label>Requires visual alerts</Label>
                <Switch
                  checked={profile.hearingNeeds.requiresVisualAlerts}
                  onCheckedChange={(checked) =>
                    handleUpdateProfile({
                      hearingNeeds: { ...profile.hearingNeeds, requiresVisualAlerts: checked }
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Requires text communication</Label>
                <Switch
                  checked={profile.hearingNeeds.requiresTextCommunication}
                  onCheckedChange={(checked) =>
                    handleUpdateProfile({
                      hearingNeeds: { ...profile.hearingNeeds, requiresTextCommunication: checked }
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>I use hearing aids</Label>
                <Switch
                  checked={profile.hearingNeeds.hearingAidUser}
                  onCheckedChange={(checked) =>
                    handleUpdateProfile({
                      hearingNeeds: { ...profile.hearingNeeds, hearingAidUser: checked }
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>I have cochlear implants</Label>
                <Switch
                  checked={profile.hearingNeeds.cochlearImplantUser}
                  onCheckedChange={(checked) =>
                    handleUpdateProfile({
                      hearingNeeds: { ...profile.hearingNeeds, cochlearImplantUser: checked }
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cognitive" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Cognitive Accessibility
              </CardTitle>
              <CardDescription>
                Configure cognitive assistance and communication preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Requires simple instructions</Label>
                <Switch
                  checked={profile.cognitiveNeeds.requiresSimpleInstructions}
                  onCheckedChange={(checked) =>
                    handleUpdateProfile({
                      cognitiveNeeds: { ...profile.cognitiveNeeds, requiresSimpleInstructions: checked }
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Requires extra time</Label>
                <Switch
                  checked={profile.cognitiveNeeds.requiresExtraTime}
                  onCheckedChange={(checked) =>
                    handleUpdateProfile({
                      cognitiveNeeds: { ...profile.cognitiveNeeds, requiresExtraTime: checked }
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Requires repeated instructions</Label>
                <Switch
                  checked={profile.cognitiveNeeds.requiresRepeatInstructions}
                  onCheckedChange={(checked) =>
                    handleUpdateProfile({
                      cognitiveNeeds: { ...profile.cognitiveNeeds, requiresRepeatInstructions: checked }
                    })
                  }
                />
              </div>

              <div>
                <Label>Preferred communication style</Label>
                <Select
                  value={profile.cognitiveNeeds.preferredCommunicationStyle}
                  onValueChange={(value: any) =>
                    handleUpdateProfile({
                      cognitiveNeeds: { ...profile.cognitiveNeeds, preferredCommunicationStyle: value }
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="simple">Simple and clear</SelectItem>
                    <SelectItem value="detailed">Detailed explanations</SelectItem>
                    <SelectItem value="visual">Visual aids</SelectItem>
                    <SelectItem value="audio">Audio instructions</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label>Requires companion assistance</Label>
                <Switch
                  checked={profile.cognitiveNeeds.requiresCompanionAssistance}
                  onCheckedChange={(checked) =>
                    handleUpdateProfile({
                      cognitiveNeeds: { ...profile.cognitiveNeeds, requiresCompanionAssistance: checked }
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Has autism support needs</Label>
                <Switch
                  checked={profile.cognitiveNeeds.hasAutismSupport}
                  onCheckedChange={(checked) =>
                    handleUpdateProfile({
                      cognitiveNeeds: { ...profile.cognitiveNeeds, hasAutismSupport: checked }
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Requires quiet environment</Label>
                <Switch
                  checked={profile.cognitiveNeeds.requiresQuietEnvironment}
                  onCheckedChange={(checked) =>
                    handleUpdateProfile({
                      cognitiveNeeds: { ...profile.cognitiveNeeds, requiresQuietEnvironment: checked }
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="child" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Baby className="h-5 w-5" />
                Child Safety & Family Needs
              </CardTitle>
              <CardDescription>
                Configure child safety requirements and family-friendly options
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Requires child seat</Label>
                <Switch
                  checked={profile.childNeeds.requiresChildSeat}
                  onCheckedChange={(checked) =>
                    handleUpdateProfile({
                      childNeeds: { ...profile.childNeeds, requiresChildSeat: checked }
                    })
                  }
                />
              </div>

              {profile.childNeeds.requiresChildSeat && (
                <div className="space-y-4 pl-4 border-l-2 border-blue-200">
                  <div>
                    <Label>Child seat type</Label>
                    <Select
                      value={profile.childNeeds.childSeatType || 'infant'}
                      onValueChange={(value: any) =>
                        handleUpdateProfile({
                          childNeeds: { ...profile.childNeeds, childSeatType: value }
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="infant">Infant seat (0-12 months)</SelectItem>
                        <SelectItem value="convertible">Convertible seat (0-4 years)</SelectItem>
                        <SelectItem value="booster">Booster seat (4-8 years)</SelectItem>
                        <SelectItem value="multiple">Multiple types needed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Number of children</Label>
                    <Input
                      type="number"
                      min="0"
                      max="10"
                      value={profile.childNeeds.numberOfChildren}
                      onChange={(e) =>
                        handleUpdateProfile({
                          childNeeds: { ...profile.childNeeds, numberOfChildren: parseInt(e.target.value) || 0 }
                        })
                      }
                    />
                  </div>

                  <div>
                    <Label>Child ages (comma separated)</Label>
                    <Input
                      value={profile.childNeeds.childAges.join(', ')}
                      onChange={(e) => {
                        const ages = e.target.value.split(',').map(age => parseInt(age.trim())).filter(age => !isNaN(age))
                        handleUpdateProfile({
                          childNeeds: { ...profile.childNeeds, childAges: ages }
                        })
                      }}
                      placeholder="e.g., 2, 5, 8"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <Label>Requires stroller space</Label>
                <Switch
                  checked={profile.childNeeds.requiresStrollerSpace}
                  onCheckedChange={(checked) =>
                    handleUpdateProfile({
                      childNeeds: { ...profile.childNeeds, requiresStrollerSpace: checked }
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Requires family-friendly driver</Label>
                <Switch
                  checked={profile.childNeeds.requiresFamilyFriendlyDriver}
                  onCheckedChange={(checked) =>
                    handleUpdateProfile({
                      childNeeds: { ...profile.childNeeds, requiresFamilyFriendlyDriver: checked }
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="animal" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5" />
                Service Animals & Pets
              </CardTitle>
              <CardDescription>
                Configure service animal and pet accommodation needs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>I have a service animal</Label>
                <Switch
                  checked={profile.animalNeeds.hasServiceAnimal}
                  onCheckedChange={(checked) =>
                    handleUpdateProfile({
                      animalNeeds: { ...profile.animalNeeds, hasServiceAnimal: checked }
                    })
                  }
                />
              </div>

              {profile.animalNeeds.hasServiceAnimal && (
                <div className="space-y-4 pl-4 border-l-2 border-blue-200">
                  <div>
                    <Label>Service animal type</Label>
                    <Select
                      value={profile.animalNeeds.serviceAnimalType || 'guide_dog'}
                      onValueChange={(value: any) =>
                        handleUpdateProfile({
                          animalNeeds: { ...profile.animalNeeds, serviceAnimalType: value }
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="guide_dog">Guide dog</SelectItem>
                        <SelectItem value="hearing_dog">Hearing dog</SelectItem>
                        <SelectItem value="mobility_dog">Mobility assistance dog</SelectItem>
                        <SelectItem value="medical_alert">Medical alert dog</SelectItem>
                        <SelectItem value="psychiatric">Psychiatric service dog</SelectItem>
                        <SelectItem value="other">Other service animal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Service animal is certified</Label>
                    <Switch
                      checked={profile.animalNeeds.serviceAnimalCertified}
                      onCheckedChange={(checked) =>
                        handleUpdateProfile({
                          animalNeeds: { ...profile.animalNeeds, serviceAnimalCertified: checked }
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Requires additional space for animal</Label>
                    <Switch
                      checked={profile.animalNeeds.requiresAnimalSpace}
                      onCheckedChange={(checked) =>
                        handleUpdateProfile({
                          animalNeeds: { ...profile.animalNeeds, requiresAnimalSpace: checked }
                        })
                      }
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <Label>I have an emotional support animal</Label>
                <Switch
                  checked={profile.animalNeeds.hasEmotionalSupportAnimal}
                  onCheckedChange={(checked) =>
                    handleUpdateProfile({
                      animalNeeds: { ...profile.animalNeeds, hasEmotionalSupportAnimal: checked }
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>I have a pet</Label>
                <Switch
                  checked={profile.animalNeeds.hasPet}
                  onCheckedChange={(checked) =>
                    handleUpdateProfile({
                      animalNeeds: { ...profile.animalNeeds, hasPet: checked }
                    })
                  }
                />
              </div>

              {profile.animalNeeds.hasPet && (
                <div className="space-y-4 pl-4 border-l-2 border-blue-200">
                  <div>
                    <Label>Pet type</Label>
                    <Input
                      value={profile.animalNeeds.petType || ''}
                      onChange={(e) =>
                        handleUpdateProfile({
                          animalNeeds: { ...profile.animalNeeds, petType: e.target.value }
                        })
                      }
                      placeholder="e.g., Dog, Cat, Bird"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Requires pet-friendly vehicle</Label>
                    <Switch
                      checked={profile.animalNeeds.requiresPetFriendlyVehicle}
                      onCheckedChange={(checked) =>
                        handleUpdateProfile({
                          animalNeeds: { ...profile.animalNeeds, requiresPetFriendlyVehicle: checked }
                        })
                      }
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="language" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Languages className="h-5 w-5" />
                Language & Communication
              </CardTitle>
              <CardDescription>
                Configure language preferences and communication aids
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Primary language</Label>
                <Select
                  value={profile.languageNeeds.primaryLanguage}
                  onValueChange={(value) =>
                    handleUpdateProfile({
                      languageNeeds: { ...profile.languageNeeds, primaryLanguage: value }
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="de">German</SelectItem>
                    <SelectItem value="it">Italian</SelectItem>
                    <SelectItem value="pt">Portuguese</SelectItem>
                    <SelectItem value="ar">Arabic</SelectItem>
                    <SelectItem value="zh">Chinese</SelectItem>
                    <SelectItem value="hi">Hindi</SelectItem>
                    <SelectItem value="ur">Urdu</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label>Requires translation assistance</Label>
                <Switch
                  checked={profile.languageNeeds.requiresTranslation}
                  onCheckedChange={(checked) =>
                    handleUpdateProfile({
                      languageNeeds: { ...profile.languageNeeds, requiresTranslation: checked }
                    })
                  }
                />
              </div>

              <div>
                <Label>Preferred languages (comma separated)</Label>
                <Input
                  value={profile.languageNeeds.preferredLanguages.join(', ')}
                  onChange={(e) => {
                    const languages = e.target.value.split(',').map(lang => lang.trim()).filter(lang => lang)
                    handleUpdateProfile({
                      languageNeeds: { ...profile.languageNeeds, preferredLanguages: languages }
                    })
                  }}
                  placeholder="e.g., English, Spanish, French"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Requires written communication</Label>
                <Switch
                  checked={profile.languageNeeds.requiresWrittenCommunication}
                  onCheckedChange={(checked) =>
                    handleUpdateProfile({
                      languageNeeds: { ...profile.languageNeeds, requiresWrittenCommunication: checked }
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Requires visual communication</Label>
                <Switch
                  checked={profile.languageNeeds.requiresVisualCommunication}
                  onCheckedChange={(checked) =>
                    handleUpdateProfile({
                      languageNeeds: { ...profile.languageNeeds, requiresVisualCommunication: checked }
                    })
                  }
                />
              </div>

              <div>
                <Label>Literacy level</Label>
                <Select
                  value={profile.languageNeeds.literacyLevel}
                  onValueChange={(value: any) =>
                    handleUpdateProfile({
                      languageNeeds: { ...profile.languageNeeds, literacyLevel: value }
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Basic</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label>Requires cultural considerations</Label>
                <Switch
                  checked={profile.languageNeeds.requiresCulturalConsiderations}
                  onCheckedChange={(checked) =>
                    handleUpdateProfile({
                      languageNeeds: { ...profile.languageNeeds, requiresCulturalConsiderations: checked }
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Emergency Contacts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Emergency Contacts & Medical Information
          </CardTitle>
          <CardDescription>
            Add emergency contacts and important medical information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Emergency Contacts</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={addEmergencyContact}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Contact
              </Button>
            </div>

            {profile.emergencyInfo.emergencyContacts.map((contact, index) => (
              <Card key={index} className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Name</Label>
                    <Input
                      value={contact.name}
                      onChange={(e) => handleEmergencyContactChange(index, 'name', e.target.value)}
                      placeholder="Contact name"
                    />
                  </div>
                  <div>
                    <Label>Relationship</Label>
                    <Input
                      value={contact.relationship}
                      onChange={(e) => handleEmergencyContactChange(index, 'relationship', e.target.value)}
                      placeholder="e.g., Spouse, Parent, Friend"
                    />
                  </div>
                  <div>
                    <Label>Phone Number</Label>
                    <Input
                      value={contact.phone}
                      onChange={(e) => handleEmergencyContactChange(index, 'phone', e.target.value)}
                      placeholder="Phone number"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={contact.isCaregiver}
                        onCheckedChange={(checked) => handleEmergencyContactChange(index, 'isCaregiver', checked.toString())}
                      />
                      <Label>Is caregiver</Label>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeEmergencyContact(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <Separator />

          <div>
            <Label>Special Instructions</Label>
            <Textarea
              value={profile.emergencyInfo.specialInstructions}
              onChange={(e) =>
                handleUpdateProfile({
                  emergencyInfo: { ...profile.emergencyInfo, specialInstructions: e.target.value }
                })
              }
              placeholder="Any special instructions for drivers or emergency responders..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Status */}
      {saving && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Saving your accessibility preferences...
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}