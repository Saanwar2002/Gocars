'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  User, 
  Car, 
  FileText, 
  Award, 
  TrendingUp, 
  Star, 
  DollarSign,
  Clock,
  Shield,
  Phone,
  Mail,
  MapPin,
  Edit,
  Save,
  X,
  CheckCircle,
  AlertCircle,
  Upload,
  Download,
  Calendar,
  Users
} from 'lucide-react';
import { driverManagementService, DriverProfile, Certification, TrainingRecord } from '@/services/driverManagementService';

interface DriverProfileManagementProps {
  driverId: string;
  onUpdate?: (profile: DriverProfile) => void;
  readOnly?: boolean;
}

export default function DriverProfileManagement({ 
  driverId, 
  onUpdate, 
  readOnly = false 
}: DriverProfileManagementProps) {
  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    loadProfile();
  }, [driverId]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const driverProfile = await driverManagementService.getDriverProfile(driverId);
      if (driverProfile) {
        setProfile(driverProfile);
      } else {
        setError('Driver profile not found');
      }
    } catch (err) {
      setError('Failed to load driver profile');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (section: string) => {
    if (readOnly) return;
    setEditingSection(section);
    setFormData(getFormDataForSection(section));
  };

  const handleSave = async (section: string) => {
    try {
      setSaving(true);
      const updates = { [section]: formData };
      await driverManagementService.updateDriverProfile(driverId, updates);
      
      // Update local state
      setProfile(prev => prev ? { ...prev, ...updates } : null);
      setEditingSection(null);
      onUpdate?.(profile!);
    } catch (err) {
      setError('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditingSection(null);
    setFormData({});
  };

  const getFormDataForSection = (section: string) => {
    if (!profile) return {};
    
    switch (section) {
      case 'personalInfo':
        return { ...profile.personalInfo };
      case 'vehicle':
        return { ...profile.vehicle };
      default:
        return {};
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading driver profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertCircle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          {error || 'Driver profile not found'}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {profile.personalInfo.firstName} {profile.personalInfo.lastName}
          </h1>
          <div className="flex items-center gap-4 mt-2">
            <Badge 
              variant={profile.status === 'active' ? 'default' : 'secondary'}
              className={
                profile.status === 'active' ? 'bg-green-100 text-green-800' :
                profile.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                profile.status === 'suspended' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }
            >
              {profile.status.charAt(0).toUpperCase() + profile.status.slice(1)}
            </Badge>
            <span className="text-sm text-gray-500">
              Driver ID: {profile.id}
            </span>
            <span className="text-sm text-gray-500">
              Joined: {profile.createdAt.toLocaleDateString()}
            </span>
          </div>
        </div>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600">{profile.performance.rating.toFixed(1)}</div>
            <div className="text-xs text-gray-500">Rating</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">{profile.performance.totalRides}</div>
            <div className="text-xs text-gray-500">Total Rides</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-600">
              ${profile.performance.earnings.total.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">Total Earnings</div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="personal">Personal</TabsTrigger>
          <TabsTrigger value="vehicle">Vehicle</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="training">Training</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Performance Summary */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Performance Overview</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Rating</span>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-semibold">{profile.performance.rating.toFixed(1)}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Acceptance Rate</span>
                    <span className="font-semibold">{profile.performance.acceptanceRate}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Safety Score</span>
                    <span className="font-semibold">{profile.performance.safetyScore}/100</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Earnings Summary */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Earnings</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">This Month</span>
                    <span className="font-semibold">${profile.performance.earnings.thisMonth.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Last Month</span>
                    <span className="font-semibold">${profile.performance.earnings.lastMonth.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Total</span>
                    <span className="font-semibold">${profile.performance.earnings.total.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Vehicle Info */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Vehicle</CardTitle>
                <Car className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="font-semibold">
                    {profile.vehicle.year} {profile.vehicle.make} {profile.vehicle.model}
                  </div>
                  <div className="text-sm text-gray-600">
                    {profile.vehicle.color} • {profile.vehicle.licensePlate}
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {profile.vehicle.type.charAt(0).toUpperCase() + profile.vehicle.type.slice(1)}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div className="flex-1">
                    <div className="font-medium">Completed ride #12345</div>
                    <div className="text-sm text-gray-600">Downtown to Airport • $45.50</div>
                  </div>
                  <div className="text-sm text-gray-500">2 hours ago</div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Award className="h-5 w-5 text-blue-600" />
                  <div className="flex-1">
                    <div className="font-medium">Earned 5-star rating</div>
                    <div className="text-sm text-gray-600">Excellent service feedback</div>
                  </div>
                  <div className="text-sm text-gray-500">1 day ago</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Personal Info Tab */}
        <TabsContent value="personal" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Basic personal details and contact information</CardDescription>
              </div>
              {!readOnly && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => editingSection === 'personalInfo' ? handleCancel() : handleEdit('personalInfo')}
                >
                  {editingSection === 'personalInfo' ? (
                    <>
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </>
                  ) : (
                    <>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </>
                  )}
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {editingSection === 'personalInfo' ? (
                <PersonalInfoForm
                  data={formData}
                  onChange={setFormData}
                  onSave={() => handleSave('personalInfo')}
                  saving={saving}
                />
              ) : (
                <PersonalInfoDisplay data={profile.personalInfo} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Vehicle Tab */}
        <TabsContent value="vehicle" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Vehicle Information</CardTitle>
                <CardDescription>Details about the registered vehicle</CardDescription>
              </div>
              {!readOnly && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => editingSection === 'vehicle' ? handleCancel() : handleEdit('vehicle')}
                >
                  {editingSection === 'vehicle' ? (
                    <>
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </>
                  ) : (
                    <>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </>
                  )}
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {editingSection === 'vehicle' ? (
                <VehicleInfoForm
                  data={formData}
                  onChange={setFormData}
                  onSave={() => handleSave('vehicle')}
                  saving={saving}
                />
              ) : (
                <VehicleInfoDisplay data={profile.vehicle} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <PerformanceMetrics performance={profile.performance} />
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-6">
          <DocumentsManagement documents={profile.documents} driverId={driverId} readOnly={readOnly} />
        </TabsContent>

        {/* Training Tab */}
        <TabsContent value="training" className="space-y-6">
          <TrainingManagement 
            training={profile.training} 
            certifications={profile.certifications}
            driverId={driverId}
            readOnly={readOnly}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Personal Info Display Component
function PersonalInfoDisplay({ data }: { data: any }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-4">
        <div>
          <Label className="text-sm font-medium text-gray-500">Full Name</Label>
          <div className="mt-1">{data.firstName} {data.lastName}</div>
        </div>
        <div>
          <Label className="text-sm font-medium text-gray-500">Email</Label>
          <div className="mt-1 flex items-center gap-2">
            <Mail className="h-4 w-4 text-gray-400" />
            {data.email}
          </div>
        </div>
        <div>
          <Label className="text-sm font-medium text-gray-500">Phone</Label>
          <div className="mt-1 flex items-center gap-2">
            <Phone className="h-4 w-4 text-gray-400" />
            {data.phone}
          </div>
        </div>
        <div>
          <Label className="text-sm font-medium text-gray-500">Date of Birth</Label>
          <div className="mt-1">{data.dateOfBirth.toLocaleDateString()}</div>
        </div>
      </div>
      
      <div className="space-y-4">
        <div>
          <Label className="text-sm font-medium text-gray-500">Address</Label>
          <div className="mt-1 flex items-start gap-2">
            <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
            <div>
              <div>{data.address.street}</div>
              <div>{data.address.city}, {data.address.state} {data.address.zipCode}</div>
              <div>{data.address.country}</div>
            </div>
          </div>
        </div>
        <div>
          <Label className="text-sm font-medium text-gray-500">Emergency Contact</Label>
          <div className="mt-1">
            <div className="font-medium">{data.emergencyContact.name}</div>
            <div className="text-sm text-gray-600">{data.emergencyContact.relationship}</div>
            <div className="text-sm text-gray-600">{data.emergencyContact.phone}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Personal Info Form Component
function PersonalInfoForm({ data, onChange, onSave, saving }: any) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="firstName">First Name</Label>
          <Input
            id="firstName"
            value={data.firstName || ''}
            onChange={(e) => onChange({ ...data, firstName: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            id="lastName"
            value={data.lastName || ''}
            onChange={(e) => onChange({ ...data, lastName: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={data.email || ''}
            onChange={(e) => onChange({ ...data, email: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            value={data.phone || ''}
            onChange={(e) => onChange({ ...data, phone: e.target.value })}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => onChange({})}>
          Cancel
        </Button>
        <Button onClick={onSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
          <Save className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

// Vehicle Info Display Component
function VehicleInfoDisplay({ data }: { data: any }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-4">
        <div>
          <Label className="text-sm font-medium text-gray-500">Vehicle</Label>
          <div className="mt-1 text-lg font-semibold">
            {data.year} {data.make} {data.model}
          </div>
        </div>
        <div>
          <Label className="text-sm font-medium text-gray-500">Color</Label>
          <div className="mt-1">{data.color}</div>
        </div>
        <div>
          <Label className="text-sm font-medium text-gray-500">License Plate</Label>
          <div className="mt-1 font-mono">{data.licensePlate}</div>
        </div>
        <div>
          <Label className="text-sm font-medium text-gray-500">VIN</Label>
          <div className="mt-1 font-mono text-sm">{data.vin}</div>
        </div>
      </div>
      
      <div className="space-y-4">
        <div>
          <Label className="text-sm font-medium text-gray-500">Type</Label>
          <div className="mt-1">
            <Badge variant="outline">
              {data.type.charAt(0).toUpperCase() + data.type.slice(1)}
            </Badge>
          </div>
        </div>
        <div>
          <Label className="text-sm font-medium text-gray-500">Capacity</Label>
          <div className="mt-1 flex items-center gap-2">
            <Users className="h-4 w-4 text-gray-400" />
            {data.capacity} passengers
          </div>
        </div>
        <div>
          <Label className="text-sm font-medium text-gray-500">Features</Label>
          <div className="mt-1 flex flex-wrap gap-1">
            {data.features.map((feature: string) => (
              <Badge key={feature} variant="secondary" className="text-xs">
                {feature}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Vehicle Info Form Component
function VehicleInfoForm({ data, onChange, onSave, saving }: any) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="make">Make</Label>
          <Input
            id="make"
            value={data.make || ''}
            onChange={(e) => onChange({ ...data, make: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="model">Model</Label>
          <Input
            id="model"
            value={data.model || ''}
            onChange={(e) => onChange({ ...data, model: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="year">Year</Label>
          <Input
            id="year"
            type="number"
            value={data.year || ''}
            onChange={(e) => onChange({ ...data, year: parseInt(e.target.value) })}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => onChange({})}>
          Cancel
        </Button>
        <Button onClick={onSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
          <Save className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

// Performance Metrics Component
function PerformanceMetrics({ performance }: { performance: any }) {
  const metrics = [
    { label: 'Overall Rating', value: performance.rating.toFixed(1), icon: Star, color: 'text-yellow-600' },
    { label: 'Total Rides', value: performance.totalRides.toString(), icon: Car, color: 'text-blue-600' },
    { label: 'Acceptance Rate', value: `${performance.acceptanceRate}%`, icon: CheckCircle, color: 'text-green-600' },
    { label: 'Safety Score', value: `${performance.safetyScore}/100`, icon: Shield, color: 'text-purple-600' }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <Card key={metric.label}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{metric.label}</p>
                  <p className="text-2xl font-bold">{metric.value}</p>
                </div>
                <metric.icon className={`h-8 w-8 ${metric.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Performance Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Customer Satisfaction</span>
                <span>{performance.customerSatisfaction}%</span>
              </div>
              <Progress value={performance.customerSatisfaction} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Punctuality Score</span>
                <span>{performance.punctualityScore}%</span>
              </div>
              <Progress value={performance.punctualityScore} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Safety Score</span>
                <span>{performance.safetyScore}%</span>
              </div>
              <Progress value={performance.safetyScore} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Documents Management Component
function DocumentsManagement({ documents, driverId, readOnly }: any) {
  const documentTypes = [
    { key: 'driverLicense', label: 'Driver\'s License', required: true },
    { key: 'vehicleRegistration', label: 'Vehicle Registration', required: true },
    { key: 'insurance', label: 'Insurance Certificate', required: true },
    { key: 'profilePhoto', label: 'Profile Photo', required: true },
    { key: 'backgroundCheck', label: 'Background Check', required: false },
    { key: 'medicalCertificate', label: 'Medical Certificate', required: false }
  ];

  return (
    <div className="space-y-4">
      {documentTypes.map((docType) => {
        const doc = documents[docType.key];
        if (!doc && !docType.required) return null;

        return (
          <Card key={docType.key}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-gray-400" />
                  <div>
                    <div className="font-medium">{docType.label}</div>
                    {doc?.fileName && (
                      <div className="text-sm text-gray-600">{doc.fileName}</div>
                    )}
                    {doc?.uploadedAt && (
                      <div className="text-xs text-gray-500">
                        Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {doc?.verified ? (
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  ) : doc?.url ? (
                    <Badge variant="secondary">
                      <Clock className="h-3 w-3 mr-1" />
                      Pending
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Missing
                    </Badge>
                  )}
                  
                  {doc?.url && (
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      View
                    </Button>
                  )}
                  
                  {!readOnly && (
                    <Button variant="outline" size="sm">
                      <Upload className="h-4 w-4 mr-2" />
                      {doc?.url ? 'Replace' : 'Upload'}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// Training Management Component
function TrainingManagement({ training, certifications, driverId, readOnly }: any) {
  return (
    <div className="space-y-6">
      {/* Certifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Certifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          {certifications.length > 0 ? (
            <div className="space-y-3">
              {certifications.map((cert: Certification) => (
                <div key={cert.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{cert.name}</div>
                    <div className="text-sm text-gray-600">
                      Issued by {cert.issuedBy} • {cert.issuedAt.toLocaleDateString()}
                    </div>
                    {cert.expiresAt && (
                      <div className="text-xs text-gray-500">
                        Expires: {cert.expiresAt.toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={cert.status === 'active' ? 'default' : 'secondary'}
                      className={cert.status === 'active' ? 'bg-green-100 text-green-800' : ''}
                    >
                      {cert.status}
                    </Badge>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No certifications on record
            </div>
          )}
        </CardContent>
      </Card>

      {/* Training Records */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Training History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {training.length > 0 ? (
            <div className="space-y-3">
              {training.map((record: TrainingRecord) => (
                <div key={record.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{record.title}</div>
                    <div className="text-sm text-gray-600">{record.description}</div>
                    <div className="text-xs text-gray-500 flex items-center gap-4 mt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {record.duration} minutes
                      </span>
                      {record.completedAt && (
                        <span>Completed: {record.completedAt.toLocaleDateString()}</span>
                      )}
                      {record.score && (
                        <span>Score: {record.score}%</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={record.passed ? 'default' : 'destructive'}
                      className={record.passed ? 'bg-green-100 text-green-800' : ''}
                    >
                      {record.passed ? 'Passed' : 'Failed'}
                    </Badge>
                    {record.certificateUrl && (
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Certificate
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No training records found
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}