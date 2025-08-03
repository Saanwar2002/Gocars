'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  AreaChart, 
  Area,
  ScatterChart,
  Scatter,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  Activity,
  Download,
  Settings,
  Palette,
  RefreshCw
} from 'lucide-react';

interface ChartData {
  name: string;
  value: number;
  category?: string;
  date?: string;
  [key: string]: any;
}

interface ChartConfig {
  type: 'line' | 'bar' | 'pie' | 'area' | 'scatter';
  title: string;
  dataSource: string;
  xAxis: string;
  yAxis: string;
  groupBy?: string;
  aggregation: 'sum' | 'avg' | 'count' | 'min' | 'max';
  colors: string[];
  showLegend: boolean;
  showGrid: boolean;
  animate: boolean;
}

interface ReportChartsProps {
  data?: ChartData[];
  config?: Partial<ChartConfig>;
  onConfigChange?: (config: ChartConfig) => void;
  editable?: boolean;
}

const CHART_COLORS = [
  '#2563eb', '#7c3aed', '#059669', '#d97706', '#dc2626',
  '#0891b2', '#be185d', '#4338ca', '#0d9488', '#ea580c'
];

const SAMPLE_DATA = {
  rides: [
    { name: 'Jan', rides: 1200, revenue: 24000, drivers: 45 },
    { name: 'Feb', rides: 1350, revenue: 27000, drivers: 48 },
    { name: 'Mar', rides: 1100, revenue: 22000, drivers: 42 },
    { name: 'Apr', rides: 1450, revenue: 29000, drivers: 52 },
    { name: 'May', rides: 1600, revenue: 32000, drivers: 55 },
    { name: 'Jun', rides: 1750, revenue: 35000, drivers: 58 }
  ],
  performance: [
    { name: 'Completed', value: 85, color: '#059669' },
    { name: 'Cancelled', value: 10, color: '#dc2626' },
    { name: 'No Show', value: 5, color: '#d97706' }
  ],
  hourly: [
    { hour: '00:00', rides: 45 }, { hour: '01:00', rides: 32 },
    { hour: '02:00', rides: 28 }, { hour: '03:00', rides: 25 },
    { hour: '04:00', rides: 30 }, { hour: '05:00', rides: 55 },
    { hour: '06:00', rides: 85 }, { hour: '07:00', rides: 120 },
    { hour: '08:00', rides: 150 }, { hour: '09:00', rides: 135 },
    { hour: '10:00', rides: 110 }, { hour: '11:00', rides: 125 },
    { hour: '12:00', rides: 140 }, { hour: '13:00', rides: 135 },
    { hour: '14:00', rides: 120 }, { hour: '15:00', rides: 110 },
    { hour: '16:00', rides: 125 }, { hour: '17:00', rides: 145 },
    { hour: '18:00', rides: 160 }, { hour: '19:00', rides: 140 },
    { hour: '20:00', rides: 115 }, { hour: '21:00', rides: 95 },
    { hour: '22:00', rides: 75 }, { hour: '23:00', rides: 55 }
  ],
  drivers: [
    { name: 'John Smith', rating: 4.8, rides: 245, earnings: 4900 },
    { name: 'Sarah Johnson', rating: 4.9, rides: 220, earnings: 4400 },
    { name: 'Mike Chen', rating: 4.7, rides: 198, earnings: 3960 },
    { name: 'Lisa Brown', rating: 4.6, rides: 185, earnings: 3700 },
    { name: 'David Wilson', rating: 4.8, rides: 210, earnings: 4200 }
  ]
};

