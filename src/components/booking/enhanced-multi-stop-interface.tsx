"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
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
  MapPin,
  GripVertical,
  Plus,
  X,
  Route,
  Clock,
  DollarSign,
  Navigation,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Zap,
  Calculator,
  Settings,
  Info,
  Target,
  Timer,
  MapIcon,
  TrendingUp,
  Save,
  RotateCcw,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { LocationPoint } from '@/types';
import routeOptimizationService, { RouteStop, OptimizedRoute, RouteOptimizationOptions } from '@/services/routeOptimizationService';

// Enhanced schema for multi-stop booking with advanced features
const enhancedMultiStopSchema = z.object({
  pickupLocation: z.string().min(3, 'Pickup location is required'),
  pickupDoorOrFlat: z.string().optional(),
  pickupCoords: z.object({ lat: z.number(), lng: z.number() }).optional(),
  dropoffLocation: z.string().min(3, 'Drop-off location is required'),
  dropoffDoorOrFlat: z.string().optional(),
  dropoffCoords: z.object({ lat: z.number(), lng: z.number() }).optional(),
  stops: z.array(
    z.object({
      id: z.string(),
      location: z.string().min(3, 'Stop location must be at least 3 characters'),
      doorOrFlat: z.string().optional(),
      coords: z.object({ lat: z.number(), lng: z.number() }).optional(),
      waitTime: z.number().min(0).max(120).default(5), // minutes
      instructions: z.string().max(500).optional(),
      priority: z.enum(['low', 'medium', 'high']).default('medium'),
      estimatedArrival: z.date().optional(),
      contactInfo: z.string().optional(), // For deliveries/pickups
    })
  ).optional(),
  routeOptimization: z.object({
    enabled: z.boolean().default(true),
    prioritizeTime: z.boolean().default(true),
    prioritizeCost: z.boolean().default(false),
    respectPriorities: z.boolean().default(true),
    maxDetourTime: z.number().min(10).max(120).default(30),
    trafficAware: z.boolean().default(true),
  }),
  fareBreakdown: z.object({
    baseFare: z.number().optional(),
    distanceFare: z.number().optional(),
    timeFare: z.number().optional(),
    stopSurcharges: z.number().optional(),
    optimizationSavings: z.number().optional(),
    totalFare: z.number().optional(),
  }).optional(),
  routePreview: z.object({
    totalDistance: z.number().optional(),
    totalDuration: z.number().optional(),
    estimatedArrivalTime: z.date().optional(),
    waypoints: z.array(z.object({ lat: z.number(), lng: z.number() })).optional(),
  }).optional(),
});

type EnhancedMultiStopValues = z.infer<typeof enhancedMultiStopSchema>;

interface StopAutocompleteData {
  id: string;
  coords: LocationPoint | null;
  inputValue: string;
  suggestions: google.maps.places.AutocompletePrediction[];
  showSuggestions: boolean;
  isFetchingSuggestions: boolean;
  isFetchingDetails: boolean;
}

interface SortableStopProps {
  stop: any;
  index: number;
  onRemove: (index: number) => void;
  onUpdate: (index: number, field: string, value: any) => void;
  stopData: StopAutocompleteData;
  isOptimizing: boolean;
  showAdvanced: boolean;
}

