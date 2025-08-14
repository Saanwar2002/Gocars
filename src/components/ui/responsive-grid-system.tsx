'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface ResponsiveGridProps {
  children: React.ReactNode;
  cols?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
    '2xl'?: number;
  };
  gap?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
    '2xl'?: number;
  };
  className?: string;
}

export function ResponsiveGrid({
  children,
  cols = { xs: 1, sm: 2, md: 3, lg: 4, xl: 5, '2xl': 6 },
  gap = { xs: 4, sm: 4, md: 6, lg: 6, xl: 8, '2xl': 8 },
  className,
}: ResponsiveGridProps) {
  const getGridClasses = () => {
    const colClasses = [
      cols.xs && `grid-cols-${cols.xs}`,
      cols.sm && `sm:grid-cols-${cols.sm}`,
      cols.md && `md:grid-cols-${cols.md}`,
      cols.lg && `lg:grid-cols-${cols.lg}`,
      cols.xl && `xl:grid-cols-${cols.xl}`,
      cols['2xl'] && `2xl:grid-cols-${cols['2xl']}`,
    ].filter(Boolean);

    const gapClasses = [
      gap.xs && `gap-${gap.xs}`,
      gap.sm && `sm:gap-${gap.sm}`,
      gap.md && `md:gap-${gap.md}`,
      gap.lg && `lg:gap-${gap.lg}`,
      gap.xl && `xl:gap-${gap.xl}`,
      gap['2xl'] && `2xl:gap-${gap['2xl']}`,
    ].filter(Boolean);

    return [...colClasses, ...gapClasses].join(' ');
  };

  return (
    <div className={cn('grid', getGridClasses(), className)}>
      {children}
    </div>
  );
}

export interface ResponsiveContainerProps {
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  padding?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
    '2xl'?: number;
  };
  className?: string;
}

export function ResponsiveContainer({
  children,
  size = 'xl',
  padding = { xs: 4, sm: 6, md: 8, lg: 8, xl: 8, '2xl': 8 },
  className,
}: ResponsiveContainerProps) {
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'max-w-sm';
      case 'md':
        return 'max-w-md';
      case 'lg':
        return 'max-w-4xl';
      case 'xl':
        return 'max-w-6xl';
      case '2xl':
        return 'max-w-7xl';
      case 'full':
        return 'max-w-full';
      default:
        return 'max-w-6xl';
    }
  };

  const getPaddingClasses = () => {
    return [
      padding.xs && `px-${padding.xs}`,
      padding.sm && `sm:px-${padding.sm}`,
      padding.md && `md:px-${padding.md}`,
      padding.lg && `lg:px-${padding.lg}`,
      padding.xl && `xl:px-${padding.xl}`,
      padding['2xl'] && `2xl:px-${padding['2xl']}`,
    ].filter(Boolean).join(' ');
  };

  return (
    <div className={cn('mx-auto w-full', getSizeClasses(), getPaddingClasses(), className)}>
      {children}
    </div>
  );
}

export interface ResponsiveStackProps {
  children: React.ReactNode;
  direction?: {
    xs?: 'row' | 'col';
    sm?: 'row' | 'col';
    md?: 'row' | 'col';
    lg?: 'row' | 'col';
    xl?: 'row' | 'col';
    '2xl'?: 'row' | 'col';
  };
  gap?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
    '2xl'?: number;
  };
  align?: {
    xs?: 'start' | 'center' | 'end' | 'stretch';
    sm?: 'start' | 'center' | 'end' | 'stretch';
    md?: 'start' | 'center' | 'end' | 'stretch';
    lg?: 'start' | 'center' | 'end' | 'stretch';
    xl?: 'start' | 'center' | 'end' | 'stretch';
    '2xl'?: 'start' | 'center' | 'end' | 'stretch';
  };
  justify?: {
    xs?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
    sm?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
    md?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
    lg?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
    xl?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
    '2xl'?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  };
  className?: string;
}

export function ResponsiveStack({
  children,
  direction = { xs: 'col', md: 'row' },
  gap = { xs: 4, sm: 4, md: 6, lg: 6, xl: 8, '2xl': 8 },
  align,
  justify,
  className,
}: ResponsiveStackProps) {
  const getDirectionClasses = () => {
    return [
      direction.xs && `flex-${direction.xs}`,
      direction.sm && `sm:flex-${direction.sm}`,
      direction.md && `md:flex-${direction.md}`,
      direction.lg && `lg:flex-${direction.lg}`,
      direction.xl && `xl:flex-${direction.xl}`,
      direction['2xl'] && `2xl:flex-${direction['2xl']}`,
    ].filter(Boolean);
  };

  const getGapClasses = () => {
    return [
      gap.xs && `gap-${gap.xs}`,
      gap.sm && `sm:gap-${gap.sm}`,
      gap.md && `md:gap-${gap.md}`,
      gap.lg && `lg:gap-${gap.lg}`,
      gap.xl && `xl:gap-${gap.xl}`,
      gap['2xl'] && `2xl:gap-${gap['2xl']}`,
    ].filter(Boolean);
  };

  const getAlignClasses = () => {
    if (!align) return [];
    return [
      align.xs && `items-${align.xs}`,
      align.sm && `sm:items-${align.sm}`,
      align.md && `md:items-${align.md}`,
      align.lg && `lg:items-${align.lg}`,
      align.xl && `xl:items-${align.xl}`,
      align['2xl'] && `2xl:items-${align['2xl']}`,
    ].filter(Boolean);
  };

  const getJustifyClasses = () => {
    if (!justify) return [];
    return [
      justify.xs && `justify-${justify.xs}`,
      justify.sm && `sm:justify-${justify.sm}`,
      justify.md && `md:justify-${justify.md}`,
      justify.lg && `lg:justify-${justify.lg}`,
      justify.xl && `xl:justify-${justify.xl}`,
      justify['2xl'] && `2xl:justify-${justify['2xl']}`,
    ].filter(Boolean);
  };

  const allClasses = [
    'flex',
    ...getDirectionClasses(),
    ...getGapClasses(),
    ...getAlignClasses(),
    ...getJustifyClasses(),
  ].join(' ');

  return (
    <div className={cn(allClasses, className)}>
      {children}
    </div>
  );
}

