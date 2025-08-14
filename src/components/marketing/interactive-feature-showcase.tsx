'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ResponsiveContainer, ResponsiveGrid } from '@/components/ui/responsive-grid-system';
import { cn } from '@/lib/utils';
import {
  MapPin,
  Clock,
  Shield,
  Star,
  Zap,
  Users,
  Car,
  CreditCard,
  Bell,
  Route,
  Award,
  TrendingUp,
  CheckCircle,
  Play,
  Pause,
  RotateCcw,
  ArrowRight,
  Smartphone,
  Globe,
  HeadphonesIcon,
  Lock
} from 'lucide-react';

export interface InteractiveFeatureShowcaseProps {
  className?: string;
}

export function InteractiveFeatureShowcase({ className }: InteractiveFeatureShowcaseProps) {
  const [activeFeature, setActiveFeature] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [animationStep, setAnimationStep] = useState(0);

  const features = [
    {
      id: 'real-time-tracking',
      title: 'Real-Time Tracking',
      description: 'Track your ride in real-time with live GPS updates and estimated arrival times.',
      icon: MapPin,
      color: 'text-brand-primary-500',
      bgColor: 'bg-brand-primary-100',
      demo: (
        <div className="relative h-64 bg-gradient-to-br from-brand-primary-50 to-brand-primary-100 rounded-xl overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              <div className="w-4 h-4 bg-brand-primary-500 rounded-full animate-pulse" />
              <div className="absolute inset-0 w-4 h-4 bg-brand-primary-500 rounded-full animate-ping opacity-75" />
              <div className="absolute -inset-2 w-8 h-8 border-2 border-brand-primary-300 rounded-full animate-pulse" />
            </div>
          </div>
          <div className="absolute bottom-4 left-4 right-4">
            <div className="bg-white/90 backdrop-blur-sm rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <Car className="h-4 w-4 text-brand-primary-500" />
                <span className="text-sm font-medium">Driver arriving in 3 minutes</span>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'secure-payments',
      title: 'Secure Payments',
      description: 'Multiple payment options with bank-level security and instant processing.',
      icon: CreditCard,
      color: 'text-success-500',
      bgColor: 'bg-success-100',
      demo: (
        <div className="relative h-64 bg-gradient-to-br from-success-50 to-success-100 rounded-xl overflow-hidden p-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Lock className="h-5 w-5 text-success-600" />
              <span className="text-sm font-semibold text-success-800">Secure Payment</span>
            </div>
            <div className="space-y-3">
              <div className="bg-white rounded-lg p-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CreditCard className="h-4 w-4 text-brand-secondary-500" />
                    <span className="text-sm">•••• 4242</span>
                  </div>
                  <CheckCircle className="h-4 w-4 text-success-500" />
                </div>
              </div>
              <div className="bg-white rounded-lg p-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total: $12.50</span>
                  <Badge variant="success" size="sm">Paid</Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'safety-first',
      title: 'Safety First',
      description: 'Comprehensive safety features including driver verification and emergency assistance.',
      icon: Shield,
      color: 'text-warning-500',
      bgColor: 'bg-warning-100',
      demo: (
        <div className="relative h-64 bg-gradient-to-br from-warning-50 to-warning-100 rounded-xl overflow-hidden p-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-warning-600" />
              <span className="text-sm font-semibold text-warning-800">Safety Features</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-lg p-3 text-center">
                <CheckCircle className="h-6 w-6 text-success-500 mx-auto mb-1" />
                <span className="text-xs font-medium">Verified Driver</span>
              </div>
              <div className="bg-white rounded-lg p-3 text-center">
                <Bell className="h-6 w-6 text-brand-primary-500 mx-auto mb-1" />
                <span className="text-xs font-medium">Emergency SOS</span>
              </div>
              <div className="bg-white rounded-lg p-3 text-center">
                <Star className="h-6 w-6 text-warning-500 mx-auto mb-1" />
                <span className="text-xs font-medium">5-Star Rating</span>
              </div>
              <div className="bg-white rounded-lg p-3 text-center">
                <Route className="h-6 w-6 text-success-500 mx-auto mb-1" />
                <span className="text-xs font-medium">Safe Route</span>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: '24-7-support',
      title: '24/7 Support',
      description: 'Round-the-clock customer support with instant chat and phone assistance.',
      icon: HeadphonesIcon,
      color: 'text-brand-accent-yellow-500',
      bgColor: 'bg-brand-accent-yellow-100',
      demo: (
        <div className="relative h-64 bg-gradient-to-br from-brand-accent-yellow-50 to-brand-accent-yellow-100 rounded-xl overflow-hidden p-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <HeadphonesIcon className="h-5 w-5 text-brand-accent-yellow-600" />
              <span className="text-sm font-semibold text-brand-accent-yellow-800">Live Support</span>
            </div>
            <div className="space-y-2">
              <div className="bg-white rounded-lg p-3 max-w-xs">
                <p className="text-sm">Hi! How can I help you today?</p>
                <span className="text-xs text-brand-secondary-500">Support Agent • Online</span>
              </div>
              <div className="bg-brand-primary-500 text-white rounded-lg p-3 max-w-xs ml-auto">
                <p className="text-sm">I need help with my booking</p>
              </div>
              <div className="bg-white rounded-lg p-3 max-w-xs">
                <p className="text-sm">I'll help you right away! 😊</p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
  ];

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % features.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, features.length]);

  // Animation step for demos
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationStep((prev) => (prev + 1) % 4);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className={cn('py-20 bg-white', className)}>
      <ResponsiveContainer size="full">
        <div className="text-center mb-16">
          <Badge variant="accent" size="lg" className="mb-4">
            <Zap className="h-4 w-4 mr-2" />
            Interactive Features
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold font-display text-brand-secondary-900 mb-6">
            Experience the{' '}
            <span className="text-brand-gradient bg-gradient-brand bg-clip-text text-transparent">
              Future
            </span>{' '}
            of Ride-Sharing
          </h2>
          <p className="text-xl text-brand-secondary-600 max-w-3xl mx-auto">
            Discover how GoCars revolutionizes transportation with cutting-edge technology and user-centric design.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Feature List */}
          <div className="space-y-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              const isActive = index === activeFeature;

              return (
                <Card
                  key={feature.id}
                  variant={isActive ? "elevated" : "default"}
                  interactive
                  className={cn(
                    'cursor-pointer transition-all duration-300',
                    isActive && 'ring-2 ring-brand-primary-200 shadow-brand-lg'
                  )}
                  onClick={() => {
                    setActiveFeature(index);
                    setIsAutoPlaying(false);
                  }}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className={cn(
                        'flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300',
                        isActive ? feature.bgColor : 'bg-brand-secondary-100'
                      )}>
                        <Icon className={cn(
                          'h-6 w-6 transition-colors duration-300',
                          isActive ? feature.color : 'text-brand-secondary-500'
                        )} />
                      </div>
                      <div className="flex-1">
                        <h3 className={cn(
                          'text-lg font-semibold mb-2 transition-colors duration-300',
                          isActive ? 'text-brand-secondary-900' : 'text-brand-secondary-700'
                        )}>
                          {feature.title}
                        </h3>
                        <p className="text-brand-secondary-600 text-sm leading-relaxed">
                          {feature.description}
                        </p>
                      </div>
                      {isActive && (
                        <div className="flex-shrink-0">
                          <div className="w-2 h-2 bg-brand-primary-500 rounded-full animate-pulse" />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {/* Controls */}
            <div className="flex items-center justify-between pt-6 border-t border-brand-secondary-200">
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                  className="flex items-center space-x-2"
                >
                  {isAutoPlaying ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  <span>{isAutoPlaying ? 'Pause' : 'Play'}</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setActiveFeature(0);
                    setIsAutoPlaying(true);
                  }}
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center space-x-2">
                {features.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setActiveFeature(index);
                      setIsAutoPlaying(false);
                    }}
                    className={cn(
                      'w-2 h-2 rounded-full transition-all duration-300',
                      index === activeFeature
                        ? 'bg-brand-primary-500 w-6'
                        : 'bg-brand-secondary-300 hover:bg-brand-secondary-400'
                    )}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Feature Demo */}
          <div className="relative">
            <div className="relative bg-brand-secondary-50 rounded-2xl p-8">
              <div className="absolute top-4 right-4">
                <Badge variant="success" size="sm" pulse>
                  Live Demo
                </Badge>
              </div>
              
              <div className="transition-all duration-500 ease-in-out">
                {features[activeFeature].demo}
              </div>
            </div>

            {/* Decorative Elements */}
            <div className="absolute -top-4 -left-4 w-8 h-8 bg-brand-primary-200 rounded-full opacity-60 animate-float" />
            <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-brand-accent-yellow-200 rounded-full opacity-60 animate-bounce-gentle" />
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <Button size="lg" className="group bg-gradient-brand hover:opacity-90 shadow-brand-lg">
            <Smartphone className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform duration-200" />
            Try GoCars Today
            <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform duration-200" />
          </Button>
          <p className="text-sm text-brand-secondary-500 mt-3">
            Available on iOS and Android • Free to download
          </p>
        </div>
      </ResponsiveContainer>
    </section>
  );
}
