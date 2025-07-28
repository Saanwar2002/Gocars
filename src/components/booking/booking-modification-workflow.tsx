"use client";

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format, addDays, isBefore, isAfter } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Edit,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Users,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Info,
  Save,
  Undo,
  RefreshCw,
  DollarSign,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { ScheduledBooking, RecurringBooking } from '@/services/recurringBookingService';

// Schema for booking modifications
const bookingModificationSchema = z.object({
  modificationType: z.enum(['single', 'future', 'all']),
  
  // Basic changes
  pickupLocation: z.string().optional(),
  dropoffLocation: z.string().optional(),
  pickupTime: z.string().optional(),
  scheduledDate: z.date().optional(),
  passengers: z.number().min(1).max(10).optional(),
  vehicleType: z.string().optional(),
  
  // Recurring changes
  recurrenceType: z.enum(['daily', 'weekly', 'monthly']).optional(),
  weeklyDays: z.array(z.number()).optional(),
  endDate: z.date().optional(),
  
  // Advanced changes
  priority: z.enum(['low', 'medium', 'high']).optional(),
  notes: z.string().max(500).optional(),
  paymentMethod: z.enum(['card', 'cash', 'account']).optional(),
  
  // Notification changes
  notificationsEnabled: z.boolean().optional(),
  reminderMinutes: z.array(z.number()).optional(),
  confirmationRequired: z.boolean().optional(),
  autoBook: z.boolean().optional(),
});

// Schema for booking cancellation
const bookingCancellationSchema = z.object({
  cancellationType: z.enum(['single', 'future', 'all']),
  reason: z.enum(['no_longer_needed', 'schedule_conflict', 'cost_concerns', 'service_issues', 'other']),
  customReason: z.string().max(500).optional(),
  refundRequested: z.boolean().default(false),
  alternativeNeeded: z.boolean().default(false),
  alternativeDate: z.date().optional(),
  alternativeTime: z.string().optional(),
});

type BookingModificationValues = z.infer<typeof bookingModificationSchema>;
type BookingCancellationValues = z.infer<typeof bookingCancellationSchema>;

interface BookingModificationWorkflowProps {
  booking: ScheduledBooking;
  recurringBooking: RecurringBooking;
  onModify?: (bookingId: string, modifications: BookingModificationValues) => Promise<void>;
  onCancel?: (bookingId: string, cancellation: BookingCancellationValues) => Promise<void>;
  onClose?: () => void;
  mode: 'modify' | 'cancel';
}

const CANCELLATION_REASONS = [
  { value: 'no_longer_needed', label: 'No longer needed' },
  { value: 'schedule_conflict', label: 'Schedule conflict' },
  { value: 'cost_concerns', label: 'Cost concerns' },
  { value: 'service_issues', label: 'Service issues' },
  { value: 'other', label: 'Other' },
];

