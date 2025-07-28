import { addDays, addWeeks, addMonths, format, isBefore, isAfter, startOfDay, endOfDay } from 'date-fns';

export interface RecurringBooking {
  id: string;
  name: string;
  description?: string;
  pickupLocation: string;
  dropoffLocation: string;
  vehicleType: string;
  passengers: number;
  
  // Recurrence settings
  recurrenceType: 'daily' | 'weekly' | 'monthly' | 'custom';
  startDate: Date;
  endDate?: Date;
  maxOccurrences?: number;
  
  // Time settings
  pickupTime: string;
  timeFlexibility: number; // minutes
  
  // Weekly settings
  weeklyDays?: number[]; // 0 = Sunday, 6 = Saturday
  
  // Monthly settings
  monthlyType?: 'date' | 'weekday';
  monthlyDate?: number;
  monthlyWeekday?: number;
  monthlyWeek?: 'first' | 'second' | 'third' | 'fourth' | 'last';
  
  // Exception dates
  exceptions?: Date[];
  
  // Notification settings
  notifications: {
    enabled: boolean;
    reminderMinutes: number[];
    confirmationRequired: boolean;
    autoBook: boolean;
  };
  
  // Advanced settings
  advancedSettings: {
    priority: 'low' | 'medium' | 'high';
    allowDriverPreference: boolean;
    preferredDriverId?: string;
    notes?: string;
    paymentMethod: 'card' | 'cash' | 'account';
    maxWaitTime: number;
  };
  
  // Status
  isActive: boolean;
  isPaused: boolean;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

export interface ScheduledBooking {
  id: string;
  recurringBookingId: string;
  scheduledDate: Date;
  scheduledTime: string;
  status: 'scheduled' | 'confirmed' | 'booked' | 'completed' | 'cancelled' | 'skipped';
  bookingId?: string; // Actual booking ID when booked
  confirmationDeadline?: Date;
  remindersSent: number[];
  lastModified: Date;
  confirmationToken?: string;
  autoBookAttempts: number;
}

export interface BookingReminder {
  id: string;
  scheduledBookingId: string;
  reminderType: 'confirmation' | 'reminder' | 'auto_book';
  scheduledFor: Date;
  sent: boolean;
  sentAt?: Date;
  method: 'email' | 'sms' | 'push' | 'in_app';
}

export interface RecurringBookingStats {
  totalSchedules: number;
  activeSchedules: number;
  upcomingBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  successRate: number;
  averageConfirmationTime: number; // minutes
}

class RecurringBookingService {
  private readonly CONFIRMATION_DEADLINE_HOURS = 2; // Hours before pickup to require confirmation
  private readonly MAX_AUTO_BOOK_ATTEMPTS = 3;
  private readonly REMINDER_BUFFER_MINUTES = 5; // Buffer time for sending reminders

  /**
   * Generate all scheduled bookings for a recurring booking
   */
  generateScheduledBookings(
    recurringBooking: RecurringBooking,
    fromDate?: Date,
    toDate?: Date
  ): ScheduledBooking[] {
    const scheduledBookings: ScheduledBooking[] = [];
    const startDate = fromDate || startOfDay(recurringBooking.startDate);
    const endDate = toDate || (recurringBooking.endDate ? endOfDay(recurringBooking.endDate) : addMonths(startDate, 12));
    const maxOccurrences = recurringBooking.maxOccurrences || 365;
    
    let currentDate = new Date(startDate);
    let count = 0;
    
    while (count < maxOccurrences && !isAfter(currentDate, endDate)) {
      if (this.shouldScheduleOnDate(recurringBooking, currentDate)) {
        const scheduledBooking: ScheduledBooking = {
          id: `${recurringBooking.id}-${format(currentDate, 'yyyy-MM-dd')}`,
          recurringBookingId: recurringBooking.id,
          scheduledDate: new Date(currentDate),
          scheduledTime: recurringBooking.pickupTime,
          status: 'scheduled',
          confirmationDeadline: this.calculateConfirmationDeadline(currentDate, recurringBooking.pickupTime),
          remindersSent: [],
          lastModified: new Date(),
          autoBookAttempts: 0,
        };
        
        scheduledBookings.push(scheduledBooking);
        count++;
      }
      
      currentDate = this.getNextDate(currentDate, recurringBooking.recurrenceType);
      
      // Safety check to prevent infinite loops
      if (isAfter(currentDate, addMonths(startDate, 24))) {
        break;
      }
    }
    
    return scheduledBookings;
  }

