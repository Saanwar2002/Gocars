import { issueCategorization } from './issueCategorization';
import { sentimentAnalysisService } from './sentimentAnalysisService';

export interface NLPResult {
  intent: string;
  entities: Entity[];
  confidence: number;
  sentiment: 'positive' | 'negative' | 'neutral';
  urgency: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  suggestedResponse: string;
  followUpQuestions: string[];
}

export interface Entity {
  type: 'location' | 'time' | 'person' | 'vehicle' | 'payment_method' | 'booking_id' | 'phone' | 'email';
  value: string;
  confidence: number;
  start: number;
  end: number;
}

export interface Intent {
  name: string;
  patterns: string[];
  responses: string[];
  entities: string[];
  followUpQuestions: string[];
  requiresHumanAgent: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

class NLPService {
  private intents: Intent[] = [
    {
      name: 'booking.create',
      patterns: [
        'book a ride', 'need a taxi', 'schedule a trip', 'reserve a car',
        'i want to book', 'can i get a ride', 'need transportation',
        'book me a cab', 'arrange a pickup', 'schedule pickup'
      ],
      responses: [
        "I'd be happy to help you book a ride! To get started, I'll need your pickup location and destination. Where would you like to be picked up?",
        "Let's get you a ride! Please provide your pickup location and where you'd like to go.",
        "I can help you book a ride right away. What's your pickup address?"
      ],
      entities: ['location', 'time'],
      followUpQuestions: [
        "What's your pickup location?",
        "Where would you like to go?",
        "When do you need the ride?",
        "How many passengers?"
      ],
      requiresHumanAgent: false,
      priority: 'medium'
    },
    {
      name: 'booking.status',
      patterns: [
        'where is my ride', 'ride status', 'where is my driver', 'eta',
        'how long until pickup', 'track my ride', 'driver location',
        'when will driver arrive', 'ride progress', 'trip status'
      ],
      responses: [
        "Let me check your ride status for you. I can see your current booking and provide real-time updates.",
        "I'll help you track your ride. Let me pull up your current booking information.",
        "I can provide you with live updates on your ride status and driver location."
      ],
      entities: ['booking_id'],
      followUpQuestions: [
        "What's your booking reference number?",
        "Can you provide your phone number for verification?",
        "Would you like me to contact your driver?"
      ],
      requiresHumanAgent: false,
      priority: 'high'
    },
    {
      name: 'booking.cancel',
      patterns: [
        'cancel my ride', 'cancel booking', 'dont need ride anymore',
        'cancel trip', 'cancel reservation', 'cancel my order',
        'i want to cancel', 'need to cancel', 'cancel please'
      ],
      responses: [
        "I can help you cancel your ride. Please note that cancellation fees may apply depending on the timing.",
        "I'll assist you with cancelling your booking. Let me check the cancellation policy for your ride.",
        "I can process your cancellation request. Would you like me to explain the cancellation terms first?"
      ],
      entities: ['booking_id'],
      followUpQuestions: [
        "What's your booking reference?",
        "Would you like to reschedule instead?",
        "Can you confirm the reason for cancellation?"
      ],
      requiresHumanAgent: false,
      priority: 'medium'
    },
    {
      name: 'payment.issue',
      patterns: [
        'payment problem', 'card declined', 'billing issue', 'overcharged',
        'wrong amount', 'refund request', 'payment failed', 'charge error',
        'billing error', 'payment not working', 'card not accepted'
      ],
      responses: [
        "I'm sorry you're experiencing a payment issue. I can help you resolve billing problems and process refund requests.",
        "Let me assist you with your payment concern. I can check your billing history and help resolve any discrepancies.",
        "I understand your payment concern. I can help verify charges and process refunds if needed."
      ],
      entities: ['payment_method', 'booking_id'],
      followUpQuestions: [
        "What specific payment issue are you experiencing?",
        "Can you provide the booking reference?",
        "Which payment method were you trying to use?"
      ],
      requiresHumanAgent: false,
      priority: 'high'
    },
    {
      name: 'driver.complaint',
      patterns: [
        'driver was rude', 'unprofessional driver', 'driver complaint',
        'bad driver', 'driver behavior', 'driver issue', 'report driver',
        'driver was late', 'driver problem', 'poor service'
      ],
      responses: [
        "I'm very sorry to hear about your experience with the driver. This is not the level of service we expect. Let me help you file a complaint.",
        "I apologize for the poor service you received. Driver behavior complaints are taken very seriously. I'll help you report this incident.",
        "Thank you for bringing this to our attention. I'll make sure your driver complaint is properly documented and investigated."
      ],
      entities: ['booking_id', 'person'],
      followUpQuestions: [
        "Can you provide details about what happened?",
        "What was your booking reference?",
        "Would you like to speak with a supervisor?"
      ],
      requiresHumanAgent: true,
      priority: 'high'
    },
    {
      name: 'emergency.help',
      patterns: [
        'emergency', 'help me', 'urgent', 'danger', 'unsafe', 'accident',
        'call police', 'need help now', 'emergency situation', 'in trouble',
        'not safe', 'scared', 'threatened', 'hurt', 'injured'
      ],
      responses: [
        "This sounds like an emergency situation. I'm connecting you immediately with our emergency response team. If you're in immediate danger, please call 911.",
        "I understand this is urgent. I'm escalating this to our emergency team right away. Please stay on the line.",
        "Emergency assistance is being dispatched. If you need immediate help, please contact emergency services at 911."
      ],
      entities: ['location', 'booking_id'],
      followUpQuestions: [
        "Are you in immediate danger?",
        "What's your current location?",
        "Do you need emergency services?"
      ],
      requiresHumanAgent: true,
      priority: 'critical'
    },
    {
      name: 'support.human',
      patterns: [
        'speak to human', 'talk to agent', 'human support', 'live agent',
        'customer service', 'speak to person', 'human help', 'real person',
        'transfer to agent', 'escalate', 'supervisor'
      ],
      responses: [
        "I'll connect you with one of our human support agents right away. They'll be able to provide personalized assistance.",
        "Let me transfer you to a live agent who can help you with your specific needs.",
        "I'm connecting you with our customer service team. Please hold while I find an available agent."
      ],
      entities: [],
      followUpQuestions: [
        "What specific issue would you like help with?",
        "Is this regarding a current booking?",
        "What's the best way for our agent to contact you?"
      ],
      requiresHumanAgent: true,
      priority: 'medium'
    },
    {
      name: 'vehicle.issue',
      patterns: [
        'car is dirty', 'vehicle problem', 'car broken', 'uncomfortable car',
        'vehicle complaint', 'car issue', 'dirty vehicle', 'car smells',
        'broken air conditioning', 'car maintenance', 'vehicle condition'
      ],
      responses: [
        "I'm sorry about the vehicle condition. This is not acceptable and I'll make sure this is reported to our fleet management team.",
        "Thank you for reporting the vehicle issue. I'll document this complaint and ensure the vehicle is inspected.",
        "I apologize for the poor vehicle condition. Let me file a report and arrange for immediate vehicle maintenance."
      ],
      entities: ['booking_id', 'vehicle'],
      followUpQuestions: [
        "What specific issue did you notice with the vehicle?",
        "What's your current booking reference?",
        "Would you like us to send a replacement vehicle?"
      ],
      requiresHumanAgent: false,
      priority: 'medium'
    },
    {
      name: 'app.technical',
      patterns: [
        'app not working', 'technical issue', 'app crash', 'login problem',
        'app error', 'cant use app', 'app frozen', 'technical support',
        'system error', 'app bug', 'loading issue', 'app slow'
      ],
      responses: [
        "I'm sorry you're experiencing technical difficulties with the app. Let me help you troubleshoot this issue.",
        "Technical issues can be frustrating. I'll guide you through some steps to resolve the app problem.",
        "I can help you with app technical issues. Let's try some troubleshooting steps to get you back on track."
      ],
      entities: [],
      followUpQuestions: [
        "What specific error are you seeing?",
        "What device are you using?",
        "When did the problem start?",
        "Have you tried restarting the app?"
      ],
      requiresHumanAgent: false,
      priority: 'medium'
    },
    {
      name: 'general.greeting',
      patterns: [
        'hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening',
        'greetings', 'howdy', 'whats up', 'how are you'
      ],
      responses: [
        "Hello! I'm your GoCars AI assistant. I'm here to help you with bookings, ride issues, payments, and any questions you might have. How can I assist you today?",
        "Hi there! Welcome to GoCars support. I can help you with ride bookings, tracking, payments, and more. What can I do for you?",
        "Greetings! I'm here to make your GoCars experience smooth and easy. Whether you need to book a ride, check status, or resolve an issue, I'm ready to help!"
      ],
      entities: [],
      followUpQuestions: [
        "How can I help you today?",
        "Are you looking to book a ride?",
        "Do you have any questions about our service?"
      ],
      requiresHumanAgent: false,
      priority: 'low'
    }
  ];

