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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
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
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { LocationPoint } from '@/types';

// Enhanced schema for multi-stop booking
const multiStopBookingSchema = z.object({
  pickupLocation: z.string().min(3, 'Pickup location is required'),
  pickupDoorOrFlat: z.string().optional(),
  dropoffLocation: z.string().min(3, 'Drop-off location is required'),
  dropoffDoorOrFlat: z.string().optional(),
  stops: z.array(
    z.object({
      id: z.string(),
      location: z.string().min(3, 'Stop location must be at least 3 characters'),
      doorOrFlat: z.string().optional(),
      estimatedDuration: z.number().optional(),
      waitTime: z.number().min(0).max(60).default(5), // minutes
      instructions: z.string().max(200).optional(),
      priority: z.enum(['low', 'medium', 'high']).default('medium'),
    })
  ).optional(),
  routeOptimization: z.boolean().default(true),
  totalEstimatedTime: z.number().optional(),
  totalEstimatedDistance: z.number().optional(),
  totalFareEstimate: z.number().optional(),
});

type MultiStopBookingValues = z.infer<typeof multiStopBookingSchema>;

interface StopData {
  id: string;
  coords: LocationPoint | null;
  inputValue: string;
  suggestions: google.maps.places.AutocompletePrediction[];
  showSuggestions: boolean;
  isFetchingSuggestions: boolean;
  isFetchingDetails: boolean;
  estimatedArrival?: Date;
  actualArrival?: Date;
}

interface RouteOptimizationResult {
  optimizedOrder: number[];
  totalDistance: number;
  totalDuration: number;
  estimatedFare: number;
  waypoints: LocationPoint[];
}

interface SortableStopItemProps {
  stop: any;
  index: number;
  onRemove: (index: number) => void;
  onLocationChange: (index: number, value: string) => void;
  onWaitTimeChange: (index: number, value: number) => void;
  onInstructionsChange: (index: number, value: string) => void;
  stopData: StopData;
  isOptimizing: boolean;
}

