'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  Users, 
  UserPlus, 
  UserMinus,
  Eye, 
  Edit, 
  Share2,
  Lock,
  Unlock,
  Globe,
  Building,
  User,
  Crown,
  Settings,
  Mail,
  Link,
  Copy,
  Calendar,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Permission {
  id: string;
  action: 'view' | 'edit' | 'delete' | 'share' | 'export' | 'schedule';
  label: string;
  description: string;
  icon: React.ComponentType<any>;
}

interface UserPermission {
  userId: string;
  userEmail: string;
  userName: string;
  userRole: 'admin' | 'manager' | 'analyst' | 'viewer';
  permissions: string[];
  grantedBy: string;
  grantedAt: Date;
  expiresAt?: Date;
  isActive: boolean;
}

interface ShareLink {
  id: string;
  url: string;
  permissions: string[];
  expiresAt?: Date;
  accessCount: number;
  maxAccess?: number;
  isActive: boolean;
  createdAt: Date;
  createdBy: string;
}

interface ReportPermissionsProps {
  reportId: string;
  reportTitle: string;
  ownerId: string;
  currentUserId: string;
  currentUserRole: 'admin' | 'manager' | 'analyst' | 'viewer';
  onPermissionsChange?: (permissions: UserPermission[]) => void;
}

const AVAILABLE_PERMISSIONS: Permission[] = [
  {
    id: 'view',
    action: 'view',
    label: 'View Report',
    description: 'Can view the report and its data',
    icon: Eye
  },
  {
    id: 'edit',
    action: 'edit',
    label: 'Edit Report',
    description: 'Can modify report content and configuration',
    icon: Edit
  },
  {
    id: 'share',
    action: 'share',
    label: 'Share Report',
    description: 'Can share the report with others',
    icon: Share2
  },
  {
    id: 'export',
    action: 'export',
    label: 'Export Report',
    description: 'Can export the report in various formats',
    icon: Share2
  },
  {
    id: 'schedule',
    action: 'schedule',
    label: 'Schedule Report',
    description: 'Can create automated report schedules',
    icon: Calendar
  },
  {
    id: 'delete',
    action: 'delete',
    label: 'Delete Report',
    description: 'Can permanently delete the report',
    icon: AlertTriangle
  }
];

const ROLE_PERMISSIONS = {
  admin: ['view', 'edit', 'share', 'export', 'schedule', 'delete'],
  manager: ['view', 'edit', 'share', 'export', 'schedule'],
  analyst: ['view', 'share', 'export'],
  viewer: ['view']
};

