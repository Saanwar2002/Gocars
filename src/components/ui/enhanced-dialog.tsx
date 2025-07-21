import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { cva, type VariantProps } from "class-variance-authority"
import { X, Maximize2, Minimize2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "./button"

const dialogVariants = cva(
  "fixed left-[50%] top-[50%] z-50 grid w-full translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-gocars-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]",
  {
    variants: {
      variant: {
        default: "rounded-lg",
        glass: "rounded-lg bg-background/95 backdrop-blur-sm",
        modern: "rounded-xl border-primary/20",
      },
      size: {
        sm: "max-w-sm",
        default: "max-w-lg",
        lg: "max-w-2xl",
        xl: "max-w-4xl",
        full: "max-w-[95vw] max-h-[95vh]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

interface EnhancedDialogContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>,
    VariantProps<typeof dialogVariants> {
  showCloseButton?: boolean
  resizable?: boolean
  maximizable?: boolean
  onMaximize?: () => void
  onMinimize?: () => void
}

const EnhancedDialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  EnhancedDialogContentProps
>(({ 
  className, 
  children, 
  variant, 
  size, 
  showCloseButton = true,
  resizable = false,
  maximizable = false,
  onMaximize,
  onMinimize,
  ...props 
}, ref) => {
  const [isMaximized, setIsMaximized] = React.useState(false)

  const handleMaximize = () => {
    setIsMaximized(!isMaximized)
    if (isMaximized) {
      onMinimize?.()
    } else {
      onMaximize?.()
    }
  }

  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          dialogVariants({ 
            variant, 
            size: isMaximized ? "full" : size 
          }),
          resizable && "resize overflow-auto",
          className
        )}
        {...props}
      >
        {/* Dialog Controls */}
        <div className="absolute right-4 top-4 flex items-center gap-1">
          {maximizable && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-70 hover:opacity-100"
              onClick={handleMaximize}
            >
              {isMaximized ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
          )}
          {showCloseButton && (
            <DialogPrimitive.Close asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-70 hover:opacity-100"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </Button>
            </DialogPrimitive.Close>
          )}
        </div>
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
})
EnhancedDialogContent.displayName = "EnhancedDialogContent"

const EnhancedDialogHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left pr-8",
      className
    )}
    {...props}
  />
))
EnhancedDialogHeader.displayName = "EnhancedDialogHeader"

const EnhancedDialogFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 gap-2 pt-4 border-t",
      className
    )}
    {...props}
  />
))
EnhancedDialogFooter.displayName = "EnhancedDialogFooter"

const EnhancedDialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
EnhancedDialogTitle.displayName = DialogPrimitive.Title.displayName

const EnhancedDialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
EnhancedDialogDescription.displayName = DialogPrimitive.Description.displayName

// Modal component with enhanced features
interface ModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description?: string
  children: React.ReactNode
  footer?: React.ReactNode
  variant?: "default" | "glass" | "modern"
  size?: "sm" | "default" | "lg" | "xl" | "full"
  showCloseButton?: boolean
  maximizable?: boolean
  resizable?: boolean
  closeOnOutsideClick?: boolean
  closeOnEscape?: boolean
}

const Modal: React.FC<ModalProps> = ({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  variant = "default",
  size = "default",
  showCloseButton = true,
  maximizable = false,
  resizable = false,
  closeOnOutsideClick = true,
  closeOnEscape = true,
}) => {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <EnhancedDialogContent
        variant={variant}
        size={size}
        showCloseButton={showCloseButton}
        maximizable={maximizable}
        resizable={resizable}
        onPointerDownOutside={closeOnOutsideClick ? undefined : (e) => e.preventDefault()}
        onEscapeKeyDown={closeOnEscape ? undefined : (e) => e.preventDefault()}
      >
        {(title || description) && (
          <EnhancedDialogHeader>
            {title && <EnhancedDialogTitle>{title}</EnhancedDialogTitle>}
            {description && (
              <EnhancedDialogDescription>{description}</EnhancedDialogDescription>
            )}
          </EnhancedDialogHeader>
        )}
        <div className="flex-1 overflow-auto">
          {children}
        </div>
        {footer && <EnhancedDialogFooter>{footer}</EnhancedDialogFooter>}
      </EnhancedDialogContent>
    </DialogPrimitive.Root>
  )
}

// Confirmation Dialog
interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel?: () => void
  variant?: "default" | "destructive"
  loading?: boolean
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  variant = "default",
  loading = false,
}) => {
  const handleConfirm = () => {
    onConfirm()
    if (!loading) {
      onOpenChange(false)
    }
  }

  const handleCancel = () => {
    onCancel?.()
    onOpenChange(false)
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      size="sm"
      footer={
        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={loading}
            className="flex-1 sm:flex-none"
          >
            {cancelText}
          </Button>
          <Button
            variant={variant === "destructive" ? "destructive" : "default"}
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 sm:flex-none"
          >
            {loading ? "Loading..." : confirmText}
          </Button>
        </div>
      }
    />
  )
}

export {
  EnhancedDialogContent,
  EnhancedDialogHeader,
  EnhancedDialogFooter,
  EnhancedDialogTitle,
  EnhancedDialogDescription,
  Modal,
  ConfirmDialog,
  dialogVariants,
  type EnhancedDialogContentProps,
  type ModalProps,
  type ConfirmDialogProps,
}