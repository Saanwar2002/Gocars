'use client';

import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface TourStep {
  id: string;
  title: string;
  content: string;
  target: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface GuidedTourProps {
  steps: TourStep[];
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  userRole: 'passenger' | 'driver' | 'operator' | 'admin';
}

export function GuidedTour({ steps, isOpen, onClose, onComplete, userRole }: GuidedTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const targetElement = document.querySelector(steps[currentStep]?.target) as HTMLElement;
    if (targetElement) {
      setHighlightedElement(targetElement);
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // Add highlight class
      targetElement.classList.add('tour-highlight');
      
      return () => {
        targetElement.classList.remove('tour-highlight');
      };
    }
  }, [currentStep, isOpen, steps]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    onComplete();
    onClose();
  };

  const handleSkip = () => {
    onClose();
  };

  if (!isOpen || !steps[currentStep]) return null;

  const step = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-50 tour-overlay" />
      
      {/* Tour Card */}
      <div className="fixed z-[60] tour-card">
        <Card className="w-80 shadow-2xl border-2 border-primary/20">
          <CardContent className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  Step {currentStep + 1} of {steps.length}
                </Badge>
                <Badge variant="outline" className="text-xs capitalize">
                  {userRole}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSkip}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-muted rounded-full h-2 mb-4">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Content */}
            <div className="mb-6">
              <h3 className="font-semibold text-lg mb-2 text-foreground">
                {step.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {step.content}
              </p>
            </div>

            {/* Action Button */}
            {step.action && (
              <div className="mb-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={step.action.onClick}
                  className="w-full"
                >
                  {step.action.label}
                </Button>
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePrevious}
                disabled={currentStep === 0}
                className="flex items-center gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>

              <div className="flex gap-1">
                {steps.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentStep
                        ? 'bg-primary'
                        : index < currentStep
                        ? 'bg-primary/60'
                        : 'bg-muted'
                    }`}
                  />
                ))}
              </div>

              <Button
                size="sm"
                onClick={handleNext}
                className="flex items-center gap-1"
              >
                {currentStep === steps.length - 1 ? (
                  <>
                    <Check className="h-4 w-4" />
                    Complete
                  </>
                ) : (
                  <>
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <style jsx global>{`
        .tour-highlight {
          position: relative;
          z-index: 55;
          box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.3), 0 0 0 8px rgba(37, 99, 235, 0.1);
          border-radius: 8px;
          transition: all 0.3s ease;
        }
        
        .tour-card {
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
        }
        
        @media (max-width: 640px) {
          .tour-card {
            top: auto;
            bottom: 20px;
            left: 20px;
            right: 20px;
            transform: none;
          }
          
          .tour-card .w-80 {
            width: 100%;
          }
        }
      `}</style>
    </>
  );
}