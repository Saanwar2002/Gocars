'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  TreeMap,
  Cell
} from 'recharts';
import { 
  ChevronRight, 
  ChevronDown, 
  ArrowLeft, 
  Filter, 
  Search,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Table,
  Download,
  Maximize2,
  Minimize2,
  RefreshCw,
  Info
} from 'lucide-react';
import { 
  businessIntelligenceService, 
  DrillDownData, 
  ReportFilter 
} from '@/services/businessIntelligenceService';
import { useToast } from '@/hooks/use-toast';

interface DrillDownAnalyticsProps {
  initialDimension?: string;
  initialFilters?: ReportFilter[];
}

interface BreadcrumbItem {
  level: number;
  dimension: string;
  value: string;
  label: string;
}

export function DrillDownAnalytics({ 
  initialDimension = 'region', 
  initialFilters = [] 
}: DrillDownAnalyticsProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DrillDownData[]>([]);
  const [currentLevel, setCurrentLevel] = useState(0);
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);
  const [selectedMetric, setSelectedMetric] = useState('revenue');
  const [viewMode, setViewMode] = useState<'table' | 'chart' | 'treemap'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('value');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filters, setFilters] = useState<ReportFilter[]>(initialFilters);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const availableMetrics = [
    { id: 'revenue', name: 'Revenue', format: 'currency' },
    { id: 'rides', name: 'Rides', format: 'number' },
    { id: 'users', name: 'Users', format: 'number' },
    { id: 'drivers', name: 'Drivers', format: 'number' }
  ];

  const dimensionHierarchy = [
    { id: 'region', name: 'Region', level: 0 },
    { id: 'city', name: 'City', level: 1 },
    { id: 'district', name: 'District', level: 2 },
    { id: 'hour', name: 'Hour', level: 3 }
  ];

  useEffect(() => {
    loadDrillDownData();
  }, [filters, selectedMetric]);

  const loadDrillDownData = async () => {
    try {
      setLoading(true);
      const drillDownData = await businessIntelligenceService.getDrillDownData(
        initialDimension, 
        filters
      );
      setData(drillDownData);
    } catch (error) {
      console.error('Error loading drill-down data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load drill-down data. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDrillDown = async (item: DrillDownData) => {
    if (!item.children || item.children.length === 0) return;

    // Add to breadcrumbs
    const newBreadcrumb: BreadcrumbItem = {
      level: item.level,
      dimension: item.dimension,
      value: item.value,
      label: item.value
    };
    setBreadcrumbs(prev => [...prev, newBreadcrumb]);
    setCurrentLevel(item.level + 1);
    setData(item.children || []);
  };

  const handleBreadcrumbClick = async (index: number) => {
    if (index === -1) {
      // Go back to root
      setBreadcrumbs([]);
      setCurrentLevel(0);
      await loadDrillDownData();
    } else {
      // Go back to specific level
      const newBreadcrumbs = breadcrumbs.slice(0, index + 1);
      setBreadcrumbs(newBreadcrumbs);
      setCurrentLevel(newBreadcrumbs.length);
      
      // Load data for that level
      // In a real implementation, this would fetch the appropriate data
      await loadDrillDownData();
    }
  };

  const toggleExpanded = (itemValue: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemValue)) {
      newExpanded.delete(itemValue);
    } else {
      newExpanded.add(itemValue);
    }
    setExpandedItems(newExpanded);
  };

  const formatValue = (value: number, format: string) => {
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(value);
      case 'number':
        return new Intl.NumberFormat('en-US').format(value);
      case 'percentage':
        return `${value.toFixed(1)}%`;
      default:
        return value.toString();
    }
  };

  const getFilteredAndSortedData = () => {
    let filteredData = data;

    // Apply search filter
    if (searchQuery) {
      filteredData = filteredData.filter(item =>
        item.value.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort data
    filteredData.sort((a, b) => {
      const aValue = a.metrics[selectedMetric] || 0;
      const bValue = b.metrics[selectedMetric] || 0;
      
      if (sortOrder === 'asc') {
        return aValue - bValue;
      } else {
        return bValue - aValue;
      }
    });

    return filteredData;
  };

  const getCurrentDimension = () => {
    return dimensionHierarchy.find(d => d.level === currentLevel);
  };

  const getChartData = () => {
    return getFilteredAndSortedData().map(item => ({
      name: item.value,
      value: item.metrics[selectedMetric] || 0,
      ...item.metrics
    }));
  };

  const getTreeMapData = () => {
    return getFilteredAndSortedData().map(item => ({
      name: item.value,
      size: item.metrics[selectedMetric] || 0,
      fill: `hsl(${Math.random() * 360}, 70%, 50%)`
    }));
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const filteredData = getFilteredAndSortedData();
  const currentDimension = getCurrentDimension();
  const selectedMetricInfo = availableMetrics.find(m => m.id === selectedMetric);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Drill-Down Analytics</h1>
          <p className="text-gray-600">Explore data at different levels of detail</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={loadDrillDownData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between space-x-4">
            <div className="flex items-center space-x-4">
              {/* Breadcrumbs */}
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleBreadcrumbClick(-1)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  All Regions
                </Button>
                {breadcrumbs.map((crumb, index) => (
                  <React.Fragment key={index}>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleBreadcrumbClick(index)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {crumb.label}
                    </Button>
                  </React.Fragment>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-48"
                />
              </div>

              {/* Metric Selection */}
              <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableMetrics.map(metric => (
                    <SelectItem key={metric.id} value={metric.id}>
                      {metric.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* View Mode */}
              <div className="flex items-center border rounded-lg">
                <Button
                  variant={viewMode === 'table' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('table')}
                >
                  <Table className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'chart' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('chart')}
                >
                  <BarChart3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'treemap' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('treemap')}
                >
                  <PieChart className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Level Info */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div>
                <h3 className="font-semibold">
                  {currentDimension?.name || 'Unknown'} Level Analysis
                </h3>
                <p className="text-sm text-gray-600">
                  Showing {filteredData.length} items • Metric: {selectedMetricInfo?.name}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="value">Value</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              >
                {sortOrder === 'asc' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Visualization */}
      <Card>
        <CardContent className="p-6">
          {viewMode === 'table' && (
            <div className="space-y-4">
              <ScrollArea className="h-96">
                <div className="space-y-2">
                  {filteredData.map((item, index) => (
                    <div
                      key={`${item.dimension}-${item.value}`}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        {item.children && item.children.length > 0 ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDrillDown(item)}
                            className="p-1"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        ) : (
                          <div className="w-8" />
                        )}
                        <div>
                          <h4 className="font-medium">{item.value}</h4>
                          <p className="text-sm text-gray-600">
                            {currentDimension?.name}: {item.value}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-6">
                        {availableMetrics.map(metric => (
                          <div key={metric.id} className="text-right">
                            <p className="font-medium">
                              {formatValue(item.metrics[metric.id] || 0, metric.format)}
                            </p>
                            <p className="text-xs text-gray-500">{metric.name}</p>
                          </div>
                        ))}
                        {item.children && item.children.length > 0 && (
                          <Badge variant="secondary">
                            {item.children.length} items
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {viewMode === 'chart' && (
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={getChartData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis 
                    tickFormatter={(value) => formatValue(value, selectedMetricInfo?.format || 'number')}
                  />
                  <Tooltip 
                    formatter={(value: number) => [
                      formatValue(value, selectedMetricInfo?.format || 'number'),
                      selectedMetricInfo?.name
                    ]}
                  />
                  <Bar 
                    dataKey="value" 
                    fill="#8884d8"
                    onClick={(data) => {
                      const item = filteredData.find(d => d.value === data.name);
                      if (item) handleDrillDown(item);
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    {getChartData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {viewMode === 'treemap' && (
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <TreeMap
                  data={getTreeMapData()}
                  dataKey="size"
                  ratio={4/3}
                  stroke="#fff"
                  fill="#8884d8"
                >
                  <Tooltip 
                    formatter={(value: number) => [
                      formatValue(value, selectedMetricInfo?.format || 'number'),
                      selectedMetricInfo?.name
                    ]}
                  />
                </TreeMap>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {availableMetrics.map(metric => {
          const total = filteredData.reduce((sum, item) => sum + (item.metrics[metric.id] || 0), 0);
          const average = filteredData.length > 0 ? total / filteredData.length : 0;
          
          return (
            <Card key={metric.id}>
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-sm text-gray-600">{metric.name}</p>
                  <p className="text-2xl font-bold">
                    {formatValue(total, metric.format)}
                  </p>
                  <p className="text-xs text-gray-500">
                    Avg: {formatValue(average, metric.format)}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}