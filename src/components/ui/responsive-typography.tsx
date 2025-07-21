import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

// Responsive Typography System
const typographyVariants = cva(
  "font-sans",
  {
    variants: {
      variant: {
        h1: "scroll-m-20 text-4xl font-bold tracking-tight lg:text-5xl xl:text-6xl",
        h2: "scroll-m-20 text-3xl font-semibold tracking-tight lg:text-4xl xl:text-5xl",
        h3: "scroll-m-20 text-2xl font-semibold tracking-tight lg:text-3xl",
        h4: "scroll-m-20 text-xl font-semibold tracking-tight lg:text-2xl",
        h5: "scroll-m-20 text-lg font-semibold tracking-tight lg:text-xl",
        h6: "scroll-m-20 text-base font-semibold tracking-tight lg:text-lg",
        p: "leading-7 text-base lg:text-lg",
        lead: "text-lg text-muted-foreground lg:text-xl xl:text-2xl",
        large: "text-lg font-semibold lg:text-xl",
        small: "text-sm font-medium leading-none lg:text-base",
        muted: "text-sm text-muted-foreground lg:text-base",
        caption: "text-xs text-muted-foreground lg:text-sm",
        overline: "text-xs font-medium uppercase tracking-wider text-muted-foreground lg:text-sm",
        code: "relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold",
        kbd: "pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100",
      },
      responsive: {
        true: "",
        false: "",
      },
      truncate: {
        true: "truncate",
        false: "",
      },
      balance: {
        true: "text-balance",
        false: "",
      },
    },
    defaultVariants: {
      variant: "p",
      responsive: true,
      truncate: false,
      balance: false,
    },
  }
)

interface TypographyProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof typographyVariants> {
  as?: keyof JSX.IntrinsicElements
  children: React.ReactNode
}

const Typography = React.forwardRef<HTMLElement, TypographyProps>(
  ({ className, variant, responsive, truncate, balance, as, children, ...props }, ref) => {
    const Component = as || getDefaultElement(variant)
    
    return React.createElement(
      Component,
      {
        className: cn(typographyVariants({ variant, responsive, truncate, balance }), className),
        ref,
        ...props,
      },
      children
    )
  }
)
Typography.displayName = "Typography"

// Helper function to get default HTML element for each variant
function getDefaultElement(variant: string | null | undefined): keyof JSX.IntrinsicElements {
  switch (variant) {
    case "h1": return "h1"
    case "h2": return "h2"
    case "h3": return "h3"
    case "h4": return "h4"
    case "h5": return "h5"
    case "h6": return "h6"
    case "lead": return "p"
    case "large": return "div"
    case "small": return "small"
    case "muted": return "p"
    case "caption": return "span"
    case "overline": return "span"
    case "code": return "code"
    case "kbd": return "kbd"
    default: return "p"
  }
}

// Responsive Text Component with fluid scaling
const fluidTextVariants = cva(
  "font-sans leading-relaxed",
  {
    variants: {
      size: {
        xs: "text-xs sm:text-sm",
        sm: "text-sm sm:text-base",
        base: "text-base sm:text-lg",
        lg: "text-lg sm:text-xl",
        xl: "text-xl sm:text-2xl",
        "2xl": "text-2xl sm:text-3xl lg:text-4xl",
        "3xl": "text-3xl sm:text-4xl lg:text-5xl",
        "4xl": "text-4xl sm:text-5xl lg:text-6xl xl:text-7xl",
        "5xl": "text-5xl sm:text-6xl lg:text-7xl xl:text-8xl",
        fluid: "text-[clamp(1rem,4vw,2rem)]", // Fluid scaling
        "fluid-lg": "text-[clamp(1.5rem,6vw,3rem)]",
        "fluid-xl": "text-[clamp(2rem,8vw,4rem)]",
      },
      weight: {
        light: "font-light",
        normal: "font-normal",
        medium: "font-medium",
        semibold: "font-semibold",
        bold: "font-bold",
        extrabold: "font-extrabold",
      },
      spacing: {
        tight: "tracking-tight",
        normal: "tracking-normal",
        wide: "tracking-wide",
        wider: "tracking-wider",
        widest: "tracking-widest",
      },
      leading: {
        tight: "leading-tight",
        snug: "leading-snug",
        normal: "leading-normal",
        relaxed: "leading-relaxed",
        loose: "leading-loose",
      },
    },
    defaultVariants: {
      size: "base",
      weight: "normal",
      spacing: "normal",
      leading: "normal",
    },
  }
)

interface FluidTextProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof fluidTextVariants> {
  as?: keyof JSX.IntrinsicElements
  children: React.ReactNode
}

