'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  Fingerprint, 
  Smartphone, 
  CheckCircle, 
  AlertTriangle, 
  Settings,
  Eye,
  Clock,
  User,
  Lock
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import BiometricAuth from './biometric-auth';
import MultiFactorAuth from './multi-factor-auth';
import IdentityVerification from './identity-verification';

interface SecurityStatus {
  biometricEnabled: boolean;
  mfaEnabled: boolean;
  identityVerified: boolean;
  verificationLevel: 'basic' | 'enhanced' | 'premium';
  lastSecurityUpdate: Date;
  securityScore: number;
}

interface SecurityDashboardProps {
  userType: 'passenger' | 'driver' | 'operator' | 'admin';
  className?: string;
}

export function SecurityDashboard({ userType, className }: SecurityDashboardProps) {
  const { user } = useAuth();
  const [securityStatus, setSecurityStatus] = useState<SecurityStatus>({
    biometricEnabled: false,
    mfaEnabled: false,
    identityVerified: false,
    verificationLevel: 'basic',
    lastSecurityUpdate: new Date(),
    securityScore: 0,
  });
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (user) {
      loadSecurityStatus();
    }
  }, [user]);

  const loadSecurityStatus = async () => {
    // In production, load from secure database
    const stored = localStorage.getItem(`security_${user?.uid}`);
    if (stored) {
      const status = JSON.parse(stored);
      setSecurityStatus({
        ...status,
        lastSecurityUpdate: new Date(status.lastSecurityUpdate),
      });
    }
    calculateSecurityScore();
  };

  const calculateSecurityScore = () => {
    let score = 20; // Base score for having an account
    
    if (securityStatus.biometricEnabled) score += 25;
    if (securityStatus.mfaEnabled) score += 25;
    if (securityStatus.identityVerified) score += 20;
    
    switch (securityStatus.verificationLevel) {
      case 'enhanced':
        score += 5;
        break;
      case 'premium':
        score += 10;
        break;
    }

    setSecurityStatus(prev => ({ ...prev, securityScore: Math.min(score, 100) }));
  };

  const updateSecurityStatus = (updates: Partial<SecurityStatus>) => {
    const newStatus = { 
      ...securityStatus, 
      ...updates, 
      lastSecurityUpdate: new Date() 
    };
    setSecurityStatus(newStatus);
    
    // Save to storage (in production, save to secure database)
    localStorage.setItem(`security_${user?.uid}`, JSON.stringify(newStatus));
    calculateSecurityScore();
  };

  const getSecurityLevel = () => {
    if (securityStatus.securityScore >= 90) return { level: 'Excellent', color: 'bg-green-500' };
    if (securityStatus.securityScore >= 70) return { level: 'Good', color: 'bg-blue-500' };
    if (securityStatus.securityScore >= 50) return { level: 'Fair', color: 'bg-yellow-500' };
    return { level: 'Poor', color: 'bg-red-500' };
  };

  const securityLevel = getSecurityLevel();

  const handleBiometricSuccess = () => {
    updateSecurityStatus({ biometricEnabled: true });
  };

  const handleMFASuccess = () => {
    updateSecurityStatus({ mfaEnabled: true });
  };

  const handleVerificationSuccess = (result: any) => {
    updateSecurityStatus({ 
      identityVerified: result.verified,
      verificationLevel: result.verificationLevel 
    });
  };

  return (
    <div className={className}>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="biometric">Biometric</TabsTrigger>
          <TabsTrigger value="mfa">2FA</TabsTrigger>
          <TabsTrigger value="verification">Verification</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Security Score Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Overview
              </CardTitle>
              <CardDescription>
                Your account security status and recommendations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Security Score */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Security Score</span>
                  <Badge variant="secondary" className={`${securityLevel.color} text-white`}>
                    {securityLevel.level}
                  </Badge>
                </div>
                <div className="w-full bg-muted rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full transition-all duration-500 ${securityLevel.color}`}
                    style={{ width: `${securityStatus.securityScore}%` }}
                  />
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>0</span>
                  <span className="font-medium">{securityStatus.securityScore}/100</span>
                  <span>100</span>
                </div>
              </div>

              {/* Security Features Status */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 p-3 rounded-lg border">
                  <div className={`p-2 rounded-full ${securityStatus.biometricEnabled ? 'bg-green-100 text-green-600' : 'bg-muted text-muted-foreground'}`}>
                    <Fingerprint className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Biometric Auth</p>
                    <p className="text-xs text-muted-foreground">
                      {securityStatus.biometricEnabled ? 'Enabled' : 'Not set up'}
                    </p>
                  </div>
                  {securityStatus.biometricEnabled && (
                    <CheckCircle className="h-4 w-4 text-green-600 ml-auto" />
                  )}
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg border">
                  <div className={`p-2 rounded-full ${securityStatus.mfaEnabled ? 'bg-green-100 text-green-600' : 'bg-muted text-muted-foreground'}`}>
                    <Smartphone className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Two-Factor Auth</p>
                    <p className="text-xs text-muted-foreground">
                      {securityStatus.mfaEnabled ? 'Enabled' : 'Not set up'}
                    </p>
                  </div>
                  {securityStatus.mfaEnabled && (
                    <CheckCircle className="h-4 w-4 text-green-600 ml-auto" />
                  )}
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg border">
                  <div className={`p-2 rounded-full ${securityStatus.identityVerified ? 'bg-green-100 text-green-600' : 'bg-muted text-muted-foreground'}`}>
                    <User className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Identity Verified</p>
                    <p className="text-xs text-muted-foreground">
                      {securityStatus.identityVerified ? securityStatus.verificationLevel : 'Not verified'}
                    </p>
                  </div>
                  {securityStatus.identityVerified && (
                    <CheckCircle className="h-4 w-4 text-green-600 ml-auto" />
                  )}
                </div>
              </div>

              {/* Security Recommendations */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Security Recommendations</h4>
                <div className="space-y-2">
                  {!securityStatus.biometricEnabled && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        Enable biometric authentication for faster and more secure login.
                        <Button 
                          variant="link" 
                          className="p-0 h-auto ml-2"
                          onClick={() => setActiveTab('biometric')}
                        >
                          Set up now
                        </Button>
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {!securityStatus.mfaEnabled && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        Add two-factor authentication to protect your account from unauthorized access.
                        <Button 
                          variant="link" 
                          className="p-0 h-auto ml-2"
                          onClick={() => setActiveTab('mfa')}
                        >
                          Set up now
                        </Button>
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {!securityStatus.identityVerified && userType === 'driver' && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        Complete identity verification to start accepting rides.
                        <Button 
                          variant="link" 
                          className="p-0 h-auto ml-2"
                          onClick={() => setActiveTab('verification')}
                        >
                          Verify now
                        </Button>
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {!securityStatus.identityVerified && userType === 'passenger' && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        Verify your identity to access premium features and higher ride limits.
                        <Button 
                          variant="link" 
                          className="p-0 h-auto ml-2"
                          onClick={() => setActiveTab('verification')}
                        >
                          Verify now
                        </Button>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>

              {/* Last Updated */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground pt-4 border-t">
                <Clock className="h-4 w-4" />
                <span>Last updated: {securityStatus.lastSecurityUpdate.toLocaleDateString()}</span>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Button 
                  variant="outline" 
                  className="justify-start"
                  onClick={() => setActiveTab('biometric')}
                >
                  <Fingerprint className="h-4 w-4 mr-2" />
                  Manage Biometric Auth
                </Button>
                <Button 
                  variant="outline" 
                  className="justify-start"
                  onClick={() => setActiveTab('mfa')}
                >
                  <Smartphone className="h-4 w-4 mr-2" />
                  Manage Two-Factor Auth
                </Button>
                <Button 
                  variant="outline" 
                  className="justify-start"
                  onClick={() => setActiveTab('verification')}
                >
                  <User className="h-4 w-4 mr-2" />
                  Identity Verification
                </Button>
                <Button variant="outline" className="justify-start">
                  <Eye className="h-4 w-4 mr-2" />
                  View Security Log
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="biometric">
          <BiometricAuth
            mode="setup"
            onSuccess={handleBiometricSuccess}
            onError={(error) => console.error('Biometric error:', error)}
          />
        </TabsContent>

        <TabsContent value="mfa">
          <MultiFactorAuth
            mode="setup"
            onSuccess={handleMFASuccess}
            onError={(error) => console.error('MFA error:', error)}
          />
        </TabsContent>

        <TabsContent value="verification">
          <IdentityVerification
            userType={userType === 'driver' ? 'driver' : 'passenger'}
            onSuccess={handleVerificationSuccess}
            onError={(error) => console.error('Verification error:', error)}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default SecurityDashboard;