// Sortable stop item component
function SortableStopItem({
  stop,
  index,
  onRemove,
  onLocationChange,
  onWaitTimeChange,
  onInstructionsChange,
  stopData,
  isOptimizing,
}: SortableStopItemProps) {
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative p-4 border rounded-lg bg-white shadow-sm ${
        isDragging ? 'shadow-lg ring-2 ring-blue-500' : ''
      } ${isOptimizing ? 'opacity-50' : ''}`}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute left-2 top-4 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
      >
        <GripVertical className="w-5 h-5" />
      </div>

      {/* Remove button */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => onRemove(index)}
        className="absolute right-2 top-2 text-red-500 hover:text-red-700 h-8 w-8 p-0"
        disabled={isOptimizing}
      >
        <X className="w-4 h-4" />
      </Button>

      <div className="ml-8 mr-10 space-y-3">
        {/* Stop header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              Stop {index + 1}
            </Badge>
            <Badge className={`text-xs ${getPriorityColor(stop.priority)}`}>
              {stop.priority}
            </Badge>
          </div>
          {stopData.coords && (
            <CheckCircle2 className="w-4 h-4 text-green-500" />
          )}
        </div>

        {/* Location input */}
        <div className="space-y-2">
          <FormLabel className="text-sm font-medium">Location</FormLabel>
          <div className="relative">
            <Input
              placeholder={`Enter stop ${index + 1} address`}
              value={stopData.inputValue}
              onChange={(e) => onLocationChange(index, e.target.value)}
              className="pr-10"
              disabled={isOptimizing}
            />
            {stopData.isFetchingSuggestions && (
              <Loader2 className="absolute right-3 top-3 w-4 h-4 animate-spin text-gray-400" />
            )}
          </div>
          
          {/* Suggestions dropdown */}
          {stopData.showSuggestions && stopData.suggestions.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
              {stopData.suggestions.map((suggestion, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="w-full px-3 py-2 text-left hover:bg-gray-50 border-b last:border-b-0"
                  onClick={() => {
                    onLocationChange(index, suggestion.description);
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
            placeholder="e.g., Flat 2B, Door 15"
            value={stop.doorOrFlat || ''}
            onChange={(e) => {
              // Handle door/flat change
            }}
            className="text-sm"
            disabled={isOptimizing}
          />
        </div>

        {/* Wait time and instructions */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <FormLabel className="text-sm font-medium">Wait Time (min)</FormLabel>
            <Input
              type="number"
              min="0"
              max="60"
              value={stop.waitTime || 5}
              onChange={(e) => onWaitTimeChange(index, parseInt(e.target.value) || 5)}
              className="text-sm"
              disabled={isOptimizing}
            />
          </div>
          <div className="space-y-2">
            <FormLabel className="text-sm font-medium">Priority</FormLabel>
            <select
              value={stop.priority || 'medium'}
              onChange={(e) => {
                // Handle priority change
              }}
              className="w-full px-3 py-2 text-sm border rounded-md"
              disabled={isOptimizing}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>

        {/* Instructions */}
        <div className="space-y-2">
          <FormLabel className="text-sm font-medium">Special Instructions</FormLabel>
          <Input
            placeholder="Any special instructions for this stop"
            value={stop.instructions || ''}
            onChange={(e) => onInstructionsChange(index, e.target.value)}
            className="text-sm"
            maxLength={200}
            disabled={isOptimizing}
          />
        </div>

        {/* Estimated arrival time */}
        {stopData.estimatedArrival && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            <span>Est. arrival: {stopData.estimatedArrival.toLocaleTimeString()}</span>
          </div>
        )}
      </div>
    </div>
  );
}

interface MultiStopBookingProps {
  onBookingChange?: (data: MultiStopBookingValues) => void;
  initialData?: Partial<MultiStopBookingValues>;
  isOptimizationEnabled?: boolean;
}

export default function MultiStopBooking({
  onBookingChange,
  initialData,
  isOptimizationEnabled = true,
}: MultiStopBookingProps) {
  const { toast } = useToast();
  const [stopsData, setStopsData] = useState<StopData[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState<RouteOptimizationResult | null>(null);
  const [showOptimizationSuggestion, setShowOptimizationSuggestion] = useState(false);

  const form = useForm<MultiStopBookingValues>({
    resolver: zodResolver(multiStopBookingSchema),
    defaultValues: {
      pickupLocation: '',
      pickupDoorOrFlat: '',
      dropoffLocation: '',
      dropoffDoorOrFlat: '',
      stops: [],
      routeOptimization: true,
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
      estimatedDuration: 0,
      waitTime: 5,
      instructions: '',
      priority: 'medium',
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
    
    // Check if optimization suggestion should be shown
    if (fields.length <= 2) {
      setShowOptimizationSuggestion(false);
    }
  }, [remove, fields.length]);

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

  // Route optimization function
  const optimizeRoute = useCallback(async () => {
    if (fields.length < 2) {
      toast({
        title: "Not Enough Stops",
        description: "Add at least 2 stops to optimize the route",
        variant: "destructive",
      });
      return;
    }

    setIsOptimizing(true);
    
    try {
      // Simulate route optimization API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock optimization result
      const mockResult: RouteOptimizationResult = {
        optimizedOrder: fields.map((_, index) => index).sort(() => Math.random() - 0.5),
        totalDistance: Math.random() * 20 + 5, // 5-25 miles
        totalDuration: Math.random() * 60 + 20, // 20-80 minutes
        estimatedFare: Math.random() * 30 + 15, // $15-45
        waypoints: fields.map(() => ({ lat: 53.6450, lng: -1.7830 })),
      };

      setOptimizationResult(mockResult);
      setShowOptimizationSuggestion(true);
      
      toast({
        title: "Route Optimized!",
        description: `Found a route that saves ${Math.floor(Math.random() * 15 + 5)} minutes and $${(Math.random() * 5 + 2).toFixed(2)}`,
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
  }, [fields, toast]);

  // Apply optimization suggestion
  const applyOptimization = useCallback(() => {
    if (!optimizationResult) return;

    // Reorder stops based on optimization
    const reorderedFields = optimizationResult.optimizedOrder.map(index => fields[index]);
    const reorderedStopsData = optimizationResult.optimizedOrder.map(index => stopsData[index]);

    // Update form values
    form.setValue('stops', reorderedFields);
    form.setValue('totalEstimatedTime', optimizationResult.totalDuration);
    form.setValue('totalEstimatedDistance', optimizationResult.totalDistance);
    form.setValue('totalFareEstimate', optimizationResult.estimatedFare);

    setStopsData(reorderedStopsData);
    setShowOptimizationSuggestion(false);
    
    toast({
      title: "Route Applied!",
      description: "Your stops have been reordered for optimal efficiency",
    });
  }, [optimizationResult, fields, stopsData, form, toast]);

  // Handle location change
  const handleLocationChange = useCallback((index: number, value: string) => {
    setStopsData(prev => prev.map((item, i) => 
      i === index ? { ...item, inputValue: value } : item
    ));
    
    // Update form value
    form.setValue(`stops.${index}.location`, value);
    
    // Trigger suggestions fetch (mock)
    if (value.length >= 3) {
      setStopsData(prev => prev.map((item, i) => 
        i === index ? { ...item, isFetchingSuggestions: true } : item
      ));
      
      // Mock suggestions
      setTimeout(() => {
        setStopsData(prev => prev.map((item, i) => 
          i === index ? {
            ...item,
            isFetchingSuggestions: false,
            suggestions: [
              {
                description: `${value} - Main Street`,
                structured_formatting: {
                  main_text: `${value} - Main Street`,
                  secondary_text: 'Huddersfield, UK'
                }
              } as google.maps.places.AutocompletePrediction,
            ],
            showSuggestions: true,
          } : item
        ));
      }, 500);
    }
  }, [form]);

  // Handle wait time change
  const handleWaitTimeChange = useCallback((index: number, value: number) => {
    form.setValue(`stops.${index}.waitTime`, value);
  }, [form]);

  // Handle instructions change
  const handleInstructionsChange = useCallback((index: number, value: string) => {
    form.setValue(`stops.${index}.instructions`, value);
  }, [form]);

  // Calculate total estimates
  const totalEstimates = useMemo(() => {
    const validStops = fields.filter((_, index) => stopsData[index]?.coords);
    const baseDistance = 5; // Base distance
    const totalDistance = baseDistance + (validStops.length * 2); // Rough estimate
    const totalTime = 20 + (validStops.length * 10); // Rough estimate
    const totalFare = 15 + (validStops.length * 3); // Rough estimate
    
    return { totalDistance, totalTime, totalFare };
  }, [fields, stopsData]);

  // Show optimization suggestion when there are 3+ stops
  useEffect(() => {
    if (fields.length >= 3 && !showOptimizationSuggestion && isOptimizationEnabled) {
      setShowOptimizationSuggestion(true);
    }
  }, [fields.length, showOptimizationSuggestion, isOptimizationEnabled]);

  // Notify parent of changes
  useEffect(() => {
    if (onBookingChange) {
      onBookingChange(form.getValues());
    }
  }, [form.watch(), onBookingChange]);

  return (
    <div className="space-y-6">
      <Form {...form}>
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Route className="w-5 h-5" />
              Multi-Stop Journey
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Route optimization toggle */}
            {isOptimizationEnabled && (
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium">Smart Route Optimization</span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={optimizeRoute}
                  disabled={isOptimizing || fields.length < 2}
                  className="text-blue-600 border-blue-200 hover:bg-blue-100"
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
            )}

            {/* Optimization suggestion */}
            {showOptimizationSuggestion && optimizationResult && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <strong>Route optimized!</strong> Save {Math.floor(optimizationResult.totalDuration - totalEstimates.totalTime)} minutes 
                      and ${(totalEstimates.totalFare - optimizationResult.estimatedFare).toFixed(2)}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        onClick={applyOptimization}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Apply
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowOptimizationSuggestion(false)}
                      >
                        Dismiss
                      </Button>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Stops list */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Stops ({fields.length})</span>
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
            </CardTitle>
          </CardHeader>
          <CardContent>
            {fields.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <MapPin className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No stops added yet</p>
                <p className="text-sm">Click "Add Stop" to create your multi-stop journey</p>
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
                      <SortableStopItem
                        key={field.id}
                        stop={field}
                        index={index}
                        onRemove={handleRemoveStop}
                        onLocationChange={handleLocationChange}
                        onWaitTimeChange={handleWaitTimeChange}
                        onInstructionsChange={handleInstructionsChange}
                        stopData={stopsData[index] || {
                          id: field.id,
                          coords: null,
                          inputValue: '',
                          suggestions: [],
                          showSuggestions: false,
                          isFetchingSuggestions: false,
                          isFetchingDetails: false,
                        }}
                        isOptimizing={isOptimizing}
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
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-blue-600">
                    {totalEstimates.totalDistance.toFixed(1)}
                  </div>
                  <div className="text-sm text-gray-500">Miles</div>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-green-600">
                    {totalEstimates.totalTime}
                  </div>
                  <div className="text-sm text-gray-500">Minutes</div>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-purple-600">
                    £{totalEstimates.totalFare.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-500">Estimated</div>
                </div>
              </div>
              
              <Separator className="my-4" />
              
              <div className="text-sm text-gray-600 space-y-1">
                <div className="flex justify-between">
                  <span>Base fare:</span>
                  <span>£15.00</span>
                </div>
                <div className="flex justify-between">
                  <span>Per stop surcharge ({fields.length} stops):</span>
                  <span>£{(fields.length * 0.5).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Distance charge:</span>
                  <span>£{(totalEstimates.totalDistance * 1.2).toFixed(2)}</span>
                </div>
                {optimizationResult && (
                  <div className="flex justify-between text-green-600">
                    <span>Optimization savings:</span>
                    <span>-£{(totalEstimates.totalFare - optimizationResult.estimatedFare).toFixed(2)}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </Form>
    </div>
  );
}