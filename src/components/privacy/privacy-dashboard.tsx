'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Shield, 
  Download, 
  Trash2, 
  Eye, 
  EyeOff,
  Lock,
  Unlock,
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  Info,
  Settings,
  Database,
  Key
} from 'lucide-react';
import { 
  dataPrivacyService, 
  PrivacySettings, 
  DataExportRequest, 
  DataDeletionRequest,
  GDPRComplianceReport,
  DataRetentionPolicy
} from '@/services/dataPrivacyService';

interface PrivacyDashboardProps {
  userId: string;
}

export default function PrivacyDashboard({ userId }: PrivacyDashboardProps) {
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings | null>(null);
  const [complianceReport, setComplianceReport] = useState<GDPRComplianceReport | null>(null);
  const [retentionPolicies, setRetentionPolicies] = useState<DataRetentionPolicy[]>([]);
  const [exportRequests, setExportRequests] = useState<DataExportRequest[]>([]);
  const [deletionRequests, setDeletionRequests] = useState<DataDeletionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadPrivacyData();
  }, [userId]);

  const loadPrivacyData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load privacy settings
      const settings = await dataPrivacyService.getUserPrivacySettings(userId);
      setPrivacySettings(settings);

      // Load GDPR compliance report
      const report = await dataPrivacyService.generateGDPRComplianceReport(userId);
      setComplianceReport(report);

      // Load retention policies
      const policies = dataPrivacyService.getRetentionPolicies();
      setRetentionPolicies(policies);

      // Load export/deletion requests (mock data for demo)
      setExportRequests([]);
      setDeletionRequests([]);

    } catch (error) {
      console.error('Error loading privacy data:', error);
      setError('Failed to load privacy settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updatePrivacySetting = async (key: keyof PrivacySettings, value: any) => {
    if (!privacySettings) return;

    try {
      setSaving(true);
      setError(null);

      const updatedSettings = { ...privacySettings, [key]: value };
      await dataPrivacyService.updatePrivacySettings(userId, { [key]: value });
      
      setPrivacySettings(updatedSettings);
      setSuccess('Privacy settings updated successfully');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error updating privacy setting:', error);
      setError('Failed to update privacy settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const requestDataExport = async (format: 'json' | 'csv' | 'xml' = 'json') => {
    try {
      setSaving(true);
      setError(null);

      const request = await dataPrivacyService.requestDataExport(userId, format, false);
      setExportRequests(prev => [...prev, request]);
      setSuccess('Data export request submitted. You will be notified when it\'s ready.');
      
      setTimeout(() => setSuccess(null), 5000);
    } catch (error) {
      console.error('Error requesting data export:', error);
      setError('Failed to request data export. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const requestDataDeletion = async () => {
    try {
      setSaving(true);
      setError(null);

      const request = await dataPrivacyService.requestDataDeletion(userId, 'soft', true);
      setDeletionRequests(prev => [...prev, request]);
      setSuccess('Data deletion request submitted. Verification required to proceed.');
      
      setTimeout(() => setSuccess(null), 5000);
    } catch (error) {
      console.error('Error requesting data deletion:', error);
      setError('Failed to request data deletion. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const getConsentStatusColor = (consent: boolean) => {
    return consent ? 'text-green-600' : 'text-red-600';
  };

  const getConsentStatusIcon = (consent: boolean) => {
    return consent ? <CheckCircle className="h-4 w-4 text-green-600" /> : <AlertTriangle className="h-4 w-4 text-red-600" />;
  };

  const getDataTypeIcon = (dataType: string) => {
    switch (dataType) {
      case 'user_profile':
        return <Shield className="h-4 w-4" />;
      case 'ride_history':
        return <Clock className="h-4 w-4" />;
      case 'payment_data':
        return <Key className="h-4 w-4" />;
      case 'location_data':
        return <Eye className="h-4 w-4" />;
      case 'communication_logs':
        return <FileText className="h-4 w-4" />;
      case 'analytics_data':
        return <Database className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const formatDataType = (dataType: string) => {
    return dataType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const calculateRetentionDays = (retentionPeriod: number) => {
    const years = Math.floor(retentionPeriod / 365);
    const months = Math.floor((retentionPeriod % 365) / 30);
    const days = retentionPeriod % 30;

    if (years > 0) {
      return `${years} year${years > 1 ? 's' : ''}${months > 0 ? `, ${months} month${months > 1 ? 's' : ''}` : ''}`;
    } else if (months > 0) {
      return `${months} month${months > 1 ? 's' : ''}${days > 0 ? `, ${days} day${days > 1 ? 's' : ''}` : ''}`;
    } else {
      return `${days} day${days > 1 ? 's' : ''}`;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!privacySettings || !complianceReport) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Failed to load privacy settings. Please refresh the page and try again.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Privacy & Data Protection</h1>
          <p className="text-muted-foreground">
            Manage your privacy settings and data protection preferences
          </p>
        </div>
        <Button onClick={loadPrivacyData} variant="outline">
          <Settings className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Status Messages */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <Tabs defaultValue="settings" className="space-y-4">
        <TabsList>
          <TabsTrigger value="settings">Privacy Settings</TabsTrigger>
          <TabsTrigger value="compliance">GDPR Compliance</TabsTrigger>
          <TabsTrigger value="data">Data Management</TabsTrigger>
          <TabsTrigger value="retention">Retention Policies</TabsTrigger>
        </TabsList>

        {/* Privacy Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Data Processing Consent</span>
              </CardTitle>
              <CardDescription>
                Control how your personal data is processed and used
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-base font-medium">Data Processing</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow processing of your personal data for core platform functionality
                  </p>
                </div>
                <Switch
                  checked={privacySettings.dataProcessingConsent}
                  onCheckedChange={(checked) => updatePrivacySetting('dataProcessingConsent', checked)}
                  disabled={saving}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-base font-medium">Marketing Communications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive promotional emails, offers, and marketing communications
                  </p>
                </div>
                <Switch
                  checked={privacySettings.marketingConsent}
                  onCheckedChange={(checked) => updatePrivacySetting('marketingConsent', checked)}
                  disabled={saving}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-base font-medium">Analytics & Insights</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow anonymous data collection for service improvement and analytics
                  </p>
                </div>
                <Switch
                  checked={privacySettings.analyticsConsent}
                  onCheckedChange={(checked) => updatePrivacySetting('analyticsConsent', checked)}
                  disabled={saving}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-base font-medium">Location Tracking</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow continuous location tracking for enhanced ride experience
                  </p>
                </div>
                <Switch
                  checked={privacySettings.locationTrackingConsent}
                  onCheckedChange={(checked) => updatePrivacySetting('locationTrackingConsent', checked)}
                  disabled={saving}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* GDPR Compliance Tab */}
        <TabsContent value="compliance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>GDPR Compliance Status</span>
              </CardTitle>
              <CardDescription>
                Your data processing compliance with GDPR regulations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Data Processing Lawfulness</span>
                    {getConsentStatusIcon(complianceReport.dataProcessingLawfulness)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Data Minimization</span>
                    {getConsentStatusIcon(complianceReport.dataMinimization)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Accuracy Maintained</span>
                    {getConsentStatusIcon(complianceReport.accuracyMaintained)}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Storage Minimized</span>
                    {getConsentStatusIcon(complianceReport.storageMinimized)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Integrity & Confidentiality</span>
                    {getConsentStatusIcon(complianceReport.integrityAndConfidentiality)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Accountability</span>
                    {getConsentStatusIcon(complianceReport.accountability)}
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-3">Consent Status</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Data Processing</span>
                    <Badge variant={complianceReport.consentStatus.processing ? 'default' : 'destructive'}>
                      {complianceReport.consentStatus.processing ? 'Granted' : 'Denied'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Marketing</span>
                    <Badge variant={complianceReport.consentStatus.marketing ? 'default' : 'secondary'}>
                      {complianceReport.consentStatus.marketing ? 'Granted' : 'Denied'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Analytics</span>
                    <Badge variant={complianceReport.consentStatus.analytics ? 'default' : 'secondary'}>
                      {complianceReport.consentStatus.analytics ? 'Granted' : 'Denied'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Location Tracking</span>
                    <Badge variant={complianceReport.consentStatus.location ? 'default' : 'secondary'}>
                      {complianceReport.consentStatus.location ? 'Granted' : 'Denied'}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="text-xs text-muted-foreground">
                Last audit: {complianceReport.lastAudit.toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Management Tab */}
        <TabsContent value="data" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Data Export */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Download className="h-5 w-5" />
                  <span>Data Export</span>
                </CardTitle>
                <CardDescription>
                  Download a copy of all your personal data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  You have the right to receive a copy of your personal data in a structured, 
                  commonly used format. This includes your profile, ride history, preferences, and more.
                </p>
                
                <div className="flex space-x-2">
                  <Button 
                    onClick={() => requestDataExport('json')} 
                    disabled={saving}
                    size="sm"
                  >
                    Export as JSON
                  </Button>
                  <Button 
                    onClick={() => requestDataExport('csv')} 
                    disabled={saving}
                    variant="outline"
                    size="sm"
                  >
                    Export as CSV
                  </Button>
                </div>

                {exportRequests.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-sm font-medium">Recent Export Requests</h5>
                    {exportRequests.map((request) => (
                      <div key={request.id} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <p className="text-sm font-medium">{request.format.toUpperCase()}</p>
                          <p className="text-xs text-muted-foreground">
                            {request.requestedAt.toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant={
                          request.status === 'completed' ? 'default' : 
                          request.status === 'failed' ? 'destructive' : 'secondary'
                        }>
                          {request.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Data Deletion */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Trash2 className="h-5 w-5" />
                  <span>Data Deletion</span>
                </CardTitle>
                <CardDescription>
                  Request deletion of your personal data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Data deletion is permanent and cannot be undone. Some data may be retained 
                    for legal compliance purposes.
                  </AlertDescription>
                </Alert>
                
                <p className="text-sm text-muted-foreground">
                  You have the right to request deletion of your personal data. We will delete 
                  your data within 30 days, except where retention is required by law.
                </p>
                
                <Button 
                  onClick={requestDataDeletion} 
                  disabled={saving}
                  variant="destructive"
                  size="sm"
                >
                  Request Data Deletion
                </Button>

                {deletionRequests.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-sm font-medium">Recent Deletion Requests</h5>
                    {deletionRequests.map((request) => (
                      <div key={request.id} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <p className="text-sm font-medium">{request.deletionType} deletion</p>
                          <p className="text-xs text-muted-foreground">
                            {request.requestedAt.toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant={
                          request.status === 'completed' ? 'default' : 
                          request.status === 'failed' ? 'destructive' : 'secondary'
                        }>
                          {request.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Retention Policies Tab */}
        <TabsContent value="retention" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>Data Retention Policies</span>
              </CardTitle>
              <CardDescription>
                How long different types of your data are stored
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {retentionPolicies.map((policy) => (
                  <div key={policy.dataType} className="flex items-start space-x-4 p-4 border rounded-lg">
                    <div className="flex-shrink-0 mt-1">
                      {getDataTypeIcon(policy.dataType)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{formatDataType(policy.dataType)}</h4>
                        <div className="flex items-center space-x-2">
                          {policy.encryptionRequired && (
                            <Badge variant="outline" className="text-xs">
                              <Lock className="h-3 w-3 mr-1" />
                              Encrypted
                            </Badge>
                          )}
                          {policy.anonymizationRequired && (
                            <Badge variant="outline" className="text-xs">
                              <EyeOff className="h-3 w-3 mr-1" />
                              Anonymized
                            </Badge>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Retained for {calculateRetentionDays(policy.retentionPeriod)}
                        {policy.autoDelete && ' (automatically deleted)'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <Info className="h-4 w-4 inline mr-2" />
                  Data retention periods are set according to legal requirements and business needs. 
                  Some data may be retained longer for legal compliance purposes.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}