  /**
   * Check if a booking should be scheduled on a specific date
   */
  private shouldScheduleOnDate(recurringBooking: RecurringBooking, date: Date): boolean {
    // Check if date is before start date
    if (isBefore(date, startOfDay(recurringBooking.startDate))) {
      return false;
    }
    
    // Check if date is after end date
    if (recurringBooking.endDate && isAfter(date, endOfDay(recurringBooking.endDate))) {
      return false;
    }
    
    // Check exceptions
    if (recurringBooking.exceptions) {
      const isException = recurringBooking.exceptions.some(exception =>
        format(exception, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
      );
      if (isException) {
        return false;
      }
    }
    
    // Check recurrence pattern
    switch (recurringBooking.recurrenceType) {
      case 'daily':
        return true;
        
      case 'weekly':
        if (!recurringBooking.weeklyDays || recurringBooking.weeklyDays.length === 0) {
          return false;
        }
        return recurringBooking.weeklyDays.includes(date.getDay());
        
      case 'monthly':
        if (recurringBooking.monthlyType === 'date') {
          const targetDate = recurringBooking.monthlyDate || recurringBooking.startDate.getDate();
          return date.getDate() === targetDate;
        } else if (recurringBooking.monthlyType === 'weekday') {
          const startWeekday = recurringBooking.startDate.getDay();
          const startWeekOfMonth = Math.ceil(recurringBooking.startDate.getDate() / 7);
          const currentWeekOfMonth = Math.ceil(date.getDate() / 7);
          
          return date.getDay() === startWeekday && currentWeekOfMonth === startWeekOfMonth;
        }
        return false;
        
      default:
        return false;
    }
  }

  /**
   * Get the next date based on recurrence type
   */
  private getNextDate(currentDate: Date, recurrenceType: string): Date {
    switch (recurrenceType) {
      case 'daily':
        return addDays(currentDate, 1);
      case 'weekly':
        return addDays(currentDate, 1);
      case 'monthly':
        return addDays(currentDate, 1);
      default:
        return addDays(currentDate, 1);
    }
  }

  /**
   * Calculate confirmation deadline for a scheduled booking
   */
  private calculateConfirmationDeadline(date: Date, time: string): Date {
    const [hours, minutes] = time.split(':').map(Number);
    const pickupDateTime = new Date(date);
    pickupDateTime.setHours(hours, minutes, 0, 0);
    
    // Confirmation deadline is 2 hours before pickup
    return new Date(pickupDateTime.getTime() - (this.CONFIRMATION_DEADLINE_HOURS * 60 * 60 * 1000));
  }

  /**
   * Generate reminders for scheduled bookings
   */
  generateReminders(scheduledBookings: ScheduledBooking[], recurringBooking: RecurringBooking): BookingReminder[] {
    const reminders: BookingReminder[] = [];
    
    if (!recurringBooking.notifications.enabled) {
      return reminders;
    }
    
    scheduledBookings.forEach(booking => {
      const [hours, minutes] = booking.scheduledTime.split(':').map(Number);
      const pickupDateTime = new Date(booking.scheduledDate);
      pickupDateTime.setHours(hours, minutes, 0, 0);
      
      // Generate confirmation reminder if required
      if (recurringBooking.notifications.confirmationRequired && booking.confirmationDeadline) {
        reminders.push({
          id: `${booking.id}-confirmation`,
          scheduledBookingId: booking.id,
          reminderType: 'confirmation',
          scheduledFor: new Date(booking.confirmationDeadline.getTime() - (30 * 60 * 1000)), // 30 min before deadline
          sent: false,
          method: 'push',
        });
      }
      
      // Generate reminder notifications
      recurringBooking.notifications.reminderMinutes.forEach(minutes => {
        const reminderTime = new Date(pickupDateTime.getTime() - (minutes * 60 * 1000));
        
        // Only create reminder if it's in the future
        if (isAfter(reminderTime, new Date())) {
          reminders.push({
            id: `${booking.id}-reminder-${minutes}`,
            scheduledBookingId: booking.id,
            reminderType: 'reminder',
            scheduledFor: reminderTime,
            sent: false,
            method: 'push',
          });
        }
      });
      
      // Generate auto-book reminder if enabled
      if (recurringBooking.notifications.autoBook) {
        const autoBookTime = new Date(pickupDateTime.getTime() - (60 * 60 * 1000)); // 1 hour before
        
        if (isAfter(autoBookTime, new Date())) {
          reminders.push({
            id: `${booking.id}-autobook`,
            scheduledBookingId: booking.id,
            reminderType: 'auto_book',
            scheduledFor: autoBookTime,
            sent: false,
            method: 'in_app',
          });
        }
      }
    });
    
    return reminders.sort((a, b) => a.scheduledFor.getTime() - b.scheduledFor.getTime());
  }

  /**
   * Process pending reminders and notifications
   */
  async processPendingReminders(reminders: BookingReminder[]): Promise<void> {
    const now = new Date();
    const pendingReminders = reminders.filter(reminder => 
      !reminder.sent && 
      isBefore(reminder.scheduledFor, now) &&
      isAfter(reminder.scheduledFor, new Date(now.getTime() - (this.REMINDER_BUFFER_MINUTES * 60 * 1000)))
    );
    
    for (const reminder of pendingReminders) {
      try {
        await this.sendReminder(reminder);
        reminder.sent = true;
        reminder.sentAt = new Date();
      } catch (error) {
        console.error(`Failed to send reminder ${reminder.id}:`, error);
      }
    }
  }

  /**
   * Send a reminder notification
   */
  private async sendReminder(reminder: BookingReminder): Promise<void> {
    switch (reminder.reminderType) {
      case 'confirmation':
        await this.sendConfirmationReminder(reminder);
        break;
      case 'reminder':
        await this.sendBookingReminder(reminder);
        break;
      case 'auto_book':
        await this.processAutoBook(reminder);
        break;
    }
  }

  /**
   * Send confirmation reminder
   */
  private async sendConfirmationReminder(reminder: BookingReminder): Promise<void> {
    // Implementation would send push notification, email, or SMS
    console.log(`Sending confirmation reminder for booking ${reminder.scheduledBookingId}`);
    
    // Example push notification payload
    const notification = {
      title: 'Confirm Your Scheduled Ride',
      body: 'Please confirm your upcoming ride or it will be automatically cancelled.',
      data: {
        type: 'confirmation_required',
        scheduledBookingId: reminder.scheduledBookingId,
        action: 'confirm_booking',
      },
    };
    
    // Send notification via push service
    // await pushNotificationService.send(userId, notification);
  }

  /**
   * Send booking reminder
   */
  private async sendBookingReminder(reminder: BookingReminder): Promise<void> {
    console.log(`Sending booking reminder for booking ${reminder.scheduledBookingId}`);
    
    const notification = {
      title: 'Upcoming Ride Reminder',
      body: 'Your scheduled ride is coming up soon.',
      data: {
        type: 'ride_reminder',
        scheduledBookingId: reminder.scheduledBookingId,
      },
    };
    
    // Send notification
    // await pushNotificationService.send(userId, notification);
  }

  /**
   * Process auto-booking
   */
  private async processAutoBook(reminder: BookingReminder): Promise<void> {
    console.log(`Processing auto-book for booking ${reminder.scheduledBookingId}`);
    
    try {
      // Attempt to create actual booking
      // const bookingResult = await bookingService.createBooking(scheduledBooking);
      
      // Update scheduled booking status
      // await this.updateScheduledBookingStatus(reminder.scheduledBookingId, 'booked', bookingResult.id);
      
      // Send confirmation notification
      const notification = {
        title: 'Ride Automatically Booked',
        body: 'Your scheduled ride has been automatically booked.',
        data: {
          type: 'auto_booked',
          scheduledBookingId: reminder.scheduledBookingId,
        },
      };
      
      // await pushNotificationService.send(userId, notification);
    } catch (error) {
      console.error(`Auto-book failed for ${reminder.scheduledBookingId}:`, error);
      
      // Send failure notification
      const notification = {
        title: 'Auto-Booking Failed',
        body: 'We couldn\'t automatically book your ride. Please book manually.',
        data: {
          type: 'auto_book_failed',
          scheduledBookingId: reminder.scheduledBookingId,
        },
      };
      
      // await pushNotificationService.send(userId, notification);
    }
  }

  /**
   * Confirm a scheduled booking
   */
  async confirmScheduledBooking(scheduledBookingId: string, confirmationToken?: string): Promise<boolean> {
    try {
      // Validate confirmation token if provided
      if (confirmationToken) {
        // Validate token logic here
      }
      
      // Update booking status
      // await this.updateScheduledBookingStatus(scheduledBookingId, 'confirmed');
      
      // Create actual booking
      // const bookingResult = await bookingService.createBooking(scheduledBooking);
      
      return true;
    } catch (error) {
      console.error(`Failed to confirm booking ${scheduledBookingId}:`, error);
      return false;
    }
  }

  /**
   * Cancel a scheduled booking
   */
  async cancelScheduledBooking(scheduledBookingId: string, reason?: string): Promise<boolean> {
    try {
      // Update booking status
      // await this.updateScheduledBookingStatus(scheduledBookingId, 'cancelled');
      
      // If actual booking exists, cancel it
      // if (scheduledBooking.bookingId) {
      //   await bookingService.cancelBooking(scheduledBooking.bookingId, reason);
      // }
      
      return true;
    } catch (error) {
      console.error(`Failed to cancel booking ${scheduledBookingId}:`, error);
      return false;
    }
  }

  /**
   * Modify a recurring booking
   */
  async modifyRecurringBooking(
    recurringBookingId: string,
    updates: Partial<RecurringBooking>,
    affectFutureOnly: boolean = true
  ): Promise<boolean> {
    try {
      // Update recurring booking
      // await this.updateRecurringBooking(recurringBookingId, updates);
      
      if (affectFutureOnly) {
        // Only affect future scheduled bookings
        const cutoffDate = new Date();
        // await this.updateFutureScheduledBookings(recurringBookingId, cutoffDate, updates);
      } else {
        // Regenerate all scheduled bookings
        // await this.regenerateScheduledBookings(recurringBookingId);
      }
      
      return true;
    } catch (error) {
      console.error(`Failed to modify recurring booking ${recurringBookingId}:`, error);
      return false;
    }
  }

  /**
   * Get statistics for recurring bookings
   */
  async getRecurringBookingStats(userId: string, dateRange?: { from: Date; to: Date }): Promise<RecurringBookingStats> {
    // Mock implementation - in real app, this would query the database
    return {
      totalSchedules: 5,
      activeSchedules: 3,
      upcomingBookings: 12,
      completedBookings: 45,
      cancelledBookings: 3,
      successRate: 93.75,
      averageConfirmationTime: 15,
    };
  }

  /**
   * Get upcoming scheduled bookings for a user
   */
  async getUpcomingScheduledBookings(
    userId: string,
    limit: number = 10,
    daysAhead: number = 30
  ): Promise<ScheduledBooking[]> {
    const now = new Date();
    const endDate = addDays(now, daysAhead);
    
    // Mock implementation - in real app, this would query the database
    const mockBookings: ScheduledBooking[] = [
      {
        id: 'sb-1',
        recurringBookingId: 'rb-1',
        scheduledDate: addDays(now, 1),
        scheduledTime: '09:00',
        status: 'scheduled',
        confirmationDeadline: addDays(now, 1),
        remindersSent: [],
        lastModified: now,
        autoBookAttempts: 0,
      },
      {
        id: 'sb-2',
        recurringBookingId: 'rb-1',
        scheduledDate: addDays(now, 2),
        scheduledTime: '09:00',
        status: 'confirmed',
        confirmationDeadline: addDays(now, 2),
        remindersSent: [60],
        lastModified: now,
        autoBookAttempts: 0,
      },
    ];
    
    return mockBookings.slice(0, limit);
  }

  /**
   * Validate recurring booking configuration
   */
  validateRecurringBooking(recurringBooking: Partial<RecurringBooking>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Basic validation
    if (!recurringBooking.name || recurringBooking.name.length < 3) {
      errors.push('Schedule name must be at least 3 characters');
    }
    
    if (!recurringBooking.pickupLocation) {
      errors.push('Pickup location is required');
    }
    
    if (!recurringBooking.dropoffLocation) {
      errors.push('Drop-off location is required');
    }
    
    if (!recurringBooking.pickupTime || !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(recurringBooking.pickupTime)) {
      errors.push('Valid pickup time is required');
    }
    
    // Recurrence validation
    if (recurringBooking.recurrenceType === 'weekly' && (!recurringBooking.weeklyDays || recurringBooking.weeklyDays.length === 0)) {
      errors.push('At least one day must be selected for weekly recurrence');
    }
    
    if (recurringBooking.recurrenceType === 'monthly' && !recurringBooking.monthlyType) {
      errors.push('Monthly type must be specified for monthly recurrence');
    }
    
    // Date validation
    if (recurringBooking.startDate && recurringBooking.endDate) {
      if (isAfter(recurringBooking.startDate, recurringBooking.endDate)) {
        errors.push('End date must be after start date');
      }
    }
    
    // Auto-book validation
    if (recurringBooking.notifications?.autoBook && !recurringBooking.advancedSettings?.paymentMethod) {
      errors.push('Payment method is required for auto-booking');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Generate calendar events for integration with external calendars
   */
  generateCalendarEvents(scheduledBookings: ScheduledBooking[], recurringBooking: RecurringBooking): any[] {
    return scheduledBookings.map(booking => {
      const [hours, minutes] = booking.scheduledTime.split(':').map(Number);
      const startDateTime = new Date(booking.scheduledDate);
      startDateTime.setHours(hours, minutes, 0, 0);
      
      const endDateTime = new Date(startDateTime.getTime() + (60 * 60 * 1000)); // 1 hour duration
      
      return {
        id: booking.id,
        title: `${recurringBooking.name} - Ride`,
        description: `Pickup: ${recurringBooking.pickupLocation}\nDrop-off: ${recurringBooking.dropoffLocation}`,
        start: startDateTime.toISOString(),
        end: endDateTime.toISOString(),
        location: recurringBooking.pickupLocation,
        status: booking.status,
        reminders: recurringBooking.notifications.reminderMinutes.map(minutes => ({
          method: 'popup',
          minutes,
        })),
      };
    });
  }
}

export const recurringBookingService = new RecurringBookingService();
export default recurringBookingService;