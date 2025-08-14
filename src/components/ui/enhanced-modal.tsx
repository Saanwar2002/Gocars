'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Button } from './button';
import { cn } from '@/lib/utils';
import {
  X,
  Maximize2,
  Minimize2,
  Move,
  AlertTriangle,
  CheckCircle2,
  Info,
  AlertCircle,
  Loader2
} from 'lucide-react';

export interface EnhancedModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  closable?: boolean;
  draggable?: boolean;
  resizable?: boolean;
  fullscreenable?: boolean;
  loading?: boolean;
  backdrop?: 'blur' | 'dark' | 'light' | 'none';
  animation?: 'fade' | 'scale' | 'slide-up' | 'slide-down' | 'slide-left' | 'slide-right';
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  showFooter?: boolean;
  footerActions?: React.ReactNode;
  className?: string;
  overlayClassName?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  confirmLoading?: boolean;
}

export function EnhancedModal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  variant = 'default',
  closable = true,
  draggable = false,
  resizable = false,
  fullscreenable = false,
  loading = false,
  backdrop = 'blur',
  animation = 'scale',
  closeOnBackdrop = true,
  closeOnEscape = true,
  showFooter = false,
  footerActions,
  className,
  overlayClassName,
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmLoading = false,
}: EnhancedModalProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const modalRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<HTMLDivElement>(null);

  // Handle escape key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeOnEscape, onClose]);

  // Handle body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Dragging functionality
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!draggable || isFullscreen) return;

    const rect = modalRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
      setIsDragging(true);
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !draggable) return;

    setPosition({
      x: e.clientX - dragOffset.x,
      y: e.clientY - dragOffset.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  const getSizeClasses = () => {
    if (isFullscreen) return 'w-full h-full max-w-none max-h-none';
    
    switch (size) {
      case 'sm':
        return 'w-full max-w-md max-h-[80vh]';
      case 'md':
        return 'w-full max-w-lg max-h-[80vh]';
      case 'lg':
        return 'w-full max-w-2xl max-h-[80vh]';
      case 'xl':
        return 'w-full max-w-4xl max-h-[80vh]';
      case 'full':
        return 'w-[95vw] h-[95vh] max-w-none max-h-none';
      default:
        return 'w-full max-w-lg max-h-[80vh]';
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return 'border-success-200 bg-success-50';
      case 'warning':
        return 'border-warning-200 bg-warning-50';
      case 'error':
        return 'border-error-200 bg-error-50';
      case 'info':
        return 'border-brand-primary-200 bg-brand-primary-50';
      default:
        return 'border-brand-secondary-200 bg-white';
    }
  };

  const getVariantIcon = () => {
    switch (variant) {
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-success-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-warning-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-error-500" />;
      case 'info':
        return <Info className="h-5 w-5 text-brand-primary-500" />;
      default:
        return null;
    }
  };

  const getAnimationClasses = () => {
    switch (animation) {
      case 'fade':
        return 'animate-fade-in';
      case 'scale':
        return 'animate-scale-in';
      case 'slide-up':
        return 'animate-slide-up';
      case 'slide-down':
        return 'animate-slide-down';
      case 'slide-left':
        return 'animate-slide-in-left';
      case 'slide-right':
        return 'animate-slide-in-right';
      default:
        return 'animate-scale-in';
    }
  };

  const getBackdropClasses = () => {
    switch (backdrop) {
      case 'blur':
        return 'bg-black/50 backdrop-blur-sm';
      case 'dark':
        return 'bg-black/70';
      case 'light':
        return 'bg-white/70';
      case 'none':
        return '';
      default:
        return 'bg-black/50 backdrop-blur-sm';
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (closeOnBackdrop && e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleConfirm = () => {
    onConfirm?.();
  };

  const handleCancel = () => {
    onCancel?.();
    onClose();
  };

  if (!isOpen) return null;

  const modalContent = (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center p-4',
        getBackdropClasses(),
        overlayClassName
      )}
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className={cn(
          'relative border rounded-xl shadow-brand-xl overflow-hidden',
          getSizeClasses(),
          getVariantStyles(),
          getAnimationClasses(),
          isDragging && 'cursor-move',
          className
        )}
        style={
          draggable && !isFullscreen
            ? {
                transform: `translate(${position.x}px, ${position.y}px)`,
              }
            : undefined
        }
      >
        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center">
            <div className="flex items-center space-x-2">
              <Loader2 className="h-5 w-5 animate-spin text-brand-primary-500" />
              <span className="text-sm text-brand-secondary-600">Loading...</span>
            </div>
          </div>
        )}

        {/* Header */}
        {(title || closable || draggable || fullscreenable) && (
          <div
            ref={dragRef}
            className={cn(
              'flex items-center justify-between p-6 border-b border-brand-secondary-200',
              draggable && !isFullscreen && 'cursor-move',
              getVariantStyles()
            )}
            onMouseDown={handleMouseDown}
          >
            <div className="flex items-center space-x-3">
              {getVariantIcon()}
              <div>
                {title && (
                  <h2 className="text-lg font-semibold text-brand-secondary-900">
                    {title}
                  </h2>
                )}
                {description && (
                  <p className="text-sm text-brand-secondary-600 mt-1">
                    {description}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {draggable && !isFullscreen && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="cursor-move"
                >
                  <Move className="h-4 w-4" />
                </Button>
              )}

              {fullscreenable && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setIsFullscreen(!isFullscreen)}
                >
                  {isFullscreen ? (
                    <Minimize2 className="h-4 w-4" />
                  ) : (
                    <Maximize2 className="h-4 w-4" />
                  )}
                </Button>
              )}

              {closable && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={onClose}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-6 overflow-auto max-h-[60vh]">
          {children}
        </div>

        {/* Footer */}
        {(showFooter || footerActions || onConfirm || onCancel) && (
          <div className="flex items-center justify-end space-x-3 p-6 border-t border-brand-secondary-200 bg-brand-secondary-50">
            {footerActions || (
              <>
                {onCancel && (
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                  >
                    {cancelText}
                  </Button>
                )}
                {onConfirm && (
                  <Button
                    onClick={handleConfirm}
                    loading={confirmLoading}
                  >
                    {confirmText}
                  </Button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

// Specialized modal variants
export function ConfirmModal({
  title = 'Confirm Action',
  description = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'warning',
  ...props
}: Omit<EnhancedModalProps, 'children'> & { children?: React.ReactNode }) {
  return (
    <EnhancedModal
      {...props}
      title={title}
      description={description}
      variant={variant}
      showFooter
      confirmText={confirmText}
      cancelText={cancelText}
    >
      {props.children || (
        <p className="text-brand-secondary-600">
          This action cannot be undone. Please confirm that you want to proceed.
        </p>
      )}
    </EnhancedModal>
  );
}

export function AlertModal({
  title = 'Alert',
  variant = 'info',
  ...props
}: Omit<EnhancedModalProps, 'children' | 'onConfirm' | 'onCancel'> & { children?: React.ReactNode }) {
  return (
    <EnhancedModal
      {...props}
      title={title}
      variant={variant}
      showFooter
      onConfirm={props.onClose}
      confirmText="OK"
    >
      {props.children}
    </EnhancedModal>
  );
}

export function LoadingModal({
  title = 'Loading...',
  description = 'Please wait while we process your request.',
  ...props
}: Omit<EnhancedModalProps, 'children' | 'loading' | 'closable'>) {
  return (
    <EnhancedModal
      {...props}
      title={title}
      description={description}
      loading
      closable={false}
      closeOnBackdrop={false}
      closeOnEscape={false}
    >
      <div className="flex items-center justify-center py-8">
        <div className="flex items-center space-x-3">
          <Loader2 className="h-6 w-6 animate-spin text-brand-primary-500" />
          <span className="text-brand-secondary-600">Processing...</span>
        </div>
      </div>
    </EnhancedModal>
  );
}