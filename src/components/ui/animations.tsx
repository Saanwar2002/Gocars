import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

// Animation wrapper component
const animationVariants = cva(
  "",
  {
    variants: {
      animation: {
        "fade-in": "animate-fade-in",
        "fade-in-up": "animate-fade-in-up",
        "fade-in-down": "animate-fade-in-down",
        "slide-in-right": "animate-slide-in-right",
        "slide-in-left": "animate-slide-in-left",
        "scale-in": "animate-scale-in",
        "bounce-gentle": "animate-bounce-gentle",
        "pulse": "animate-pulse",
        "spin": "animate-spin",
        "shimmer": "animate-shimmer",
        "loading-dots": "animate-loading-dots",
      },
      duration: {
        fast: "duration-150",
        normal: "duration-300",
        slow: "duration-500",
        slower: "duration-700",
      },
      delay: {
        none: "delay-0",
        short: "delay-75",
        normal: "delay-150",
        long: "delay-300",
      },
    },
    defaultVariants: {
      animation: "fade-in",
      duration: "normal",
      delay: "none",
    },
  }
)

interface AnimatedProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof animationVariants> {
  children: React.ReactNode
  trigger?: boolean
  once?: boolean
}

const Animated = React.forwardRef<HTMLDivElement, AnimatedProps>(
  ({ className, animation, duration, delay, children, trigger = true, once = true, ...props }, ref) => {
    const [hasAnimated, setHasAnimated] = React.useState(false)
    const [isVisible, setIsVisible] = React.useState(false)
    const elementRef = React.useRef<HTMLDivElement>(null)

    React.useImperativeHandle(ref, () => elementRef.current!)

    React.useEffect(() => {
      const element = elementRef.current
      if (!element || !trigger) return

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && (!once || !hasAnimated)) {
            setIsVisible(true)
            setHasAnimated(true)
          } else if (!once && !entry.isIntersecting) {
            setIsVisible(false)
          }
        },
        { threshold: 0.1 }
      )

      observer.observe(element)
      return () => observer.disconnect()
    }, [trigger, once, hasAnimated])

    return (
      <div
        ref={elementRef}
        className={cn(
          animationVariants({ animation, duration, delay }),
          !isVisible && "opacity-0",
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
Animated.displayName = "Animated"

// Stagger animation for lists
interface StaggeredListProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode[]
  staggerDelay?: number
  animation?: "fade-in-up" | "fade-in" | "scale-in" | "slide-in-right"
}

const StaggeredList = React.forwardRef<HTMLDivElement, StaggeredListProps>(
  ({ className, children, staggerDelay = 100, animation = "fade-in-up", ...props }, ref) => {
    return (
      <div ref={ref} className={cn("space-y-2", className)} {...props}>
        {React.Children.map(children, (child, index) => (
          <Animated
            animation={animation}
            delay={index < 4 ? (["none", "short", "normal", "long"][index] as any) : "long"}
            style={{ animationDelay: `${index * staggerDelay}ms` }}
          >
            {child}
          </Animated>
        ))}
      </div>
    )
  }
)
StaggeredList.displayName = "StaggeredList"

// Hover animation wrapper
interface HoverAnimatedProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  hoverAnimation?: "scale" | "lift" | "glow" | "rotate" | "bounce"
  disabled?: boolean
}

const HoverAnimated = React.forwardRef<HTMLDivElement, HoverAnimatedProps>(
  ({ className, children, hoverAnimation = "scale", disabled = false, ...props }, ref) => {
    const hoverClasses = {
      scale: "hover:scale-105 active:scale-95",
      lift: "hover:-translate-y-1 hover:shadow-gocars-lg",
      glow: "hover:shadow-gocars-lg hover:shadow-primary/25",
      rotate: "hover:rotate-1",
      bounce: "hover:animate-bounce-gentle",
    }

    return (
      <div
        ref={ref}
        className={cn(
          "transition-all duration-200 ease-out",
          !disabled && hoverClasses[hoverAnimation],
          disabled && "opacity-50 cursor-not-allowed",
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
HoverAnimated.displayName = "HoverAnimated"

// Loading animation component
interface LoadingAnimationProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: "spinner" | "dots" | "pulse" | "skeleton" | "shimmer"
  size?: "sm" | "default" | "lg"
  text?: string
}

const LoadingAnimation = React.forwardRef<HTMLDivElement, LoadingAnimationProps>(
  ({ className, type = "spinner", size = "default", text, ...props }, ref) => {
    const sizeClasses = {
      sm: "w-4 h-4",
      default: "w-6 h-6",
      lg: "w-8 h-8",
    }

    const renderAnimation = () => {
      switch (type) {
        case "dots":
          return (
            <div className="flex space-x-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className={cn(
                    "bg-primary rounded-full animate-loading-dots",
                    size === "sm" ? "w-1 h-1" : size === "lg" ? "w-3 h-3" : "w-2 h-2"
                  )}
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          )
        case "pulse":
          return (
            <div className={cn("bg-primary rounded-full animate-pulse", sizeClasses[size])} />
          )
        case "skeleton":
          return (
            <div className={cn("bg-muted animate-pulse rounded", sizeClasses[size])} />
          )
        case "shimmer":
          return (
            <div className={cn("bg-muted relative overflow-hidden rounded", sizeClasses[size])}>
              <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            </div>
          )
        default:
          return (
            <div className={cn("border-2 border-primary border-t-transparent rounded-full animate-spin", sizeClasses[size])} />
          )
      }
    }

    return (
      <div
        ref={ref}
        className={cn("flex items-center justify-center", className)}
        {...props}
      >
        <div className="flex items-center space-x-2">
          {renderAnimation()}
          {text && <span className="text-sm text-muted-foreground">{text}</span>}
        </div>
      </div>
    )
  }
)
LoadingAnimation.displayName = "LoadingAnimation"

// Transition wrapper for route changes
interface PageTransitionProps {
  children: React.ReactNode
  className?: string
}

const PageTransition: React.FC<PageTransitionProps> = ({ children, className }) => {
  return (
    <div className={cn("animate-fade-in", className)}>
      {children}
    </div>
  )
}

// Micro-interaction components
const MicroInteraction = {
  // Button press effect
  Press: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div
      className="active:scale-95 transition-transform duration-100 ease-out"
      {...props}
    >
      {children}
    </div>
  ),

  // Hover lift effect
  Lift: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div
      className="hover:-translate-y-0.5 transition-transform duration-200 ease-out"
      {...props}
    >
      {children}
    </div>
  ),

  // Glow effect on hover
  Glow: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div
      className="hover:shadow-gocars-lg hover:shadow-primary/25 transition-shadow duration-300 ease-out"
      {...props}
    >
      {children}
    </div>
  ),

  // Subtle scale on hover
  Scale: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div
      className="hover:scale-105 transition-transform duration-200 ease-out"
      {...props}
    >
      {children}
    </div>
  ),
}

