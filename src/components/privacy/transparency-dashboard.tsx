'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Eye, 
  Shield, 
  Clock, 
  Users, 
  FileText, 
  AlertTriangle,
  CheckCircle,
  Settings,
  Download,
  Share,
  Lock,
  Unlock,
  Activity,
  BarChart3,
  Calendar,
  Filter
} from 'lucide-react';
import { 
  dataTransparencyService, 
  DataAccessLog, 
  DataSharingAgreement,
  PrivacyControl,
  DataUsageReport,
  TransparencyPreferences
} from '@/services/dataTransparencyService';

interface TransparencyDashboardProps {
  userId: string;
}

export default function TransparencyDashboard({ userId }: TransparencyDashboardProps) {
  const [accessLogs, setAccessLogs] = useState<DataAccessLog[]>([]);
  const [sharingAgreements, setSharingAgreements] = useState<DataSharingAgreement[]>([]);
  const [privacyControls, setPrivacyControls] = useState<PrivacyControl[]>([]);
  const [usageReport, setUsageReport] = useState<DataUsageReport | null>(null);
  const [preferences, setPreferences] = useState<TransparencyPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTransparencyData();
  }, [userId]);

  const loadTransparencyData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load access logs
      const logsResult = await dataTransparencyService.getDataAccessLogs(userId, 50);
      setAccessLogs(logsResult.logs);

      // Load sharing agreements
      const agreements = await dataTransparencyService.getDataSharingAgreements(userId);
      setSharingAgreements(agreements);

      // Load privacy controls
      const controls = await dataTransparencyService.getPrivacyControls(userId);
      setPrivacyControls(controls);

      // Generate usage report for last 30 days
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
      const report = await dataTransparencyService.generateDataUsageReport(userId, startDate, endDate);
      setUsageReport(report);

      // Load preferences
      const prefs = await dataTransparencyService.getTransparencyPreferences(userId);
      setPreferences(prefs);

    } catch (error) {
      console.error('Error loading transparency data:', error);
      setError('Failed to load transparency data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Data Transparency Dashboard</h1>
          <p className="text-muted-foreground">
            Complete visibility into how your data is accessed and used
          </p>
        </div>
        <Button onClick={loadTransparencyData} variant="outline">
          <Activity className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="access-logs">Access Logs</TabsTrigger>
          <TabsTrigger value="data-sharing">Data Sharing</TabsTrigger>
          <TabsTrigger value="privacy-controls">Privacy Controls</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {usageReport && (
            <>
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Data Access</CardTitle>
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{usageReport.totalAccesses}</div>
                    <p className="text-xs text-muted-foreground">Last 30 days</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Data Recipients</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{usageReport.dataShared.recipients.length}</div>
                    <p className="text-xs text-muted-foreground">Active sharing agreements</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Privacy Violations</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">{usageReport.privacyViolations.length}</div>
                    <p className="text-xs text-muted-foreground">Detected issues</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Privacy Controls</CardTitle>
                    <Shield className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{privacyControls.length}</div>
                    <p className="text-xs text-muted-foreground">Active controls</p>
                  </CardContent>
                </Card>
              </div>

              {/* Usage Report */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5" />
                    <span>Data Usage Summary</span>
                  </CardTitle>
                  <CardDescription>
                    How your data has been accessed in the last 30 days
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-3">Access by Data Type</h4>
                    <div className="space-y-2">
                      {Object.entries(usageReport.accessesByType).map(([type, count]) => (
                        <div key={type} className="flex items-center justify-between">
                          <span className="text-sm capitalize">{type.replace('_', ' ')}</span>
                          <div className="flex items-center space-x-2">
                            <div className="w-24 bg-muted rounded-full h-2">
                              <div 
                                className="bg-primary h-2 rounded-full" 
                                style={{ width: `${(count / usageReport.totalAccesses) * 100}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium w-8">{count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {usageReport.recommendations.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-3">Recommendations</h4>
                      <div className="space-y-2">
                        {usageReport.recommendations.map((rec, index) => (
                          <Alert key={index}>
                            <CheckCircle className="h-4 w-4" />
                            <AlertDescription>{rec}</AlertDescription>
                          </Alert>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Access Logs Tab */}
        <TabsContent value="access-logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Data Access Logs</span>
              </CardTitle>
              <CardDescription>
                Detailed log of all data access activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {accessLogs.map((log) => (
                  <div key={log.id} className="flex items-start space-x-4 p-4 border rounded-lg">
                    <div className="flex-shrink-0 mt-1">
                      {log.result === 'success' ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">{log.dataType}</Badge>
                          <Badge variant="outline">{log.accessType}</Badge>
                          <Badge variant={log.accessorType === 'third_party' ? 'destructive' : 'default'}>
                            {log.accessorType}
                          </Badge>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {log.timestamp.toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm font-medium mt-1">{log.purpose}</p>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                        <span>Accessor: {log.accessor}</span>
                        <span>Legal Basis: {log.legalBasis}</span>
                        {log.consentRequired && (
                          <span className={log.consentGiven ? 'text-green-600' : 'text-red-600'}>
                            Consent: {log.consentGiven ? 'Given' : 'Required'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Sharing Tab */}
        <TabsContent value="data-sharing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Share className="h-5 w-5" />
                <span>Data Sharing Agreements</span>
              </CardTitle>
              <CardDescription>
                Manage who has access to your data and for what purposes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sharingAgreements.map((agreement) => (
                  <div key={agreement.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{agreement.recipientName}</h4>
                        <p className="text-sm text-muted-foreground">{agreement.purpose}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={agreement.active ? 'default' : 'secondary'}>
                          {agreement.active ? 'Active' : 'Inactive'}
                        </Badge>
                        <Badge variant="outline">{agreement.recipientType}</Badge>
                      </div>
                    </div>
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center space-x-4 text-sm">
                        <span>Data Types: {agreement.dataTypes.join(', ')}</span>
                        <span>Shares: {agreement.shareCount}</span>
                        <span>Legal Basis: {agreement.legalBasis}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                          {agreement.encryptionRequired && (
                            <span className="flex items-center">
                              <Lock className="h-3 w-3 mr-1" />
                              Encrypted
                            </span>
                          )}
                          {agreement.dataMinimization && (
                            <span>Data Minimized</span>
                          )}
                          <span>Retention: {Math.floor(agreement.retentionPeriod / 365)} years</span>
                        </div>
                        {agreement.userCanRevoke && (
                          <Button size="sm" variant="outline">
                            Revoke Access
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Privacy Controls Tab */}
        <TabsContent value="privacy-controls" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Privacy Controls</span>
              </CardTitle>
              <CardDescription>
                Your active privacy controls and data access rules
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {privacyControls.map((control) => (
                  <div key={control.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium capitalize">{control.controlType.replace('_', ' ')}</h4>
                        <p className="text-sm text-muted-foreground">
                          {control.setting} access for {control.scope} scope
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={control.setting === 'allow' ? 'default' : 'destructive'}>
                          {control.setting}
                        </Badge>
                        {control.userDefined && (
                          <Badge variant="outline">User Defined</Badge>
                        )}
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      <span>Effective: {control.effectiveFrom.toLocaleDateString()}</span>
                      {control.expiryDate && (
                        <span> - Expires: {control.expiryDate.toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          {preferences && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="h-5 w-5" />
                  <span>Transparency Preferences</span>
                </CardTitle>
                <CardDescription>
                  Configure how you receive transparency information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive email notifications about data access
                      </p>
                    </div>
                    <Switch checked={preferences.emailNotifications} />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">Real-time Alerts</Label>
                      <p className="text-sm text-muted-foreground">
                        Get immediate alerts for unusual data access
                      </p>
                    </div>
                    <Switch checked={preferences.realTimeAlerts} />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">Weekly Reports</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive weekly data usage summaries
                      </p>
                    </div>
                    <Switch checked={preferences.weeklyReports} />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">Monthly Reports</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive comprehensive monthly reports
                      </p>
                    </div>
                    <Switch checked={preferences.monthlyReports} />
                  </div>
                </div>

                <div>
                  <Label className="text-base font-medium">Alert Thresholds</Label>
                  <div className="mt-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Unusual Access Patterns</span>
                      <Switch checked={preferences.alertThresholds.unusualAccess} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">New Data Sharing</span>
                      <Switch checked={preferences.alertThresholds.newDataSharing} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Privacy Violations</span>
                      <Switch checked={preferences.alertThresholds.privacyViolations} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Consent Expiry</span>
                      <Switch checked={preferences.alertThresholds.consentExpiry} />
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <Button>Save Preferences</Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}