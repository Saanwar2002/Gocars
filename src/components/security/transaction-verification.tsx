'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock,
  CreditCard,
  Smartphone,
  Mail,
  Lock
} from 'lucide-react';
import { fraudPreventionService, FraudCheckResult } from '@/services/fraudPreventionService';

interface TransactionVerificationProps {
  userId: string;
  transactionData: {
    id: string;
    amount: number;
    currency: string;
    paymentMethod: any;
    location?: any;
    deviceInfo?: any;
  };
  onVerificationComplete: (result: { approved: boolean; reason?: string }) => void;
  onCancel: () => void;
}

interface VerificationStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  required: boolean;
}

export default function TransactionVerification({
  userId,
  transactionData,
  onVerificationComplete,
  onCancel
}: TransactionVerificationProps) {
  const [verificationSteps, setVerificationSteps] = useState<VerificationStep[]>([
    {
      id: 'fraud_check',
      title: 'Fraud Risk Assessment',
      description: 'Analyzing transaction for fraud indicators',
      status: 'pending',
      required: true
    },
    {
      id: 'identity_verification',
      title: 'Identity Verification',
      description: 'Confirming your identity',
      status: 'pending',
      required: false
    },
    {
      id: 'payment_verification',
      title: 'Payment Method Verification',
      description: 'Verifying payment method authenticity',
      status: 'pending',
      required: true
    },
    {
      id: 'final_approval',
      title: 'Final Approval',
      description: 'Processing final transaction approval',
      status: 'pending',
      required: true
    }
  ]);

  const [currentStep, setCurrentStep] = useState(0);
  const [fraudCheckResult, setFraudCheckResult] = useState<FraudCheckResult | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationMethod, setVerificationMethod] = useState<'sms' | 'email' | 'app'>('sms');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    startVerificationProcess();
  }, []);

  const startVerificationProcess = async () => {
    setLoading(true);
    setError(null);

    try {
      // Step 1: Fraud Risk Assessment
      await updateStepStatus('fraud_check', 'in_progress');
      
      const fraudCheck = await fraudPreventionService.checkUserAction(
        userId,
        'payment',
        transactionData
      );
      
      setFraudCheckResult(fraudCheck);

      if (!fraudCheck.allowed) {
        await updateStepStatus('fraud_check', 'failed');
        onVerificationComplete({
          approved: false,
          reason: fraudCheck.reason
        });
        return;
      }

      await updateStepStatus('fraud_check', 'completed');

      // Determine if additional verification is needed
      const needsIdentityVerification = fraudCheck.requiredActions.includes('complete_verification') || 
                                       fraudCheck.riskScore > 60;

      if (needsIdentityVerification) {
        setVerificationSteps(prev => 
          prev.map(step => 
            step.id === 'identity_verification' 
              ? { ...step, required: true }
              : step
          )
        );
      }

      // Move to next step
      setCurrentStep(1);
      await processNextStep();

    } catch (error) {
      console.error('Error in verification process:', error);
      setError('Verification process failed. Please try again.');
      await updateStepStatus('fraud_check', 'failed');
    } finally {
      setLoading(false);
    }
  };

  const processNextStep = async () => {
    const step = verificationSteps[currentStep];
    if (!step) return;

    setLoading(true);
    await updateStepStatus(step.id, 'in_progress');

    try {
      switch (step.id) {
        case 'identity_verification':
          if (step.required) {
            await processIdentityVerification();
          } else {
            await updateStepStatus(step.id, 'completed');
            moveToNextStep();
          }
          break;

        case 'payment_verification':
          await processPaymentVerification();
          break;

        case 'final_approval':
          await processFinalApproval();
          break;

        default:
          moveToNextStep();
      }
    } catch (error) {
      console.error(`Error in step ${step.id}:`, error);
      await updateStepStatus(step.id, 'failed');
      setError(`Failed to complete ${step.title}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const processIdentityVerification = async () => {
    // Send verification code
    await sendVerificationCode();
    // Wait for user input - this will be handled by the verification code input
  };

  const processPaymentVerification = async () => {
    // Simulate payment method verification
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // In production, this would verify the payment method
    const isValid = Math.random() > 0.1; // 90% success rate for demo
    
    if (isValid) {
      await updateStepStatus('payment_verification', 'completed');
      moveToNextStep();
    } else {
      await updateStepStatus('payment_verification', 'failed');
      setError('Payment method verification failed. Please check your payment details.');
    }
  };

  const processFinalApproval = async () => {
    // Simulate final approval process
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    await updateStepStatus('final_approval', 'completed');
    
    onVerificationComplete({
      approved: true,
      reason: 'Transaction verified successfully'
    });
  };

  const sendVerificationCode = async () => {
    // Simulate sending verification code
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log(`Verification code sent via ${verificationMethod}`);
  };

  const verifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a valid 6-digit verification code');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Simulate code verification
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In production, verify the code with your backend
      const isValidCode = verificationCode === '123456' || Math.random() > 0.2; // Demo logic
      
      if (isValidCode) {
        await updateStepStatus('identity_verification', 'completed');
        moveToNextStep();
      } else {
        setError('Invalid verification code. Please try again.');
      }
    } catch (error) {
      setError('Code verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateStepStatus = async (stepId: string, status: VerificationStep['status']) => {
    setVerificationSteps(prev =>
      prev.map(step =>
        step.id === stepId ? { ...step, status } : step
      )
    );
    
    // Small delay for visual feedback
    await new Promise(resolve => setTimeout(resolve, 500));
  };

  const moveToNextStep = () => {
    const nextStepIndex = currentStep + 1;
    if (nextStepIndex < verificationSteps.length) {
      setCurrentStep(nextStepIndex);
      setTimeout(() => processNextStep(), 500);
    }
  };

  const getStepIcon = (step: VerificationStep) => {
    switch (step.status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'in_progress':
        return <Clock className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getVerificationMethodIcon = (method: string) => {
    switch (method) {
      case 'sms':
        return <Smartphone className="h-4 w-4" />;
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'app':
        return <Lock className="h-4 w-4" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  };

  const getRiskScoreColor = (score: number) => {
    if (score >= 80) return 'text-red-600';
    if (score >= 60) return 'text-orange-600';
    if (score >= 30) return 'text-yellow-600';
    return 'text-green-600';
  };

  const completedSteps = verificationSteps.filter(step => step.status === 'completed').length;
  const totalSteps = verificationSteps.filter(step => step.required).length;
  const progress = (completedSteps / totalSteps) * 100;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Shield className="h-6 w-6 text-blue-500" />
            <CardTitle>Transaction Verification</CardTitle>
          </div>
          <CardDescription>
            Verifying your transaction for security and fraud prevention
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Transaction Details */}
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="flex items-center space-x-3">
                <CreditCard className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">
                    {transactionData.currency} {transactionData.amount.toFixed(2)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Transaction ID: {transactionData.id}
                  </p>
                </div>
              </div>
              {fraudCheckResult && (
                <Badge variant={fraudCheckResult.allowed ? 'default' : 'destructive'}>
                  Risk Score: {fraudCheckResult.riskScore}
                </Badge>
              )}
            </div>

            {/* Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Verification Progress</span>
                <span className="text-sm text-muted-foreground">
                  {completedSteps} of {totalSteps} completed
                </span>
              </div>
              <Progress value={progress} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fraud Check Results */}
      {fraudCheckResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5" />
              <span>Security Assessment</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Risk Score</span>
                <span className={`font-bold ${getRiskScoreColor(fraudCheckResult.riskScore)}`}>
                  {fraudCheckResult.riskScore}/100
                </span>
              </div>
              
              {fraudCheckResult.reason && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{fraudCheckResult.reason}</AlertDescription>
                </Alert>
              )}

              {fraudCheckResult.requiredActions.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Required Actions:</p>
                  <ul className="text-sm space-y-1">
                    {fraudCheckResult.requiredActions.map((action, index) => (
                      <li key={index} className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full" />
                        <span>{action.replace('_', ' ').toUpperCase()}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Verification Steps */}
      <Card>
        <CardHeader>
          <CardTitle>Verification Steps</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {verificationSteps.map((step, index) => (
              <div
                key={step.id}
                className={`flex items-start space-x-3 p-3 rounded-lg border ${
                  index === currentStep ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                } ${!step.required ? 'opacity-60' : ''}`}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {getStepIcon(step)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium">{step.title}</h4>
                    {!step.required && (
                      <Badge variant="outline" className="text-xs">Optional</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Identity Verification Input */}
      {currentStep === 1 && verificationSteps[1].required && verificationSteps[1].status === 'in_progress' && (
        <Card>
          <CardHeader>
            <CardTitle>Identity Verification</CardTitle>
            <CardDescription>
              Please verify your identity to continue with this transaction
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Verification Method Selection */}
            <div>
              <Label className="text-sm font-medium">Verification Method</Label>
              <div className="flex space-x-2 mt-2">
                {(['sms', 'email', 'app'] as const).map((method) => (
                  <Button
                    key={method}
                    variant={verificationMethod === method ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setVerificationMethod(method)}
                    className="flex items-center space-x-2"
                  >
                    {getVerificationMethodIcon(method)}
                    <span className="capitalize">{method}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Verification Code Input */}
            <div>
              <Label htmlFor="verification-code">Verification Code</Label>
              <div className="flex space-x-2 mt-1">
                <Input
                  id="verification-code"
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  maxLength={6}
                  className="flex-1"
                />
                <Button onClick={verifyCode} disabled={loading}>
                  Verify
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Code sent to your registered {verificationMethod === 'sms' ? 'phone number' : verificationMethod}
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={sendVerificationCode}
              disabled={loading}
            >
              Resend Code
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onCancel} disabled={loading}>
          Cancel Transaction
        </Button>
        
        {loading && (
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            <span>Processing...</span>
          </div>
        )}
      </div>
    </div>
  );
}