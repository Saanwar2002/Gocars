'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Minimize2, Maximize2, X, Loader2, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

interface ChatMessage {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  suggestions?: string[];
  metadata?: {
    intent?: string;
    confidence?: number;
    category?: string;
  };
}

interface ChatbotProps {
  isOpen: boolean;
  onToggle: () => void;
  userId?: string;
  context?: {
    currentPage?: string;
    userRole?: 'passenger' | 'driver' | 'operator' | 'admin';
    activeBooking?: string;
  };
}

const QUICK_ACTIONS = [
  { label: 'Book a ride', action: 'book_ride' },
  { label: 'Check ride status', action: 'check_status' },
  { label: 'Payment help', action: 'payment_help' },
  { label: 'Report an issue', action: 'report_issue' },
  { label: 'Contact support', action: 'contact_support' },
];

const COMMON_QUESTIONS = [
  'How do I book a ride?',
  'Where is my driver?',
  'How do I cancel a booking?',
  'How do I add a payment method?',
  'How do I contact my driver?',
  'What if I left something in the car?',
];

export function IntelligentChatbot({ isOpen, onToggle, userId, context }: ChatbotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Initialize with welcome message
      const welcomeMessage: ChatMessage = {
        id: 'welcome',
        type: 'bot',
        content: `Hi! I'm your GoCars AI assistant. I'm here to help you with bookings, payments, ride issues, and any questions you might have. How can I assist you today?`,
        timestamp: new Date(),
        suggestions: COMMON_QUESTIONS.slice(0, 3),
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, messages.length]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setShowQuickActions(false);

    try {
      // Simulate AI processing with realistic delay
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
      
      const botResponse = await generateBotResponse(content, context);
      setMessages(prev => [...prev, botResponse]);
    } catch (error) {
      console.error('Error generating bot response:', error);
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'bot',
        content: "I'm sorry, I'm having trouble processing your request right now. Please try again or contact our support team for immediate assistance.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (action: string) => {
    const actionMessages: Record<string, string> = {
      book_ride: "I'd like to book a ride",
      check_status: "What's the status of my current ride?",
      payment_help: "I need help with payment",
      report_issue: "I want to report an issue",
      contact_support: "I need to speak with a human agent",
    };

    const message = actionMessages[action];
    if (message) {
      handleSendMessage(message);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion);
  };

  const handleFeedback = (messageId: string, feedback: 'positive' | 'negative') => {
    // In a real implementation, this would send feedback to the AI service
    console.log(`Feedback for message ${messageId}: ${feedback}`);
    // You could show a toast notification here
  };

  if (!isOpen) return null;

  return (
    <Card className="fixed bottom-4 right-4 w-96 h-[600px] shadow-2xl border-2 border-primary/20 z-50 flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-primary to-primary/80 text-white rounded-t-lg">
        <div className="flex items-center space-x-2">
          <Bot className="h-5 w-5" />
          <CardTitle className="text-lg font-semibold">GoCars AI Assistant</CardTitle>
        </div>
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMinimized(!isMinimized)}
            className="text-white hover:bg-white/20 h-8 w-8 p-0"
          >
            {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="text-white hover:bg-white/20 h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      {!isMinimized && (
        <>
          <CardContent className="flex-1 p-0 flex flex-col">
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div key={message.id} className="space-y-2">
                    <div className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`flex items-start space-x-2 max-w-[80%] ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                          message.type === 'user' 
                            ? 'bg-primary text-white' 
                            : 'bg-secondary text-white'
                        }`}>
                          {message.type === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                        </div>
                        <div className={`rounded-lg p-3 ${
                          message.type === 'user'
                            ? 'bg-primary text-white'
                            : 'bg-muted'
                        }`}>
                          <p className="text-sm">{message.content}</p>
                          {message.metadata && (
                            <div className="mt-2 flex items-center space-x-2">
                              {message.metadata.category && (
                                <Badge variant="secondary" className="text-xs">
                                  {message.metadata.category}
                                </Badge>
                              )}
                              {message.metadata.confidence && (
                                <span className="text-xs opacity-70">
                                  {Math.round(message.metadata.confidence * 100)}% confident
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {message.type === 'bot' && (
                      <div className="flex items-center justify-between ml-10">
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleFeedback(message.id, 'positive')}
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-green-600"
                          >
                            <ThumbsUp className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleFeedback(message.id, 'negative')}
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-red-600"
                          >
                            <ThumbsDown className="h-3 w-3" />
                          </Button>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {message.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                    )}

                    {message.suggestions && message.suggestions.length > 0 && (
                      <div className="ml-10 space-y-1">
                        <p className="text-xs text-muted-foreground">Suggested questions:</p>
                        <div className="flex flex-wrap gap-1">
                          {message.suggestions.map((suggestion, index) => (
                            <Button
                              key={index}
                              variant="outline"
                              size="sm"
                              onClick={() => handleSuggestionClick(suggestion)}
                              className="text-xs h-6 px-2"
                            >
                              {suggestion}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {isLoading && (
                  <div className="flex justify-start">
                    <div className="flex items-start space-x-2">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary text-white flex items-center justify-center">
                        <Bot className="h-4 w-4" />
                      </div>
                      <div className="bg-muted rounded-lg p-3">
                        <div className="flex items-center space-x-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm">Thinking...</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {showQuickActions && (
              <>
                <Separator />
                <div className="p-4 space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Quick Actions:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {QUICK_ACTIONS.map((action) => (
                      <Button
                        key={action.action}
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuickAction(action.action)}
                        className="text-xs h-8"
                      >
                        {action.label}
                      </Button>
                    ))}
                  </div>
                </div>
                <Separator />
              </>
            )}

            <div className="p-4">
              <div className="flex space-x-2">
                <Input
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Type your message..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(inputValue);
                    }
                  }}
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button
                  onClick={() => handleSendMessage(inputValue)}
                  disabled={isLoading || !inputValue.trim()}
                  size="sm"
                  className="px-3"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </>
      )}
    </Card>
  );
}

// AI Response Generation Function
async function generateBotResponse(userMessage: string, context?: any): Promise<ChatMessage> {
  try {
    // Import NLP service dynamically to avoid circular dependencies
    const { nlpService } = await import('@/services/nlpService');
    
    // Process message with advanced NLP
    const nlpResult = await nlpService.processMessage(userMessage, context);
    
    // Handle emergency situations immediately
    if (nlpResult.urgency === 'critical' || nlpResult.intent.includes('emergency')) {
      return {
        id: Date.now().toString(),
        type: 'bot',
        content: "🚨 **EMERGENCY DETECTED** 🚨\n\nI'm immediately connecting you with our emergency response team. If you're in immediate danger, please call 911 right away.\n\nOur emergency team will contact you within 60 seconds. Please stay safe and keep your phone nearby.",
        timestamp: new Date(),
        suggestions: ['Call 911 Now', 'Share Location', 'Contact Emergency Team'],
        metadata: {
          intent: nlpResult.intent,
          confidence: nlpResult.confidence,
          category: nlpResult.category,
        },
      };
    }
    
    // Handle human agent requests
    if (nlpResult.intent.includes('human') || nlpResult.intent.includes('support.human')) {
      return {
        id: Date.now().toString(),
        type: 'bot',
        content: "I'll connect you with one of our human support agents right away. \n\n**Average wait time:** 2-3 minutes\n**Available:** 24/7\n\nWhile you wait, I can still help answer questions or gather information to make your conversation with our agent more efficient. What specific issue would you like help with?",
        timestamp: new Date(),
        suggestions: ['Connect Now', 'Describe Issue First', 'Emergency Priority'],
        metadata: {
          intent: nlpResult.intent,
          confidence: nlpResult.confidence,
          category: nlpResult.category,
        },
      };
    }
    
    // Use NLP-generated response
    let response = nlpResult.suggestedResponse;
    
    // Add entity-specific enhancements
    const entities = nlpResult.entities;
    const locations = entities.filter(e => e.type === 'location');
    const bookingIds = entities.filter(e => e.type === 'booking_id');
    const times = entities.filter(e => e.type === 'time');
    
    // Enhance response based on detected entities
    if (locations.length > 0 && nlpResult.intent.includes('booking')) {
      response += `\n\n📍 I noticed you mentioned **${locations[0].value}** - I can help you with rides to or from this location.`;
    }
    
    if (bookingIds.length > 0) {
      response += `\n\n🎫 I can see you referenced booking **${bookingIds[0].value}** - let me pull up those details for you.`;
    }
    
    if (times.length > 0 && nlpResult.intent.includes('booking')) {
      response += `\n\n⏰ You mentioned **${times[0].value}** - I'll help you schedule your ride for that time.`;
    }
    
    // Add sentiment-based response adjustments
    if (nlpResult.sentiment === 'negative') {
      response = "I'm sorry you're experiencing difficulties. " + response;
    } else if (nlpResult.sentiment === 'positive') {
      response = "Great! " + response;
    }
    
    // Add urgency indicators
    if (nlpResult.urgency === 'high') {
      response = "⚡ **High Priority Request** ⚡\n\n" + response;
    }
    
    return {
      id: Date.now().toString(),
      type: 'bot',
      content: response,
      timestamp: new Date(),
      suggestions: nlpResult.followUpQuestions.length > 0 ? nlpResult.followUpQuestions : generateFallbackSuggestions(nlpResult.intent),
      metadata: {
        intent: nlpResult.intent,
        confidence: nlpResult.confidence,
        category: nlpResult.category,
      },
    };
    
  } catch (error) {
    console.error('Error in NLP processing:', error);
    
    // Fallback to simple keyword-based response
    return generateFallbackResponse(userMessage);
  }
}

// Fallback response generator for when NLP fails
function generateFallbackResponse(userMessage: string): ChatMessage {
  const message = userMessage.toLowerCase();
  let response = "I understand you need help, but I'm having trouble processing your request right now. ";
  let suggestions: string[] = [];
  
  if (message.includes('book') || message.includes('ride')) {
    response += "It looks like you want to book a ride. You can use the 'Book Ride' button in the main app, or I can guide you through the process.";
    suggestions = ['Guide me through booking', 'Use main app', 'Contact support'];
  } else if (message.includes('help') || message.includes('support')) {
    response += "I'm here to help! You can ask me about bookings, payments, ride tracking, or any issues you're experiencing.";
    suggestions = ['Book a ride', 'Check ride status', 'Payment help', 'Report issue'];
  } else {
    response += "Could you please rephrase your question or choose from one of the options below?";
    suggestions = ['Book a ride', 'Check ride status', 'Payment help', 'Contact support'];
  }
  
  return {
    id: Date.now().toString(),
    type: 'bot',
    content: response,
    timestamp: new Date(),
    suggestions,
    metadata: {
      intent: 'fallback',
      confidence: 0.3,
      category: 'General',
    },
  };
}

// Generate fallback suggestions based on intent
function generateFallbackSuggestions(intent: string): string[] {
  const suggestionMap: Record<string, string[]> = {
    'booking.create': ['Guide me through booking', 'Book for multiple stops', 'Schedule for later'],
    'booking.status': ['View current ride', 'Contact driver', 'Get ETA update'],
    'booking.cancel': ['Cancel current ride', 'Understand policy', 'Request refund'],
    'payment.issue': ['Add payment method', 'Request refund', 'Explain charges'],
    'driver.complaint': ['File complaint', 'Rate driver', 'Contact supervisor'],
    'vehicle.issue': ['Report vehicle problem', 'Request replacement', 'Contact fleet'],
    'app.technical': ['Troubleshoot app', 'Update app', 'Contact tech support'],
    'general.greeting': ['Book a ride', 'Check ride status', 'Get help'],
  };
  
  return suggestionMap[intent] || ['Book a ride', 'Check status', 'Get help', 'Contact support'];
}