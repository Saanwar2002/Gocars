'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { 
  RefreshCw, 
  Database, 
  CheckCircle,
  AlertCircle,
  Clock,
  Play,
  Pause,
  Settings,
  BarChart3
} from 'lucide-react';
import { 
  dataSynchronizationService, 
  SyncConfiguration,
  SyncSession,
  SyncConflict
} from '@/services/dataSynchronizationService';
import { useToast } from '@/hooks/use-toast';

interface DataSyncDashboardProps {
  userId: string;
  userRole: 'admin' | 'developer' | 'analyst';
}

export function DataSyncDashboard({ userId, userRole }: DataSyncDashboardProps) {
  const [configurations, setConfigurations] = useState<SyncConfiguration[]>([]);
  const [sessions, setSessions] = useState<SyncSession[]>([]);
  const [conflicts, setConflicts] = useState<SyncConflict[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('configurations');
  const { toast } = useToast();

  useEffect(() => {
    loadSyncData();
  }, [userId]);

  const loadSyncData = async () => {
    try {
      setLoading(true);
      
      const [configsData, sessionsData, conflictsData] = await Promise.all([
        dataSynchronizationService.getSyncConfigurations(userId),
        dataSynchronizationService.getSyncSessions(),
        dataSynchronizationService.getUnresolvedConflicts()
      ]);

      setConfigurations(configsData);
      setSessions(sessionsData);
      setConflicts(conflictsData);
    } catch (error) {
      console.error('Error loading sync data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load synchronization data.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Data Synchronization</h1>
          <p className="text-gray-600">Manage real-time data sync with external systems</p>
        </div>
        <Button onClick={loadSyncData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Database className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Configurations</p>
                <p className="text-2xl font-bold">{configurations.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Add more summary cards here */}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="configurations">Configurations</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="conflicts">Conflicts</TabsTrigger>
        </TabsList>

        <TabsContent value="configurations">
          <Card>
            <CardHeader>
              <CardTitle>Sync Configurations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {configurations.map((config) => (
                  <div key={config.id} className="p-4 border rounded-lg">
                    <h4 className="font-medium">{config.name}</h4>
                    <p className="text-sm text-gray-600">{config.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        {/* Add other tab contents */}
      </Tabs>
    </div>
  );
}