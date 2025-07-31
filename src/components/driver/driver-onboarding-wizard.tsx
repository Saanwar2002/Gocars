'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle, 
  Clock, 
  Upload, 
  User, 
  Car, 
  FileText, 
  Shield, 
  GraduationCap, 
  Wrench,
  AlertCircle,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import { driverManagementService, DriverProfile, OnboardingStep } from '@/services/driverManagementService';

interface DriverOnboardingWizardProps {
  driverId?: string;
  onComplete?: (driverId: string) => void;
  onCancel?: () => void;
}

export default function DriverOnboardingWizard({ 
  driverId, 
  onComplete, 
  onCancel 
}: DriverOnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('personal_info');
  const [driverProfile, setDriverProfile] = useState<Partial<DriverProfile>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completedSteps, setCompletedSteps] = useState<OnboardingStep[]>([]);

  const workflow = driverManagementService.getOnboardingWorkflow();
  const currentStepIndex = workflow.steps.findIndex(step => step.step === currentStep);
  const progress = ((currentStepIndex + 1) / workflow.steps.length) * 100;

  useEffect(() => {
    if (driverId) {
      loadDriverProfile();
    }
  }, [driverId]);

  const loadDriverProfile = async () => {
    if (!driverId) return;
    
    try {
      setLoading(true);
      const profile = await driverManagementService.getDriverProfile(driverId);
      if (profile) {
        setDriverProfile(profile);
        setCurrentStep(profile.onboardingStatus.currentStep);
        setCompletedSteps(profile.onboardingStatus.completedSteps);
      }
    } catch (err) {
      setError('Failed to load driver profile');
    } finally {
      setLoading(false);
    }
  };

  const handleStepComplete = async (stepData: any) => {
    try {
      setLoading(true);
      setError(null);

      // Update driver profile with step data
      const updatedProfile = { ...driverProfile, ...stepData };
      setDriverProfile(updatedProfile);

      let profileId = driverId;

      // Create profile if it doesn't exist
      if (!profileId) {
        profileId = await driverManagementService.createDriverProfile(updatedProfile);
      } else {
        await driverManagementService.updateDriverProfile(profileId, stepData);
      }

      // Mark step as completed
      await driverManagementService.updateOnboardingStep(profileId, currentStep, true);

      // Move to next step
      const nextStepIndex = currentStepIndex + 1;
      if (nextStepIndex < workflow.steps.length) {
        setCurrentStep(workflow.steps[nextStepIndex].step);
        setCompletedSteps([...completedSteps, currentStep]);
      } else {
        // Onboarding complete
        onComplete?.(profileId);
      }
    } catch (err) {
      setError('Failed to save step data');
    } finally {
      setLoading(false);
    }
  };

  const handlePreviousStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStep(workflow.steps[currentStepIndex - 1].step);
    }
  };

  const getStepIcon = (step: OnboardingStep) => {
    const iconMap = {
      personal_info: User,
      documents_upload: FileText,
      vehicle_info: Car,
      background_check: Shield,
      training_completion: GraduationCap,
      vehicle_inspection: Wrench,
      final_approval: CheckCircle
    };
    return iconMap[step] || User;
  };

  const getStepStatus = (step: OnboardingStep) => {
    if (completedSteps.includes(step)) return 'completed';
    if (step === currentStep) return 'current';
    return 'pending';
  };

  if (loading && !driverProfile.id) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading onboarding wizard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Driver Onboarding</h1>
        <p className="text-gray-600">Complete all steps to become a GoCars driver</p>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">
            Step {currentStepIndex + 1} of {workflow.steps.length}
          </span>
          <span className="text-sm text-gray-500">{Math.round(progress)}% Complete</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step Navigation */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {workflow.steps.map((step, index) => {
            const Icon = getStepIcon(step.step);
            const status = getStepStatus(step.step);
            
            return (
              <div key={step.step} className="flex items-center">
                <div className={`
                  flex items-center justify-center w-10 h-10 rounded-full border-2 
                  ${status === 'completed' 
                    ? 'bg-green-100 border-green-500 text-green-600' 
                    : status === 'current'
                    ? 'bg-blue-100 border-blue-500 text-blue-600'
                    : 'bg-gray-100 border-gray-300 text-gray-400'
                  }
                `}>
                  {status === 'completed' ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <Icon className="h-5 w-5" />
                  )}
                </div>
                {index < workflow.steps.length - 1 && (
                  <div className={`
                    w-12 h-0.5 mx-2
                    ${completedSteps.includes(step.step) ? 'bg-green-500' : 'bg-gray-300'}
                  `} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert className="mb-6 border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {React.createElement(getStepIcon(currentStep), { className: "h-5 w-5" })}
            {workflow.steps[currentStepIndex].title}
          </CardTitle>
          <CardDescription>
            {workflow.steps[currentStepIndex].description}
          </CardDescription>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Clock className="h-4 w-4" />
            Estimated time: {workflow.steps[currentStepIndex].estimatedTime} minutes
          </div>
        </CardHeader>
        <CardContent>
          {currentStep === 'personal_info' && (
            <PersonalInfoStep 
              data={driverProfile.personalInfo} 
              onComplete={handleStepComplete}
              loading={loading}
            />
          )}
          {currentStep === 'documents_upload' && (
            <DocumentsUploadStep 
              data={driverProfile.documents} 
              onComplete={handleStepComplete}
              loading={loading}
            />
          )}
          {currentStep === 'vehicle_info' && (
            <VehicleInfoStep 
              data={driverProfile.vehicle} 
              onComplete={handleStepComplete}
              loading={loading}
            />
          )}
          {currentStep === 'background_check' && (
            <BackgroundCheckStep 
              onComplete={handleStepComplete}
              loading={loading}
            />
          )}
          {currentStep === 'training_completion' && (
            <TrainingCompletionStep 
              onComplete={handleStepComplete}
              loading={loading}
            />
          )}
          {currentStep === 'vehicle_inspection' && (
            <VehicleInspectionStep 
              onComplete={handleStepComplete}
              loading={loading}
            />
          )}
          {currentStep === 'final_approval' && (
            <FinalApprovalStep 
              onComplete={handleStepComplete}
              loading={loading}
            />
          )}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-6">
        <Button
          variant="outline"
          onClick={currentStepIndex > 0 ? handlePreviousStep : onCancel}
          disabled={loading}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {currentStepIndex > 0 ? 'Previous' : 'Cancel'}
        </Button>
        
        <div className="text-sm text-gray-500">
          Step {currentStepIndex + 1} of {workflow.steps.length}
        </div>
      </div>
    </div>
  );
}

// Personal Info Step Component
function PersonalInfoStep({ data, onComplete, loading }: any) {
  const [formData, setFormData] = useState({
    firstName: data?.firstName || '',
    lastName: data?.lastName || '',
    email: data?.email || '',
    phone: data?.phone || '',
    dateOfBirth: data?.dateOfBirth ? data.dateOfBirth.toISOString().split('T')[0] : '',
    address: {
      street: data?.address?.street || '',
      city: data?.address?.city || '',
      state: data?.address?.state || '',
      zipCode: data?.address?.zipCode || '',
      country: data?.address?.country || 'US'
    },
    emergencyContact: {
      name: data?.emergencyContact?.name || '',
      phone: data?.emergencyContact?.phone || '',
      relationship: data?.emergencyContact?.relationship || ''
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onComplete({
      personalInfo: {
        ...formData,
        dateOfBirth: new Date(formData.dateOfBirth)
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="firstName">First Name *</Label>
          <Input
            id="firstName"
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="lastName">Last Name *</Label>
          <Input
            id="lastName"
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="email">Email Address *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="phone">Phone Number *</Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="dateOfBirth">Date of Birth *</Label>
        <Input
          id="dateOfBirth"
          type="date"
          value={formData.dateOfBirth}
          onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
          required
        />
      </div>

      <Separator />

      <div>
        <h3 className="text-lg font-semibold mb-4">Address Information</h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="street">Street Address *</Label>
            <Input
              id="street"
              value={formData.address.street}
              onChange={(e) => setFormData({
                ...formData,
                address: { ...formData.address, street: e.target.value }
              })}
              required
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                value={formData.address.city}
                onChange={(e) => setFormData({
                  ...formData,
                  address: { ...formData.address, city: e.target.value }
                })}
                required
              />
            </div>
            <div>
              <Label htmlFor="state">State *</Label>
              <Input
                id="state"
                value={formData.address.state}
                onChange={(e) => setFormData({
                  ...formData,
                  address: { ...formData.address, state: e.target.value }
                })}
                required
              />
            </div>
            <div>
              <Label htmlFor="zipCode">ZIP Code *</Label>
              <Input
                id="zipCode"
                value={formData.address.zipCode}
                onChange={(e) => setFormData({
                  ...formData,
                  address: { ...formData.address, zipCode: e.target.value }
                })}
                required
              />
            </div>
          </div>
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="text-lg font-semibold mb-4">Emergency Contact</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="emergencyName">Contact Name *</Label>
              <Input
                id="emergencyName"
                value={formData.emergencyContact.name}
                onChange={(e) => setFormData({
                  ...formData,
                  emergencyContact: { ...formData.emergencyContact, name: e.target.value }
                })}
                required
              />
            </div>
            <div>
              <Label htmlFor="emergencyPhone">Contact Phone *</Label>
              <Input
                id="emergencyPhone"
                type="tel"
                value={formData.emergencyContact.phone}
                onChange={(e) => setFormData({
                  ...formData,
                  emergencyContact: { ...formData.emergencyContact, phone: e.target.value }
                })}
                required
              />
            </div>
          </div>
          <div>
            <Label htmlFor="relationship">Relationship *</Label>
            <Select
              value={formData.emergencyContact.relationship}
              onValueChange={(value) => setFormData({
                ...formData,
                emergencyContact: { ...formData.emergencyContact, relationship: value }
              })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select relationship" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="spouse">Spouse</SelectItem>
                <SelectItem value="parent">Parent</SelectItem>
                <SelectItem value="sibling">Sibling</SelectItem>
                <SelectItem value="child">Child</SelectItem>
                <SelectItem value="friend">Friend</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : 'Continue'}
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </form>
  );
}

// Documents Upload Step Component
function DocumentsUploadStep({ data, onComplete, loading }: any) {
  const [documents, setDocuments] = useState({
    driverLicense: data?.driverLicense || { url: '', fileName: '', verified: false },
    vehicleRegistration: data?.vehicleRegistration || { url: '', fileName: '', verified: false },
    insurance: data?.insurance || { url: '', fileName: '', verified: false },
    profilePhoto: data?.profilePhoto || { url: '', fileName: '', verified: false }
  });

  const handleFileUpload = (documentType: string, file: File) => {
    // Simulate file upload - in real implementation, upload to Firebase Storage
    const url = URL.createObjectURL(file);
    setDocuments({
      ...documents,
      [documentType]: {
        url,
        fileName: file.name,
        uploadedAt: new Date(),
        verified: false
      }
    });
  };

  const handleSubmit = () => {
    onComplete({ documents });
  };

  const allDocumentsUploaded = Object.values(documents).every(doc => doc.url);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DocumentUploadCard
          title="Driver's License"
          description="Upload a clear photo of your valid driver's license"
          document={documents.driverLicense}
          onUpload={(file) => handleFileUpload('driverLicense', file)}
          required
        />
        <DocumentUploadCard
          title="Vehicle Registration"
          description="Upload your current vehicle registration document"
          document={documents.vehicleRegistration}
          onUpload={(file) => handleFileUpload('vehicleRegistration', file)}
          required
        />
        <DocumentUploadCard
          title="Insurance Certificate"
          description="Upload proof of valid vehicle insurance"
          document={documents.insurance}
          onUpload={(file) => handleFileUpload('insurance', file)}
          required
        />
        <DocumentUploadCard
          title="Profile Photo"
          description="Upload a clear headshot for your driver profile"
          document={documents.profilePhoto}
          onUpload={(file) => handleFileUpload('profilePhoto', file)}
          required
        />
      </div>

      <div className="flex justify-end">
        <Button 
          onClick={handleSubmit} 
          disabled={loading || !allDocumentsUploaded}
        >
          {loading ? 'Saving...' : 'Continue'}
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

// Document Upload Card Component
function DocumentUploadCard({ title, description, document, onUpload, required }: any) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title} {required && '*'}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {document.url ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Uploaded: {document.fileName}</span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <label>
                  <Upload className="h-4 w-4 mr-2" />
                  Replace
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="outline" className="w-full" asChild>
            <label>
              <Upload className="h-4 w-4 mr-2" />
              Upload Document
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// Vehicle Info Step Component
function VehicleInfoStep({ data, onComplete, loading }: any) {
  const [formData, setFormData] = useState({
    make: data?.make || '',
    model: data?.model || '',
    year: data?.year || new Date().getFullYear(),
    color: data?.color || '',
    licensePlate: data?.licensePlate || '',
    vin: data?.vin || '',
    type: data?.type || 'sedan',
    capacity: data?.capacity || 4,
    features: data?.features || []
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onComplete({ vehicle: formData });
  };

  const vehicleTypes = [
    { value: 'sedan', label: 'Sedan' },
    { value: 'suv', label: 'SUV' },
    { value: 'van', label: 'Van' },
    { value: 'luxury', label: 'Luxury' },
    { value: 'electric', label: 'Electric' }
  ];

  const availableFeatures = [
    'Air Conditioning',
    'Bluetooth',
    'GPS Navigation',
    'USB Charging',
    'WiFi Hotspot',
    'Premium Sound',
    'Leather Seats',
    'Sunroof',
    'Wheelchair Accessible'
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="make">Make *</Label>
          <Input
            id="make"
            value={formData.make}
            onChange={(e) => setFormData({ ...formData, make: e.target.value })}
            placeholder="e.g., Toyota"
            required
          />
        </div>
        <div>
          <Label htmlFor="model">Model *</Label>
          <Input
            id="model"
            value={formData.model}
            onChange={(e) => setFormData({ ...formData, model: e.target.value })}
            placeholder="e.g., Camry"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="year">Year *</Label>
          <Input
            id="year"
            type="number"
            min="2010"
            max={new Date().getFullYear() + 1}
            value={formData.year}
            onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
            required
          />
        </div>
        <div>
          <Label htmlFor="color">Color *</Label>
          <Input
            id="color"
            value={formData.color}
            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
            placeholder="e.g., White"
            required
          />
        </div>
        <div>
          <Label htmlFor="capacity">Passenger Capacity *</Label>
          <Select
            value={formData.capacity.toString()}
            onValueChange={(value) => setFormData({ ...formData, capacity: parseInt(value) })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2">2 passengers</SelectItem>
              <SelectItem value="4">4 passengers</SelectItem>
              <SelectItem value="6">6 passengers</SelectItem>
              <SelectItem value="8">8 passengers</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="licensePlate">License Plate *</Label>
          <Input
            id="licensePlate"
            value={formData.licensePlate}
            onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value.toUpperCase() })}
            placeholder="e.g., ABC123"
            required
          />
        </div>
        <div>
          <Label htmlFor="type">Vehicle Type *</Label>
          <Select
            value={formData.type}
            onValueChange={(value) => setFormData({ ...formData, type: value as any })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {vehicleTypes.map(type => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="vin">VIN (Vehicle Identification Number) *</Label>
        <Input
          id="vin"
          value={formData.vin}
          onChange={(e) => setFormData({ ...formData, vin: e.target.value.toUpperCase() })}
          placeholder="17-character VIN"
          maxLength={17}
          required
        />
      </div>

      <div>
        <Label>Vehicle Features (Optional)</Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
          {availableFeatures.map(feature => (
            <label key={feature} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.features.includes(feature)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setFormData({ ...formData, features: [...formData.features, feature] });
                  } else {
                    setFormData({ 
                      ...formData, 
                      features: formData.features.filter(f => f !== feature) 
                    });
                  }
                }}
                className="rounded"
              />
              <span className="text-sm">{feature}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : 'Continue'}
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </form>
  );
}

// Background Check Step Component
function BackgroundCheckStep({ onComplete, loading }: any) {
  const [consent, setConsent] = useState(false);
  const [initiated, setInitiated] = useState(false);

  const handleInitiateCheck = () => {
    setInitiated(true);
    // Simulate background check initiation
    setTimeout(() => {
      onComplete({});
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          A background check is required for all drivers. This process typically takes 24-48 hours to complete.
        </AlertDescription>
      </Alert>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Background Check Information</h3>
        <p className="text-gray-600">
          We partner with trusted third-party services to conduct comprehensive background checks that include:
        </p>
        <ul className="list-disc list-inside space-y-1 text-gray-600">
          <li>Criminal history verification</li>
          <li>Driving record check</li>
          <li>Identity verification</li>
          <li>Sex offender registry check</li>
        </ul>
      </div>

      <div className="space-y-4">
        <label className="flex items-start space-x-3">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-1"
          />
          <span className="text-sm">
            I consent to GoCars conducting a background check and understand that this information 
            will be used to determine my eligibility to drive for the platform. I certify that 
            all information provided is accurate and complete.
          </span>
        </label>
      </div>

      <div className="flex justify-end">
        {!initiated ? (
          <Button 
            onClick={handleInitiateCheck} 
            disabled={!consent || loading}
          >
            Initiate Background Check
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Initiating background check...</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Training Completion Step Component
function TrainingCompletionStep({ onComplete, loading }: any) {
  const [completedModules, setCompletedModules] = useState<string[]>([]);

  const trainingModules = [
    {
      id: 'safety',
      title: 'Safety Training',
      description: 'Learn about passenger safety, emergency procedures, and defensive driving',
      duration: 30,
      required: true
    },
    {
      id: 'customer_service',
      title: 'Customer Service Excellence',
      description: 'Provide exceptional service and handle customer interactions professionally',
      duration: 20,
      required: true
    },
    {
      id: 'platform_usage',
      title: 'GoCars Platform Training',
      description: 'Master the driver app, navigation, and platform features',
      duration: 25,
      required: true
    },
    {
      id: 'regulations',
      title: 'Local Regulations & Compliance',
      description: 'Understand local transportation laws and compliance requirements',
      duration: 15,
      required: true
    }
  ];

  const handleModuleComplete = (moduleId: string) => {
    setCompletedModules([...completedModules, moduleId]);
  };

  const allRequiredCompleted = trainingModules
    .filter(m => m.required)
    .every(m => completedModules.includes(m.id));

  const handleSubmit = () => {
    const trainingRecords = trainingModules
      .filter(m => completedModules.includes(m.id))
      .map(m => ({
        title: m.title,
        type: 'online' as const,
        description: m.description,
        duration: m.duration,
        completedAt: new Date(),
        score: 85 + Math.random() * 15, // Simulate score
        passed: true,
        requiredForOnboarding: m.required
      }));

    onComplete({ training: trainingRecords });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Required Training Modules</h3>
        <p className="text-gray-600">
          Complete all required training modules to proceed with your application.
        </p>
      </div>

      <div className="space-y-4">
        {trainingModules.map(module => (
          <Card key={module.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold">{module.title}</h4>
                    {module.required && (
                      <Badge variant="secondary" className="text-xs">Required</Badge>
                    )}
                    {completedModules.includes(module.id) && (
                      <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                        Completed
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{module.description}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {module.duration} minutes
                    </span>
                  </div>
                </div>
                <div>
                  {completedModules.includes(module.id) ? (
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleModuleComplete(module.id)}
                    >
                      Start Module
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-end">
        <Button 
          onClick={handleSubmit} 
          disabled={loading || !allRequiredCompleted}
        >
          {loading ? 'Saving...' : 'Continue'}
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

// Vehicle Inspection Step Component
function VehicleInspectionStep({ onComplete, loading }: any) {
  const [inspectionScheduled, setInspectionScheduled] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');

  const handleSchedule = () => {
    setInspectionScheduled(true);
    // Simulate inspection completion
    setTimeout(() => {
      onComplete({});
    }, 1500);
  };

  const timeSlots = [
    '09:00', '10:00', '11:00', '14:00', '15:00', '16:00'
  ];

  return (
    <div className="space-y-6">
      <Alert>
        <Wrench className="h-4 w-4" />
        <AlertDescription>
          A vehicle inspection is required to ensure your vehicle meets GoCars safety and quality standards.
        </AlertDescription>
      </Alert>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Vehicle Inspection Requirements</h3>
        <p className="text-gray-600">
          Our certified inspectors will check the following:
        </p>
        <ul className="list-disc list-inside space-y-1 text-gray-600">
          <li>Vehicle exterior and interior condition</li>
          <li>Safety features (brakes, lights, signals)</li>
          <li>Tire condition and tread depth</li>
          <li>Engine and mechanical systems</li>
          <li>Cleanliness and maintenance</li>
        </ul>
      </div>

      {!inspectionScheduled ? (
        <div className="space-y-4">
          <h4 className="font-semibold">Schedule Your Inspection</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="inspectionDate">Preferred Date</Label>
              <Input
                id="inspectionDate"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div>
              <Label htmlFor="inspectionTime">Preferred Time</Label>
              <Select value={selectedTime} onValueChange={setSelectedTime}>
                <SelectTrigger>
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map(time => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button 
              onClick={handleSchedule}
              disabled={!selectedDate || !selectedTime || loading}
            >
              Schedule Inspection
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Scheduling your inspection...</p>
        </div>
      )}
    </div>
  );
}

// Final Approval Step Component
function FinalApprovalStep({ onComplete, loading }: any) {
  return (
    <div className="space-y-6 text-center">
      <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
        <CheckCircle className="h-8 w-8 text-blue-600" />
      </div>
      
      <div>
        <h3 className="text-xl font-semibold mb-2">Application Under Review</h3>
        <p className="text-gray-600">
          Congratulations! You've completed all onboarding steps. Your application is now under 
          administrative review. You'll receive an email notification once your application is approved.
        </p>
      </div>

      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-semibold mb-2">What happens next?</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Administrative review (typically 24-48 hours)</li>
          <li>• Final verification of documents and background check</li>
          <li>• Account activation and welcome email</li>
          <li>• Access to the GoCars driver app</li>
        </ul>
      </div>

      <div className="flex justify-center">
        <Button onClick={() => onComplete({})} disabled={loading}>
          {loading ? 'Submitting...' : 'Submit Application'}
          <CheckCircle className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}