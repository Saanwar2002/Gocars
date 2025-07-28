"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { format, isToday, isYesterday } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  MessageCircle,
  Send,
  Smile,
  Paperclip,
  Image,
  MapPin,
  Phone,
  MoreVertical,
  Reply,
  Heart,
  ThumbsUp,
  Laugh,
  AlertCircle,
  Crown,
  Shield,
  Clock,
  Check,
  CheckCheck,
  Edit,
  Trash2,
  Flag,
  Copy,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { GroupMember } from '@/services/groupBookingService';

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  senderRole: 'organizer' | 'admin' | 'member';
  content: string;
  type: 'text' | 'image' | 'location' | 'system' | 'payment' | 'announcement';
  timestamp: Date;
  edited?: boolean;
  editedAt?: Date;
  replyTo?: {
    messageId: string;
    senderName: string;
    content: string;
  };
  reactions: Array<{
    emoji: string;
    users: Array<{
      userId: string;
      name: string;
    }>;
  }>;
  attachments?: Array<{
    id: string;
    type: 'image' | 'file';
    url: string;
    name: string;
    size: number;
  }>;
  metadata?: {
    location?: {
      lat: number;
      lng: number;
      address: string;
    };
    payment?: {
      amount: number;
      currency: string;
      status: string;
    };
  };
  status: 'sending' | 'sent' | 'delivered' | 'read';
}

interface GroupBookingChatProps {
  groupId: string;
  currentUserId: string;
  members: GroupMember[];
  onSendMessage?: (message: Omit<ChatMessage, 'id' | 'timestamp' | 'status' | 'reactions'>) => Promise<void>;
  onEditMessage?: (messageId: string, newContent: string) => Promise<void>;
  onDeleteMessage?: (messageId: string) => Promise<void>;
  onReactToMessage?: (messageId: string, emoji: string) => Promise<void>;
  onReportMessage?: (messageId: string, reason: string) => Promise<void>;
  isEnabled?: boolean;
}

const EMOJI_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '😡'];

const MESSAGE_TYPES = {
  text: { icon: MessageCircle, color: 'text-gray-600' },
  image: { icon: Image, color: 'text-blue-600' },
  location: { icon: MapPin, color: 'text-green-600' },
  system: { icon: AlertCircle, color: 'text-yellow-600' },
  payment: { icon: Crown, color: 'text-purple-600' },
  announcement: { icon: Shield, color: 'text-red-600' },
};

