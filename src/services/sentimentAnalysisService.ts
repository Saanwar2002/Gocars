import { db } from '@/lib/firebase';
import { collection, addDoc, query, where, orderBy, limit, getDocs } from 'firebase/firestore';

export interface SentimentAnalysis {
  id: string;
  text: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  confidence: number;
  emotions: EmotionScore[];
  keywords: string[];
  categories: string[];
  urgency: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  source: 'chat' | 'ticket' | 'review' | 'feedback';
  userId?: string;
  sessionId?: string;
  ticketId?: string;
}

export interface EmotionScore {
  emotion: 'joy' | 'anger' | 'fear' | 'sadness' | 'surprise' | 'disgust' | 'trust' | 'anticipation';
  score: number;
}

export interface SentimentTrend {
  date: Date;
  positive: number;
  negative: number;
  neutral: number;
  totalMessages: number;
  averageConfidence: number;
}

export interface CategorySentiment {
  category: string;
  positive: number;
  negative: number;
  neutral: number;
  totalCount: number;
  averageSentiment: number;
}

class SentimentAnalysisService {
  private positiveWords = [
    'good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'awesome', 'perfect',
    'love', 'like', 'enjoy', 'happy', 'satisfied', 'pleased', 'delighted', 'impressed',
    'helpful', 'friendly', 'professional', 'quick', 'fast', 'efficient', 'reliable',
    'clean', 'comfortable', 'safe', 'smooth', 'easy', 'convenient', 'affordable'
  ];

  private negativeWords = [
    'bad', 'terrible', 'awful', 'horrible', 'disgusting', 'hate', 'dislike', 'angry',
    'frustrated', 'disappointed', 'upset', 'annoyed', 'furious', 'outraged', 'disgusted',
    'slow', 'late', 'delayed', 'cancelled', 'broken', 'failed', 'error', 'problem',
    'issue', 'complaint', 'rude', 'unprofessional', 'dirty', 'unsafe', 'expensive',
    'overpriced', 'scam', 'fraud', 'cheat', 'steal', 'lost', 'missing', 'damaged'
  ];

  private urgencyKeywords = [
    'emergency', 'urgent', 'asap', 'immediately', 'now', 'help', 'stuck', 'stranded',
    'accident', 'crash', 'injured', 'hurt', 'danger', 'unsafe', 'threat', 'police',
    'hospital', 'ambulance', 'fire', 'robbery', 'assault', 'harassment', 'discrimination'
  ];

  private emotionKeywords = {
    joy: ['happy', 'excited', 'thrilled', 'delighted', 'cheerful', 'elated', 'joyful'],
    anger: ['angry', 'furious', 'mad', 'rage', 'outraged', 'livid', 'irate'],
    fear: ['scared', 'afraid', 'terrified', 'worried', 'anxious', 'nervous', 'panic'],
    sadness: ['sad', 'depressed', 'disappointed', 'upset', 'heartbroken', 'devastated'],
    surprise: ['surprised', 'shocked', 'amazed', 'astonished', 'stunned', 'bewildered'],
    disgust: ['disgusted', 'revolted', 'repulsed', 'sickened', 'appalled', 'horrified'],
    trust: ['trust', 'confident', 'reliable', 'dependable', 'faithful', 'loyal'],
    anticipation: ['excited', 'eager', 'hopeful', 'optimistic', 'expectant', 'looking forward']
  };

  private categoryKeywords = {
    booking: ['book', 'reserve', 'schedule', 'appointment', 'ride', 'trip', 'journey'],
    payment: ['pay', 'charge', 'bill', 'cost', 'price', 'refund', 'card', 'money'],
    driver: ['driver', 'chauffeur', 'operator', 'person', 'guy', 'man', 'woman'],
    vehicle: ['car', 'vehicle', 'taxi', 'cab', 'auto', 'transport', 'ride'],
    app: ['app', 'application', 'software', 'system', 'platform', 'interface', 'website'],
    service: ['service', 'support', 'help', 'assistance', 'customer', 'experience'],
    safety: ['safe', 'safety', 'secure', 'protection', 'emergency', 'danger', 'risk'],
    location: ['location', 'address', 'place', 'destination', 'pickup', 'drop', 'gps']
  };

  // Main analysis function
  async analyzeSentiment(
    text: string,
    source: SentimentAnalysis['source'],
    metadata?: {
      userId?: string;
      sessionId?: string;
      ticketId?: string;
    }
  ): Promise<SentimentAnalysis> {
    const normalizedText = text.toLowerCase().trim();
    
    // Basic sentiment analysis
    const sentiment = this.calculateSentiment(normalizedText);
    const confidence = this.calculateConfidence(normalizedText, sentiment);
    
    // Emotion analysis
    const emotions = this.analyzeEmotions(normalizedText);
    
    // Extract keywords and categories
    const keywords = this.extractKeywords(normalizedText);
    const categories = this.categorizeText(normalizedText);
    
    // Determine urgency
    const urgency = this.determineUrgency(normalizedText);

    const analysis: SentimentAnalysis = {
      id: Date.now().toString(),
      text,
      sentiment,
      confidence,
      emotions,
      keywords,
      categories,
      urgency,
      timestamp: new Date(),
      source,
      ...metadata,
    };

    // Save to database
    try {
      if (db) {
        await addDoc(collection(db, 'sentimentAnalysis'), analysis);
      }
    } catch (error) {
      console.error('Error saving sentiment analysis:', error);
    }

    return analysis;
  }

