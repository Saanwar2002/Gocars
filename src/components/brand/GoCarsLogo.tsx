/**
 * GoCars Logo Component
 * SVG-based logo with multiple variations and consistent styling
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface GoCarsLogoProps {
  variant?: 'primary' | 'white' | 'monochrome' | 'icon';
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'custom';
  width?: number;
  height?: number;
  className?: string;
}

export function GoCarsLogo({ 
  variant = 'primary', 
  size = 'md', 
  width, 
  height, 
  className 
}: GoCarsLogoProps) {
  // Size configurations
  const sizeConfig = {
    sm: { width: 80, height: 24 },
    md: { width: 120, height: 36 },
    lg: { width: 160, height: 48 },
    xl: { width: 200, height: 60 },
    custom: { width: width || 120, height: height || 36 }
  };

  const { width: logoWidth, height: logoHeight } = sizeConfig[size];

  // Color configurations based on variant
  const getColors = () => {
    switch (variant) {
      case 'white':
        return {
          primary: '#ffffff',
          secondary: '#ffffff',
          accent: '#ffffff'
        };
      case 'monochrome':
        return {
          primary: 'currentColor',
          secondary: 'currentColor', 
          accent: 'currentColor'
        };
      case 'icon':
      case 'primary':
      default:
        return {
          primary: '#2563eb', // GoCars Blue
          secondary: '#059669', // GoCars Green
          accent: '#7c3aed'     // Deep Purple
        };
    }
  };

  const colors = getColors();

  // Icon-only version (simplified mark)
  if (variant === 'icon') {
    return (
      <svg
        width={logoWidth}
        height={logoHeight}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={cn('flex-shrink-0', className)}
        role="img"
        aria-label="GoCars"
      >
        {/* Circular background */}
        <circle cx="20" cy="20" r="18" fill={colors.primary} />
        
        {/* Stylized "G" with car element */}
        <path
          d="M12 14c0-2.2 1.8-4 4-4h8c1.1 0 2 .9 2 2s-.9 2-2 2h-6v2h4c1.1 0 2 .9 2 2s-.9 2-2 2h-4v2h6c1.1 0 2 .9 2 2s-.9 2-2 2h-8c-2.2 0-4-1.8-4-4V14z"
          fill="white"
        />
        
        {/* Car wheels accent */}
        <circle cx="15" cy="28" r="2" fill={colors.secondary} />
        <circle cx="25" cy="28" r="2" fill={colors.secondary} />
      </svg>
    );
  }

  // Full wordmark logo
  return (
    <svg
      width={logoWidth}
      height={logoHeight}
      viewBox="0 0 200 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('flex-shrink-0', className)}
      role="img"
      aria-label="GoCars"
    >
      {/* "Go" part */}
      <g>
        {/* G */}
        <path
          d="M8 15c0-4.4 3.6-8 8-8h16c2.2 0 4 1.8 4 4s-1.8 4-4 4H20v4h8c2.2 0 4 1.8 4 4s-1.8 4-4 4h-8v4h12c2.2 0 4 1.8 4 4s-1.8 4-4 4H16c-4.4 0-8-3.6-8-8V15z"
          fill={colors.primary}
        />
        
        {/* O */}
        <circle
          cx="55"
          cy="30"
          r="15"
          stroke={colors.primary}
          strokeWidth="6"
          fill="none"
        />
      </g>

      {/* "Cars" part */}
      <g transform="translate(85, 0)">
        {/* C */}
        <path
          d="M8 30c0-12.15 9.85-22 22-22s22 9.85 22 22-9.85 22-22 22c-6.05 0-11.55-2.45-15.55-6.4"
          stroke={colors.secondary}
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
        />
        
        {/* A */}
        <path
          d="M60 52L70 15h4l10 37h-4l-2-7h-12l-2 7h-4zm8-11h8l-4-14-4 14z"
          fill={colors.secondary}
        />
        
        {/* R */}
        <path
          d="M95 15v37h-4V15h14c4.4 0 8 3.6 8 8s-3.6 8-8 8h-6l8 21h-4.5l-7.5-21zm0 4v12h10c2.2 0 4-1.8 4-4s-1.8-4-4-4h-10z"
          fill={colors.secondary}
        />
        
        {/* S */}
        <path
          d="M125 19c0-2.2 1.8-4 4-4h12c2.2 0 4 1.8 4 4s-1.8 4-4 4h-8v8h8c4.4 0 8 3.6 8 8s-3.6 8-8 8h-12c-2.2 0-4-1.8-4-4s1.8-4 4-4h8v-8h-8c-4.4 0-8-3.6-8-8z"
          fill={colors.secondary}
        />
      </g>

      {/* Accent elements (car-like details) */}
      <g opacity="0.8">
        {/* Wheels */}
        <circle cx="25" cy="50" r="3" fill={colors.accent} />
        <circle cx="45" cy="50" r="3" fill={colors.accent} />
        <circle cx="130" cy="50" r="3" fill={colors.accent} />
        <circle cx="150" cy="50" r="3" fill={colors.accent} />
        
        {/* Motion lines */}
        <path
          d="M170 25h8M170 30h6M170 35h4"
          stroke={colors.accent}
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.6"
        />
      </g>
    </svg>
  );
}

// Preset logo components for common use cases
export function GoCarsLogoPrimary(props: Omit<GoCarsLogoProps, 'variant'>) {
  return <GoCarsLogo {...props} variant="primary" />;
}

export function GoCarsLogoWhite(props: Omit<GoCarsLogoProps, 'variant'>) {
  return <GoCarsLogo {...props} variant="white" />;
}

export function GoCarsLogoIcon(props: Omit<GoCarsLogoProps, 'variant'>) {
  return <GoCarsLogo {...props} variant="icon" />;
}

export function GoCarsLogoMonochrome(props: Omit<GoCarsLogoProps, 'variant'>) {
  return <GoCarsLogo {...props} variant="monochrome" />;
}

// Logo with tagline
export function GoCarsLogoWithTagline({ 
  variant = 'primary', 
  size = 'md', 
  className 
}: Omit<GoCarsLogoProps, 'width' | 'height'>) {
  const sizeConfig = {
    sm: { logoSize: 'sm' as const, taglineSize: 'text-xs' },
    md: { logoSize: 'md' as const, taglineSize: 'text-sm' },
    lg: { logoSize: 'lg' as const, taglineSize: 'text-base' },
    xl: { logoSize: 'xl' as const, taglineSize: 'text-lg' }
  };

  const { logoSize, taglineSize } = sizeConfig[size];
  const textColor = variant === 'white' ? 'text-white' : 
                   variant === 'monochrome' ? 'text-current' : 'text-slate-600';

  return (
    <div className={cn('flex flex-col items-start space-y-1', className)}>
      <GoCarsLogo variant={variant} size={logoSize} />
      <p className={cn('font-medium tracking-wide', taglineSize, textColor)}>
        Your Journey, Our Priority
      </p>
    </div>
  );
}

export default GoCarsLogo;