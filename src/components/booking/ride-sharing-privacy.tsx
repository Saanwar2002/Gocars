'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Shield, 
  Eye, 
  EyeOff, 
  Lock, 
  Users, 
  MessageCircle, 
  Phone, 
  MapPin,
  Star,
  AlertTriangle,
  Info,
  Settings
} from 'lucide-react'

interface RideSharingPrivacyProps {
  onSaveSettings?: (settings: PrivacySettings) => void
  currentSettings?: PrivacySettings
}

export interface PrivacySettings {
  profileVisibility: 'full' | 'limited' | 'anonymous'
  shareRealName: boolean
  sharePhoneNumber: boolean
  shareProfilePhoto: boolean
  shareRating: boolean
  shareRideHistory: boolean
  allowDirectMessages: boolean
  allowPhoneCalls: boolean
  shareLocationDuringRide: boolean
  shareDestination: 'full' | 'area' | 'hidden'
  allowRatingAndReviews: boolean
  dataRetention: '30days' | '90days' | '1year' | 'indefinite'
  emergencyContactSharing: boolean
  thirdPartyDataSharing: boolean
  marketingCommunications: boolean
  blockedUsers: string[]
  reportedUsers: string[]
}

const defaultSettings: PrivacySettings = {
  profileVisibility: 'limited',
  shareRealName: false,
  sharePhoneNumber: false,
  shareProfilePhoto: true,
  shareRating: true,
  shareRideHistory: false,
  allowDirectMessages: true,
  allowPhoneCalls: false,
  shareLocationDuringRide: true,
  shareDestination: 'area',
  allowRatingAndReviews: true,
  dataRetention: '90days',
  emergencyContactSharing: true,
  thirdPartyDataSharing: false,
  marketingCommunications: false,
  blockedUsers: [],
  reportedUsers: []
}