export function ReportCharts({ data, config, onConfigChange, editable = false }: ReportChartsProps) {
  const [chartConfig, setChartConfig] = useState<ChartConfig>({
    type: 'line',
    title: 'Chart Title',
    dataSource: 'rides',
    xAxis: 'name',
    yAxis: 'rides',
    aggregation: 'sum',
    colors: CHART_COLORS,
    showLegend: true,
    showGrid: true,
    animate: true,
    ...config
  });

  const [chartData, setChartData] = useState<ChartData[]>(data || SAMPLE_DATA.rides);
  const [activePreset, setActivePreset] = useState('rides');

  useEffect(() => {
    if (data) {
      setChartData(data);
    } else {
      // Load sample data based on data source
      const sampleData = SAMPLE_DATA[chartConfig.dataSource as keyof typeof SAMPLE_DATA] || SAMPLE_DATA.rides;
      setChartData(sampleData);
    }
  }, [data, chartConfig.dataSource]);

  const handleConfigChange = (updates: Partial<ChartConfig>) => {
    const newConfig = { ...chartConfig, ...updates };
    setChartConfig(newConfig);
    if (onConfigChange) {
      onConfigChange(newConfig);
    }
  };

  const loadPreset = (preset: string) => {
    setActivePreset(preset);
    const presetData = SAMPLE_DATA[preset as keyof typeof SAMPLE_DATA];
    if (presetData) {
      setChartData(presetData);
      handleConfigChange({ dataSource: preset });
    }
  };

  const renderChart = () => {
    const commonProps = {
      data: chartData,
      margin: { top: 20, right: 30, left: 20, bottom: 5 }
    };

    switch (chartConfig.type) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart {...commonProps}>
              {chartConfig.showGrid && <CartesianGrid strokeDasharray="3 3" />}
              <XAxis dataKey={chartConfig.xAxis} />
              <YAxis />
              <Tooltip />
              {chartConfig.showLegend && <Legend />}
              <Line 
                type="monotone" 
                dataKey={chartConfig.yAxis} 
                stroke={chartConfig.colors[0]} 
                strokeWidth={2}
                dot={{ fill: chartConfig.colors[0] }}
                animationDuration={chartConfig.animate ? 1000 : 0}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart {...commonProps}>
              {chartConfig.showGrid && <CartesianGrid strokeDasharray="3 3" />}
              <XAxis dataKey={chartConfig.xAxis} />
              <YAxis />
              <Tooltip />
              {chartConfig.showLegend && <Legend />}
              <Bar 
                dataKey={chartConfig.yAxis} 
                fill={chartConfig.colors[0]}
                animationDuration={chartConfig.animate ? 1000 : 0}
              />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                animationDuration={chartConfig.animate ? 1000 : 0}
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color || chartConfig.colors[index % chartConfig.colors.length]} 
                  />
                ))}
              </Pie>
              <Tooltip />
              {chartConfig.showLegend && <Legend />}
            </PieChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart {...commonProps}>
              {chartConfig.showGrid && <CartesianGrid strokeDasharray="3 3" />}
              <XAxis dataKey={chartConfig.xAxis} />
              <YAxis />
              <Tooltip />
              {chartConfig.showLegend && <Legend />}
              <Area 
                type="monotone" 
                dataKey={chartConfig.yAxis} 
                stroke={chartConfig.colors[0]} 
                fill={chartConfig.colors[0]}
                fillOpacity={0.3}
                animationDuration={chartConfig.animate ? 1000 : 0}
              />
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'scatter':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart {...commonProps}>
              {chartConfig.showGrid && <CartesianGrid strokeDasharray="3 3" />}
              <XAxis dataKey={chartConfig.xAxis} />
              <YAxis dataKey={chartConfig.yAxis} />
              <Tooltip />
              {chartConfig.showLegend && <Legend />}
              <Scatter 
                data={chartData} 
                fill={chartConfig.colors[0]}
                animationDuration={chartConfig.animate ? 1000 : 0}
              />
            </ScatterChart>
          </ResponsiveContainer>
        );

      default:
        return <div className="text-center text-gray-500 py-8">Unsupported chart type</div>;
    }
  };

  const getChartIcon = (type: string) => {
    switch (type) {
      case 'line': return <LineChartIcon className="h-4 w-4" />;
      case 'bar': return <BarChart3 className="h-4 w-4" />;
      case 'pie': return <PieChartIcon className="h-4 w-4" />;
      case 'area': return <Activity className="h-4 w-4" />;
      case 'scatter': return <Activity className="h-4 w-4" />;
      default: return <BarChart3 className="h-4 w-4" />;
    }
  };

  const calculateTrend = () => {
    if (chartData.length < 2) return null;
    
    const firstValue = chartData[0][chartConfig.yAxis] || 0;
    const lastValue = chartData[chartData.length - 1][chartConfig.yAxis] || 0;
    const change = ((lastValue - firstValue) / firstValue) * 100;
    
    return {
      value: Math.abs(change).toFixed(1),
      direction: change >= 0 ? 'up' : 'down',
      isPositive: change >= 0
    };
  };

  const trend = calculateTrend();

  return (
    <div className="space-y-6">
      {editable && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>Chart Configuration</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="basic" className="space-y-4">
              <TabsList>
                <TabsTrigger value="basic">Basic</TabsTrigger>
                <TabsTrigger value="data">Data</TabsTrigger>
                <TabsTrigger value="style">Style</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Chart Type</label>
                    <Select 
                      value={chartConfig.type} 
                      onValueChange={(value: any) => handleConfigChange({ type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="line">Line Chart</SelectItem>
                        <SelectItem value="bar">Bar Chart</SelectItem>
                        <SelectItem value="pie">Pie Chart</SelectItem>
                        <SelectItem value="area">Area Chart</SelectItem>
                        <SelectItem value="scatter">Scatter Plot</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Data Source</label>
                    <Select 
                      value={chartConfig.dataSource} 
                      onValueChange={(value) => {
                        handleConfigChange({ dataSource: value });
                        loadPreset(value);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="rides">Rides Data</SelectItem>
                        <SelectItem value="performance">Performance</SelectItem>
                        <SelectItem value="hourly">Hourly Trends</SelectItem>
                        <SelectItem value="drivers">Driver Stats</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">X-Axis Field</label>
                    <Select 
                      value={chartConfig.xAxis} 
                      onValueChange={(value) => handleConfigChange({ xAxis: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {chartData.length > 0 && Object.keys(chartData[0]).map((key) => (
                          <SelectItem key={key} value={key}>{key}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Y-Axis Field</label>
                    <Select 
                      value={chartConfig.yAxis} 
                      onValueChange={(value) => handleConfigChange({ yAxis: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {chartData.length > 0 && Object.keys(chartData[0]).map((key) => (
                          <SelectItem key={key} value={key}>{key}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="data" className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Sample Data Presets</label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {Object.keys(SAMPLE_DATA).map((preset) => (
                      <Button
                        key={preset}
                        variant={activePreset === preset ? "default" : "outline"}
                        size="sm"
                        onClick={() => loadPreset(preset)}
                        className="justify-start"
                      >
                        {preset.charAt(0).toUpperCase() + preset.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Aggregation</label>
                  <Select 
                    value={chartConfig.aggregation} 
                    onValueChange={(value: any) => handleConfigChange({ aggregation: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sum">Sum</SelectItem>
                      <SelectItem value="avg">Average</SelectItem>
                      <SelectItem value="count">Count</SelectItem>
                      <SelectItem value="min">Minimum</SelectItem>
                      <SelectItem value="max">Maximum</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>

              <TabsContent value="style" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="showLegend"
                      checked={chartConfig.showLegend}
                      onChange={(e) => handleConfigChange({ showLegend: e.target.checked })}
                    />
                    <label htmlFor="showLegend" className="text-sm">Show Legend</label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="showGrid"
                      checked={chartConfig.showGrid}
                      onChange={(e) => handleConfigChange({ showGrid: e.target.checked })}
                    />
                    <label htmlFor="showGrid" className="text-sm">Show Grid</label>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="animate"
                    checked={chartConfig.animate}
                    onChange={(e) => handleConfigChange({ animate: e.target.checked })}
                  />
                  <label htmlFor="animate" className="text-sm">Enable Animations</label>
                </div>

                <div>
                  <label className="text-sm font-medium">Color Palette</label>
                  <div className="flex items-center space-x-2 mt-2">
                    {CHART_COLORS.slice(0, 5).map((color, index) => (
                      <div
                        key={index}
                        className="w-8 h-8 rounded border-2 border-gray-200 cursor-pointer"
                        style={{ backgroundColor: color }}
                        onClick={() => {
                          const newColors = [...chartConfig.colors];
                          newColors[0] = color;
                          handleConfigChange({ colors: newColors });
                        }}
                      />
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {getChartIcon(chartConfig.type)}
              <CardTitle>{chartConfig.title}</CardTitle>
              <Badge variant="outline">{chartConfig.type}</Badge>
            </div>
            <div className="flex items-center space-x-2">
              {trend && (
                <div className={`flex items-center space-x-1 text-sm ${
                  trend.isPositive ? 'text-green-600' : 'text-red-600'
                }`}>
                  {trend.direction === 'up' ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                  <span>{trend.value}%</span>
                </div>
              )}
              <Button variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
            </div>
          </div>
          <CardDescription>
            Data visualization for {chartConfig.dataSource} • {chartData.length} data points
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full">
            {renderChart()}
          </div>
          
          {/* Chart Summary */}
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Data Points:</span>
                <span className="ml-2 font-medium">{chartData.length}</span>
              </div>
              <div>
                <span className="text-gray-600">Chart Type:</span>
                <span className="ml-2 font-medium capitalize">{chartConfig.type}</span>
              </div>
              <div>
                <span className="text-gray-600">Aggregation:</span>
                <span className="ml-2 font-medium capitalize">{chartConfig.aggregation}</span>
              </div>
              {trend && (
                <div>
                  <span className="text-gray-600">Trend:</span>
                  <span className={`ml-2 font-medium ${
                    trend.isPositive ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {trend.direction === 'up' ? '↗' : '↘'} {trend.value}%
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}