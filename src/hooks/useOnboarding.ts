'use client';

import { useState, useEffect } from 'react';

interface OnboardingState {
  isFirstTime: boolean;
  completedSteps: string[];
  skippedSteps: string[];
  userRole: 'passenger' | 'driver' | 'operator' | 'admin';
  userExperience: 'beginner' | 'intermediate' | 'advanced';
  lastCompletedAt?: Date;
  tourPreferences: {
    showTooltips: boolean;
    autoAdvance: boolean;
    playAnimations: boolean;
  };
}

const DEFAULT_ONBOARDING_STATE: OnboardingState = {
  isFirstTime: true,
  completedSteps: [],
  skippedSteps: [],
  userRole: 'passenger',
  userExperience: 'beginner',
  tourPreferences: {
    showTooltips: true,
    autoAdvance: false,
    playAnimations: true
  }
};

const STORAGE_KEY = 'gocars-onboarding-state';

export function useOnboarding() {
  const [onboardingState, setOnboardingState] = useState<OnboardingState>(DEFAULT_ONBOARDING_STATE);
  const [isLoading, setIsLoading] = useState(true);

  // Load onboarding state from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setOnboardingState({
          ...DEFAULT_ONBOARDING_STATE,
          ...parsed,
          lastCompletedAt: parsed.lastCompletedAt ? new Date(parsed.lastCompletedAt) : undefined
        });
      }
    } catch (error) {
      console.error('Failed to load onboarding state:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save onboarding state to localStorage whenever it changes
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(onboardingState));
      } catch (error) {
        console.error('Failed to save onboarding state:', error);
      }
    }
  }, [onboardingState, isLoading]);

  const updateOnboardingState = (updates: Partial<OnboardingState>) => {
    setOnboardingState(prev => ({
      ...prev,
      ...updates
    }));
  };

  const completeStep = (stepId: string) => {
    setOnboardingState(prev => ({
      ...prev,
      completedSteps: [...prev.completedSteps.filter(id => id !== stepId), stepId],
      skippedSteps: prev.skippedSteps.filter(id => id !== stepId),
      lastCompletedAt: new Date()
    }));
  };

  const skipStep = (stepId: string) => {
    setOnboardingState(prev => ({
      ...prev,
      skippedSteps: [...prev.skippedSteps.filter(id => id !== stepId), stepId],
      completedSteps: prev.completedSteps.filter(id => id !== stepId)
    }));
  };

  const completeOnboarding = () => {
    setOnboardingState(prev => ({
      ...prev,
      isFirstTime: false,
      lastCompletedAt: new Date()
    }));
  };

  const resetOnboarding = () => {
    setOnboardingState(DEFAULT_ONBOARDING_STATE);
    localStorage.removeItem(STORAGE_KEY);
  };

  const skipOnboarding = () => {
    setOnboardingState(prev => ({
      ...prev,
      isFirstTime: false,
      skippedSteps: ['welcome', 'guided-tour', 'advanced-features']
    }));
  };

  const updateUserProfile = (role: OnboardingState['userRole'], experience: OnboardingState['userExperience']) => {
    setOnboardingState(prev => ({
      ...prev,
      userRole: role,
      userExperience: experience
    }));
  };

  const updateTourPreferences = (preferences: Partial<OnboardingState['tourPreferences']>) => {
    setOnboardingState(prev => ({
      ...prev,
      tourPreferences: {
        ...prev.tourPreferences,
        ...preferences
      }
    }));
  };

  const isStepCompleted = (stepId: string) => {
    return onboardingState.completedSteps.includes(stepId);
  };

  const isStepSkipped = (stepId: string) => {
    return onboardingState.skippedSteps.includes(stepId);
  };

  const shouldShowOnboarding = () => {
    return onboardingState.isFirstTime && !isLoading;
  };

  const getCompletionPercentage = (totalSteps: number) => {
    return Math.round((onboardingState.completedSteps.length / totalSteps) * 100);
  };

  const canAccessStep = (stepId: string, prerequisites: string[] = []) => {
    return prerequisites.every(prereq => isStepCompleted(prereq));
  };

  return {
    // State
    onboardingState,
    isLoading,
    
    // Actions
    updateOnboardingState,
    completeStep,
    skipStep,
    completeOnboarding,
    resetOnboarding,
    skipOnboarding,
    updateUserProfile,
    updateTourPreferences,
    
    // Queries
    isStepCompleted,
    isStepSkipped,
    shouldShowOnboarding,
    getCompletionPercentage,
    canAccessStep
  };
}

// Hook for managing contextual help visibility
export function useContextualHelp() {
  const [visibleHelp, setVisibleHelp] = useState<Set<string>>(new Set());
  const [dismissedHelp, setDismissedHelp] = useState<Set<string>>(new Set());

  const showHelp = (helpId: string) => {
    if (!dismissedHelp.has(helpId)) {
      setVisibleHelp(prev => new Set([...prev, helpId]));
    }
  };

  const hideHelp = (helpId: string) => {
    setVisibleHelp(prev => {
      const newSet = new Set(prev);
      newSet.delete(helpId);
      return newSet;
    });
  };

  const dismissHelp = (helpId: string) => {
    setDismissedHelp(prev => new Set([...prev, helpId]));
    hideHelp(helpId);
  };

  const isHelpVisible = (helpId: string) => {
    return visibleHelp.has(helpId);
  };

  const isHelpDismissed = (helpId: string) => {
    return dismissedHelp.has(helpId);
  };

  const resetHelp = () => {
    setVisibleHelp(new Set());
    setDismissedHelp(new Set());
  };

  return {
    showHelp,
    hideHelp,
    dismissHelp,
    isHelpVisible,
    isHelpDismissed,
    resetHelp
  };
}

// Hook for managing tour state
export function useTour() {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const startTour = () => {
    setIsActive(true);
    setCurrentStep(0);
    setCompletedSteps(new Set());
  };

  const endTour = () => {
    setIsActive(false);
    setCurrentStep(0);
  };

  const nextStep = (totalSteps: number) => {
    if (currentStep < totalSteps - 1) {
      setCompletedSteps(prev => new Set([...prev, currentStep]));
      setCurrentStep(currentStep + 1);
    } else {
      setCompletedSteps(prev => new Set([...prev, currentStep]));
      endTour();
    }
  };

  const previousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToStep = (step: number) => {
    setCurrentStep(step);
  };

  const skipTour = () => {
    endTour();
  };

  return {
    isActive,
    currentStep,
    completedSteps,
    startTour,
    endTour,
    nextStep,
    previousStep,
    goToStep,
    skipTour
  };
}