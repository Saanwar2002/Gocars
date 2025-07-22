/**
 * Group Chat Component for GoCars
 * Multi-participant chat with advanced group management features
 */

import React, { useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Users, 
  Plus, 
  Settings, 
  Crown, 
  Shield, 
  UserMinus, 
  UserPlus,
  Volume2,
  VolumeX,
  Bell,
  BellOff,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  LogOut,
  Copy,
  Share,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  MessageSquare,
  Phone,
  Video,
  Calendar,
  MapPin,
  FileText,
  Image,
  Mic
} from 'lucide-react'

// Group Chat Types
export interface GroupChatMember {
  id: string
  name: string
  avatar?: string
  role: 'admin' | 'moderator' | 'member'
  userRole: 'passenger' | 'driver' | 'operator' | 'admin'
  isOnline: boolean
  lastSeen?: number
  permissions: {
    canAddMembers: boolean
    canRemoveMembers: boolean
    canEditGroup: boolean
    canDeleteMessages: boolean
    canMuteMembers: boolean
  }
  joinedAt: number
  mutedUntil?: number
}

export interface GroupChatInfo {
  id: string
  name: string
  description?: string
  avatar?: string
  type: 'ride_group' | 'fleet_team' | 'support_team' | 'custom'
  privacy: 'public' | 'private' | 'invite_only'
  members: GroupChatMember[]
  admins: string[]
  createdBy: string
  createdAt: number
  settings: {
    allowMemberInvites: boolean
    requireApproval: boolean
    muteNonAdmins: boolean
    allowFileSharing: boolean
    allowLocationSharing: boolean
    allowVoiceMessages: boolean
    messageRetention: number // days
  }
  metadata?: {
    rideId?: string
    fleetId?: string
    supportTicketId?: string
  }
}

interface GroupChatProps {
  userId: string
  userRole: string
  groupId: string
  className?: string
}

