import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

// Responsive Grid System
const gridVariants = cva(
    "grid gap-4",
    {
        variants: {
            cols: {
                1: "grid-cols-1",
                2: "grid-cols-1 sm:grid-cols-2",
                3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
                4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
                5: "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5",
                6: "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6",
                auto: "grid-cols-[repeat(auto-fit,minmax(280px,1fr))]",
                "auto-sm": "grid-cols-[repeat(auto-fit,minmax(200px,1fr))]",
                "auto-lg": "grid-cols-[repeat(auto-fit,minmax(320px,1fr))]",
            },
            gap: {
                none: "gap-0",
                sm: "gap-2",
                default: "gap-4",
                md: "gap-6",
                lg: "gap-8",
                xl: "gap-12",
            },
            responsive: {
                true: "",
                false: "",
            },
        },
        defaultVariants: {
            cols: 3,
            gap: "default",
            responsive: true,
        },
    }
)

interface ResponsiveGridProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof gridVariants> {
    children: React.ReactNode
    minItemWidth?: string
}

const ResponsiveGrid = React.forwardRef<HTMLDivElement, ResponsiveGridProps>(
    ({ className, cols, gap, responsive, children, minItemWidth, style, ...props }, ref) => {
        const gridStyle = minItemWidth
            ? {
                ...style,
                gridTemplateColumns: `repeat(auto-fit, minmax(${minItemWidth}, 1fr))`,
            }
            : style

        return (
            <div
                ref={ref}
                className={cn(gridVariants({ cols: minItemWidth ? undefined : cols, gap }), className)}
                style={gridStyle}
                {...props}
            >
                {children}
            </div>
        )
    }
)
ResponsiveGrid.displayName = "ResponsiveGrid"

// Responsive Container
const containerVariants = cva(
    "mx-auto px-4 sm:px-6 lg:px-8",
    {
        variants: {
            size: {
                sm: "max-w-3xl",
                default: "max-w-7xl",
                lg: "max-w-[1400px]",
                xl: "max-w-[1600px]",
                full: "max-w-full",
                prose: "max-w-4xl",
            },
            padding: {
                none: "px-0",
                sm: "px-2 sm:px-4 lg:px-6",
                default: "px-4 sm:px-6 lg:px-8",
                lg: "px-6 sm:px-8 lg:px-12",
            },
        },
        defaultVariants: {
            size: "default",
            padding: "default",
        },
    }
)

interface ResponsiveContainerProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof containerVariants> {
    children: React.ReactNode
}

const ResponsiveContainer = React.forwardRef<HTMLDivElement, ResponsiveContainerProps>(
    ({ className, size, padding, children, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(containerVariants({ size, padding }), className)}
                {...props}
            >
                {children}
            </div>
        )
    }
)
ResponsiveContainer.displayName = "ResponsiveContainer"

// Responsive Stack (Flex Column with responsive gaps)
const stackVariants = cva(
    "flex flex-col",
    {
        variants: {
            gap: {
                none: "gap-0",
                xs: "gap-1",
                sm: "gap-2",
                default: "gap-4",
                md: "gap-6",
                lg: "gap-8",
                xl: "gap-12",
            },
            align: {
                start: "items-start",
                center: "items-center",
                end: "items-end",
                stretch: "items-stretch",
            },
            responsive: {
                true: "gap-2 sm:gap-4 lg:gap-6",
                false: "",
            },
        },
        defaultVariants: {
            gap: "default",
            align: "stretch",
            responsive: false,
        },
    }
)

interface ResponsiveStackProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof stackVariants> {
    children: React.ReactNode
}

const ResponsiveStack = React.forwardRef<HTMLDivElement, ResponsiveStackProps>(
    ({ className, gap, align, responsive, children, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(stackVariants({ gap: responsive ? undefined : gap, align, responsive }), className)}
                {...props}
            >
                {children}
            </div>
        )
    }
)
ResponsiveStack.displayName = "ResponsiveStack"

