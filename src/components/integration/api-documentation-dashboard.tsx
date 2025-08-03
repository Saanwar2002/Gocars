'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Book, 
  Code, 
  Play, 
  Download, 
  Copy,
  Search,
  Filter,
  Settings,
  Globe,
  Key,
  Shield,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  Zap,
  Database
} from 'lucide-react';
import { 
  apiDocumentationService, 
  APIEndpoint, 
  APITestResult,
  SDKConfig
} from '@/services/apiDocumentationService';
import { useToast } from '@/hooks/use-toast';

interface APIDocumentationDashboardProps {
  userId: string;
  userRole: 'admin' | 'developer' | 'analyst';
}

export function APIDocumentationDashboard({ userId, userRole }: APIDocumentationDashboardProps) {
  const [endpoints, setEndpoints] = useState<APIEndpoint[]>([]);
  const [selectedEndpoint, setSelectedEndpoint] = useState<APIEndpoint | null>(null);
  const [testResults, setTestResults] = useState<APITestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('endpoints');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const { toast } = useToast();

  // Test form state
  const [testParams, setTestParams] = useState<{ [key: string]: any }>({});
  const [testBody, setTestBody] = useState('');
  const [testing, setTesting] = useState(false);

  // SDK generation state
  const [sdkConfig, setSdkConfig] = useState<SDKConfig>({
    language: 'typescript',
    packageName: 'gocars-sdk',
    version: '1.0.0',
    author: 'GoCars Team',
    description: 'Official GoCars API SDK',
    license: 'MIT',
    includeExamples: true,
    includeTests: false,
    outputFormat: 'npm'
  });

  useEffect(() => {
    loadAPIData();
  }, []);

  const loadAPIData = async () => {
    try {
      setLoading(true);
      
      const [endpointsData, defaultEndpoints] = await Promise.all([
        apiDocumentationService.getEndpoints(),
        apiDocumentationService.getDefaultEndpoints()
      ]);

      // If no endpoints exist, create default ones
      if (endpointsData.length === 0 && defaultEndpoints.length > 0) {
        for (const endpoint of defaultEndpoints) {
          await apiDocumentationService.createEndpoint({
            ...endpoint,
            createdBy: userId
          } as any);
        }
        
        // Reload endpoints
        const newEndpoints = await apiDocumentationService.getEndpoints();
        setEndpoints(newEndpoints);
      } else {
        setEndpoints(endpointsData);
      }

    } catch (error) {
      console.error('Error loading API data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load API documentation.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTestEndpoint = async () => {
    if (!selectedEndpoint) return;

    try {
      setTesting(true);
      
      const requestBody = testBody ? JSON.parse(testBody) : undefined;
      const result = await apiDocumentationService.testEndpoint(
        selectedEndpoint.id,
        testParams,
        requestBody,
        userId
      );

      setTestResults(prev => [result, ...prev.slice(0, 9)]); // Keep last 10 results
      
      toast({
        title: result.success ? 'Test Successful' : 'Test Failed',
        description: `${selectedEndpoint.method} ${selectedEndpoint.path} - ${result.response.status}`,
        variant: result.success ? 'default' : 'destructive'
      });

    } catch (error) {
      toast({
        title: 'Test Error',
        description: 'Failed to execute API test.',
        variant: 'destructive'
      });
    } finally {
      setTesting(false);
    }
  };

  const handleGenerateSDK = async () => {
    try {
      const sdkContent = await apiDocumentationService.generateSDK(sdkConfig);
      
      // Create and download file
      const blob = new Blob([sdkContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${sdkConfig.packageName}-${sdkConfig.language}.${getFileExtension(sdkConfig.language)}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: 'SDK Generated',
        description: `${sdkConfig.language} SDK has been generated and downloaded.`,
      });

    } catch (error) {
      toast({
        title: 'Generation Failed',
        description: 'Failed to generate SDK.',
        variant: 'destructive'
      });
    }
  };

  const handleExportOpenAPI = async () => {
    try {
      const spec = await apiDocumentationService.generateOpenAPISpec();
      
      const blob = new Blob([JSON.stringify(spec, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'gocars-api-spec.json';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: 'OpenAPI Spec Exported',
        description: 'OpenAPI specification has been downloaded.',
      });

    } catch (error) {
      toast({
        title: 'Export Failed',
        description: 'Failed to export OpenAPI specification.',
        variant: 'destructive'
      });
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: 'Copied',
        description: 'Content copied to clipboard.',
      });
    } catch (error) {
      toast({
        title: 'Copy Failed',
        description: 'Failed to copy to clipboard.',
        variant: 'destructive'
      });
    }
  };

  const getFileExtension = (language: string): string => {
    switch (language) {
      case 'typescript': return 'ts';
      case 'javascript': return 'js';
      case 'python': return 'py';
      case 'java': return 'java';
      case 'csharp': return 'cs';
      case 'php': return 'php';
      case 'go': return 'go';
      case 'ruby': return 'rb';
      default: return 'txt';
    }
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'bg-green-100 text-green-800';
      case 'POST': return 'bg-blue-100 text-blue-800';
      case 'PUT': return 'bg-yellow-100 text-yellow-800';
      case 'DELETE': return 'bg-red-100 text-red-800';
      case 'PATCH': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'text-green-600';
    if (status >= 300 && status < 400) return 'text-yellow-600';
    if (status >= 400 && status < 500) return 'text-orange-600';
    if (status >= 500) return 'text-red-600';
    return 'text-gray-600';
  };

  const filteredEndpoints = endpoints.filter(endpoint => {
    const matchesSearch = !searchQuery || 
      endpoint.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
      endpoint.summary.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTag = !selectedTag || endpoint.tags.includes(selectedTag);
    
    return matchesSearch && matchesTag;
  });

  const allTags = Array.from(new Set(endpoints.flatMap(e => e.tags)));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">API Documentation</h1>
          <p className="text-gray-600">Interactive API documentation and testing platform</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleExportOpenAPI}>
            <Download className="h-4 w-4 mr-2" />
            Export OpenAPI
          </Button>
          <Button>
            <Code className="h-4 w-4 mr-2" />
            Generate SDK
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Globe className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Endpoints</p>
                <p className="text-2xl font-bold">{endpoints.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Authenticated</p>
                <p className="text-2xl font-bold">
                  {endpoints.filter(e => e.security.length > 0).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Zap className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Rate Limited</p>
                <p className="text-2xl font-bold">
                  {endpoints.filter(e => e.rateLimit).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Database className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Tags</p>
                <p className="text-2xl font-bold">{allTags.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
          <TabsTrigger value="testing">API Testing</TabsTrigger>
          <TabsTrigger value="sdk">SDK Generation</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Endpoints Tab */}
        <TabsContent value="endpoints" className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search endpoints..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedTag} onValueChange={setSelectedTag}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by tag" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Tags</SelectItem>
                {allTags.map(tag => (
                  <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Endpoints List */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>API Endpoints</CardTitle>
                <CardDescription>Browse and explore available API endpoints</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-3">
                    {filteredEndpoints.map((endpoint) => (
                      <div 
                        key={endpoint.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedEndpoint?.id === endpoint.id ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                        }`}
                        onClick={() => setSelectedEndpoint(endpoint)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <Badge className={getMethodColor(endpoint.method)}>
                              {endpoint.method}
                            </Badge>
                            <code className="text-sm font-mono">{endpoint.path}</code>
                          </div>
                          <div className="flex items-center space-x-2">
                            {endpoint.deprecated && (
                              <Badge variant="outline" className="text-orange-600">
                                Deprecated
                              </Badge>
                            )}
                            {endpoint.rateLimit && (
                              <Clock className="h-4 w-4 text-gray-400" />
                            )}
                            {endpoint.security.length > 0 && (
                              <Shield className="h-4 w-4 text-green-600" />
                            )}
                          </div>
                        </div>
                        
                        <h4 className="font-medium mb-1">{endpoint.summary}</h4>
                        <p className="text-sm text-gray-600 mb-2">{endpoint.description}</p>
                        
                        <div className="flex items-center space-x-2">
                          {endpoint.tags.map(tag => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                    
                    {filteredEndpoints.length === 0 && (
                      <div className="text-center text-gray-500 py-8">
                        <Book className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                        <p>No endpoints found matching your criteria</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Endpoint Details */}
            <Card>
              <CardHeader>
                <CardTitle>Endpoint Details</CardTitle>
                <CardDescription>
                  {selectedEndpoint ? 'View endpoint specification' : 'Select an endpoint to view details'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedEndpoint ? (
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge className={getMethodColor(selectedEndpoint.method)}>
                          {selectedEndpoint.method}
                        </Badge>
                        <code className="text-sm font-mono">{selectedEndpoint.path}</code>
                      </div>
                      <h4 className="font-medium">{selectedEndpoint.summary}</h4>
                      <p className="text-sm text-gray-600">{selectedEndpoint.description}</p>
                    </div>

                    {selectedEndpoint.parameters.length > 0 && (
                      <div>
                        <h5 className="font-medium mb-2">Parameters</h5>
                        <div className="space-y-2">
                          {selectedEndpoint.parameters.map((param, index) => (
                            <div key={index} className="text-sm">
                              <div className="flex items-center space-x-2">
                                <code className="font-mono">{param.name}</code>
                                <Badge variant="outline" className="text-xs">
                                  {param.in}
                                </Badge>
                                {param.required && (
                                  <Badge variant="outline" className="text-xs text-red-600">
                                    Required
                                  </Badge>
                                )}
                              </div>
                              <p className="text-gray-600 ml-2">{param.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedEndpoint.responses.length > 0 && (
                      <div>
                        <h5 className="font-medium mb-2">Responses</h5>
                        <div className="space-y-2">
                          {selectedEndpoint.responses.map((response, index) => (
                            <div key={index} className="text-sm">
                              <div className="flex items-center space-x-2">
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs ${getStatusColor(parseInt(response.statusCode))}`}
                                >
                                  {response.statusCode}
                                </Badge>
                                <span>{response.description}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedEndpoint.rateLimit && (
                      <div>
                        <h5 className="font-medium mb-2">Rate Limit</h5>
                        <p className="text-sm text-gray-600">
                          {selectedEndpoint.rateLimit.requests} requests per {selectedEndpoint.rateLimit.window}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center space-x-2">
                      <Button 
                        size="sm" 
                        onClick={() => setActiveTab('testing')}
                        disabled={!selectedEndpoint}
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Test
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => copyToClipboard(selectedEndpoint.path)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>Select an endpoint to view its details</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* API Testing Tab */}
        <TabsContent value="testing" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Test Configuration */}
            <Card>
              <CardHeader>
                <CardTitle>API Testing</CardTitle>
                <CardDescription>Test API endpoints with custom parameters</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedEndpoint ? (
                  <>
                    <div>
                      <div className="flex items-center space-x-2 mb-4">
                        <Badge className={getMethodColor(selectedEndpoint.method)}>
                          {selectedEndpoint.method}
                        </Badge>
                        <code className="text-sm font-mono">{selectedEndpoint.path}</code>
                      </div>
                    </div>

                    {selectedEndpoint.parameters.length > 0 && (
                      <div>
                        <h5 className="font-medium mb-2">Parameters</h5>
                        <div className="space-y-3">
                          {selectedEndpoint.parameters.map((param, index) => (
                            <div key={index}>
                              <label className="text-sm font-medium">
                                {param.name}
                                {param.required && <span className="text-red-500 ml-1">*</span>}
                              </label>
                              <Input
                                placeholder={param.description}
                                value={testParams[param.name] || ''}
                                onChange={(e) => setTestParams({
                                  ...testParams,
                                  [param.name]: e.target.value
                                })}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedEndpoint.requestBody && (
                      <div>
                        <label className="text-sm font-medium">Request Body</label>
                        <Textarea
                          placeholder="Enter JSON request body"
                          value={testBody}
                          onChange={(e) => setTestBody(e.target.value)}
                          rows={6}
                          className="font-mono text-sm"
                        />
                      </div>
                    )}

                    <Button 
                      onClick={handleTestEndpoint}
                      disabled={testing}
                      className="w-full"
                    >
                      {testing ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Testing...
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Send Request
                        </>
                      )}
                    </Button>
                  </>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <Play className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>Select an endpoint from the Endpoints tab to test it</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Test Results */}
            <Card>
              <CardHeader>
                <CardTitle>Test Results</CardTitle>
                <CardDescription>View API test responses and history</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-3">
                    {testResults.map((result) => (
                      <div key={result.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <Badge className={getMethodColor(result.method)}>
                              {result.method}
                            </Badge>
                            <code className="text-sm font-mono">{result.path}</code>
                          </div>
                          <div className="flex items-center space-x-2">
                            {result.success ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-600" />
                            )}
                            <Badge 
                              variant="outline" 
                              className={getStatusColor(result.response.status)}
                            >
                              {result.response.status}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="text-sm text-gray-600 mb-2">
                          Response time: {result.response.time}ms
                        </div>
                        
                        <div className="bg-gray-50 p-3 rounded text-sm">
                          <pre className="whitespace-pre-wrap">
                            {JSON.stringify(result.response.body, null, 2)}
                          </pre>
                        </div>
                      </div>
                    ))}
                    
                    {testResults.length === 0 && (
                      <div className="text-center text-gray-500 py-8">
                        <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                        <p>No test results yet. Run a test to see results here.</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* SDK Generation Tab */}
        <TabsContent value="sdk" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>SDK Configuration</CardTitle>
                <CardDescription>Configure SDK generation settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Language</label>
                    <Select 
                      value={sdkConfig.language} 
                      onValueChange={(value: any) => setSdkConfig({...sdkConfig, language: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="typescript">TypeScript</SelectItem>
                        <SelectItem value="javascript">JavaScript</SelectItem>
                        <SelectItem value="python">Python</SelectItem>
                        <SelectItem value="java">Java</SelectItem>
                        <SelectItem value="csharp">C#</SelectItem>
                        <SelectItem value="php">PHP</SelectItem>
                        <SelectItem value="go">Go</SelectItem>
                        <SelectItem value="ruby">Ruby</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Package Name</label>
                    <Input
                      value={sdkConfig.packageName}
                      onChange={(e) => setSdkConfig({...sdkConfig, packageName: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Version</label>
                    <Input
                      value={sdkConfig.version}
                      onChange={(e) => setSdkConfig({...sdkConfig, version: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Author</label>
                    <Input
                      value={sdkConfig.author}
                      onChange={(e) => setSdkConfig({...sdkConfig, author: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    value={sdkConfig.description}
                    onChange={(e) => setSdkConfig({...sdkConfig, description: e.target.value})}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="includeExamples"
                      checked={sdkConfig.includeExamples}
                      onChange={(e) => setSdkConfig({...sdkConfig, includeExamples: e.target.checked})}
                    />
                    <label htmlFor="includeExamples" className="text-sm">Include Examples</label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="includeTests"
                      checked={sdkConfig.includeTests}
                      onChange={(e) => setSdkConfig({...sdkConfig, includeTests: e.target.checked})}
                    />
                    <label htmlFor="includeTests" className="text-sm">Include Tests</label>
                  </div>
                </div>

                <Button onClick={handleGenerateSDK} className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Generate SDK
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>SDK Preview</CardTitle>
                <CardDescription>Preview of generated SDK structure</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="font-mono text-sm space-y-1">
                    <div className="text-blue-600">📦 {sdkConfig.packageName}/</div>
                    <div className="ml-4 text-gray-600">├── src/</div>
                    <div className="ml-8 text-gray-600">├── client.{getFileExtension(sdkConfig.language)}</div>
                    <div className="ml-8 text-gray-600">├── types.{getFileExtension(sdkConfig.language)}</div>
                    <div className="ml-8 text-gray-600">└── utils.{getFileExtension(sdkConfig.language)}</div>
                    {sdkConfig.includeExamples && (
                      <div className="ml-4 text-gray-600">├── examples/</div>
                    )}
                    {sdkConfig.includeTests && (
                      <div className="ml-4 text-gray-600">├── tests/</div>
                    )}
                    <div className="ml-4 text-gray-600">├── README.md</div>
                    <div className="ml-4 text-gray-600">└── package.json</div>
                  </div>
                </div>

                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Language:</span>
                    <span className="font-medium capitalize">{sdkConfig.language}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Version:</span>
                    <span className="font-medium">{sdkConfig.version}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Endpoints:</span>
                    <span className="font-medium">{endpoints.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Examples:</span>
                    <span className="font-medium">{sdkConfig.includeExamples ? 'Yes' : 'No'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Play className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">API Tests Run</p>
                    <p className="text-2xl font-bold">{testResults.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Success Rate</p>
                    <p className="text-2xl font-bold">
                      {testResults.length > 0 
                        ? Math.round((testResults.filter(r => r.success).length / testResults.length) * 100)
                        : 0
                      }%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Clock className="h-8 w-8 text-purple-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avg Response Time</p>
                    <p className="text-2xl font-bold">
                      {testResults.length > 0 
                        ? Math.round(testResults.reduce((sum, r) => sum + r.response.time, 0) / testResults.length)
                        : 0
                      }ms
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Test Activity</CardTitle>
              <CardDescription>Latest API test results and performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              {testResults.length > 0 ? (
                <div className="space-y-2">
                  {testResults.slice(0, 5).map((result) => (
                    <div key={result.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div className="flex items-center space-x-3">
                        <Badge className={getMethodColor(result.method)}>
                          {result.method}
                        </Badge>
                        <code className="text-sm">{result.path}</code>
                        {result.success ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <span>{result.response.time}ms</span>
                        <Badge variant="outline" className={getStatusColor(result.response.status)}>
                          {result.response.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>No test data available yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}