'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HelpCircle, 
  X, 
  ChevronRight, 
  Lightbulb, 
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  MessageCircle,
  Book
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface HelpContent {
  id: string;
  title: string;
  content: string;
  type: 'tip' | 'warning' | 'info' | 'success';
  actions?: {
    label: string;
    action: () => void;
    variant?: 'default' | 'outline' | 'secondary';
  }[];
  relatedTopics?: string[];
  videoUrl?: string;
  documentationUrl?: string;
}

interface ContextualHelpProps {
  helpId: string;
  content: HelpContent;
  position?: 'top' | 'bottom' | 'left' | 'right';
  trigger?: 'hover' | 'click' | 'focus' | 'auto';
  delay?: number;
  persistent?: boolean;
  onDismiss?: () => void;
  onActionClick?: (actionId: string) => void;
}

interface TooltipHelpProps {
  content: string;
  title?: string;
  type?: 'tip' | 'warning' | 'info' | 'success';
  children: React.ReactNode;
}

const typeStyles = {
  tip: {
    icon: <Lightbulb className="h-4 w-4" />,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200'
  },
  warning: {
    icon: <AlertTriangle className="h-4 w-4" />,
    color: 'text-yellow-600',
    bg: 'bg-yellow-50',
    border: 'border-yellow-200'
  },
  info: {
    icon: <HelpCircle className="h-4 w-4" />,
    color: 'text-gray-600',
    bg: 'bg-gray-50',
    border: 'border-gray-200'
  },
  success: {
    icon: <CheckCircle className="h-4 w-4" />,
    color: 'text-green-600',
    bg: 'bg-green-50',
    border: 'border-green-200'
  }
};

export function ContextualHelp({
  helpId,
  content,
  position = 'bottom',
  trigger = 'hover',
  delay = 500,
  persistent = false,
  onDismiss,
  onActionClick
}: ContextualHelpProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (trigger === 'auto' && !isDismissed) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [trigger, delay, isDismissed]);

  const handleMouseEnter = () => {
    if (trigger === 'hover' && !isDismissed) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        setIsVisible(true);
      }, delay);
    }
  };

  const handleMouseLeave = () => {
    if (trigger === 'hover' && !persistent) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      setIsVisible(false);
    }
  };

  const handleClick = () => {
    if (trigger === 'click' && !isDismissed) {
      setIsVisible(!isVisible);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    onDismiss?.();
  };

  const handleActionClick = (action: any) => {
    action.action();
    onActionClick?.(action.label);
  };

  const style = typeStyles[content.type];

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        className="cursor-help"
      >
        <div className={`p-1 rounded-full ${style.bg} ${style.color}`}>
          {style.icon}
        </div>
      </div>

      <AnimatePresence>
        {isVisible && !isDismissed && (
          <motion.div
            ref={cardRef}
            initial={{ opacity: 0, scale: 0.9, y: position === 'top' ? 10 : -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: position === 'top' ? 10 : -10 }}
            transition={{ duration: 0.2 }}
            className={`absolute z-50 w-80 ${
              position === 'top' ? 'bottom-full mb-2' : 
              position === 'bottom' ? 'top-full mt-2' :
              position === 'left' ? 'right-full mr-2' :
              'left-full ml-2'
            }`}
          >
            <Card className={`shadow-lg ${style.border}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`${style.color}`}>
                      {style.icon}
                    </div>
                    <CardTitle className="text-sm font-medium">
                      {content.title}
                    </CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDismiss}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground mb-4">
                  {content.content}
                </p>

                {/* Actions */}
                {content.actions && content.actions.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {content.actions.map((action, index) => (
                      <Button
                        key={index}
                        variant={action.variant || 'outline'}
                        size="sm"
                        onClick={() => handleActionClick(action)}
                        className="text-xs"
                      >
                        {action.label}
                      </Button>
                    ))}
                  </div>
                )}

                {/* External Links */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {content.videoUrl && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(content.videoUrl, '_blank')}
                      className="text-xs flex items-center gap-1"
                    >
                      <MessageCircle className="h-3 w-3" />
                      Watch Video
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  )}
                  
                  {content.documentationUrl && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(content.documentationUrl, '_blank')}
                      className="text-xs flex items-center gap-1"
                    >
                      <Book className="h-3 w-3" />
                      Documentation
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  )}
                </div>

                {/* Related Topics */}
                {content.relatedTopics && content.relatedTopics.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">
                      Related Topics:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {content.relatedTopics.map((topic, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {topic}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function TooltipHelp({ content, title, type = 'info', children }: TooltipHelpProps) {
  const style = typeStyles[type];

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>
        <TooltipContent className={`max-w-xs ${style.bg} ${style.border}`}>
          {title && (
            <div className="flex items-center gap-2 mb-2">
              <div className={style.color}>
                {style.icon}
              </div>
              <span className="font-medium text-sm">{title}</span>
            </div>
          )}
          <p className="text-sm">{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Hook for managing contextual help state
export function useContextualHelp() {
  const [activeHelp, setActiveHelp] = useState<string | null>(null);
  const [dismissedHelp, setDismissedHelp] = useState<Set<string>>(new Set());

  const showHelp = (helpId: string) => {
    if (!dismissedHelp.has(helpId)) {
      setActiveHelp(helpId);
    }
  };

  const hideHelp = () => {
    setActiveHelp(null);
  };

  const dismissHelp = (helpId: string) => {
    setDismissedHelp(prev => new Set([...prev, helpId]));
    if (activeHelp === helpId) {
      setActiveHelp(null);
    }
  };

  const resetDismissed = () => {
    setDismissedHelp(new Set());
  };

  return {
    activeHelp,
    dismissedHelp,
    showHelp,
    hideHelp,
    dismissHelp,
    resetDismissed
  };
}

// Component for inline help text
export function InlineHelp({ 
  children, 
  helpText, 
  type = 'info' 
}: { 
  children: React.ReactNode; 
  helpText: string; 
  type?: 'tip' | 'warning' | 'info' | 'success';
}) {
  return (
    <div className="flex items-center gap-2">
      {children}
      <TooltipHelp content={helpText} type={type}>
        <div className="cursor-help">
          {typeStyles[type].icon}
        </div>
      </TooltipHelp>
    </div>
  );
}