export interface ResponsiveShowHideProps {
  children: React.ReactNode;
  show?: {
    xs?: boolean;
    sm?: boolean;
    md?: boolean;
    lg?: boolean;
    xl?: boolean;
    '2xl'?: boolean;
  };
  hide?: {
    xs?: boolean;
    sm?: boolean;
    md?: boolean;
    lg?: boolean;
    xl?: boolean;
    '2xl'?: boolean;
  };
  className?: string;
}

export function ResponsiveShowHide({
  children,
  show,
  hide,
  className,
}: ResponsiveShowHideProps) {
  const getVisibilityClasses = () => {
    const classes = [];

    if (show) {
      // Start with hidden, then show at specific breakpoints
      classes.push('hidden');
      if (show.xs) classes.push('block');
      if (show.sm) classes.push('sm:block');
      if (show.md) classes.push('md:block');
      if (show.lg) classes.push('lg:block');
      if (show.xl) classes.push('xl:block');
      if (show['2xl']) classes.push('2xl:block');
    }

    if (hide) {
      // Start with visible, then hide at specific breakpoints
      if (hide.xs) classes.push('hidden');
      if (hide.sm) classes.push('sm:hidden');
      if (hide.md) classes.push('md:hidden');
      if (hide.lg) classes.push('lg:hidden');
      if (hide.xl) classes.push('xl:hidden');
      if (hide['2xl']) classes.push('2xl:hidden');
    }

    return classes;
  };

  return (
    <div className={cn(...getVisibilityClasses(), className)}>
      {children}
    </div>
  );
}

// Responsive text sizing
export interface ResponsiveTextProps {
  children: React.ReactNode;
  size?: {
    xs?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl';
    sm?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl';
    md?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl';
    lg?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl';
    xl?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl';
    '2xl'?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl';
  };
  weight?: {
    xs?: 'thin' | 'light' | 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold';
    sm?: 'thin' | 'light' | 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold';
    md?: 'thin' | 'light' | 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold';
    lg?: 'thin' | 'light' | 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold';
    xl?: 'thin' | 'light' | 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold';
    '2xl'?: 'thin' | 'light' | 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold';
  };
  align?: {
    xs?: 'left' | 'center' | 'right' | 'justify';
    sm?: 'left' | 'center' | 'right' | 'justify';
    md?: 'left' | 'center' | 'right' | 'justify';
    lg?: 'left' | 'center' | 'right' | 'justify';
    xl?: 'left' | 'center' | 'right' | 'justify';
    '2xl'?: 'left' | 'center' | 'right' | 'justify';
  };
  className?: string;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div';
}

export function ResponsiveText({
  children,
  size = { xs: 'base', md: 'lg' },
  weight,
  align,
  className,
  as: Component = 'div',
}: ResponsiveTextProps) {
  const getSizeClasses = () => {
    return [
      size.xs && `text-${size.xs}`,
      size.sm && `sm:text-${size.sm}`,
      size.md && `md:text-${size.md}`,
      size.lg && `lg:text-${size.lg}`,
      size.xl && `xl:text-${size.xl}`,
      size['2xl'] && `2xl:text-${size['2xl']}`,
    ].filter(Boolean);
  };

  const getWeightClasses = () => {
    if (!weight) return [];
    return [
      weight.xs && `font-${weight.xs}`,
      weight.sm && `sm:font-${weight.sm}`,
      weight.md && `md:font-${weight.md}`,
      weight.lg && `lg:font-${weight.lg}`,
      weight.xl && `xl:font-${weight.xl}`,
      weight['2xl'] && `2xl:font-${weight['2xl']}`,
    ].filter(Boolean);
  };

  const getAlignClasses = () => {
    if (!align) return [];
    return [
      align.xs && `text-${align.xs}`,
      align.sm && `sm:text-${align.sm}`,
      align.md && `md:text-${align.md}`,
      align.lg && `lg:text-${align.lg}`,
      align.xl && `xl:text-${align.xl}`,
      align['2xl'] && `2xl:text-${align['2xl']}`,
    ].filter(Boolean);
  };

  const allClasses = [
    ...getSizeClasses(),
    ...getWeightClasses(),
    ...getAlignClasses(),
  ].join(' ');

  return (
    <Component className={cn(allClasses, className)}>
      {children}
    </Component>
  );
}