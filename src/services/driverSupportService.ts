/**
 * Driver Support Service
 * Comprehensive support system for drivers including chat, help, feedback, and community features
 */

import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Types for driver support system
export interface SupportTicket {
  id: string;
  driverId: string;
  driverName: string;
  category: 'technical' | 'payment' | 'vehicle' | 'passenger' | 'app' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  subject: string;
  description: string;
  attachments?: string[];
  assignedAgent?: string;
  resolution?: string;
  satisfactionRating?: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  resolvedAt?: Timestamp;
}

export interface ChatMessage {
  id: string;
  ticketId: string;
  senderId: string;
  senderType: 'driver' | 'agent' | 'system';
  senderName: string;
  message: string;
  messageType: 'text' | 'image' | 'file' | 'system';
  timestamp: Timestamp;
  readBy: string[];
}

export interface ForumPost {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  category: 'general' | 'tips' | 'earnings' | 'technical' | 'announcements';
  title: string;
  content: string;
  tags: string[];
  likes: number;
  replies: number;
  views: number;
  isPinned: boolean;
  isLocked: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastReplyAt?: Timestamp;
}

export interface ForumReply {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  likes: number;
  parentReplyId?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface DriverFeedback {
  id: string;
  driverId: string;
  driverName: string;
  type: 'suggestion' | 'complaint' | 'compliment' | 'feature_request';
  category: 'app' | 'earnings' | 'support' | 'features' | 'other';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  status: 'submitted' | 'under_review' | 'planned' | 'implemented' | 'rejected';
  votes: number;
  adminResponse?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface DriverAchievement {
  id: string;
  driverId: string;
  achievementType: 'rating' | 'earnings' | 'rides' | 'safety' | 'efficiency' | 'community';
  title: string;
  description: string;
  badgeIcon: string;
  badgeColor: string;
  points: number;
  unlockedAt: Timestamp;
  isPublic: boolean;
}

export interface DriverReward {
  id: string;
  driverId: string;
  rewardType: 'bonus' | 'badge' | 'recognition' | 'gift' | 'discount';
  title: string;
  description: string;
  value?: number;
  code?: string;
  expiresAt?: Timestamp;
  claimedAt?: Timestamp;
  createdAt: Timestamp;
}

class DriverSupportService {
  // Support Ticket Management
  async createSupportTicket(ticketData: Omit<SupportTicket, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'support_tickets'), {
        ...ticketData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      // Send notification to support team
      await this.notifySupportTeam(docRef.id, ticketData);
      
      return docRef.id;
    } catch (error) {
      console.error('Error creating support ticket:', error);
      throw error;
    }
  }

  async updateSupportTicket(ticketId: string, updates: Partial<SupportTicket>): Promise<void> {
    try {
      await updateDoc(doc(db, 'support_tickets', ticketId), {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating support ticket:', error);
      throw error;
    }
  }

  async getDriverTickets(driverId: string): Promise<SupportTicket[]> {
    try {
      const q = query(
        collection(db, 'support_tickets'),
        where('driverId', '==', driverId),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as SupportTicket));
    } catch (error) {
      console.error('Error fetching driver tickets:', error);
      throw error;
    }
  }

  // Chat System
  async sendChatMessage(messageData: Omit<ChatMessage, 'id' | 'timestamp'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'chat_messages'), {
        ...messageData,
        timestamp: serverTimestamp()
      });
      
      return docRef.id;
    } catch (error) {
      console.error('Error sending chat message:', error);
      throw error;
    }
  }

  subscribeToTicketChat(ticketId: string, callback: (messages: ChatMessage[]) => void): () => void {
    const q = query(
      collection(db, 'chat_messages'),
      where('ticketId', '==', ticketId),
      orderBy('timestamp', 'asc')
    );
    
    return onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ChatMessage));
      callback(messages);
    });
  }

  // Forum System
  async createForumPost(postData: Omit<ForumPost, 'id' | 'likes' | 'replies' | 'views' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'forum_posts'), {
        ...postData,
        likes: 0,
        replies: 0,
        views: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      return docRef.id;
    } catch (error) {
      console.error('Error creating forum post:', error);
      throw error;
    }
  }

  async getForumPosts(category?: string, limit_count: number = 20): Promise<ForumPost[]> {
    try {
      let q = query(
        collection(db, 'forum_posts'),
        orderBy('isPinned', 'desc'),
        orderBy('lastReplyAt', 'desc'),
        limit(limit_count)
      );
      
      if (category) {
        q = query(
          collection(db, 'forum_posts'),
          where('category', '==', category),
          orderBy('isPinned', 'desc'),
          orderBy('lastReplyAt', 'desc'),
          limit(limit_count)
        );
      }
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ForumPost));
    } catch (error) {
      console.error('Error fetching forum posts:', error);
      throw error;
    }
  }

  async createForumReply(replyData: Omit<ForumReply, 'id' | 'likes' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'forum_replies'), {
        ...replyData,
        likes: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      // Update post reply count and last reply time
      await updateDoc(doc(db, 'forum_posts', replyData.postId), {
        replies: (await this.getPostReplyCount(replyData.postId)) + 1,
        lastReplyAt: serverTimestamp()
      });
      
      return docRef.id;
    } catch (error) {
      console.error('Error creating forum reply:', error);
      throw error;
    }
  }

  async getForumReplies(postId: string): Promise<ForumReply[]> {
    try {
      const q = query(
        collection(db, 'forum_replies'),
        where('postId', '==', postId),
        orderBy('createdAt', 'asc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ForumReply));
    } catch (error) {
      console.error('Error fetching forum replies:', error);
      throw error;
    }
  }

  // Feedback System
  async submitDriverFeedback(feedbackData: Omit<DriverFeedback, 'id' | 'votes' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'driver_feedback'), {
        ...feedbackData,
        votes: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      return docRef.id;
    } catch (error) {
      console.error('Error submitting driver feedback:', error);
      throw error;
    }
  }

  async getDriverFeedback(driverId?: string): Promise<DriverFeedback[]> {
    try {
      let q = query(
        collection(db, 'driver_feedback'),
        orderBy('votes', 'desc'),
        orderBy('createdAt', 'desc')
      );
      
      if (driverId) {
        q = query(
          collection(db, 'driver_feedback'),
          where('driverId', '==', driverId),
          orderBy('createdAt', 'desc')
        );
      }
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as DriverFeedback));
    } catch (error) {
      console.error('Error fetching driver feedback:', error);
      throw error;
    }
  }

  // Achievement and Reward System
  async awardAchievement(driverId: string, achievementData: Omit<DriverAchievement, 'id' | 'driverId' | 'unlockedAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'driver_achievements'), {
        ...achievementData,
        driverId,
        unlockedAt: serverTimestamp()
      });
      
      // Notify driver of new achievement
      await this.notifyDriverAchievement(driverId, achievementData);
      
      return docRef.id;
    } catch (error) {
      console.error('Error awarding achievement:', error);
      throw error;
    }
  }

  async getDriverAchievements(driverId: string): Promise<DriverAchievement[]> {
    try {
      const q = query(
        collection(db, 'driver_achievements'),
        where('driverId', '==', driverId),
        orderBy('unlockedAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as DriverAchievement));
    } catch (error) {
      console.error('Error fetching driver achievements:', error);
      throw error;
    }
  }

  async createDriverReward(rewardData: Omit<DriverReward, 'id' | 'createdAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'driver_rewards'), {
        ...rewardData,
        createdAt: serverTimestamp()
      });
      
      // Notify driver of new reward
      await this.notifyDriverReward(rewardData.driverId, rewardData);
      
      return docRef.id;
    } catch (error) {
      console.error('Error creating driver reward:', error);
      throw error;
    }
  }

  async getDriverRewards(driverId: string): Promise<DriverReward[]> {
    try {
      const q = query(
        collection(db, 'driver_rewards'),
        where('driverId', '==', driverId),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as DriverReward));
    } catch (error) {
      console.error('Error fetching driver rewards:', error);
      throw error;
    }
  }

  // Helper Methods
  private async getPostReplyCount(postId: string): Promise<number> {
    const q = query(
      collection(db, 'forum_replies'),
      where('postId', '==', postId)
    );
    const snapshot = await getDocs(q);
    return snapshot.size;
  }

  private async notifySupportTeam(ticketId: string, ticketData: any): Promise<void> {
    // Implementation for notifying support team
    console.log('Notifying support team of new ticket:', ticketId);
  }

  private async notifyDriverAchievement(driverId: string, achievement: any): Promise<void> {
    // Implementation for notifying driver of new achievement
    console.log('Notifying driver of new achievement:', driverId, achievement);
  }

  private async notifyDriverReward(driverId: string, reward: any): Promise<void> {
    // Implementation for notifying driver of new reward
    console.log('Notifying driver of new reward:', driverId, reward);
  }

  // Analytics and Insights
  async getSupportAnalytics(): Promise<{
    totalTickets: number;
    openTickets: number;
    averageResolutionTime: number;
    satisfactionRating: number;
    topCategories: { category: string; count: number }[];
  }> {
    try {
      const ticketsSnapshot = await getDocs(collection(db, 'support_tickets'));
      const tickets = ticketsSnapshot.docs.map(doc => doc.data() as SupportTicket);
      
      const totalTickets = tickets.length;
      const openTickets = tickets.filter(t => t.status === 'open' || t.status === 'in_progress').length;
      
      // Calculate average resolution time
      const resolvedTickets = tickets.filter(t => t.resolvedAt);
      const avgResolutionTime = resolvedTickets.length > 0 
        ? resolvedTickets.reduce((sum, ticket) => {
            const created = ticket.createdAt.toMillis();
            const resolved = ticket.resolvedAt!.toMillis();
            return sum + (resolved - created);
          }, 0) / resolvedTickets.length / (1000 * 60 * 60) // Convert to hours
        : 0;
      
      // Calculate satisfaction rating
      const ratedTickets = tickets.filter(t => t.satisfactionRating);
      const avgSatisfaction = ratedTickets.length > 0
        ? ratedTickets.reduce((sum, ticket) => sum + ticket.satisfactionRating!, 0) / ratedTickets.length
        : 0;
      
      // Top categories
      const categoryCount: { [key: string]: number } = {};
      tickets.forEach(ticket => {
        categoryCount[ticket.category] = (categoryCount[ticket.category] || 0) + 1;
      });
      
      const topCategories = Object.entries(categoryCount)
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      
      return {
        totalTickets,
        openTickets,
        averageResolutionTime: avgResolutionTime,
        satisfactionRating: avgSatisfaction,
        topCategories
      };
    } catch (error) {
      console.error('Error fetching support analytics:', error);
      throw error;
    }
  }
}

export const driverSupportService = new DriverSupportService();