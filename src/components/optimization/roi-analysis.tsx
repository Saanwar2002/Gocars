'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    LineChart,
    Line,
    AreaChart,
    Area,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';
import {
    DollarSign,
    TrendingUp,
    TrendingDown,
    Calculator,
    Target,
    AlertTriangle,
    CheckCircle,
    Clock,
    BarChart3,
    PieChart,
    Activity,
    Zap
} from 'lucide-react';
import {
    businessOptimizationService,
    ROIAnalysis as ROIAnalysisType,
    OptimizationRecommendation
} from '@/services/businessOptimizationService';
import { useToast } from '@/hooks/use-toast';

interface ROIAnalysisProps {
    recommendation: OptimizationRecommendation;
    onClose?: () => void;
}

export function ROIAnalysis({ recommendation, onClose }: ROIAnalysisProps) {
    const [roiData, setRoiData] = useState<ROIAnalysisType | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedScenario, setSelectedScenario] = useState<'conservative' | 'expected' | 'optimistic'>('expected');
    const { toast } = useToast();

    useEffect(() => {
        loadROIAnalysis();
    }, [recommendation.id]);

    const loadROIAnalysis = async () => {
        try {
            setLoading(true);
            const roi = await businessOptimizationService.calculateROIAnalysis(recommendation.id);
            setRoiData(roi);
        } catch (error) {
            console.error('Error loading ROI analysis:', error);
            toast({
                title: 'Error',
                description: 'Failed to load ROI analysis. Please try again.',
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    };

    const formatPercentage = (value: number) => {
        return `${value.toFixed(1)}%`;
    };

    const getScenarioColor = (scenario: string) => {
        switch (scenario) {
            case 'conservative': return 'bg-red-100 text-red-800';
            case 'expected': return 'bg-blue-100 text-blue-800';
            case 'optimistic': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getROIColor = (roi: number) => {
        if (roi >= 200) return 'text-green-600';
        if (roi >= 100) return 'text-blue-600';
        if (roi >= 50) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getChartData = () => {
        if (!roiData) return [];

        return roiData.returns.monthly.map((monthlyReturn, index) => ({
            month: `Month ${index + 1}`,
            monthlyReturn,
            cumulativeReturn: roiData.returns.cumulative[index],
            investment: roiData.investment.total,
            netReturn: roiData.returns.cumulative[index] - roiData.investment.total
        }));
    };

    const getBreakEvenData = () => {
        if (!roiData) return [];

        const data = [];
        let cumulative = 0;

        for (let month = 1; month <= 24; month++) {
            const monthlyReturn = roiData.returns.monthly[month - 1] || 0;
            cumulative += monthlyReturn;

            data.push({
                month: `M${month}`,
                cumulative,
                investment: roiData.investment.total,
                breakEven: cumulative >= roiData.investment.total
            });
        }

        return data;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!roiData) {
        return (
            <Card>
                <CardContent className="p-8 text-center">
                    <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Failed to load ROI analysis data</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">ROI Analysis</h2>
                    <p className="text-gray-600">{recommendation.title}</p>
                </div>
                {onClose && (
                    <Button variant="outline" onClick={onClose}>
                        Close
                    </Button>
                )}
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center space-x-2">
                            <DollarSign className="h-8 w-8 text-green-600" />
                            <div>
                                <p className="text-sm font-medium text-gray-600">Expected ROI</p>
                                <p className={`text-2xl font-bold ${getROIColor(roiData.metrics.roi)}`}>
                                    {formatPercentage(roiData.metrics.roi)}
                                </p>
                                <p className="text-xs text-gray-500">12-month return</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center space-x-2">
                            <Clock className="h-8 w-8 text-blue-600" />
                            <div>
                                <p className="text-sm font-medium text-gray-600">Payback Period</p>
                                <p className="text-2xl font-bold">{roiData.metrics.paybackPeriod.toFixed(1)}</p>
                                <p className="text-xs text-gray-500">months</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center space-x-2">
                            <TrendingUp className="h-8 w-8 text-purple-600" />
                            <div>
                                <p className="text-sm font-medium text-gray-600">Net Present Value</p>
                                <p className="text-2xl font-bold">{formatCurrency(roiData.metrics.npv)}</p>
                                <p className="text-xs text-gray-500">24-month NPV</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center space-x-2">
                            <Target className="h-8 w-8 text-orange-600" />
                            <div>
                                <p className="text-sm font-medium text-gray-600">Internal Rate of Return</p>
                                <p className="text-2xl font-bold">{formatPercentage(roiData.metrics.irr * 100)}</p>
                                <p className="text-xs text-gray-500">Annual IRR</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Investment Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <Calculator className="h-5 w-5" />
                            <span>Investment Breakdown</span>
                        </CardTitle>
                        <CardDescription>Initial and ongoing investment requirements</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                                <span className="font-medium">Initial Investment</span>
                                <span className="text-lg font-bold text-blue-600">
                                    {formatCurrency(roiData.investment.initial)}
                                </span>
                            </div>

                            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                                <span className="font-medium">Ongoing Monthly Cost</span>
                                <span className="text-lg font-bold text-orange-600">
                                    {formatCurrency(roiData.investment.ongoing)}
                                </span>
                            </div>

                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <span className="font-medium">Total Investment (12mo)</span>
                                <span className="text-lg font-bold text-gray-800">
                                    {formatCurrency(roiData.investment.total)}
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <BarChart3 className="h-5 w-5" />
                            <span>Scenario Analysis</span>
                        </CardTitle>
                        <CardDescription>ROI projections under different scenarios</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {roiData.scenarios.map((scenario) => (
                                <div
                                    key={scenario.name}
                                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${selectedScenario === scenario.name ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                                        }`}
                                    onClick={() => setSelectedScenario(scenario.name)}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                            <Badge className={getScenarioColor(scenario.name)}>
                                                {scenario.name}
                                            </Badge>
                                            <span className="text-sm text-gray-600">
                                                {formatPercentage(scenario.probability * 100)} probability
                                            </span>
                                        </div>
                                        <div className="text-right">
                                            <p className={`font-bold ${getROIColor(scenario.roi)}`}>
                                                {formatPercentage(scenario.roi)}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {scenario.paybackPeriod.toFixed(1)}mo payback
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
            <Tabs defaultValue="returns" className="space-y-4">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="returns">Returns Analysis</TabsTrigger>
                    <TabsTrigger value="breakeven">Break-Even Analysis</TabsTrigger>
                    <TabsTrigger value="assumptions">Assumptions</TabsTrigger>
                </TabsList>

                <TabsContent value="returns" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Monthly Returns vs Investment</CardTitle>
                            <CardDescription>Cumulative returns compared to total investment over time</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={400}>
                                <AreaChart data={getChartData()}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="month" />
                                    <YAxis tickFormatter={(value) => formatCurrency(value)} />
                                    <Tooltip
                                        formatter={(value: number, name: string) => [
                                            formatCurrency(value),
                                            name === 'cumulativeReturn' ? 'Cumulative Returns' :
                                                name === 'investment' ? 'Total Investment' :
                                                    name === 'monthlyReturn' ? 'Monthly Return' : 'Net Return'
                                        ]}
                                    />
                                    <Legend />
                                    <Area
                                        type="monotone"
                                        dataKey="cumulativeReturn"
                                        stackId="1"
                                        stroke="#8884d8"
                                        fill="#8884d8"
                                        fillOpacity={0.6}
                                        name="Cumulative Returns"
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="investment"
                                        stroke="#ff7300"
                                        strokeWidth={2}
                                        strokeDasharray="5 5"
                                        name="Total Investment"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="breakeven" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Break-Even Analysis</CardTitle>
                            <CardDescription>
                                Break-even point: Month {roiData.returns.breakEvenMonth}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={400}>
                                <LineChart data={getBreakEvenData()}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="month" />
                                    <YAxis tickFormatter={(value) => formatCurrency(value)} />
                                    <Tooltip
                                        formatter={(value: number, name: string) => [
                                            formatCurrency(value),
                                            name === 'cumulative' ? 'Cumulative Returns' : 'Investment'
                                        ]}
                                    />
                                    <Legend />
                                    <Line
                                        type="monotone"
                                        dataKey="cumulative"
                                        stroke="#8884d8"
                                        strokeWidth={3}
                                        name="Cumulative Returns"
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="investment"
                                        stroke="#ff7300"
                                        strokeWidth={2}
                                        strokeDasharray="5 5"
                                        name="Investment"
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="assumptions" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Key Assumptions</CardTitle>
                            <CardDescription>Critical assumptions underlying the ROI analysis</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {roiData.assumptions.map((assumption, index) => (
                                    <div key={index} className="p-4 border rounded-lg">
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="font-medium">{assumption.parameter}</h4>
                                            <Badge variant="outline">
                                                {assumption.sensitivity} sensitivity
                                            </Badge>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <p className="text-gray-600">Value</p>
                                                <p className="font-medium">
                                                    {assumption.parameter.toLowerCase().includes('cost') ||
                                                        assumption.parameter.toLowerCase().includes('revenue')
                                                        ? formatCurrency(assumption.value)
                                                        : assumption.value.toLocaleString()
                                                    }
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-gray-600">Confidence</p>
                                                <div className="flex items-center space-x-2">
                                                    <Progress value={assumption.confidence * 100} className="flex-1" />
                                                    <span className="font-medium">
                                                        {formatPercentage(assumption.confidence * 100)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Risk Assessment */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <AlertTriangle className="h-5 w-5" />
                        <span>Risk Assessment</span>
                    </CardTitle>
                    <CardDescription>Potential risks and mitigation strategies</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h4 className="font-medium mb-3">Implementation Risks</h4>
                            <div className="space-y-2">
                                {recommendation.implementation.risks.map((risk, index) => (
                                    <div key={index} className="flex items-start space-x-2">
                                        <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5" />
                                        <span className="text-sm">{risk}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h4 className="font-medium mb-3">Mitigation Strategies</h4>
                            <div className="space-y-2">
                                {recommendation.implementation.mitigations.map((mitigation, index) => (
                                    <div key={index} className="flex items-start space-x-2">
                                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                                        <span className="text-sm">{mitigation}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}