'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GuidedTour } from './GuidedTour';
import { InteractiveFeatureIntro } from './InteractiveFeatureIntro';
import { ProgressiveDisclosure } from './ProgressiveDisclosure';
import { ContextualHelp } from './ContextualHelp';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Car, 
  Settings, 
  Shield, 
  CheckCircle, 
  ArrowRight,
  SkipForward
} from 'lucide-react';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  component: React.ReactNode;
  optional?: boolean;
  estimatedTime?: string;
}

interface OnboardingOrchestratorProps {
  userRole: 'passenger' | 'driver' | 'operator' | 'admin';
  userExperience: 'beginner' | 'intermediate' | 'advanced';
  isFirstTime: boolean;
  onComplete: () => void;
  onSkip?: () => void;
}

// Tour steps for different user roles
const getTourSteps = (userRole: string) => {
  const commonSteps = [
    {
      id: 'welcome',
      title: 'Welcome to GoCars',
      content: 'Let\'s take a quick tour of your new dashboard and key features.',
      target: '[data-tour="dashboard"]',
      position: 'bottom' as const
    },
    {
      id: 'navigation',
      title: 'Navigation Menu',
      content: 'Access all features through this main navigation menu.',
      target: '[data-tour="navigation"]',
      position: 'right' as const
    },
    {
      id: 'profile',
      title: 'Your Profile',
      content: 'Manage your account settings and preferences here.',
      target: '[data-tour="profile"]',
      position: 'bottom' as const
    }
  ];

  const roleSpecificSteps = {
    passenger: [
      {
        id: 'book-ride',
        title: 'Book a Ride',
        content: 'Click here to book your first ride with GoCars.',
        target: '[data-tour="book-ride"]',
        position: 'top' as const,
        action: {
          label: 'Try Booking',
          onClick: () => console.log('Opening booking modal')
        }
      },
      {
        id: 'ride-history',
        title: 'Ride History',
        content: 'View all your past and upcoming rides in this section.',
        target: '[data-tour="ride-history"]',
        position: 'left' as const
      }
    ],
    driver: [
      {
        id: 'go-online',
        title: 'Go Online',
        content: 'Toggle this to start receiving ride requests.',
        target: '[data-tour="go-online"]',
        position: 'bottom' as const
      },
      {
        id: 'earnings',
        title: 'Earnings Dashboard',
        content: 'Track your daily, weekly, and monthly earnings here.',
        target: '[data-tour="earnings"]',
        position: 'top' as const
      }
    ],
    operator: [
      {
        id: 'fleet-overview',
        title: 'Fleet Overview',
        content: 'Monitor all your vehicles and drivers from this central dashboard.',
        target: '[data-tour="fleet-overview"]',
        position: 'bottom' as const
      },
      {
        id: 'dispatch',
        title: 'Dispatch Center',
        content: 'Manually assign rides and manage operations.',
        target: '[data-tour="dispatch"]',
        position: 'left' as const
      }
    ],
    admin: [
      {
        id: 'system-health',
        title: 'System Health',
        content: 'Monitor platform performance and system metrics.',
        target: '[data-tour="system-health"]',
        position: 'bottom' as const
      },
      {
        id: 'user-management',
        title: 'User Management',
        content: 'Manage users, roles, and permissions across the platform.',
        target: '[data-tour="user-management"]',
        position: 'top' as const
      }
    ]
  };

  return [...commonSteps, ...(roleSpecificSteps[userRole as keyof typeof roleSpecificSteps] || [])];
};

