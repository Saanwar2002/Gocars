'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Briefcase, 
  Home, 
  Plane, 
  Moon, 
  Users, 
  Calendar,
  Plus,
  Edit,
  Copy,
  Trash2,
  Star,
  Clock,
  MapPin,
  Settings,
  Zap,
  Target
} from 'lucide-react'
import { 
  bookingPreferenceService, 
  BookingPreference 
} from '@/services/bookingPreferenceService'

interface PreferenceProfilesProps {
  userId: string
  onProfileSelect?: (profile: BookingPreference) => void
}

interface ProfileTemplate {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  category: 'work' | 'personal' | 'travel' | 'special'
  preferences: Partial<BookingPreference>
}

const profileTemplates: ProfileTemplate[] = [
  {
    id: 'work_commute',
    name: 'Work Commute',
    description: 'Optimized for daily work trips with fastest routes and professional settings',
    icon: <Briefcase className="h-5 w-5" />,
    category: 'work',
    preferences: {
      vehicleType: 'comfort',
      vehicleFeatures: {
        airConditioning: true,
        wifi: true,
        phoneCharger: true,
        bottledWater: false,
        newspapers: true,
        childSeat: false,
        wheelchairAccessible: false,
        petFriendly: false
      },
      driverPreferences: {
        rating: { min: 4.5, required: true },
        conversationLevel: 'quiet'
      },
      routePreferences: {
        avoidTolls: false,
        avoidHighways: false,
        preferScenicRoute: false,
        allowDetours: false,
        maxDetourMinutes: 5,
        preferFastestRoute: true
      },
      comfortPreferences: {
        musicVolume: 'low',
        windowPreference: 'closed',
        seatPosition: 'back'
      },
      paymentPreferences: {
        defaultMethod: 'card',
        autoTip: true,
        tipPercentage: 15,
        splitPayment: false,
        expenseCategory: 'business'
      }
    }
  },
  {
    id: 'personal_trips',
    name: 'Personal Trips',
    description: 'Relaxed settings for personal errands and leisure trips',
    icon: <Home className="h-5 w-5" />,
    category: 'personal',
    preferences: {
      vehicleType: 'any',
      driverPreferences: {
        rating: { min: 4.0, required: true },
        conversationLevel: 'friendly'
      },
      routePreferences: {
        avoidTolls: true,
        avoidHighways: false,
        preferScenicRoute: true,
        allowDetours: true,
        maxDetourMinutes: 15,
        preferFastestRoute: false
      },
      comfortPreferences: {
        musicVolume: 'medium',
        windowPreference: 'any',
        seatPosition: 'any'
      },
      paymentPreferences: {
        defaultMethod: 'card',
        autoTip: true,
        tipPercentage: 20,
        splitPayment: false
      }
    }
  },
  {
    id: 'airport_travel',
    name: 'Airport Travel',
    description: 'Reliable and spacious rides for airport trips with luggage',
    icon: <Plane className="h-5 w-5" />,
    category: 'travel',
    preferences: {
      vehicleType: 'comfort',
      vehicleFeatures: {
        airConditioning: true,
        wifi: true,
        phoneCharger: true,
        bottledWater: true,
        newspapers: false,
        childSeat: false,
        wheelchairAccessible: false,
        petFriendly: false
      },
      driverPreferences: {
        rating: { min: 4.7, required: true },
        conversationLevel: 'quiet'
      },
      routePreferences: {
        avoidTolls: false,
        avoidHighways: false,
        preferScenicRoute: false,
        allowDetours: false,
        maxDetourMinutes: 5,
        preferFastestRoute: true
      },
      safetyPreferences: {
        shareLocationWithContacts: true,
        requireDriverPhoto: true,
        requireVehiclePhoto: true,
        emergencyContactNotification: true,
        rideVerification: true
      }
    }
  },
  {
    id: 'night_rides',
    name: 'Night Rides',
    description: 'Enhanced safety features for evening and late-night trips',
    icon: <Moon className="h-5 w-5" />,
    category: 'special',
    preferences: {
      vehicleType: 'comfort',
      driverPreferences: {
        rating: { min: 4.8, required: true },
        conversationLevel: 'quiet'
      },
      routePreferences: {
        avoidTolls: false,
        avoidHighways: true,
        preferScenicRoute: false,
        allowDetours: false,
        maxDetourMinutes: 5,
        preferFastestRoute: true
      },
      safetyPreferences: {
        shareLocationWithContacts: true,
        requireDriverPhoto: true,
        requireVehiclePhoto: true,
        emergencyContactNotification: true,
        rideVerification: true
      },
      comfortPreferences: {
        musicVolume: 'off',
        windowPreference: 'closed'
      }
    }
  },
  {
    id: 'business_meetings',
    name: 'Business Meetings',
    description: 'Professional rides for important business meetings',
    icon: <Briefcase className="h-5 w-5" />,
    category: 'work',
    preferences: {
      vehicleType: 'premium',
      vehicleFeatures: {
        airConditioning: true,
        wifi: true,
        phoneCharger: true,
        bottledWater: true,
        newspapers: true,
        childSeat: false,
        wheelchairAccessible: false,
        petFriendly: false
      },
      driverPreferences: {
        rating: { min: 4.8, required: true },
        conversationLevel: 'quiet'
      },
      routePreferences: {
        avoidTolls: false,
        avoidHighways: false,
        preferScenicRoute: false,
        allowDetours: false,
        maxDetourMinutes: 3,
        preferFastestRoute: true
      },
      safetyPreferences: {
        requireDriverPhoto: true,
        requireVehiclePhoto: true,
        rideVerification: true
      },
      paymentPreferences: {
        defaultMethod: 'card',
        autoTip: true,
        tipPercentage: 20,
        expenseCategory: 'business'
      }
    }
  },
  {
    id: 'social_events',
    name: 'Social Events',
    description: 'Fun and flexible rides for social gatherings and events',
    icon: <Users className="h-5 w-5" />,
    category: 'personal',
    preferences: {
      vehicleType: 'any',
      driverPreferences: {
        rating: { min: 4.0, required: true },
        conversationLevel: 'chatty'
      },
      routePreferences: {
        avoidTolls: true,
        preferScenicRoute: true,
        allowDetours: true,
        maxDetourMinutes: 20,
        preferFastestRoute: false
      },
      comfortPreferences: {
        musicVolume: 'medium',
        windowPreference: 'any'
      },
      paymentPreferences: {
        defaultMethod: 'card',
        autoTip: true,
        tipPercentage: 25,
        splitPayment: true
      }
    }
  }
]

