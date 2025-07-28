"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format, addDays } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
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
  Users,
  Plus,
  X,
  Send,
  DollarSign,
  Clock,
  MapPin,
  UserPlus,
  UserMinus,
  Crown,
  Shield,
  MessageCircle,
  Calculator,
  CheckCircle2,
  AlertCircle,
  Copy,
  Share,
  QrCode,
  Mail,
  Phone,
  Edit,
  Trash2,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { LocationPoint } from '@/types';

// Enhanced schema for group bookings
const groupBookingSchema = z.object({
  name: z.string().min(3, 'Group name must be at least 3 characters'),
  description: z.string().optional(),
  pickupLocation: z.string().min(3, 'Pickup location is required'),
  dropoffLocation: z.string().min(3, 'Drop-off location is required'),
  pickupTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
  scheduledDate: z.date(),
  
  // Group settings
  maxMembers: z.number().min(2).max(20).default(8),
  isPublic: z.boolean().default(false),
  requireApproval: z.boolean().default(true),
  allowInvites: z.boolean().default(true),
  
  // Vehicle and capacity
  vehicleType: z.enum(['minibus_6', 'minibus_8', 'minibus_12', 'minibus_16', 'coach']),
  totalSeats: z.number().min(2).max(50),
  
  // Cost splitting
  costSplitting: z.object({
    method: z.enum(['equal', 'weighted', 'custom']),
    baseFare: z.number().min(0),
    perPersonFare: z.number().min(0).optional(),
    customSplits: z.array(z.object({
      memberId: z.string(),
      amount: z.number().min(0),
      percentage: z.number().min(0).max(100).optional(),
    })).optional(),
  }),
  
  // Payment settings
  paymentSettings: z.object({
    collectUpfront: z.boolean().default(false),
    paymentDeadline: z.date().optional(),
    allowPartialPayments: z.boolean().default(true),
    refundPolicy: z.enum(['full', 'partial', 'none']).default('partial'),
  }),
  
  // Group rules and settings
  groupRules: z.object({
    cancellationPolicy: z.string().max(500).optional(),
    latePolicy: z.string().max(500).optional(),
    behaviorRules: z.string().max(500).optional(),
    specialRequirements: z.string().max(500).optional(),
  }),
  
  // Communication settings
  communication: z.object({
    enableGroupChat: z.boolean().default(true),
    allowMemberInvites: z.boolean().default(true),
    notifyOnJoin: z.boolean().default(true),
    notifyOnLeave: z.boolean().default(true),
    notifyOnPayment: z.boolean().default(true),
  }),
});

type GroupBookingValues = z.infer<typeof groupBookingSchema>;

interface GroupMember {
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
}

interface GroupBooking extends GroupBookingValues {
  id: string;
  organizerId: string;
  members: GroupMember[];
  inviteCode: string;
  status: 'draft' | 'open' | 'full' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  totalCost: number;
  totalPaid: number;
  createdAt: Date;
  updatedAt: Date;
  bookingId?: string; // Actual ride booking ID when confirmed
}

interface GroupBookingManagerProps {
  onGroupCreate?: (group: GroupBookingValues) => Promise<string>;
  onGroupUpdate?: (groupId: string, updates: Partial<GroupBookingValues>) => Promise<void>;
  onMemberInvite?: (groupId: string, invites: { email: string; phone?: string }[]) => Promise<void>;
  onMemberRemove?: (groupId: string, memberId: string) => Promise<void>;
  onGroupCancel?: (groupId: string, reason?: string) => Promise<void>;
  initialData?: Partial<GroupBookingValues>;
  existingGroup?: GroupBooking;
  currentUserId: string;
}

const VEHICLE_CAPACITIES = {
  minibus_6: { seats: 6, name: 'Minibus (6 seats)' },
  minibus_8: { seats: 8, name: 'Minibus (8 seats)' },
  minibus_12: { seats: 12, name: 'Minibus (12 seats)' },
  minibus_16: { seats: 16, name: 'Minibus (16 seats)' },
  coach: { seats: 50, name: 'Coach' },
};

const MEMBER_ROLE_COLORS = {
  organizer: 'bg-purple-100 text-purple-800 border-purple-200',
  admin: 'bg-blue-100 text-blue-800 border-blue-200',
  member: 'bg-gray-100 text-gray-800 border-gray-200',
};

