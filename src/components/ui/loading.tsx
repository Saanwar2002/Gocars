import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

const loadingVariants = cva(
    "animate-spin",
    {
        variants: {
            variant: {
                default: "text-primary",
                muted: "text-muted-foreground",
                destructive: "text-destructive",
                success: "text-gocars-green-600",
            },
            size: {
                default: "h-4 w-4",
                sm: "h-3 w-3",
                lg: "h-6 w-6",
                xl: "h-8 w-8",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
)

interface LoadingProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof loadingVariants> {
    text?: string
    centered?: boolean
}

const Loading = React.forwardRef<HTMLDivElement, LoadingProps>(
    ({ className, variant, size, text, centered = false, ...props }, ref) => {
        const content = (
            <>
                <Loader2 className={cn(loadingVariants({ variant, size }))} />
                {text && <span className="ml-2 text-sm text-muted-foreground">{text}</span>}
            </>
        )

        if (centered) {
            return (
                <div
                    ref={ref}
                    className={cn("flex items-center justify-center p-4", className)}
                    {...props}
                >
                    {content}
                </div>
            )
        }

        return (
            <div
                ref={ref}
                className={cn("flex items-center", className)}
                {...props}
            >
                {content}
            </div>
        )
    }
)
Loading.displayName = "Loading"

// Skeleton Loading Component
const Skeleton = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn(
            "animate-pulse rounded-md bg-muted/50 relative overflow-hidden",
            "before:absolute before:inset-0 before:-translate-x-full before:animate-shimmer before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent",
            className
        )}
        {...props}
    />
))
Skeleton.displayName = "Skeleton"

// Loading Dots Component
const LoadingDots = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & { variant?: "default" | "primary" | "muted" }
>(({ className, variant = "default", ...props }, ref) => {
    const dotClass = cn(
        "w-2 h-2 rounded-full animate-loading-dots",
        {
            "bg-primary": variant === "primary",
            "bg-muted-foreground": variant === "muted",
            "bg-foreground": variant === "default",
        }
    )

    return (
        <div
            ref={ref}
            className={cn("flex items-center space-x-1", className)}
            {...props}
        >
            <div className={cn(dotClass, "animation-delay-0")} />
            <div className={cn(dotClass, "animation-delay-150")} />
            <div className={cn(dotClass, "animation-delay-300")} />
        </div>
    )
})
LoadingDots.displayName = "LoadingDots"

export { Loading, Skeleton, LoadingDots, loadingVariants }