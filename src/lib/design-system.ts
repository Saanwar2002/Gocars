/**
 * GoCars Design System Utilities
 * Programmatic access to design tokens and utilities
 */

import { brandColors, typography, spacing, borderRadius, boxShadow } from '@/config/brand';

// Design token getters
export const getColor = (path: string): string => {
  const keys = path.split('.');
  let value: any = brandColors;
  
  for (const key of keys) {
    value = value?.[key];
    if (value === undefined) {
      console.warn(`Color path "${path}" not found in brand colors`);
      return '#000000'; // fallback
    }
  }
  
  return value;
};

export const getSpacing = (size: keyof typeof spacing): string => {
  return spacing[size] || spacing[4]; // fallback to 1rem
};

export const getRadius = (size: keyof typeof borderRadius): string => {
  return borderRadius[size] || borderRadius.DEFAULT;
};

export const getShadow = (size: keyof typeof boxShadow): string => {
  return boxShadow[size] || boxShadow.DEFAULT;
};

// Responsive utilities
export const breakpoints = {
  xs: 475,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

export type Breakpoint = keyof typeof breakpoints;

export const getBreakpoint = (): Breakpoint => {
  if (typeof window === 'undefined') return 'lg';
  
  const width = window.innerWidth;
  if (width >= breakpoints['2xl']) return '2xl';
  if (width >= breakpoints.xl) return 'xl';
  if (width >= breakpoints.lg) return 'lg';
  if (width >= breakpoints.md) return 'md';
  if (width >= breakpoints.sm) return 'sm';
  return 'xs';
};

export const isBreakpoint = (breakpoint: Breakpoint): boolean => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth >= breakpoints[breakpoint];
};

// Color utilities
export const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

export const rgbToHex = (r: number, g: number, b: number): string => {
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
};

export const getContrastRatio = (color1: string, color2: string): number => {
  const getLuminance = (hex: string): number => {
    const rgb = hexToRgb(hex);
    if (!rgb) return 0;
    
    const { r, g, b } = rgb;
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };
  
  const l1 = getLuminance(color1);
  const l2 = getLuminance(color2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  
  return (lighter + 0.05) / (darker + 0.05);
};

export const isAccessible = (
  foreground: string, 
  background: string, 
  level: 'AA' | 'AAA' = 'AA'
): boolean => {
  const ratio = getContrastRatio(foreground, background);
  return level === 'AA' ? ratio >= 4.5 : ratio >= 7;
};

// Animation utilities
export const animationClasses = {
  fadeIn: 'animate-fade-in',
  fadeInUp: 'animate-fade-in-up',
  fadeInDown: 'animate-fade-in-down',
  slideInRight: 'animate-slide-in-right',
  slideInLeft: 'animate-slide-in-left',
  scaleIn: 'animate-scale-in',
  bounceGentle: 'animate-bounce-gentle',
  shimmer: 'animate-shimmer',
  loadingDots: 'animate-loading-dots',
  pulseBrand: 'animate-pulse-brand',
  float: 'animate-float',
  wiggle: 'animate-wiggle',
  slideUp: 'animate-slide-up',
  slideDown: 'animate-slide-down',
} as const;

// Component style generators
export const generateButtonStyles = (variant: 'primary' | 'secondary' | 'accent' = 'primary') => {
  const baseStyles = 'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2';
  
  const variants = {
    primary: 'bg-brand-primary-500 text-white hover:bg-brand-primary-600 focus-visible:ring-brand-primary-500 shadow-sm hover:shadow-brand-md hover:-translate-y-0.5',
    secondary: 'bg-brand-secondary-100 text-brand-secondary-900 hover:bg-brand-secondary-200 focus-visible:ring-brand-secondary-500 shadow-sm hover:shadow-md hover:-translate-y-0.5',
    accent: 'bg-brand-accent-yellow-500 text-brand-secondary-900 hover:bg-brand-accent-yellow-600 focus-visible:ring-brand-accent-yellow-500 shadow-sm hover:shadow-brand-md hover:-translate-y-0.5',
  };
  
  return `${baseStyles} ${variants[variant]}`;
};

export const generateCardStyles = (variant: 'default' | 'elevated' = 'default') => {
  const baseStyles = 'bg-white rounded-xl transition-all duration-200';
  
  const variants = {
    default: 'border border-brand-secondary-200 shadow-sm hover:shadow-brand-lg hover:-translate-y-1 p-6',
    elevated: 'shadow-brand-lg hover:shadow-brand-xl hover:-translate-y-2 p-8',
  };
  
  return `${baseStyles} ${variants[variant]}`;
};

// Theme utilities
export const getThemeValue = (property: string): string => {
  if (typeof window === 'undefined') return '';
  
  const root = document.documentElement;
  return getComputedStyle(root).getPropertyValue(`--${property}`).trim();
};

export const setThemeValue = (property: string, value: string): void => {
  if (typeof window === 'undefined') return;
  
  const root = document.documentElement;
  root.style.setProperty(`--${property}`, value);
};

// Accessibility utilities
export const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary-500 focus-visible:ring-offset-2';

export const screenReaderOnly = 'sr-only';

export const touchTarget = 'min-h-[44px] min-w-[44px]'; // WCAG AA minimum

// Layout utilities
export const containerStyles = 'container mx-auto px-4 sm:px-6 lg:px-8';

export const gridResponsive = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6';

export const flexCenter = 'flex items-center justify-center';

export const flexBetween = 'flex items-center justify-between';

// Typography utilities
export const headingStyles = {
  h1: 'text-4xl sm:text-5xl lg:text-6xl font-bold font-display',
  h2: 'text-3xl sm:text-4xl lg:text-5xl font-bold font-display',
  h3: 'text-2xl sm:text-3xl lg:text-4xl font-semibold font-display',
  h4: 'text-xl sm:text-2xl lg:text-3xl font-semibold',
  h5: 'text-lg sm:text-xl lg:text-2xl font-medium',
  h6: 'text-base sm:text-lg lg:text-xl font-medium',
} as const;

export const textStyles = {
  body: 'text-base leading-relaxed',
  bodyLarge: 'text-lg leading-relaxed',
  bodySmall: 'text-sm leading-relaxed',
  caption: 'text-xs leading-normal',
  overline: 'text-xs font-medium uppercase tracking-wider',
} as const;

// Export all design tokens for easy access
export const designTokens = {
  colors: brandColors,
  typography,
  spacing,
  borderRadius,
  boxShadow,
  breakpoints,
  animationClasses,
} as const;

export default designTokens;