export const GroupChat: React.FC<GroupChatProps> = ({
  userId,
  userRole,
  groupId,
  className
}) => {
  // State management
  const [showGroupInfo, setShowGroupInfo] = useState(false)
  const [showAddMember, setShowAddMember] = useState(false)
  const [showGroupSettings, setShowGroupSettings] = useState(false)
  const [searchMembers, setSearchMembers] = useState('')
  const [newMemberEmail, setNewMemberEmail] = useState('')
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])

  // Demo group data
  const [groupInfo, setGroupInfo] = useState<GroupChatInfo>({
    id: groupId,
    name: 'Downtown Fleet Team',
    description: 'Coordination for downtown area drivers and operators',
    type: 'fleet_team',
    privacy: 'private',
    createdBy: 'operator_001',
    createdAt: Date.now() - 86400000 * 7, // 7 days ago
    admins: ['operator_001', 'admin_001'],
    members: [
      {
        id: 'operator_001',
        name: 'Sarah Operator',
        role: 'admin',
        userRole: 'operator',
        isOnline: true,
        permissions: {
          canAddMembers: true,
          canRemoveMembers: true,
          canEditGroup: true,
          canDeleteMessages: true,
          canMuteMembers: true
        },
        joinedAt: Date.now() - 86400000 * 7
      },
      {
        id: 'driver_001',
        name: 'John Driver',
        role: 'member',
        userRole: 'driver',
        isOnline: true,
        permissions: {
          canAddMembers: false,
          canRemoveMembers: false,
          canEditGroup: false,
          canDeleteMessages: false,
          canMuteMembers: false
        },
        joinedAt: Date.now() - 86400000 * 5
      },
      {
        id: 'driver_002',
        name: 'Mike Driver',
        role: 'moderator',
        userRole: 'driver',
        isOnline: false,
        lastSeen: Date.now() - 3600000,
        permissions: {
          canAddMembers: true,
          canRemoveMembers: false,
          canEditGroup: false,
          canDeleteMessages: true,
          canMuteMembers: true
        },
        joinedAt: Date.now() - 86400000 * 3
      },
      {
        id: userId,
        name: 'You',
        role: 'member',
        userRole: userRole as any,
        isOnline: true,
        permissions: {
          canAddMembers: false,
          canRemoveMembers: false,
          canEditGroup: false,
          canDeleteMessages: false,
          canMuteMembers: false
        },
        joinedAt: Date.now() - 86400000 * 2
      }
    ],
    settings: {
      allowMemberInvites: true,
      requireApproval: false,
      muteNonAdmins: false,
      allowFileSharing: true,
      allowLocationSharing: true,
      allowVoiceMessages: true,
      messageRetention: 30
    }
  })

  const currentMember = groupInfo.members.find(m => m.id === userId)
  const isAdmin = currentMember?.role === 'admin'
  const isModerator = currentMember?.role === 'moderator' || isAdmin

  const filteredMembers = groupInfo.members.filter(member =>
    member.name.toLowerCase().includes(searchMembers.toLowerCase())
  )

  // Group management functions
  const handleAddMember = () => {
    if (!newMemberEmail.trim()) return

    const newMember: GroupChatMember = {
      id: `user_${Date.now()}`,
      name: newMemberEmail.split('@')[0],
      role: 'member',
      userRole: 'passenger',
      isOnline: false,
      permissions: {
        canAddMembers: false,
        canRemoveMembers: false,
        canEditGroup: false,
        canDeleteMessages: false,
        canMuteMembers: false
      },
      joinedAt: Date.now()
    }

    setGroupInfo(prev => ({
      ...prev,
      members: [...prev.members, newMember]
    }))

    setNewMemberEmail('')
    setShowAddMember(false)
  }

  const handleRemoveMember = (memberId: string) => {
    setGroupInfo(prev => ({
      ...prev,
      members: prev.members.filter(m => m.id !== memberId)
    }))
  }

  const handlePromoteMember = (memberId: string, newRole: 'admin' | 'moderator' | 'member') => {
    setGroupInfo(prev => ({
      ...prev,
      members: prev.members.map(m => 
        m.id === memberId 
          ? { 
              ...m, 
              role: newRole,
              permissions: getPermissionsForRole(newRole)
            }
          : m
      ),
      admins: newRole === 'admin' 
        ? [...prev.admins, memberId]
        : prev.admins.filter(id => id !== memberId)
    }))
  }

  const handleMuteMember = (memberId: string, duration: number) => {
    setGroupInfo(prev => ({
      ...prev,
      members: prev.members.map(m => 
        m.id === memberId 
          ? { ...m, mutedUntil: Date.now() + duration }
          : m
      )
    }))
  }

  const handleUpdateGroupSettings = (newSettings: Partial<GroupChatInfo['settings']>) => {
    setGroupInfo(prev => ({
      ...prev,
      settings: { ...prev.settings, ...newSettings }
    }))
  }

  const handleLeaveGroup = () => {
    // In real app, this would call API to leave group
    console.log('Leaving group:', groupId)
  }

  const getPermissionsForRole = (role: 'admin' | 'moderator' | 'member') => {
    switch (role) {
      case 'admin':
        return {
          canAddMembers: true,
          canRemoveMembers: true,
          canEditGroup: true,
          canDeleteMessages: true,
          canMuteMembers: true
        }
      case 'moderator':
        return {
          canAddMembers: true,
          canRemoveMembers: false,
          canEditGroup: false,
          canDeleteMessages: true,
          canMuteMembers: true
        }
      default:
        return {
          canAddMembers: false,
          canRemoveMembers: false,
          canEditGroup: false,
          canDeleteMessages: false,
          canMuteMembers: false
        }
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Crown className="h-3 w-3 text-yellow-500" />
      case 'moderator':
        return <Shield className="h-3 w-3 text-blue-500" />
      default:
        return null
    }
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'default'
      case 'moderator':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Group Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={groupInfo.avatar} />
                <AvatarFallback>{groupInfo.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="flex items-center gap-2">
                  {groupInfo.name}
                  {groupInfo.privacy === 'private' && <Lock className="h-4 w-4 text-muted-foreground" />}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {groupInfo.members.length} members • {groupInfo.members.filter(m => m.isOnline).length} online
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon">
                <Phone className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon">
                <Video className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setShowGroupInfo(true)}>
                <Users className="h-4 w-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setShowGroupInfo(true)}>
                    <Users className="h-4 w-4 mr-2" />
                    Group Info
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem onClick={() => setShowGroupSettings(true)}>
                      <Settings className="h-4 w-4 mr-2" />
                      Group Settings
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem>
                    <Bell className="h-4 w-4 mr-2" />
                    Mute Notifications
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Share className="h-4 w-4 mr-2" />
                    Share Group
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLeaveGroup} className="text-destructive">
                    <LogOut className="h-4 w-4 mr-2" />
                    Leave Group
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Group Info Dialog */}
      <Dialog open={showGroupInfo} onOpenChange={setShowGroupInfo}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Group Information
            </DialogTitle>
            <DialogDescription>
              Manage group members and view group details
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Group Details */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={groupInfo.avatar} />
                  <AvatarFallback className="text-lg">{groupInfo.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{groupInfo.name}</h3>
                  <p className="text-sm text-muted-foreground">{groupInfo.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline">{groupInfo.type.replace('_', ' ')}</Badge>
                    <Badge variant="outline">{groupInfo.privacy}</Badge>
                  </div>
                </div>
                {isAdmin && (
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                )}
              </div>
            </div>

            <Separator />

            {/* Members Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Members ({groupInfo.members.length})</h4>
                {(isAdmin || groupInfo.settings.allowMemberInvites) && (
                  <Button size="sm" onClick={() => setShowAddMember(true)}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Member
                  </Button>
                )}
              </div>

              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search members..."
                  value={searchMembers}
                  onChange={(e) => setSearchMembers(e.target.value)}
                  className="pl-8"
                />
              </div>

              <ScrollArea className="h-64">
                <div className="space-y-2">
                  {filteredMembers.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={member.avatar} />
                            <AvatarFallback className="text-xs">{member.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          {member.isOnline && (
                            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{member.name}</span>
                            {getRoleIcon(member.role)}
                            <Badge variant={getRoleBadgeVariant(member.role)} className="text-xs">
                              {member.role}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {member.isOnline ? 'Online' : `Last seen ${new Date(member.lastSeen || 0).toLocaleString()}`}
                          </p>
                        </div>
                      </div>

                      {(isAdmin || (isModerator && member.role === 'member')) && member.id !== userId && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                              <MoreVertical className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            {isAdmin && (
                              <>
                                <DropdownMenuItem onClick={() => handlePromoteMember(member.id, 'admin')}>
                                  <Crown className="h-4 w-4 mr-2" />
                                  Make Admin
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handlePromoteMember(member.id, 'moderator')}>
                                  <Shield className="h-4 w-4 mr-2" />
                                  Make Moderator
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                              </>
                            )}
                            {isModerator && (
                              <>
                                <DropdownMenuItem onClick={() => handleMuteMember(member.id, 3600000)}>
                                  <VolumeX className="h-4 w-4 mr-2" />
                                  Mute for 1 hour
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleMuteMember(member.id, 86400000)}>
                                  <VolumeX className="h-4 w-4 mr-2" />
                                  Mute for 1 day
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                              </>
                            )}
                            {(isAdmin || (isModerator && member.role === 'member')) && (
                              <DropdownMenuItem 
                                onClick={() => handleRemoveMember(member.id)}
                                className="text-destructive"
                              >
                                <UserMinus className="h-4 w-4 mr-2" />
                                Remove Member
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Member Dialog */}
      <Dialog open={showAddMember} onOpenChange={setShowAddMember}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Member</DialogTitle>
            <DialogDescription>
              Invite new members to join the group
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Email or Username</Label>
              <Input
                placeholder="Enter email or username"
                value={newMemberEmail}
                onChange={(e) => setNewMemberEmail(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddMember(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddMember}>
              <UserPlus className="h-4 w-4 mr-2" />
              Add Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Group Settings Dialog */}
      <Dialog open={showGroupSettings} onOpenChange={setShowGroupSettings}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Group Settings</DialogTitle>
            <DialogDescription>
              Configure group permissions and behavior
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Member Permissions */}
            <div className="space-y-4">
              <h4 className="font-medium">Member Permissions</h4>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Allow member invites</Label>
                    <p className="text-sm text-muted-foreground">Let members invite others to the group</p>
                  </div>
                  <Switch
                    checked={groupInfo.settings.allowMemberInvites}
                    onCheckedChange={(checked) => handleUpdateGroupSettings({ allowMemberInvites: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Require approval</Label>
                    <p className="text-sm text-muted-foreground">New members need admin approval</p>
                  </div>
                  <Switch
                    checked={groupInfo.settings.requireApproval}
                    onCheckedChange={(checked) => handleUpdateGroupSettings({ requireApproval: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Mute non-admins</Label>
                    <p className="text-sm text-muted-foreground">Only admins and moderators can send messages</p>
                  </div>
                  <Switch
                    checked={groupInfo.settings.muteNonAdmins}
                    onCheckedChange={(checked) => handleUpdateGroupSettings({ muteNonAdmins: checked })}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Content Permissions */}
            <div className="space-y-4">
              <h4 className="font-medium">Content Permissions</h4>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Allow file sharing</Label>
                    <p className="text-sm text-muted-foreground">Members can share files and images</p>
                  </div>
                  <Switch
                    checked={groupInfo.settings.allowFileSharing}
                    onCheckedChange={(checked) => handleUpdateGroupSettings({ allowFileSharing: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Allow location sharing</Label>
                    <p className="text-sm text-muted-foreground">Members can share their location</p>
                  </div>
                  <Switch
                    checked={groupInfo.settings.allowLocationSharing}
                    onCheckedChange={(checked) => handleUpdateGroupSettings({ allowLocationSharing: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Allow voice messages</Label>
                    <p className="text-sm text-muted-foreground">Members can send voice recordings</p>
                  </div>
                  <Switch
                    checked={groupInfo.settings.allowVoiceMessages}
                    onCheckedChange={(checked) => handleUpdateGroupSettings({ allowVoiceMessages: checked })}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Message Retention */}
            <div className="space-y-4">
              <h4 className="font-medium">Message Retention</h4>
              <div className="space-y-2">
                <Label>Delete messages after</Label>
                <Select
                  value={groupInfo.settings.messageRetention.toString()}
                  onValueChange={(value) => handleUpdateGroupSettings({ messageRetention: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 days</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="90">90 days</SelectItem>
                    <SelectItem value="365">1 year</SelectItem>
                    <SelectItem value="0">Never</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGroupSettings(false)}>
              Cancel
            </Button>
            <Button onClick={() => setShowGroupSettings(false)}>
              Save Settings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default GroupChat