export default function RideSharingPrivacy({
  onSaveSettings,
  currentSettings = defaultSettings
}: RideSharingPrivacyProps) {
  const [settings, setSettings] = useState<PrivacySettings>(currentSettings)
  const [hasChanges, setHasChanges] = useState(false)

  const updateSetting = <K extends keyof PrivacySettings>(
    key: K,
    value: PrivacySettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }

  const handleSave = () => {
    onSaveSettings?.(settings)
    setHasChanges(false)
  }

  const getPrivacyLevel = () => {
    const privacyScore = [
      !settings.shareRealName,
      !settings.sharePhoneNumber,
      !settings.shareProfilePhoto,
      !settings.shareRideHistory,
      !settings.allowPhoneCalls,
      settings.shareDestination === 'hidden',
      !settings.thirdPartyDataSharing,
      !settings.marketingCommunications
    ].filter(Boolean).length

    if (privacyScore >= 6) return { level: 'High', color: 'text-green-600', bg: 'bg-green-100' }
    if (privacyScore >= 4) return { level: 'Medium', color: 'text-yellow-600', bg: 'bg-yellow-100' }
    return { level: 'Low', color: 'text-red-600', bg: 'bg-red-100' }
  }

  const privacyLevel = getPrivacyLevel()

  return (
    <div className="space-y-6">
      {/* Privacy Level Indicator */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Privacy Settings
            </CardTitle>
            <Badge className={`${privacyLevel.bg} ${privacyLevel.color} border-0`}>
              {privacyLevel.level} Privacy
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
            <Info className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900">Your Privacy Matters</h4>
              <p className="text-sm text-blue-700 mt-1">
                Control what information you share with other passengers and drivers. 
                You can change these settings anytime.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Visibility */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Profile Visibility
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Profile visibility level</Label>
            <Select 
              value={settings.profileVisibility} 
              onValueChange={(value: any) => updateSetting('profileVisibility', value)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full">Full Profile - Show all information</SelectItem>
                <SelectItem value="limited">Limited Profile - Show basic information only</SelectItem>
                <SelectItem value="anonymous">Anonymous - Minimal information</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 mt-1">
              Controls how much of your profile other users can see
            </p>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Share real name</Label>
                <p className="text-xs text-gray-500">Show your actual name instead of username</p>
              </div>
              <Switch
                checked={settings.shareRealName}
                onCheckedChange={(checked) => updateSetting('shareRealName', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Share phone number</Label>
                <p className="text-xs text-gray-500">Allow other passengers to see your phone number</p>
              </div>
              <Switch
                checked={settings.sharePhoneNumber}
                onCheckedChange={(checked) => updateSetting('sharePhoneNumber', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Share profile photo</Label>
                <p className="text-xs text-gray-500">Display your profile picture to other users</p>
              </div>
              <Switch
                checked={settings.shareProfilePhoto}
                onCheckedChange={(checked) => updateSetting('shareProfilePhoto', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Share rating</Label>
                <p className="text-xs text-gray-500">Show your passenger rating to others</p>
              </div>
              <Switch
                checked={settings.shareRating}
                onCheckedChange={(checked) => updateSetting('shareRating', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Share ride history</Label>
                <p className="text-xs text-gray-500">Allow others to see your past ride statistics</p>
              </div>
              <Switch
                checked={settings.shareRideHistory}
                onCheckedChange={(checked) => updateSetting('shareRideHistory', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Communication Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Communication Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Allow direct messages</Label>
              <p className="text-xs text-gray-500">Let other passengers send you messages</p>
            </div>
            <Switch
              checked={settings.allowDirectMessages}
              onCheckedChange={(checked) => updateSetting('allowDirectMessages', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Allow phone calls</Label>
              <p className="text-xs text-gray-500">Allow others to call you directly</p>
            </div>
            <Switch
              checked={settings.allowPhoneCalls}
              onCheckedChange={(checked) => updateSetting('allowPhoneCalls', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Location & Destination Privacy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Location Privacy
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Share location during ride</Label>
              <p className="text-xs text-gray-500">Allow real-time location sharing with ride participants</p>
            </div>
            <Switch
              checked={settings.shareLocationDuringRide}
              onCheckedChange={(checked) => updateSetting('shareLocationDuringRide', checked)}
            />
          </div>

          <div>
            <Label className="text-sm font-medium">Destination sharing level</Label>
            <Select 
              value={settings.shareDestination} 
              onValueChange={(value: any) => updateSetting('shareDestination', value)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full">Full Address - Show exact destination</SelectItem>
                <SelectItem value="area">Area Only - Show general area/neighborhood</SelectItem>
                <SelectItem value="hidden">Hidden - Don't show destination</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 mt-1">
              Controls how much destination information others can see
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Safety & Reviews */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Safety & Reviews
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Allow rating and reviews</Label>
              <p className="text-xs text-gray-500">Let others rate and review your ride behavior</p>
            </div>
            <Switch
              checked={settings.allowRatingAndReviews}
              onCheckedChange={(checked) => updateSetting('allowRatingAndReviews', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Emergency contact sharing</Label>
              <p className="text-xs text-gray-500">Share emergency contact info in case of incidents</p>
            </div>
            <Switch
              checked={settings.emergencyContactSharing}
              onCheckedChange={(checked) => updateSetting('emergencyContactSharing', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Data Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Data retention period</Label>
            <Select 
              value={settings.dataRetention} 
              onValueChange={(value: any) => updateSetting('dataRetention', value)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30days">30 Days</SelectItem>
                <SelectItem value="90days">90 Days</SelectItem>
                <SelectItem value="1year">1 Year</SelectItem>
                <SelectItem value="indefinite">Keep Indefinitely</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 mt-1">
              How long to keep your ride sharing data
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Third-party data sharing</Label>
              <p className="text-xs text-gray-500">Allow sharing anonymized data with partners</p>
            </div>
            <Switch
              checked={settings.thirdPartyDataSharing}
              onCheckedChange={(checked) => updateSetting('thirdPartyDataSharing', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Marketing communications</Label>
              <p className="text-xs text-gray-500">Receive promotional emails and notifications</p>
            </div>
            <Switch
              checked={settings.marketingCommunications}
              onCheckedChange={(checked) => updateSetting('marketingCommunications', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Blocked Users */}
      {settings.blockedUsers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <EyeOff className="h-5 w-5" />
              Blocked Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {settings.blockedUsers.map((userId, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm">User {userId.slice(-6)}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newBlockedUsers = settings.blockedUsers.filter(id => id !== userId)
                      updateSetting('blockedUsers', newBlockedUsers)
                    }}
                  >
                    Unblock
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Privacy Tips */}
      <Card className="border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-600">
            <Shield className="h-5 w-5" />
            Privacy Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2"></div>
              <p>Use a username instead of your real name for better privacy</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2"></div>
              <p>Limit destination sharing to area-level for personal security</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2"></div>
              <p>Keep emergency contact sharing enabled for safety</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2"></div>
              <p>Report any inappropriate behavior immediately</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSave}
          disabled={!hasChanges}
          className="flex items-center gap-2"
        >
          <Settings className="h-4 w-4" />
          Save Privacy Settings
        </Button>
      </div>
    </div>
  )
}