// Animation hooks
const useAnimation = (trigger: boolean = true) => {
  const [isVisible, setIsVisible] = React.useState(false)
  const ref = React.useRef<HTMLElement>(null)

  React.useEffect(() => {
    const element = ref.current
    if (!element || !trigger) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting)
      },
      { threshold: 0.1 }
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [trigger])

  return { ref, isVisible }
}

const useStaggeredAnimation = (itemCount: number, delay: number = 100) => {
  const [visibleItems, setVisibleItems] = React.useState<number[]>([])

  React.useEffect(() => {
    const timeouts: NodeJS.Timeout[] = []
    
    for (let i = 0; i < itemCount; i++) {
      const timeout = setTimeout(() => {
        setVisibleItems(prev => [...prev, i])
      }, i * delay)
      timeouts.push(timeout)
    }

    return () => timeouts.forEach(clearTimeout)
  }, [itemCount, delay])

  return visibleItems
}

export {
  Animated,
  StaggeredList,
  HoverAnimated,
  LoadingAnimation,
  PageTransition,
  MicroInteraction,
  useAnimation,
  useStaggeredAnimation,
  animationVariants,
  type AnimatedProps,
  type StaggeredListProps,
  type HoverAnimatedProps,
  type LoadingAnimationProps,
  type PageTransitionProps,
}