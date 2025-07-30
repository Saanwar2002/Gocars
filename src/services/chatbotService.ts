import { db } from '@/lib/firebase';
import { collection, addDoc, query, where, orderBy, limit, getDocs, updateDoc, doc } from 'firebase/firestore';

export interface ChatSession {
  id: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  messages: ChatMessage[];
  context: SessionContext;
  satisfaction?: number;
  resolved: boolean;
  escalatedToHuman: boolean;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  type: 'user' | 'bot' | 'agent';
  content: string;
  timestamp: Date;
  intent?: string;
  confidence?: number;
  category?: string;
  suggestions?: string[];
  metadata?: Record<string, any>;
}

export interface SessionContext {
  userRole: 'passenger' | 'driver' | 'operator' | 'admin';
  currentPage?: string;
  activeBooking?: string;
  userPreferences?: UserPreferences;
  previousIssues?: string[];
  deviceInfo?: DeviceInfo;
}

export interface UserPreferences {
  language: string;
  communicationStyle: 'formal' | 'casual' | 'technical';
  preferredTopics: string[];
  timezone: string;
}

export interface DeviceInfo {
  platform: string;
  browser: string;
  screenSize: string;
  isMobile: boolean;
}

export interface IntentClassification {
  intent: string;
  confidence: number;
  category: string;
  entities: Entity[];
  suggestedActions: string[];
}

export interface Entity {
  type: 'location' | 'time' | 'number' | 'booking_id' | 'payment_method';
  value: string;
  confidence: number;
}

export interface KnowledgeBaseEntry {
  id: string;
  question: string;
  answer: string;
  category: string;
  tags: string[];
  popularity: number;
  lastUpdated: Date;
  variations: string[];
}

class ChatbotService {
  private knowledgeBase: KnowledgeBaseEntry[] = [];
  private intentPatterns: Map<string, RegExp[]> = new Map();
  private entityPatterns: Map<string, RegExp> = new Map();

  constructor() {
    this.initializeKnowledgeBase();
    this.initializeIntentPatterns();
    this.initializeEntityPatterns();
  }

  // Session Management
  async createChatSession(userId: string, context: SessionContext): Promise<string> {
    try {
      const session: Omit<ChatSession, 'id'> = {
        userId,
        startTime: new Date(),
        messages: [],
        context,
        resolved: false,
        escalatedToHuman: false,
      };

      const docRef = await addDoc(collection(db, 'chatSessions'), session);
      return docRef.id;
    } catch (error) {
      console.error('Error creating chat session:', error);
      throw new Error('Failed to create chat session');
    }
  }

  async endChatSession(sessionId: string, satisfaction?: number): Promise<void> {
    try {
      const sessionRef = doc(db, 'chatSessions', sessionId);
      await updateDoc(sessionRef, {
        endTime: new Date(),
        satisfaction,
        resolved: true,
      });
    } catch (error) {
      console.error('Error ending chat session:', error);
      throw new Error('Failed to end chat session');
    }
  }

