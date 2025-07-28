'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  Settings, 
  User, 
  Car, 
  Route, 
  Volume2, 
  CreditCard, 
  Shield, 
  Brain,
  Plus,
  Edit,
  Trash2,
  Star,
  Clock,
  MapPin,
  Thermometer,
  Music,
  Phone,
  Wifi,
  Baby,
  Heart,
  Languages,
  Accessibility
} from 'lucide-react'
import { 
  bookingPreferenceService, 
  BookingPreference, 
  PreferenceSuggestion 
} from '@/services/bookingPreferenceService'

interface BookingPreferenceManagerProps {
  userId: string
  onPreferenceChange?: (preference: BookingPreference) => void
}

export default function BookingPreferenceManager({ 
  userId, 
  onPreferenceChange 
}: BookingPreferenceManagerProps) {
  const [preferences, setPreferences] = useState<BookingPreference[]>([])
  const [selectedPreference, setSelectedPreference] = useState<BookingPreference | null>(null)
  const [suggestions, setSuggestions] = useState<PreferenceSuggestion[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('profiles')
  const [isCreating, setIsCreating] = useState(false)
  const [editingProfile, setEditingProfile] = useState<BookingPreference | null>(null)

  useEffect(() => {
    loadUserPreferences()
    loadSuggestions()
  }, [userId])

  const loadUserPreferences = async () => {
    try {
      setLoading(true)
      const userPrefs = await bookingPreferenceService.getUserPreferences(userId)
      setPreferences(userPrefs)
      
      if (userPrefs.length === 0) {
        // Create default profile for new user
        await bookingPreferenceService.createDefaultProfile(userId)
        const newPrefs = await bookingPreferenceService.getUserPreferences(userId)
        setPreferences(newPrefs)
        setSelectedPreference(newPrefs[0])
      } else {
        const defaultPref = userPrefs.find(p => p.isDefault) || userPrefs[0]
        setSelectedPreference(defaultPref)
      }
    } catch (error) {
      console.error('Error loading preferences:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadSuggestions = async () => {
    try {
      const aiSuggestions = await bookingPreferenceService.generatePreferenceSuggestions(userId)
      setSuggestions(aiSuggestions)
    } catch (error) {
      console.error('Error loading suggestions:', error)
    }
  }

  const handleCreateProfile = async (profileData: Partial<BookingPreference>) => {
    try {
      const newProfile: Omit<BookingPreference, 'id' | 'createdAt' | 'updatedAt'> = {
        userId,
        profileName: profileData.profileName || 'New Profile',
        isDefault: false,
        isActive: true,
        ...getDefaultPreferenceValues(),
        ...profileData
      }

      await bookingPreferenceService.createPreferenceProfile(newProfile)
      await loadUserPreferences()
      setIsCreating(false)
    } catch (error) {
      console.error('Error creating profile:', error)
    }
  }

  const handleUpdateProfile = async (profileId: string, updates: Partial<BookingPreference>) => {
    try {
      await bookingPreferenceService.updatePreferenceProfile(profileId, updates)
      await loadUserPreferences()
      onPreferenceChange?.(selectedPreference!)
    } catch (error) {
      console.error('Error updating profile:', error)
    }
  }

  const handleSetDefault = async (profileId: string) => {
    try {
      await bookingPreferenceService.setDefaultPreference(userId, profileId)
      await loadUserPreferences()
    } catch (error) {
      console.error('Error setting default:', error)
    }
  }

  const handleDeleteProfile = async (profileId: string) => {
    try {
      await bookingPreferenceService.deletePreferenceProfile(profileId)
      await loadUserPreferences()
    } catch (error) {
      console.error('Error deleting profile:', error)
    }
  }

  const handleApplySuggestion = async (suggestion: PreferenceSuggestion) => {
    try {
      if (selectedPreference?.id) {
        await bookingPreferenceService.applySuggestion(userId, suggestion.id, selectedPreference.id)
        await loadUserPreferences()
        await loadSuggestions()
      }
    } catch (error) {
      console.error('Error applying suggestion:', error)
    }
  }

  const getDefaultPreferenceValues = (): Partial<BookingPreference> => ({
    vehicleType: 'any',
    vehicleFeatures: {
      airConditioning: true,
      wifi: false,
      phoneCharger: true,
      bottledWater: false,
      newspapers: false,
      childSeat: false,
      wheelchairAccessible: false,
      petFriendly: false
    },
    driverPreferences: {
      rating: { min: 4.0, required: true },
      conversationLevel: 'friendly'
    },
    routePreferences: {
      avoidTolls: false,
      avoidHighways: false,
      preferScenicRoute: false,
      allowDetours: true,
      maxDetourMinutes: 10,
      preferFastestRoute: true
    },
    comfortPreferences: {
      musicVolume: 'low',
      windowPreference: 'any',
      seatPosition: 'any'
    },
    paymentPreferences: {
      defaultMethod: 'card',
      autoTip: true,
      tipPercentage: 15,
      splitPayment: false
    },
    safetyPreferences: {
      shareLocationWithContacts: true,
      requireDriverPhoto: true,
      requireVehiclePhoto: false,
      emergencyContactNotification: true,
      rideVerification: false
    },
    contextualSettings: {},
    learningData: {
      bookingHistory: [],
      preferenceScore: 0.5,
      lastUpdated: new Date() as any,
      adaptationEnabled: true
    }
  })

  const renderProfileList = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Your Preference Profiles</h3>
        <Button onClick={() => setIsCreating(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Profile
        </Button>
      </div>

      <div className="grid gap-4">
        {preferences.map((preference) => (
          <Card 
            key={preference.id} 
            className={`cursor-pointer transition-all ${
              selectedPreference?.id === preference.id ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => setSelectedPreference(preference)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium">{preference.profileName}</h4>
                    <p className="text-sm text-muted-foreground">
                      {preference.vehicleType} • {preference.driverPreferences.conversationLevel} driver
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {preference.isDefault && (
                    <Badge variant="secondary">Default</Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      setEditingProfile(preference)
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  {!preference.isDefault && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteProfile(preference.id!)
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )

  const renderPreferenceEditor = () => {
    if (!selectedPreference) return null

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">{selectedPreference.profileName}</h3>
            <p className="text-sm text-muted-foreground">
              Customize your booking preferences
            </p>
          </div>
          <div className="flex gap-2">
            {!selectedPreference.isDefault && (
              <Button
                variant="outline"
                onClick={() => handleSetDefault(selectedPreference.id!)}
              >
                Set as Default
              </Button>
            )}
            <Button
              onClick={() => setEditingProfile(selectedPreference)}
            >
              Edit Profile
            </Button>
          </div>
        </div>

        <Tabs defaultValue="vehicle" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="vehicle" className="flex items-center gap-1">
              <Car className="h-3 w-3" />
              Vehicle
            </TabsTrigger>
            <TabsTrigger value="driver" className="flex items-center gap-1">
              <User className="h-3 w-3" />
              Driver
            </TabsTrigger>
            <TabsTrigger value="route" className="flex items-center gap-1">
              <Route className="h-3 w-3" />
              Route
            </TabsTrigger>
            <TabsTrigger value="comfort" className="flex items-center gap-1">
              <Volume2 className="h-3 w-3" />
              Comfort
            </TabsTrigger>
            <TabsTrigger value="payment" className="flex items-center gap-1">
              <CreditCard className="h-3 w-3" />
              Payment
            </TabsTrigger>
            <TabsTrigger value="safety" className="flex items-center gap-1">
              <Shield className="h-3 w-3" />
              Safety
            </TabsTrigger>
          </TabsList>

          <TabsContent value="vehicle" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Car className="h-5 w-5" />
                  Vehicle Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Preferred Vehicle Type</Label>
                  <Select 
                    value={selectedPreference.vehicleType} 
                    onValueChange={(value) => 
                      handleUpdateProfile(selectedPreference.id!, { vehicleType: value as any })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="economy">Economy</SelectItem>
                      <SelectItem value="comfort">Comfort</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                      <SelectItem value="luxury">Luxury</SelectItem>
                      <SelectItem value="any">Any</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="space-y-3">
                  <Label className="text-base font-medium">Vehicle Features</Label>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Thermometer className="h-4 w-4" />
                        <Label>Air Conditioning</Label>
                      </div>
                      <Switch
                        checked={selectedPreference.vehicleFeatures.airConditioning}
                        onCheckedChange={(checked) =>
                          handleUpdateProfile(selectedPreference.id!, {
                            vehicleFeatures: { ...selectedPreference.vehicleFeatures, airConditioning: checked }
                          })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Wifi className="h-4 w-4" />
                        <Label>WiFi</Label>
                      </div>
                      <Switch
                        checked={selectedPreference.vehicleFeatures.wifi}
                        onCheckedChange={(checked) =>
                          handleUpdateProfile(selectedPreference.id!, {
                            vehicleFeatures: { ...selectedPreference.vehicleFeatures, wifi: checked }
                          })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        <Label>Phone Charger</Label>
                      </div>
                      <Switch
                        checked={selectedPreference.vehicleFeatures.phoneCharger}
                        onCheckedChange={(checked) =>
                          handleUpdateProfile(selectedPreference.id!, {
                            vehicleFeatures: { ...selectedPreference.vehicleFeatures, phoneCharger: checked }
                          })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Baby className="h-4 w-4" />
                        <Label>Child Seat</Label>
                      </div>
                      <Switch
                        checked={selectedPreference.vehicleFeatures.childSeat}
                        onCheckedChange={(checked) =>
                          handleUpdateProfile(selectedPreference.id!, {
                            vehicleFeatures: { ...selectedPreference.vehicleFeatures, childSeat: checked }
                          })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Accessibility className="h-4 w-4" />
                        <Label>Wheelchair Accessible</Label>
                      </div>
                      <Switch
                        checked={selectedPreference.vehicleFeatures.wheelchairAccessible}
                        onCheckedChange={(checked) =>
                          handleUpdateProfile(selectedPreference.id!, {
                            vehicleFeatures: { ...selectedPreference.vehicleFeatures, wheelchairAccessible: checked }
                          })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Heart className="h-4 w-4" />
                        <Label>Pet Friendly</Label>
                      </div>
                      <Switch
                        checked={selectedPreference.vehicleFeatures.petFriendly}
                        onCheckedChange={(checked) =>
                          handleUpdateProfile(selectedPreference.id!, {
                            vehicleFeatures: { ...selectedPreference.vehicleFeatures, petFriendly: checked }
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="driver" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Driver Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Minimum Driver Rating</Label>
                  <div className="flex items-center gap-4 mt-2">
                    <Slider
                      value={[selectedPreference.driverPreferences.rating.min]}
                      onValueChange={([value]) =>
                        handleUpdateProfile(selectedPreference.id!, {
                          driverPreferences: {
                            ...selectedPreference.driverPreferences,
                            rating: { ...selectedPreference.driverPreferences.rating, min: value }
                          }
                        })
                      }
                      max={5}
                      min={1}
                      step={0.1}
                      className="flex-1"
                    />
                    <div className="flex items-center gap-1 min-w-[60px]">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">
                        {selectedPreference.driverPreferences.rating.min.toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <Label>Conversation Level</Label>
                  <Select 
                    value={selectedPreference.driverPreferences.conversationLevel} 
                    onValueChange={(value) => 
                      handleUpdateProfile(selectedPreference.id!, {
                        driverPreferences: { ...selectedPreference.driverPreferences, conversationLevel: value as any }
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="quiet">Quiet ride</SelectItem>
                      <SelectItem value="friendly">Friendly chat</SelectItem>
                      <SelectItem value="chatty">Love to chat</SelectItem>
                      <SelectItem value="any">No preference</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Driver Gender Preference</Label>
                  <Select 
                    value={selectedPreference.driverPreferences.gender || 'any'} 
                    onValueChange={(value) => 
                      handleUpdateProfile(selectedPreference.id!, {
                        driverPreferences: { ...selectedPreference.driverPreferences, gender: value === 'any' ? undefined : value as any }
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">No preference</SelectItem>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="route" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Route className="h-5 w-5" />
                  Route Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex items-center justify-between">
                    <Label>Avoid toll roads</Label>
                    <Switch
                      checked={selectedPreference.routePreferences.avoidTolls}
                      onCheckedChange={(checked) =>
                        handleUpdateProfile(selectedPreference.id!, {
                          routePreferences: { ...selectedPreference.routePreferences, avoidTolls: checked }
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Avoid highways</Label>
                    <Switch
                      checked={selectedPreference.routePreferences.avoidHighways}
                      onCheckedChange={(checked) =>
                        handleUpdateProfile(selectedPreference.id!, {
                          routePreferences: { ...selectedPreference.routePreferences, avoidHighways: checked }
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Prefer scenic routes</Label>
                    <Switch
                      checked={selectedPreference.routePreferences.preferScenicRoute}
                      onCheckedChange={(checked) =>
                        handleUpdateProfile(selectedPreference.id!, {
                          routePreferences: { ...selectedPreference.routePreferences, preferScenicRoute: checked }
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Prefer fastest route</Label>
                    <Switch
                      checked={selectedPreference.routePreferences.preferFastestRoute}
                      onCheckedChange={(checked) =>
                        handleUpdateProfile(selectedPreference.id!, {
                          routePreferences: { ...selectedPreference.routePreferences, preferFastestRoute: checked }
                        })
                      }
                    />
                  </div>
                </div>

                <div>
                  <Label>Maximum detour time ({selectedPreference.routePreferences.maxDetourMinutes} minutes)</Label>
                  <Slider
                    value={[selectedPreference.routePreferences.maxDetourMinutes]}
                    onValueChange={([value]) =>
                      handleUpdateProfile(selectedPreference.id!, {
                        routePreferences: { ...selectedPreference.routePreferences, maxDetourMinutes: value }
                      })
                    }
                    max={30}
                    min={5}
                    step={5}
                    className="mt-2"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="comfort" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Volume2 className="h-5 w-5" />
                  Comfort Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Music Volume</Label>
                  <Select 
                    value={selectedPreference.comfortPreferences.musicVolume} 
                    onValueChange={(value) => 
                      handleUpdateProfile(selectedPreference.id!, {
                        comfortPreferences: { ...selectedPreference.comfortPreferences, musicVolume: value as any }
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="off">No music</SelectItem>
                      <SelectItem value="low">Low volume</SelectItem>
                      <SelectItem value="medium">Medium volume</SelectItem>
                      <SelectItem value="high">High volume</SelectItem>
                      <SelectItem value="any">No preference</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Window Preference</Label>
                  <Select 
                    value={selectedPreference.comfortPreferences.windowPreference} 
                    onValueChange={(value) => 
                      handleUpdateProfile(selectedPreference.id!, {
                        comfortPreferences: { ...selectedPreference.comfortPreferences, windowPreference: value as any }
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="closed">Windows closed</SelectItem>
                      <SelectItem value="cracked">Slightly open</SelectItem>
                      <SelectItem value="open">Windows open</SelectItem>
                      <SelectItem value="any">No preference</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Seat Position</Label>
                  <Select 
                    value={selectedPreference.comfortPreferences.seatPosition || 'any'} 
                    onValueChange={(value) => 
                      handleUpdateProfile(selectedPreference.id!, {
                        comfortPreferences: { ...selectedPreference.comfortPreferences, seatPosition: value === 'any' ? undefined : value as any }
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="front">Front seat</SelectItem>
                      <SelectItem value="back">Back seat</SelectItem>
                      <SelectItem value="any">No preference</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {selectedPreference.comfortPreferences.temperature && (
                  <div>
                    <Label>Preferred Temperature ({selectedPreference.comfortPreferences.temperature}°C)</Label>
                    <Slider
                      value={[selectedPreference.comfortPreferences.temperature]}
                      onValueChange={([value]) =>
                        handleUpdateProfile(selectedPreference.id!, {
                          comfortPreferences: { ...selectedPreference.comfortPreferences, temperature: value }
                        })
                      }
                      max={25}
                      min={18}
                      step={1}
                      className="mt-2"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payment" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Default Payment Method</Label>
                  <Select 
                    value={selectedPreference.paymentPreferences.defaultMethod} 
                    onValueChange={(value) => 
                      handleUpdateProfile(selectedPreference.id!, {
                        paymentPreferences: { ...selectedPreference.paymentPreferences, defaultMethod: value }
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="card">Credit/Debit Card</SelectItem>
                      <SelectItem value="paypal">PayPal</SelectItem>
                      <SelectItem value="apple_pay">Apple Pay</SelectItem>
                      <SelectItem value="google_pay">Google Pay</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <Label>Auto-tip</Label>
                  <Switch
                    checked={selectedPreference.paymentPreferences.autoTip}
                    onCheckedChange={(checked) =>
                      handleUpdateProfile(selectedPreference.id!, {
                        paymentPreferences: { ...selectedPreference.paymentPreferences, autoTip: checked }
                      })
                    }
                  />
                </div>

                {selectedPreference.paymentPreferences.autoTip && (
                  <div>
                    <Label>Default Tip Percentage ({selectedPreference.paymentPreferences.tipPercentage}%)</Label>
                    <Slider
                      value={[selectedPreference.paymentPreferences.tipPercentage || 15]}
                      onValueChange={([value]) =>
                        handleUpdateProfile(selectedPreference.id!, {
                          paymentPreferences: { ...selectedPreference.paymentPreferences, tipPercentage: value }
                        })
                      }
                      max={25}
                      min={10}
                      step={5}
                      className="mt-2"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="safety" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Safety Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex items-center justify-between">
                    <Label>Share location with emergency contacts</Label>
                    <Switch
                      checked={selectedPreference.safetyPreferences.shareLocationWithContacts}
                      onCheckedChange={(checked) =>
                        handleUpdateProfile(selectedPreference.id!, {
                          safetyPreferences: { ...selectedPreference.safetyPreferences, shareLocationWithContacts: checked }
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Require driver photo</Label>
                    <Switch
                      checked={selectedPreference.safetyPreferences.requireDriverPhoto}
                      onCheckedChange={(checked) =>
                        handleUpdateProfile(selectedPreference.id!, {
                          safetyPreferences: { ...selectedPreference.safetyPreferences, requireDriverPhoto: checked }
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Require vehicle photo</Label>
                    <Switch
                      checked={selectedPreference.safetyPreferences.requireVehiclePhoto}
                      onCheckedChange={(checked) =>
                        handleUpdateProfile(selectedPreference.id!, {
                          safetyPreferences: { ...selectedPreference.safetyPreferences, requireVehiclePhoto: checked }
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Emergency contact notifications</Label>
                    <Switch
                      checked={selectedPreference.safetyPreferences.emergencyContactNotification}
                      onCheckedChange={(checked) =>
                        handleUpdateProfile(selectedPreference.id!, {
                          safetyPreferences: { ...selectedPreference.safetyPreferences, emergencyContactNotification: checked }
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Ride verification required</Label>
                    <Switch
                      checked={selectedPreference.safetyPreferences.rideVerification}
                      onCheckedChange={(checked) =>
                        handleUpdateProfile(selectedPreference.id!, {
                          safetyPreferences: { ...selectedPreference.safetyPreferences, rideVerification: checked }
                        })
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    )
  }

  const renderAISuggestions = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Brain className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">AI Suggestions</h3>
        <Badge variant="secondary">Beta</Badge>
      </div>

      {suggestions.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Brain className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h4 className="text-lg font-semibold mb-2">No suggestions yet</h4>
            <p className="text-muted-foreground">
              Take a few rides and we'll provide personalized suggestions to improve your experience.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {suggestions.map((suggestion) => (
            <Card key={suggestion.id} className="border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="capitalize">
                        {suggestion.type}
                      </Badge>
                      <Badge 
                        variant="secondary" 
                        className={`${
                          suggestion.impact === 'high' ? 'bg-red-100 text-red-800' :
                          suggestion.impact === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}
                      >
                        {suggestion.impact} impact
                      </Badge>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs text-muted-foreground">
                          {(suggestion.confidence * 100).toFixed(0)}% confidence
                        </span>
                      </div>
                    </div>
                    <h4 className="font-medium mb-1">{suggestion.suggestion}</h4>
                    <p className="text-sm text-muted-foreground">{suggestion.reasoning}</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleApplySuggestion(suggestion)}
                    className="ml-4"
                  >
                    Apply
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading your preferences...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Booking Preferences</h1>
        <p className="text-muted-foreground">
          Customize your ride experience with intelligent preference management
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profiles" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profiles ({preferences.length})
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Preferences
          </TabsTrigger>
          <TabsTrigger value="suggestions" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            AI Suggestions ({suggestions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profiles" className="mt-6">
          {renderProfileList()}
        </TabsContent>

        <TabsContent value="preferences" className="mt-6">
          {renderPreferenceEditor()}
        </TabsContent>

        <TabsContent value="suggestions" className="mt-6">
          {renderAISuggestions()}
        </TabsContent>
      </Tabs>

      {/* Create Profile Dialog */}
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Preference Profile</DialogTitle>
            <DialogDescription>
              Create a new preference profile for different scenarios
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="profileName">Profile Name</Label>
              <Input
                id="profileName"
                placeholder="e.g., Work Commute, Weekend Trips"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const target = e.target as HTMLInputElement
                    handleCreateProfile({ profileName: target.value })
                  }
                }}
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  const input = document.getElementById('profileName') as HTMLInputElement
                  handleCreateProfile({ profileName: input.value })
                }}
                className="flex-1"
              >
                Create Profile
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