export function ReportPermissions({ 
  reportId, 
  reportTitle, 
  ownerId, 
  currentUserId, 
  currentUserRole,
  onPermissionsChange 
}: ReportPermissionsProps) {
  const [userPermissions, setUserPermissions] = useState<UserPermission[]>([]);
  const [shareLinks, setShareLinks] = useState<ShareLink[]>([]);
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('users');
  const { toast } = useToast();

  // Add user form state
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPermissions, setNewUserPermissions] = useState<string[]>(['view']);
  const [newUserExpiry, setNewUserExpiry] = useState<string>('');

  // Share link form state
  const [showCreateLink, setShowCreateLink] = useState(false);
  const [linkPermissions, setLinkPermissions] = useState<string[]>(['view']);
  const [linkExpiry, setLinkExpiry] = useState<string>('');
  const [linkMaxAccess, setLinkMaxAccess] = useState<string>('');

  useEffect(() => {
    loadPermissions();
  }, [reportId]);

  const loadPermissions = async () => {
    try {
      setLoading(true);
      
      // Mock data - in real implementation, fetch from API
      const mockUserPermissions: UserPermission[] = [
        {
          userId: 'user1',
          userEmail: 'john.smith@company.com',
          userName: 'John Smith',
          userRole: 'manager',
          permissions: ['view', 'edit', 'share', 'export'],
          grantedBy: currentUserId,
          grantedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          isActive: true
        },
        {
          userId: 'user2',
          userEmail: 'sarah.johnson@company.com',
          userName: 'Sarah Johnson',
          userRole: 'analyst',
          permissions: ['view', 'export'],
          grantedBy: currentUserId,
          grantedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          isActive: true
        }
      ];

      const mockShareLinks: ShareLink[] = [
        {
          id: 'link1',
          url: `https://gocars.com/reports/${reportId}/shared/abc123`,
          permissions: ['view'],
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          accessCount: 15,
          maxAccess: 50,
          isActive: true,
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          createdBy: currentUserId
        }
      ];

      setUserPermissions(mockUserPermissions);
      setShareLinks(mockShareLinks);
      setIsPublic(false);
    } catch (error) {
      console.error('Error loading permissions:', error);
      toast({
        title: 'Error',
        description: 'Failed to load permissions data.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async () => {
    if (!newUserEmail || newUserPermissions.length === 0) {
      toast({
        title: 'Error',
        description: 'Please enter an email and select at least one permission.',
        variant: 'destructive'
      });
      return;
    }

    try {
      const newPermission: UserPermission = {
        userId: `user_${Date.now()}`,
        userEmail: newUserEmail,
        userName: newUserEmail.split('@')[0], // Mock name from email
        userRole: 'viewer', // Default role
        permissions: newUserPermissions,
        grantedBy: currentUserId,
        grantedAt: new Date(),
        expiresAt: newUserExpiry ? new Date(newUserExpiry) : undefined,
        isActive: true
      };

      setUserPermissions(prev => [...prev, newPermission]);
      
      // Reset form
      setNewUserEmail('');
      setNewUserPermissions(['view']);
      setNewUserExpiry('');
      setShowAddUser(false);

      toast({
        title: 'Success',
        description: `Access granted to ${newUserEmail}`,
      });

      if (onPermissionsChange) {
        onPermissionsChange([...userPermissions, newPermission]);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add user permissions.',
        variant: 'destructive'
      });
    }
  };

  const handleRemoveUser = async (userId: string) => {
    try {
      setUserPermissions(prev => prev.filter(p => p.userId !== userId));
      
      toast({
        title: 'Success',
        description: 'User access removed successfully.',
      });

      if (onPermissionsChange) {
        onPermissionsChange(userPermissions.filter(p => p.userId !== userId));
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to remove user access.',
        variant: 'destructive'
      });
    }
  };

  const handleUpdateUserPermissions = async (userId: string, permissions: string[]) => {
    try {
      setUserPermissions(prev => prev.map(p => 
        p.userId === userId ? { ...p, permissions } : p
      ));

      toast({
        title: 'Success',
        description: 'Permissions updated successfully.',
      });

      if (onPermissionsChange) {
        onPermissionsChange(userPermissions.map(p => 
          p.userId === userId ? { ...p, permissions } : p
        ));
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update permissions.',
        variant: 'destructive'
      });
    }
  };

  const handleCreateShareLink = async () => {
    if (linkPermissions.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one permission for the share link.',
        variant: 'destructive'
      });
      return;
    }

    try {
      const newLink: ShareLink = {
        id: `link_${Date.now()}`,
        url: `https://gocars.com/reports/${reportId}/shared/${Math.random().toString(36).substr(2, 9)}`,
        permissions: linkPermissions,
        expiresAt: linkExpiry ? new Date(linkExpiry) : undefined,
        accessCount: 0,
        maxAccess: linkMaxAccess ? parseInt(linkMaxAccess) : undefined,
        isActive: true,
        createdAt: new Date(),
        createdBy: currentUserId
      };

      setShareLinks(prev => [...prev, newLink]);
      
      // Reset form
      setLinkPermissions(['view']);
      setLinkExpiry('');
      setLinkMaxAccess('');
      setShowCreateLink(false);

      toast({
        title: 'Success',
        description: 'Share link created successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create share link.',
        variant: 'destructive'
      });
    }
  };

  const handleTogglePublic = async (isPublic: boolean) => {
    try {
      setIsPublic(isPublic);
      
      toast({
        title: 'Success',
        description: `Report is now ${isPublic ? 'public' : 'private'}.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update public access.',
        variant: 'destructive'
      });
    }
  };

  const copyShareLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: 'Link Copied',
        description: 'Share link copied to clipboard',
      });
    } catch (error) {
      toast({
        title: 'Copy Failed',
        description: 'Could not copy link to clipboard',
        variant: 'destructive'
      });
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Crown className="h-4 w-4 text-yellow-600" />;
      case 'manager': return <Building className="h-4 w-4 text-blue-600" />;
      case 'analyst': return <Settings className="h-4 w-4 text-green-600" />;
      case 'viewer': return <User className="h-4 w-4 text-gray-600" />;
      default: return <User className="h-4 w-4 text-gray-600" />;
    }
  };

  const canManagePermissions = currentUserRole === 'admin' || currentUserId === ownerId;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Report Permissions</h2>
          <p className="text-gray-600">Manage access and sharing for "{reportTitle}"</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={isPublic ? "default" : "secondary"}>
            {isPublic ? (
              <>
                <Globe className="h-3 w-3 mr-1" />
                Public
              </>
            ) : (
              <>
                <Lock className="h-3 w-3 mr-1" />
                Private
              </>
            )}
          </Badge>
          {canManagePermissions && (
            <Switch
              checked={isPublic}
              onCheckedChange={handleTogglePublic}
            />
          )}
        </div>
      </div>

      {/* Public Access Warning */}
      {isPublic && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Globe className="h-5 w-5 text-orange-600" />
              <div>
                <h4 className="font-medium text-orange-800">Public Access Enabled</h4>
                <p className="text-sm text-orange-700">
                  This report is publicly accessible. Anyone with the link can view it.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users">User Access</TabsTrigger>
          <TabsTrigger value="links">Share Links</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* User Access Tab */}
        <TabsContent value="users" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">User Permissions</h3>
              <p className="text-sm text-gray-600">Manage individual user access to this report</p>
            </div>
            {canManagePermissions && (
              <Button onClick={() => setShowAddUser(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            )}
          </div>

          {/* Add User Form */}
          {showAddUser && (
            <Card>
              <CardHeader>
                <CardTitle>Add User Access</CardTitle>
                <CardDescription>Grant access to a new user</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Email Address</label>
                  <Input
                    type="email"
                    placeholder="user@company.com"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Permissions</label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {AVAILABLE_PERMISSIONS.filter(p => p.id !== 'delete').map((permission) => {
                      const Icon = permission.icon;
                      return (
                        <div key={permission.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`new-${permission.id}`}
                            checked={newUserPermissions.includes(permission.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setNewUserPermissions([...newUserPermissions, permission.id]);
                              } else {
                                setNewUserPermissions(newUserPermissions.filter(p => p !== permission.id));
                              }
                            }}
                          />
                          <label htmlFor={`new-${permission.id}`} className="text-sm flex items-center space-x-1">
                            <Icon className="h-3 w-3" />
                            <span>{permission.label}</span>
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Expiry Date (Optional)</label>
                  <Input
                    type="datetime-local"
                    value={newUserExpiry}
                    onChange={(e) => setNewUserExpiry(e.target.value)}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Button onClick={handleAddUser}>
                    Add User
                  </Button>
                  <Button variant="outline" onClick={() => setShowAddUser(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Users List */}
          <Card>
            <CardContent className="p-0">
              <ScrollArea className="h-96">
                <div className="space-y-1">
                  {userPermissions.map((userPerm) => (
                    <div key={userPerm.userId} className="p-4 border-b last:border-b-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                            <User className="h-4 w-4 text-gray-600" />
                          </div>
                          <div>
                            <h4 className="font-medium">{userPerm.userName}</h4>
                            <p className="text-sm text-gray-600">{userPerm.userEmail}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getRoleIcon(userPerm.userRole)}
                          <Badge variant="outline" className="capitalize">
                            {userPerm.userRole}
                          </Badge>
                          {canManagePermissions && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRemoveUser(userPerm.userId)}
                            >
                              <UserMinus className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {userPerm.permissions.map((permId) => {
                            const permission = AVAILABLE_PERMISSIONS.find(p => p.id === permId);
                            if (!permission) return null;
                            const Icon = permission.icon;
                            return (
                              <Badge key={permId} variant="secondary" className="text-xs">
                                <Icon className="h-3 w-3 mr-1" />
                                {permission.label}
                              </Badge>
                            );
                          })}
                        </div>
                        <div className="text-xs text-gray-500">
                          {userPerm.expiresAt ? (
                            <span className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              Expires {userPerm.expiresAt.toLocaleDateString()}
                            </span>
                          ) : (
                            'No expiry'
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {userPermissions.length === 0 && (
                    <div className="text-center text-gray-500 py-8">
                      <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p>No users have been granted access yet</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Share Links Tab */}
        <TabsContent value="links" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">Share Links</h3>
              <p className="text-sm text-gray-600">Create shareable links with specific permissions</p>
            </div>
            {canManagePermissions && (
              <Button onClick={() => setShowCreateLink(true)}>
                <Link className="h-4 w-4 mr-2" />
                Create Link
              </Button>
            )}
          </div>

          {/* Create Link Form */}
          {showCreateLink && (
            <Card>
              <CardHeader>
                <CardTitle>Create Share Link</CardTitle>
                <CardDescription>Generate a shareable link with custom permissions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Link Permissions</label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {AVAILABLE_PERMISSIONS.filter(p => !['delete', 'edit'].includes(p.id)).map((permission) => {
                      const Icon = permission.icon;
                      return (
                        <div key={permission.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`link-${permission.id}`}
                            checked={linkPermissions.includes(permission.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setLinkPermissions([...linkPermissions, permission.id]);
                              } else {
                                setLinkPermissions(linkPermissions.filter(p => p !== permission.id));
                              }
                            }}
                          />
                          <label htmlFor={`link-${permission.id}`} className="text-sm flex items-center space-x-1">
                            <Icon className="h-3 w-3" />
                            <span>{permission.label}</span>
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Expiry Date (Optional)</label>
                    <Input
                      type="datetime-local"
                      value={linkExpiry}
                      onChange={(e) => setLinkExpiry(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Max Access Count (Optional)</label>
                    <Input
                      type="number"
                      placeholder="Unlimited"
                      value={linkMaxAccess}
                      onChange={(e) => setLinkMaxAccess(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Button onClick={handleCreateShareLink}>
                    Create Link
                  </Button>
                  <Button variant="outline" onClick={() => setShowCreateLink(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Share Links List */}
          <Card>
            <CardContent className="p-0">
              <ScrollArea className="h-96">
                <div className="space-y-1">
                  {shareLinks.map((link) => (
                    <div key={link.id} className="p-4 border-b last:border-b-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Link className="h-4 w-4 text-blue-600" />
                          <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                            {link.url.split('/').pop()}
                          </span>
                          <Badge variant={link.isActive ? "default" : "secondary"}>
                            {link.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyShareLink(link.url)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {link.permissions.map((permId) => {
                            const permission = AVAILABLE_PERMISSIONS.find(p => p.id === permId);
                            if (!permission) return null;
                            const Icon = permission.icon;
                            return (
                              <Badge key={permId} variant="secondary" className="text-xs">
                                <Icon className="h-3 w-3 mr-1" />
                                {permission.label}
                              </Badge>
                            );
                          })}
                        </div>
                        <div className="text-xs text-gray-500">
                          {link.accessCount} / {link.maxAccess || '∞'} uses
                        </div>
                      </div>

                      {link.expiresAt && (
                        <div className="text-xs text-gray-500 mt-1">
                          Expires: {link.expiresAt.toLocaleString()}
                        </div>
                      )}
                    </div>
                  ))}

                  {shareLinks.length === 0 && (
                    <div className="text-center text-gray-500 py-8">
                      <Link className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p>No share links created yet</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Permission Settings</CardTitle>
              <CardDescription>Configure default permissions and access controls</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Public Access</h4>
                    <p className="text-sm text-gray-600">Allow anyone with the link to view this report</p>
                  </div>
                  <Switch
                    checked={isPublic}
                    onCheckedChange={handleTogglePublic}
                    disabled={!canManagePermissions}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Require Authentication</h4>
                    <p className="text-sm text-gray-600">Users must be logged in to access this report</p>
                  </div>
                  <Switch defaultChecked disabled={!canManagePermissions} />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Allow Export</h4>
                    <p className="text-sm text-gray-600">Users can export this report in various formats</p>
                  </div>
                  <Switch defaultChecked disabled={!canManagePermissions} />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Track Access</h4>
                    <p className="text-sm text-gray-600">Log all access attempts and downloads</p>
                  </div>
                  <Switch defaultChecked disabled={!canManagePermissions} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Access Summary</CardTitle>
              <CardDescription>Overview of current access permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{userPermissions.length}</div>
                  <div className="text-sm text-gray-600">Users</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{shareLinks.length}</div>
                  <div className="text-sm text-gray-600">Share Links</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {shareLinks.reduce((sum, link) => sum + link.accessCount, 0)}
                  </div>
                  <div className="text-sm text-gray-600">Total Access</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {isPublic ? 'Public' : 'Private'}
                  </div>
                  <div className="text-sm text-gray-600">Visibility</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}