// Progressive disclosure levels for advanced features
const getDisclosureLevels = (userRole: string) => {
  const commonLevels = [
    {
      id: 'basic-navigation',
      title: 'Basic Navigation',
      description: 'Learn how to navigate the GoCars interface',
      icon: <User className="h-5 w-5" />,
      complexity: 'basic' as const,
      estimatedTime: '2 min',
      content: (
        <div className="space-y-4">
          <p>The GoCars interface is designed to be intuitive and user-friendly. Here are the basics:</p>
          <ul className="list-disc list-inside space-y-2 text-sm">
            <li>Main navigation is always accessible from the left sidebar</li>
            <li>Your profile and settings are in the top-right corner</li>
            <li>Use the search bar to quickly find features or information</li>
            <li>Notifications appear in the top-right bell icon</li>
          </ul>
        </div>
      )
    },
    {
      id: 'customization',
      title: 'Customizing Your Experience',
      description: 'Personalize GoCars to match your preferences',
      icon: <Settings className="h-5 w-5" />,
      complexity: 'intermediate' as const,
      estimatedTime: '5 min',
      prerequisites: ['basic-navigation'],
      content: (
        <div className="space-y-4">
          <p>Make GoCars work better for you with these customization options:</p>
          <ul className="list-disc list-inside space-y-2 text-sm">
            <li>Choose between light and dark themes</li>
            <li>Set your preferred language and region</li>
            <li>Configure notification preferences</li>
            <li>Customize dashboard widgets and layout</li>
          </ul>
        </div>
      )
    }
  ];

  const roleSpecificLevels = {
    passenger: [
      {
        id: 'advanced-booking',
        title: 'Advanced Booking Features',
        description: 'Master multi-stop rides, scheduling, and group bookings',
        icon: <Car className="h-5 w-5" />,
        complexity: 'advanced' as const,
        estimatedTime: '8 min',
        prerequisites: ['basic-navigation'],
        content: (
          <div className="space-y-4">
            <p>Unlock the full potential of GoCars booking:</p>
            <ul className="list-disc list-inside space-y-2 text-sm">
              <li>Add multiple stops to your journey</li>
              <li>Schedule rides for future dates and times</li>
              <li>Set up recurring rides for regular commutes</li>
              <li>Book group rides and split costs with friends</li>
              <li>Use ride-sharing to save money and meet people</li>
            </ul>
          </div>
        )
      }
    ],
    driver: [
      {
        id: 'earnings-optimization',
        title: 'Maximizing Your Earnings',
        description: 'Learn strategies to increase your income as a driver',
        icon: <Car className="h-5 w-5" />,
        complexity: 'advanced' as const,
        estimatedTime: '10 min',
        prerequisites: ['basic-navigation'],
        content: (
          <div className="space-y-4">
            <p>Boost your earnings with these proven strategies:</p>
            <ul className="list-disc list-inside space-y-2 text-sm">
              <li>Understand peak hours and surge pricing</li>
              <li>Position yourself in high-demand areas</li>
              <li>Maintain high ratings for better ride assignments</li>
              <li>Use the earnings analytics to track performance</li>
              <li>Take advantage of bonus and incentive programs</li>
            </ul>
          </div>
        )
      }
    ],
    operator: [
      {
        id: 'fleet-optimization',
        title: 'Fleet Optimization Strategies',
        description: 'Advanced techniques for managing your fleet efficiently',
        icon: <Car className="h-5 w-5" />,
        complexity: 'advanced' as const,
        estimatedTime: '15 min',
        prerequisites: ['basic-navigation', 'customization'],
        content: (
          <div className="space-y-4">
            <p>Optimize your fleet operations with these advanced features:</p>
            <ul className="list-disc list-inside space-y-2 text-sm">
              <li>Use predictive analytics for demand forecasting</li>
              <li>Implement dynamic driver positioning strategies</li>
              <li>Monitor and improve driver performance metrics</li>
              <li>Optimize routes and reduce operational costs</li>
              <li>Leverage data insights for business decisions</li>
            </ul>
          </div>
        )
      }
    ],
    admin: [
      {
        id: 'platform-management',
        title: 'Advanced Platform Management',
        description: 'Master the tools for managing the entire GoCars platform',
        icon: <Shield className="h-5 w-5" />,
        complexity: 'advanced' as const,
        estimatedTime: '20 min',
        prerequisites: ['basic-navigation', 'customization'],
        content: (
          <div className="space-y-4">
            <p>Take full control of the GoCars platform:</p>
            <ul className="list-disc list-inside space-y-2 text-sm">
              <li>Monitor system health and performance metrics</li>
              <li>Manage user roles and permissions</li>
              <li>Configure platform-wide settings and policies</li>
              <li>Analyze business intelligence and generate reports</li>
              <li>Handle security incidents and compliance</li>
            </ul>
          </div>
        )
      }
    ]
  };

  return [...commonLevels, ...(roleSpecificLevels[userRole as keyof typeof roleSpecificLevels] || [])];
};