  async getChatHistory(userId: string, limit_count: number = 10): Promise<ChatSession[]> {
    try {
      const q = query(
        collection(db, 'chatSessions'),
        where('userId', '==', userId),
        orderBy('startTime', 'desc'),
        limit(limit_count)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        startTime: doc.data().startTime.toDate(),
        endTime: doc.data().endTime?.toDate(),
      })) as ChatSession[];
    } catch (error) {
      console.error('Error getting chat history:', error);
      return [];
    }
  }

  // Message Processing
  async processMessage(
    sessionId: string,
    userMessage: string,
    context: SessionContext
  ): Promise<ChatMessage> {
    try {
      // Save user message
      await this.saveMessage(sessionId, {
        type: 'user',
        content: userMessage,
        timestamp: new Date(),
      });

      // Classify intent and extract entities
      const classification = await this.classifyIntent(userMessage, context);
      
      // Generate response based on intent
      const response = await this.generateResponse(classification, context, userMessage);
      
      // Save bot response
      const botMessage = await this.saveMessage(sessionId, {
        type: 'bot',
        content: response.content,
        timestamp: new Date(),
        intent: classification.intent,
        confidence: classification.confidence,
        category: classification.category,
        suggestions: response.suggestions,
        metadata: response.metadata,
      });

      return botMessage;
    } catch (error) {
      console.error('Error processing message:', error);
      
      // Return error response
      return await this.saveMessage(sessionId, {
        type: 'bot',
        content: "I'm sorry, I'm having trouble processing your request right now. Please try again or contact our support team for immediate assistance.",
        timestamp: new Date(),
        intent: 'error',
        confidence: 1.0,
        category: 'Error',
      });
    }
  }

  private async saveMessage(sessionId: string, messageData: Partial<ChatMessage>): Promise<ChatMessage> {
    const message: ChatMessage = {
      id: Date.now().toString(),
      sessionId,
      ...messageData,
    } as ChatMessage;

    try {
      await addDoc(collection(db, 'chatMessages'), message);
      return message;
    } catch (error) {
      console.error('Error saving message:', error);
      throw new Error('Failed to save message');
    }
  }

  // Intent Classification
  private async classifyIntent(message: string, context: SessionContext): Promise<IntentClassification> {
    const normalizedMessage = message.toLowerCase().trim();
    
    // Check for exact matches in knowledge base first
    const kbMatch = this.findKnowledgeBaseMatch(normalizedMessage);
    if (kbMatch) {
      return {
        intent: kbMatch.category.toLowerCase(),
        confidence: 0.95,
        category: kbMatch.category,
        entities: this.extractEntities(message),
        suggestedActions: this.getSuggestedActions(kbMatch.category),
      };
    }

    // Pattern-based intent classification
    for (const [intent, patterns] of this.intentPatterns.entries()) {
      for (const pattern of patterns) {
        if (pattern.test(normalizedMessage)) {
          return {
            intent,
            confidence: 0.8,
            category: this.getCategoryForIntent(intent),
            entities: this.extractEntities(message),
            suggestedActions: this.getSuggestedActions(intent),
          };
        }
      }
    }

    // Context-based classification
    if (context.activeBooking) {
      if (normalizedMessage.includes('where') || normalizedMessage.includes('status')) {
        return {
          intent: 'tracking',
          confidence: 0.7,
          category: 'Ride Status',
          entities: this.extractEntities(message),
          suggestedActions: ['check_ride_status', 'contact_driver'],
        };
      }
    }

    // Default classification
    return {
      intent: 'general',
      confidence: 0.3,
      category: 'General',
      entities: this.extractEntities(message),
      suggestedActions: ['show_help_menu', 'contact_support'],
    };
  }

  private extractEntities(message: string): Entity[] {
    const entities: Entity[] = [];
    
    for (const [type, pattern] of this.entityPatterns.entries()) {
      const matches = message.match(pattern);
      if (matches) {
        matches.forEach(match => {
          entities.push({
            type: type as any,
            value: match,
            confidence: 0.8,
          });
        });
      }
    }

    return entities;
  }

  // Response Generation
  private async generateResponse(
    classification: IntentClassification,
    context: SessionContext,
    originalMessage: string
  ): Promise<{
    content: string;
    suggestions: string[];
    metadata: Record<string, any>;
  }> {
    const { intent, category, entities } = classification;

    // Get response template based on intent
    const template = this.getResponseTemplate(intent, context);
    
    // Personalize response based on context
    const personalizedContent = this.personalizeResponse(template, context, entities);
    
    // Generate contextual suggestions
    const suggestions = this.generateSuggestions(intent, context);
    
    // Add metadata for analytics
    const metadata = {
      intent,
      category,
      entities,
      responseTemplate: template.id,
      personalized: template.personalized,
      contextFactors: this.getContextFactors(context),
    };

    return {
      content: personalizedContent,
      suggestions,
      metadata,
    };
  }

  private getResponseTemplate(intent: string, context: SessionContext): any {
    const templates: Record<string, any> = {
      booking: {
        id: 'booking_help',
        content: `I can help you book a ride! To get started, I'll need to know:

• Your pickup location
• Your destination  
• When you'd like to travel
• How many passengers

You can also use the 'Book Ride' button in the main app for a quick booking experience. Would you like me to guide you through the booking process?`,
        personalized: false,
      },
      
      tracking: {
        id: 'ride_tracking',
        content: context.activeBooking 
          ? `I can see you have an active booking. You can track your ride in real-time by:

• Viewing your driver's location on the map
• Checking the estimated arrival time
• Contacting your driver directly through the app

Your booking ID is ${context.activeBooking}. Would you like me to show you the current status?`
          : `I can help you track your ride! If you have an active booking, you can:

• View real-time driver location on the map
• See estimated arrival time  
• Contact your driver directly
• Get live updates on ride status

To check your current ride status, please go to the 'My Rides' section in the app.`,
        personalized: true,
      },

      payment: {
        id: 'payment_help',
        content: `I'm here to help with payment issues! Common payment topics include:

• Adding or updating payment methods
• Processing refunds for cancelled rides
• Understanding fare calculations
• Resolving payment failures
• Setting up automatic payments

What specific payment issue can I help you with today?`,
        personalized: false,
      },

      support: {
        id: 'issue_reporting',
        content: `I'm sorry to hear you're experiencing an issue. I can help you report problems such as:

• Driver or vehicle issues
• App technical problems
• Billing discrepancies  
• Safety concerns
• Lost items

For urgent safety issues, please use the emergency button in the app. For other issues, I can help you file a report or connect you with our support team.`,
        personalized: false,
      },

      cancellation: {
        id: 'cancellation_help',
        content: `I can help you with ride cancellations. Here's what you need to know:

• You can cancel rides from the 'My Rides' section
• Cancellation fees may apply depending on timing
• Free cancellation within 5 minutes of booking
• Refunds are processed automatically for eligible cancellations

Would you like me to guide you through cancelling a specific ride?`,
        personalized: false,
      },

      escalation: {
        id: 'human_agent',
        content: `I understand you'd like to speak with a human agent. I can connect you with our support team who are available 24/7.

Before I transfer you, could you briefly describe your issue? This will help our agents assist you more quickly.

Alternatively, I might be able to help resolve your question right now. What specific assistance do you need?`,
        personalized: false,
      },

      general: {
        id: 'general_help',
        content: `I'm here to help! I can assist you with:

🚗 **Booking & Rides**
• Book new rides
• Track current rides  
• Modify or cancel bookings

💳 **Payments**
• Add payment methods
• Process refunds
• Explain charges

🛠️ **Support**  
• Report issues
• Find lost items
• Technical help

👥 **Account**
• Update profile
• Manage preferences
• View ride history

What would you like help with?`,
        personalized: false,
      },
    };

    return templates[intent] || templates.general;
  }

  private personalizeResponse(template: any, context: SessionContext, entities: Entity[]): string {
    let content = template.content;

    // Replace placeholders with context data
    if (context.activeBooking) {
      content = content.replace('${activeBooking}', context.activeBooking);
    }

    // Add role-specific information
    if (context.userRole === 'driver') {
      content = content.replace('passenger', 'driver').replace('ride', 'trip');
    }

    return content;
  }

  private generateSuggestions(intent: string, context: SessionContext): string[] {
    const suggestionMap: Record<string, string[]> = {
      booking: ['Guide me through booking', 'Book for multiple stops', 'Schedule for later'],
      tracking: ['View current ride', 'Contact driver', 'Get ETA update'],
      payment: ['Add payment method', 'Request refund', 'Explain fare calculation'],
      support: ['Report driver issue', 'Technical problem', 'Lost item', 'Contact human agent'],
      cancellation: ['Cancel current ride', 'Understand cancellation policy', 'Request refund'],
      escalation: ['Connect to agent now', 'Describe my issue first', 'Emergency support'],
      general: ['Book a ride', 'Check ride status', 'Payment help', 'Report issue'],
    };

    const baseSuggestions = suggestionMap[intent] || suggestionMap.general;
    
    // Add context-specific suggestions
    const contextSuggestions: string[] = [];
    if (context.activeBooking) {
      contextSuggestions.push('Check current ride');
    }
    if (context.userRole === 'driver') {
      contextSuggestions.push('Driver help');
    }

    return [...baseSuggestions, ...contextSuggestions].slice(0, 4);
  }

  private getContextFactors(context: SessionContext): string[] {
    const factors: string[] = [];
    
    if (context.activeBooking) factors.push('has_active_booking');
    if (context.currentPage) factors.push(`on_${context.currentPage}_page`);
    factors.push(`${context.userRole}_role`);
    
    return factors;
  }

  // Knowledge Base Management
  private initializeKnowledgeBase(): void {
    this.knowledgeBase = [
      {
        id: '1',
        question: 'How do I book a ride?',
        answer: 'To book a ride, tap the "Book Ride" button, enter your pickup and destination, select your vehicle type, and confirm your booking.',
        category: 'Booking',
        tags: ['booking', 'ride', 'how-to'],
        popularity: 100,
        lastUpdated: new Date(),
        variations: ['book a ride', 'make a booking', 'request a ride'],
      },
      {
        id: '2',
        question: 'How do I cancel a booking?',
        answer: 'You can cancel your booking from the "My Rides" section. Tap on your active ride and select "Cancel Ride". Note that cancellation fees may apply.',
        category: 'Cancellation',
        tags: ['cancel', 'booking', 'refund'],
        popularity: 85,
        lastUpdated: new Date(),
        variations: ['cancel ride', 'cancel booking', 'cancel trip'],
      },
      // Add more knowledge base entries...
    ];
  }

  private initializeIntentPatterns(): void {
    this.intentPatterns.set('booking', [
      /\b(book|make|request|need|want)\s+(a\s+)?(ride|trip|taxi|car)\b/i,
      /\b(how\s+)?(to\s+)?(book|reserve|schedule)\b/i,
      /\b(pickup|pick\s+up|destination|going\s+to)\b/i,
    ]);

    this.intentPatterns.set('tracking', [
      /\b(where|status|track|find|locate)\s+(is\s+)?(my\s+)?(driver|ride|car|taxi)\b/i,
      /\b(eta|arrival|time|when)\s+(will|is)\b/i,
      /\b(driver\s+)?(location|position)\b/i,
    ]);

    this.intentPatterns.set('payment', [
      /\b(payment|pay|card|refund|charge|bill|fare|cost|price)\b/i,
      /\b(add\s+)?(payment\s+method|credit\s+card)\b/i,
      /\b(how\s+much|total|amount)\b/i,
    ]);

    this.intentPatterns.set('support', [
      /\b(issue|problem|complaint|report|help|support)\b/i,
      /\b(driver\s+)?(problem|issue|complaint)\b/i,
      /\b(lost\s+)?(item|phone|wallet|bag)\b/i,
    ]);

    this.intentPatterns.set('cancellation', [
      /\b(cancel|stop|abort)\s+(my\s+)?(ride|trip|booking)\b/i,
      /\b(cancellation\s+)?(policy|fee|charge)\b/i,
    ]);

    this.intentPatterns.set('escalation', [
      /\b(human|agent|person|representative|support\s+team)\b/i,
      /\b(speak\s+to|talk\s+to|connect\s+me)\b/i,
      /\b(transfer|escalate)\b/i,
    ]);
  }

  private initializeEntityPatterns(): void {
    this.entityPatterns.set('time', /\b(\d{1,2}:\d{2}|\d{1,2}\s*(am|pm)|now|today|tomorrow|tonight|morning|afternoon|evening)\b/gi);
    this.entityPatterns.set('location', /\b(\d+\s+[\w\s]+(?:street|st|avenue|ave|road|rd|boulevard|blvd|drive|dr|lane|ln))\b/gi);
    this.entityPatterns.set('booking_id', /\b([A-Z]{2}\d{6}|booking\s*#?\s*\w+)\b/gi);
    this.entityPatterns.set('number', /\b(\d+)\b/g);
  }

  private findKnowledgeBaseMatch(message: string): KnowledgeBaseEntry | null {
    for (const entry of this.knowledgeBase) {
      if (entry.variations.some(variation => message.includes(variation.toLowerCase()))) {
        return entry;
      }
    }
    return null;
  }

  private getCategoryForIntent(intent: string): string {
    const categoryMap: Record<string, string> = {
      booking: 'Booking',
      tracking: 'Ride Status',
      payment: 'Payment',
      support: 'Support',
      cancellation: 'Cancellation',
      escalation: 'Support',
      general: 'General',
    };
    return categoryMap[intent] || 'General';
  }

  private getSuggestedActions(intent: string): string[] {
    const actionMap: Record<string, string[]> = {
      booking: ['open_booking_form', 'show_vehicle_types', 'check_fare_estimate'],
      tracking: ['show_ride_map', 'contact_driver', 'get_eta'],
      payment: ['add_payment_method', 'view_fare_breakdown', 'request_refund'],
      support: ['file_report', 'contact_agent', 'view_faq'],
      cancellation: ['cancel_ride', 'view_policy', 'request_refund'],
      escalation: ['connect_agent', 'create_ticket', 'emergency_support'],
    };
    return actionMap[intent] || ['show_help_menu'];
  }

  // Analytics and Improvement
  async logInteraction(sessionId: string, intent: string, satisfaction?: number): Promise<void> {
    try {
      await addDoc(collection(db, 'chatAnalytics'), {
        sessionId,
        intent,
        satisfaction,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error('Error logging interaction:', error);
    }
  }

  async getPopularQuestions(limit_count: number = 10): Promise<KnowledgeBaseEntry[]> {
    return this.knowledgeBase
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, limit_count);
  }

  async updateKnowledgeBase(entry: Partial<KnowledgeBaseEntry>): Promise<void> {
    // In a real implementation, this would update the knowledge base
    console.log('Updating knowledge base:', entry);
  }
}

export const chatbotService = new ChatbotService();