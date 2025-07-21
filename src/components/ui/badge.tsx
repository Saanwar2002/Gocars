import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 shadow-gocars-sm hover:shadow-gocars",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:scale-105",
        outline: "text-foreground border-border hover:bg-accent hover:text-accent-foreground",
        success:
          "border-transparent bg-gocars-green-100 text-gocars-green-800 hover:bg-gocars-green-200 dark:bg-gocars-green-900/20 dark:text-gocars-green-400 dark:hover:bg-gocars-green-900/30",
        warning:
          "border-transparent bg-gocars-orange-100 text-gocars-orange-800 hover:bg-gocars-orange-200 dark:bg-gocars-orange-900/20 dark:text-gocars-orange-400 dark:hover:bg-gocars-orange-900/30",
        info:
          "border-transparent bg-gocars-blue-100 text-gocars-blue-800 hover:bg-gocars-blue-200 dark:bg-gocars-blue-900/20 dark:text-gocars-blue-400 dark:hover:bg-gocars-blue-900/30",
        purple:
          "border-transparent bg-gocars-purple-100 text-gocars-purple-800 hover:bg-gocars-purple-200 dark:bg-gocars-purple-900/20 dark:text-gocars-purple-400 dark:hover:bg-gocars-purple-900/30",
      },
      size: {
        default: "px-2.5 py-0.5 text-xs",
        sm: "px-2 py-0.5 text-xs",
        lg: "px-3 py-1 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  pulse?: boolean
}

function Badge({ className, variant, size, pulse, ...props }: BadgeProps) {
  return (
    <div 
      className={cn(
        badgeVariants({ variant, size }), 
        pulse && "animate-pulse",
        className
      )} 
      {...props} 
    />
  )
}

export { Badge, badgeVariants }