const STATUS_COLORS = {
  invited: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  joined: 'bg-blue-100 text-blue-800 border-blue-200',
  confirmed: 'bg-green-100 text-green-800 border-green-200',
  paid: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
};

export default function GroupBookingManager({
  onGroupCreate,
  onGroupUpdate,
  onMemberInvite,
  onMemberRemove,
  onGroupCancel,
  initialData,
  existingGroup,
  currentUserId,
}: GroupBookingManagerProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('details');
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showMemberDetails, setShowMemberDetails] = useState<string | null>(null);
  const [showCostBreakdown, setShowCostBreakdown] = useState(false);
  const [inviteEmails, setInviteEmails] = useState<string[]>(['']);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<GroupBookingValues>({
    resolver: zodResolver(groupBookingSchema),
    defaultValues: {
      name: '',
      description: '',
      pickupLocation: '',
      dropoffLocation: '',
      pickupTime: '09:00',
      scheduledDate: addDays(new Date(), 1),
      maxMembers: 8,
      isPublic: false,
      requireApproval: true,
      allowInvites: true,
      vehicleType: 'minibus_8',
      totalSeats: 8,
      costSplitting: {
        method: 'equal',
        baseFare: 50.00,
        perPersonFare: 0,
      },
      paymentSettings: {
        collectUpfront: false,
        allowPartialPayments: true,
        refundPolicy: 'partial',
      },
      groupRules: {},
      communication: {
        enableGroupChat: true,
        allowMemberInvites: true,
        notifyOnJoin: true,
        notifyOnLeave: true,
        notifyOnPayment: true,
      },
      ...initialData,
      ...existingGroup,
    },
  });

  const watchedVehicleType = form.watch('vehicleType');
  const watchedMaxMembers = form.watch('maxMembers');
  const watchedCostMethod = form.watch('costSplitting.method');
  const watchedBaseFare = form.watch('costSplitting.baseFare');

  // Update total seats when vehicle type changes
  useEffect(() => {
    if (watchedVehicleType && VEHICLE_CAPACITIES[watchedVehicleType]) {
      form.setValue('totalSeats', VEHICLE_CAPACITIES[watchedVehicleType].seats);
    }
  }, [watchedVehicleType, form]);

  // Calculate per-person fare
  useEffect(() => {
    if (watchedCostMethod === 'equal' && watchedBaseFare && watchedMaxMembers) {
      const perPersonFare = watchedBaseFare / watchedMaxMembers;
      form.setValue('costSplitting.perPersonFare', perPersonFare);
    }
  }, [watchedCostMethod, watchedBaseFare, watchedMaxMembers, form]);

  // Handle form submission
  const handleSubmit = useCallback(async (values: GroupBookingValues) => {
    setIsSubmitting(true);
    try {
      if (existingGroup) {
        await onGroupUpdate?.(existingGroup.id, values);
        toast({
          title: "Group Updated",
          description: "Group booking has been updated successfully",
        });
      } else {
        const groupId = await onGroupCreate?.(values);
        toast({
          title: "Group Created",
          description: "Group booking has been created successfully",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save group booking. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [existingGroup, onGroupCreate, onGroupUpdate, toast]);

  // Handle member invitation
  const handleInviteMembers = useCallback(async () => {
    if (!existingGroup) return;
    
    const validEmails = inviteEmails.filter(email => email.trim() && email.includes('@'));
    if (validEmails.length === 0) {
      toast({
        title: "Invalid Emails",
        description: "Please enter valid email addresses",
        variant: "destructive",
      });
      return;
    }

    try {
      await onMemberInvite?.(existingGroup.id, validEmails.map(email => ({ email })));
      toast({
        title: "Invitations Sent",
        description: `Sent ${validEmails.length} invitation${validEmails.length > 1 ? 's' : ''}`,
      });
      setInviteEmails(['']);
      setShowInviteDialog(false);
    } catch (error) {
      toast({
        title: "Invitation Failed",
        description: "Failed to send invitations. Please try again.",
        variant: "destructive",
      });
    }
  }, [existingGroup, inviteEmails, onMemberInvite, toast]);

  // Handle member removal
  const handleRemoveMember = useCallback(async (memberId: string) => {
    if (!existingGroup) return;
    
    try {
      await onMemberRemove?.(existingGroup.id, memberId);
      toast({
        title: "Member Removed",
        description: "Member has been removed from the group",
      });
    } catch (error) {
      toast({
        title: "Removal Failed",
        description: "Failed to remove member. Please try again.",
        variant: "destructive",
      });
    }
  }, [existingGroup, onMemberRemove, toast]);

  // Calculate group statistics
  const groupStats = React.useMemo(() => {
    if (!existingGroup) return null;
    
    const totalMembers = existingGroup.members.length;
    const confirmedMembers = existingGroup.members.filter(m => m.status === 'confirmed' || m.status === 'paid').length;
    const paidMembers = existingGroup.members.filter(m => m.status === 'paid').length;
    const totalPaid = existingGroup.members.reduce((sum, m) => sum + m.amountPaid, 0);
    const totalOwed = existingGroup.members.reduce((sum, m) => sum + m.amountOwed, 0);
    const paymentProgress = totalOwed > 0 ? (totalPaid / totalOwed) * 100 : 0;
    
    return {
      totalMembers,
      confirmedMembers,
      paidMembers,
      totalPaid,
      totalOwed,
      paymentProgress,
      availableSeats: existingGroup.totalSeats - totalMembers,
    };
  }, [existingGroup]);

  // Add email input for invitations
  const addEmailInput = () => {
    setInviteEmails(prev => [...prev, '']);
  };

  // Remove email input
  const removeEmailInput = (index: number) => {
    setInviteEmails(prev => prev.filter((_, i) => i !== index));
  };

  // Update email input
  const updateEmailInput = (index: number, value: string) => {
    setInviteEmails(prev => prev.map((email, i) => i === index ? value : email));
  };

  // Copy invite link
  const copyInviteLink = useCallback(() => {
    if (!existingGroup) return;
    
    const inviteLink = `${window.location.origin}/join-group/${existingGroup.inviteCode}`;
    navigator.clipboard.writeText(inviteLink);
    toast({
      title: "Link Copied",
      description: "Invite link has been copied to clipboard",
    });
  }, [existingGroup, toast]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                {existingGroup ? 'Manage Group Booking' : 'Create Group Booking'}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {existingGroup 
                  ? `Manage "${existingGroup.name}" with ${existingGroup.members.length} members`
                  : 'Create a group booking and invite others to join'
                }
              </p>
            </div>
            {existingGroup && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-sm">
                  {existingGroup.status}
                </Badge>
                <Badge variant="secondary" className="text-sm">
                  {existingGroup.members.length}/{existingGroup.maxMembers} members
                </Badge>
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Group statistics */}
      {existingGroup && groupStats && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Group Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{groupStats.totalMembers}</div>
                <div className="text-sm text-gray-600">Total Members</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{groupStats.confirmedMembers}</div>
                <div className="text-sm text-gray-600">Confirmed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">£{groupStats.totalPaid.toFixed(2)}</div>
                <div className="text-sm text-gray-600">Total Paid</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{groupStats.availableSeats}</div>
                <div className="text-sm text-gray-600">Available Seats</div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Payment Progress</span>
                <span>{groupStats.paymentProgress.toFixed(1)}%</span>
              </div>
              <Progress value={groupStats.paymentProgress} className="h-2" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main content tabs */}
      <Card>
        <CardHeader>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="members">Members</TabsTrigger>
              <TabsTrigger value="payment">Payment</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)}>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                {/* Details tab */}
                <TabsContent value="details" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Group Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Weekend Trip to London" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="maxMembers"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Maximum Members</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="2"
                              max="20"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe the purpose of this group booking"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

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
                              {Object.entries(VEHICLE_CAPACITIES).map(([key, value]) => (
                                <SelectItem key={key} value={key}>
                                  {value.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="totalSeats"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Total Seats</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="2"
                              max="50"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                              disabled
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>

                {/* Members tab */}
                <TabsContent value="members" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Group Members</h3>
                    <div className="flex items-center gap-2">
                      {existingGroup && (
                        <>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={copyInviteLink}
                          >
                            <Copy className="w-4 h-4 mr-2" />
                            Copy Link
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setShowInviteDialog(true)}
                          >
                            <UserPlus className="w-4 h-4 mr-2" />
                            Invite Members
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {existingGroup ? (
                    <div className="space-y-3">
                      {existingGroup.members.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                        >
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={member.avatar} />
                              <AvatarFallback>
                                {member.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{member.name}</span>
                                <Badge className={MEMBER_ROLE_COLORS[member.role]}>
                                  {member.role === 'organizer' && <Crown className="w-3 h-3 mr-1" />}
                                  {member.role === 'admin' && <Shield className="w-3 h-3 mr-1" />}
                                  {member.role}
                                </Badge>
                                <Badge className={STATUS_COLORS[member.status]}>
                                  {member.status}
                                </Badge>
                              </div>
                              <div className="text-sm text-gray-600">
                                {member.email}
                                {member.seatNumber && ` • Seat ${member.seatNumber}`}
                              </div>
                              <div className="text-sm text-gray-500">
                                Owes: £{member.amountOwed.toFixed(2)} • Paid: £{member.amountPaid.toFixed(2)}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setShowMemberDetails(member.id)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {member.role !== 'organizer' && member.userId !== currentUserId && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveMember(member.id)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <UserMinus className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Alert>
                      <Users className="w-4 h-4" />
                      <AlertDescription>
                        Create the group first to start inviting members
                      </AlertDescription>
                    </Alert>
                  )}
                </TabsContent>

                {/* Payment tab */}
                <TabsContent value="payment" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="costSplitting.method"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cost Splitting Method</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select method" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="equal">Equal Split</SelectItem>
                              <SelectItem value="weighted">Weighted Split</SelectItem>
                              <SelectItem value="custom">Custom Split</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="costSplitting.baseFare"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Total Base Fare (£)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {watchedCostMethod === 'equal' && (
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Calculator className="w-4 h-4 text-blue-600" />
                        <span className="font-medium text-blue-800">Equal Split Calculation</span>
                      </div>
                      <div className="text-sm text-blue-700">
                        Each member pays: £{form.watch('costSplitting.perPersonFare')?.toFixed(2) || '0.00'}
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="paymentSettings.collectUpfront"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Collect Payment Upfront</FormLabel>
                            <FormDescription>
                              Require payment before confirming the booking
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
                      name="paymentSettings.allowPartialPayments"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Allow Partial Payments</FormLabel>
                            <FormDescription>
                              Members can pay in installments
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
                      name="paymentSettings.refundPolicy"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Refund Policy</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select refund policy" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="full">Full Refund</SelectItem>
                              <SelectItem value="partial">Partial Refund</SelectItem>
                              <SelectItem value="none">No Refund</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>

                {/* Settings tab */}
                <TabsContent value="settings" className="space-y-4">
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="isPublic"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Public Group</FormLabel>
                            <FormDescription>
                              Allow anyone to find and join this group
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
                      name="requireApproval"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Require Approval</FormLabel>
                            <FormDescription>
                              New members need approval before joining
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
                      name="communication.enableGroupChat"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Enable Group Chat</FormLabel>
                            <FormDescription>
                              Allow members to chat with each other
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
                      name="communication.allowMemberInvites"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Allow Member Invites</FormLabel>
                            <FormDescription>
                              Members can invite others to join the group
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
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h4 className="font-medium">Group Rules</h4>
                    
                    <FormField
                      control={form.control}
                      name="groupRules.cancellationPolicy"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cancellation Policy</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Describe the cancellation policy for this group"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="groupRules.behaviorRules"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Behavior Rules</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Set expectations for member behavior"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>
              </Tabs>

              {/* Form actions */}
              <div className="flex items-center justify-between pt-6 border-t">
                <div className="text-sm text-gray-600">
                  {existingGroup && (
                    <span>Last updated: {format(existingGroup.updatedAt, 'PPp')}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => window.history.back()}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    {existingGroup ? 'Update Group' : 'Create Group'}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Invite members dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Invite Members</DialogTitle>
            <DialogDescription>
              Send invitations to join this group booking
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {inviteEmails.map((email, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  type="email"
                  placeholder="Enter email address"
                  value={email}
                  onChange={(e) => updateEmailInput(index, e.target.value)}
                />
                {inviteEmails.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeEmailInput(index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
            
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addEmailInput}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Another Email
            </Button>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowInviteDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleInviteMembers}>
              <Send className="w-4 h-4 mr-2" />
              Send Invitations
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}