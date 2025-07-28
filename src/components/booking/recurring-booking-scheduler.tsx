"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format, addDays, addWeeks, addMonths, isBefore, isAfter, startOfDay } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Calendar as CalendarIcon,
  Clock,
  Repeat,
  Plus,
  X,
  Edit,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Info,
  Bell,
  MapPin,
  Users,
  Settings,
  Save,
  Eye,
  Pause,
  Play,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// Enhanced schema for recurring bookings
const recurringBookingSchema = z.object({
  name: z.string().min(3, 'Schedule name must be at least 3 characters'),
  description: z.string().optional(),
  pickupLocation: z.string().min(3, 'Pickup location is required'),
  dropoffLocation: z.string().min(3, 'Drop-off location is required'),
  vehicleType: z.enum(['car', 'estate', 'minibus_6', 'minibus_8', 'pet_friendly_car', 'disable_wheelchair_access']),
  passengers: z.number().min(1).max(10),
  
  // Recurring schedule settings
  recurrenceType: z.enum(['daily', 'weekly', 'monthly', 'custom']),
  startDate: z.date(),
  endDate: z.date().optional(),
  maxOccurrences: z.number().min(1).max(365).optional(),
  
  // Time settings
  pickupTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
  timeFlexibility: z.number().min(0).max(60).default(5), // minutes
  
  // Weekly settings
  weeklyDays: z.array(z.number().min(0).max(6)).optional(), // 0 = Sunday, 6 = Saturday
  
  // Monthly settings
  monthlyType: z.enum(['date', 'weekday']).optional(), // Same date each month or same weekday
  monthlyDate: z.number().min(1).max(31).optional(),
  monthlyWeekday: z.number().min(0).max(6).optional(),
  monthlyWeek: z.enum(['first', 'second', 'third', 'fourth', 'last']).optional(),
  
  // Exception dates
  exceptions: z.array(z.date()).optional(),
  
  // Notification settings
  notifications: z.object({
    enabled: z.boolean().default(true),
    reminderMinutes: z.array(z.number()).default([60, 15]), // Minutes before pickup
    confirmationRequired: z.boolean().default(true),
    autoBook: z.boolean().default(false), // Auto-book without confirmation
  }),
  
  // Advanced settings
  advancedSettings: z.object({
    priority: z.enum(['low', 'medium', 'high']).default('medium'),
    allowDriverPreference: z.boolean().default(false),
    preferredDriverId: z.string().optional(),
    notes: z.string().max(500).optional(),
    paymentMethod: z.enum(['card', 'cash', 'account']).default('card'),
    maxWaitTime: z.number().min(5).max(30).default(10), // minutes
  }),
  
  // Status
  isActive: z.boolean().default(true),
  isPaused: z.boolean().default(false),
});

type RecurringBookingValues = z.infer<typeof recurringBookingSchema>;

interface ScheduledBooking {
  id: string;
  recurringBookingId: string;
  scheduledDate: Date;
  scheduledTime: string;
  status: 'scheduled' | 'confirmed' | 'booked' | 'completed' | 'cancelled' | 'skipped';
  bookingId?: string; // Actual booking ID when booked
  confirmationDeadline?: Date;
  remindersSent: number[];
  lastModified: Date;
}

interface RecurringBookingSchedulerProps {
  onScheduleCreate?: (schedule: RecurringBookingValues) => void;
  onScheduleUpdate?: (id: string, schedule: RecurringBookingValues) => void;
  onScheduleDelete?: (id: string) => void;
  initialData?: Partial<RecurringBookingValues>;
  existingSchedules?: Array<RecurringBookingValues & { id: string }>;
}

