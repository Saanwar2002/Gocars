/**
 * GoCars Brand Layout Component
 * Consistent page layout with GoCars brand styling
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { GoCarsLogo } from './GoCarsLogo';

interface BrandLayoutProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  background?: 'white' | 'gray' | 'gradient' | 'pattern';
}

export function BrandLayout({
  children,
  className,
  maxWidth = 'xl',
  padding = 'md',
  background = 'white'
}: BrandLayoutProps) {
  const maxWidthStyles = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    '2xl': 'max-w-7xl',
    full: 'max-w-none'
  };

  const paddingStyles = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-6 md:p-8',
    lg: 'p-8 md:p-12',
    xl: 'p-12 md:p-16'
  };

  const backgroundStyles = {
    white: 'bg-white',
    gray: 'bg-gray-50',
    gradient: 'bg-gradient-to-br from-gocars-blue-50 via-white to-gocars-purple-50',
    pattern: 'bg-white bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gocars-blue-50 via-white to-transparent'
  };

  return (
    <div className={cn(
      'min-h-screen',
      backgroundStyles[background]
    )}>
      <div className={cn(
        'mx-auto',
        maxWidthStyles[maxWidth],
        paddingStyles[padding],
        className
      )}>
        {children}
      </div>
    </div>
  );
}

// Page Header Component
export function BrandPageHeader({
  title,
  description,
  action,
  breadcrumb,
  className
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  breadcrumb?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('mb-8', className)}>
      {breadcrumb && (
        <div className="mb-4">
          {breadcrumb}
        </div>
      )}
      
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {title}
          </h1>
          {description && (
            <p className="text-lg text-gray-600 leading-relaxed">
              {description}
            </p>
          )}
        </div>
        
        {action && (
          <div className="ml-6 flex-shrink-0">
            {action}
          </div>
        )}
      </div>
    </div>
  );
}

// Section Component
export function BrandSection({
  title,
  description,
  action,
  children,
  className,
  spacing = 'md'
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  spacing?: 'sm' | 'md' | 'lg' | 'xl';
}) {
  const spacingStyles = {
    sm: 'mb-6',
    md: 'mb-8',
    lg: 'mb-12',
    xl: 'mb-16'
  };

  return (
    <section className={cn(spacingStyles[spacing], className)}>
      {(title || description || action) && (
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            {title && (
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                {title}
              </h2>
            )}
            {description && (
              <p className="text-gray-600 leading-relaxed">
                {description}
              </p>
            )}
          </div>
          
          {action && (
            <div className="ml-6 flex-shrink-0">
              {action}
            </div>
          )}
        </div>
      )}
      
      {children}
    </section>
  );
}

// Grid Layout Component
export function BrandGrid({
  children,
  cols = 'auto',
  gap = 'md',
  className
}: {
  children: React.ReactNode;
  cols?: 'auto' | 1 | 2 | 3 | 4 | 5 | 6;
  gap?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}) {
  const colsStyles = {
    auto: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-1 md:grid-cols-3 lg:grid-cols-5',
    6: 'grid-cols-1 md:grid-cols-3 lg:grid-cols-6'
  };

  const gapStyles = {
    sm: 'gap-4',
    md: 'gap-6',
    lg: 'gap-8',
    xl: 'gap-12'
  };

  return (
    <div className={cn(
      'grid',
      colsStyles[cols],
      gapStyles[gap],
      className
    )}>
      {children}
    </div>
  );
}

// Flex Layout Component
export function BrandFlex({
  children,
  direction = 'row',
  align = 'start',
  justify = 'start',
  wrap = false,
  gap = 'md',
  className
}: {
  children: React.ReactNode;
  direction?: 'row' | 'col';
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  wrap?: boolean;
  gap?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}) {
  const directionStyles = {
    row: 'flex-row',
    col: 'flex-col'
  };

  const alignStyles = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch'
  };

  const justifyStyles = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around',
    evenly: 'justify-evenly'
  };

  const gapStyles = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8'
  };

  return (
    <div className={cn(
      'flex',
      directionStyles[direction],
      alignStyles[align],
      justifyStyles[justify],
      wrap && 'flex-wrap',
      gapStyles[gap],
      className
    )}>
      {children}
    </div>
  );
}

// Brand Footer Component
export function BrandFooter({
  className
}: {
  className?: string;
}) {
  return (
    <footer className={cn(
      'mt-16 pt-8 border-t border-gray-200 text-center',
      className
    )}>
      <div className="flex flex-col items-center space-y-4">
        <GoCarsLogo size="sm" />
        <p className="text-sm text-gray-600">
          © 2025 GoCars. Your Journey, Our Priority.
        </p>
      </div>
    </footer>
  );
}

export default BrandLayout;