  // Main NLP processing function
  async processMessage(message: string, context?: any): Promise<NLPResult> {
    const normalizedMessage = message.toLowerCase().trim();
    
    // Detect intent
    const intent = this.detectIntent(normalizedMessage);
    
    // Extract entities
    const entities = this.extractEntities(normalizedMessage);
    
    // Analyze sentiment
    const sentimentAnalysis = await sentimentAnalysisService.analyzeSentiment(
      message, 
      'chat',
      context
    );
    
    // Categorize issue
    const categorizedIssue = await issueCategorization.categorizeIssue(message);
    
    // Generate response
    const suggestedResponse = this.generateResponse(intent, entities, context);
    
    // Get follow-up questions
    const followUpQuestions = this.getFollowUpQuestions(intent, entities);

    return {
      intent: intent.name,
      entities,
      confidence: intent.confidence,
      sentiment: sentimentAnalysis.sentiment,
      urgency: sentimentAnalysis.urgency,
      category: categorizedIssue.categories[0] || 'general',
      suggestedResponse,
      followUpQuestions,
    };
  }

  private detectIntent(message: string): { name: string; confidence: number; intent: Intent } {
    let bestMatch = { name: 'general.help', confidence: 0, intent: this.intents[0] };
    
    for (const intent of this.intents) {
      let score = 0;
      let matches = 0;
      
      for (const pattern of intent.patterns) {
        const patternWords = pattern.toLowerCase().split(' ');
        const messageWords = message.split(' ');
        
        // Calculate word overlap
        for (const patternWord of patternWords) {
          if (messageWords.some(messageWord => 
            messageWord.includes(patternWord) || patternWord.includes(messageWord)
          )) {
            matches++;
            score += patternWord.length > 4 ? 2 : 1; // Longer words get higher weight
          }
        }
        
        // Exact phrase matching gets bonus points
        if (message.includes(pattern)) {
          score += 10;
          matches += 5;
        }
      }
      
      // Calculate confidence based on matches and pattern complexity
      const confidence = Math.min((score / intent.patterns.length) * (matches / intent.patterns.length), 1);
      
      if (confidence > bestMatch.confidence) {
        bestMatch = { name: intent.name, confidence, intent };
      }
    }
    
    // Minimum confidence threshold
    if (bestMatch.confidence < 0.3) {
      const generalIntent = this.intents.find(i => i.name === 'general.help') || this.intents[0];
      bestMatch = { name: 'general.help', confidence: 0.3, intent: generalIntent };
    }
    
    return bestMatch;
  }

