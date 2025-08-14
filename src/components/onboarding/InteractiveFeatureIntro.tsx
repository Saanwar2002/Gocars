'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Car, 
  MapPin, 
  Clock, 
  Users, 
  Shield, 
  Smartphone,
  BarChart3,
  MessageCircle,
  ChevronRight,
  Play,
  CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Feature {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  benefits: string[];
  demo?: {
    type: 'animation' | 'interaction' | 'video';
    content: React.ReactNode;
  };
  userRoles: ('passenger' | 'driver' | 'operator' | 'admin')[];
}

interface InteractiveFeatureIntroProps {
  userRole: 'passenger' | 'driver' | 'operator' | 'admin';
  onComplete: () => void;
  onFeatureSelect?: (featureId: string) => void;
}

const features: Feature[] = [
  {
    id: 'smart-booking',
    icon: <Car className="h-6 w-6" />,
    title: 'Smart Booking',
    description: 'AI-powered ride matching with multi-stop support and intelligent routing.',
    benefits: [
      'Instant driver matching',
      'Multi-destination trips',
      'Optimized routes',
      'Predictive pricing'
    ],
    userRoles: ['passenger'],
    demo: {
      type: 'animation',
      content: (
        <div className="relative h-32 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-4">
          <motion.div
            className="absolute top-4 left-4 w-3 h-3 bg-blue-500 rounded-full"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
          />
          <motion.div
            className="absolute bottom-4 right-4 w-3 h-3 bg-green-500 rounded-full"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 2, delay: 1 }}
          />
          <motion.div
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
          >
            <Car className="h-6 w-6 text-primary" />
          </motion.div>
        </div>
      )
    }
  },
  {
    id: 'real-time-tracking',
    icon: <MapPin className="h-6 w-6" />,
    title: 'Real-time Tracking',
    description: 'Live location updates and route monitoring for enhanced safety and transparency.',
    benefits: [
      'Live GPS tracking',
      'ETA updates',
      'Route optimization',
      'Safety monitoring'
    ],
    userRoles: ['passenger', 'driver'],
    demo: {
      type: 'animation',
      content: (
        <div className="relative h-32 bg-gradient-to-br from-green-50 to-blue-50 rounded-lg p-4">
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 3 }}
          >
            <div className="w-16 h-16 border-2 border-green-500 rounded-full flex items-center justify-center">
              <MapPin className="h-6 w-6 text-green-600" />
            </div>
          </motion.div>
          <motion.div
            className="absolute top-2 right-2 w-2 h-2 bg-green-400 rounded-full"
            animate={{ opacity: [0, 1, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          />
        </div>
      )
    }
  },
  {
    id: 'scheduled-rides',
    icon: <Clock className="h-6 w-6" />,
    title: 'Scheduled Rides',
    description: 'Book rides in advance with recurring options for regular commutes.',
    benefits: [
      'Advance booking',
      'Recurring schedules',
      'Calendar integration',
      'Automatic reminders'
    ],
    userRoles: ['passenger'],
    demo: {
      type: 'interaction',
      content: (
        <div className="h-32 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 flex items-center justify-center">
          <div className="text-center">
            <Clock className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <p className="text-sm text-purple-700">Schedule for tomorrow</p>
            <Badge variant="secondary" className="mt-1">9:00 AM</Badge>
          </div>
        </div>
      )
    }
  },
  {
    id: 'group-rides',
    icon: <Users className="h-6 w-6" />,
    title: 'Group Rides & Sharing',
    description: 'Share rides with friends or join others going your way to save costs.',
    benefits: [
      'Cost splitting',
      'Group coordination',
      'Shared destinations',
      'Social features'
    ],
    userRoles: ['passenger'],
    demo: {
      type: 'animation',
      content: (
        <div className="h-32 bg-gradient-to-br from-orange-50 to-red-50 rounded-lg p-4 flex items-center justify-center">
          <div className="flex space-x-2">
            {[1, 2, 3].map((i) => (
              <motion.div
                key={i}
                className="w-8 h-8 bg-orange-400 rounded-full flex items-center justify-center"
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 2, delay: i * 0.3 }}
              >
                <Users className="h-4 w-4 text-white" />
              </motion.div>
            ))}
          </div>
        </div>
      )
    }
  },
  {
    id: 'safety-features',
    icon: <Shield className="h-6 w-6" />,
    title: 'Enhanced Safety',
    description: 'Comprehensive safety features including SOS, route monitoring, and emergency contacts.',
    benefits: [
      'One-tap SOS',
      'Emergency contacts',
      'Route monitoring',
      'Driver verification'
    ],
    userRoles: ['passenger', 'driver'],
    demo: {
      type: 'animation',
      content: (
        <div className="h-32 bg-gradient-to-br from-red-50 to-orange-50 rounded-lg p-4 flex items-center justify-center">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <Shield className="h-12 w-12 text-red-500" />
          </motion.div>
        </div>
      )
    }
  },
  {
    id: 'fleet-management',
    icon: <BarChart3 className="h-6 w-6" />,
    title: 'Fleet Management',
    description: 'Comprehensive tools for managing drivers, vehicles, and operations.',
    benefits: [
      'Driver analytics',
      'Vehicle tracking',
      'Performance metrics',
      'Operational insights'
    ],
    userRoles: ['operator', 'admin'],
    demo: {
      type: 'animation',
      content: (
        <div className="h-32 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4">
          <div className="flex justify-between items-end h-full">
            {[40, 70, 50, 90, 60].map((height, i) => (
              <motion.div
                key={i}
                className="bg-blue-500 w-4 rounded-t"
                style={{ height: `${height}%` }}
                animate={{ height: [`${height * 0.5}%`, `${height}%`] }}
                transition={{ repeat: Infinity, duration: 2, delay: i * 0.2 }}
              />
            ))}
          </div>
        </div>
      )
    }
  },
  {
    id: 'communication',
    icon: <MessageCircle className="h-6 w-6" />,
    title: 'Enhanced Communication',
    description: 'Rich messaging with real-time updates and multimedia support.',
    benefits: [
      'Real-time chat',
      'Voice messages',
      'Location sharing',
      'Quick replies'
    ],
    userRoles: ['passenger', 'driver', 'operator'],
    demo: {
      type: 'animation',
      content: (
        <div className="h-32 bg-gradient-to-br from-green-50 to-teal-50 rounded-lg p-4 flex items-center justify-center">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <MessageCircle className="h-12 w-12 text-green-500" />
          </motion.div>
        </div>
      )
    }
  },
  {
    id: 'mobile-app',
    icon: <Smartphone className="h-6 w-6" />,
    title: 'Progressive Web App',
    description: 'Native app experience with offline capabilities and push notifications.',
    benefits: [
      'Offline functionality',
      'Push notifications',
      'Native feel',
      'Cross-platform'
    ],
    userRoles: ['passenger', 'driver', 'operator', 'admin'],
    demo: {
      type: 'animation',
      content: (
        <div className="h-32 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-4 flex items-center justify-center">
          <motion.div
            animate={{ rotateY: [0, 180, 360] }}
            transition={{ repeat: Infinity, duration: 3 }}
          >
            <Smartphone className="h-12 w-12 text-purple-500" />
          </motion.div>
        </div>
      )
    }
  }
];

