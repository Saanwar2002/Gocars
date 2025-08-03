'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Download, 
  FileText, 
  FileSpreadsheet, 
  FilePdf, 
  FileJson,
  FileImage,
  Settings,
  Palette,
  Layout,
  CheckCircle,
  AlertCircle,
  Clock,
  Share2,
  Mail,
  Link,
  Copy
} from 'lucide-react';
import { reportingService } from '@/services/reportingService';
import { useToast } from '@/hooks/use-toast';

interface ExportConfig {
  format: 'pdf' | 'excel' | 'csv' | 'json' | 'html' | 'png';
  includeCharts: boolean;
  includeRawData: boolean;
  includeMetadata: boolean;
  pageSize: 'A4' | 'A3' | 'Letter' | 'Legal';
  orientation: 'portrait' | 'landscape';
  compression: 'none' | 'low' | 'medium' | 'high';
  password?: string;
  watermark?: string;
  customFileName?: string;
}

interface ExportJob {
  id: string;
  format: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  fileName: string;
  fileSize?: number;
  downloadUrl?: string;
  error?: string;
  createdAt: Date;
}

interface ReportExporterProps {
  reportData: any;
  reportTitle: string;
  onExportComplete?: (job: ExportJob) => void;
}

export function ReportExporter({ reportData, reportTitle, onExportComplete }: ReportExporterProps) {
  const [exportConfig, setExportConfig] = useState<ExportConfig>({
    format: 'pdf',
    includeCharts: true,
    includeRawData: true,
    includeMetadata: true,
    pageSize: 'A4',
    orientation: 'portrait',
    compression: 'medium',
    customFileName: reportTitle.replace(/\s+/g, '_').toLowerCase()
  });

  const [exportJobs, setExportJobs] = useState<ExportJob[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [activeTab, setActiveTab] = useState('format');
  const { toast } = useToast();

  const formatOptions = [
    { 
      value: 'pdf', 
      label: 'PDF Document', 
      icon: FilePdf, 
      description: 'Portable document format, ideal for sharing and printing',
      color: 'text-red-600'
    },
    { 
      value: 'excel', 
      label: 'Excel Spreadsheet', 
      icon: FileSpreadsheet, 
      description: 'Microsoft Excel format with multiple sheets and formulas',
      color: 'text-green-600'
    },
    { 
      value: 'csv', 
      label: 'CSV Data', 
      icon: FileSpreadsheet, 
      description: 'Comma-separated values, compatible with all spreadsheet apps',
      color: 'text-blue-600'
    },
    { 
      value: 'json', 
      label: 'JSON Data', 
      icon: FileJson, 
      description: 'JavaScript Object Notation, perfect for API integration',
      color: 'text-purple-600'
    },
    { 
      value: 'html', 
      label: 'HTML Report', 
      icon: FileText, 
      description: 'Web-friendly format with interactive elements',
      color: 'text-orange-600'
    },
    { 
      value: 'png', 
      label: 'PNG Image', 
      icon: FileImage, 
      description: 'High-quality image format for presentations',
      color: 'text-gray-600'
    }
  ];

  const handleExport = async () => {
    if (isExporting) return;

    setIsExporting(true);
    
    const jobId = `export_${Date.now()}`;
    const newJob: ExportJob = {
      id: jobId,
      format: exportConfig.format,
      status: 'pending',
      progress: 0,
      fileName: `${exportConfig.customFileName || 'report'}.${exportConfig.format}`,
      createdAt: new Date()
    };

    setExportJobs(prev => [newJob, ...prev]);

    try {
      // Simulate export process with progress updates
      const updateProgress = (progress: number, status: ExportJob['status'] = 'processing') => {
        setExportJobs(prev => prev.map(job => 
          job.id === jobId ? { ...job, progress, status } : job
        ));
      };

      updateProgress(10, 'processing');
      await new Promise(resolve => setTimeout(resolve, 500));

      updateProgress(30);
      await new Promise(resolve => setTimeout(resolve, 800));

      updateProgress(60);
      await new Promise(resolve => setTimeout(resolve, 1000));

      updateProgress(85);
      await new Promise(resolve => setTimeout(resolve, 700));

      // Simulate actual export (in real implementation, this would call the reporting service)
      const blob = await reportingService.exportData(
        'reports',
        [],
        exportConfig.format as any,
        exportConfig.includeRawData ? undefined : ['summary']
      );

      const downloadUrl = URL.createObjectURL(blob);
      const fileSize = blob.size;

      updateProgress(100, 'completed');
      setExportJobs(prev => prev.map(job => 
        job.id === jobId ? { 
          ...job, 
          downloadUrl, 
          fileSize,
          status: 'completed',
          progress: 100
        } : job
      ));

      toast({
        title: 'Export Completed',
        description: `Your ${exportConfig.format.toUpperCase()} report is ready for download.`,
      });

      if (onExportComplete) {
        const completedJob = exportJobs.find(job => job.id === jobId);
        if (completedJob) {
          onExportComplete({ ...completedJob, downloadUrl, fileSize, status: 'completed' });
        }
      }

    } catch (error) {
      setExportJobs(prev => prev.map(job => 
        job.id === jobId ? { 
          ...job, 
          status: 'failed', 
          error: error instanceof Error ? error.message : 'Export failed'
        } : job
      ));

      toast({
        title: 'Export Failed',
        description: 'There was an error exporting your report. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownload = (job: ExportJob) => {
    if (job.downloadUrl) {
      const link = document.createElement('a');
      link.href = job.downloadUrl;
      link.download = job.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: 'Download Started',
        description: `Downloading ${job.fileName}`,
      });
    }
  };

  const copyShareLink = async (job: ExportJob) => {
    if (job.downloadUrl) {
      try {
        await navigator.clipboard.writeText(job.downloadUrl);
        toast({
          title: 'Link Copied',
          description: 'Share link copied to clipboard',
        });
      } catch (error) {
        toast({
          title: 'Copy Failed',
          description: 'Could not copy link to clipboard',
          variant: 'destructive'
        });
      }
    }
  };

  const getStatusIcon = (status: ExportJob['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'processing':
      case 'pending':
        return <Clock className="h-4 w-4 text-blue-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const selectedFormat = formatOptions.find(f => f.value === exportConfig.format);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Export Report</h2>
          <p className="text-gray-600">Export your report in multiple formats</p>
        </div>
        <Button 
          onClick={handleExport} 
          disabled={isExporting}
          className="min-w-32"
        >
          {isExporting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Exporting...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Export Configuration */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Export Configuration</CardTitle>
            <CardDescription>Configure your export settings</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="format">Format</TabsTrigger>
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>

              <TabsContent value="format" className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-3 block">Export Format</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {formatOptions.map((format) => {
                      const Icon = format.icon;
                      return (
                        <div
                          key={format.value}
                          className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                            exportConfig.format === format.value 
                              ? 'border-blue-500 bg-blue-50' 
                              : 'hover:bg-gray-50'
                          }`}
                          onClick={() => setExportConfig({...exportConfig, format: format.value as any})}
                        >
                          <div className="flex items-center space-x-3">
                            <Icon className={`h-6 w-6 ${format.color}`} />
                            <div>
                              <h4 className="font-medium">{format.label}</h4>
                              <p className="text-sm text-gray-600">{format.description}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">File Name</label>
                  <Input
                    placeholder="Enter custom file name"
                    value={exportConfig.customFileName}
                    onChange={(e) => setExportConfig({...exportConfig, customFileName: e.target.value})}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Final file: {exportConfig.customFileName || 'report'}.{exportConfig.format}
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="content" className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeCharts"
                      checked={exportConfig.includeCharts}
                      onCheckedChange={(checked) => 
                        setExportConfig({...exportConfig, includeCharts: !!checked})
                      }
                    />
                    <label htmlFor="includeCharts" className="text-sm">
                      Include charts and visualizations
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeRawData"
                      checked={exportConfig.includeRawData}
                      onCheckedChange={(checked) => 
                        setExportConfig({...exportConfig, includeRawData: !!checked})
                      }
                    />
                    <label htmlFor="includeRawData" className="text-sm">
                      Include raw data tables
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeMetadata"
                      checked={exportConfig.includeMetadata}
                      onCheckedChange={(checked) => 
                        setExportConfig({...exportConfig, includeMetadata: !!checked})
                      }
                    />
                    <label htmlFor="includeMetadata" className="text-sm">
                      Include metadata and timestamps
                    </label>
                  </div>
                </div>

                {(exportConfig.format === 'pdf' || exportConfig.format === 'html') && (
                  <div>
                    <label className="text-sm font-medium">Watermark (Optional)</label>
                    <Input
                      placeholder="Enter watermark text"
                      value={exportConfig.watermark || ''}
                      onChange={(e) => setExportConfig({...exportConfig, watermark: e.target.value})}
                    />
                  </div>
                )}
              </TabsContent>

              <TabsContent value="settings" className="space-y-4">
                {(exportConfig.format === 'pdf' || exportConfig.format === 'html') && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Page Size</label>
                      <Select 
                        value={exportConfig.pageSize} 
                        onValueChange={(value: any) => setExportConfig({...exportConfig, pageSize: value})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="A4">A4</SelectItem>
                          <SelectItem value="A3">A3</SelectItem>
                          <SelectItem value="Letter">Letter</SelectItem>
                          <SelectItem value="Legal">Legal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium">Orientation</label>
                      <Select 
                        value={exportConfig.orientation} 
                        onValueChange={(value: any) => setExportConfig({...exportConfig, orientation: value})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="portrait">Portrait</SelectItem>
                          <SelectItem value="landscape">Landscape</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium">Compression</label>
                  <Select 
                    value={exportConfig.compression} 
                    onValueChange={(value: any) => setExportConfig({...exportConfig, compression: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None (Largest file)</SelectItem>
                      <SelectItem value="low">Low compression</SelectItem>
                      <SelectItem value="medium">Medium compression</SelectItem>
                      <SelectItem value="high">High compression (Smallest file)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {exportConfig.format === 'pdf' && (
                  <div>
                    <label className="text-sm font-medium">Password Protection (Optional)</label>
                    <Input
                      type="password"
                      placeholder="Enter password to protect PDF"
                      value={exportConfig.password || ''}
                      onChange={(e) => setExportConfig({...exportConfig, password: e.target.value})}
                    />
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Export Preview & Jobs */}
        <Card>
          <CardHeader>
            <CardTitle>Export Preview</CardTitle>
            <CardDescription>Preview your export configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedFormat && (
              <div className="p-4 border rounded-lg">
                <div className="flex items-center space-x-3 mb-3">
                  <selectedFormat.icon className={`h-8 w-8 ${selectedFormat.color}`} />
                  <div>
                    <h4 className="font-medium">{selectedFormat.label}</h4>
                    <p className="text-sm text-gray-600">{selectedFormat.description}</p>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">File name:</span>
                    <span className="font-mono">{exportConfig.customFileName || 'report'}.{exportConfig.format}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Include charts:</span>
                    <Badge variant={exportConfig.includeCharts ? "default" : "secondary"}>
                      {exportConfig.includeCharts ? "Yes" : "No"}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Include data:</span>
                    <Badge variant={exportConfig.includeRawData ? "default" : "secondary"}>
                      {exportConfig.includeRawData ? "Yes" : "No"}
                    </Badge>
                  </div>
                  {(exportConfig.format === 'pdf' || exportConfig.format === 'html') && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Page size:</span>
                        <span>{exportConfig.pageSize}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Orientation:</span>
                        <span className="capitalize">{exportConfig.orientation}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Export Jobs */}
            <div>
              <h4 className="font-medium mb-3">Recent Exports</h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {exportJobs.map((job) => (
                  <div key={job.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(job.status)}
                        <span className="text-sm font-medium">{job.fileName}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {job.format.toUpperCase()}
                      </Badge>
                    </div>
                    
                    {job.status === 'processing' && (
                      <Progress value={job.progress} className="mb-2" />
                    )}
                    
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{job.createdAt.toLocaleTimeString()}</span>
                      {job.fileSize && (
                        <span>{formatFileSize(job.fileSize)}</span>
                      )}
                    </div>
                    
                    {job.status === 'completed' && (
                      <div className="flex items-center space-x-2 mt-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleDownload(job)}
                        >
                          <Download className="h-3 w-3 mr-1" />
                          Download
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => copyShareLink(job)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                    
                    {job.status === 'failed' && job.error && (
                      <p className="text-xs text-red-600 mt-1">{job.error}</p>
                    )}
                  </div>
                ))}
                
                {exportJobs.length === 0 && (
                  <div className="text-center text-gray-500 py-4">
                    <FileText className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm">No exports yet</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}