  private extractEntities(message: string): Entity[] {
    const entities: Entity[] = [];
    
    // Location patterns
    const locationPatterns = [
      /(?:from|at|to|near|in|on)\s+([A-Za-z\s,]+?)(?:\s|$|,|\.|!|\?)/gi,
      /(\d+\s+[A-Za-z\s]+(?:street|st|avenue|ave|road|rd|boulevard|blvd|drive|dr|lane|ln|way|place|pl))/gi,
      /(airport|station|mall|hospital|hotel|university|school)/gi
    ];
    
    locationPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(message)) !== null) {
        entities.push({
          type: 'location',
          value: match[1] || match[0],
          confidence: 0.8,
          start: match.index,
          end: match.index + match[0].length
        });
      }
    });
    
    // Time patterns
    const timePatterns = [
      /(?:at|by|around|before|after)\s+(\d{1,2}:\d{2}(?:\s*(?:am|pm))?)/gi,
      /(now|asap|immediately|urgent|today|tomorrow|tonight|morning|afternoon|evening)/gi,
      /(\d{1,2}\s*(?:am|pm))/gi,
      /(in\s+\d+\s+(?:minutes?|hours?|mins?))/gi
    ];
    
    timePatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(message)) !== null) {
        entities.push({
          type: 'time',
          value: match[1] || match[0],
          confidence: 0.7,
          start: match.index,
          end: match.index + match[0].length
        });
      }
    });
    
    // Booking ID patterns
    const bookingPatterns = [
      /(booking|trip|ride|order)?\s*(?:id|number|ref|reference)?\s*:?\s*([A-Z0-9]{3,}-?[A-Z0-9]{3,})/gi,
      /(TKT-\d+|BKG-\d+|RID-\d+)/gi
    ];
    
    bookingPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(message)) !== null) {
        entities.push({
          type: 'booking_id',
          value: match[2] || match[1],
          confidence: 0.9,
          start: match.index,
          end: match.index + match[0].length
        });
      }
    });
    
    // Phone number patterns
    const phonePattern = /(\+?1?[-.\s]?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4})/gi;
    let phoneMatch;
    while ((phoneMatch = phonePattern.exec(message)) !== null) {
      entities.push({
        type: 'phone',
        value: phoneMatch[1],
        confidence: 0.9,
        start: phoneMatch.index,
        end: phoneMatch.index + phoneMatch[0].length
      });
    }
    
    // Email patterns
    const emailPattern = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi;
    let emailMatch;
    while ((emailMatch = emailPattern.exec(message)) !== null) {
      entities.push({
        type: 'email',
        value: emailMatch[1],
        confidence: 0.95,
        start: emailMatch.index,
        end: emailMatch.index + emailMatch[0].length
      });
    }
    
    // Payment method patterns
    const paymentPatterns = [
      /(credit card|debit card|visa|mastercard|amex|american express|paypal|apple pay|google pay|cash)/gi
    ];
    
    paymentPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(message)) !== null) {
        entities.push({
          type: 'payment_method',
          value: match[0],
          confidence: 0.8,
          start: match.index,
          end: match.index + match[0].length
        });
      }
    });
    
    return entities;
  }

  private generateResponse(intentMatch: { name: string; confidence: number; intent: Intent }, entities: Entity[], context?: any): string {
    const intent = intentMatch.intent;
    
    // Select a random response from the intent's responses
    const baseResponse = intent.responses[Math.floor(Math.random() * intent.responses.length)];
    
    // Personalize response based on entities and context
    let personalizedResponse = baseResponse;
    
    // Add entity-specific information
    const locations = entities.filter(e => e.type === 'location');
    const times = entities.filter(e => e.type === 'time');
    const bookingIds = entities.filter(e => e.type === 'booking_id');
    
    if (locations.length > 0) {
      personalizedResponse += ` I can see you mentioned ${locations[0].value}.`;
    }
    
    if (times.length > 0) {
      personalizedResponse += ` You mentioned ${times[0].value} - I'll keep that timing in mind.`;
    }
    
    if (bookingIds.length > 0) {
      personalizedResponse += ` I'll look up booking ${bookingIds[0].value} for you.`;
    }
    
    // Add context-specific information
    if (context?.userRole === 'driver') {
      personalizedResponse += " As a driver, I can also help you with driver-specific features.";
    }
    
    if (context?.activeBooking) {
      personalizedResponse += " I can see you have an active booking - would you like me to check on that?";
    }
    
    return personalizedResponse;
  }

  private getFollowUpQuestions(intentMatch: { name: string; confidence: number; intent: Intent }, entities: Entity[]): string[] {
    const intent = intentMatch.intent;
    let questions = [...intent.followUpQuestions];
    
    // Filter out questions that are already answered by entities
    const entityTypes = entities.map(e => e.type);
    
    if (entityTypes.includes('location')) {
      questions = questions.filter(q => !q.toLowerCase().includes('location') && !q.toLowerCase().includes('where'));
    }
    
    if (entityTypes.includes('time')) {
      questions = questions.filter(q => !q.toLowerCase().includes('when') && !q.toLowerCase().includes('time'));
    }
    
    if (entityTypes.includes('booking_id')) {
      questions = questions.filter(q => !q.toLowerCase().includes('booking') && !q.toLowerCase().includes('reference'));
    }
    
    // Return up to 3 most relevant follow-up questions
    return questions.slice(0, 3);
  }

  // Get intent by name
  getIntent(name: string): Intent | undefined {
    return this.intents.find(intent => intent.name === name);
  }

  // Get all intents
  getAllIntents(): Intent[] {
    return [...this.intents];
  }

  // Add custom intent
  addIntent(intent: Intent): void {
    this.intents.push(intent);
  }

  // Update intent
  updateIntent(name: string, updates: Partial<Intent>): boolean {
    const index = this.intents.findIndex(intent => intent.name === name);
    if (index === -1) return false;
    
    this.intents[index] = { ...this.intents[index], ...updates };
    return true;
  }

  // Remove intent
  removeIntent(name: string): boolean {
    const index = this.intents.findIndex(intent => intent.name === name);
    if (index === -1) return false;
    
    this.intents.splice(index, 1);
    return true;
  }

  // Batch process messages for training/analysis
  async batchProcess(messages: Array<{ text: string; context?: any }>): Promise<NLPResult[]> {
    const results: NLPResult[] = [];
    
    for (const message of messages) {
      try {
        const result = await this.processMessage(message.text, message.context);
        results.push(result);
      } catch (error) {
        console.error('Error processing message:', error);
      }
    }
    
    return results;
  }

  // Get intent statistics
  getIntentStats(): Array<{ intent: string; priority: string; requiresHuman: boolean; patternCount: number }> {
    return this.intents.map(intent => ({
      intent: intent.name,
      priority: intent.priority,
      requiresHuman: intent.requiresHumanAgent,
      patternCount: intent.patterns.length
    }));
  }
}

export const nlpService = new NLPService();