// Responsive Flex (Horizontal layout with responsive behavior)
const flexVariants = cva(
    "flex",
    {
        variants: {
            direction: {
                row: "flex-row",
                col: "flex-col",
                "row-reverse": "flex-row-reverse",
                "col-reverse": "flex-col-reverse",
                responsive: "flex-col sm:flex-row",
                "responsive-reverse": "flex-col-reverse sm:flex-row-reverse",
            },
            gap: {
                none: "gap-0",
                xs: "gap-1",
                sm: "gap-2",
                default: "gap-4",
                md: "gap-6",
                lg: "gap-8",
                xl: "gap-12",
            },
            align: {
                start: "items-start",
                center: "items-center",
                end: "items-end",
                stretch: "items-stretch",
                baseline: "items-baseline",
            },
            justify: {
                start: "justify-start",
                center: "justify-center",
                end: "justify-end",
                between: "justify-between",
                around: "justify-around",
                evenly: "justify-evenly",
            },
            wrap: {
                nowrap: "flex-nowrap",
                wrap: "flex-wrap",
                "wrap-reverse": "flex-wrap-reverse",
            },
        },
        defaultVariants: {
            direction: "row",
            gap: "default",
            align: "center",
            justify: "start",
            wrap: "nowrap",
        },
    }
)

interface ResponsiveFlexProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof flexVariants> {
    children: React.ReactNode
}

const ResponsiveFlex = React.forwardRef<HTMLDivElement, ResponsiveFlexProps>(
    ({ className, direction, gap, align, justify, wrap, children, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(flexVariants({ direction, gap, align, justify, wrap }), className)}
                {...props}
            >
                {children}
            </div>
        )
    }
)
ResponsiveFlex.displayName = "ResponsiveFlex"

// Mobile-First Breakpoint Hook
const useBreakpoint = () => {
    const [breakpoint, setBreakpoint] = React.useState<'mobile' | 'tablet' | 'desktop'>('mobile')

    React.useEffect(() => {
        const checkBreakpoint = () => {
            if (window.innerWidth >= 1024) {
                setBreakpoint('desktop')
            } else if (window.innerWidth >= 768) {
                setBreakpoint('tablet')
            } else {
                setBreakpoint('mobile')
            }
        }

        checkBreakpoint()
        window.addEventListener('resize', checkBreakpoint)
        return () => window.removeEventListener('resize', checkBreakpoint)
    }, [])

    return {
        breakpoint,
        isMobile: breakpoint === 'mobile',
        isTablet: breakpoint === 'tablet',
        isDesktop: breakpoint === 'desktop',
        isMobileOrTablet: breakpoint === 'mobile' || breakpoint === 'tablet',
    }
}

// Responsive Show/Hide Component
interface ResponsiveShowProps {
    children: React.ReactNode
    on?: 'mobile' | 'tablet' | 'desktop' | 'mobile-tablet' | 'tablet-desktop'
    className?: string
}

const ResponsiveShow: React.FC<ResponsiveShowProps> = ({ children, on = 'desktop', className }) => {
    const showClasses = {
        mobile: "block sm:hidden",
        tablet: "hidden sm:block lg:hidden",
        desktop: "hidden lg:block",
        'mobile-tablet': "block lg:hidden",
        'tablet-desktop': "hidden sm:block",
    }

    return (
        <div className={cn(showClasses[on], className)}>
            {children}
        </div>
    )
}

// Responsive Hide Component
interface ResponsiveHideProps {
    children: React.ReactNode
    on?: 'mobile' | 'tablet' | 'desktop' | 'mobile-tablet' | 'tablet-desktop'
    className?: string
}

const ResponsiveHide: React.FC<ResponsiveHideProps> = ({ children, on = 'mobile', className }) => {
    const hideClasses = {
        mobile: "hidden sm:block",
        tablet: "block sm:hidden lg:block",
        desktop: "block lg:hidden",
        'mobile-tablet': "hidden lg:block",
        'tablet-desktop': "block sm:hidden",
    }

    return (
        <div className={cn(hideClasses[on], className)}>
            {children}
        </div>
    )
}

export {
    ResponsiveGrid,
    ResponsiveContainer,
    ResponsiveStack,
    ResponsiveFlex,
    ResponsiveShow,
    ResponsiveHide,
    useBreakpoint,
    gridVariants,
    containerVariants,
    stackVariants,
    flexVariants,
    type ResponsiveGridProps,
    type ResponsiveContainerProps,
    type ResponsiveStackProps,
    type ResponsiveFlexProps,
    type ResponsiveShowProps,
    type ResponsiveHideProps,
}