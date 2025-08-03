import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const cardVariants = cva(
  "rounded-xl bg-card text-card-foreground transition-all duration-300 group",
  {
    variants: {
      variant: {
        default: "border border-brand-secondary-200 shadow-sm hover:shadow-brand-lg hover:-translate-y-1",
        elevated: "shadow-brand-lg hover:shadow-brand-xl hover:-translate-y-2",
        flat: "border border-brand-secondary-200",
        ghost: "hover:bg-brand-secondary-50 hover:shadow-sm",
        gradient: "bg-gradient-brand-light border-brand-primary-200 shadow-sm hover:shadow-brand-md",
      },
      padding: {
        none: "",
        sm: "p-4",
        default: "p-6",
        lg: "p-8",
      },
      interactive: {
        true: "cursor-pointer hover:scale-[1.02] active:scale-[0.98]",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      padding: "none",
      interactive: false,
    },
  }
)

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  loading?: boolean
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, padding, interactive, loading, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        cardVariants({ variant, padding, interactive, className }),
        loading && "loading-brand animate-pulse"
      )}
      {...props}
    >
      {loading ? (
        <div className="space-y-3">
          <div className="h-4 bg-brand-secondary-200 rounded animate-pulse" />
          <div className="h-4 bg-brand-secondary-200 rounded w-3/4 animate-pulse" />
          <div className="h-4 bg-brand-secondary-200 rounded w-1/2 animate-pulse" />
        </div>
      ) : (
        children
      )}
    </div>
  )
)
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex flex-col space-y-1.5 p-6 transition-colors duration-200 group-hover:bg-brand-secondary-50/50",
      className
    )}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "text-2xl font-display font-semibold leading-none tracking-tight text-brand-secondary-900 group-hover:text-brand-primary-600 transition-colors duration-200",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "text-sm text-brand-secondary-600 leading-relaxed group-hover:text-brand-secondary-700 transition-colors duration-200",
      className
    )}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div 
    ref={ref} 
    className={cn(
      "p-6 pt-0 transition-colors duration-200",
      className
    )} 
    {...props} 
  />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center p-6 pt-0 transition-colors duration-200 border-t border-brand-secondary-100 group-hover:border-brand-secondary-200",
      className
    )}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, cardVariants }