  private calculateSentiment(text: string): 'positive' | 'negative' | 'neutral' {
    let positiveScore = 0;
    let negativeScore = 0;

    // Count positive words
    this.positiveWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      const matches = text.match(regex);
      if (matches) {
        positiveScore += matches.length;
      }
    });

    // Count negative words
    this.negativeWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      const matches = text.match(regex);
      if (matches) {
        negativeScore += matches.length;
      }
    });

    // Apply negation handling
    const negationPattern = /\b(not|no|never|nothing|nobody|nowhere|neither|nor|none|hardly|scarcely|barely)\s+(\w+)/gi;
    const negations = text.match(negationPattern);
    if (negations) {
      negations.forEach(negation => {
        const word = negation.split(/\s+/)[1];
        if (this.positiveWords.includes(word)) {
          positiveScore -= 1;
          negativeScore += 1;
        } else if (this.negativeWords.includes(word)) {
          negativeScore -= 1;
          positiveScore += 1;
        }
      });
    }

    // Determine sentiment
    if (positiveScore > negativeScore) {
      return 'positive';
    } else if (negativeScore > positiveScore) {
      return 'negative';
    } else {
      return 'neutral';
    }
  }

  private calculateConfidence(text: string, sentiment: string): number {
    const words = text.split(/\s+/).length;
    let sentimentWords = 0;

    // Count sentiment-bearing words
    [...this.positiveWords, ...this.negativeWords].forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      const matches = text.match(regex);
      if (matches) {
        sentimentWords += matches.length;
      }
    });

    // Calculate confidence based on sentiment word density
    const density = sentimentWords / words;
    let confidence = Math.min(density * 2, 1); // Cap at 1.0

    // Boost confidence for strong sentiment indicators
    const strongPositive = ['excellent', 'amazing', 'fantastic', 'perfect', 'love'];
    const strongNegative = ['terrible', 'awful', 'horrible', 'hate', 'disgusting'];
    
    const hasStrongSentiment = [...strongPositive, ...strongNegative].some(word => 
      text.toLowerCase().includes(word)
    );
    
    if (hasStrongSentiment) {
      confidence = Math.min(confidence + 0.2, 1);
    }

    // Minimum confidence threshold
    return Math.max(confidence, 0.3);
  }

  private analyzeEmotions(text: string): EmotionScore[] {
    const emotions: EmotionScore[] = [];

    Object.entries(this.emotionKeywords).forEach(([emotion, keywords]) => {
      let score = 0;
      keywords.forEach(keyword => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        const matches = text.match(regex);
        if (matches) {
          score += matches.length;
        }
      });

      // Normalize score
      const normalizedScore = Math.min(score / keywords.length, 1);
      
      if (normalizedScore > 0) {
        emotions.push({
          emotion: emotion as EmotionScore['emotion'],
          score: normalizedScore,
        });
      }
    });

    // Sort by score and return top emotions
    return emotions.sort((a, b) => b.score - a.score).slice(0, 3);
  }

  private extractKeywords(text: string): string[] {
    const words = text.toLowerCase().split(/\s+/);
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'was', 'are', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them'];
    
    const keywords = words
      .filter(word => word.length > 3)
      .filter(word => !stopWords.includes(word))
      .filter(word => /^[a-zA-Z]+$/.test(word));

    // Count frequency and return most common
    const frequency: Record<string, number> = {};
    keywords.forEach(word => {
      frequency[word] = (frequency[word] || 0) + 1;
    });

    return Object.entries(frequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word);
  }

  private categorizeText(text: string): string[] {
    const categories: string[] = [];

    Object.entries(this.categoryKeywords).forEach(([category, keywords]) => {
      const hasKeyword = keywords.some(keyword => 
        text.toLowerCase().includes(keyword)
      );
      
      if (hasKeyword) {
        categories.push(category);
      }
    });

    return categories;
  }

  private determineUrgency(text: string): 'low' | 'medium' | 'high' | 'critical' {
    const criticalKeywords = ['emergency', 'accident', 'injured', 'danger', 'police', 'hospital'];
    const highKeywords = ['urgent', 'asap', 'immediately', 'stuck', 'stranded', 'help'];
    const mediumKeywords = ['problem', 'issue', 'complaint', 'frustrated', 'angry'];

    const hasCritical = criticalKeywords.some(keyword => 
      text.toLowerCase().includes(keyword)
    );
    
    if (hasCritical) return 'critical';

    const hasHigh = highKeywords.some(keyword => 
      text.toLowerCase().includes(keyword)
    );
    
    if (hasHigh) return 'high';

    const hasMedium = mediumKeywords.some(keyword => 
      text.toLowerCase().includes(keyword)
    );
    
    if (hasMedium) return 'medium';

    return 'low';
  }

  // Analytics and reporting functions
  async getSentimentTrends(
    startDate: Date,
    endDate: Date,
    source?: SentimentAnalysis['source']
  ): Promise<SentimentTrend[]> {
    try {
      if (!db) return [];

      let q = query(
        collection(db, 'sentimentAnalysis'),
        where('timestamp', '>=', startDate),
        where('timestamp', '<=', endDate),
        orderBy('timestamp', 'asc')
      );

      if (source) {
        q = query(q, where('source', '==', source));
      }

      const querySnapshot = await getDocs(q);
      const analyses = querySnapshot.docs.map(doc => ({
        ...doc.data(),
        timestamp: doc.data().timestamp.toDate(),
      })) as SentimentAnalysis[];

      // Group by date
      const dailyData: Record<string, SentimentTrend> = {};
      
      analyses.forEach(analysis => {
        const dateKey = analysis.timestamp.toDateString();
        
        if (!dailyData[dateKey]) {
          dailyData[dateKey] = {
            date: new Date(dateKey),
            positive: 0,
            negative: 0,
            neutral: 0,
            totalMessages: 0,
            averageConfidence: 0,
          };
        }

        const trend = dailyData[dateKey];
        trend[analysis.sentiment]++;
        trend.totalMessages++;
        trend.averageConfidence += analysis.confidence;
      });

      // Calculate averages
      Object.values(dailyData).forEach(trend => {
        trend.averageConfidence /= trend.totalMessages;
      });

      return Object.values(dailyData).sort((a, b) => a.date.getTime() - b.date.getTime());
    } catch (error) {
      console.error('Error getting sentiment trends:', error);
      return [];
    }
  }

  async getCategorySentiment(): Promise<CategorySentiment[]> {
    try {
      if (!db) return [];

      const q = query(
        collection(db, 'sentimentAnalysis'),
        orderBy('timestamp', 'desc'),
        limit(1000)
      );

      const querySnapshot = await getDocs(q);
      const analyses = querySnapshot.docs.map(doc => doc.data()) as SentimentAnalysis[];

      const categoryData: Record<string, CategorySentiment> = {};

      analyses.forEach(analysis => {
        analysis.categories.forEach(category => {
          if (!categoryData[category]) {
            categoryData[category] = {
              category,
              positive: 0,
              negative: 0,
              neutral: 0,
              totalCount: 0,
              averageSentiment: 0,
            };
          }

          const data = categoryData[category];
          data[analysis.sentiment]++;
          data.totalCount++;
        });
      });

      // Calculate average sentiment scores
      Object.values(categoryData).forEach(data => {
        data.averageSentiment = (data.positive - data.negative) / data.totalCount;
      });

      return Object.values(categoryData).sort((a, b) => b.totalCount - a.totalCount);
    } catch (error) {
      console.error('Error getting category sentiment:', error);
      return [];
    }
  }

  async getUrgentFeedback(limit_count: number = 50): Promise<SentimentAnalysis[]> {
    try {
      if (!db) return [];

      const q = query(
        collection(db, 'sentimentAnalysis'),
        where('urgency', 'in', ['high', 'critical']),
        orderBy('timestamp', 'desc'),
        limit(limit_count)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp.toDate(),
      })) as SentimentAnalysis[];
    } catch (error) {
      console.error('Error getting urgent feedback:', error);
      return [];
    }
  }

  async getNegativeFeedback(limit_count: number = 50): Promise<SentimentAnalysis[]> {
    try {
      if (!db) return [];

      const q = query(
        collection(db, 'sentimentAnalysis'),
        where('sentiment', '==', 'negative'),
        where('confidence', '>', 0.7),
        orderBy('timestamp', 'desc'),
        limit(limit_count)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp.toDate(),
      })) as SentimentAnalysis[];
    } catch (error) {
      console.error('Error getting negative feedback:', error);
      return [];
    }
  }

  // Real-time monitoring
  async monitorSentiment(callback: (analysis: SentimentAnalysis) => void): Promise<void> {
    // In a real implementation, this would set up a real-time listener
    // For now, we'll simulate with periodic checks
    setInterval(async () => {
      const recentFeedback = await this.getUrgentFeedback(5);
      recentFeedback.forEach(callback);
    }, 30000); // Check every 30 seconds
  }

  // Batch analysis for existing data
  async batchAnalyze(texts: Array<{
    text: string;
    source: SentimentAnalysis['source'];
    metadata?: any;
  }>): Promise<SentimentAnalysis[]> {
    const results: SentimentAnalysis[] = [];
    
    for (const item of texts) {
      try {
        const analysis = await this.analyzeSentiment(item.text, item.source, item.metadata);
        results.push(analysis);
      } catch (error) {
        console.error('Error in batch analysis:', error);
      }
    }

    return results;
  }
}

export const sentimentAnalysisService = new SentimentAnalysisService();