export function OnboardingOrchestrator({
  userRole,
  userExperience,
  isFirstTime,
  onComplete,
  onSkip
}: OnboardingOrchestratorProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [isSkipped, setIsSkipped] = useState(false);

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to GoCars',
      description: 'Get familiar with the key features designed for you',
      estimatedTime: '3-5 min',
      component: (
        <InteractiveFeatureIntro
          userRole={userRole}
          onComplete={() => handleStepComplete('welcome')}
        />
      )
    },
    {
      id: 'guided-tour',
      title: 'Guided Tour',
      description: 'Take a tour of your dashboard and main features',
      estimatedTime: '2-3 min',
      component: (
        <GuidedTour
          steps={getTourSteps(userRole)}
          isOpen={currentStep === 1}
          onClose={() => {}}
          onComplete={() => handleStepComplete('guided-tour')}
          userRole={userRole}
        />
      )
    },
    {
      id: 'advanced-features',
      title: 'Advanced Features',
      description: 'Learn advanced features at your own pace',
      estimatedTime: '5-15 min',
      optional: true,
      component: (
        <ProgressiveDisclosure
          topic="Advanced GoCars Features"
          levels={getDisclosureLevels(userRole)}
          userExperience={userExperience}
          onAllComplete={() => handleStepComplete('advanced-features')}
        />
      )
    }
  ];

  const handleStepComplete = (stepId: string) => {
    setCompletedSteps(prev => new Set([...prev, stepId]));
    
    // Auto-advance to next step
    const currentIndex = steps.findIndex(step => step.id === stepId);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(currentIndex + 1);
    } else {
      // All steps completed
      onComplete();
    }
  };

  const handleSkipStep = () => {
    const nextStep = currentStep + 1;
    if (nextStep < steps.length) {
      setCurrentStep(nextStep);
    } else {
      handleSkipAll();
    }
  };

  const handleSkipAll = () => {
    setIsSkipped(true);
    onSkip?.();
  };

  const currentStepData = steps[currentStep];
  const progress = ((completedSteps.size) / steps.length) * 100;

  if (isSkipped) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Progress Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Getting Started with GoCars
              </h1>
              <p className="text-muted-foreground">
                Welcome! Let's help you get the most out of your {userRole} experience.
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="capitalize">
                {userRole}
              </Badge>
              <Badge variant="secondary">
                {userExperience} User
              </Badge>
              <Button
                variant="ghost"
                onClick={handleSkipAll}
                className="flex items-center gap-2"
              >
                <SkipForward className="h-4 w-4" />
                Skip Onboarding
              </Button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="flex items-center gap-4">
            <div className="flex-1 bg-muted rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-sm text-muted-foreground">
              {completedSteps.size} of {steps.length} completed
            </span>
          </div>

          {/* Step Navigation */}
          <div className="flex items-center gap-2 mt-4">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm transition-colors ${
                  index === currentStep
                    ? 'bg-primary text-primary-foreground'
                    : completedSteps.has(step.id)
                    ? 'bg-green-100 text-green-800'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {completedSteps.has(step.id) ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <span className="w-4 h-4 rounded-full bg-current opacity-50" />
                )}
                <span>{step.title}</span>
                {step.optional && (
                  <Badge variant="secondary" size="sm">Optional</Badge>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Current Step Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Step Header */}
            <Card className="mb-8">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {currentStepData.title}
                      {currentStepData.optional && (
                        <Badge variant="outline" size="sm">Optional</Badge>
                      )}
                    </CardTitle>
                    <p className="text-muted-foreground mt-1">
                      {currentStepData.description}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {currentStepData.estimatedTime && (
                      <Badge variant="secondary">
                        {currentStepData.estimatedTime}
                      </Badge>
                    )}
                    
                    {currentStepData.optional && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSkipStep}
                        className="flex items-center gap-2"
                      >
                        Skip Step
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Step Component */}
            <div>
              {currentStepData.component}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}