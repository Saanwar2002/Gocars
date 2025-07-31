'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  MoreHorizontal,
  Star,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Car,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Download,
  Upload,
  Edit,
  Trash2,
  Eye,
  UserCheck,
  UserX,
  Pause,
  Play
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { driverManagementService, DriverProfile, DriverSearchFilters } from '@/services/driverManagementService';
import DriverOnboardingWizard from './driver-onboarding-wizard';
import DriverProfileManagement from './driver-profile-management';

export default function DriverManagementDashboard() {
  const [drivers, setDrivers] = useState<DriverProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<DriverSearchFilters>({});
  const [selectedDriver, setSelectedDriver] = useState<DriverProfile | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [statistics, setStatistics] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadDrivers();
    loadStatistics();
  }, [filters]);

  const loadDrivers = async () => {
    try {
      setLoading(true);
      const result = await driverManagementService.getDrivers(filters, 50);
      setDrivers(result.drivers);
    } catch (error) {
      console.error('Failed to load drivers:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const stats = await driverManagementService.getDriverStatistics();
      setStatistics(stats);
    } catch (error) {
      console.error('Failed to load statistics:', error);
    }
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    // Implement search logic
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleDriverAction = async (action: string, driverId: string, reason?: string) => {
    try {
      setActionLoading(driverId);
      
      switch (action) {
        case 'approve':
          await driverManagementService.approveDriver(driverId, 'admin');
          break;
        case 'reject':
          await driverManagementService.rejectDriver(driverId, reason || 'Application rejected');
          break;
        case 'suspend':
          await driverManagementService.suspendDriver(driverId, reason || 'Account suspended');
          break;
        case 'reactivate':
          await driverManagementService.reactivateDriver(driverId);
          break;
        case 'delete':
          await driverManagementService.deleteDriver(driverId);
          break;
      }
      
      await loadDrivers();
      await loadStatistics();
    } catch (error) {
      console.error(`Failed to ${action} driver:`, error);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredDrivers = drivers.filter(driver => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      driver.personalInfo.firstName.toLowerCase().includes(searchLower) ||
      driver.personalInfo.lastName.toLowerCase().includes(searchLower) ||
      driver.personalInfo.email.toLowerCase().includes(searchLower) ||
      driver.vehicle.licensePlate.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Driver Management</h1>
          <p className="text-gray-600">Manage driver onboarding, profiles, and performance</p>
        </div>
        <Button onClick={() => setShowOnboarding(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Add New Driver
        </Button>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Drivers</p>
                  <p className="text-2xl font-bold">{statistics.total}</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Drivers</p>
                  <p className="text-2xl font-bold text-green-600">{statistics.active}</p>
                </div>
                <UserCheck className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Approval</p>
                  <p className="text-2xl font-bold text-yellow-600">{statistics.pending}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Average Rating</p>
                  <p className="text-2xl font-bold text-purple-600">{statistics.averageRating.toFixed(1)}</p>
                </div>
                <Star className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="all" className="w-full">
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="all">All Drivers</TabsTrigger>
            <TabsTrigger value="pending">Pending ({statistics?.pending || 0})</TabsTrigger>
            <TabsTrigger value="active">Active ({statistics?.active || 0})</TabsTrigger>
            <TabsTrigger value="suspended">Suspended ({statistics?.suspended || 0})</TabsTrigger>
          </TabsList>

          {/* Search and Filters */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search drivers..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuLabel>Filter by</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="p-2 space-y-2">
                  <div>
                    <Label className="text-xs">Vehicle Type</Label>
                    <Select onValueChange={(value) => handleFilterChange('vehicleType', [value])}>
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="All types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sedan">Sedan</SelectItem>
                        <SelectItem value="suv">SUV</SelectItem>
                        <SelectItem value="van">Van</SelectItem>
                        <SelectItem value="luxury">Luxury</SelectItem>
                        <SelectItem value="electric">Electric</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Sort by</Label>
                    <Select onValueChange={(value) => handleFilterChange('sortBy', value)}>
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="Name" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="name">Name</SelectItem>
                        <SelectItem value="rating">Rating</SelectItem>
                        <SelectItem value="earnings">Earnings</SelectItem>
                        <SelectItem value="joinDate">Join Date</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <TabsContent value="all">
          <DriverTable 
            drivers={filteredDrivers} 
            loading={loading}
            onAction={handleDriverAction}
            onViewProfile={(driver) => {
              setSelectedDriver(driver);
              setShowProfile(true);
            }}
            actionLoading={actionLoading}
          />
        </TabsContent>

        <TabsContent value="pending">
          <DriverTable 
            drivers={filteredDrivers.filter(d => d.status === 'pending')} 
            loading={loading}
            onAction={handleDriverAction}
            onViewProfile={(driver) => {
              setSelectedDriver(driver);
              setShowProfile(true);
            }}
            actionLoading={actionLoading}
          />
        </TabsContent>

        <TabsContent value="active">
          <DriverTable 
            drivers={filteredDrivers.filter(d => d.status === 'active')} 
            loading={loading}
            onAction={handleDriverAction}
            onViewProfile={(driver) => {
              setSelectedDriver(driver);
              setShowProfile(true);
            }}
            actionLoading={actionLoading}
          />
        </TabsContent>

        <TabsContent value="suspended">
          <DriverTable 
            drivers={filteredDrivers.filter(d => d.status === 'suspended')} 
            loading={loading}
            onAction={handleDriverAction}
            onViewProfile={(driver) => {
              setSelectedDriver(driver);
              setShowProfile(true);
            }}
            actionLoading={actionLoading}
          />
        </TabsContent>
      </Tabs>

      {/* Onboarding Dialog */}
      <Dialog open={showOnboarding} onOpenChange={setShowOnboarding}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DriverOnboardingWizard
            onComplete={(driverId) => {
              setShowOnboarding(false);
              loadDrivers();
              loadStatistics();
            }}
            onCancel={() => setShowOnboarding(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Profile Dialog */}
      <Dialog open={showProfile} onOpenChange={setShowProfile}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          {selectedDriver && (
            <DriverProfileManagement
              driverId={selectedDriver.id}
              onUpdate={() => {
                loadDrivers();
                loadStatistics();
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Driver Table Component
interface DriverTableProps {
  drivers: DriverProfile[];
  loading: boolean;
  onAction: (action: string, driverId: string, reason?: string) => void;
  onViewProfile: (driver: DriverProfile) => void;
  actionLoading: string | null;
}

function DriverTable({ drivers, loading, onAction, onViewProfile, actionLoading }: DriverTableProps) {
  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading drivers...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (drivers.length === 0) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center text-gray-500">
            <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No drivers found</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left p-4 font-medium text-gray-900">Driver</th>
                <th className="text-left p-4 font-medium text-gray-900">Vehicle</th>
                <th className="text-left p-4 font-medium text-gray-900">Status</th>
                <th className="text-left p-4 font-medium text-gray-900">Rating</th>
                <th className="text-left p-4 font-medium text-gray-900">Rides</th>
                <th className="text-left p-4 font-medium text-gray-900">Earnings</th>
                <th className="text-left p-4 font-medium text-gray-900">Joined</th>
                <th className="text-right p-4 font-medium text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {drivers.map((driver) => (
                <tr key={driver.id} className="hover:bg-gray-50">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-semibold text-blue-600">
                          {driver.personalInfo.firstName[0]}{driver.personalInfo.lastName[0]}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {driver.personalInfo.firstName} {driver.personalInfo.lastName}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {driver.personalInfo.email}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {driver.personalInfo.phone}
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="p-4">
                    <div>
                      <div className="font-medium text-gray-900">
                        {driver.vehicle.year} {driver.vehicle.make} {driver.vehicle.model}
                      </div>
                      <div className="text-sm text-gray-500">
                        {driver.vehicle.color} • {driver.vehicle.licensePlate}
                      </div>
                      <Badge variant="outline" className="text-xs mt-1">
                        {driver.vehicle.type.charAt(0).toUpperCase() + driver.vehicle.type.slice(1)}
                      </Badge>
                    </div>
                  </td>
                  
                  <td className="p-4">
                    <Badge 
                      variant={driver.status === 'active' ? 'default' : 'secondary'}
                      className={
                        driver.status === 'active' ? 'bg-green-100 text-green-800' :
                        driver.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        driver.status === 'suspended' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }
                    >
                      {driver.status.charAt(0).toUpperCase() + driver.status.slice(1)}
                    </Badge>
                  </td>
                  
                  <td className="p-4">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{driver.performance.rating.toFixed(1)}</span>
                    </div>
                  </td>
                  
                  <td className="p-4">
                    <div className="font-medium">{driver.performance.totalRides}</div>
                    <div className="text-sm text-gray-500">
                      {driver.performance.acceptanceRate}% acceptance
                    </div>
                  </td>
                  
                  <td className="p-4">
                    <div className="font-medium">${driver.performance.earnings.total.toLocaleString()}</div>
                    <div className="text-sm text-gray-500">
                      ${driver.performance.earnings.thisMonth.toLocaleString()} this month
                    </div>
                  </td>
                  
                  <td className="p-4">
                    <div className="text-sm text-gray-900">
                      {driver.createdAt.toLocaleDateString()}
                    </div>
                  </td>
                  
                  <td className="p-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          disabled={actionLoading === driver.id}
                        >
                          {actionLoading === driver.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                          ) : (
                            <MoreHorizontal className="h-4 w-4" />
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onViewProfile(driver)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Profile
                        </DropdownMenuItem>
                        
                        {driver.status === 'pending' && (
                          <>
                            <DropdownMenuItem 
                              onClick={() => onAction('approve', driver.id)}
                              className="text-green-600"
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Approve
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => onAction('reject', driver.id, 'Application rejected')}
                              className="text-red-600"
                            >
                              <UserX className="h-4 w-4 mr-2" />
                              Reject
                            </DropdownMenuItem>
                          </>
                        )}
                        
                        {driver.status === 'active' && (
                          <DropdownMenuItem 
                            onClick={() => onAction('suspend', driver.id, 'Account suspended')}
                            className="text-yellow-600"
                          >
                            <Pause className="h-4 w-4 mr-2" />
                            Suspend
                          </DropdownMenuItem>
                        )}
                        
                        {driver.status === 'suspended' && (
                          <DropdownMenuItem 
                            onClick={() => onAction('reactivate', driver.id)}
                            className="text-green-600"
                          >
                            <Play className="h-4 w-4 mr-2" />
                            Reactivate
                          </DropdownMenuItem>
                        )}
                        
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => onAction('delete', driver.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}