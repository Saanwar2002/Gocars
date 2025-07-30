'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, 
  Camera, 
  Upload, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  FileText,
  User,
  Calendar,
  MapPin,
  X
} from 'lucide-react';
import { advancedAuthService, IdentityVerificationData, VerificationResult } from '@/services/advancedAuthService';
import { useAuth } from '@/contexts/AuthContext';

interface IdentityVerificationProps {
  onSuccess?: (result: VerificationResult) => void;
  onError?: (error: string) => void;
  userType: 'driver' | 'passenger';
  className?: string;
}

export function IdentityVerification({ onSuccess, onError, userType, className }: IdentityVerificationProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const [verificationData, setVerificationData] = useState<Partial<IdentityVerificationData>>({
    documentType: 'drivers_license',
    documentImages: [],
    selfieImage: '',
    fullName: '',
    dateOfBirth: '',
    documentNumber: '',
    address: '',
  });

  const documentInputRef = useRef<HTMLInputElement>(null);
  const selfieInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const totalSteps = userType === 'driver' ? 4 : 3;
  const progress = (currentStep / totalSteps) * 100;

  const handleInputChange = (field: keyof IdentityVerificationData, value: string) => {
    setVerificationData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, type: 'document' | 'selfie') => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (!file.type.startsWith('image/')) {
      setMessage('Please select a valid image file');
      setStatus('error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (type === 'document') {
        setVerificationData(prev => ({
          ...prev,
          documentImages: [...(prev.documentImages || []), result]
        }));
      } else {
        setVerificationData(prev => ({
          ...prev,
          selfieImage: result
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setMessage('Unable to access camera. Please use file upload instead.');
      setStatus('error');
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext('2d');
      
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);
        
        const imageData = canvas.toDataURL('image/jpeg');
        setVerificationData(prev => ({
          ...prev,
          selfieImage: imageData
        }));

        // Stop camera
        const stream = video.srcObject as MediaStream;
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
      }
    }
  };

  const removeDocumentImage = (index: number) => {
    setVerificationData(prev => ({
      ...prev,
      documentImages: prev.documentImages?.filter((_, i) => i !== index) || []
    }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(verificationData.fullName && verificationData.dateOfBirth && verificationData.documentNumber);
      case 2:
        return !!(verificationData.documentImages && verificationData.documentImages.length > 0);
      case 3:
        return !!verificationData.selfieImage;
      case 4:
        return !!verificationData.address;
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
      setStatus('idle');
      setMessage('');
    } else {
      setMessage('Please complete all required fields before continuing');
      setStatus('error');
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    setStatus('idle');
    setMessage('');
  };

  const submitVerification = async () => {
    if (!user || !verificationData.fullName || !verificationData.documentImages?.length || !verificationData.selfieImage) {
      setMessage('Please complete all verification steps');
      setStatus('error');
      return;
    }

    setIsLoading(true);
    setStatus('idle');
    setMessage('');

    try {
      const result = await advancedAuthService.performIdentityVerification(
        user.uid,
        verificationData as IdentityVerificationData,
        userType
      );

      if (result.success && result.verified) {
        setStatus('success');
        setMessage(`Identity verification completed! Verification level: ${result.verificationLevel}`);
        onSuccess?.(result);
      } else {
        setStatus('error');
        setMessage('Identity verification failed. Please check your documents and try again.');
        onError?.('Verification failed');
      }
    } catch (error) {
      console.error('Error submitting verification:', error);
      setStatus('error');
      setMessage('An error occurred during verification. Please try again.');
      onError?.(error instanceof Error ? error.message : 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Identity Verification
          {userType === 'driver' && (
            <Badge variant="secondary">Driver Required</Badge>
          )}
        </CardTitle>
        <CardDescription>
          {userType === 'driver' 
            ? 'Complete identity verification to start driving with GoCars'
            : 'Verify your identity for enhanced security and premium features'
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Step {currentStep} of {totalSteps}</span>
            <span>{Math.round(progress)}% complete</span>
          </div>
          <Progress value={progress} className="w-full" />
        </div>

        {message && (
          <Alert variant={status === 'error' ? 'destructive' : 'default'}>
            {status === 'success' ? (
              <CheckCircle className="h-4 w-4" />
            ) : status === 'error' ? (
              <AlertCircle className="h-4 w-4" />
            ) : (
              <Shield className="h-4 w-4" />
            )}
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        {/* Step 1: Personal Information */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  value={verificationData.fullName || ''}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  placeholder="Enter your full legal name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={verificationData.dateOfBirth || ''}
                  onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="documentType">Document Type *</Label>
                <Select
                  value={verificationData.documentType}
                  onValueChange={(value) => handleInputChange('documentType', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="drivers_license">Driver's License</SelectItem>
                    <SelectItem value="passport">Passport</SelectItem>
                    <SelectItem value="national_id">National ID</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="documentNumber">Document Number *</Label>
                <Input
                  id="documentNumber"
                  value={verificationData.documentNumber || ''}
                  onChange={(e) => handleInputChange('documentNumber', e.target.value)}
                  placeholder="Enter document number"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Document Upload */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Document Photos
            </h3>
            
            <p className="text-sm text-muted-foreground">
              Upload clear photos of your {verificationData.documentType?.replace('_', ' ')}. 
              Make sure all text is readable and the document is fully visible.
            </p>

            <div className="space-y-4">
              <Button
                onClick={() => documentInputRef.current?.click()}
                variant="outline"
                className="w-full h-32 border-dashed"
              >
                <div className="text-center">
                  <Upload className="h-8 w-8 mx-auto mb-2" />
                  <p>Click to upload document photo</p>
                  <p className="text-xs text-muted-foreground">PNG, JPG up to 10MB</p>
                </div>
              </Button>

              <input
                ref={documentInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload(e, 'document')}
                className="hidden"
              />

              {verificationData.documentImages && verificationData.documentImages.length > 0 && (
                <div className="grid grid-cols-2 gap-4">
                  {verificationData.documentImages.map((image, index) => (
                    <div key={index} className="relative">
                      <img
                        src={image}
                        alt={`Document ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border"
                      />
                      <Button
                        size="sm"
                        variant="destructive"
                        className="absolute top-2 right-2 h-6 w-6 p-0"
                        onClick={() => removeDocumentImage(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Selfie */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Take a Selfie
            </h3>
            
            <p className="text-sm text-muted-foreground">
              Take a clear selfie for identity verification. Make sure your face is well-lit and clearly visible.
            </p>

            <Tabs defaultValue="upload" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="upload">Upload Photo</TabsTrigger>
                <TabsTrigger value="camera">Use Camera</TabsTrigger>
              </TabsList>
              
              <TabsContent value="upload" className="space-y-4">
                <Button
                  onClick={() => selfieInputRef.current?.click()}
                  variant="outline"
                  className="w-full h-32 border-dashed"
                >
                  <div className="text-center">
                    <Upload className="h-8 w-8 mx-auto mb-2" />
                    <p>Click to upload selfie</p>
                    <p className="text-xs text-muted-foreground">PNG, JPG up to 10MB</p>
                  </div>
                </Button>

                <input
                  ref={selfieInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'selfie')}
                  className="hidden"
                />
              </TabsContent>
              
              <TabsContent value="camera" className="space-y-4">
                <div className="relative">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-64 object-cover rounded-lg bg-muted"
                  />
                  <canvas ref={canvasRef} className="hidden" />
                </div>
                
                <div className="flex gap-2">
                  <Button onClick={startCamera} variant="outline" className="flex-1">
                    <Camera className="h-4 w-4 mr-2" />
                    Start Camera
                  </Button>
                  <Button onClick={capturePhoto} className="flex-1">
                    Capture Photo
                  </Button>
                </div>
              </TabsContent>
            </Tabs>

            {verificationData.selfieImage && (
              <div className="mt-4">
                <img
                  src={verificationData.selfieImage}
                  alt="Selfie"
                  className="w-32 h-32 object-cover rounded-lg border mx-auto"
                />
              </div>
            )}
          </div>
        )}

        {/* Step 4: Address (Driver only) */}
        {currentStep === 4 && userType === 'driver' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Address Information
            </h3>
            
            <div className="space-y-2">
              <Label htmlFor="address">Home Address *</Label>
              <Input
                id="address"
                value={verificationData.address || ''}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Enter your full address"
              />
              <p className="text-sm text-muted-foreground">
                This information is required for driver background checks and verification.
              </p>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-4">
          <Button
            onClick={prevStep}
            variant="outline"
            disabled={currentStep === 1}
          >
            Previous
          </Button>
          
          {currentStep < totalSteps ? (
            <Button
              onClick={nextStep}
              disabled={!validateStep(currentStep)}
            >
              Next
            </Button>
          ) : (
            <Button
              onClick={submitVerification}
              disabled={isLoading || !validateStep(currentStep)}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Submit Verification
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default IdentityVerification;