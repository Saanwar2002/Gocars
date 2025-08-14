'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDown, 
  ChevronRight, 
  Info, 
  Lightbulb, 
  AlertCircle,
  CheckCircle,
  HelpCircle,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface DisclosureLevel {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  complexity: 'basic' | 'intermediate' | 'advanced';
  content: React.ReactNode;
  prerequisites?: string[];
  estimatedTime?: string;
}

interface ProgressiveDisclosureProps {
  topic: string;
  levels: DisclosureLevel[];
  userExperience: 'beginner' | 'intermediate' | 'advanced';
  onLevelComplete?: (levelId: string) => void;
  onAllComplete?: () => void;
}

const complexityColors = {
  basic: 'bg-green-100 text-green-800 border-green-200',
  intermediate: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  advanced: 'bg-red-100 text-red-800 border-red-200'
};

const complexityIcons = {
  basic: <CheckCircle className="h-4 w-4" />,
  intermediate: <AlertCircle className="h-4 w-4" />,
  advanced: <Zap className="h-4 w-4" />
};

export function ProgressiveDisclosure({ 
  topic, 
  levels, 
  userExperience, 
  onLevelComplete,
  onAllComplete 
}: ProgressiveDisclosureProps) {
  const [openLevels, setOpenLevels] = useState<Set<string>>(new Set());
  const [completedLevels, setCompletedLevels] = useState<Set<string>>(new Set());
  const [currentLevel, setCurrentLevel] = useState<string | null>(null);

  // Auto-open appropriate levels based on user experience
  useEffect(() => {
    const autoOpenLevels = new Set<string>();
    
    if (userExperience === 'beginner') {
      // Open only basic levels for beginners
      levels.filter(level => level.complexity === 'basic').forEach(level => {
        autoOpenLevels.add(level.id);
      });
    } else if (userExperience === 'intermediate') {
      // Open basic and intermediate for intermediate users
      levels.filter(level => ['basic', 'intermediate'].includes(level.complexity)).forEach(level => {
        autoOpenLevels.add(level.id);
      });
    } else {
      // Show all levels for advanced users
      levels.forEach(level => {
        autoOpenLevels.add(level.id);
      });
    }
    
    setOpenLevels(autoOpenLevels);
    
    // Set first appropriate level as current
    const firstLevel = levels.find(level => autoOpenLevels.has(level.id));
    if (firstLevel) {
      setCurrentLevel(firstLevel.id);
    }
  }, [userExperience, levels]);

  const toggleLevel = (levelId: string) => {
    setOpenLevels(prev => {
      const newSet = new Set(prev);
      if (newSet.has(levelId)) {
        newSet.delete(levelId);
      } else {
        newSet.add(levelId);
      }
      return newSet;
    });
  };

  const completeLevel = (levelId: string) => {
    setCompletedLevels(prev => new Set([...prev, levelId]));
    onLevelComplete?.(levelId);
    
    // Auto-advance to next level
    const currentIndex = levels.findIndex(level => level.id === levelId);
    const nextLevel = levels[currentIndex + 1];
    if (nextLevel) {
      setCurrentLevel(nextLevel.id);
      setOpenLevels(prev => new Set([...prev, nextLevel.id]));
    }
    
    // Check if all levels are completed
    if (completedLevels.size + 1 === levels.length) {
      onAllComplete?.();
    }
  };

  const canAccessLevel = (level: DisclosureLevel) => {
    if (!level.prerequisites) return true;
    return level.prerequisites.every(prereq => completedLevels.has(prereq));
  };

  const getRecommendedLevels = () => {
    return levels.filter(level => {
      if (userExperience === 'beginner') {
        return level.complexity === 'basic';
      } else if (userExperience === 'intermediate') {
        return ['basic', 'intermediate'].includes(level.complexity);
      }
      return true;
    });
  };

  const recommendedLevels = getRecommendedLevels();

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Lightbulb className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">{topic}</h2>
            <p className="text-muted-foreground">
              Learn at your own pace with progressive complexity
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 mb-4">
          <Badge variant="outline" className="capitalize">
            {userExperience} Level
          </Badge>
          <Badge variant="secondary">
            {completedLevels.size} of {levels.length} completed
          </Badge>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-muted rounded-full h-2 mb-6">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-500"
            style={{ width: `${(completedLevels.size / levels.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="space-y-4">
        {levels.map((level, index) => {
          const isOpen = openLevels.has(level.id);
          const isCompleted = completedLevels.has(level.id);
          const isCurrent = currentLevel === level.id;
          const canAccess = canAccessLevel(level);
          const isRecommended = recommendedLevels.includes(level);

          return (
            <motion.div
              key={level.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`transition-all duration-300 ${
                isCurrent ? 'ring-2 ring-primary shadow-lg' : ''
              } ${
                isCompleted ? 'bg-green-50 border-green-200' : ''
              } ${
                !canAccess ? 'opacity-60' : ''
              }`}>
                <Collapsible open={isOpen} onOpenChange={() => toggleLevel(level.id)}>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            {level.icon}
                          </div>
                          <div className="text-left">
                            <CardTitle className="flex items-center gap-2">
                              {level.title}
                              {isCompleted && (
                                <CheckCircle className="h-5 w-5 text-green-600" />
                              )}
                              {!isRecommended && (
                                <Badge variant="outline" size="sm">
                                  Optional
                                </Badge>
                              )}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                              {level.description}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="outline" 
                            className={`${complexityColors[level.complexity]} flex items-center gap-1`}
                          >
                            {complexityIcons[level.complexity]}
                            {level.complexity}
                          </Badge>
                          
                          {level.estimatedTime && (
                            <Badge variant="secondary" size="sm">
                              {level.estimatedTime}
                            </Badge>
                          )}
                          
                          <motion.div
                            animate={{ rotate: isOpen ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <ChevronDown className="h-5 w-5" />
                          </motion.div>
                        </div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  
                  <AnimatePresence>
                    {isOpen && (
                      <CollapsibleContent>
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <CardContent className="pt-0">
                            {/* Prerequisites */}
                            {level.prerequisites && level.prerequisites.length > 0 && (
                              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                  <Info className="h-4 w-4 text-yellow-600" />
                                  <span className="text-sm font-medium text-yellow-800">
                                    Prerequisites
                                  </span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {level.prerequisites.map(prereq => {
                                    const prereqLevel = levels.find(l => l.id === prereq);
                                    const isPrereqCompleted = completedLevels.has(prereq);
                                    return (
                                      <Badge 
                                        key={prereq}
                                        variant={isPrereqCompleted ? "default" : "outline"}
                                        size="sm"
                                        className={isPrereqCompleted ? "bg-green-100 text-green-800" : ""}
                                      >
                                        {isPrereqCompleted && <CheckCircle className="h-3 w-3 mr-1" />}
                                        {prereqLevel?.title || prereq}
                                      </Badge>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Content */}
                            <div className="mb-6">
                              {level.content}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {!canAccess && (
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <HelpCircle className="h-4 w-4" />
                                    Complete prerequisites to unlock
                                  </div>
                                )}
                              </div>
                              
                              <Button
                                onClick={() => completeLevel(level.id)}
                                disabled={!canAccess || isCompleted}
                                variant={isCompleted ? "secondary" : "default"}
                                size="sm"
                                className="flex items-center gap-2"
                              >
                                {isCompleted ? (
                                  <>
                                    <CheckCircle className="h-4 w-4" />
                                    Completed
                                  </>
                                ) : (
                                  <>
                                    Mark Complete
                                    <ChevronRight className="h-4 w-4" />
                                  </>
                                )}
                              </Button>
                            </div>
                          </CardContent>
                        </motion.div>
                      </CollapsibleContent>
                    )}
                  </AnimatePresence>
                </Collapsible>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Completion Message */}
      <AnimatePresence>
        {completedLevels.size === levels.length && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="mt-8"
          >
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-6 text-center">
                <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-green-800 mb-2">
                  Congratulations!
                </h3>
                <p className="text-green-700 mb-4">
                  You've completed all levels of {topic}. You're now ready to use these features effectively.
                </p>
                <Badge variant="default" className="bg-green-600">
                  Expert Level Achieved
                </Badge>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}