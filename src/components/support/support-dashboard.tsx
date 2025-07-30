'use client';

import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Bot, 
  TrendingUp, 
  AlertTriangle, 
  Users, 
  Clock,
  CheckCircle,
  XCircle,
  BarChart3,
  PieChart,
  Activity,
  Zap,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { IntelligentChatbot } from './intelligent-chatbot';
import { SupportTicketSystem } from './support-ticket-system';
import { sentimentAnalysisService, SentimentAnalysis, SentimentTrend, CategorySentiment } from '@/services/sentimentAnalysisService';

interface SupportMetrics {
  totalTickets: number;
  openTickets: number;
  resolvedTickets: number;
  averageResponseTime: number;
  customerSatisfaction: number;
  chatSessions: number;
  escalationRate: number;
  resolutionRate: number;
}

interface AgentPerformance {
  agentId: string;
  name: string;
  ticketsHandled: number;
  averageResponseTime: number;
  customerRating: number;
  resolutionRate: number;
  status: 'online' | 'offline' | 'busy';
}

export function SupportDashboard() {
  const [metrics, setMetrics] = useState<SupportMetrics>({
    totalTickets: 0,
    openTickets: 0,
    resolvedTickets: 0,
    averageResponseTime: 0,
    customerSatisfaction: 0,
    chatSessions: 0,
    escalationRate: 0,
    resolutionRate: 0,
  });

  const [sentimentTrends, setSentimentTrends] = useState<SentimentTrend[]>([]);
  const [categorySentiment, setCategorySentiment] = useState<CategorySentiment[]>([]);
  const [urgentFeedback, setUrgentFeedback] = useState<SentimentAnalysis[]>([]);
  const [agentPerformance, setAgentPerformance] = useState<AgentPerformance[]>([]);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [selectedTimeRange]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // Load metrics (mock data for demonstration)
      setMetrics({
        totalTickets: 1247,
        openTickets: 89,
        resolvedTickets: 1158,
        averageResponseTime: 4.2, // hours
        customerSatisfaction: 4.3,
        chatSessions: 2341,
        escalationRate: 12.5, // percentage
        resolutionRate: 92.8, // percentage
      });

      // Load sentiment data
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - (selectedTimeRange === '7d' ? 7 : selectedTimeRange === '30d' ? 30 : 90));

      const trends = await sentimentAnalysisService.getSentimentTrends(startDate, endDate);
      setSentimentTrends(trends);

      const categoryData = await sentimentAnalysisService.getCategorySentiment();
      setCategorySentiment(categoryData);

      const urgent = await sentimentAnalysisService.getUrgentFeedback(10);
      setUrgentFeedback(urgent);

      // Mock agent performance data
      setAgentPerformance([
        {
          agentId: 'agent1',
          name: 'Sarah Johnson',
          ticketsHandled: 45,
          averageResponseTime: 3.2,
          customerRating: 4.8,
          resolutionRate: 95.6,
          status: 'online',
        },
        {
          agentId: 'agent2',
          name: 'Mike Chen',
          ticketsHandled: 38,
          averageResponseTime: 4.1,
          customerRating: 4.5,
          resolutionRate: 91.2,
          status: 'online',
        },
        {
          agentId: 'agent3',
          name: 'Emily Rodriguez',
          ticketsHandled: 52,
          averageResponseTime: 2.8,
          customerRating: 4.9,
          resolutionRate: 97.1,
          status: 'busy',
        },
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-100 text-green-800';
      case 'busy': return 'bg-yellow-100 text-yellow-800';
      case 'offline': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-600';
      case 'negative': return 'text-red-600';
      case 'neutral': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  const formatResponseTime = (hours: number) => {
    if (hours < 1) {
      return `${Math.round(hours * 60)}m`;
    }
    return `${hours.toFixed(1)}h`;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Support Dashboard</h1>
          <p className="text-muted-foreground">Monitor customer support performance and sentiment</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" onClick={loadDashboardData} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          
          <Button onClick={() => setIsChatbotOpen(true)}>
            <Bot className="h-4 w-4 mr-2" />
            Test Chatbot
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalTickets.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.openTickets} open, {metrics.resolvedTickets} resolved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatResponseTime(metrics.averageResponseTime)}</div>
            <p className="text-xs text-green-600">
              ↓ 12% from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customer Satisfaction</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.customerSatisfaction.toFixed(1)}/5</div>
            <Progress value={metrics.customerSatisfaction * 20} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolution Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.resolutionRate.toFixed(1)}%</div>
            <p className="text-xs text-green-600">
              ↑ 3.2% from last period
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sentiment">Sentiment Analysis</TabsTrigger>
          <TabsTrigger value="tickets">Ticket Management</TabsTrigger>
          <TabsTrigger value="agents">Agent Performance</TabsTrigger>
          <TabsTrigger value="chatbot">AI Chatbot</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sentiment Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="h-5 w-5 mr-2" />
                  Sentiment Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                {sentimentTrends.length > 0 ? (
                  <div className="space-y-4">
                    {sentimentTrends.slice(-7).map((trend, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          {trend.date.toLocaleDateString()}
                        </span>
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center space-x-1">
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            <span className="text-xs">{trend.positive}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                            <span className="text-xs">{trend.neutral}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                            <span className="text-xs">{trend.negative}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No sentiment data available</p>
                )}
              </CardContent>
            </Card>

            {/* Urgent Issues */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
                  Urgent Issues
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {urgentFeedback.slice(0, 5).map((feedback) => (
                    <div key={feedback.id} className="p-3 border rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <Badge variant="destructive" className="text-xs">
                          {feedback.urgency}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {feedback.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm line-clamp-2">{feedback.text}</p>
                      <div className="flex items-center mt-2 space-x-2">
                        <Badge variant="outline" className="text-xs">
                          {feedback.source}
                        </Badge>
                        {feedback.categories.map((category) => (
                          <Badge key={category} variant="secondary" className="text-xs">
                            {category}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Category Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Category Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {categorySentiment.map((category) => (
                  <div key={category.category} className="p-4 border rounded-lg">
                    <h4 className="font-medium capitalize mb-2">{category.category}</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-green-600">Positive</span>
                        <span>{category.positive}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Neutral</span>
                        <span>{category.neutral}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-red-600">Negative</span>
                        <span>{category.negative}</span>
                      </div>
                      <div className="pt-2 border-t">
                        <div className="flex justify-between text-sm font-medium">
                          <span>Sentiment Score</span>
                          <span className={getSentimentColor(category.averageSentiment > 0 ? 'positive' : category.averageSentiment < 0 ? 'negative' : 'neutral')}>
                            {category.averageSentiment.toFixed(2)}
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

        <TabsContent value="sentiment" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Sentiment Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {categorySentiment.map((category) => {
                    const total = category.positive + category.neutral + category.negative;
                    const positivePercent = (category.positive / total) * 100;
                    const neutralPercent = (category.neutral / total) * 100;
                    const negativePercent = (category.negative / total) * 100;

                    return (
                      <div key={category.category} className="space-y-2">
                        <div className="flex justify-between">
                          <span className="capitalize font-medium">{category.category}</span>
                          <span className="text-sm text-muted-foreground">{total} responses</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 flex overflow-hidden">
                          <div 
                            className="bg-green-500 h-full" 
                            style={{ width: `${positivePercent}%` }}
                          ></div>
                          <div 
                            className="bg-gray-400 h-full" 
                            style={{ width: `${neutralPercent}%` }}
                          ></div>
                          <div 
                            className="bg-red-500 h-full" 
                            style={{ width: `${negativePercent}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{positivePercent.toFixed(1)}% positive</span>
                          <span>{neutralPercent.toFixed(1)}% neutral</span>
                          <span>{negativePercent.toFixed(1)}% negative</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Negative Feedback</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {urgentFeedback.filter(f => f.sentiment === 'negative').slice(0, 5).map((feedback) => (
                    <div key={feedback.id} className="p-3 border rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Badge variant="destructive" className="text-xs">
                            {feedback.sentiment}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {(feedback.confidence * 100).toFixed(0)}% confident
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {feedback.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm line-clamp-2">{feedback.text}</p>
                      <div className="flex items-center mt-2 space-x-1">
                        {feedback.keywords.slice(0, 3).map((keyword) => (
                          <Badge key={keyword} variant="secondary" className="text-xs">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tickets">
          <SupportTicketSystem 
            userRole="admin" 
            userId="admin123"
            onTicketCreate={(ticket) => console.log('Ticket created:', ticket)}
            onTicketUpdate={(ticket) => console.log('Ticket updated:', ticket)}
          />
        </TabsContent>

        <TabsContent value="agents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Agent Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {agentPerformance.map((agent) => (
                  <div key={agent.agentId} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium">{agent.name}</h4>
                        <div className="flex items-center space-x-2">
                          <Badge className={getStatusColor(agent.status)}>
                            {agent.status}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {agent.ticketsHandled} tickets handled
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-6 text-sm">
                      <div className="text-center">
                        <div className="font-medium">{formatResponseTime(agent.averageResponseTime)}</div>
                        <div className="text-muted-foreground">Avg Response</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium">{agent.customerRating.toFixed(1)}/5</div>
                        <div className="text-muted-foreground">Rating</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium">{agent.resolutionRate.toFixed(1)}%</div>
                        <div className="text-muted-foreground">Resolution</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chatbot">
          <Card>
            <CardHeader>
              <CardTitle>AI Chatbot Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Chatbot Performance</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg">
                      <div className="text-2xl font-bold">{metrics.chatSessions.toLocaleString()}</div>
                      <p className="text-sm text-muted-foreground">Total Sessions</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="text-2xl font-bold">{metrics.escalationRate.toFixed(1)}%</div>
                      <p className="text-sm text-muted-foreground">Escalation Rate</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium">Common Intents</h4>
                    <div className="space-y-2">
                      {['booking', 'payment', 'tracking', 'support', 'cancellation'].map((intent) => (
                        <div key={intent} className="flex justify-between items-center">
                          <span className="capitalize">{intent}</span>
                          <Badge variant="secondary">{Math.floor(Math.random() * 100)}%</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Test Chatbot</h3>
                  <p className="text-muted-foreground">
                    Test the AI chatbot functionality and see how it responds to different queries.
                  </p>
                  <Button onClick={() => setIsChatbotOpen(true)} className="w-full">
                    <Bot className="h-4 w-4 mr-2" />
                    Open Test Chatbot
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Chatbot Component */}
      <IntelligentChatbot
        isOpen={isChatbotOpen}
        onToggle={() => setIsChatbotOpen(!isChatbotOpen)}
        userId="admin123"
        context={{
          currentPage: 'support-dashboard',
          userRole: 'admin',
        }}
      />
    </div>
  );
}