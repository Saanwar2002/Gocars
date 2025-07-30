import { db } from '@/lib/firebase';
import { collection, addDoc, query, where, orderBy, limit, getDocs } from 'firebase/firestore';

export interface IssueCategory {
  id: string;
  name: string;
  description: string;
  keywords: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  department: string;
  autoAssign: boolean;
  escalationRules: EscalationRule[];
  resolutionTemplates: string[];
}

export interface EscalationRule {
  condition: 'time' | 'sentiment' | 'keyword' | 'priority';
  threshold: number | string;
  action: 'escalate' | 'reassign' | 'notify';
  target: string;
}

export interface CategorizedIssue {
  id: string;
  originalText: string;
  categories: string[];
  confidence: number;
  suggestedActions: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  department: string;
  assignedAgent?: string;
  estimatedResolutionTime: number; // in minutes
  timestamp: Date;
}

export interface CategoryPerformance {
  category: string;
  totalIssues: number;
  resolvedIssues: number;
  averageResolutionTime: number;
  customerSatisfaction: number;
  escalationRate: number;
}

class IssueCategorization {
  private categories: IssueCategory[] = [
    {
      id: 'booking',
      name: 'Booking Issues',
      description: 'Problems related to ride booking and scheduling',
      keywords: [
        'book', 'booking', 'reserve', 'schedule', 'appointment', 'ride', 'trip',
        'cannot book', 'booking failed', 'schedule ride', 'reserve taxi',
        'booking error', 'appointment issue', 'trip planning'
      ],
      priority: 'medium',
      department: 'customer-service',
      autoAssign: true,
      escalationRules: [
        {
          condition: 'time',
          threshold: 30,
          action: 'escalate',
          target: 'supervisor'
        }
      ],
      resolutionTemplates: [
        'Check booking system status',
        'Verify user account permissions',
        'Review payment method validity',
        'Confirm vehicle availability'
      ]
    },
    {
      id: 'payment',
      name: 'Payment Issues',
      description: 'Payment processing, billing, and refund issues',
      keywords: [
        'payment', 'pay', 'charge', 'bill', 'cost', 'price', 'refund', 'card',
        'money', 'transaction', 'billing', 'invoice', 'receipt', 'overcharge',
        'payment failed', 'card declined', 'refund request', 'billing error'
      ],
      priority: 'high',
      department: 'billing',
      autoAssign: true,
      escalationRules: [
        {
          condition: 'keyword',
          threshold: 'fraud',
          action: 'escalate',
          target: 'security-team'
        },
        {
          condition: 'time',
          threshold: 15,
          action: 'notify',
          target: 'billing-supervisor'
        }
      ],
      resolutionTemplates: [
        'Verify payment method',
        'Check transaction history',
        'Process refund request',
        'Update billing information'
      ]
    },
    {
      id: 'driver',
      name: 'Driver Issues',
      description: 'Problems related to driver behavior, performance, or availability',
      keywords: [
        'driver', 'chauffeur', 'operator', 'rude', 'unprofessional', 'late',
        'no show', 'driver behavior', 'driver complaint', 'driver quality',
        'driver rating', 'driver feedback', 'driver issue'
      ],
      priority: 'high',
      department: 'operations',
      autoAssign: true,
      escalationRules: [
        {
          condition: 'sentiment',
          threshold: -0.7,
          action: 'escalate',
          target: 'operations-manager'
        }
      ],
      resolutionTemplates: [
        'Review driver performance',
        'Contact driver for feedback',
        'Schedule driver training',
        'Apply disciplinary action if needed'
      ]
    },
    {
      id: 'safety',
      name: 'Safety & Security',
      description: 'Safety concerns, security issues, and emergency situations',
      keywords: [
        'safety', 'unsafe', 'danger', 'emergency', 'accident', 'crash',
        'injured', 'hurt', 'threat', 'harassment', 'assault', 'robbery',
        'security', 'police', 'hospital', 'ambulance', 'fire'
      ],
      priority: 'critical',
      department: 'security',
      autoAssign: true,
      escalationRules: [
        {
          condition: 'priority',
          threshold: 'critical',
          action: 'escalate',
          target: 'security-team'
        }
      ],
      resolutionTemplates: [
        'Contact emergency services if needed',
        'Document incident details',
        'Notify relevant authorities',
        'Provide support resources'
      ]
    },
    {
      id: 'technical',
      name: 'Technical Issues',
      description: 'App functionality, system errors, and technical problems',
      keywords: [
        'app', 'application', 'software', 'system', 'error', 'bug', 'crash',
        'not working', 'broken', 'failed', 'loading', 'slow', 'frozen',
        'technical issue', 'system error', 'app crash', 'login problem'
      ],
      priority: 'medium',
      department: 'technical-support',
      autoAssign: true,
      escalationRules: [
        {
          condition: 'time',
          threshold: 45,
          action: 'escalate',
          target: 'tech-lead'
        }
      ],
      resolutionTemplates: [
        'Check system status',
        'Clear app cache and data',
        'Update app to latest version',
        'Restart device and retry'
      ]
    },
    {
      id: 'vehicle',
      name: 'Vehicle Issues',
      description: 'Vehicle condition, cleanliness, and equipment problems',
      keywords: [
        'car', 'vehicle', 'taxi', 'cab', 'dirty', 'clean', 'broken',
        'uncomfortable', 'air conditioning', 'heating', 'seat', 'seatbelt',
        'vehicle condition', 'car problem', 'vehicle maintenance'
      ],
      priority: 'medium',
      department: 'fleet-management',
      autoAssign: true,
      escalationRules: [
        {
          condition: 'keyword',
          threshold: 'unsafe',
          action: 'escalate',
          target: 'fleet-manager'
        }
      ],
      resolutionTemplates: [
        'Schedule vehicle inspection',
        'Arrange cleaning service',
        'Report maintenance issue',
        'Remove vehicle from service if needed'
      ]
    },
    {
      id: 'general',
      name: 'General Inquiry',
      description: 'General questions and information requests',
      keywords: [
        'question', 'help', 'information', 'how to', 'what is', 'where',
        'when', 'why', 'general', 'inquiry', 'support', 'assistance'
      ],
      priority: 'low',
      department: 'customer-service',
      autoAssign: true,
      escalationRules: [],
      resolutionTemplates: [
        'Provide requested information',
        'Direct to appropriate resources',
        'Offer additional assistance',
        'Follow up if needed'
      ]
    }
  ];

