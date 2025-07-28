import { addDays, format, isBefore, isAfter } from 'date-fns';

export interface GroupMember {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: 'organizer' | 'admin' | 'member';
  status: 'invited' | 'joined' | 'confirmed' | 'paid' | 'cancelled';
  joinedAt?: Date;
  paymentStatus: 'pending' | 'partial' | 'paid' | 'refunded';
  amountOwed: number;
  amountPaid: number;
  seatNumber?: number;
  specialRequests?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  preferences?: {
    seatPreference?: 'window' | 'aisle' | 'any';
    accessibilityNeeds?: string[];
    dietaryRestrictions?: string[];
  };
}

export interface GroupBooking {
  id: string;
  name: string;
  description?: string;
  organizerId: string;
  
  // Journey details
  pickupLocation: string;
  dropoffLocation: string;
  pickupTime: string;
  scheduledDate: Date;
  
  // Group settings
  maxMembers: number;
  isPublic: boolean;
  requireApproval: boolean;
  allowInvites: boolean;
  
  // Vehicle and capacity
  vehicleType: string;
  totalSeats: number;
  
  // Members
  members: GroupMember[];
  inviteCode: string;
  
  // Status and lifecycle
  status: 'draft' | 'open' | 'full' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  
  // Financial
  totalCost: number;
  totalPaid: number;
  costSplitting: {
    method: 'equal' | 'weighted' | 'custom';
    baseFare: number;
    perPersonFare?: number;
    customSplits?: Array<{
      memberId: string;
      amount: number;
      percentage?: number;
    }>;
  };
  
  // Payment settings
  paymentSettings: {
    collectUpfront: boolean;
    paymentDeadline?: Date;
    allowPartialPayments: boolean;
    refundPolicy: 'full' | 'partial' | 'none';
  };
  
  // Group rules
  groupRules: {
    cancellationPolicy?: string;
    latePolicy?: string;
    behaviorRules?: string;
    specialRequirements?: string;
  };
  
  // Communication settings
  communication: {
    enableGroupChat: boolean;
    allowMemberInvites: boolean;
    notifyOnJoin: boolean;
    notifyOnLeave: boolean;
    notifyOnPayment: boolean;
  };
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  bookingId?: string; // Actual ride booking ID when confirmed
}

export interface GroupInvitation {
  id: string;
  groupId: string;
  inviterId: string;
  inviteeEmail: string;
  inviteePhone?: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  inviteCode: string;
  sentAt: Date;
  respondedAt?: Date;
  expiresAt: Date;
  personalMessage?: string;
}

export interface GroupPayment {
  id: string;
  groupId: string;
  memberId: string;
  amount: number;
  paymentMethod: 'card' | 'cash' | 'account' | 'bank_transfer';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  transactionId?: string;
  processedAt?: Date;
  refundedAt?: Date;
  refundAmount?: number;
  notes?: string;
}

export interface GroupBookingStats {
  totalGroups: number;
  activeGroups: number;
  completedGroups: number;
  totalMembers: number;
  averageGroupSize: number;
  totalRevenue: number;
  averageCostPerPerson: number;
  popularDestinations: Array<{
    location: string;
    count: number;
  }>;
  memberRetentionRate: number;
}

export interface CostSplitCalculation {
  memberId: string;
  memberName: string;
  baseAmount: number;
  additionalCharges: number;
  discounts: number;
  totalAmount: number;
  percentage: number;
}

class GroupBookingService {
  private readonly INVITE_EXPIRY_DAYS = 7;
  private readonly MAX_GROUP_SIZE = 50;
  private readonly MIN_GROUP_SIZE = 2;
  private readonly BOOKING_FEE_PERCENTAGE = 0.05; // 5% booking fee

