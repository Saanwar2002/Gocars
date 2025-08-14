'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ResponsiveContainer } from '@/components/ui/responsive-grid-system';
import { cn } from '@/lib/utils';
import {
  Star,
  Quote,
  ChevronLeft,
  ChevronRight,
  Play,
  MapPin,
  Calendar,
  TrendingUp,
  Users,
  Award,
  CheckCircle,
  Heart,
  MessageCircle
} from 'lucide-react';

export interface CustomerTestimonialsProps {
  className?: string;
}

export function CustomerTestimonials({ className }: CustomerTestimonialsProps) {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const testimonials = [
    {
      id: 1,
      name: 'Sarah Johnson',
      role: 'Marketing Manager',
      location: 'Downtown, Huddersfield',
      avatar: '/api/placeholder/60/60',
      rating: 5,
      date: '2 days ago',
      content: 'GoCars has completely transformed my daily commute. The drivers are professional, the app is intuitive, and I always feel safe. The real-time tracking gives me peace of mind, especially during late-night rides.',
      highlight: 'professional drivers',
      rides: 47,
      verified: true,
    },
    {
      id: 2,
      name: 'Michael Chen',
      role: 'Software Developer',
      location: 'Tech District, Huddersfield',
      avatar: '/api/placeholder/60/60',
      rating: 5,
      date: '1 week ago',
      content: 'As someone who values efficiency, GoCars delivers every time. The booking process is seamless, arrival times are accurate, and the payment system is flawless. It\'s become my go-to transportation solution.',
      highlight: 'seamless booking',
      rides: 89,
      verified: true,
    },
    {
      id: 3,
      name: 'Emma Thompson',
      role: 'University Student',
      location: 'Campus Area, Huddersfield',
      avatar: '/api/placeholder/60/60',
      rating: 5,
      date: '3 days ago',
      content: 'Being a student, budget is important to me. GoCars offers competitive pricing without compromising on quality. The student discount is a bonus! Plus, the safety features make my parents feel comfortable.',
      highlight: 'competitive pricing',
      rides: 23,
      verified: true,
    },
    {
      id: 4,
      name: 'David Rodriguez',
      role: 'Business Owner',
      location: 'Business District, Huddersfield',
      avatar: '/api/placeholder/60/60',
      rating: 5,
      date: '5 days ago',
      content: 'I use GoCars for all my business meetings and client visits. The premium service is exceptional, and the drivers understand the importance of punctuality. It reflects well on my business.',
      highlight: 'premium service',
      rides: 156,
      verified: true,
    },
    {
      id: 5,
      name: 'Lisa Park',
      role: 'Healthcare Worker',
      location: 'Hospital District, Huddersfield',
      avatar: '/api/placeholder/60/60',
      rating: 5,
      date: '1 day ago',
      content: 'Working irregular hours in healthcare, I need reliable transportation at all times. GoCars is available 24/7 with consistent quality. The emergency features give me extra confidence during night shifts.',
      highlight: '24/7 availability',
      rides: 78,
      verified: true,
    },
  ];

  const stats = [
    { icon: Users, value: '50,000+', label: 'Happy Customers', color: 'text-brand-primary-500' },
    { icon: Star, value: '4.9/5', label: 'Average Rating', color: 'text-warning-500' },
    { icon: TrendingUp, value: '98%', label: 'Satisfaction Rate', color: 'text-success-500' },
    { icon: Award, value: '1M+', label: 'Rides Completed', color: 'text-brand-accent-yellow-500' },
  ];

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, testimonials.length]);

  const nextTestimonial = () => {
    setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    setIsAutoPlaying(false);
  };

  const prevTestimonial = () => {
    setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length);
    setIsAutoPlaying(false);
  };

  const currentReview = testimonials[currentTestimonial];

  return (
    <section className={cn('py-20 bg-gradient-to-br from-brand-secondary-50 via-white to-brand-primary-50', className)}>
      <ResponsiveContainer size="full">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge variant="success" size="lg" className="mb-4">
            <Heart className="h-4 w-4 mr-2" />
            Customer Love
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold font-display text-brand-secondary-900 mb-6">
            What Our{' '}
            <span className="text-brand-gradient bg-gradient-brand bg-clip-text text-transparent">
              Customers
            </span>{' '}
            Say
          </h2>
          <p className="text-xl text-brand-secondary-600 max-w-3xl mx-auto">
            Don't just take our word for it. Here's what real customers say about their GoCars experience.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} variant="default" className="text-center">
                <CardContent className="p-6">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-brand-secondary-100 rounded-full mb-4">
                    <Icon className={cn('h-6 w-6', stat.color)} />
                  </div>
                  <div className="text-2xl font-bold text-brand-secondary-900 mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-brand-secondary-600">
                    {stat.label}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Main Testimonial */}
        <div className="relative">
          <Card variant="elevated" className="max-w-4xl mx-auto">
            <CardContent className="p-8 md:p-12">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
                {/* Customer Info */}
                <div className="text-center md:text-left">
                  <div className="relative inline-block mb-4">
                    <div className="w-20 h-20 bg-brand-secondary-100 rounded-full overflow-hidden">
                      <img
                        src={currentReview.avatar}
                        alt={currentReview.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {currentReview.verified && (
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-success-500 rounded-full flex items-center justify-center">
                        <CheckCircle className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </div>
                  
                  <h3 className="text-xl font-semibold text-brand-secondary-900 mb-1">
                    {currentReview.name}
                  </h3>
                  <p className="text-brand-secondary-600 text-sm mb-2">
                    {currentReview.role}
                  </p>
                  <div className="flex items-center justify-center md:justify-start space-x-1 mb-3">
                    <MapPin className="h-3 w-3 text-brand-secondary-400" />
                    <span className="text-xs text-brand-secondary-500">
                      {currentReview.location}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-center md:justify-start space-x-4 text-xs text-brand-secondary-500">
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-3 w-3" />
                      <span>{currentReview.date}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <MessageCircle className="h-3 w-3" />
                      <span>{currentReview.rides} rides</span>
                    </div>
                  </div>
                </div>

                {/* Testimonial Content */}
                <div className="md:col-span-2">
                  <div className="relative">
                    <Quote className="absolute -top-2 -left-2 h-8 w-8 text-brand-primary-200" />
                    <div className="pl-6">
                      {/* Rating */}
                      <div className="flex items-center space-x-1 mb-4">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={cn(
                              'h-5 w-5',
                              i < currentReview.rating
                                ? 'fill-warning-500 text-warning-500'
                                : 'text-brand-secondary-300'
                            )}
                          />
                        ))}
                        <span className="text-sm text-brand-secondary-600 ml-2">
                          {currentReview.rating}.0
                        </span>
                      </div>

                      {/* Review Text */}
                      <p className="text-lg text-brand-secondary-700 leading-relaxed mb-4">
                        {currentReview.content}
                      </p>

                      {/* Highlight */}
                      <div className="inline-flex items-center space-x-2 bg-brand-primary-50 px-3 py-1 rounded-full">
                        <div className="w-2 h-2 bg-brand-primary-500 rounded-full" />
                        <span className="text-sm font-medium text-brand-primary-700">
                          Loved: {currentReview.highlight}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8">
            <Button
              variant="ghost"
              size="icon"
              onClick={prevTestimonial}
              className="rounded-full"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>

            <div className="flex items-center space-x-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setCurrentTestimonial(index);
                    setIsAutoPlaying(false);
                  }}
                  className={cn(
                    'w-2 h-2 rounded-full transition-all duration-300',
                    index === currentTestimonial
                      ? 'bg-brand-primary-500 w-8'
                      : 'bg-brand-secondary-300 hover:bg-brand-secondary-400'
                  )}
                />
              ))}
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={nextTestimonial}
              className="rounded-full"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Additional Testimonials Grid */}
        <div className="mt-16">
          <h3 className="text-2xl font-bold text-center text-brand-secondary-900 mb-8">
            More Happy Customers
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.slice(0, 3).map((testimonial, index) => (
              <Card key={testimonial.id} variant="default" className="h-full">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-brand-secondary-100 rounded-full overflow-hidden">
                      <img
                        src={testimonial.avatar}
                        alt={testimonial.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-brand-secondary-900 text-sm">
                        {testimonial.name}
                      </div>
                      <div className="flex items-center space-x-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={cn(
                              'h-3 w-3',
                              i < testimonial.rating
                                ? 'fill-warning-500 text-warning-500'
                                : 'text-brand-secondary-300'
                            )}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-brand-secondary-600 leading-relaxed">
                    {testimonial.content.slice(0, 120)}...
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-16">
          <div className="bg-gradient-brand rounded-2xl p-8 text-white">
            <h3 className="text-2xl font-bold mb-4">
              Join Thousands of Happy Customers
            </h3>
            <p className="text-brand-primary-100 mb-6 max-w-2xl mx-auto">
              Experience the difference that makes GoCars the preferred choice for transportation in Huddersfield.
            </p>
            <Button size="lg" variant="secondary" className="bg-white text-brand-primary-600 hover:bg-brand-primary-50">
              <Play className="h-5 w-5 mr-2" />
              Start Your Journey
            </Button>
          </div>
        </div>
      </ResponsiveContainer>
    </section>
  );
}