  // Main categorization function
  async categorizeIssue(text: string, metadata?: any): Promise<CategorizedIssue> {
    const normalizedText = text.toLowerCase().trim();
    
    // Find matching categories
    const categoryMatches = this.findMatchingCategories(normalizedText);
    
    // Calculate confidence and priority
    const confidence = this.calculateConfidence(normalizedText, categoryMatches);
    const priority = this.determinePriority(categoryMatches, normalizedText);
    
    // Determine department and suggested actions
    const department = this.getDepartment(categoryMatches);
    const suggestedActions = this.getSuggestedActions(categoryMatches);
    
    // Estimate resolution time
    const estimatedResolutionTime = this.estimateResolutionTime(priority, categoryMatches);
    
    // Auto-assign if enabled
    const assignedAgent = await this.autoAssignAgent(department, priority);

    const categorizedIssue: CategorizedIssue = {
      id: Date.now().toString(),
      originalText: text,
      categories: categoryMatches.map(match => match.category.name),
      confidence,
      suggestedActions,
      priority,
      department,
      assignedAgent,
      estimatedResolutionTime,
      timestamp: new Date(),
    };

    // Save to database
    try {
      if (db) {
        await addDoc(collection(db, 'categorizedIssues'), categorizedIssue);
      }
    } catch (error) {
      console.error('Error saving categorized issue:', error);
    }

    return categorizedIssue;
  }