  /**
   * Generate a unique invite code for a group
   */
  generateInviteCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Create a new group booking
   */
  async createGroupBooking(
    organizerId: string,
    groupData: Omit<GroupBooking, 'id' | 'organizerId' | 'members' | 'inviteCode' | 'status' | 'totalCost' | 'totalPaid' | 'createdAt' | 'updatedAt'>
  ): Promise<GroupBooking> {
    const now = new Date();
    const inviteCode = this.generateInviteCode();
    
    // Create organizer as first member
    const organizer: GroupMember = {
      id: `member-${Date.now()}`,
      userId: organizerId,
      name: 'Organizer', // This would be fetched from user profile
      email: 'organizer@example.com', // This would be fetched from user profile
      role: 'organizer',
      status: 'confirmed',
      joinedAt: now,
      paymentStatus: 'pending',
      amountOwed: 0, // Will be calculated after cost splitting
      amountPaid: 0,
    };

    const group: GroupBooking = {
      id: `group-${Date.now()}`,
      organizerId,
      members: [organizer],
      inviteCode,
      status: 'draft',
      totalCost: groupData.costSplitting.baseFare,
      totalPaid: 0,
      createdAt: now,
      updatedAt: now,
      ...groupData,
    };

    // Calculate initial cost splitting
    this.recalculateCostSplitting(group);

    return group;
  }

  /**
   * Update an existing group booking
   */
  async updateGroupBooking(
    groupId: string,
    updates: Partial<GroupBooking>
  ): Promise<GroupBooking> {
    // In a real implementation, this would update the database
    const existingGroup = await this.getGroupBooking(groupId);
    
    const updatedGroup: GroupBooking = {
      ...existingGroup,
      ...updates,
      updatedAt: new Date(),
    };

    // Recalculate cost splitting if relevant fields changed
    if (updates.costSplitting || updates.members) {
      this.recalculateCostSplitting(updatedGroup);
    }

    return updatedGroup;
  }

  /**
   * Get a group booking by ID
   */
  async getGroupBooking(groupId: string): Promise<GroupBooking> {
    // Mock implementation - in real app, this would query the database
    throw new Error('Group not found');
  }

  /**
   * Get group booking by invite code
   */
  async getGroupBookingByInviteCode(inviteCode: string): Promise<GroupBooking> {
    // Mock implementation - in real app, this would query the database
    throw new Error('Group not found');
  }