const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function RecurringBookingScheduler({
  onScheduleCreate,
  onScheduleUpdate,
  onScheduleDelete,
  initialData,
  existingSchedules = [],
}: RecurringBookingSchedulerProps) {
  const { toast } = useToast();
  const [showPreview, setShowPreview] = useState(false);
  const [previewDates, setPreviewDates] = useState<Date[]>([]);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<string | null>(null);
  const [showScheduleList, setShowScheduleList] = useState(false);

  const form = useForm<RecurringBookingValues>({
    resolver: zodResolver(recurringBookingSchema),
    defaultValues: {
      name: '',
      description: '',
      pickupLocation: '',
      dropoffLocation: '',
      vehicleType: 'car',
      passengers: 1,
      recurrenceType: 'weekly',
      startDate: new Date(),
      pickupTime: '09:00',
      timeFlexibility: 5,
      weeklyDays: [1, 2, 3, 4, 5], // Monday to Friday
      monthlyType: 'date',
      exceptions: [],
      notifications: {
        enabled: true,
        reminderMinutes: [60, 15],
        confirmationRequired: true,
        autoBook: false,
      },
      advancedSettings: {
        priority: 'medium',
        allowDriverPreference: false,
        notes: '',
        paymentMethod: 'card',
        maxWaitTime: 10,
      },
      isActive: true,
      isPaused: false,
      ...initialData,
    },
  });

  const watchedRecurrenceType = form.watch('recurrenceType');
  const watchedStartDate = form.watch('startDate');
  const watchedEndDate = form.watch('endDate');
  const watchedWeeklyDays = form.watch('weeklyDays');
  const watchedMonthlyType = form.watch('monthlyType');

  // Generate preview dates based on current settings
  const generatePreviewDates = useCallback(() => {
    const values = form.getValues();
    const dates: Date[] = [];
    const maxPreview = 10; // Show up to 10 upcoming dates
    
    let currentDate = startOfDay(values.startDate);
    const endDate = values.endDate ? startOfDay(values.endDate) : addMonths(currentDate, 6);
    const maxOccurrences = values.maxOccurrences || 50;
    
    let count = 0;
    
    while (count < maxPreview && count < maxOccurrences && !isAfter(currentDate, endDate)) {
      let shouldInclude = false;
      
      switch (values.recurrenceType) {
        case 'daily':
          shouldInclude = true;
          break;
          
        case 'weekly':
          if (values.weeklyDays && values.weeklyDays.includes(currentDate.getDay())) {
            shouldInclude = true;
          }
          break;
          
        case 'monthly':
          if (values.monthlyType === 'date') {
            shouldInclude = currentDate.getDate() === (values.monthlyDate || values.startDate.getDate());
          } else if (values.monthlyType === 'weekday') {
            // Same weekday of the month (e.g., first Monday)
            const startWeekday = values.startDate.getDay();
            const startWeekOfMonth = Math.ceil(values.startDate.getDate() / 7);
            const currentWeekOfMonth = Math.ceil(currentDate.getDate() / 7);
            
            shouldInclude = currentDate.getDay() === startWeekday && currentWeekOfMonth === startWeekOfMonth;
          }
          break;
      }
      
      // Check exceptions
      if (shouldInclude && values.exceptions) {
        shouldInclude = !values.exceptions.some(exception => 
          format(exception, 'yyyy-MM-dd') === format(currentDate, 'yyyy-MM-dd')
        );
      }
      
      if (shouldInclude) {
        dates.push(new Date(currentDate));
        count++;
      }
      
      // Move to next date
      switch (values.recurrenceType) {
        case 'daily':
          currentDate = addDays(currentDate, 1);
          break;
        case 'weekly':
          currentDate = addDays(currentDate, 1);
          break;
        case 'monthly':
          if (count === 0) {
            currentDate = addMonths(currentDate, 1);
          } else {
            currentDate = addDays(currentDate, 1);
          }
          break;
      }
      
      // Safety check to prevent infinite loops
      if (count === 0 && isAfter(currentDate, addMonths(values.startDate, 12))) {
        break;
      }
    }
    
    setPreviewDates(dates);
  }, [form]);

  // Update preview when form values change
  useEffect(() => {
    generatePreviewDates();
  }, [generatePreviewDates, watchedRecurrenceType, watchedStartDate, watchedEndDate, watchedWeeklyDays, watchedMonthlyType]);

  // Handle form submission
  const handleSubmit = useCallback((values: RecurringBookingValues) => {
    try {
      if (selectedSchedule) {
        onScheduleUpdate?.(selectedSchedule, values);
        toast({
          title: "Schedule Updated",
          description: `"${values.name}" has been updated successfully`,
        });
      } else {
        onScheduleCreate?.(values);
        toast({
          title: "Schedule Created",
          description: `"${values.name}" has been created successfully`,
        });
      }
      
      // Reset form
      form.reset();
      setSelectedSchedule(null);
      setShowPreview(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save schedule. Please try again.",
        variant: "destructive",
      });
    }
  }, [selectedSchedule, onScheduleCreate, onScheduleUpdate, form, toast]);

  // Handle schedule selection for editing
  const handleScheduleSelect = useCallback((schedule: RecurringBookingValues & { id: string }) => {
    setSelectedSchedule(schedule.id);
    form.reset(schedule);
    setShowScheduleList(false);
    toast({
      title: "Schedule Loaded",
      description: `Editing "${schedule.name}"`,
    });
  }, [form, toast]);

  // Handle schedule deletion
  const handleScheduleDelete = useCallback((id: string) => {
    onScheduleDelete?.(id);
    if (selectedSchedule === id) {
      setSelectedSchedule(null);
      form.reset();
    }
    toast({
      title: "Schedule Deleted",
      description: "The recurring schedule has been deleted",
    });
  }, [selectedSchedule, onScheduleDelete, form, toast]);

  // Add exception date
  const handleAddException = useCallback((date: Date) => {
    const currentExceptions = form.getValues('exceptions') || [];
    const newExceptions = [...currentExceptions, date];
    form.setValue('exceptions', newExceptions);
    toast({
      title: "Exception Added",
      description: `${format(date, 'PPP')} will be skipped`,
    });
  }, [form, toast]);

  // Remove exception date
  const handleRemoveException = useCallback((date: Date) => {
    const currentExceptions = form.getValues('exceptions') || [];
    const newExceptions = currentExceptions.filter(exception => 
      format(exception, 'yyyy-MM-dd') !== format(date, 'yyyy-MM-dd')
    );
    form.setValue('exceptions', newExceptions);
    toast({
      title: "Exception Removed",
      description: `${format(date, 'PPP')} is back in the schedule`,
    });
  }, [form, toast]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Repeat className="w-5 h-5" />
                Recurring Booking Scheduler
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Create and manage recurring ride schedules with automatic booking
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowScheduleList(!showScheduleList)}
              >
                <Eye className="w-4 h-4 mr-2" />
                View Schedules ({existingSchedules.length})
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
              >
                <CalendarIcon className="w-4 h-4 mr-2" />
                {showPreview ? 'Hide' : 'Show'} Preview
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Existing schedules list */}
      {showScheduleList && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Existing Schedules</CardTitle>
          </CardHeader>
          <CardContent>
            {existingSchedules.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Repeat className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No recurring schedules created yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {existingSchedules.map((schedule) => (
                  <div
                    key={schedule.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{schedule.name}</h4>
                        <Badge variant={schedule.isActive ? 'default' : 'secondary'}>
                          {schedule.isPaused ? 'Paused' : schedule.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {schedule.recurrenceType}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        {schedule.pickupLocation} → {schedule.dropoffLocation}
                      </p>
                      <p className="text-xs text-gray-500">
                        {schedule.pickupTime} • {schedule.passengers} passenger{schedule.passengers > 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleScheduleSelect(schedule)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleScheduleDelete(schedule.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Preview panel */}
      {showPreview && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-blue-600" />
              Schedule Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            {previewDates.length === 0 ? (
              <Alert>
                <AlertCircle className="w-4 h-4" />
                <AlertDescription>
                  No upcoming dates found. Please check your schedule settings.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-blue-700">
                  Next {previewDates.length} scheduled rides:
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                  {previewDates.map((date, index) => (
                    <div
                      key={index}
                      className="p-2 bg-white border border-blue-200 rounded text-center"
                    >
                      <div className="text-xs text-blue-600 font-medium">
                        {format(date, 'EEE')}
                      </div>
                      <div className="text-sm font-bold">
                        {format(date, 'MMM d')}
                      </div>
                      <div className="text-xs text-gray-500">
                        {form.watch('pickupTime')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Main form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Basic information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Schedule Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Daily Commute, Weekly Grocery Run" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Brief description of this schedule" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="pickupLocation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pickup Location</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter pickup address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dropoffLocation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Drop-off Location</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter drop-off address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="vehicleType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vehicle Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select vehicle" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="car">Car</SelectItem>
                          <SelectItem value="estate">Estate</SelectItem>
                          <SelectItem value="minibus_6">Minibus (6 seats)</SelectItem>
                          <SelectItem value="minibus_8">Minibus (8 seats)</SelectItem>
                          <SelectItem value="pet_friendly_car">Pet Friendly Car</SelectItem>
                          <SelectItem value="disable_wheelchair_access">Wheelchair Accessible</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="passengers"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Passengers</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          max="10"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="pickupTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pickup Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Recurrence settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recurrence Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="recurrenceType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Repeat</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select recurrence" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Weekly days selection */}
              {watchedRecurrenceType === 'weekly' && (
                <FormField
                  control={form.control}
                  name="weeklyDays"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Days of the Week</FormLabel>
                      <div className="flex flex-wrap gap-2">
                        {WEEKDAY_NAMES.map((day, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <Checkbox
                              id={`day-${index}`}
                              checked={field.value?.includes(index) || false}
                              onCheckedChange={(checked) => {
                                const currentDays = field.value || [];
                                if (checked) {
                                  field.onChange([...currentDays, index].sort());
                                } else {
                                  field.onChange(currentDays.filter(d => d !== index));
                                }
                              }}
                            />
                            <label
                              htmlFor={`day-${index}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {WEEKDAY_SHORT[index]}
                            </label>
                          </div>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Monthly settings */}
              {watchedRecurrenceType === 'monthly' && (
                <FormField
                  control={form.control}
                  name="monthlyType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monthly Repeat Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select monthly type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="date">Same date each month</SelectItem>
                          <SelectItem value="weekday">Same weekday each month</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Start Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => isBefore(date, startOfDay(new Date()))}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>End Date (Optional)</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>No end date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => isBefore(date, form.getValues('startDate'))}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Notification settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notification Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="notifications.enabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Enable Notifications</FormLabel>
                      <FormDescription>
                        Receive reminders and confirmations for scheduled rides
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notifications.confirmationRequired"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Require Confirmation</FormLabel>
                      <FormDescription>
                        Require manual confirmation before booking each ride
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notifications.autoBook"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Auto-Book</FormLabel>
                      <FormDescription>
                        Automatically book rides without confirmation (requires payment method)
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Advanced settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Advanced Settings
                </CardTitle>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                >
                  {showAdvancedSettings ? 'Hide' : 'Show'}
                </Button>
              </div>
            </CardHeader>
            {showAdvancedSettings && (
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="advancedSettings.priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Priority</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="advancedSettings.paymentMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Method</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select payment method" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="card">Card</SelectItem>
                            <SelectItem value="cash">Cash</SelectItem>
                            <SelectItem value="account">Account</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="advancedSettings.notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Any special instructions or notes"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            )}
          </Card>

          {/* Form actions */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="text-sm font-normal">
                          Activate schedule immediately
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      form.reset();
                      setSelectedSchedule(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    {selectedSchedule ? 'Update Schedule' : 'Create Schedule'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </form>
      </Form>
    </div>
  );
}