export function InteractiveFeatureIntro({ userRole, onComplete, onFeatureSelect }: InteractiveFeatureIntroProps) {
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);
  const [completedFeatures, setCompletedFeatures] = useState<Set<string>>(new Set());

  const relevantFeatures = features.filter(feature => 
    feature.userRoles.includes(userRole)
  );

  const handleFeatureClick = (featureId: string) => {
    setSelectedFeature(featureId);
    onFeatureSelect?.(featureId);
  };

  const handleFeatureComplete = (featureId: string) => {
    setCompletedFeatures(prev => new Set([...prev, featureId]));
    setSelectedFeature(null);
  };

  const allFeaturesCompleted = relevantFeatures.every(feature => 
    completedFeatures.has(feature.id)
  );

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-foreground mb-4">
          Welcome to GoCars
        </h2>
        <p className="text-lg text-muted-foreground mb-2">
          Discover the features designed for {userRole}s
        </p>
        <Badge variant="outline" className="capitalize">
          {userRole} Features
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {relevantFeatures.map((feature) => (
          <motion.div
            key={feature.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: relevantFeatures.indexOf(feature) * 0.1 }}
          >
            <Card 
              className={`cursor-pointer transition-all duration-300 hover:shadow-lg ${
                selectedFeature === feature.id 
                  ? 'ring-2 ring-primary shadow-lg' 
                  : ''
              } ${
                completedFeatures.has(feature.id)
                  ? 'bg-green-50 border-green-200'
                  : ''
              }`}
              onClick={() => handleFeatureClick(feature.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      {feature.icon}
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </div>
                  {completedFeatures.has(feature.id) && (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm mb-4">
                  {feature.description}
                </p>
                
                {feature.demo && (
                  <div className="mb-4">
                    {feature.demo.content}
                  </div>
                )}

                <div className="space-y-2">
                  {feature.benefits.slice(0, 3).map((benefit, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                      <span className="text-muted-foreground">{benefit}</span>
                    </div>
                  ))}
                </div>

                <Button
                  variant={completedFeatures.has(feature.id) ? "secondary" : "outline"}
                  size="sm"
                  className="w-full mt-4 flex items-center gap-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!completedFeatures.has(feature.id)) {
                      handleFeatureComplete(feature.id);
                    }
                  }}
                >
                  {completedFeatures.has(feature.id) ? (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Explored
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4" />
                      Explore Feature
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {allFeaturesCompleted && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="text-center"
          >
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-6">
                <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-green-800 mb-2">
                  Great! You've explored all features
                </h3>
                <p className="text-green-700 mb-4">
                  You're ready to start using GoCars to its full potential.
                </p>
                <Button onClick={onComplete} className="flex items-center gap-2">
                  Get Started
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}