  private findMatchingCategories(text: string): Array<{category: IssueCategory, score: number}> {
    const matches: Array<{category: IssueCategory, score: number}> = [];

    this.categories.forEach(category => {
      let score = 0;
      let keywordMatches = 0;

      category.keywords.forEach(keyword => {
        const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
        const keywordMatchCount = (text.match(regex) || []).length;
        
        if (keywordMatchCount > 0) {
          keywordMatches++;
          score += keywordMatchCount * (keyword.length > 5 ? 2 : 1); // Longer keywords get higher weight
        }
      });

      // Normalize score based on category keyword count
      if (keywordMatches > 0) {
        const normalizedScore = (score / category.keywords.length) * (keywordMatches / category.keywords.length);
        matches.push({ category, score: normalizedScore });
      }
    });

    // Sort by score and return top matches
    return matches.sort((a, b) => b.score - a.score).slice(0, 3);
  }

  private calculateConfidence(text: string, matches: Array<{category: IssueCategory, score: number}>): number {
    if (matches.length === 0) return 0.3; // Default low confidence

    const topScore = matches[0].score;
    const wordCount = text.split(/\s+/).length;
    
    // Base confidence on top match score and text length
    let confidence = Math.min(topScore * 0.5, 0.9);
    
    // Adjust for text length (longer text generally means more context)
    if (wordCount > 10) {
      confidence = Math.min(confidence + 0.1, 0.95);
    }
    
    // Boost confidence if multiple categories match (indicates clear categorization)
    if (matches.length > 1 && matches[1].score > 0.3) {
      confidence = Math.min(confidence + 0.05, 0.95);
    }

    return Math.max(confidence, 0.3); // Minimum confidence threshold
  }

  private determinePriority(
    matches: Array<{category: IssueCategory, score: number}>, 
    text: string
  ): 'low' | 'medium' | 'high' | 'critical' {
    if (matches.length === 0) return 'low';

    // Check for critical keywords
    const criticalKeywords = ['emergency', 'urgent', 'critical', 'asap', 'immediately', 'danger', 'unsafe'];
    const hasCriticalKeyword = criticalKeywords.some(keyword => text.includes(keyword));
    
    if (hasCriticalKeyword) return 'critical';

    // Use highest priority from matching categories
    const priorities = matches.map(match => match.category.priority);
    
    if (priorities.includes('critical')) return 'critical';
    if (priorities.includes('high')) return 'high';
    if (priorities.includes('medium')) return 'medium';
    
    return 'low';
  }

  private getDepartment(matches: Array<{category: IssueCategory, score: number}>): string {
    if (matches.length === 0) return 'customer-service';
    return matches[0].category.department;
  }

  private getSuggestedActions(matches: Array<{category: IssueCategory, score: number}>): string[] {
    if (matches.length === 0) return ['Review issue manually', 'Contact customer for clarification'];
    
    const actions = new Set<string>();
    
    matches.forEach(match => {
      match.category.resolutionTemplates.forEach(template => {
        actions.add(template);
      });
    });

    return Array.from(actions).slice(0, 5); // Limit to top 5 actions
  }

  private estimateResolutionTime(
    priority: 'low' | 'medium' | 'high' | 'critical',
    matches: Array<{category: IssueCategory, score: number}>
  ): number {
    // Base time estimates in minutes
    const baseTime = {
      critical: 15,
      high: 30,
      medium: 60,
      low: 120
    };

    let estimatedTime = baseTime[priority];

    // Adjust based on category complexity
    if (matches.length > 0) {
      const category = matches[0].category;
      
      // Some categories typically take longer
      const complexCategories = ['technical', 'payment', 'safety'];
      if (complexCategories.includes(category.id)) {
        estimatedTime *= 1.5;
      }
    }

    return Math.round(estimatedTime);
  }

  private async autoAssignAgent(department: string, priority: string): Promise<string | undefined> {
    // In a real implementation, this would query available agents
    // For now, return mock assignment based on department and priority
    
    const agentAssignments: Record<string, string[]> = {
      'customer-service': ['agent1', 'agent2', 'agent3'],
      'billing': ['billing-agent1', 'billing-agent2'],
      'technical-support': ['tech-agent1', 'tech-agent2'],
      'operations': ['ops-agent1', 'ops-agent2'],
      'security': ['security-agent1'],
      'fleet-management': ['fleet-agent1']
    };

    const availableAgents = agentAssignments[department] || agentAssignments['customer-service'];
    
    // For critical issues, try to assign to first available agent
    if (priority === 'critical' && availableAgents.length > 0) {
      return availableAgents[0];
    }

    // For other priorities, use round-robin or load balancing
    // This is simplified - in reality you'd check agent availability and workload
    return availableAgents[Math.floor(Math.random() * availableAgents.length)];
  }

