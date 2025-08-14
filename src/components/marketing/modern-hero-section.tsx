'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GoCarsLogo } from '@/components/brand/GoCarsLogo';
import { ResponsiveContainer, ResponsiveText } from '@/components/ui/responsive-grid-system';
import { cn } from '@/lib/utils';
import {
  Play,
  ArrowRight,
  Star,
  Users,
  MapPin,
  Clock,
  Shield,
  Zap,
  Award,
  TrendingUp,
  CheckCircle,
  Smartphone,
  Car,
  Globe
} from 'lucide-react';

export interface ModernHeroSectionProps {
  className?: string;
}

export function ModernHeroSection({ className }: ModernHeroSectionProps) {
  const [currentStat, setCurrentStat] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  const stats = [
    { icon: Users, value: '50K+', label: 'Happy Riders', color: 'text-brand-primary-500' },
    { icon: Car, value: '5K+', label: 'Active Drivers', color: 'text-success-500' },
    { icon: MapPin, value: '100+', label: 'Cities Covered', color: 'text-warning-500' },
    { icon: Star, value: '4.9', label: 'Average Rating', color: 'text-brand-accent-yellow-500' },
  ];

  const features = [
    'Real-time tracking',
    'Safe & secure rides',
    '24/7 customer support',
    'Affordable pricing',
  ];

  // Rotate stats every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStat((prev) => (prev + 1) % stats.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [stats.length]);

  return (
    <section className={cn('relative overflow-hidden bg-gradient-to-br from-brand-primary-50 via-white to-brand-secondary-50', className)}>
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Animated background shapes */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-brand-primary-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-float" />
        <div className="absolute top-40 right-10 w-72 h-72 bg-brand-accent-yellow-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute -bottom-32 left-20 w-72 h-72 bg-success-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-float" style={{ animationDelay: '4s' }} />
        
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-40">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23e2e8f0' fill-opacity='0.3'%3E%3Ccircle cx='30' cy='30' r='1.5'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }} />
        </div>
      </div>

      <ResponsiveContainer size="full" className="relative z-10">
        <div className="min-h-screen flex items-center py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Left Column - Content */}
            <div className="space-y-8 animate-fade-in-up">
              {/* Badge */}
              <div className="flex items-center space-x-4">
                <Badge variant="accent" size="lg" className="animate-bounce-gentle">
                  <Zap className="h-4 w-4 mr-2" />
                  New Platform Launch
                </Badge>
                <div className="flex items-center space-x-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-warning-500 text-warning-500" />
                  ))}
                  <span className="text-sm text-brand-secondary-600 ml-2">4.9/5 Rating</span>
                </div>
              </div>

              {/* Main Heading */}
              <div className="space-y-4">
                <ResponsiveText
                  as="h1"
                  size={{ xs: '3xl', sm: '4xl', md: '5xl', lg: '6xl' }}
                  weight={{ xs: 'bold', md: 'extrabold' }}
                  className="text-brand-secondary-900 leading-tight"
                >
                  Your Journey,{' '}
                  <span className="text-brand-gradient bg-gradient-brand bg-clip-text text-transparent">
                    Our Priority
                  </span>
                </ResponsiveText>
                
                <ResponsiveText
                  as="p"
                  size={{ xs: 'lg', md: 'xl' }}
                  className="text-brand-secondary-600 leading-relaxed max-w-2xl"
                >
                  Experience the future of ride-sharing with GoCars. Safe, reliable, and affordable transportation at your fingertips.
                </ResponsiveText>
              </div>

              {/* Features List */}
              <div className="grid grid-cols-2 gap-3">
                {features.map((feature, index) => (
                  <div
                    key={feature}
                    className="flex items-center space-x-2 animate-fade-in-up"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <CheckCircle className="h-5 w-5 text-success-500 flex-shrink-0" />
                    <span className="text-sm font-medium text-brand-secondary-700">
                      {feature}
                    </span>
                  </div>
                ))}
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  className="group bg-gradient-brand hover:opacity-90 shadow-brand-lg hover:shadow-brand-xl transition-all duration-300"
                >
                  <Smartphone className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform duration-200" />
                  Download App
                  <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform duration-200" />
                </Button>
                
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setIsVideoPlaying(true)}
                  className="group border-2 hover:bg-brand-primary-50"
                >
                  <Play className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform duration-200" />
                  Watch Demo
                </Button>
              </div>

              {/* Stats */}
              <div className="pt-8 border-t border-brand-secondary-200">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                  {stats.map((stat, index) => {
                    const Icon = stat.icon;
                    const isActive = index === currentStat;
                    
                    return (
                      <div
                        key={stat.label}
                        className={cn(
                          'text-center transition-all duration-500',
                          isActive && 'scale-110 animate-pulse-brand'
                        )}
                      >
                        <div className={cn(
                          'inline-flex items-center justify-center w-12 h-12 rounded-full mb-2 transition-colors duration-300',
                          isActive ? 'bg-brand-primary-100' : 'bg-brand-secondary-100'
                        )}>
                          <Icon className={cn('h-6 w-6', stat.color)} />
                        </div>
                        <div className="text-2xl font-bold text-brand-secondary-900">
                          {stat.value}
                        </div>
                        <div className="text-sm text-brand-secondary-600">
                          {stat.label}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Column - Visual */}
            <div className="relative animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              {/* Main Visual Container */}
              <div className="relative">
                {/* Phone Mockup */}
                <div className="relative mx-auto w-80 h-[600px] bg-gradient-to-b from-brand-secondary-900 to-brand-secondary-800 rounded-[3rem] p-2 shadow-brand-xl">
                  {/* Screen */}
                  <div className="w-full h-full bg-white rounded-[2.5rem] overflow-hidden relative">
                    {/* Status Bar */}
                    <div className="h-8 bg-brand-secondary-900 flex items-center justify-between px-6 text-white text-xs">
                      <span>9:41</span>
                      <div className="flex items-center space-x-1">
                        <div className="w-4 h-2 border border-white rounded-sm">
                          <div className="w-3 h-1 bg-white rounded-sm m-0.5" />
                        </div>
                      </div>
                    </div>

                    {/* App Content */}
                    <div className="p-6 space-y-6">
                      {/* Header */}
                      <div className="flex items-center justify-between">
                        <GoCarsLogo size="sm" />
                        <div className="flex items-center space-x-2">
                          <Badge variant="success" size="sm">Online</Badge>
                        </div>
                      </div>

                      {/* Map Area */}
                      <div className="h-48 bg-gradient-to-br from-brand-primary-100 to-brand-primary-200 rounded-2xl flex items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 opacity-30">
                          <div className="absolute inset-0" style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M20 20c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10zm10 0c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10z'/%3E%3C/g%3E%3C/svg%3E")`
                          }} />
                        </div>
                        <div className="text-center">
                          <MapPin className="h-12 w-12 text-brand-primary-600 mx-auto mb-2 animate-bounce-gentle" />
                          <p className="text-sm font-medium text-brand-primary-700">
                            Finding nearby drivers...
                          </p>
                        </div>
                      </div>

                      {/* Ride Options */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-4 bg-brand-secondary-50 rounded-xl">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-brand-primary-500 rounded-full flex items-center justify-center">
                              <Car className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <div className="font-medium text-sm">GoCars Standard</div>
                              <div className="text-xs text-brand-secondary-600">2 min away</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-brand-secondary-900">$12.50</div>
                            <div className="text-xs text-success-600">Best value</div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-white border border-brand-secondary-200 rounded-xl">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-warning-500 rounded-full flex items-center justify-center">
                              <Award className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <div className="font-medium text-sm">GoCars Premium</div>
                              <div className="text-xs text-brand-secondary-600">4 min away</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-brand-secondary-900">$18.75</div>
                            <div className="text-xs text-brand-secondary-500">Luxury</div>
                          </div>
                        </div>
                      </div>

                      {/* Book Button */}
                      <Button className="w-full bg-gradient-brand shadow-brand-md">
                        <Clock className="h-4 w-4 mr-2" />
                        Book Now
                      </Button>
                    </div>
                  </div>

                  {/* Floating Elements */}
                  <div className="absolute -top-4 -right-4 w-16 h-16 bg-success-500 rounded-full flex items-center justify-center shadow-brand-lg animate-bounce-gentle">
                    <CheckCircle className="h-8 w-8 text-white" />
                  </div>

                  <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-warning-500 rounded-full flex items-center justify-center shadow-brand-lg animate-float">
                    <Star className="h-10 w-10 text-white" />
                  </div>
                </div>

                {/* Background Decorations */}
                <div className="absolute top-10 -left-10 w-24 h-24 bg-brand-primary-200 rounded-full opacity-60 animate-pulse-brand" />
                <div className="absolute bottom-20 -right-10 w-32 h-32 bg-brand-accent-yellow-200 rounded-full opacity-60 animate-float" />
              </div>
            </div>
          </div>
        </div>
      </ResponsiveContainer>

      {/* Video Modal */}
      {isVideoPlaying && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-4xl aspect-video bg-black rounded-2xl overflow-hidden">
            <button
              onClick={() => setIsVideoPlaying(false)}
              className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-colors duration-200"
            >
              ×
            </button>
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center text-white">
                <Play className="h-16 w-16 mx-auto mb-4 opacity-60" />
                <p className="text-lg">Demo video would play here</p>
                <p className="text-sm opacity-60 mt-2">Click outside to close</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-brand-secondary-400 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-brand-secondary-400 rounded-full mt-2 animate-pulse" />
        </div>
      </div>
    </section>
  );
}