export default function PreferenceProfiles({ userId, onProfileSelect }: PreferenceProfilesProps) {
  const [profiles, setProfiles] = useState<BookingPreference[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<ProfileTemplate | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [editingProfile, setEditingProfile] = useState<BookingPreference | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState<string>('all')

  useEffect(() => {
    loadProfiles()
  }, [userId])

  const loadProfiles = async () => {
    try {
      setLoading(true)
      const userProfiles = await bookingPreferenceService.getUserPreferences(userId)
      setProfiles(userProfiles)
    } catch (error) {
      console.error('Error loading profiles:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateFromTemplate = async (template: ProfileTemplate, customName?: string) => {
    try {
      const profileData: Omit<BookingPreference, 'id' | 'createdAt' | 'updatedAt'> = {
        userId,
        profileName: customName || template.name,
        isDefault: false,
        isActive: true,
        ...getDefaultPreferenceValues(),
        ...template.preferences,
        contextualSettings: {
          [template.id]: template.preferences
        },
        learningData: {
          bookingHistory: [],
          preferenceScore: 0.5,
          lastUpdated: new Date() as any,
          adaptationEnabled: true
        }
      }

      await bookingPreferenceService.createPreferenceProfile(profileData)
      await loadProfiles()
      setIsCreating(false)
      setSelectedTemplate(null)
    } catch (error) {
      console.error('Error creating profile from template:', error)
    }
  }

  const handleDuplicateProfile = async (profile: BookingPreference) => {
    try {
      const duplicatedProfile: Omit<BookingPreference, 'id' | 'createdAt' | 'updatedAt'> = {
        ...profile,
        profileName: `${profile.profileName} (Copy)`,
        isDefault: false
      }

      await bookingPreferenceService.createPreferenceProfile(duplicatedProfile)
      await loadProfiles()
    } catch (error) {
      console.error('Error duplicating profile:', error)
    }
  }

  const handleDeleteProfile = async (profileId: string) => {
    try {
      await bookingPreferenceService.deletePreferenceProfile(profileId)
      await loadProfiles()
    } catch (error) {
      console.error('Error deleting profile:', error)
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
    }
  })

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'work': return <Briefcase className="h-4 w-4" />
      case 'personal': return <Home className="h-4 w-4" />
      case 'travel': return <Plane className="h-4 w-4" />
      case 'special': return <Star className="h-4 w-4" />
      default: return <Settings className="h-4 w-4" />
    }
  }

  const getProfileUsageStats = (profile: BookingPreference) => {
    const historyCount = profile.learningData?.bookingHistory?.length || 0
    const score = profile.learningData?.preferenceScore || 0
    return { historyCount, score }
  }

  const filteredTemplates = activeCategory === 'all' 
    ? profileTemplates 
    : profileTemplates.filter(t => t.category === activeCategory)

  const existingProfileNames = profiles.map(p => p.profileName.toLowerCase())

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-2 text-muted-foreground">Loading profiles...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Preference Profiles</h2>
          <p className="text-muted-foreground">
            Create specialized profiles for different types of trips
          </p>
        </div>
        <Button onClick={() => setIsCreating(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Profile
        </Button>
      </div>

      {/* Existing Profiles */}
      {profiles.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Your Profiles</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {profiles.map((profile) => {
              const stats = getProfileUsageStats(profile)
              return (
                <Card 
                  key={profile.id} 
                  className="cursor-pointer hover:shadow-md transition-all"
                  onClick={() => onProfileSelect?.(profile)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="bg-primary/10 p-2 rounded-full">
                          <Target className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium">{profile.profileName}</h4>
                          {profile.isDefault && (
                            <Badge variant="secondary" className="text-xs">Default</Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditingProfile(profile)
                          }}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDuplicateProfile(profile)
                          }}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        {!profile.isDefault && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteProfile(profile.id!)
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3 w-3" />
                        <span className="capitalize">{profile.vehicleType} vehicle</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        <span>{stats.historyCount} rides completed</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Zap className="h-3 w-3" />
                        <span>
                          {(stats.score * 100).toFixed(0)}% satisfaction score
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Profile Templates */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Profile Templates</h3>
          <div className="flex gap-2">
            <Button
              variant={activeCategory === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveCategory('all')}
            >
              All
            </Button>
            <Button
              variant={activeCategory === 'work' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveCategory('work')}
              className="flex items-center gap-1"
            >
              <Briefcase className="h-3 w-3" />
              Work
            </Button>
            <Button
              variant={activeCategory === 'personal' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveCategory('personal')}
              className="flex items-center gap-1"
            >
              <Home className="h-3 w-3" />
              Personal
            </Button>
            <Button
              variant={activeCategory === 'travel' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveCategory('travel')}
              className="flex items-center gap-1"
            >
              <Plane className="h-3 w-3" />
              Travel
            </Button>
            <Button
              variant={activeCategory === 'special' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveCategory('special')}
              className="flex items-center gap-1"
            >
              <Star className="h-3 w-3" />
              Special
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((template) => {
            const isAlreadyCreated = existingProfileNames.includes(template.name.toLowerCase())
            
            return (
              <Card 
                key={template.id} 
                className={`cursor-pointer hover:shadow-md transition-all ${
                  isAlreadyCreated ? 'opacity-60' : ''
                }`}
                onClick={() => !isAlreadyCreated && setSelectedTemplate(template)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="bg-primary/10 p-2 rounded-full">
                      {template.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{template.name}</h4>
                        {getCategoryIcon(template.category)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {template.description}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <span>Vehicle: {template.preferences.vehicleType}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>
                        Driver: {template.preferences.driverPreferences?.conversationLevel} conversation
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>
                        Route: {template.preferences.routePreferences?.preferFastestRoute ? 'Fastest' : 'Flexible'}
                      </span>
                    </div>
                  </div>

                  {isAlreadyCreated && (
                    <Badge variant="secondary" className="mt-2 text-xs">
                      Already Created
                    </Badge>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Create Profile Dialog */}
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Create New Profile</DialogTitle>
            <DialogDescription>
              Choose a template or create a custom profile from scratch
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="templates" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="templates">From Template</TabsTrigger>
              <TabsTrigger value="custom">Custom Profile</TabsTrigger>
            </TabsList>
            
            <TabsContent value="templates" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                {profileTemplates.map((template) => (
                  <Card 
                    key={template.id}
                    className="cursor-pointer hover:shadow-md transition-all"
                    onClick={() => handleCreateFromTemplate(template)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="bg-primary/10 p-2 rounded-full">
                          {template.icon}
                        </div>
                        <div>
                          <h4 className="font-medium">{template.name}</h4>
                          <Badge variant="outline" className="text-xs capitalize">
                            {template.category}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {template.description}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="custom" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="customProfileName">Profile Name</Label>
                  <Input
                    id="customProfileName"
                    placeholder="Enter profile name"
                  />
                </div>
                <Button
                  onClick={() => {
                    const input = document.getElementById('customProfileName') as HTMLInputElement
                    if (input.value) {
                      handleCreateFromTemplate({
                        id: 'custom',
                        name: input.value,
                        description: 'Custom profile',
                        icon: <Settings className="h-5 w-5" />,
                        category: 'personal',
                        preferences: {}
                      })
                    }
                  }}
                  className="w-full"
                >
                  Create Custom Profile
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Template Selection Dialog */}
      <Dialog open={!!selectedTemplate} onOpenChange={() => setSelectedTemplate(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Profile: {selectedTemplate?.name}</DialogTitle>
            <DialogDescription>
              {selectedTemplate?.description}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="templateProfileName">Profile Name</Label>
              <Input
                id="templateProfileName"
                defaultValue={selectedTemplate?.name}
                placeholder="Enter profile name"
              />
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  const input = document.getElementById('templateProfileName') as HTMLInputElement
                  if (selectedTemplate) {
                    handleCreateFromTemplate(selectedTemplate, input.value || selectedTemplate.name)
                  }
                }}
                className="flex-1"
              >
                Create Profile
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setSelectedTemplate(null)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}