'use client';

import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TouchOptimizedButton } from './TouchOptimizedButton';
import { useTouch } from '@/hooks/useTouch';
import { 
  Car, MapPin, CreditCard, Clock, User, Phone, Star,
  ArrowRight, Check, X, Plus, Minus, Heart, Share,
  Navigation, Camera, Mic, Send, MoreHorizontal
} from 'lucide-react';

interface QuickBookingProps {
  onBookingComplete?: (booking: any) => void;
}

export function QuickBookingWorkflow({ onBookingComplete }: QuickBookingProps) {
  const [step, setStep] = useState(1);
  const [bookingData, setBookingData] = useState({
    pickup: '',
    destination: '',
    vehicleType: 'standard',
    passengers: 1,
    scheduledTime: 'now'
  });

  const { vibrate, isTouchDevice } = useTouch();

  const handleNext = () => {
    if (isTouchDevice()) vibrate(10);
    setStep(prev => Math.min(prev + 1, 4));
  };

  const handlePrevious = () => {
    if (isTouchDevice()) vibrate(10);
    setStep(prev => Math.max(prev - 1, 1));
  };

  const handleComplete = () => {
    if (isTouchDevice()) vibrate([50, 50, 100]);
    onBookingComplete?.(bookingData);
  };

  const vehicleTypes = [
    { id: 'economy', name: 'Economy', price: '$12-15', icon: '🚗' },
    { id: 'standard', name: 'Standard', price: '$15-20', icon: '🚙' },
    { id: 'premium', name: 'Premium', price: '$25-35', icon: '🚘' },
    { id: 'luxury', name: 'Luxury', price: '$40-60', icon: '🏎️' }
  ];

  const quickLocations = [
    { name: 'Home', address: '123 Main St', icon: <User className="h-4 w-4" /> },
    { name: 'Work', address: '456 Business Ave', icon: <Car className="h-4 w-4" /> },
    { name: 'Airport', address: 'International Airport', icon: <Navigation className="h-4 w-4" /> },
    { name: 'Mall', address: 'City Center Mall', icon: <MapPin className="h-4 w-4" /> }
  ];

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Car className="h-5 w-5" />
            <span>Quick Booking</span>
          </CardTitle>
          <Badge variant="outline">Step {step}/4</Badge>
        </div>
        <CardDescription>
          Fast mobile booking workflow
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>

        {/* Step 1: Pickup Location */}
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="font-medium">Where are you?</h3>
            
            <div className="grid grid-cols-2 gap-3">
              {quickLocations.map((location) => (
                <TouchOptimizedButton
                  key={location.name}
                  variant="outline"
                  className="h-16 flex-col space-y-1"
                  onClick={() => {
                    setBookingData(prev => ({ ...prev, pickup: location.address }));
                    handleNext();
                  }}
                >
                  {location.icon}
                  <span className="text-sm">{location.name}</span>
                </TouchOptimizedButton>
              ))}
            </div>

            <TouchOptimizedButton
              variant="outline"
              className="w-full h-12"
              onClick={() => {
                // Would open location picker
                setBookingData(prev => ({ ...prev, pickup: 'Current Location' }));
                handleNext();
              }}
            >
              <MapPin className="h-4 w-4 mr-2" />
              Use Current Location
            </TouchOptimizedButton>
          </div>
        )}

        {/* Step 2: Destination */}
        {step === 2 && (
          <div className="space-y-4">
            <h3 className="font-medium">Where to?</h3>
            
            <div className="grid grid-cols-2 gap-3">
              {quickLocations.filter(loc => loc.address !== bookingData.pickup).map((location) => (
                <TouchOptimizedButton
                  key={location.name}
                  variant="outline"
                  className="h-16 flex-col space-y-1"
                  onClick={() => {
                    setBookingData(prev => ({ ...prev, destination: location.address }));
                    handleNext();
                  }}
                >
                  {location.icon}
                  <span className="text-sm">{location.name}</span>
                </TouchOptimizedButton>
              ))}
            </div>

            <TouchOptimizedButton
              variant="outline"
              className="w-full h-12"
              onClick={() => {
                // Would open destination picker
                setBookingData(prev => ({ ...prev, destination: 'Custom Destination' }));
                handleNext();
              }}
            >
              <MapPin className="h-4 w-4 mr-2" />
              Enter Address
            </TouchOptimizedButton>
          </div>
        )}

        {/* Step 3: Vehicle Type */}
        {step === 3 && (
          <div className="space-y-4">
            <h3 className="font-medium">Choose your ride</h3>
            
            <div className="space-y-3">
              {vehicleTypes.map((vehicle) => (
                <TouchOptimizedButton
                  key={vehicle.id}
                  variant={bookingData.vehicleType === vehicle.id ? "default" : "outline"}
                  className="w-full h-16 justify-between"
                  onClick={() => {
                    setBookingData(prev => ({ ...prev, vehicleType: vehicle.id }));
                  }}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{vehicle.icon}</span>
                    <div className="text-left">
                      <p className="font-medium">{vehicle.name}</p>
                      <p className="text-sm text-gray-600">{vehicle.price}</p>
                    </div>
                  </div>
                  {bookingData.vehicleType === vehicle.id && (
                    <Check className="h-5 w-5 text-green-600" />
                  )}
                </TouchOptimizedButton>
              ))}
            </div>

            {/* Passenger Count */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <span className="font-medium">Passengers</span>
              <div className="flex items-center space-x-3">
                <TouchOptimizedButton
                  size="sm"
                  variant="outline"
                  onClick={() => setBookingData(prev => ({ 
                    ...prev, 
                    passengers: Math.max(1, prev.passengers - 1) 
                  }))}
                  disabled={bookingData.passengers <= 1}
                >
                  <Minus className="h-4 w-4" />
                </TouchOptimizedButton>
                
                <span className="text-lg font-bold w-8 text-center">
                  {bookingData.passengers}
                </span>
                
                <TouchOptimizedButton
                  size="sm"
                  variant="outline"
                  onClick={() => setBookingData(prev => ({ 
                    ...prev, 
                    passengers: Math.min(8, prev.passengers + 1) 
                  }))}
                  disabled={bookingData.passengers >= 8}
                >
                  <Plus className="h-4 w-4" />
                </TouchOptimizedButton>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Confirmation */}
        {step === 4 && (
          <div className="space-y-4">
            <h3 className="font-medium">Confirm your ride</h3>
            
            <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">From</span>
                <span className="font-medium">{bookingData.pickup}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">To</span>
                <span className="font-medium">{bookingData.destination}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Vehicle</span>
                <span className="font-medium capitalize">{bookingData.vehicleType}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Passengers</span>
                <span className="font-medium">{bookingData.passengers}</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <span className="font-medium">Estimated Fare</span>
              <span className="text-xl font-bold text-blue-600">$18.50</span>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex space-x-3">
          {step > 1 && (
            <TouchOptimizedButton
              variant="outline"
              onClick={handlePrevious}
              className="flex-1"
            >
              Previous
            </TouchOptimizedButton>
          )}
          
          {step < 4 ? (
            <TouchOptimizedButton
              onClick={handleNext}
              className="flex-1"
              disabled={
                (step === 1 && !bookingData.pickup) ||
                (step === 2 && !bookingData.destination)
              }
            >
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </TouchOptimizedButton>
          ) : (
            <TouchOptimizedButton
              onClick={handleComplete}
              className="flex-1 bg-green-600 hover:bg-green-700"
              hapticFeedback={true}
            >
              <Car className="h-4 w-4 mr-2" />
              Book Ride
            </TouchOptimizedButton>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function QuickActionsPanel() {
  const { vibrate, isTouchDevice } = useTouch();
  const [isExpanded, setIsExpanded] = useState(false);

  const quickActions = [
    { 
      id: 'book-ride', 
      name: 'Book Ride', 
      icon: <Car className="h-5 w-5" />, 
      color: 'bg-blue-600',
      action: () => console.log('Book ride')
    },
    { 
      id: 'call-driver', 
      name: 'Call Driver', 
      icon: <Phone className="h-5 w-5" />, 
      color: 'bg-green-600',
      action: () => console.log('Call driver')
    },
    { 
      id: 'share-location', 
      name: 'Share Location', 
      icon: <Share className="h-5 w-5" />, 
      color: 'bg-purple-600',
      action: () => console.log('Share location')
    },
    { 
      id: 'emergency', 
      name: 'Emergency', 
      icon: <Phone className="h-5 w-5" />, 
      color: 'bg-red-600',
      action: () => console.log('Emergency')
    }
  ];

  const handleActionPress = (action: () => void) => {
    if (isTouchDevice()) vibrate(20);
    action();
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Expanded Actions */}
      {isExpanded && (
        <div className="absolute bottom-16 right-0 space-y-2 animate-in slide-in-from-bottom duration-200">
          {quickActions.map((action, index) => (
            <TouchOptimizedButton
              key={action.id}
              className={`${action.color} text-white shadow-lg w-12 h-12 rounded-full`}
              onClick={() => handleActionPress(action.action)}
              hapticFeedback={true}
              style={{
                animationDelay: `${index * 50}ms`
              }}
            >
              {action.icon}
            </TouchOptimizedButton>
          ))}
        </div>
      )}

      {/* Main FAB */}
      <TouchOptimizedButton
        className={`w-14 h-14 rounded-full shadow-lg transition-all duration-200 ${
          isExpanded ? 'bg-red-600 hover:bg-red-700 rotate-45' : 'bg-blue-600 hover:bg-blue-700'
        }`}
        onClick={() => {
          if (isTouchDevice()) vibrate(30);
          setIsExpanded(!isExpanded);
        }}
        hapticFeedback={true}
      >
        {isExpanded ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
      </TouchOptimizedButton>
    </div>
  );
}

export function SwipeableRideCard({ ride, onSwipeLeft, onSwipeRight }: {
  ride: any;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwipingLeft, setIsSwipingLeft] = useState(false);
  const [isSwipingRight, setIsSwipingRight] = useState(false);

  const { addGestureListeners, vibrate, isTouchDevice } = useTouch();

  useEffect(() => {
    if (!cardRef.current || !isTouchDevice()) return;

    const cleanup = addGestureListeners(cardRef.current, {
      onPan: (deltaX, deltaY) => {
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          setSwipeOffset(deltaX);
          setIsSwipingLeft(deltaX < -50);
          setIsSwipingRight(deltaX > 50);
        }
      },

      onSwipe: (direction, distance, velocity) => {
        if (direction === 'left' && distance > 100) {
          vibrate(50);
          onSwipeLeft?.();
        } else if (direction === 'right' && distance > 100) {
          vibrate(50);
          onSwipeRight?.();
        }
        
        // Reset swipe state
        setSwipeOffset(0);
        setIsSwipingLeft(false);
        setIsSwipingRight(false);
      }
    });

    return cleanup;
  }, [addGestureListeners, onSwipeLeft, onSwipeRight, vibrate, isTouchDevice]);

  return (
    <div className="relative overflow-hidden rounded-lg">
      {/* Background Actions */}
      <div className="absolute inset-0 flex">
        <div className={`flex-1 bg-red-500 flex items-center justify-start pl-4 transition-opacity ${
          isSwipingLeft ? 'opacity-100' : 'opacity-0'
        }`}>
          <X className="h-6 w-6 text-white" />
          <span className="text-white font-medium ml-2">Cancel</span>
        </div>
        <div className={`flex-1 bg-green-500 flex items-center justify-end pr-4 transition-opacity ${
          isSwipingRight ? 'opacity-100' : 'opacity-0'
        }`}>
          <span className="text-white font-medium mr-2">Accept</span>
          <Check className="h-6 w-6 text-white" />
        </div>
      </div>

      {/* Main Card */}
      <Card 
        ref={cardRef}
        className="relative z-10 transition-transform duration-150"
        style={{ 
          transform: `translateX(${swipeOffset}px)`,
          opacity: Math.max(0.7, 1 - Math.abs(swipeOffset) / 200)
        }}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Car className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="font-medium">Ride to {ride?.destination || 'Airport'}</p>
                <p className="text-sm text-gray-600">
                  {ride?.estimatedTime || '5 min'} • {ride?.fare || '$18.50'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline">
                {ride?.status || 'Pending'}
              </Badge>
              <MoreHorizontal className="h-5 w-5 text-gray-400" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function MobileKeyboard({ onInput, placeholder = "Type a message..." }: {
  onInput?: (text: string) => void;
  placeholder?: string;
}) {
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { vibrate, isTouchDevice } = useTouch();

  const quickReplies = [
    "I'm here", "5 minutes", "Thank you", "On my way", "Almost there"
  ];

  const handleSend = () => {
    if (message.trim()) {
      if (isTouchDevice()) vibrate(20);
      onInput?.(message);
      setMessage('');
    }
  };

  const handleQuickReply = (reply: string) => {
    if (isTouchDevice()) vibrate(15);
    onInput?.(reply);
  };

  const handleVoiceRecord = () => {
    if (isTouchDevice()) vibrate(30);
    setIsRecording(!isRecording);
    // Voice recording logic would go here
  };

  return (
    <div className="space-y-3">
      {/* Quick Replies */}
      <div className="flex flex-wrap gap-2">
        {quickReplies.map((reply) => (
          <TouchOptimizedButton
            key={reply}
            size="sm"
            variant="outline"
            className="text-xs"
            onClick={() => handleQuickReply(reply)}
          >
            {reply}
          </TouchOptimizedButton>
        ))}
      </div>

      {/* Input Area */}
      <div className="flex items-center space-x-2 p-2 bg-white rounded-lg border">
        <input
          ref={inputRef}
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={placeholder}
          className="flex-1 outline-none text-base"
          style={{ fontSize: '16px' }} // Prevent zoom on iOS
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleSend();
            }
          }}
        />
        
        <TouchOptimizedButton
          size="sm"
          variant="outline"
          onClick={handleVoiceRecord}
          className={`${isRecording ? 'bg-red-500 text-white' : ''}`}
        >
          <Mic className="h-4 w-4" />
        </TouchOptimizedButton>

        <TouchOptimizedButton
          size="sm"
          onClick={handleSend}
          disabled={!message.trim()}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Send className="h-4 w-4" />
        </TouchOptimizedButton>
      </div>
    </div>
  );
}

export function TouchOptimizedRating({ 
  value = 0, 
  onChange, 
  size = 'medium' 
}: {
  value?: number;
  onChange?: (rating: number) => void;
  size?: 'small' | 'medium' | 'large';
}) {
  const [hoverValue, setHoverValue] = useState(0);
  const { vibrate, isTouchDevice } = useTouch();

  const starSize = {
    small: 'h-6 w-6',
    medium: 'h-8 w-8',
    large: 'h-10 w-10'
  }[size];

  const handleRating = (rating: number) => {
    if (isTouchDevice()) vibrate(25);
    onChange?.(rating);
  };

  return (
    <div className="flex items-center space-x-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchOptimizedButton
          key={star}
          variant="ghost"
          size="sm"
          className="p-1"
          onClick={() => handleRating(star)}
          onMouseEnter={() => setHoverValue(star)}
          onMouseLeave={() => setHoverValue(0)}
          hapticFeedback={true}
        >
          <Star 
            className={`${starSize} transition-colors ${
              star <= (hoverValue || value) 
                ? 'text-yellow-400 fill-yellow-400' 
                : 'text-gray-300'
            }`}
          />
        </TouchOptimizedButton>
      ))}
    </div>
  );
}