  /**
   * Send invitations to join a group
   */
  async sendGroupInvitations(
    groupId: string,
    inviterId: string,
    invitations: Array<{ email: string; phone?: string; personalMessage?: string }>
  ): Promise<GroupInvitation[]> {
    const group = await this.getGroupBooking(groupId);
    const now = new Date();
    const expiresAt = addDays(now, this.INVITE_EXPIRY_DAYS);
    
    const groupInvitations: GroupInvitation[] = [];

    for (const invite of invitations) {
      // Check if user is already a member
      const existingMember = group.members.find(m => m.email === invite.email);
      if (existingMember) {
        continue; // Skip if already a member
      }

      const invitation: GroupInvitation = {
        id: `invite-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        groupId,
        inviterId,
        inviteeEmail: invite.email,
        inviteePhone: invite.phone,
        status: 'pending',
        inviteCode: group.inviteCode,
        sentAt: now,
        expiresAt,
        personalMessage: invite.personalMessage,
      };

      groupInvitations.push(invitation);

      // Send invitation email/SMS
      await this.sendInvitationNotification(invitation, group);
    }

    return groupInvitations;
  }

  /**
   * Send invitation notification
   */
  private async sendInvitationNotification(
    invitation: GroupInvitation,
    group: GroupBooking
  ): Promise<void> {
    // Mock implementation - in real app, this would send email/SMS
    console.log(`Sending invitation to ${invitation.inviteeEmail} for group ${group.name}`);
    
    const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL}/join-group/${invitation.inviteCode}`;
    
    // Email content would include:
    // - Group name and description
    // - Journey details (pickup, dropoff, date, time)
    // - Cost per person
    // - Invite link
    // - Expiry date
  }

  /**
   * Join a group using invite code
   */
  async joinGroup(
    inviteCode: string,
    userId: string,
    userDetails: {
      name: string;
      email: string;
      phone?: string;
      avatar?: string;
    }
  ): Promise<{ success: boolean; group?: GroupBooking; error?: string }> {
    try {
      const group = await this.getGroupBookingByInviteCode(inviteCode);
      
      // Validate group status
      if (group.status === 'cancelled' || group.status === 'completed') {
        return { success: false, error: 'This group is no longer accepting members' };
      }
      
      // Check if group is full
      if (group.members.length >= group.maxMembers) {
        return { success: false, error: 'This group is full' };
      }
      
      // Check if user is already a member
      const existingMember = group.members.find(m => m.userId === userId || m.email === userDetails.email);
      if (existingMember) {
        return { success: false, error: 'You are already a member of this group' };
      }

      // Create new member
      const newMember: GroupMember = {
        id: `member-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userId,
        name: userDetails.name,
        email: userDetails.email,
        phone: userDetails.phone,
        avatar: userDetails.avatar,
        role: 'member',
        status: group.requireApproval ? 'invited' : 'joined',
        joinedAt: new Date(),
        paymentStatus: 'pending',
        amountOwed: 0, // Will be calculated
        amountPaid: 0,
      };

      // Add member to group
      group.members.push(newMember);
      group.updatedAt = new Date();

      // Recalculate cost splitting
      this.recalculateCostSplitting(group);

      // Send notifications if enabled
      if (group.communication.notifyOnJoin) {
        await this.notifyGroupMembers(group, 'member_joined', {
          memberName: newMember.name,
          requiresApproval: group.requireApproval,
        });
      }

      return { success: true, group };
    } catch (error) {
      return { success: false, error: 'Failed to join group' };
    }
  }

  /**
   * Leave a group
   */
  async leaveGroup(
    groupId: string,
    userId: string,
    reason?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const group = await this.getGroupBooking(groupId);
      
      // Find member
      const memberIndex = group.members.findIndex(m => m.userId === userId);
      if (memberIndex === -1) {
        return { success: false, error: 'You are not a member of this group' };
      }

      const member = group.members[memberIndex];
      
      // Organizer cannot leave (must transfer ownership or cancel group)
      if (member.role === 'organizer') {
        return { success: false, error: 'Organizer cannot leave the group. Transfer ownership or cancel the group.' };
      }

      // Handle refunds if member has paid
      if (member.amountPaid > 0) {
        await this.processRefund(group, member, reason);
      }

      // Remove member from group
      group.members.splice(memberIndex, 1);
      group.updatedAt = new Date();

      // Recalculate cost splitting
      this.recalculateCostSplitting(group);

      // Send notifications if enabled
      if (group.communication.notifyOnLeave) {
        await this.notifyGroupMembers(group, 'member_left', {
          memberName: member.name,
          reason,
        });
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to leave group' };
    }
  }

  /**
   * Remove a member from the group
   */
  async removeMember(
    groupId: string,
    organizerId: string,
    memberId: string,
    reason?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const group = await this.getGroupBooking(groupId);
      
      // Verify organizer permissions
      const organizer = group.members.find(m => m.userId === organizerId && m.role === 'organizer');
      if (!organizer) {
        return { success: false, error: 'Only the organizer can remove members' };
      }

      // Find member to remove
      const memberIndex = group.members.findIndex(m => m.id === memberId);
      if (memberIndex === -1) {
        return { success: false, error: 'Member not found' };
      }

      const member = group.members[memberIndex];
      
      // Cannot remove organizer
      if (member.role === 'organizer') {
        return { success: false, error: 'Cannot remove the organizer' };
      }

      // Handle refunds if member has paid
      if (member.amountPaid > 0) {
        await this.processRefund(group, member, reason);
      }

      // Remove member from group
      group.members.splice(memberIndex, 1);
      group.updatedAt = new Date();

      // Recalculate cost splitting
      this.recalculateCostSplitting(group);

      // Send notification to removed member
      await this.notifyMemberRemoval(member, group, reason);

      // Send notifications to other members if enabled
      if (group.communication.notifyOnLeave) {
        await this.notifyGroupMembers(group, 'member_removed', {
          memberName: member.name,
          reason,
        });
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to remove member' };
    }
  }

  /**
   * Recalculate cost splitting for all members
   */
  private recalculateCostSplitting(group: GroupBooking): void {
    const activeMembers = group.members.filter(m => 
      m.status !== 'cancelled' && m.status !== 'invited'
    );

    if (activeMembers.length === 0) return;

    switch (group.costSplitting.method) {
      case 'equal':
        this.calculateEqualSplit(group, activeMembers);
        break;
      case 'weighted':
        this.calculateWeightedSplit(group, activeMembers);
        break;
      case 'custom':
        this.calculateCustomSplit(group, activeMembers);
        break;
    }
  }

  /**
   * Calculate equal cost split
   */
  private calculateEqualSplit(group: GroupBooking, activeMembers: GroupMember[]): void {
    const totalCost = group.costSplitting.baseFare;
    const perPersonCost = totalCost / activeMembers.length;
    
    group.costSplitting.perPersonFare = perPersonCost;
    
    activeMembers.forEach(member => {
      member.amountOwed = perPersonCost;
    });
  }

  /**
   * Calculate weighted cost split (based on seat preferences, etc.)
   */
  private calculateWeightedSplit(group: GroupBooking, activeMembers: GroupMember[]): void {
    // Mock implementation - in real app, this would consider various factors
    const totalCost = group.costSplitting.baseFare;
    const baseWeight = 1.0;
    
    // Calculate weights (example: premium seats cost more)
    const memberWeights = activeMembers.map(member => {
      let weight = baseWeight;
      
      // Add weight for special requests
      if (member.specialRequests) {
        weight += 0.1;
      }
      
      // Add weight for seat preferences
      if (member.preferences?.seatPreference === 'window') {
        weight += 0.05;
      }
      
      return { member, weight };
    });
    
    const totalWeight = memberWeights.reduce((sum, mw) => sum + mw.weight, 0);
    
    memberWeights.forEach(({ member, weight }) => {
      member.amountOwed = (totalCost * weight) / totalWeight;
    });
  }

  /**
   * Calculate custom cost split
   */
  private calculateCustomSplit(group: GroupBooking, activeMembers: GroupMember[]): void {
    if (!group.costSplitting.customSplits) return;
    
    group.costSplitting.customSplits.forEach(split => {
      const member = activeMembers.find(m => m.id === split.memberId);
      if (member) {
        member.amountOwed = split.amount;
      }
    });
  }

  /**
   * Process payment for a group member
   */
  async processPayment(
    groupId: string,
    memberId: string,
    amount: number,
    paymentMethod: 'card' | 'cash' | 'account' | 'bank_transfer',
    paymentDetails?: any
  ): Promise<GroupPayment> {
    const group = await this.getGroupBooking(groupId);
    const member = group.members.find(m => m.id === memberId);
    
    if (!member) {
      throw new Error('Member not found');
    }

    const payment: GroupPayment = {
      id: `payment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      groupId,
      memberId,
      amount,
      paymentMethod,
      status: 'processing',
      processedAt: new Date(),
    };

    try {
      // Process payment (mock implementation)
      await this.processPaymentTransaction(payment, paymentDetails);
      
      payment.status = 'completed';
      payment.transactionId = `txn-${Date.now()}`;
      
      // Update member payment status
      member.amountPaid += amount;
      
      if (member.amountPaid >= member.amountOwed) {
        member.paymentStatus = 'paid';
        member.status = 'paid';
      } else if (member.amountPaid > 0) {
        member.paymentStatus = 'partial';
      }

      // Update group totals
      group.totalPaid += amount;
      group.updatedAt = new Date();

      // Send notifications if enabled
      if (group.communication.notifyOnPayment) {
        await this.notifyGroupMembers(group, 'payment_received', {
          memberName: member.name,
          amount,
        });
      }

      return payment;
    } catch (error) {
      payment.status = 'failed';
      throw error;
    }
  }

  /**
   * Process payment transaction (mock implementation)
   */
  private async processPaymentTransaction(
    payment: GroupPayment,
    paymentDetails?: any
  ): Promise<void> {
    // Mock payment processing
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // In real implementation, this would integrate with payment providers
    // like Stripe, PayPal, etc.
  }

  /**
   * Process refund for a member
   */
  private async processRefund(
    group: GroupBooking,
    member: GroupMember,
    reason?: string
  ): Promise<void> {
    if (member.amountPaid === 0) return;

    let refundAmount = 0;
    
    switch (group.paymentSettings.refundPolicy) {
      case 'full':
        refundAmount = member.amountPaid;
        break;
      case 'partial':
        // Refund 80% of paid amount
        refundAmount = member.amountPaid * 0.8;
        break;
      case 'none':
        refundAmount = 0;
        break;
    }

    if (refundAmount > 0) {
      // Process refund (mock implementation)
      const refundPayment: GroupPayment = {
        id: `refund-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        groupId: group.id,
        memberId: member.id,
        amount: -refundAmount,
        paymentMethod: 'refund' as any,
        status: 'completed',
        processedAt: new Date(),
        refundedAt: new Date(),
        refundAmount,
        notes: reason,
      };

      // Update member status
      member.paymentStatus = 'refunded';
      member.amountPaid -= refundAmount;
      
      // Update group totals
      group.totalPaid -= refundAmount;
    }
  }

  /**
   * Confirm group booking and create actual ride booking
   */
  async confirmGroupBooking(groupId: string): Promise<{ success: boolean; bookingId?: string; error?: string }> {
    try {
      const group = await this.getGroupBooking(groupId);
      
      // Validate group can be confirmed
      const validation = this.validateGroupForConfirmation(group);
      if (!validation.isValid) {
        return { success: false, error: validation.error };
      }

      // Create actual ride booking
      const bookingId = await this.createRideBooking(group);
      
      // Update group status
      group.status = 'confirmed';
      group.bookingId = bookingId;
      group.updatedAt = new Date();

      // Notify all members
      await this.notifyGroupMembers(group, 'booking_confirmed', {
        bookingId,
        pickupTime: group.pickupTime,
        pickupLocation: group.pickupLocation,
      });

      return { success: true, bookingId };
    } catch (error) {
      return { success: false, error: 'Failed to confirm booking' };
    }
  }

  /**
   * Validate group for confirmation
   */
  private validateGroupForConfirmation(group: GroupBooking): { isValid: boolean; error?: string } {
    // Check minimum members
    const activeMembers = group.members.filter(m => m.status !== 'cancelled');
    if (activeMembers.length < this.MIN_GROUP_SIZE) {
      return { isValid: false, error: `Group needs at least ${this.MIN_GROUP_SIZE} members` };
    }

    // Check payment requirements
    if (group.paymentSettings.collectUpfront) {
      const unpaidMembers = activeMembers.filter(m => m.paymentStatus !== 'paid');
      if (unpaidMembers.length > 0) {
        return { isValid: false, error: 'All members must pay before confirmation' };
      }
    }

    // Check if booking date is in the future
    if (isBefore(group.scheduledDate, new Date())) {
      return { isValid: false, error: 'Cannot confirm booking for past date' };
    }

    return { isValid: true };
  }

  /**
   * Create actual ride booking from group booking
   */
  private async createRideBooking(group: GroupBooking): Promise<string> {
    // Mock implementation - in real app, this would create a booking
    // using the existing booking service
    
    const bookingData = {
      pickupLocation: group.pickupLocation,
      dropoffLocation: group.dropoffLocation,
      scheduledDate: group.scheduledDate,
      pickupTime: group.pickupTime,
      vehicleType: group.vehicleType,
      passengers: group.members.filter(m => m.status !== 'cancelled').length,
      groupBookingId: group.id,
      specialRequests: group.groupRules.specialRequirements,
    };

    // Return mock booking ID
    return `booking-${Date.now()}`;
  }

  /**
   * Cancel group booking
   */
  async cancelGroupBooking(
    groupId: string,
    organizerId: string,
    reason?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const group = await this.getGroupBooking(groupId);
      
      // Verify organizer permissions
      const organizer = group.members.find(m => m.userId === organizerId && m.role === 'organizer');
      if (!organizer) {
        return { success: false, error: 'Only the organizer can cancel the group' };
      }

      // Process refunds for all paid members
      for (const member of group.members) {
        if (member.amountPaid > 0) {
          await this.processRefund(group, member, reason);
        }
      }

      // Cancel actual booking if it exists
      if (group.bookingId) {
        // Cancel the ride booking
        // await bookingService.cancelBooking(group.bookingId, reason);
      }

      // Update group status
      group.status = 'cancelled';
      group.updatedAt = new Date();

      // Notify all members
      await this.notifyGroupMembers(group, 'booking_cancelled', {
        reason,
        refundsProcessed: true,
      });

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to cancel group booking' };
    }
  }

  /**
   * Get group booking statistics
   */
  async getGroupBookingStats(userId?: string): Promise<GroupBookingStats> {
    // Mock implementation - in real app, this would query the database
    return {
      totalGroups: 25,
      activeGroups: 8,
      completedGroups: 15,
      totalMembers: 180,
      averageGroupSize: 7.2,
      totalRevenue: 2450.00,
      averageCostPerPerson: 13.61,
      popularDestinations: [
        { location: 'London', count: 12 },
        { location: 'Manchester', count: 8 },
        { location: 'Birmingham', count: 5 },
      ],
      memberRetentionRate: 0.85,
    };
  }

  /**
   * Send notifications to group members
   */
  private async notifyGroupMembers(
    group: GroupBooking,
    eventType: string,
    data: any
  ): Promise<void> {
    // Mock implementation - in real app, this would send notifications
    console.log(`Notifying ${group.members.length} members about ${eventType}`, data);
  }

  /**
   * Send notification to removed member
   */
  private async notifyMemberRemoval(
    member: GroupMember,
    group: GroupBooking,
    reason?: string
  ): Promise<void> {
    // Mock implementation - in real app, this would send notification
    console.log(`Notifying ${member.name} about removal from ${group.name}`, { reason });
  }

  /**
   * Get cost split calculation for display
   */
  getCostSplitCalculation(group: GroupBooking): CostSplitCalculation[] {
    const activeMembers = group.members.filter(m => 
      m.status !== 'cancelled' && m.status !== 'invited'
    );

    return activeMembers.map(member => ({
      memberId: member.id,
      memberName: member.name,
      baseAmount: member.amountOwed,
      additionalCharges: 0, // Could include booking fees, etc.
      discounts: 0, // Could include member discounts
      totalAmount: member.amountOwed,
      percentage: group.costSplitting.baseFare > 0 
        ? (member.amountOwed / group.costSplitting.baseFare) * 100 
        : 0,
    }));
  }

  /**
   * Generate group booking report
   */
  async generateGroupReport(groupId: string): Promise<any> {
    const group = await this.getGroupBooking(groupId);
    const costSplit = this.getCostSplitCalculation(group);
    
    return {
      group,
      costSplit,
      summary: {
        totalMembers: group.members.length,
        confirmedMembers: group.members.filter(m => m.status === 'confirmed' || m.status === 'paid').length,
        totalCost: group.totalCost,
        totalPaid: group.totalPaid,
        outstandingAmount: group.totalCost - group.totalPaid,
        paymentProgress: group.totalCost > 0 ? (group.totalPaid / group.totalCost) * 100 : 0,
      },
      generatedAt: new Date(),
    };
  }
}

export const groupBookingService = new GroupBookingService();
export default groupBookingService;