export default function GroupBookingChat({
  groupId,
  currentUserId,
  members,
  onSendMessage,
  onEditMessage,
  onDeleteMessage,
  onReactToMessage,
  onReportMessage,
  isEnabled = true,
}: GroupBookingChatProps) {
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [editingMessage, setEditingMessage] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);
  const [showReportDialog, setShowReportDialog] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState<string[]>([]);
  const [onlineMembers, setOnlineMembers] = useState<string[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Mock messages for demonstration
  useEffect(() => {
    const mockMessages: ChatMessage[] = [
      {
        id: '1',
        senderId: 'user1',
        senderName: 'Alice Johnson',
        senderRole: 'organizer',
        content: 'Welcome everyone to our group trip! Looking forward to traveling together.',
        type: 'announcement',
        timestamp: new Date(Date.now() - 3600000),
        reactions: [
          { emoji: '👍', users: [{ userId: 'user2', name: 'Bob' }, { userId: 'user3', name: 'Carol' }] }
        ],
        status: 'read',
      },
      {
        id: '2',
        senderId: 'user2',
        senderName: 'Bob Smith',
        senderRole: 'member',
        content: 'Thanks for organizing this! What time should we be ready for pickup?',
        type: 'text',
        timestamp: new Date(Date.now() - 3000000),
        reactions: [],
        status: 'read',
      },
      {
        id: '3',
        senderId: 'user1',
        senderName: 'Alice Johnson',
        senderRole: 'organizer',
        content: 'Pickup is at 9:00 AM sharp. Please be ready 5 minutes early!',
        type: 'text',
        timestamp: new Date(Date.now() - 2400000),
        reactions: [
          { emoji: '👍', users: [{ userId: 'user2', name: 'Bob' }] }
        ],
        replyTo: {
          messageId: '2',
          senderName: 'Bob Smith',
          content: 'Thanks for organizing this! What time should we be ready for pickup?',
        },
        status: 'read',
      },
      {
        id: '4',
        senderId: 'system',
        senderName: 'System',
        senderRole: 'member',
        content: 'Carol Davis has joined the group',
        type: 'system',
        timestamp: new Date(Date.now() - 1800000),
        reactions: [],
        status: 'read',
      },
      {
        id: '5',
        senderId: 'user3',
        senderName: 'Carol Davis',
        senderRole: 'member',
        content: 'Hi everyone! Excited to join the trip. Just completed my payment.',
        type: 'text',
        timestamp: new Date(Date.now() - 1200000),
        reactions: [
          { emoji: '❤️', users: [{ userId: 'user1', name: 'Alice' }] }
        ],
        status: 'read',
      },
    ];
    
    setMessages(mockMessages);
  }, []);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Get member info by user ID
  const getMemberInfo = useCallback((userId: string) => {
    return members.find(m => m.userId === userId) || {
      id: userId,
      userId,
      name: 'Unknown User',
      email: '',
      role: 'member' as const,
      status: 'joined' as const,
      paymentStatus: 'pending' as const,
      amountOwed: 0,
      amountPaid: 0,
    };
  }, [members]);

  // Handle sending a message
  const handleSendMessage = useCallback(async () => {
    if (!newMessage.trim() || !isEnabled) return;

    const currentMember = getMemberInfo(currentUserId);
    
    const messageData: Omit<ChatMessage, 'id' | 'timestamp' | 'status' | 'reactions'> = {
      senderId: currentUserId,
      senderName: currentMember.name,
      senderAvatar: currentMember.avatar,
      senderRole: currentMember.role,
      content: newMessage.trim(),
      type: 'text',
      edited: false,
      replyTo: replyingTo ? {
        messageId: replyingTo.id,
        senderName: replyingTo.senderName,
        content: replyingTo.content,
      } : undefined,
    };

    // Optimistically add message
    const optimisticMessage: ChatMessage = {
      ...messageData,
      id: `temp-${Date.now()}`,
      timestamp: new Date(),
      status: 'sending',
      reactions: [],
    };

    setMessages(prev => [...prev, optimisticMessage]);
    setNewMessage('');
    setReplyingTo(null);

    try {
      await onSendMessage?.(messageData);
      
      // Update message status to sent
      setMessages(prev => prev.map(msg => 
        msg.id === optimisticMessage.id 
          ? { ...msg, status: 'sent' as const }
          : msg
      ));
    } catch (error) {
      toast({
        title: "Failed to send message",
        description: "Please try again",
        variant: "destructive",
      });
      
      // Remove failed message
      setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
    }
  }, [newMessage, currentUserId, replyingTo, isEnabled, getMemberInfo, onSendMessage, toast]);

  // Handle editing a message
  const handleEditMessage = useCallback(async (messageId: string) => {
    if (!editContent.trim()) return;

    try {
      await onEditMessage?.(messageId, editContent.trim());
      
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { 
              ...msg, 
              content: editContent.trim(), 
              edited: true, 
              editedAt: new Date() 
            }
          : msg
      ));
      
      setEditingMessage(null);
      setEditContent('');
      
      toast({
        title: "Message updated",
        description: "Your message has been updated",
      });
    } catch (error) {
      toast({
        title: "Failed to edit message",
        description: "Please try again",
        variant: "destructive",
      });
    }
  }, [editContent, onEditMessage, toast]);

  // Handle deleting a message
  const handleDeleteMessage = useCallback(async (messageId: string) => {
    try {
      await onDeleteMessage?.(messageId);
      
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
      
      toast({
        title: "Message deleted",
        description: "Your message has been deleted",
      });
    } catch (error) {
      toast({
        title: "Failed to delete message",
        description: "Please try again",
        variant: "destructive",
      });
    }
  }, [onDeleteMessage, toast]);

  // Handle adding reaction
  const handleReaction = useCallback(async (messageId: string, emoji: string) => {
    try {
      await onReactToMessage?.(messageId, emoji);
      
      const currentMember = getMemberInfo(currentUserId);
      
      setMessages(prev => prev.map(msg => {
        if (msg.id !== messageId) return msg;
        
        const existingReaction = msg.reactions.find(r => r.emoji === emoji);
        const userAlreadyReacted = existingReaction?.users.some(u => u.userId === currentUserId);
        
        if (userAlreadyReacted) {
          // Remove reaction
          return {
            ...msg,
            reactions: msg.reactions.map(r => 
              r.emoji === emoji 
                ? { ...r, users: r.users.filter(u => u.userId !== currentUserId) }
                : r
            ).filter(r => r.users.length > 0),
          };
        } else {
          // Add reaction
          if (existingReaction) {
            return {
              ...msg,
              reactions: msg.reactions.map(r => 
                r.emoji === emoji 
                  ? { ...r, users: [...r.users, { userId: currentUserId, name: currentMember.name }] }
                  : r
              ),
            };
          } else {
            return {
              ...msg,
              reactions: [...msg.reactions, {
                emoji,
                users: [{ userId: currentUserId, name: currentMember.name }],
              }],
            };
          }
        }
      }));
      
      setShowEmojiPicker(null);
    } catch (error) {
      toast({
        title: "Failed to add reaction",
        description: "Please try again",
        variant: "destructive",
      });
    }
  }, [currentUserId, getMemberInfo, onReactToMessage, toast]);

  // Handle key press in input
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  // Format message timestamp
  const formatMessageTime = useCallback((timestamp: Date) => {
    if (isToday(timestamp)) {
      return format(timestamp, 'HH:mm');
    } else if (isYesterday(timestamp)) {
      return `Yesterday ${format(timestamp, 'HH:mm')}`;
    } else {
      return format(timestamp, 'MMM d, HH:mm');
    }
  }, []);

  // Get message status icon
  const getStatusIcon = useCallback((status: ChatMessage['status']) => {
    switch (status) {
      case 'sending':
        return <Clock className="w-3 h-3 text-gray-400" />;
      case 'sent':
        return <Check className="w-3 h-3 text-gray-400" />;
      case 'delivered':
        return <CheckCheck className="w-3 h-3 text-gray-400" />;
      case 'read':
        return <CheckCheck className="w-3 h-3 text-blue-500" />;
      default:
        return null;
    }
  }, []);

  if (!isEnabled) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8 text-gray-500">
            <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Group chat is disabled for this booking</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col h-[600px]">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Group Chat
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {members.length} members
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {onlineMembers.length} online
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages area */}
        <ScrollArea className="flex-1 px-4">
          <div className="space-y-4 pb-4">
            {messages.map((message) => {
              const isOwnMessage = message.senderId === currentUserId;
              const member = getMemberInfo(message.senderId);
              const MessageIcon = MESSAGE_TYPES[message.type]?.icon || MessageCircle;
              
              return (
                <div
                  key={message.id}
                  className={`flex gap-3 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  {/* Avatar */}
                  {!isOwnMessage && message.type !== 'system' && (
                    <Avatar className="w-8 h-8 mt-1">
                      <AvatarImage src={message.senderAvatar} />
                      <AvatarFallback className="text-xs">
                        {message.senderName.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  
                  {/* Message content */}
                  <div className={`flex-1 max-w-[70%] ${isOwnMessage ? 'text-right' : 'text-left'}`}>
                    {/* System messages */}
                    {message.type === 'system' && (
                      <div className="text-center py-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-600">
                          <MessageIcon className="w-4 h-4" />
                          {message.content}
                        </div>
                      </div>
                    )}
                    
                    {/* Regular messages */}
                    {message.type !== 'system' && (
                      <div className={`relative group ${isOwnMessage ? 'ml-auto' : 'mr-auto'}`}>
                        {/* Sender name and role */}
                        {!isOwnMessage && (
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium">{message.senderName}</span>
                            {message.senderRole === 'organizer' && (
                              <Crown className="w-3 h-3 text-purple-500" />
                            )}
                            {message.senderRole === 'admin' && (
                              <Shield className="w-3 h-3 text-blue-500" />
                            )}
                          </div>
                        )}
                        
                        {/* Reply context */}
                        {message.replyTo && (
                          <div className="mb-2 p-2 bg-gray-100 rounded border-l-2 border-blue-500">
                            <div className="text-xs text-gray-600 font-medium">
                              {message.replyTo.senderName}
                            </div>
                            <div className="text-xs text-gray-500 truncate">
                              {message.replyTo.content}
                            </div>
                          </div>
                        )}
                        
                        {/* Message bubble */}
                        <div
                          className={`relative px-3 py-2 rounded-lg ${
                            isOwnMessage
                              ? 'bg-blue-500 text-white'
                              : message.type === 'announcement'
                              ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          {editingMessage === message.id ? (
                            <div className="space-y-2">
                              <Input
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    handleEditMessage(message.id);
                                  } else if (e.key === 'Escape') {
                                    setEditingMessage(null);
                                    setEditContent('');
                                  }
                                }}
                                className="text-sm"
                                autoFocus
                              />
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleEditMessage(message.id)}
                                >
                                  Save
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setEditingMessage(null);
                                    setEditContent('');
                                  }}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="text-sm">{message.content}</div>
                              {message.edited && (
                                <div className="text-xs opacity-70 mt-1">
                                  (edited)
                                </div>
                              )}
                            </>
                          )}
                          
                          {/* Message actions */}
                          {!editingMessage && (
                            <div className="absolute top-0 right-0 transform translate-x-full opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="flex items-center gap-1 bg-white border rounded-lg shadow-sm p-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setShowEmojiPicker(message.id)}
                                  className="h-6 w-6 p-0"
                                >
                                  <Smile className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setReplyingTo(message)}
                                  className="h-6 w-6 p-0"
                                >
                                  <Reply className="w-3 h-3" />
                                </Button>
                                {isOwnMessage && (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => {
                                        setEditingMessage(message.id);
                                        setEditContent(message.content);
                                      }}
                                      className="h-6 w-6 p-0"
                                    >
                                      <Edit className="w-3 h-3" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleDeleteMessage(message.id)}
                                      className="h-6 w-6 p-0 text-red-500"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </>
                                )}
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-6 w-6 p-0"
                                    >
                                      <MoreVertical className="w-3 h-3" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent>
                                    <DropdownMenuItem
                                      onClick={() => {
                                        navigator.clipboard.writeText(message.content);
                                        toast({ title: "Message copied" });
                                      }}
                                    >
                                      <Copy className="w-4 h-4 mr-2" />
                                      Copy
                                    </DropdownMenuItem>
                                    {!isOwnMessage && (
                                      <DropdownMenuItem
                                        onClick={() => setShowReportDialog(message.id)}
                                        className="text-red-600"
                                      >
                                        <Flag className="w-4 h-4 mr-2" />
                                        Report
                                      </DropdownMenuItem>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {/* Reactions */}
                        {message.reactions.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {message.reactions.map((reaction, index) => (
                              <button
                                key={index}
                                onClick={() => handleReaction(message.id, reaction.emoji)}
                                className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-xs transition-colors"
                              >
                                <span>{reaction.emoji}</span>
                                <span>{reaction.users.length}</span>
                              </button>
                            ))}
                          </div>
                        )}
                        
                        {/* Emoji picker */}
                        {showEmojiPicker === message.id && (
                          <div className="absolute top-full left-0 mt-1 bg-white border rounded-lg shadow-lg p-2 z-10">
                            <div className="flex gap-1">
                              {EMOJI_REACTIONS.map((emoji) => (
                                <button
                                  key={emoji}
                                  onClick={() => handleReaction(message.id, emoji)}
                                  className="p-1 hover:bg-gray-100 rounded"
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Timestamp and status */}
                        <div className={`flex items-center gap-1 mt-1 text-xs ${
                          isOwnMessage ? 'justify-end text-gray-400' : 'justify-start text-gray-500'
                        }`}>
                          <span>{formatMessageTime(message.timestamp)}</span>
                          {isOwnMessage && getStatusIcon(message.status)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
        
        {/* Typing indicators */}
        {isTyping.length > 0 && (
          <div className="px-4 py-2 text-sm text-gray-500">
            {isTyping.join(', ')} {isTyping.length === 1 ? 'is' : 'are'} typing...
          </div>
        )}
        
        {/* Reply context */}
        {replyingTo && (
          <div className="px-4 py-2 bg-blue-50 border-t">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="text-sm font-medium text-blue-800">
                  Replying to {replyingTo.senderName}
                </div>
                <div className="text-sm text-blue-600 truncate">
                  {replyingTo.content}
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setReplyingTo(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
        
        {/* Message input */}
        <div className="p-4 border-t">
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <Input
                ref={inputRef}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                className="pr-20"
              />
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                >
                  <Paperclip className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                >
                  <Smile className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              size="sm"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
      
      {/* Report dialog */}
      <Dialog open={!!showReportDialog} onOpenChange={() => setShowReportDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report Message</DialogTitle>
            <DialogDescription>
              Why are you reporting this message?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {['Spam', 'Harassment', 'Inappropriate content', 'Other'].map((reason) => (
              <Button
                key={reason}
                variant="outline"
                className="w-full justify-start"
                onClick={async () => {
                  if (showReportDialog) {
                    await onReportMessage?.(showReportDialog, reason);
                    toast({
                      title: "Message reported",
                      description: "Thank you for helping keep our community safe",
                    });
                  }
                  setShowReportDialog(null);
                }}
              >
                {reason}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}