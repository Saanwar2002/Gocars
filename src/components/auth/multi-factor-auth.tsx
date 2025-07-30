'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Shield, 
  Smartphone, 
  Key, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  Copy,
  Eye,
  EyeOff
} from 'lucide-react';
import { advancedAuthService, MFASetupData } from '@/services/advancedAuthService';
import { useAuth } from '@/contexts/AuthContext';

interface MultiFactorAuthProps {
  onSuccess?: (mfaData: MFASetupData) => void;
  onError?: (error: string) => void;
  mode: 'setup' | 'verify';
  className?: string;
}

export function MultiFactorAuth({ onSuccess, onError, mode, className }: MultiFactorAuthProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [activeTab, setActiveTab] = useState('sms');
  const [mfaSetupData, setMfaSetupData] = useState<MFASetupData | null>(null);

  const handlePhoneSetup = async () => {
    if (!user || !phoneNumber) {
      setMessage('Please enter a valid phone number');
      setStatus('error');
      return;
    }

    // Validate phone number format
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phoneNumber)) {
      setMessage('Please enter a valid phone number with country code (e.g., +1234567890)');
      setStatus('error');
      return;
    }

    setIsLoading(true);
    setStatus('idle');
    setMessage('');

    try {
      const mfaData = await advancedAuthService.setupMFA(user, phoneNumber);
      setMfaSetupData(mfaData);
      setBackupCodes(mfaData.backupCodes);
      setStatus('success');
      setMessage('SMS verification sent! Please enter the code you received.');
      onSuccess?.(mfaData);
    } catch (error) {
      console.error('Error setting up MFA:', error);
      setStatus('error');
      setMessage('Failed to set up multi-factor authentication. Please try again.');
      onError?.(error instanceof Error ? error.message : 'Setup failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeVerification = async () => {
    if (!user || !verificationCode) {
      setMessage('Please enter the verification code');
      setStatus('error');
      return;
    }

    setIsLoading(true);
    setStatus('idle');
    setMessage('');

    try {
      const codeType = activeTab === 'backup' ? 'backup' : 'sms';
      const verified = await advancedAuthService.verifyMFACode(user.uid, verificationCode, codeType);
      
      if (verified) {
        setStatus('success');
        setMessage('Multi-factor authentication verified successfully!');
        if (mfaSetupData) {
          onSuccess?.(mfaSetupData);
        }
      } else {
        setStatus('error');
        setMessage('Invalid verification code. Please try again.');
        onError?.('Invalid code');
      }
    } catch (error) {
      console.error('Error verifying MFA code:', error);
      setStatus('error');
      setMessage('An error occurred while verifying the code');
      onError?.(error instanceof Error ? error.message : 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const copyBackupCodes = () => {
    const codesText = backupCodes.join('\n');
    navigator.clipboard.writeText(codesText);
    setMessage('Backup codes copied to clipboard');
    setStatus('success');
  };

  const downloadBackupCodes = () => {
    const codesText = backupCodes.join('\n');
    const blob = new Blob([codesText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'gocars-backup-codes.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (mode === 'setup') {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Multi-Factor Authentication
            {status === 'success' && mfaSetupData && (
              <Badge variant="secondary" className="ml-auto">
                <CheckCircle className="h-3 w-3 mr-1" />
                Configured
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Add an extra layer of security to your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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

          {!mfaSetupData ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1234567890"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  disabled={isLoading}
                />
                <p className="text-sm text-muted-foreground">
                  Include country code (e.g., +1 for US, +44 for UK)
                </p>
              </div>

              <Button
                onClick={handlePhoneSetup}
                disabled={isLoading || !phoneNumber}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Setting up...
                  </>
                ) : (
                  <>
                    <Smartphone className="h-4 w-4 mr-2" />
                    Set Up SMS Authentication
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="verification-code">Verification Code</Label>
                <Input
                  id="verification-code"
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  disabled={isLoading}
                  maxLength={6}
                />
              </div>

              <Button
                onClick={handleCodeVerification}
                disabled={isLoading || verificationCode.length !== 6}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Verify Code
                  </>
                )}
              </Button>

              {backupCodes.length > 0 && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full">
                      <Key className="h-4 w-4 mr-2" />
                      View Backup Codes
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Backup Codes</DialogTitle>
                      <DialogDescription>
                        Save these codes in a secure location. You can use them to access your account if you lose your phone.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-2 p-4 bg-muted rounded-lg font-mono text-sm">
                        {backupCodes.map((code, index) => (
                          <div key={index} className="text-center py-1">
                            {code}
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={copyBackupCodes} variant="outline" className="flex-1">
                          <Copy className="h-4 w-4 mr-2" />
                          Copy
                        </Button>
                        <Button onClick={downloadBackupCodes} variant="outline" className="flex-1">
                          Download
                        </Button>
                      </div>
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Each backup code can only be used once. Store them securely and don't share them with anyone.
                        </AlertDescription>
                      </Alert>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Verification mode
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Two-Factor Authentication
        </CardTitle>
        <CardDescription>
          Enter your verification code to continue
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="sms">SMS Code</TabsTrigger>
            <TabsTrigger value="backup">Backup Code</TabsTrigger>
          </TabsList>
          
          <TabsContent value="sms" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sms-code">SMS Verification Code</Label>
              <Input
                id="sms-code"
                type="text"
                placeholder="Enter 6-digit code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                disabled={isLoading}
                maxLength={6}
              />
              <p className="text-sm text-muted-foreground">
                Check your phone for the verification code
              </p>
            </div>
          </TabsContent>
          
          <TabsContent value="backup" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="backup-code">Backup Code</Label>
              <Input
                id="backup-code"
                type="text"
                placeholder="Enter backup code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                disabled={isLoading}
              />
              <p className="text-sm text-muted-foreground">
                Use one of your saved backup codes
              </p>
            </div>
          </TabsContent>
        </Tabs>

        {message && (
          <Alert variant={status === 'error' ? 'destructive' : 'default'} className="mt-4">
            {status === 'success' ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        <Button
          onClick={handleCodeVerification}
          disabled={isLoading || !verificationCode}
          className="w-full mt-4"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Verifying...
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Verify Code
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

export default MultiFactorAuth;