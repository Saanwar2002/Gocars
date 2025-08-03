# GoCars Enhanced Design System

## Overview

The GoCars design system provides a comprehensive set of design tokens, utilities, and components built on top of Tailwind CSS. It ensures consistency, accessibility, and maintainability across the entire application.

## Features

- **Brand-Consistent Colors**: Complete color palette with semantic naming
- **Typography System**: Responsive typography with proper hierarchy
- **Spacing System**: Consistent spacing based on 4px grid
- **Animation Library**: Smooth, performant animations
- **Accessibility First**: WCAG 2.1 AA compliant utilities
- **Responsive Design**: Mobile-first approach with touch-friendly targets
- **Dark Mode Support**: Automatic theme switching
- **Custom Utilities**: Brand-specific utility classes

## Installation & Setup

The design system is automatically configured in `tailwind.config.ts` and imported via `globals.css`.

### CSS Variables

Brand variables are defined in `src/styles/brand-variables.css` and include:

```css
:root {
  --brand-primary-500: #0ea5e9;
  --brand-secondary-900: #0f172a;
  --brand-accent-yellow-500: #eab308;
  /* ... and many more */
}
```

### Programmatic Access

Use the design system utilities in JavaScript/TypeScript:

```typescript
import { getColor, getSpacing, generateButtonStyles } from '@/lib/design-system';

const primaryColor = getColor('primary.500');
const buttonClasses = generateButtonStyles('primary');
```

## Color System

### Brand Colors

#### Primary (Blue)
- **Primary 500**: `#0ea5e9` - Main brand color
- **Primary 600**: `#0284c7` - Hover states
- **Primary 700**: `#0369a1` - Active states

Usage:
```html
<div class="bg-brand-primary-500 text-white">Primary Button</div>
<div class="text-brand-primary-600">Primary Text</div>
```

#### Secondary (Gray)
- **Secondary 900**: `#0f172a` - Primary text
- **Secondary 700**: `#334155` - Secondary text
- **Secondary 500**: `#64748b` - Tertiary text

#### Accent Colors
- **Yellow 500**: `#eab308` - Taxi/warning color
- **Green 500**: `#22c55e` - Success color
- **Red 500**: `#ef4444` - Error color

### Semantic Colors

```html
<div class="text-success-500">Success message</div>
<div class="text-warning-500">Warning message</div>
<div class="text-error-500">Error message</div>
<div class="text-info-500">Info message</div>
```

## Typography

### Font Families

- **Sans**: Inter (body text, UI elements)
- **Display**: Poppins (headlines, marketing)
- **Mono**: JetBrains Mono (code, technical content)

```html
<h1 class="font-display">Display Heading</h1>
<p class="font-sans">Body text</p>
<code class="font-mono">Code snippet</code>
```

### Typography Scale

```html
<h1 class="text-6xl font-bold font-display">Hero Headline</h1>
<h2 class="text-4xl font-bold font-display">Page Title</h2>
<h3 class="text-3xl font-semibold">Section Header</h3>
<p class="text-base">Body text</p>
<small class="text-sm">Small text</small>
```

### Responsive Typography

```html
<h1 class="text-4xl sm:text-5xl lg:text-6xl">Responsive Heading</h1>
```

## Spacing System

Based on 4px increments (0.25rem):

```html
<div class="p-4">1rem padding</div>
<div class="m-8">2rem margin</div>
<div class="space-y-6">1.5rem vertical spacing</div>
```

### Touch-Friendly Spacing

```html
<button class="touch-target">44px minimum touch target</button>
<button class="touch-target-lg">56px large touch target</button>
```

## Component Utilities

### Brand Buttons

```html
<button class="btn-brand">Primary Button</button>
<button class="btn-brand-secondary">Secondary Button</button>
<button class="btn-brand-accent">Accent Button</button>
```

### Brand Cards

```html
<div class="card-brand">
  <h3>Standard Card</h3>
  <p>Card content</p>
</div>

<div class="card-brand-elevated">
  <h3>Elevated Card</h3>
  <p>Card with more prominent shadow</p>
</div>
```

### Focus States

```html
<input class="focus-brand" placeholder="Accessible focus ring">
<button class="focus-brand">Accessible button</button>
```

## Animation System

### Available Animations

```html
<div class="animate-fade-in">Fade in</div>
<div class="animate-fade-in-up">Fade in from bottom</div>
<div class="animate-slide-in-right">Slide in from right</div>
<div class="animate-scale-in">Scale in</div>
<div class="animate-bounce-gentle">Gentle bounce</div>
<div class="animate-shimmer">Loading shimmer</div>
<div class="animate-pulse-brand">Brand pulse</div>
<div class="animate-float">Floating animation</div>
<div class="animate-wiggle">Wiggle animation</div>
```

### Loading States

```html
<div class="loading-brand">
  Content with shimmer loading effect
</div>
```

## Responsive Design

### Breakpoints

