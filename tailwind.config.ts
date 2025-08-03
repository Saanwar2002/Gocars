
import type { Config } from 'tailwindcss';
import { brandColors, typography, spacing, borderRadius, boxShadow, animation } from './src/config/brand';

const config: Config = {
  darkMode: ["class"],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      // GoCars Typography System
      fontFamily: {
        ...typography.fontFamily,
        heading: typography.fontFamily.display,
        display: typography.fontFamily.display,
      },
      fontSize: typography.fontSize,
      fontWeight: typography.fontWeight,
      // GoCars Spacing System
      spacing: {
        ...spacing,
        // Additional touch-friendly spacing
        'touch-sm': '2.75rem', // 44px - minimum touch target
        'touch': '3rem', // 48px - comfortable touch target
        'touch-lg': '3.5rem', // 56px - large touch target
        // Safe area spacing
        'safe': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },
      // GoCars Color System
      colors: {
        // Base system colors (CSS variables for theme switching)
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
        // GoCars Brand Colors from brand system
        brand: {
          primary: brandColors.primary,
          secondary: brandColors.secondary,
          accent: brandColors.accent,
          neutral: brandColors.neutral,
        },
        // Semantic color aliases
        success: brandColors.accent.green,
        warning: brandColors.accent.yellow,
        error: brandColors.accent.red,
        info: brandColors.primary,
        // Background colors
        'bg-primary': '#ffffff',
        'bg-secondary': brandColors.neutral[50],
        'bg-tertiary': brandColors.neutral[100],
        // Text colors
        'text-primary': brandColors.secondary[900],
        'text-secondary': brandColors.secondary[700],
        'text-tertiary': brandColors.secondary[500],
        'text-inverse': '#ffffff',
        // Border colors
        'border-primary': brandColors.neutral[200],
        'border-secondary': brandColors.neutral[300],
        'border-focus': brandColors.primary[500],
      },
      // GoCars Border Radius System
      borderRadius: {
        ...borderRadius,
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      // GoCars Box Shadow System
      boxShadow: {
        ...boxShadow,
        // Brand-specific shadows
        'brand-sm': '0 2px 4px 0 rgba(14, 165, 233, 0.1)',
        'brand-md': '0 4px 8px 0 rgba(14, 165, 233, 0.15)',
        'brand-lg': '0 8px 16px 0 rgba(14, 165, 233, 0.2)',
        'brand-xl': '0 12px 24px 0 rgba(14, 165, 233, 0.25)',
      },
      // GoCars Animation System
      keyframes: {
        // Existing animations
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "flash-yellow-border": {
          "0%, 100%": { "border-color": "hsl(var(--border))" },
          "50%": { "border-color": "hsl(48, 96%, 50%)" },
        },
        "flash-red-border": {
          "0%, 100%": { "border-color": "hsl(var(--border))" },
          "50%": { "border-color": "hsl(0, 84%, 60%)" },
        },
        "slow-pulse": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: ".5" }
        },
        // GoCars Brand Animations
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in-down": {
          "0%": { opacity: "0", transform: "translateY(-10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-right": {
          "0%": { opacity: "0", transform: "translateX(10px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "slide-in-left": {
          "0%": { opacity: "0", transform: "translateX(-10px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "bounce-gentle": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-5px)" },
        },
        "shimmer": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        "loading-dots": {
          "0%, 80%, 100%": { transform: "scale(0)" },
          "40%": { transform: "scale(1)" },
        },
        "pulse-brand": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.8" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "wiggle": {
          "0%, 100%": { transform: "rotate(-3deg)" },
          "50%": { transform: "rotate(3deg)" },
        },
        "slide-up": {
          "0%": { transform: "translateY(100%)" },
          "100%": { transform: "translateY(0)" },
        },
        "slide-down": {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(0)" },
        },
        "fade-out": {
          "0%": { opacity: "1", transform: "scale(1)" },
          "100%": { opacity: "0", transform: "scale(0.95)" },
        },
        "shrink-width": {
          "0%": { width: "100%" },
          "100%": { width: "0%" },
        },
      },
      animation: {
        // Existing animations
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "flash-yellow-border": "flash-yellow-border 2s ease-in-out infinite",
        "flash-red-border": "flash-red-border 1.5s ease-in-out infinite",
        "slow-pulse": "slow-pulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        // GoCars Brand Animations
        "fade-in": "fade-in 0.3s ease-out",
        "fade-in-up": "fade-in-up 0.4s ease-out",
        "fade-in-down": "fade-in-down 0.4s ease-out",
        "slide-in-right": "slide-in-right 0.3s ease-out",
        "slide-in-left": "slide-in-left 0.3s ease-out",
        "scale-in": "scale-in 0.2s ease-out",
        "bounce-gentle": "bounce-gentle 2s ease-in-out infinite",
        "shimmer": "shimmer 2s linear infinite",
        "loading-dots": "loading-dots 1.4s ease-in-out infinite both",
        "pulse-brand": "pulse-brand 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "float": "float 3s ease-in-out infinite",
        "wiggle": "wiggle 1s ease-in-out infinite",
        "slide-up": "slide-up 0.3s ease-out",
        "slide-down": "slide-down 0.3s ease-out",
        "fade-out": "fade-out 0.3s ease-out",
        "shrink-width": "shrink-width linear",
      },
      // GoCars Transition System
      transitionDuration: {
        ...animation.duration,
        '400': '400ms',
        '600': '600ms',
        '800': '800ms',
        '900': '900ms',
      },
      transitionTimingFunction: {
        ...animation.timing,
        'bounce-in': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      // Z-index scale
      zIndex: {
        'hide': '-1',
        'auto': 'auto',
        'base': '0',
        'docked': '10',
        'dropdown': '1000',
        'sticky': '1100',
        'banner': '1200',
        'overlay': '1300',
        'modal': '1400',
        'popover': '1500',
        'skipLink': '1600',
        'toast': '1700',
        'tooltip': '1800',
      },
      // Backdrop blur
      backdropBlur: {
        'xs': '2px',
        'brand': '8px',
      },
      // Responsive breakpoints
      screens: {
        'xs': '475px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
        // Touch-specific breakpoints
        'touch': { 'raw': '(hover: none) and (pointer: coarse)' },
        'no-touch': { 'raw': '(hover: hover) and (pointer: fine)' },
        // Orientation breakpoints
        'portrait': { 'raw': '(orientation: portrait)' },
        'landscape': { 'raw': '(orientation: landscape)' },
        // High DPI breakpoints
        'retina': { 'raw': '(-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi)' },
      },
      // Container queries
      container: {
        center: true,
        padding: {
          DEFAULT: '1rem',
          sm: '1.5rem',
          lg: '2rem',
          xl: '2.5rem',
          '2xl': '3rem',
        },
        screens: {
          'xs': '475px',
          'sm': '640px',
          'md': '768px',
          'lg': '1024px',
          'xl': '1280px',
          '2xl': '1400px',
        },
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    // GoCars Custom Utilities Plugin
    function ({ addUtilities, theme }: any) {
      const newUtilities = {
        // Brand button styles
        '.btn-brand': {
          backgroundColor: theme('colors.brand.primary.500'),
          color: theme('colors.white'),
          padding: `${theme('spacing.3')} ${theme('spacing.6')}`,
          borderRadius: theme('borderRadius.lg'),
          fontWeight: theme('fontWeight.medium'),
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            backgroundColor: theme('colors.brand.primary.600'),
            transform: 'translateY(-1px)',
            boxShadow: theme('boxShadow.brand-md'),
          },
          '&:active': {
            transform: 'translateY(0)',
          },
        },
        '.btn-brand-secondary': {
          backgroundColor: theme('colors.brand.secondary.100'),
          color: theme('colors.brand.secondary.900'),
          padding: `${theme('spacing.3')} ${theme('spacing.6')}`,
          borderRadius: theme('borderRadius.lg'),
          fontWeight: theme('fontWeight.medium'),
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            backgroundColor: theme('colors.brand.secondary.200'),
            transform: 'translateY(-1px)',
            boxShadow: theme('boxShadow.md'),
          },
        },
        '.btn-brand-accent': {
          backgroundColor: theme('colors.brand.accent.yellow.500'),
          color: theme('colors.brand.secondary.900'),
          padding: `${theme('spacing.3')} ${theme('spacing.6')}`,
          borderRadius: theme('borderRadius.lg'),
          fontWeight: theme('fontWeight.medium'),
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            backgroundColor: theme('colors.brand.accent.yellow.600'),
            transform: 'translateY(-1px)',
            boxShadow: theme('boxShadow.brand-md'),
          },
        },
        // Brand card styles
        '.card-brand': {
          backgroundColor: theme('colors.white'),
          borderRadius: theme('borderRadius.xl'),
          boxShadow: theme('boxShadow.sm'),
          border: `1px solid ${theme('colors.border-primary')}`,
          padding: theme('spacing.6'),
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            boxShadow: theme('boxShadow.brand-lg'),
            transform: 'translateY(-2px)',
          },
        },
        '.card-brand-elevated': {
          backgroundColor: theme('colors.white'),
          borderRadius: theme('borderRadius.2xl'),
          boxShadow: theme('boxShadow.brand-lg'),
          padding: theme('spacing.8'),
          border: 'none',
        },
        // Text utilities
        '.text-brand': {
          color: theme('colors.brand.primary.500'),
        },
        '.text-brand-gradient': {
          background: `linear-gradient(135deg, ${theme('colors.brand.primary.500')} 0%, ${theme('colors.brand.primary.600')} 100%)`,
          '-webkit-background-clip': 'text',
          '-webkit-text-fill-color': 'transparent',
          'background-clip': 'text',
        },
        // Focus utilities
        '.focus-brand': {
          '&:focus': {
            outline: 'none',
            boxShadow: `0 0 0 3px ${theme('colors.brand.primary.500')}40`,
            borderColor: theme('colors.brand.primary.500'),
          },
        },
        // Loading states
        '.loading-brand': {
          position: 'relative',
          overflow: 'hidden',
          '&::after': {
            content: '""',
            position: 'absolute',
            top: '0',
            left: '-100%',
            width: '100%',
            height: '100%',
            background: `linear-gradient(90deg, transparent, ${theme('colors.brand.primary.500')}40, transparent)`,
            animation: 'shimmer 1.5s infinite',
          },
        },
        // Touch-friendly utilities
        '.touch-target': {
          minHeight: theme('spacing.touch'),
          minWidth: theme('spacing.touch'),
        },
        '.touch-target-sm': {
          minHeight: theme('spacing.touch-sm'),
          minWidth: theme('spacing.touch-sm'),
        },
        '.touch-target-lg': {
          minHeight: theme('spacing.touch-lg'),
          minWidth: theme('spacing.touch-lg'),
        },
        // Safe area utilities
        '.safe-top': {
          paddingTop: theme('spacing.safe'),
        },
        '.safe-bottom': {
          paddingBottom: theme('spacing.safe-bottom'),
        },
        '.safe-left': {
          paddingLeft: theme('spacing.safe-left'),
        },
        '.safe-right': {
          paddingRight: theme('spacing.safe-right'),
        },
        // Gradient utilities
        '.bg-gradient-brand': {
          background: `linear-gradient(135deg, ${theme('colors.brand.primary.500')} 0%, ${theme('colors.brand.primary.600')} 100%)`,
        },
        '.bg-gradient-brand-light': {
          background: `linear-gradient(135deg, ${theme('colors.brand.primary.50')} 0%, ${theme('colors.brand.primary.100')} 100%)`,
        },
        '.bg-gradient-accent': {
          background: `linear-gradient(135deg, ${theme('colors.brand.accent.yellow.400')} 0%, ${theme('colors.brand.accent.yellow.500')} 100%)`,
        },
        // Scrollbar utilities
        '.scrollbar-brand': {
          '&::-webkit-scrollbar': {
            width: '8px',
            height: '8px',
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: theme('colors.brand.neutral.100'),
            borderRadius: theme('borderRadius.full'),
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: theme('colors.brand.primary.300'),
            borderRadius: theme('borderRadius.full'),
            '&:hover': {
              backgroundColor: theme('colors.brand.primary.400'),
            },
          },
        },
      };

      addUtilities(newUtilities);
    },
  ],
};
export default config;
