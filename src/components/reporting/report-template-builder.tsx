'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Plus, 
  Minus, 
  Save, 
  Eye, 
  Settings,
  Move,
  Type,
  BarChart3,
  Table,
  Image,
  Divide,
  Target,
  Palette,
  Layout,
  Filter,
  ArrowUp,
  ArrowDown,
  Trash2
} from 'lucide-react';
import { 
  reportingService, 
  ReportTemplate, 
  ReportSection, 
  ReportFilter, 
  ReportParameter 
} from '@/services/reportingService';
import { useToast } from '@/hooks/use-toast';

interface ReportTemplateBuilderProps {
  template?: ReportTemplate;
  onSave?: (template: ReportTemplate) => void;
  onCancel?: () => void;
}

export function ReportTemplateBuilder({ template, onSave, onCancel }: ReportTemplateBuilderProps) {
  const [templateData, setTemplateData] = useState<Partial<ReportTemplate>>({
    name: '',
    description: '',
    category: 'operational',
    type: 'summary',
    sections: [],
    filters: [],
    parameters: [],
    layout: {
      pageSize: 'A4',
      orientation: 'portrait',
      margins: { top: 20, right: 20, bottom: 20, left: 20 },
      columns: 1,
      spacing: 10
    },
    styling: {
      theme: 'default',
      primaryColor: '#2563eb',
      secondaryColor: '#64748b',
      fontFamily: 'Inter',
      fontSize: 12,
      showLogo: true,
      showPageNumbers: true,
      showTimestamp: true
    },
    isPublic: false
  });

  const [activeTab, setActiveTab] = useState<'basic' | 'sections' | 'filters' | 'layout' | 'styling'>('basic');
  const [selectedSection, setSelectedSection] = useState<ReportSection | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (template) {
      setTemplateData(template);
    }
  }, [template]);

  const addSection = (type: ReportSection['type']) => {
    const newSection: ReportSection = {
      id: `section_${Date.now()}`,
      title: `New ${type} Section`,
      type,
      order: (templateData.sections?.length || 0) + 1,
      config: {},
      visible: true
    };

    setTemplateData(prev => ({
      ...prev,
      sections: [...(prev.sections || []), newSection]
    }));
  };

  const updateSection = (sectionId: string, updates: Partial<ReportSection>) => {
    setTemplateData(prev => ({
      ...prev,
      sections: prev.sections?.map(section => 
        section.id === sectionId ? { ...section, ...updates } : section
      ) || []
    }));
  };

  const removeSection = (sectionId: string) => {
    setTemplateData(prev => ({
      ...prev,
      sections: prev.sections?.filter(section => section.id !== sectionId) || []
    }));
  };

  const moveSectionUp = (sectionId: string) => {
    const sections = templateData.sections || [];
    const index = sections.findIndex(s => s.id === sectionId);
    if (index > 0) {
      const newSections = [...sections];
      [newSections[index - 1], newSections[index]] = [newSections[index], newSections[index - 1]];
      newSections.forEach((section, i) => section.order = i + 1);
      setTemplateData(prev => ({ ...prev, sections: newSections }));
    }
  };

  const moveSectionDown = (sectionId: string) => {
    const sections = templateData.sections || [];
    const index = sections.findIndex(s => s.id === sectionId);
    if (index < sections.length - 1) {
      const newSections = [...sections];
      [newSections[index], newSections[index + 1]] = [newSections[index + 1], newSections[index]];
      newSections.forEach((section, i) => section.order = i + 1);
      setTemplateData(prev => ({ ...prev, sections: newSections }));
    }
  };

  const getSectionIcon = (type: ReportSection['type']) => {
    switch (type) {
      case 'text': return <Type className="h-4 w-4" />;
      case 'table': return <Table className="h-4 w-4" />;
      case 'chart': return <BarChart3 className="h-4 w-4" />;
      case 'metric': return <Target className="h-4 w-4" />;
      case 'image': return <Image className="h-4 w-4" />;
      case 'divider': return <Divide className="h-4 w-4" />;
      default: return <Type className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {template ? 'Edit Template' : 'Create Report Template'}
          </h2>
          <p className="text-gray-600">Design and configure your custom report template</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button>
            <Save className="h-4 w-4 mr-2" />
            Save Template
          </Button>
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Navigation */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Template Builder</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-1">
              {[
                { id: 'basic', label: 'Basic Info', icon: Settings },
                { id: 'sections', label: 'Sections', icon: Layout },
                { id: 'filters', label: 'Filters', icon: Filter },
                { id: 'layout', label: 'Layout', icon: Layout },
                { id: 'styling', label: 'Styling', icon: Palette }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 transition-colors ${
                      activeTab === tab.id ? 'bg-blue-50 border-r-2 border-blue-600' : ''
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-sm font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Basic Info */}
          {activeTab === 'basic' && (
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Configure the basic template settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Template Name</label>
                  <Input
                    placeholder="Enter template name"
                    value={templateData.name}
                    onChange={(e) => setTemplateData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    placeholder="Describe what this template generates"
                    value={templateData.description}
                    onChange={(e) => setTemplateData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Category</label>
                    <Select 
                      value={templateData.category} 
                      onValueChange={(value: any) => setTemplateData(prev => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="operational">Operational</SelectItem>
                        <SelectItem value="financial">Financial</SelectItem>
                        <SelectItem value="customer">Customer</SelectItem>
                        <SelectItem value="driver">Driver</SelectItem>
                        <SelectItem value="performance">Performance</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Type</label>
                    <Select 
                      value={templateData.type} 
                      onValueChange={(value: any) => setTemplateData(prev => ({ ...prev, type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dashboard">Dashboard</SelectItem>
                        <SelectItem value="table">Table</SelectItem>
                        <SelectItem value="chart">Chart</SelectItem>
                        <SelectItem value="summary">Summary</SelectItem>
                        <SelectItem value="detailed">Detailed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isPublic"
                    checked={templateData.isPublic}
                    onCheckedChange={(checked) => 
                      setTemplateData(prev => ({ ...prev, isPublic: !!checked }))
                    }
                  />
                  <label htmlFor="isPublic" className="text-sm">
                    Make this template public (visible to all users)
                  </label>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Sections */}
          {activeTab === 'sections' && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Report Sections</CardTitle>
                      <CardDescription>Add and configure sections for your report</CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      {[
                        { type: 'text', label: 'Text' },
                        { type: 'table', label: 'Table' },
                        { type: 'chart', label: 'Chart' },
                        { type: 'metric', label: 'Metric' }
                      ].map((sectionType) => (
                        <Button
                          key={sectionType.type}
                          variant="outline"
                          size="sm"
                          onClick={() => addSection(sectionType.type as any)}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          {sectionType.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-96">
                    <div className="space-y-3">
                      {templateData.sections?.map((section) => (
                        <div 
                          key={section.id}
                          className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                            selectedSection?.id === section.id ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                          }`}
                          onClick={() => setSelectedSection(section)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              {getSectionIcon(section.type)}
                              <div>
                                <h4 className="font-medium">{section.title}</h4>
                                <p className="text-sm text-gray-600">
                                  {section.type} • Order: {section.order}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  moveSectionUp(section.id);
                                }}
                              >
                                <ArrowUp className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  moveSectionDown(section.id);
                                }}
                              >
                                <ArrowDown className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeSection(section.id);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {(!templateData.sections || templateData.sections.length === 0) && (
                        <div className="text-center text-gray-500 py-8">
                          <Layout className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                          <p>No sections added yet. Click the buttons above to add sections.</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Section Configuration */}
              {selectedSection && (
                <Card>
                  <CardHeader>
                    <CardTitle>Section Configuration</CardTitle>
                    <CardDescription>Configure the selected section</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Section Title</label>
                      <Input
                        value={selectedSection.title}
                        onChange={(e) => updateSection(selectedSection.id, { title: e.target.value })}
                      />
                    </div>
                    
                    {selectedSection.type === 'text' && (
                      <div>
                        <label className="text-sm font-medium">Content</label>
                        <Textarea
                          value={selectedSection.content || ''}
                          onChange={(e) => updateSection(selectedSection.id, { content: e.target.value })}
                          rows={4}
                          placeholder="Enter text content..."
                        />
                      </div>
                    )}
                    
                    {(selectedSection.type === 'table' || selectedSection.type === 'chart') && (
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium">Data Source</label>
                          <Select
                            value={selectedSection.config.dataSource || ''}
                            onValueChange={(value) => 
                              updateSection(selectedSection.id, {
                                config: { ...selectedSection.config, dataSource: value }
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select data source" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="rides">Rides</SelectItem>
                              <SelectItem value="drivers">Drivers</SelectItem>
                              <SelectItem value="revenue">Revenue</SelectItem>
                              <SelectItem value="customers">Customers</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        {selectedSection.type === 'chart' && (
                          <div>
                            <label className="text-sm font-medium">Chart Type</label>
                            <Select
                              value={selectedSection.config.chartType || ''}
                              onValueChange={(value) => 
                                updateSection(selectedSection.id, {
                                  config: { ...selectedSection.config, chartType: value }
                                })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select chart type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="line">Line Chart</SelectItem>
                                <SelectItem value="bar">Bar Chart</SelectItem>
                                <SelectItem value="pie">Pie Chart</SelectItem>
                                <SelectItem value="area">Area Chart</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="sectionVisible"
                        checked={selectedSection.visible}
                        onCheckedChange={(checked) => 
                          updateSection(selectedSection.id, { visible: !!checked })
                        }
                      />
                      <label htmlFor="sectionVisible" className="text-sm">
                        Show this section in the report
                      </label>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Other tabs would be implemented similarly... */}
          {activeTab === 'filters' && (
            <Card>
              <CardContent className="p-8 text-center">
                <Filter className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Filter configuration coming soon...</p>
              </CardContent>
            </Card>
          )}

          {activeTab === 'layout' && (
            <Card>
              <CardContent className="p-8 text-center">
                <Layout className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Layout configuration coming soon...</p>
              </CardContent>
            </Card>
          )}

          {activeTab === 'styling' && (
            <Card>
              <CardContent className="p-8 text-center">
                <Palette className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Styling configuration coming soon...</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}