- **xs**: 475px
- **sm**: 640px
- **md**: 768px
- **lg**: 1024px
- **xl**: 1280px
- **2xl**: 1536px

### Touch vs Mouse

```html
<div class="touch:p-4 no-touch:p-2">Touch-aware padding</div>
```

### Orientation

```html
<div class="portrait:flex-col landscape:flex-row">Orientation-aware layout</div>
```

## Accessibility Features

### Focus Management

```html
<button class="focus-visible:ring-2 focus-visible:ring-brand-primary-500">
  Accessible focus
</button>
```

### Screen Reader Support

```html
<span class="sr-only">Screen reader only text</span>
```

### High Contrast Support

The design system automatically adjusts shadows and contrast in high contrast mode.

### Reduced Motion Support

Animations are automatically disabled for users who prefer reduced motion.

## Dark Mode

The design system includes automatic dark mode support:

```css
@media (prefers-color-scheme: dark) {
  :root {
    --brand-bg-primary: var(--brand-secondary-900);
    --brand-text-primary: var(--brand-secondary-50);
  }
}
```

## Gradients

### Brand Gradients

```html
<div class="bg-gradient-brand">Primary gradient</div>
<div class="bg-gradient-brand-light">Light gradient</div>
<div class="bg-gradient-accent">Accent gradient</div>
```

### Text Gradients

```html
<h1 class="text-brand-gradient">Gradient text</h1>
```

## Shadows

### Standard Shadows

```html
<div class="shadow-sm">Small shadow</div>
<div class="shadow-md">Medium shadow</div>
<div class="shadow-lg">Large shadow</div>
```

### Brand Shadows

```html
<div class="shadow-brand-sm">Small brand shadow</div>
<div class="shadow-brand-md">Medium brand shadow</div>
<div class="shadow-brand-lg">Large brand shadow</div>
```

## Layout Utilities

### Container

```html
<div class="container mx-auto px-4 sm:px-6 lg:px-8">
  Responsive container
</div>
```

### Grid Systems

```html
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
  Responsive grid
</div>
```

### Flexbox

```html
<div class="flex items-center justify-between">Flex layout</div>
<div class="flex items-center justify-center">Centered content</div>
```

## Safe Areas (iOS)

```html
<div class="safe-top">Top safe area padding</div>
<div class="safe-bottom">Bottom safe area padding</div>
```

## Scrollbars

```html
<div class="scrollbar-brand overflow-auto">
  Custom branded scrollbar
</div>
```

## Z-Index Scale

```html
<div class="z-dropdown">Dropdown (1000)</div>
<div class="z-modal">Modal (1400)</div>
<div class="z-toast">Toast (1700)</div>
<div class="z-tooltip">Tooltip (1800)</div>
```

## Print Styles

```html
<div class="no-print">Hidden in print</div>
<div class="print-only hidden">Visible only in print</div>
```

## Best Practices

### 1. Use Semantic Classes

```html
<!-- Good -->
<button class="btn-brand">Submit</button>

<!-- Avoid -->
<button class="bg-blue-500 text-white px-6 py-3 rounded-lg">Submit</button>
```

### 2. Responsive Design

```html
<!-- Good -->
<div class="text-base sm:text-lg lg:text-xl">Responsive text</div>

<!-- Avoid -->
<div class="text-xl">Fixed size text</div>
```

### 3. Accessibility

```html
<!-- Good -->
<button class="btn-brand focus-brand touch-target">
  Accessible Button
</button>

<!-- Avoid -->
<div class="cursor-pointer">Fake button</div>
```

### 4. Performance

```html
<!-- Good -->
<div class="animate-fade-in">Smooth animation</div>

<!-- Avoid -->
<div style="animation: fadeIn 0.3s ease-out">Inline animation</div>
```

## Migration Guide

### From Old Classes

```html
<!-- Old -->
<button class="bg-blue-600 hover:bg-blue-700">Button</button>

<!-- New -->
<button class="btn-brand">Button</button>
```

### Custom Components

When creating custom components, use the design system utilities:

```typescript
import { generateButtonStyles, focusRing } from '@/lib/design-system';

const Button = ({ variant = 'primary', children, ...props }) => {
  const classes = `${generateButtonStyles(variant)} ${focusRing}`;
  return <button className={classes} {...props}>{children}</button>;
};
```

## Development Tools

### VS Code Extensions

- **Tailwind CSS IntelliSense**: Autocomplete for classes
- **Headwind**: Automatic class sorting

### Browser DevTools

Use the browser inspector to see which CSS variables are being used:

```css
/* In DevTools */
element {
  background-color: var(--brand-primary-500);
}
```

## Contributing

When adding new design tokens:

1. Add to `src/config/brand.ts`
2. Update `tailwind.config.ts`
3. Add CSS variables to `src/styles/brand-variables.css`
4. Update this documentation
5. Add examples to the brand showcase

## Resources

- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [GoCars Brand Guidelines](./brand-guidelines.md)
- [Component Library](../components/brand/)