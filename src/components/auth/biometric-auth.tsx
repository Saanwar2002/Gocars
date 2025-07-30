'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Fingerprint, Shield, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { advancedAuthService } from '@/services/advancedAuthService';
import { useAuth } from '@/contexts/AuthContext';

interface BiometricAuthProps {
  onSuccess?: (credentialId: string) => void;
  onError?: (error: string) => void;
  mode: 'setup' | 'authenticate';
  className?: string;
}

export function BiometricAuth({ onSuccess, onError, mode, className }: BiometricAuthProps) {
  const { user } = useAuth();
  const [isSupported, setIsSupported] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    checkBiometricSupport();
  }, []);

  const checkBiometricSupport = async () => {
    try {
      const supported = await advancedAuthService.initializeBiometricAuth();
      setIsSupported(supported);
      
      if (!supported) {
        setMessage('Biometric authentication is not supported on this device');
        setStatus('error');
      }
    } catch (error) {
      console.error('Error checking biometric support:', error);
      setIsSupported(false);
      setMessage('Error checking biometric support');
      setStatus('error');
    }
  };

  const handleBiometricSetup = async () => {
    if (!user) {
      setMessage('User not authenticated');
      setStatus('error');
      onError?.('User not authenticated');
      return;
    }

    setIsLoading(true);
    setStatus('idle');
    setMessage('');

    try {
      const result = await advancedAuthService.registerBiometric(user.uid);
      
      if (result.success && result.credentialId) {
        setStatus('success');
        setMessage('Biometric authentication has been successfully set up');
        onSuccess?.(result.credentialId);
      } else {
        setStatus('error');
        setMessage('Failed to set up biometric authentication');
        onError?.('Setup failed');
      }
    } catch (error) {
      console.error('Error setting up biometric auth:', error);
      setStatus('error');
      setMessage('An error occurred while setting up biometric authentication');
      onError?.(error instanceof Error ? error.message : 'Setup failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBiometricAuth = async () => {
    if (!user) {
      setMessage('User not authenticated');
      setStatus('error');
      onError?.('User not authenticated');
      return;
    }

    setIsLoading(true);
    setStatus('idle');
    setMessage('');

    try {
      const result = await advancedAuthService.authenticateWithBiometric(user.uid);
      
      if (result.success && result.verified) {
        setStatus('success');
        setMessage('Biometric authentication successful');
        onSuccess?.('authenticated');
      } else {
        setStatus('error');
        setMessage('Biometric authentication failed');
        onError?.('Authentication failed');
      }
    } catch (error) {
      console.error('Error authenticating with biometric:', error);
      setStatus('error');
      setMessage('An error occurred during biometric authentication');
      onError?.(error instanceof Error ? error.message : 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSupported === null) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Checking biometric support...</span>
        </CardContent>
      </Card>
    );
  }

  if (!isSupported) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Fingerprint className="h-5 w-5" />
            Biometric Authentication
          </CardTitle>
          <CardDescription>
            Secure your account with fingerprint or face recognition
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Biometric authentication is not supported on this device or browser.
              Please use a device with biometric capabilities and a compatible browser.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Fingerprint className="h-5 w-5" />
          Biometric Authentication
          {status === 'success' && (
            <Badge variant="secondary" className="ml-auto">
              <CheckCircle className="h-3 w-3 mr-1" />
              Active
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          {mode === 'setup' 
            ? 'Set up fingerprint or face recognition for secure access'
            : 'Use your fingerprint or face to authenticate'
          }
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

        <div className="flex flex-col gap-3">
          {mode === 'setup' ? (
            <Button
              onClick={handleBiometricSetup}
              disabled={isLoading || status === 'success'}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Setting up...
                </>
              ) : status === 'success' ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Setup Complete
                </>
              ) : (
                <>
                  <Fingerprint className="h-4 w-4 mr-2" />
                  Set Up Biometric Auth
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={handleBiometricAuth}
              disabled={isLoading}
              className="w-full"
              variant="outline"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  <Fingerprint className="h-4 w-4 mr-2" />
                  Use Biometric Auth
                </>
              )}
            </Button>
          )}

          {mode === 'setup' && (
            <div className="text-sm text-muted-foreground space-y-2">
              <p className="font-medium">Benefits of biometric authentication:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Faster and more secure login</li>
                <li>No need to remember passwords</li>
                <li>Protection against unauthorized access</li>
                <li>Enhanced security for sensitive operations</li>
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default BiometricAuth;