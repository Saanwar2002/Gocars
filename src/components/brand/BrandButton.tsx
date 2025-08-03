/**
 * GoCars Brand Button Component
 * Enhanced button component with GoCars brand styling and animations
 */

import React from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface BrandButtonProps extends ButtonProps {
  brand?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  loading?: boolean;
  loadingText?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export function BrandButton({
  brand = 'primary',
  loading = false,
  loadingText,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  rounded = 'md',
  className,
  children,
  disabled,
  ...props
}: BrandButtonProps) {
  const brandStyles = {
    primary: 'bg-gocars-blue-600 hover:bg-gocars-blue-700 text-white shadow-gocars-md hover:shadow-gocars-lg border-0',
    secondary: 'bg-white hover:bg-gray-50 text-gocars-blue-600 border-2 border-gocars-blue-600 hover:border-gocars-blue-700 shadow-gocars-sm hover:shadow-gocars-md',
    success: 'bg-gocars-green-600 hover:bg-gocars-green-700 text-white shadow-gocars-md hover:shadow-gocars-lg border-0',
    warning: 'bg-gocars-orange-600 hover:bg-gocars-orange-700 text-white shadow-gocars-md hover:shadow-gocars-lg border-0',
    danger: 'bg-gocars-red-600 hover:bg-gocars-red-700 text-white shadow-gocars-md hover:shadow-gocars-lg border-0'
  };

  const roundedStyles = {
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    full: 'rounded-full'
  };

  const isDisabled = disabled || loading;

  return (
    <Button
      className={cn(
        // Base styles
        'relative font-medium transition-all duration-200 transform',
        'hover:scale-[1.02] active:scale-[0.98]',
        'focus:ring-2 focus:ring-gocars-blue-500 focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none',
        
        // Brand styles
        brandStyles[brand],
        
        // Rounded styles
        roundedStyles[rounded],
        
        // Full width
        fullWidth && 'w-full',
        
        // Loading state
        loading && 'cursor-wait',
        
        className
      )}
      disabled={isDisabled}
      {...props}
    >
      {/* Loading spinner */}
      {loading && (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      )}
      
      {/* Left icon */}
      {!loading && icon && iconPosition === 'left' && (
        <span className="mr-2 flex items-center">
          {icon}
        </span>
      )}
      
      {/* Button text */}
      <span className={cn(
        'flex items-center',
        loading && 'opacity-70'
      )}>
        {loading && loadingText ? loadingText : children}
      </span>
      
      {/* Right icon */}
      {!loading && icon && iconPosition === 'right' && (
        <span className="ml-2 flex items-center">
          {icon}
        </span>
      )}
    </Button>
  );
}

// Preset brand button components
export function PrimaryButton(props: Omit<BrandButtonProps, 'brand'>) {
  return <BrandButton {...props} brand="primary" />;
}

export function SecondaryButton(props: Omit<BrandButtonProps, 'brand'>) {
  return <BrandButton {...props} brand="secondary" />;
}

export function SuccessButton(props: Omit<BrandButtonProps, 'brand'>) {
  return <BrandButton {...props} brand="success" />;
}

export function WarningButton(props: Omit<BrandButtonProps, 'brand'>) {
  return <BrandButton {...props} brand="warning" />;
}

export function DangerButton(props: Omit<BrandButtonProps, 'brand'>) {
  return <BrandButton {...props} brand="danger" />;
}

export default BrandButton;