'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  AlertTriangle, Clock, Smartphone, Monitor, Tablet,
  Check, X, GitMerge, ArrowRight, ArrowLeft, Info
} from 'lucide-react';

interface SyncConflict {
  id: string;
  localData: {
    data: any;
    timestamp: number;
    deviceId: string;
    version: number;
  };
  remoteData: {
    data: any;
    timestamp: number;
    deviceId: string;
    version: number;
  };
  conflictType: 'version' | 'timestamp' | 'concurrent';
  resolved: boolean;
}

interface ConflictResolverProps {
  conflicts: SyncConflict[];
  onResolveConflict: (conflictId: string, resolution: 'local' | 'remote' | 'merge') => void;
  onResolveAll: (resolution: 'local' | 'remote' | 'merge') => void;
  className?: string;
}

export function ConflictResolver({
  conflicts,
  onResolveConflict,
  onResolveAll,
  className
}: ConflictResolverProps) {
  const [selectedConflict, setSelectedConflict] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const getDeviceIcon = (deviceId: string) => {
    if (deviceId.includes('mobile')) return <Smartphone className="h-4 w-4" />;
    if (deviceId.includes('tablet')) return <Tablet className="h-4 w-4" />;
    return <Monitor className="h-4 w-4" />;
  };

  const getConflictTypeColor = (type: string) => {
    switch (type) {
      case 'version': return 'bg-red-100 text-red-800';
      case 'timestamp': return 'bg-orange-100 text-orange-800';
      case 'concurrent': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const renderDataDiff = (localData: any, remoteData: any) => {
    const localKeys = Object.keys(localData || {});
    const remoteKeys = Object.keys(remoteData || {});
    const allKeys = Array.from(new Set([...localKeys, ...remoteKeys]));

    return (
      <div className="space-y-2">
        {allKeys.map(key => {
          const localValue = localData?.[key];
          const remoteValue = remoteData?.[key];
          const isDifferent = JSON.stringify(localValue) !== JSON.stringify(remoteValue);

          return (
            <div key={key} className={cn(
              'p-2 rounded border',
              isDifferent ? 'border-orange-200 bg-orange-50' : 'border-gray-200 bg-gray-50'
            )}>
              <div className="font-medium text-sm mb-1">{key}</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="space-y-1">
                  <div className="font-medium text-blue-600">Local</div>
                  <div className="bg-white p-1 rounded border">
                    {JSON.stringify(localValue, null, 2)}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="font-medium text-green-600">Remote</div>
                  <div className="bg-white p-1 rounded border">
                    {JSON.stringify(remoteValue, null, 2)}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (conflicts.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <Check className="h-8 w-8 text-green-600 mx-auto mb-2" />
          <p className="text-gray-600">No sync conflicts to resolve</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-orange-600" />
              Sync Conflicts
            </CardTitle>
            <CardDescription>
              {conflicts.length} conflict{conflicts.length !== 1 ? 's' : ''} need{conflicts.length === 1 ? 's' : ''} resolution
            </CardDescription>
          </div>
          <div className="flex space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onResolveAll('local')}
            >
              Keep All Local
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onResolveAll('remote')}
            >
              Keep All Remote
            </Button>
            <Button
              size="sm"
              onClick={() => onResolveAll('merge')}
            >
              <GitMerge className="h-4 w-4 mr-1" />
              Merge All
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {/* Conflict List */}
          <div className="space-y-2">
            {conflicts.map((conflict) => (
              <div
                key={conflict.id}
                className={cn(
                  'p-3 border rounded-lg cursor-pointer transition-colors',
                  selectedConflict === conflict.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                )}
                onClick={() => setSelectedConflict(
                  selectedConflict === conflict.id ? null : conflict.id
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Badge className={getConflictTypeColor(conflict.conflictType)}>
                      {conflict.conflictType}
                    </Badge>
                    <span className="font-medium">Data ID: {conflict.id}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      {getDeviceIcon(conflict.localData.deviceId)}
                      <span>Local</span>
                    </div>
                    <ArrowRight className="h-3 w-3" />
                    <div className="flex items-center space-x-1">
                      {getDeviceIcon(conflict.remoteData.deviceId)}
                      <span>Remote</span>
                    </div>
                  </div>
                </div>

                {selectedConflict === conflict.id && (
                  <div className="mt-4 space-y-4">
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        This conflict occurred because the same data was modified on different devices.
                        Choose how to resolve it below.
                      </AlertDescription>
                    </Alert>

                    <Tabs defaultValue="comparison">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="comparison">Comparison</TabsTrigger>
                        <TabsTrigger value="details">Details</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="comparison" className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          {/* Local Data */}
                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm flex items-center text-blue-600">
                                {getDeviceIcon(conflict.localData.deviceId)}
                                <span className="ml-2">Local Version</span>
                              </CardTitle>
                              <CardDescription className="text-xs">
                                Modified: {formatTimestamp(conflict.localData.timestamp)}
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="pt-2">
                              <ScrollArea className="h-32">
                                <pre className="text-xs bg-gray-50 p-2 rounded">
                                  {JSON.stringify(conflict.localData.data, null, 2)}
                                </pre>
                              </ScrollArea>
                            </CardContent>
                          </Card>

                          {/* Remote Data */}
                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm flex items-center text-green-600">
                                {getDeviceIcon(conflict.remoteData.deviceId)}
                                <span className="ml-2">Remote Version</span>
                              </CardTitle>
                              <CardDescription className="text-xs">
                                Modified: {formatTimestamp(conflict.remoteData.timestamp)}
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="pt-2">
                              <ScrollArea className="h-32">
                                <pre className="text-xs bg-gray-50 p-2 rounded">
                                  {JSON.stringify(conflict.remoteData.data, null, 2)}
                                </pre>
                              </ScrollArea>
                            </CardContent>
                          </Card>
                        </div>

                        {/* Detailed Diff */}
                        <div>
                          <h4 className="font-medium mb-2">Field-by-field Comparison</h4>
                          <ScrollArea className="h-48">
                            {renderDataDiff(conflict.localData.data, conflict.remoteData.data)}
                          </ScrollArea>
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="details" className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <h4 className="font-medium mb-2">Local Data Info</h4>
                            <div className="space-y-1">
                              <div>Device: {conflict.localData.deviceId}</div>
                              <div>Version: {conflict.localData.version}</div>
                              <div>Timestamp: {formatTimestamp(conflict.localData.timestamp)}</div>
                            </div>
                          </div>
                          <div>
                            <h4 className="font-medium mb-2">Remote Data Info</h4>
                            <div className="space-y-1">
                              <div>Device: {conflict.remoteData.deviceId}</div>
                              <div>Version: {conflict.remoteData.version}</div>
                              <div>Timestamp: {formatTimestamp(conflict.remoteData.timestamp)}</div>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-medium mb-2">Conflict Analysis</h4>
                          <div className="text-sm text-gray-600">
                            {conflict.conflictType === 'version' && (
                              <p>Version conflict: The data has different version numbers, indicating concurrent modifications.</p>
                            )}
                            {conflict.conflictType === 'timestamp' && (
                              <p>Timestamp conflict: The local version is newer than the remote version, but versions don't match.</p>
                            )}
                            {conflict.conflictType === 'concurrent' && (
                              <p>Concurrent modification: Both versions were modified at nearly the same time on different devices.</p>
                            )}
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>

                    {/* Resolution Actions */}
                    <div className="flex justify-end space-x-2 pt-4 border-t">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onResolveConflict(conflict.id, 'local')}
                        className="text-blue-600 border-blue-600 hover:bg-blue-50"
                      >
                        <ArrowLeft className="h-4 w-4 mr-1" />
                        Keep Local
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onResolveConflict(conflict.id, 'remote')}
                        className="text-green-600 border-green-600 hover:bg-green-50"
                      >
                        Keep Remote
                        <ArrowRight className="h-4 w-4 ml-1" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => onResolveConflict(conflict.id, 'merge')}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        <GitMerge className="h-4 w-4 mr-1" />
                        Merge
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Conflict resolution strategies component
export function ConflictResolutionStrategies({
  onStrategySelect
}: {
  onStrategySelect: (strategy: 'local' | 'remote' | 'manual' | 'merge') => void;
}) {
  const strategies = [
    {
      id: 'local' as const,
      name: 'Always Keep Local',
      description: 'Always prefer the local version when conflicts occur',
      icon: <Smartphone className="h-5 w-5" />,
      pros: ['Fast resolution', 'Preserves local changes'],
      cons: ['May lose remote updates', 'Can cause data inconsistency'],
    },
    {
      id: 'remote' as const,
      name: 'Always Keep Remote',
      description: 'Always prefer the remote version when conflicts occur',
      icon: <Monitor className="h-5 w-5" />,
      pros: ['Ensures consistency', 'Gets latest updates'],
      cons: ['May lose local changes', 'Can overwrite unsaved work'],
    },
    {
      id: 'merge' as const,
      name: 'Auto Merge',
      description: 'Automatically merge changes when possible',
      icon: <GitMerge className="h-5 w-5" />,
      pros: ['Preserves all changes', 'Intelligent merging'],
      cons: ['May create unexpected results', 'Complex conflicts need manual resolution'],
    },
    {
      id: 'manual' as const,
      name: 'Manual Resolution',
      description: 'Always ask user to resolve conflicts manually',
      icon: <AlertTriangle className="h-5 w-5" />,
      pros: ['Full control', 'Best accuracy'],
      cons: ['Requires user intervention', 'Can be time-consuming'],
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Conflict Resolution Strategy</CardTitle>
        <CardDescription>
          Choose how conflicts should be resolved automatically
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {strategies.map((strategy) => (
            <Card
              key={strategy.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => onStrategySelect(strategy.id)}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center">
                  {strategy.icon}
                  <span className="ml-2">{strategy.name}</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  {strategy.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="space-y-2 text-xs">
                  <div>
                    <div className="font-medium text-green-600 mb-1">Pros:</div>
                    <ul className="list-disc list-inside space-y-0.5 text-gray-600">
                      {strategy.pros.map((pro, index) => (
                        <li key={index}>{pro}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <div className="font-medium text-red-600 mb-1">Cons:</div>
                    <ul className="list-disc list-inside space-y-0.5 text-gray-600">
                      {strategy.cons.map((con, index) => (
                        <li key={index}>{con}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}