// Enhanced sortable stop component
function SortableStop({
  stop,
  index,
  onRemove,
  onUpdate,
  stopData,
  isOptimizing,
  showAdvanced,
}: SortableStopProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: stop.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative p-4 border rounded-lg bg-white shadow-sm transition-all duration-200 ${
        isDragging ? 'shadow-lg ring-2 ring-blue-500 scale-105' : 'hover:shadow-md'
      } ${isOptimizing ? 'opacity-50 pointer-events-none' : ''}`}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute left-2 top-4 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 transition-colors"
      >
        <GripVertical className="w-5 h-5" />
      </div>

      {/* Remove button */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => onRemove(index)}
        className="absolute right-2 top-2 text-red-500 hover:text-red-700 h-8 w-8 p-0 transition-colors"
        disabled={isOptimizing}
      >
        <X className="w-4 h-4" />
      </Button>

      <div className="ml-8 mr-10 space-y-4">
        {/* Stop header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs font-medium">
              Stop {index + 1}
            </Badge>
            <Badge className={`text-xs ${getPriorityColor(stop.priority)}`}>
              {getPriorityIcon(stop.priority)} {stop.priority}
            </Badge>
            {stopData.coords && (
              <CheckCircle2 className="w-4 h-4 text-green-500" />
            )}
            {stop.estimatedArrival && (
              <Badge variant="secondary" className="text-xs">
                <Clock className="w-3 h-3 mr-1" />
                {stop.estimatedArrival.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Badge>
            )}
          </div>
        </div>

        {/* Location input with enhanced autocomplete */}
        <div className="space-y-2">
          <FormLabel className="text-sm font-medium flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Location
          </FormLabel>
          <div className="relative">
            <Input
              placeholder={`Enter stop ${index + 1} address`}
              value={stopData.inputValue}
              onChange={(e) => onUpdate(index, 'location', e.target.value)}
              className="pr-10"
              disabled={isOptimizing}
            />
            {stopData.isFetchingSuggestions && (
              <Loader2 className="absolute right-3 top-3 w-4 h-4 animate-spin text-gray-400" />
            )}
          </div>
          
          {/* Enhanced suggestions dropdown */}
          {stopData.showSuggestions && stopData.suggestions.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
              {stopData.suggestions.map((suggestion, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="w-full px-3 py-2 text-left hover:bg-gray-50 border-b last:border-b-0 transition-colors"
                  onClick={() => {
                    onUpdate(index, 'location', suggestion.description);
                    // Handle suggestion selection logic here
                  }}
                >
                  <div className="font-medium text-sm">{suggestion.structured_formatting.main_text}</div>
                  <div className="text-xs text-gray-500">{suggestion.structured_formatting.secondary_text}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Door/Flat input */}
        <div className="space-y-2">
          <FormLabel className="text-sm font-medium">Door/Flat (Optional)</FormLabel>
          <Input
            placeholder="e.g., Flat 2B, Door 15, Reception"
            value={stop.doorOrFlat || ''}
            onChange={(e) => onUpdate(index, 'doorOrFlat', e.target.value)}
            className="text-sm"
            disabled={isOptimizing}
          />
        </div>

        {/* Basic settings row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <FormLabel className="text-sm font-medium flex items-center gap-2">
              <Timer className="w-4 h-4" />
              Wait Time
            </FormLabel>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="0"
                max="120"
                value={stop.waitTime || 5}
                onChange={(e) => onUpdate(index, 'waitTime', parseInt(e.target.value) || 5)}
                className="text-sm"
                disabled={isOptimizing}
              />
              <span className="text-xs text-gray-500">min</span>
            </div>
          </div>
          <div className="space-y-2">
            <FormLabel className="text-sm font-medium flex items-center gap-2">
              <Target className="w-4 h-4" />
              Priority
            </FormLabel>
            <Select
              value={stop.priority || 'medium'}
              onValueChange={(value) => onUpdate(index, 'priority', value)}
              disabled={isOptimizing}
            >
              <SelectTrigger className="text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">🟢 Low</SelectItem>
                <SelectItem value="medium">🟡 Medium</SelectItem>
                <SelectItem value="high">🔴 High</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Advanced settings (collapsible) */}
        {showAdvanced && (
          <div className="space-y-4 pt-4 border-t border-gray-100">
            {/* Contact info for deliveries */}
            <div className="space-y-2">
              <FormLabel className="text-sm font-medium">Contact Info (Optional)</FormLabel>
              <Input
                placeholder="Phone number or contact name"
                value={stop.contactInfo || ''}
                onChange={(e) => onUpdate(index, 'contactInfo', e.target.value)}
                className="text-sm"
                disabled={isOptimizing}
              />
            </div>

            {/* Special instructions */}
            <div className="space-y-2">
              <FormLabel className="text-sm font-medium">Special Instructions</FormLabel>
              <Textarea
                placeholder="Any special instructions for this stop (e.g., 'Ring doorbell twice', 'Use side entrance')"
                value={stop.instructions || ''}
                onChange={(e) => onUpdate(index, 'instructions', e.target.value)}
                className="text-sm resize-none"
                rows={2}
                maxLength={500}
                disabled={isOptimizing}
              />
              <div className="text-xs text-gray-500 text-right">
                {(stop.instructions || '').length}/500
              </div>
            </div>
          </div>
        )}

        {/* Stop status indicators */}
        <div className="flex items-center gap-4 text-xs text-gray-500">
          {stopData.coords && (
            <div className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-green-500" />
              <span>Location verified</span>
            </div>
          )}
          {stop.estimatedArrival && (
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-blue-500" />
              <span>ETA calculated</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface EnhancedMultiStopInterfaceProps {
  onBookingChange?: (data: EnhancedMultiStopValues) => void;
  initialData?: Partial<EnhancedMultiStopValues>;
  pickupLocation?: string;
  dropoffLocation?: string;
  pickupCoords?: LocationPoint;
  dropoffCoords?: LocationPoint;
}

export default function EnhancedMultiStopInterface({
  onBookingChange,
  initialData,
  pickupLocation = '',
  dropoffLocation = '',
  pickupCoords,
  dropoffCoords,
}: EnhancedMultiStopInterfaceProps) {
  const { toast } = useToast();
  const [stopsData, setStopsData] = useState<StopAutocompleteData[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState<OptimizedRoute | null>(null);
  const [showOptimizationDialog, setShowOptimizationDialog] = useState(false);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [showAdvancedStops, setShowAdvancedStops] = useState(false);
  const [optimizationOptions, setOptimizationOptions] = useState<RouteOptimizationOptions>({
    prioritizeTime: true,
    prioritizeCost: false,
    respectPriorities: true,
    maxDetourTime: 30,
    trafficAware: true,
  });

  const form = useForm<EnhancedMultiStopValues>({
    resolver: zodResolver(enhancedMultiStopSchema),
    defaultValues: {
      pickupLocation,
      pickupDoorOrFlat: '',
      pickupCoords,
      dropoffLocation,
      dropoffDoorOrFlat: '',
      dropoffCoords,
      stops: [],
      routeOptimization: {
        enabled: true,
        prioritizeTime: true,
        prioritizeCost: false,
        respectPriorities: true,
        maxDetourTime: 30,
        trafficAware: true,
      },
      ...initialData,
    },
  });

  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: 'stops',
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Generate unique ID for new stops
  const generateStopId = () => `stop-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Add new stop
  const handleAddStop = useCallback(() => {
    const newStopId = generateStopId();
    append({
      id: newStopId,
      location: '',
      doorOrFlat: '',
      coords: undefined,
      waitTime: 5,
      instructions: '',
      priority: 'medium',
      contactInfo: '',
    });

    // Add corresponding stop data
    setStopsData(prev => [...prev, {
      id: newStopId,
      coords: null,
      inputValue: '',
      suggestions: [],
      showSuggestions: false,
      isFetchingSuggestions: false,
      isFetchingDetails: false,
    }]);
  }, [append]);

  // Remove stop
  const handleRemoveStop = useCallback((index: number) => {
    remove(index);
    setStopsData(prev => prev.filter((_, i) => i !== index));
    
    toast({
      title: "Stop Removed",
      description: `Stop ${index + 1} has been removed from your journey`,
    });
  }, [remove, toast]);

  // Update stop field
  const handleStopUpdate = useCallback((index: number, field: string, value: any) => {
    form.setValue(`stops.${index}.${field}` as any, value);
    
    if (field === 'location') {
      setStopsData(prev => prev.map((item, i) => 
        i === index ? { ...item, inputValue: value } : item
      ));
    }
  }, [form]);

  // Handle drag end
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = fields.findIndex(field => field.id === active.id);
      const newIndex = fields.findIndex(field => field.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        move(oldIndex, newIndex);
        
        // Update stops data order
        setStopsData(prev => {
          const newData = [...prev];
          const [movedItem] = newData.splice(oldIndex, 1);
          newData.splice(newIndex, 0, movedItem);
          return newData;
        });

        toast({
          title: "Stop Reordered",
          description: `Moved stop from position ${oldIndex + 1} to ${newIndex + 1}`,
        });
      }
    }
  }, [fields, move, toast]);

  // Optimize route
  const handleOptimizeRoute = useCallback(async () => {
    if (!pickupCoords || !dropoffCoords || fields.length < 2) {
      toast({
        title: "Cannot Optimize",
        description: "Need pickup, dropoff, and at least 2 stops to optimize route",
        variant: "destructive",
      });
      return;
    }

    setIsOptimizing(true);
    
    try {
      // Convert form data to RouteStop format
      const routeStops: RouteStop[] = fields.map((field, index) => ({
        id: field.id,
        location: stopsData[index]?.coords || { lat: 0, lng: 0 },
        address: field.location,
        waitTime: field.waitTime || 5,
        priority: field.priority || 'medium',
        instructions: field.instructions,
      }));

      const result = await routeOptimizationService.optimizeRoute(
        pickupCoords,
        dropoffCoords,
        routeStops,
        optimizationOptions
      );

      setOptimizationResult(result);
      setShowOptimizationDialog(true);
      
      // Update form with optimization results
      form.setValue('routePreview', {
        totalDistance: result.totalDistance,
        totalDuration: result.totalDuration,
        waypoints: result.waypoints,
      });

      form.setValue('fareBreakdown', {
        totalFare: result.estimatedFare,
        optimizationSavings: result.savings.costSaved,
      });

      toast({
        title: "Route Optimized!",
        description: `Saves ${result.savings.timeSaved.toFixed(0)} minutes and $${result.savings.costSaved.toFixed(2)}`,
      });
    } catch (error) {
      toast({
        title: "Optimization Failed",
        description: "Could not optimize route. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsOptimizing(false);
    }
  }, [pickupCoords, dropoffCoords, fields, stopsData, optimizationOptions, form, toast]);

  // Apply optimization
  const handleApplyOptimization = useCallback(() => {
    if (!optimizationResult) return;

    // Reorder stops based on optimization
    const reorderedFields = optimizationResult.optimizedOrder.map(index => fields[index]);
    const reorderedStopsData = optimizationResult.optimizedOrder.map(index => stopsData[index]);

    // Update form values
    form.setValue('stops', reorderedFields);
    setStopsData(reorderedStopsData);
    setShowOptimizationDialog(false);
    
    toast({
      title: "Optimization Applied!",
      description: "Your stops have been reordered for optimal efficiency",
    });
  }, [optimizationResult, fields, stopsData, form, toast]);

  // Calculate estimates
  const estimates = useMemo(() => {
    const validStops = fields.filter((_, index) => stopsData[index]?.coords);
    const baseDistance = pickupCoords && dropoffCoords ? 
      routeOptimizationService['calculateDistance'](pickupCoords, dropoffCoords) : 5;
    const totalDistance = baseDistance + (validStops.length * 2);
    const totalTime = 20 + (validStops.length * 10) + validStops.reduce((sum, stop) => sum + (stop.waitTime || 5), 0);
    const baseFare = 4.00;
    const distanceFare = totalDistance * 1.20;
    const timeFare = totalTime * 0.15;
    const stopSurcharges = validStops.length * 0.50;
    const totalFare = baseFare + distanceFare + timeFare + stopSurcharges;
    
    return { 
      totalDistance, 
      totalTime, 
      totalFare,
      baseFare,
      distanceFare,
      timeFare,
      stopSurcharges,
    };
  }, [fields, stopsData, pickupCoords, dropoffCoords]);

  // Notify parent of changes
  useEffect(() => {
    if (onBookingChange) {
      onBookingChange(form.getValues());
    }
  }, [form.watch(), onBookingChange]);

  return (
    <div className="space-y-6">
      <Form {...form}>
        {/* Header with controls */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Route className="w-5 h-5" />
                Multi-Stop Journey ({fields.length} stops)
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAdvancedStops(!showAdvancedStops)}
                >
                  {showAdvancedStops ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  {showAdvancedStops ? 'Simple' : 'Advanced'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                >
                  <Settings className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Quick optimization button */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-full">
                  <Navigation className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="font-medium text-blue-900">Smart Route Optimization</div>
                  <div className="text-sm text-blue-700">
                    Automatically reorder stops for fastest route and lowest cost
                  </div>
                </div>
              </div>
              <Button
                type="button"
                onClick={handleOptimizeRoute}
                disabled={isOptimizing || fields.length < 2}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isOptimizing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Optimizing...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Optimize Route
                  </>
                )}
              </Button>
            </div>

            {/* Advanced settings panel */}
            {showAdvancedSettings && (
              <div className="p-4 bg-gray-50 rounded-lg space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Optimization Settings
                </h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <FormLabel className="text-sm">Prioritize</FormLabel>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={optimizationOptions.prioritizeTime}
                          onCheckedChange={(checked) => 
                            setOptimizationOptions(prev => ({ ...prev, prioritizeTime: checked }))
                          }
                        />
                        <FormLabel className="text-sm">Time</FormLabel>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={optimizationOptions.prioritizeCost}
                          onCheckedChange={(checked) => 
                            setOptimizationOptions(prev => ({ ...prev, prioritizeCost: checked }))
                          }
                        />
                        <FormLabel className="text-sm">Cost</FormLabel>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <FormLabel className="text-sm">Max Detour Time: {optimizationOptions.maxDetourTime} min</FormLabel>
                    <Slider
                      value={[optimizationOptions.maxDetourTime]}
                      onValueChange={([value]) => 
                        setOptimizationOptions(prev => ({ ...prev, maxDetourTime: value }))
                      }
                      max={120}
                      min={10}
                      step={5}
                      className="w-full"
                    />
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={optimizationOptions.respectPriorities}
                      onCheckedChange={(checked) => 
                        setOptimizationOptions(prev => ({ ...prev, respectPriorities: checked }))
                      }
                    />
                    <FormLabel className="text-sm">Respect stop priorities</FormLabel>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={optimizationOptions.trafficAware}
                      onCheckedChange={(checked) => 
                        setOptimizationOptions(prev => ({ ...prev, trafficAware: checked }))
                      }
                    />
                    <FormLabel className="text-sm">Consider traffic</FormLabel>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stops list */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Stops</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddStop}
                disabled={isOptimizing}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Stop
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {fields.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <MapPin className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium mb-2">No stops added yet</h3>
                <p className="text-sm mb-4">Create your multi-stop journey by adding destinations</p>
                <Button onClick={handleAddStop} variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Stop
                </Button>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={fields.map(field => field.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-4">
                    {fields.map((field, index) => (
                      <SortableStop
                        key={field.id}
                        stop={field}
                        index={index}
                        onRemove={handleRemoveStop}
                        onUpdate={handleStopUpdate}
                        stopData={stopsData[index] || {
                          id: field.id,
                          coords: null,
                          inputValue: field.location || '',
                          suggestions: [],
                          showSuggestions: false,
                          isFetchingSuggestions: false,
                          isFetchingDetails: false,
                        }}
                        isOptimizing={isOptimizing}
                        showAdvanced={showAdvancedStops}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </CardContent>
        </Card>

        {/* Journey summary */}
        {fields.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5" />
                Journey Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-6 text-center mb-6">
                <div className="space-y-2">
                  <div className="text-3xl font-bold text-blue-600">
                    {estimates.totalDistance.toFixed(1)}
                  </div>
                  <div className="text-sm text-gray-500">Miles</div>
                </div>
                <div className="space-y-2">
                  <div className="text-3xl font-bold text-green-600">
                    {estimates.totalTime}
                  </div>
                  <div className="text-sm text-gray-500">Minutes</div>
                </div>
                <div className="space-y-2">
                  <div className="text-3xl font-bold text-purple-600">
                    £{estimates.totalFare.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-500">Estimated</div>
                </div>
              </div>
              
              <Separator className="my-4" />
              
              {/* Detailed fare breakdown */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Base fare:</span>
                  <span>£{estimates.baseFare.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Distance charge ({estimates.totalDistance.toFixed(1)} miles):</span>
                  <span>£{estimates.distanceFare.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Time charge ({estimates.totalTime} minutes):</span>
                  <span>£{estimates.timeFare.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Stop surcharges ({fields.length} stops):</span>
                  <span>£{estimates.stopSurcharges.toFixed(2)}</span>
                </div>
                {optimizationResult && optimizationResult.savings.costSaved > 0 && (
                  <div className="flex justify-between text-green-600 font-medium">
                    <span>Optimization savings:</span>
                    <span>-£{optimizationResult.savings.costSaved.toFixed(2)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-medium text-base">
                  <span>Total:</span>
                  <span>£{estimates.totalFare.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </Form>

      {/* Optimization results dialog */}
      <Dialog open={showOptimizationDialog} onOpenChange={setShowOptimizationDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              Route Optimization Results
            </DialogTitle>
            <DialogDescription>
              We found a more efficient route for your journey
            </DialogDescription>
          </DialogHeader>
          
          {optimizationResult && (
            <div className="space-y-4">
              {/* Savings summary */}
              <div className="grid grid-cols-3 gap-4 p-4 bg-green-50 rounded-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {optimizationResult.savings.timeSaved.toFixed(0)}
                  </div>
                  <div className="text-sm text-green-700">Minutes Saved</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {optimizationResult.savings.distanceSaved.toFixed(1)}
                  </div>
                  <div className="text-sm text-green-700">Miles Saved</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    £{optimizationResult.savings.costSaved.toFixed(2)}
                  </div>
                  <div className="text-sm text-green-700">Cost Saved</div>
                </div>
              </div>

              {/* Route comparison */}
              <div className="space-y-3">
                <h4 className="font-medium">Optimized Stop Order:</h4>
                <div className="space-y-2">
                  {optimizationResult.optimizedOrder.map((stopIndex, orderIndex) => (
                    <div key={orderIndex} className="flex items-center gap-3 p-2 bg-blue-50 rounded">
                      <Badge variant="outline">{orderIndex + 1}</Badge>
                      <span className="text-sm">{fields[stopIndex]?.location}</span>
                      <Badge className="ml-auto text-xs">
                        {fields[stopIndex]?.priority}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowOptimizationDialog(false)}
            >
              Keep Current Order
            </Button>
            <Button
              onClick={handleApplyOptimization}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Apply Optimization
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}