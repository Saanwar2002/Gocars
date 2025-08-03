'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Send, 
  Paperclip, 
  Image, 
  Phone, 
  Video, 
  MoreVertical,
  Clock,
  CheckCircle,
  AlertCircle,
  User,
  Bot,
  Headphones
} from 'lucide-react';
import { driverSupportService, ChatMessage, SupportTicket } from '@/services/driverSupportService';
import { useToast } from '@/hooks/use-toast';

interface DriverSupportChatProps {
  ticketId: string;
  driverId: string;
  driverName: string;
  driverAvatar?: string;
  ticket: SupportTicket;
  onClose?: () => void;
}

export function DriverSupportChat({ 
  ticketId, 
  driverId, 
  driverName, 
  driverAvatar, 
  ticket,
  onClose 
}: DriverSupportChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [agentTyping, setAgentTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Subscribe to chat messages
    const unsubscribe = driverSupportService.subscribeToTicketChat(ticketId, (chatMessages) => {
      setMessages(chatMessages);
      setLoading(false);
      scrollToBottom();
    });

    return () => unsubscribe();
  }, [ticketId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    setIsTyping(true);

    try {
      await driverSupportService.sendChatMessage({
        ticketId,
        senderId: driverId,
        senderType: 'driver',
        senderName: driverName,
        message: messageText,
        messageType: 'text',
        readBy: [driverId]
      });

      // Simulate agent response for demo purposes
      setTimeout(() => {
        setAgentTyping(true);
        setTimeout(async () => {
          await driverSupportService.sendChatMessage({
            ticketId,
            senderId: 'support-agent-1',
            senderType: 'agent',
            senderName: 'Sarah (Support Agent)',
            message: getAutomatedResponse(messageText),
            messageType: 'text',
            readBy: ['support-agent-1']
          });
          setAgentTyping(false);
        }, 2000);
      }, 1000);

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsTyping(false);
    }
  };

  const getAutomatedResponse = (message: string): string => {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('payment') || lowerMessage.includes('earning')) {
      return "I understand you're having issues with payments. Let me check your account details. In the meantime, please ensure your bank information is up to date in your profile settings.";
    } else if (lowerMessage.includes('app') || lowerMessage.includes('bug')) {
      return "Thanks for reporting this app issue. Can you please tell me which device you're using and what version of the app? This will help me troubleshoot the problem.";
    } else if (lowerMessage.includes('passenger') || lowerMessage.includes('rider')) {
      return "I see you're having an issue with a passenger. For safety and quality purposes, all ride interactions are important to us. Can you provide more details about what happened?";
    } else if (lowerMessage.includes('vehicle') || lowerMessage.includes('car')) {
      return "Vehicle-related issues can affect your ability to drive. Are you currently able to accept rides, or do you need to go offline until this is resolved?";
    } else {
      return "Thank you for contacting support. I'm reviewing your message and will provide assistance shortly. Is there any additional information you'd like to share about this issue?";
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp: any) => {
    const date = timestamp.toDate();
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
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
    <Card className="h-[600px] flex flex-col">
      {/* Chat Header */}
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarImage src="/support-agent.png" />
              <AvatarFallback>
                <Headphones className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">Support Chat</CardTitle>
              <div className="flex items-center space-x-2">
                <p className="text-sm text-gray-600">{ticket.subject}</p>
                <Badge className={getStatusColor(ticket.status)}>
                  {ticket.status.replace('_', ' ')}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Phone className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm">
              <Video className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm">
              <MoreVertical className="h-4 w-4" />
            </Button>
            {onClose && (
              <Button variant="outline" size="sm" onClick={onClose}>
                ×
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <Separator />

      {/* Messages Area */}
      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-full p-4">
          <div className="space-y-4">
            {/* Welcome Message */}
            <div className="flex items-start space-x-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback>
                  <Bot className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="bg-blue-50 rounded-lg p-3 max-w-xs">
                  <p className="text-sm">
                    Hi {driverName}! I'm here to help you with your support request. 
                    How can I assist you today?
                  </p>
                </div>
                <p className="text-xs text-gray-500 mt-1">System • Just now</p>
              </div>
            </div>

            {/* Chat Messages */}
            {messages.map((message) => (
              <div key={message.id} className={`flex items-start space-x-3 ${
                message.senderType === 'driver' ? 'flex-row-reverse space-x-reverse' : ''
              }`}>
                <Avatar className="h-8 w-8">
                  {message.senderType === 'driver' ? (
                    <>
                      <AvatarImage src={driverAvatar} />
                      <AvatarFallback>{driverName.charAt(0)}</AvatarFallback>
                    </>
                  ) : message.senderType === 'agent' ? (
                    <>
                      <AvatarImage src="/support-agent.png" />
                      <AvatarFallback>
                        <Headphones className="h-4 w-4" />
                      </AvatarFallback>
                    </>
                  ) : (
                    <AvatarFallback>
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  )}
                </Avatar>
                
                <div className="flex-1">
                  <div className={`rounded-lg p-3 max-w-xs ${
                    message.senderType === 'driver' 
                      ? 'bg-blue-600 text-white ml-auto' 
                      : 'bg-gray-100 text-gray-900'
                  }`}>
                    <p className="text-sm">{message.message}</p>
                  </div>
                  <div className={`flex items-center space-x-2 mt-1 text-xs text-gray-500 ${
                    message.senderType === 'driver' ? 'justify-end' : ''
                  }`}>
                    <span>{message.senderName}</span>
                    <span>•</span>
                    <span>{formatTime(message.timestamp)}</span>
                    {message.senderType === 'driver' && (
                      <CheckCircle className="h-3 w-3 text-blue-600" />
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Agent Typing Indicator */}
            {agentTyping && (
              <div className="flex items-start space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    <Headphones className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-gray-100 rounded-lg p-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </CardContent>

      <Separator />

      {/* Message Input */}
      <div className="p-4">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Paperclip className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm">
            <Image className="h-4 w-4" />
          </Button>
          <div className="flex-1 relative">
            <Input
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isTyping}
            />
            {isTyping && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              </div>
            )}
          </div>
          <Button 
            onClick={handleSendMessage} 
            disabled={!newMessage.trim() || isTyping}
            size="sm"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Quick Actions */}
        <div className="flex items-center space-x-2 mt-2">
          <Button variant="outline" size="xs" onClick={() => setNewMessage("I need help with a payment issue")}>
            Payment Issue
          </Button>
          <Button variant="outline" size="xs" onClick={() => setNewMessage("I'm experiencing app problems")}>
            App Problem
          </Button>
          <Button variant="outline" size="xs" onClick={() => setNewMessage("I have a question about earnings")}>
            Earnings Question
          </Button>
        </div>
      </div>
    </Card>
  );
}