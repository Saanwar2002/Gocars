/**
 * GoCars Brand Card Component
 * Enhanced card component with GoCars brand styling and animations
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface BrandCardProps {
  variant?: 'default' | 'elevated' | 'outlined' | 'glass' | 'gradient';
  hover?: boolean;
  interactive?: boolean;
  padding?: 'sm' | 'md' | 'lg' | 'xl';
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  children?: React.ReactNode;
  onClick?: () => void;
}

export function BrandCard({
  variant = 'default',
  hover = true,
  interactive = false,
  padding = 'md',
  rounded = 'lg',
  className,
  children,
  onClick,
  ...props
}: BrandCardProps) {
  const variantStyles = {
    default: 'bg-white border border-gray-200 shadow-gocars-sm',
    elevated: 'bg-white border-0 shadow-gocars-lg',
    outlined: 'bg-white border-2 border-gocars-blue-200 shadow-none',
    glass: 'bg-white/80 backdrop-blur-sm border border-white/20 shadow-gocars-md',
    gradient: 'bg-gradient-to-br from-gocars-blue-50 to-gocars-purple-50 border border-gocars-blue-100 shadow-gocars-sm'
  };

  const paddingStyles = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-10'
  };

  const roundedStyles = {
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl'
  };

  const hoverStyles = hover ? 'hover:shadow-gocars-md hover:-translate-y-1' : '';
  const interactiveStyles = interactive ? 'cursor-pointer transition-all duration-200 hover:scale-[1.02]' : '';

  return (
    <Card
      className={cn(
        // Base styles
        'transition-all duration-200',
        
        // Variant styles
        variantStyles[variant],
        
        // Padding styles
        paddingStyles[padding],
        
        // Rounded styles
        roundedStyles[rounded],
        
        // Hover styles
        hoverStyles,
        
        // Interactive styles
        interactiveStyles,
        
        className
      )}
      onClick={onClick}
      {...props}
    >
      {children}
    </Card>
  );
}

// Enhanced Card Header with brand styling
export function BrandCardHeader({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <CardHeader
      className={cn(
        'pb-4 border-b border-gray-100',
        className
      )}
      {...props}
    >
      {children}
    </CardHeader>
  );
}

// Enhanced Card Title with brand typography
export function BrandCardTitle({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <CardTitle
      className={cn(
        'text-xl font-semibold text-gray-900 leading-tight',
        className
      )}
      {...props}
    >
      {children}
    </CardTitle>
  );
}

// Enhanced Card Description with brand typography
export function BrandCardDescription({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <CardDescription
      className={cn(
        'text-gray-600 leading-relaxed mt-2',
        className
      )}
      {...props}
    >
      {children}
    </CardDescription>
  );
}

// Enhanced Card Content with brand spacing
export function BrandCardContent({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <CardContent
      className={cn(
        'py-4',
        className
      )}
      {...props}
    >
      {children}
    </CardContent>
  );
}

// Enhanced Card Footer with brand styling
export function BrandCardFooter({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <CardFooter
      className={cn(
        'pt-4 border-t border-gray-100 flex items-center justify-between',
        className
      )}
      {...props}
    >
      {children}
    </CardFooter>
  );
}

// Preset card components
export function FeatureCard({
  icon,
  title,
  description,
  action,
  className,
  ...props
}: {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
} & Omit<BrandCardProps, 'children'>) {
  return (
    <BrandCard
      variant="elevated"
      hover
      interactive
      className={cn('group', className)}
      {...props}
    >
      <BrandCardHeader>
        {icon && (
          <div className="mb-4 p-3 bg-gocars-blue-50 rounded-lg w-fit group-hover:bg-gocars-blue-100 transition-colors">
            {icon}
          </div>
        )}
        <BrandCardTitle>{title}</BrandCardTitle>
        <BrandCardDescription>{description}</BrandCardDescription>
      </BrandCardHeader>
      {action && (
        <BrandCardFooter>
          {action}
        </BrandCardFooter>
      )}
    </BrandCard>
  );
}

export function StatsCard({
  value,
  label,
  change,
  trend,
  icon,
  className,
  ...props
}: {
  value: string | number;
  label: string;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon?: React.ReactNode;
  className?: string;
} & Omit<BrandCardProps, 'children'>) {
  const trendColors = {
    up: 'text-gocars-green-600',
    down: 'text-gocars-red-600',
    neutral: 'text-gray-500'
  };

  return (
    <BrandCard
      variant="default"
      hover
      className={className}
      {...props}
    >
      <BrandCardContent>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-sm text-gray-600 mt-1">{label}</p>
            {change && trend && (
              <p className={cn('text-sm font-medium mt-2', trendColors[trend])}>
                {change}
              </p>
            )}
          </div>
          {icon && (
            <div className="p-3 bg-gocars-blue-50 rounded-lg">
              {icon}
            </div>
          )}
        </div>
      </BrandCardContent>
    </BrandCard>
  );
}

export default BrandCard;