const FluidText = React.forwardRef<HTMLElement, FluidTextProps>(
  ({ className, size, weight, spacing, leading, as = "p", children, ...props }, ref) => {
    return React.createElement(
      as,
      {
        className: cn(fluidTextVariants({ size, weight, spacing, leading }), className),
        ref,
        ...props,
      },
      children
    )
  }
)
FluidText.displayName = "FluidText"

// Responsive Heading Component
interface ResponsiveHeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  level: 1 | 2 | 3 | 4 | 5 | 6
  children: React.ReactNode
  gradient?: boolean
  animated?: boolean
}

const ResponsiveHeading = React.forwardRef<HTMLHeadingElement, ResponsiveHeadingProps>(
  ({ className, level, children, gradient = false, animated = false, ...props }, ref) => {
    const Component = `h${level}` as keyof JSX.IntrinsicElements
    
    const headingClasses = {
      1: "text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight",
      2: "text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-semibold tracking-tight",
      3: "text-xl sm:text-2xl lg:text-3xl font-semibold tracking-tight",
      4: "text-lg sm:text-xl lg:text-2xl font-semibold tracking-tight",
      5: "text-base sm:text-lg lg:text-xl font-semibold tracking-tight",
      6: "text-sm sm:text-base lg:text-lg font-semibold tracking-tight",
    }
    
    return React.createElement(
      Component,
      {
        className: cn(
          headingClasses[level],
          gradient && "bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent",
          animated && "animate-fade-in-up",
          className
        ),
        ref,
        ...props,
      },
      children
    )
  }
)
ResponsiveHeading.displayName = "ResponsiveHeading"

// Reading-optimized Text Component
const readingTextVariants = cva(
  "font-sans text-foreground",
  {
    variants: {
      size: {
        sm: "text-sm sm:text-base leading-relaxed",
        base: "text-base sm:text-lg leading-relaxed",
        lg: "text-lg sm:text-xl leading-relaxed",
      },
      width: {
        narrow: "max-w-prose",
        normal: "max-w-4xl",
        wide: "max-w-6xl",
        full: "max-w-full",
      },
      spacing: {
        tight: "space-y-2",
        normal: "space-y-4",
        relaxed: "space-y-6",
        loose: "space-y-8",
      },
    },
    defaultVariants: {
      size: "base",
      width: "normal",
      spacing: "normal",
    },
  }
)

interface ReadingTextProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof readingTextVariants> {
  children: React.ReactNode
}

const ReadingText = React.forwardRef<HTMLDivElement, ReadingTextProps>(
  ({ className, size, width, spacing, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(readingTextVariants({ size, width, spacing }), className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)
ReadingText.displayName = "ReadingText"

// Responsive List Component
interface ResponsiveListProps extends React.HTMLAttributes<HTMLElement> {
  as?: "ul" | "ol"
  children: React.ReactNode
  spacing?: "tight" | "normal" | "relaxed"
  marker?: "disc" | "decimal" | "none" | "custom"
  responsive?: boolean
}

const ResponsiveList = React.forwardRef<HTMLElement, ResponsiveListProps>(
  ({ 
    className, 
    as = "ul", 
    children, 
    spacing = "normal", 
    marker = "disc",
    responsive = true,
    ...props 
  }, ref) => {
    const spacingClasses = {
      tight: "space-y-1",
      normal: "space-y-2 sm:space-y-3",
      relaxed: "space-y-3 sm:space-y-4",
    }

    const markerClasses = {
      disc: "list-disc list-inside",
      decimal: "list-decimal list-inside",
      none: "list-none",
      custom: "",
    }

    return React.createElement(
      as,
      {
        className: cn(
          "text-base sm:text-lg leading-relaxed",
          spacingClasses[spacing],
          markerClasses[marker],
          responsive && "pl-4 sm:pl-6",
          className
        ),
        ref,
        ...props,
      },
      children
    )
  }
)
ResponsiveList.displayName = "ResponsiveList"

// Typography utilities
const useResponsiveText = () => {
  const [fontSize, setFontSize] = React.useState('base')
  
  React.useEffect(() => {
    const updateFontSize = () => {
      if (window.innerWidth < 640) {
        setFontSize('sm')
      } else if (window.innerWidth < 1024) {
        setFontSize('base')
      } else {
        setFontSize('lg')
      }
    }

    updateFontSize()
    window.addEventListener('resize', updateFontSize)
    return () => window.removeEventListener('resize', updateFontSize)
  }, [])

  return fontSize
}

export {
  Typography,
  FluidText,
  ResponsiveHeading,
  ReadingText,
  ResponsiveList,
  useResponsiveText,
  typographyVariants,
  fluidTextVariants,
  readingTextVariants,
  type TypographyProps,
  type FluidTextProps,
  type ResponsiveHeadingProps,
  type ReadingTextProps,
  type ResponsiveListProps,
}