  // Analytics and reporting methods
  async getCategoryPerformance(timeRange: { start: Date, end: Date }): Promise<CategoryPerformance[]> {
    try {
      if (!db) return [];

      const q = query(
        collection(db, 'categorizedIssues'),
        where('timestamp', '>=', timeRange.start),
        where('timestamp', '<=', timeRange.end),
        orderBy('timestamp', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const issues = querySnapshot.docs.map(doc => ({
        ...doc.data(),
        timestamp: doc.data().timestamp.toDate(),
      })) as CategorizedIssue[];

      // Group by category and calculate performance metrics
      const categoryStats: Record<string, CategoryPerformance> = {};

      issues.forEach(issue => {
        issue.categories.forEach(categoryName => {
          if (!categoryStats[categoryName]) {
            categoryStats[categoryName] = {
              category: categoryName,
              totalIssues: 0,
              resolvedIssues: 0,
              averageResolutionTime: 0,
              customerSatisfaction: 0,
              escalationRate: 0,
            };
          }

          categoryStats[categoryName].totalIssues++;
          // In a real implementation, you'd track resolution status
          categoryStats[categoryName].resolvedIssues += Math.random() > 0.2 ? 1 : 0; // Mock 80% resolution rate
        });
      });

      // Calculate averages and rates
      Object.values(categoryStats).forEach(stats => {
        stats.averageResolutionTime = Math.random() * 120 + 30; // Mock data
        stats.customerSatisfaction = Math.random() * 2 + 3; // Mock 3-5 rating
        stats.escalationRate = Math.random() * 20; // Mock 0-20% escalation
      });

      return Object.values(categoryStats);
    } catch (error) {
      console.error('Error getting category performance:', error);
      return [];
    }
  }

  async getTopIssues(limit: number = 10): Promise<Array<{category: string, count: number, trend: 'up' | 'down' | 'stable'}>> {
    try {
      if (!db) return [];

      const q = query(
        collection(db, 'categorizedIssues'),
        orderBy('timestamp', 'desc'),
        limit(1000)
      );

      const querySnapshot = await getDocs(q);
      const issues = querySnapshot.docs.map(doc => doc.data()) as CategorizedIssue[];

      // Count issues by category
      const categoryCounts: Record<string, number> = {};
      
      issues.forEach(issue => {
        issue.categories.forEach(category => {
          categoryCounts[category] = (categoryCounts[category] || 0) + 1;
        });
      });

      // Sort and add mock trend data
      return Object.entries(categoryCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, limit)
        .map(([category, count]) => ({
          category,
          count,
          trend: ['up', 'down', 'stable'][Math.floor(Math.random() * 3)] as 'up' | 'down' | 'stable'
        }));
    } catch (error) {
      console.error('Error getting top issues:', error);
      return [];
    }
  }

  // Get category by ID
  getCategoryById(id: string): IssueCategory | undefined {
    return this.categories.find(cat => cat.id === id);
  }

  // Get all categories
  getAllCategories(): IssueCategory[] {
    return [...this.categories];
  }

  // Add custom category
  addCategory(category: Omit<IssueCategory, 'id'>): IssueCategory {
    const newCategory: IssueCategory = {
      ...category,
      id: Date.now().toString(),
    };
    
    this.categories.push(newCategory);
    return newCategory;
  }

  // Update category
  updateCategory(id: string, updates: Partial<IssueCategory>): boolean {
    const index = this.categories.findIndex(cat => cat.id === id);
    if (index === -1) return false;
    
    this.categories[index] = { ...this.categories[index], ...updates };
    return true;
  }

  // Remove category
  removeCategory(id: string): boolean {
    const index = this.categories.findIndex(cat => cat.id === id);
    if (index === -1) return false;
    
    this.categories.splice(index, 1);
    return true;
  }
}

export const issueCategorization = new IssueCategorization();