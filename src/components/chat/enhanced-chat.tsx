/**
 * Enhanced Chat System for GoCars
 * Rich messaging with images, location sharing, voice messages, and real-time features
 */

import React, { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { 
  Send, 
  Image, 
  MapPin, 
  Mic, 
  MicOff, 
  Paperclip, 
  Smile, 
  MoreVertical,
  Phone,
  Video,
  Info,
  Search,
  Star,
  Reply,
  Forward,
  Copy,
  Trash2,
  Download,
  Eye,
  EyeOff,
  Clock,
  Check,
  CheckCheck,
  AlertCircle,
  X,
  MessageCircle,
  Play,
  Share
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useChat } from '@/hooks/useWebSocket'
import { useEventSubscription, useNotificationEvents } from '@/hooks/useEventSystem'
import { eventSystem, createNotificationEvent } from '@/lib/websocket/event-system'

// Message Types
export interface ChatMessage {
  id: string
  senderId: string
  senderName: string
  senderAvatar?: string
  content: string
  type: 'text' | 'image' | 'location' | 'voice' | 'file' | 'system'
  timestamp: number
  status: 'sending' | 'sent' | 'delivered' | 'read'
  replyTo?: string
  reactions?: { emoji: string; users: string[] }[]
  metadata?: {
    fileName?: string
    fileSize?: number
    fileType?: string
    location?: { lat: number; lng: number; address?: string }
    duration?: number // for voice messages
    imageUrl?: string
    thumbnailUrl?: string
  }
  edited?: boolean
  editedAt?: number
}

// Chat Room Interface
export interface ChatRoom {
  id: string
  name: string
  type: 'direct' | 'group' | 'ride' | 'support'
  participants: ChatParticipant[]
  lastMessage?: ChatMessage
  unreadCount: number
  isOnline: boolean
  avatar?: string
  metadata?: {
    rideId?: string
    supportTicketId?: string
    description?: string
  }
}

export interface ChatParticipant {
  id: string
  name: string
  avatar?: string
  role: 'passenger' | 'driver' | 'operator' | 'admin'
  isOnline: boolean
  lastSeen?: number
  isTyping?: boolean
}

interface EnhancedChatProps {
  userId: string
  userRole: string
  roomId?: string
  className?: string
}

export const EnhancedChat: React.FC<EnhancedChatProps> = ({
  userId,
  userRole,
  roomId,
  className
}) => {
  // State management
  const [currentRoom, setCurrentRoom] = useState<string>(roomId || '')
  const [message, setMessage] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [selectedMessages, setSelectedMessages] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null)
  const [isTyping, setIsTyping] = useState(false)
  const [typingUsers, setTypingUsers] = useState<string[]>([])

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const voiceRecorderRef = useRef<MediaRecorder | null>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Chat hooks - using real-time data
  const { messages, sendChatMessage } = useChat(userId, userRole, currentRoom)
  const { notifications } = useNotificationEvents(userId, userRole)

  // Real-time chat rooms data
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([
    {
      id: 'ride_123',
      name: 'Current Ride',
      type: 'ride',
      participants: [
        { id: 'driver_456', name: 'John Driver', role: 'driver', isOnline: true },
        { id: userId, name: 'You', role: userRole as any, isOnline: true }
      ],
      unreadCount: 2,
      isOnline: true,
      metadata: { rideId: 'ride_123' }
    },
    {
      id: 'support_789',
      name: 'Customer Support',
      type: 'support',
      participants: [
        { id: 'support_001', name: 'Sarah Support', role: 'operator', isOnline: true },
        { id: userId, name: 'You', role: userRole as any, isOnline: true }
      ],
      unreadCount: 0,
      isOnline: true,
      metadata: { supportTicketId: 'ticket_789' }
    }
  ])

  // Real-time messages from WebSocket
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])

  // Subscribe to real-time chat messages
  useEventSubscription('notification_sent', (event) => {
    if (event.category === 'chat' && event.recipientId === userId) {
      const newMessage: ChatMessage = {
        id: event.id,
        senderId: event.userId,
        senderName: event.metadata?.senderName || 'Unknown',
        content: event.message,
        type: 'text',
        timestamp: event.timestamp,
        status: 'delivered'
      }
      setChatMessages(prev => [...prev, newMessage])
    }
  })

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  // Handle typing indicator
  useEffect(() => {
    if (message.trim() && !isTyping) {
      setIsTyping(true)
      // Send typing indicator to other participants
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
      // Send stop typing indicator
    }, 1000)

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [message, isTyping])

  // Message handlers
  const handleSendMessage = () => {
    if (!message.trim() && !replyingTo) return

    const newMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      senderId: userId,
      senderName: 'You',
      content: message.trim(),
      type: 'text',
      timestamp: Date.now(),
      status: 'sending',
      replyTo: replyingTo?.id
    }

    setChatMessages(prev => [...prev, newMessage])
    
    // Send via WebSocket
    sendChatMessage(message.trim())
    
    // Also emit as notification event for real-time sync
    const notificationEvent = createNotificationEvent({
      userId,
      recipientId: currentRoom,
      title: 'New Message',
      message: message.trim(),
      category: 'chat',
      priority: 'normal',
      metadata: { senderName: 'You', roomId: currentRoom }
    })
    eventSystem.emitEvent(notificationEvent)
    
    setMessage('')
    setReplyingTo(null)
    setIsTyping(false)
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const newMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      senderId: userId,
      senderName: 'You',
      content: file.name,
      type: file.type.startsWith('image/') ? 'image' : 'file',
      timestamp: Date.now(),
      status: 'sending',
      metadata: {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        imageUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
      }
    }

    setChatMessages(prev => [...prev, newMessage])
    // In real app, upload file to server and send message
  }

  const handleLocationShare = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const newMessage: ChatMessage = {
          id: `msg_${Date.now()}`,
          senderId: userId,
          senderName: 'You',
          content: 'Shared location',
          type: 'location',
          timestamp: Date.now(),
          status: 'sending',
          metadata: {
            location: {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              address: 'Current location'
            }
          }
        }

        setChatMessages(prev => [...prev, newMessage])
        sendChatMessage('Shared location', 'location')
      })
    }
  }

  const handleVoiceRecording = async () => {
    if (!isRecording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        const mediaRecorder = new MediaRecorder(stream)
        voiceRecorderRef.current = mediaRecorder
        
        mediaRecorder.start()
        setIsRecording(true)
        
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            // Handle voice message data
            const newMessage: ChatMessage = {
              id: `msg_${Date.now()}`,
              senderId: userId,
              senderName: 'You',
              content: 'Voice message',
              type: 'voice',
              timestamp: Date.now(),
              status: 'sending',
              metadata: {
                duration: 5 // seconds - would be calculated
              }
            }
            setChatMessages(prev => [...prev, newMessage])
          }
        }
      } catch (error) {
        console.error('Error accessing microphone:', error)
      }
    } else {
      voiceRecorderRef.current?.stop()
      setIsRecording(false)
    }
  }

  const handleMessageReaction = (messageId: string, emoji: string) => {
    setChatMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        const reactions = msg.reactions || []
        const existingReaction = reactions.find(r => r.emoji === emoji)
        
        if (existingReaction) {
          if (existingReaction.users.includes(userId)) {
            existingReaction.users = existingReaction.users.filter(u => u !== userId)
          } else {
            existingReaction.users.push(userId)
          }
        } else {
          reactions.push({ emoji, users: [userId] })
        }
        
        return { ...msg, reactions: reactions.filter(r => r.users.length > 0) }
      }
      return msg
    }))
  }

  const handleMessageSelect = (messageId: string) => {
    setSelectedMessages(prev => 
      prev.includes(messageId) 
        ? prev.filter(id => id !== messageId)
        : [...prev, messageId]
    )
  }

  const handleDeleteMessages = () => {
    setChatMessages(prev => prev.filter(msg => !selectedMessages.includes(msg.id)))
    setSelectedMessages([])
  }

  const handleReplyToMessage = (message: ChatMessage) => {
    setReplyingTo(message)
  }

  const currentRoomData = chatRooms.find(room => room.id === currentRoom)
  const filteredMessages = chatMessages.filter(msg => 
    !searchQuery || msg.content.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className={`flex h-[600px] border rounded-lg overflow-hidden ${className}`}>
      {/* Chat Rooms Sidebar */}
      <div className="w-80 border-r bg-muted/30">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Messages</h3>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="p-2">
            {chatRooms.map((room) => (
              <div
                key={room.id}
                className={`p-3 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors ${
                  currentRoom === room.id ? 'bg-primary/10 border border-primary/20' : ''
                }`}
                onClick={() => setCurrentRoom(room.id)}
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={room.avatar} />
                      <AvatarFallback>{room.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    {room.isOnline && (
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium truncate">{room.name}</h4>
                      {room.unreadCount > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {room.unreadCount}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {room.lastMessage?.content || 'No messages yet'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {currentRoomData ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b bg-background">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={currentRoomData.avatar} />
                    <AvatarFallback>{currentRoomData.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">{currentRoomData.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {currentRoomData.isOnline ? (
                        <>
                          <div className="w-2 h-2 bg-green-500 rounded-full" />
                          <span>Online</span>
                        </>
                      ) : (
                        <span>Last seen recently</span>
                      )}
                      {typingUsers.length > 0 && (
                        <span className="text-primary">
                          {typingUsers.join(', ')} typing...
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {selectedMessages.length > 0 && (
                    <>
                      <Button variant="ghost" size="icon" onClick={handleDeleteMessages}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setSelectedMessages([])}>
                        <X className="h-4 w-4" />
                      </Button>
                      <Separator orientation="vertical" className="h-6" />
                    </>
                  )}
                  <Button variant="ghost" size="icon">
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Video className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Info className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {filteredMessages.map((message) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    isOwn={message.senderId === userId}
                    isSelected={selectedMessages.includes(message.id)}
                    onSelect={() => handleMessageSelect(message.id)}
                    onReply={() => handleReplyToMessage(message)}
                    onReaction={(emoji) => handleMessageReaction(message.id, emoji)}
                  />
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Reply Preview */}
            {replyingTo && (
              <div className="px-4 py-2 bg-muted/50 border-t">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Reply className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Replying to {replyingTo.senderName}
                    </span>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setReplyingTo(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm truncate mt-1">{replyingTo.content}</p>
              </div>
            )}

            {/* Message Input */}
            <div className="p-4 border-t bg-background">
              <div className="flex items-end gap-2">
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={handleLocationShare}>
                    <MapPin className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleVoiceRecording}
                    className={isRecording ? 'text-red-500' : ''}
                  >
                    {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </Button>
                </div>
                
                <div className="flex-1 relative">
                  <Input
                    placeholder="Type a message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="pr-10"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  >
                    <Smile className="h-4 w-4" />
                  </Button>
                </div>
                
                <Button onClick={handleSendMessage} disabled={!message.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileUpload}
              accept="image/*,audio/*,video/*,.pdf,.doc,.docx"
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Select a conversation to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Message Bubble Component
interface MessageBubbleProps {
  message: ChatMessage
  isOwn: boolean
  isSelected: boolean
  onSelect: () => void
  onReply: () => void
  onReaction: (emoji: string) => void
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwn,
  isSelected,
  onSelect,
  onReply,
  onReaction
}) => {
  const [showActions, setShowActions] = useState(false)

  const getStatusIcon = () => {
    switch (message.status) {
      case 'sending':
        return <Clock className="h-3 w-3 text-muted-foreground" />
      case 'sent':
        return <Check className="h-3 w-3 text-muted-foreground" />
      case 'delivered':
        return <CheckCheck className="h-3 w-3 text-muted-foreground" />
      case 'read':
        return <CheckCheck className="h-3 w-3 text-primary" />
      default:
        return null
    }
  }

  const renderMessageContent = () => {
    switch (message.type) {
      case 'image':
        return (
          <div className="max-w-xs">
            <img
              src={message.metadata?.imageUrl}
              alt={message.content}
              className="rounded-lg max-w-full h-auto"
            />
            {message.content !== message.metadata?.fileName && (
              <p className="mt-2 text-sm">{message.content}</p>
            )}
          </div>
        )
      
      case 'location':
        return (
          <div className="max-w-xs">
            <div className="bg-muted rounded-lg p-3 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium text-sm">Location</p>
                <p className="text-xs text-muted-foreground">
                  {message.metadata?.location?.address || 'Shared location'}
                </p>
              </div>
            </div>
          </div>
        )
      
      case 'voice':
        return (
          <div className="max-w-xs">
            <div className="bg-muted rounded-lg p-3 flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Play className="h-4 w-4" />
              </Button>
              <div className="flex-1">
                <div className="h-1 bg-primary/20 rounded-full">
                  <div className="h-1 bg-primary rounded-full w-1/3" />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {message.metadata?.duration}s
                </p>
              </div>
            </div>
          </div>
        )
      
      case 'file':
        return (
          <div className="max-w-xs">
            <div className="bg-muted rounded-lg p-3 flex items-center gap-2">
              <Paperclip className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">{message.metadata?.fileName}</p>
                <p className="text-xs text-muted-foreground">
                  {message.metadata?.fileSize ? `${(message.metadata.fileSize / 1024).toFixed(1)} KB` : ''}
                </p>
              </div>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <Download className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )
      
      default:
        return <p className="text-sm">{message.content}</p>
    }
  }

  return (
    <div
      className={`flex gap-2 ${isOwn ? 'justify-end' : 'justify-start'} ${
        isSelected ? 'bg-primary/10 -mx-2 px-2 py-1 rounded' : ''
      }`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {!isOwn && (
        <Avatar className="h-6 w-6 mt-1">
          <AvatarImage src={message.senderAvatar} />
          <AvatarFallback className="text-xs">
            {message.senderName.charAt(0)}
          </AvatarFallback>
        </Avatar>
      )}
      
      <div className={`max-w-[70%] ${isOwn ? 'order-2' : ''}`}>
        {!isOwn && (
          <p className="text-xs text-muted-foreground mb-1">{message.senderName}</p>
        )}
        
        <div
          className={`rounded-lg px-3 py-2 ${
            isOwn
              ? 'bg-primary text-primary-foreground ml-auto'
              : 'bg-muted'
          }`}
        >
          {renderMessageContent()}
          
          {/* Message reactions */}
          {message.reactions && message.reactions.length > 0 && (
            <div className="flex gap-1 mt-2">
              {message.reactions.map((reaction, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={() => onReaction(reaction.emoji)}
                >
                  {reaction.emoji} {reaction.users.length}
                </Button>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-1 mt-1">
          <span className="text-xs text-muted-foreground">
            {new Date(message.timestamp).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </span>
          {message.edited && (
            <span className="text-xs text-muted-foreground">• edited</span>
          )}
          {isOwn && getStatusIcon()}
        </div>
      </div>
      
      {/* Message actions */}
      {showActions && (
        <div className={`flex items-center gap-1 ${isOwn ? 'order-1' : ''}`}>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onSelect}>
            <input type="checkbox" checked={isSelected} readOnly />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onReply}>
            <Reply className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onReaction('👍')}>
            <Smile className="h-3 w-3" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={onReply}>
                <Reply className="h-4 w-4 mr-2" />
                Reply
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Forward className="h-4 w-4 mr-2" />
                Forward
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Star className="h-4 w-4 mr-2" />
                Star
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  )
}

export default EnhancedChat