const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function BookingModificationWorkflow({
  booking,
  recurringBooking,
  onModify,
  onCancel,
  onClose,
  mode,
}: BookingModificationWorkflowProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [estimatedCost, setEstimatedCost] = useState<number | null>(null);
  const [affectedBookings, setAffectedBookings] = useState<number>(0);

  const modifyForm = useForm<BookingModificationValues>({
    resolver: zodResolver(bookingModificationSchema),
    defaultValues: {
      modificationType: 'single',
      pickupLocation: recurringBooking.pickupLocation,
      dropoffLocation: recurringBooking.dropoffLocation,
      pickupTime: booking.scheduledTime,
      scheduledDate: booking.scheduledDate,
      passengers: recurringBooking.passengers,
      vehicleType: recurringBooking.vehicleType,
      recurrenceType: recurringBooking.recurrenceType,
      weeklyDays: recurringBooking.weeklyDays,
      endDate: recurringBooking.endDate,
      priority: recurringBooking.advancedSettings.priority,
      notes: recurringBooking.advancedSettings.notes,
      paymentMethod: recurringBooking.advancedSettings.paymentMethod,
      notificationsEnabled: recurringBooking.notifications.enabled,
      reminderMinutes: recurringBooking.notifications.reminderMinutes,
      confirmationRequired: recurringBooking.notifications.confirmationRequired,
      autoBook: recurringBooking.notifications.autoBook,
    },
  });

  const cancelForm = useForm<BookingCancellationValues>({
    resolver: zodResolver(bookingCancellationSchema),
    defaultValues: {
      cancellationType: 'single',
      reason: 'no_longer_needed',
      customReason: '',
      refundRequested: false,
      alternativeNeeded: false,
    },
  });

  const watchedModificationType = modifyForm.watch('modificationType');
  const watchedCancellationType = cancelForm.watch('cancellationType');
  const watchedCancellationReason = cancelForm.watch('reason');
  const watchedAlternativeNeeded = cancelForm.watch('alternativeNeeded');

  // Calculate affected bookings count
  useEffect(() => {
    const type = mode === 'modify' ? watchedModificationType : watchedCancellationType;
    
    switch (type) {
      case 'single':
        setAffectedBookings(1);
        break;
      case 'future':
        // Mock calculation - in real app, this would query the database
        setAffectedBookings(12);
        break;
      case 'all':
        // Mock calculation - in real app, this would query the database
        setAffectedBookings(24);
        break;
      default:
        setAffectedBookings(1);
    }
  }, [watchedModificationType, watchedCancellationType, mode]);

  // Calculate estimated cost for modifications
  useEffect(() => {
    if (mode === 'modify') {
      // Mock cost calculation - in real app, this would call pricing service
      const baseCost = 15.00;
      const modificationFee = watchedModificationType === 'single' ? 2.50 : 5.00;
      setEstimatedCost(baseCost + modificationFee);
    }
  }, [watchedModificationType, mode]);

  // Handle modification submission
  const handleModifySubmit = async (values: BookingModificationValues) => {
    setIsSubmitting(true);
    try {
      await onModify?.(booking.id, values);
      toast({
        title: "Booking Modified",
        description: `Successfully modified ${affectedBookings} booking${affectedBookings > 1 ? 's' : ''}`,
      });
      onClose?.();
    } catch (error) {
      toast({
        title: "Modification Failed",
        description: "Failed to modify booking. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle cancellation submission
  const handleCancelSubmit = async (values: BookingCancellationValues) => {
    setIsSubmitting(true);
    try {
      await onCancel?.(booking.id, values);
      toast({
        title: "Booking Cancelled",
        description: `Successfully cancelled ${affectedBookings} booking${affectedBookings > 1 ? 's' : ''}`,
      });
      onClose?.();
    } catch (error) {
      toast({
        title: "Cancellation Failed",
        description: "Failed to cancel booking. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {mode === 'modify' ? (
              <>
                <Edit className="w-5 h-5" />
                Modify Booking
              </>
            ) : (
              <>
                <XCircle className="w-5 h-5" />
                Cancel Booking
              </>
            )}
          </CardTitle>
          <div className="text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
              <span>{recurringBooking.name}</span>
              <Badge variant="outline">{booking.status}</Badge>
              <span>{format(booking.scheduledDate, 'PPP')} at {booking.scheduledTime}</span>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Current booking details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Current Booking Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-green-600" />
                <span className="text-sm">From: {recurringBooking.pickupLocation}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-red-600" />
                <span className="text-sm">To: {recurringBooking.dropoffLocation}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                <span className="text-sm">{recurringBooking.passengers} passenger{recurringBooking.passengers > 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-600" />
                <span className="text-sm">{recurringBooking.recurrenceType} schedule</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modification form */}
      {mode === 'modify' && (
        <Form {...modifyForm}>
          <form onSubmit={modifyForm.handleSubmit(handleModifySubmit)} className="space-y-6">
            {/* Modification scope */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Modification Scope</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={modifyForm.control}
                  name="modificationType"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>What would you like to modify?</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-2"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="single" id="single" />
                            <label htmlFor="single" className="text-sm font-normal">
                              Only this booking ({format(booking.scheduledDate, 'PPP')})
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="future" id="future" />
                            <label htmlFor="future" className="text-sm font-normal">
                              This and all future bookings
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="all" id="all" />
                            <label htmlFor="all" className="text-sm font-normal">
                              All bookings in this schedule
                            </label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Alert className="mt-4">
                  <Info className="w-4 h-4" />
                  <AlertDescription>
                    This will affect <strong>{affectedBookings}</strong> booking{affectedBookings > 1 ? 's' : ''}.
                    {estimatedCost && (
                      <span className="ml-2">
                        Estimated cost: <strong>£{estimatedCost.toFixed(2)}</strong>
                      </span>
                    )}
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Modification details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Modification Details</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="basic" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="basic">Basic</TabsTrigger>
                    <TabsTrigger value="schedule">Schedule</TabsTrigger>
                    <TabsTrigger value="advanced">Advanced</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="basic" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={modifyForm.control}
                        name="pickupLocation"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Pickup Location</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter new pickup location" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={modifyForm.control}
                        name="dropoffLocation"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Drop-off Location</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter new drop-off location" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={modifyForm.control}
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
                      <FormField
                        control={modifyForm.control}
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
                        control={modifyForm.control}
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
                    </div>
                  </TabsContent>

                  <TabsContent value="schedule" className="space-y-4">
                    {watchedModificationType !== 'single' && (
                      <>
                        <FormField
                          control={modifyForm.control}
                          name="recurrenceType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Recurrence Type</FormLabel>
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

                        {modifyForm.watch('recurrenceType') === 'weekly' && (
                          <FormField
                            control={modifyForm.control}
                            name="weeklyDays"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Days of the Week</FormLabel>
                                <div className="flex flex-wrap gap-2">
                                  {WEEKDAY_NAMES.map((day, index) => (
                                    <div key={index} className="flex items-center space-x-2">
                                      <Checkbox
                                        id={`modify-day-${index}`}
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
                                        htmlFor={`modify-day-${index}`}
                                        className="text-sm font-medium leading-none"
                                      >
                                        {day.slice(0, 3)}
                                      </label>
                                    </div>
                                  ))}
                                </div>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
                      </>
                    )}

                    <FormField
                      control={modifyForm.control}
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
                                disabled={(date) => isBefore(date, new Date())}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TabsContent>

                  <TabsContent value="advanced" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={modifyForm.control}
                        name="priority"
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
                        control={modifyForm.control}
                        name="paymentMethod"
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
                      control={modifyForm.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notes</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Any additional notes or special instructions"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Form actions */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    {estimatedCost && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        <span>Estimated cost: £{estimatedCost.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onClose}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex items-center gap-2"
                    >
                      {isSubmitting ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      Save Changes
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </form>
        </Form>
      )}

      {/* Cancellation form */}
      {mode === 'cancel' && (
        <Form {...cancelForm}>
          <form onSubmit={cancelForm.handleSubmit(handleCancelSubmit)} className="space-y-6">
            {/* Cancellation scope */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Cancellation Scope</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={cancelForm.control}
                  name="cancellationType"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>What would you like to cancel?</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-2"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="single" id="cancel-single" />
                            <label htmlFor="cancel-single" className="text-sm font-normal">
                              Only this booking ({format(booking.scheduledDate, 'PPP')})
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="future" id="cancel-future" />
                            <label htmlFor="cancel-future" className="text-sm font-normal">
                              This and all future bookings
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="all" id="cancel-all" />
                            <label htmlFor="cancel-all" className="text-sm font-normal">
                              All bookings in this schedule
                            </label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Alert className="mt-4 border-red-200 bg-red-50">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    This will cancel <strong>{affectedBookings}</strong> booking{affectedBookings > 1 ? 's' : ''}.
                    This action cannot be undone.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Cancellation reason */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Cancellation Reason</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={cancelForm.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Why are you cancelling?</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a reason" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {CANCELLATION_REASONS.map(reason => (
                            <SelectItem key={reason.value} value={reason.value}>
                              {reason.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {watchedCancellationReason === 'other' && (
                  <FormField
                    control={cancelForm.control}
                    name="customReason"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Please specify</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Please provide more details about your cancellation reason"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <div className="space-y-4">
                  <FormField
                    control={cancelForm.control}
                    name="refundRequested"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="text-sm font-normal">
                          Request refund for prepaid bookings
                        </FormLabel>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={cancelForm.control}
                    name="alternativeNeeded"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="text-sm font-normal">
                          I need an alternative booking
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                </div>

                {watchedAlternativeNeeded && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg">
                    <FormField
                      control={cancelForm.control}
                      name="alternativeDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Alternative Date</FormLabel>
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
                                disabled={(date) => isBefore(date, new Date())}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={cancelForm.control}
                      name="alternativeTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Alternative Time</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Form actions */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                      <span>This action cannot be undone</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onClose}
                      disabled={isSubmitting}
                    >
                      Keep Booking
                    </Button>
                    <Button
                      type="submit"
                      variant="destructive"
                      disabled={isSubmitting}
                      className="flex items-center gap-2"
                    >
                      {isSubmitting ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <XCircle className="w-4 h-4" />
                      )}
                      Cancel Booking{affectedBookings > 1 ? 's' : ''}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </form>
        </Form>
      )}
    </div>
  );
}