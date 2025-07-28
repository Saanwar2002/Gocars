"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, addMonths, subMonths } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Pause,
  Play,
  Edit,
  Trash2,
  Plus,
  Filter,
  Download,
  RefreshCw,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { ScheduledBooking, RecurringBooking } from '@/services/recurringBookingService';

interface BookingEvent {
  id: string;
  title: string;
  date: Date;
  time: string;
  status: 'scheduled' | 'confirmed' | 'booked' | 'completed' | 'cancelled' | 'skipped';
  recurringBookingId: string;
  pickupLocation: string;
  dropoffLocation: string;
  vehicleType: string;
  passengers: number;
  confirmationDeadline?: Date;
  bookingId?: string;
}

interface BookingCalendarProps {
  scheduledBookings: ScheduledBooking[];
  recurringBookings: RecurringBooking[];
  onBookingConfirm?: (bookingId: string) => void;
  onBookingCancel?: (bookingId: string, reason?: string) => void;
  onBookingEdit?: (bookingId: string) => void;
  onRecurringEdit?: (recurringId: string) => void;
  onRecurringPause?: (recurringId: string) => void;
  onRecurringResume?: (recurringId: string) => void;
  onRefresh?: () => void;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const STATUS_COLORS = {
  scheduled: 'bg-blue-100 text-blue-800 border-blue-200',
  confirmed: 'bg-green-100 text-green-800 border-green-200',
  booked: 'bg-purple-100 text-purple-800 border-purple-200',
  completed: 'bg-gray-100 text-gray-800 border-gray-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
  skipped: 'bg-yellow-100 text-yellow-800 border-yellow-200',
};

const STATUS_ICONS = {
  scheduled: Clock,
  confirmed: CheckCircle2,
  booked: CalendarIcon,
  completed: CheckCircle2,
  cancelled: XCircle,
  skipped: AlertCircle,
};

export default function BookingCalendar({
  scheduledBookings,
  recurringBookings,
  onBookingConfirm,
  onBookingCancel,
  onBookingEdit,
  onRecurringEdit,
  onRecurringPause,
  onRecurringResume,
  onRefresh,
}: BookingCalendarProps) {
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<BookingEvent | null>(null);
  const [showBookingDetails, setShowBookingDetails] = useState(false);
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'list'>('month');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [recurringFilter, setRecurringFilter] = useState<string>('all');

  // Convert scheduled bookings to calendar events
  const bookingEvents = useMemo(() => {
    return scheduledBookings.map(booking => {
      const recurringBooking = recurringBookings.find(rb => rb.id === booking.recurringBookingId);
      
      return {
        id: booking.id,
        title: recurringBooking?.name || 'Scheduled Ride',
        date: booking.scheduledDate,
        time: booking.scheduledTime,
        status: booking.status,
        recurringBookingId: booking.recurringBookingId,
        pickupLocation: recurringBooking?.pickupLocation || '',
        dropoffLocation: recurringBooking?.dropoffLocation || '',
        vehicleType: recurringBooking?.vehicleType || 'car',
        passengers: recurringBooking?.passengers || 1,
        confirmationDeadline: booking.confirmationDeadline,
        bookingId: booking.bookingId,
      } as BookingEvent;
    }).filter(event => {
      // Apply filters
      if (statusFilter !== 'all' && event.status !== statusFilter) {
        return false;
      }
      if (recurringFilter !== 'all' && event.recurringBookingId !== recurringFilter) {
        return false;
      }
      return true;
    });
  }, [scheduledBookings, recurringBookings, statusFilter, recurringFilter]);

  // Get calendar days for current month
  const calendarDays = useMemo(() => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  // Get events for a specific date
  const getEventsForDate = (date: Date) => {
    return bookingEvents.filter(event => isSameDay(event.date, date));
  };

  // Handle date navigation
  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1));
  };

  // Handle booking action
  const handleBookingAction = async (action: string, bookingId: string, reason?: string) => {
    try {
      switch (action) {
        case 'confirm':
          await onBookingConfirm?.(bookingId);
          toast({
            title: "Booking Confirmed",
            description: "Your ride has been confirmed successfully",
          });
          break;
        case 'cancel':
          await onBookingCancel?.(bookingId, reason);
          toast({
            title: "Booking Cancelled",
            description: "Your ride has been cancelled",
          });
          break;
        case 'edit':
          onBookingEdit?.(bookingId);
          break;
      }
      setShowBookingDetails(false);
      onRefresh?.();
    } catch (error) {
      toast({
        title: "Action Failed",
        description: "Failed to perform the requested action. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle recurring booking action
  const handleRecurringAction = async (action: string, recurringId: string) => {
    try {
      switch (action) {
        case 'pause':
          await onRecurringPause?.(recurringId);
          toast({
            title: "Schedule Paused",
            description: "The recurring schedule has been paused",
          });
          break;
        case 'resume':
          await onRecurringResume?.(recurringId);
          toast({
            title: "Schedule Resumed",
            description: "The recurring schedule has been resumed",
          });
          break;
        case 'edit':
          onRecurringEdit?.(recurringId);
          break;
      }
      onRefresh?.();
    } catch (error) {
      toast({
        title: "Action Failed",
        description: "Failed to perform the requested action. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Export calendar data
  const handleExportCalendar = () => {
    const calendarData = bookingEvents.map(event => ({
      title: event.title,
      date: format(event.date, 'yyyy-MM-dd'),
      time: event.time,
      status: event.status,
      pickup: event.pickupLocation,
      dropoff: event.dropoffLocation,
    }));

    const dataStr = JSON.stringify(calendarData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `booking-calendar-${format(new Date(), 'yyyy-MM-dd')}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();

    toast({
      title: "Calendar Exported",
      description: "Your booking calendar has been exported successfully",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5" />
                Booking Calendar
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                View and manage your scheduled rides
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Select value={viewMode} onValueChange={setViewMode as any}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">Month</SelectItem>
                  <SelectItem value="week">Week</SelectItem>
                  <SelectItem value="list">List</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={onRefresh}>
                <RefreshCw className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportCalendar}>
                <Download className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium">Filters:</span>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="booked">Booked</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={recurringFilter} onValueChange={setRecurringFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All schedules" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Schedules</SelectItem>
                {recurringBookings.map(rb => (
                  <SelectItem key={rb.id} value={rb.id}>
                    {rb.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>{bookingEvents.length} events</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendar view */}
      {viewMode === 'month' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateMonth('prev')}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <h3 className="text-lg font-semibold">
                  {format(currentDate, 'MMMM yyyy')}
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateMonth('next')}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentDate(new Date())}
              >
                Today
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Weekday headers */}
              {WEEKDAYS.map(day => (
                <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                  {day}
                </div>
              ))}
              
              {/* Calendar days */}
              {calendarDays.map(day => {
                const events = getEventsForDate(day);
                const isCurrentMonth = isSameMonth(day, currentDate);
                const isCurrentDay = isToday(day);
                
                return (
                  <div
                    key={day.toISOString()}
                    className={cn(
                      "min-h-[100px] p-1 border border-gray-100 cursor-pointer hover:bg-gray-50",
                      !isCurrentMonth && "bg-gray-50 text-gray-400",
                      isCurrentDay && "bg-blue-50 border-blue-200"
                    )}
                    onClick={() => setSelectedDate(day)}
                  >
                    <div className={cn(
                      "text-sm font-medium mb-1",
                      isCurrentDay && "text-blue-600"
                    )}>
                      {format(day, 'd')}
                    </div>
                    
                    {/* Events */}
                    <div className="space-y-1">
                      {events.slice(0, 3).map(event => {
                        const StatusIcon = STATUS_ICONS[event.status];
                        return (
                          <div
                            key={event.id}
                            className={cn(
                              "text-xs p-1 rounded cursor-pointer hover:opacity-80",
                              STATUS_COLORS[event.status]
                            )}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedBooking(event);
                              setShowBookingDetails(true);
                            }}
                          >
                            <div className="flex items-center gap-1">
                              <StatusIcon className="w-3 h-3" />
                              <span className="truncate">{event.time}</span>
                            </div>
                            <div className="truncate font-medium">
                              {event.title}
                            </div>
                          </div>
                        );
                      })}
                      {events.length > 3 && (
                        <div className="text-xs text-gray-500 p-1">
                          +{events.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* List view */}
      {viewMode === 'list' && (
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            {bookingEvents.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CalendarIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No scheduled bookings found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {bookingEvents
                  .sort((a, b) => a.date.getTime() - b.date.getTime())
                  .map(event => {
                    const StatusIcon = STATUS_ICONS[event.status];
                    const recurringBooking = recurringBookings.find(rb => rb.id === event.recurringBookingId);
                    
                    return (
                      <div
                        key={event.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                        onClick={() => {
                          setSelectedBooking(event);
                          setShowBookingDetails(true);
                        }}
                      >
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "p-2 rounded-full",
                            STATUS_COLORS[event.status]
                          )}>
                            <StatusIcon className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-medium">{event.title}</div>
                            <div className="text-sm text-gray-600">
                              {format(event.date, 'PPP')} at {event.time}
                            </div>
                            <div className="text-sm text-gray-500">
                              {event.pickupLocation} → {event.dropoffLocation}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={STATUS_COLORS[event.status]}>
                            {event.status}
                          </Badge>
                          <Badge variant="outline">
                            {recurringBooking?.recurrenceType}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Booking details dialog */}
      <Dialog open={showBookingDetails} onOpenChange={setShowBookingDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5" />
              Booking Details
            </DialogTitle>
            <DialogDescription>
              View and manage your scheduled ride
            </DialogDescription>
          </DialogHeader>
          
          {selectedBooking && (
            <div className="space-y-4">
              {/* Basic info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Schedule</h4>
                  <div className="space-y-1 text-sm">
                    <div>{selectedBooking.title}</div>
                    <div className="text-gray-600">
                      {format(selectedBooking.date, 'PPP')} at {selectedBooking.time}
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Status</h4>
                  <Badge className={STATUS_COLORS[selectedBooking.status]}>
                    {selectedBooking.status}
                  </Badge>
                </div>
              </div>

              <Separator />

              {/* Journey details */}
              <div>
                <h4 className="font-medium mb-2">Journey Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-green-600" />
                    <span>From: {selectedBooking.pickupLocation}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-red-600" />
                    <span>To: {selectedBooking.dropoffLocation}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-600" />
                    <span>{selectedBooking.passengers} passenger{selectedBooking.passengers > 1 ? 's' : ''}</span>
                  </div>
                </div>
              </div>

              {/* Confirmation deadline */}
              {selectedBooking.confirmationDeadline && selectedBooking.status === 'scheduled' && (
                <Alert className="border-yellow-200 bg-yellow-50">
                  <AlertCircle className="w-4 h-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-800">
                    <strong>Confirmation required by:</strong> {format(selectedBooking.confirmationDeadline, 'PPp')}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          <DialogFooter>
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                {selectedBooking?.status === 'scheduled' && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBookingAction('confirm', selectedBooking.id)}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Confirm
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBookingAction('cancel', selectedBooking.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                  </>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBookingAction('edit', selectedBooking?.id || '')}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              </div>
              <Button
                variant="outline"
                onClick={() => setShowBookingDetails(false)}
              >
                Close
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}