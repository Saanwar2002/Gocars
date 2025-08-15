'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { cn } from '@/lib/utils';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  placeholder?: string;
  blurDataURL?: string;
  quality?: 'low' | 'medium' | 'high' | 'auto';
  sizes?: string;
  priority?: boolean;
  onLoad?: () => void;
  onError?: () => void;
  className?: string;
  containerClassName?: string;
  aspectRatio?: number;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
}

interface ImageVariant {
  src: string;
  width: number;
  quality: number;
}

export function LazyImage({
  src,
  alt,
  placeholder,
  blurDataURL,
  quality = 'auto',
  sizes,
  priority = false,
  onLoad,
  onError,
  className,
  containerClassName,
  aspectRatio,
  objectFit = 'cover',
  ...props
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const [currentSrc, setCurrentSrc] = useState<string>('');
  
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver>();
  
  const { getOptimalImageQuality, shouldReduceData, networkStatus } = useNetworkStatus();

  // Generate responsive image variants
  const generateImageVariants = useCallback((baseSrc: string): ImageVariant[] => {
    const variants: ImageVariant[] = [];
    const widths = [320, 640, 768, 1024, 1280, 1920];
    const qualities = shouldReduceData() ? [40, 60, 80] : [60, 80, 95];
    
    widths.forEach(width => {
      qualities.forEach(qual => {
        // This would typically integrate with your image optimization service
        // For now, we'll simulate different quality levels
        const qualityParam = shouldReduceData() ? Math.min(qual, 70) : qual;
        variants.push({
          src: `${baseSrc}?w=${width}&q=${qualityParam}`,
          width,
          quality: qualityParam,
        });
      });
    });
    
    return variants;
  }, [shouldReduceData]);

  // Get optimal image source based on network conditions
  const getOptimalSrc = useCallback(() => {
    const targetQuality = quality === 'auto' ? getOptimalImageQuality() : quality;
    const variants = generateImageVariants(src);
    
    // Select based on network conditions and device capabilities
    let optimalVariant = variants[0];
    
    if (shouldReduceData()) {
      // Use smallest, lowest quality variant
      optimalVariant = variants.reduce((prev, curr) => 
        (curr.width < prev.width && curr.quality < prev.quality) ? curr : prev
      );
    } else {
      // Use appropriate quality based on network
      const qualityMap = { low: 40, medium: 70, high: 90 };
      const targetQualityValue = qualityMap[targetQuality as keyof typeof qualityMap] || 70;
      
      optimalVariant = variants.find(v => 
        v.quality >= targetQualityValue && v.width <= 1280
      ) || variants[variants.length - 1];
    }
    
    return optimalVariant.src;
  }, [src, quality, getOptimalImageQuality, generateImageVariants, shouldReduceData]);

  // Progressive loading: start with low quality, upgrade when network allows
  const loadProgressively = useCallback(async () => {
    if (!isInView) return;
    
    const variants = generateImageVariants(src);
    const lowQualityVariant = variants.find(v => v.quality <= 40 && v.width <= 640);
    const optimalSrc = getOptimalSrc();
    
    // Load low quality first if on slow connection
    if (shouldReduceData() && lowQualityVariant && lowQualityVariant.src !== optimalSrc) {
      setCurrentSrc(lowQualityVariant.src);
      
      // Preload optimal version in background
      const img = new Image();
      img.onload = () => {
        // Upgrade to better quality when loaded
        setTimeout(() => setCurrentSrc(optimalSrc), 100);
      };
      img.src = optimalSrc;
    } else {
      setCurrentSrc(optimalSrc);
    }
  }, [isInView, src, generateImageVariants, getOptimalSrc, shouldReduceData]);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || !containerRef.current) return;
    
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observerRef.current?.disconnect();
          }
        });
      },
      {
        rootMargin: '50px', // Start loading 50px before entering viewport
        threshold: 0.1,
      }
    );
    
    observerRef.current.observe(containerRef.current);
    
    return () => {
      observerRef.current?.disconnect();
    };
  }, [priority]);

  // Load image when in view
  useEffect(() => {
    if (isInView) {
      loadProgressively();
    }
  }, [isInView, loadProgressively]);

  // Handle network changes
  useEffect(() => {
    if (isLoaded && !shouldReduceData() && networkStatus.effectiveType === '4g') {
      // Upgrade to higher quality when network improves
      const optimalSrc = getOptimalSrc();
      if (optimalSrc !== currentSrc) {
        const img = new Image();
        img.onload = () => setCurrentSrc(optimalSrc);
        img.src = optimalSrc;
      }
    }
  }, [networkStatus.effectiveType, shouldReduceData, isLoaded, currentSrc, getOptimalSrc]);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    setIsError(false);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setIsError(true);
    onError?.();
  }, [onError]);

  const placeholderSrc = blurDataURL || placeholder || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2Y3ZjdmNyIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1zaXplPSIxMiIgZmlsbD0iIzk5OTk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkxvYWRpbmcuLi48L3RleHQ+PC9zdmc+';

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative overflow-hidden bg-gray-100',
        containerClassName
      )}
      style={{
        aspectRatio: aspectRatio ? `${aspectRatio}` : undefined,
      }}
    >
      {/* Placeholder/Blur image */}
      {!isLoaded && (
        <img
          src={placeholderSrc}
          alt=""
          className={cn(
            'absolute inset-0 w-full h-full transition-opacity duration-300',
            objectFit === 'cover' && 'object-cover',
            objectFit === 'contain' && 'object-contain',
            objectFit === 'fill' && 'object-fill',
            objectFit === 'none' && 'object-none',
            objectFit === 'scale-down' && 'object-scale-down',
            blurDataURL && 'filter blur-sm scale-110'
          )}
          aria-hidden="true"
        />
      )}

      {/* Main image */}
      {currentSrc && (
        <img
          ref={imgRef}
          src={currentSrc}
          alt={alt}
          sizes={sizes}
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            'w-full h-full transition-opacity duration-300',
            objectFit === 'cover' && 'object-cover',
            objectFit === 'contain' && 'object-contain',
            objectFit === 'fill' && 'object-fill',
            objectFit === 'none' && 'object-none',
            objectFit === 'scale-down' && 'object-scale-down',
            isLoaded ? 'opacity-100' : 'opacity-0',
            className
          )}
          {...props}
        />
      )}

      {/* Error state */}
      {isError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-400">
          <div className="text-center">
            <svg
              className="w-8 h-8 mx-auto mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            <p className="text-sm">Failed to load image</p>
          </div>
        </div>
      )}

      {/* Loading indicator */}
      {isInView && !isLoaded && !isError && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Network quality indicator (development only) */}
      {process.env.NODE_ENV === 'development' && isLoaded && (
        <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
          {networkStatus.effectiveType}
        </div>
      )}
    </div>
  );
}

// Gallery component with optimized loading
export function LazyImageGallery({ 
  images, 
  columns = 2,
  gap = 4,
  onImageClick 
}: {
  images: Array<{
    src: string;
    alt: string;
    aspectRatio?: number;
  }>;
  columns?: number;
  gap?: number;
  onImageClick?: (index: number) => void;
}) {
  const { shouldReduceData } = useNetworkStatus();
  
  // Reduce columns on slow connections
  const effectiveColumns = shouldReduceData() ? Math.min(columns, 2) : columns;
  
  return (
    <div 
      className="grid gap-4"
      style={{
        gridTemplateColumns: `repeat(${effectiveColumns}, 1fr)`,
        gap: `${gap * 0.25}rem`,
      }}
    >
      {images.map((image, index) => (
        <div
          key={index}
          className="cursor-pointer hover:opacity-90 transition-opacity"
          onClick={() => onImageClick?.(index)}
        >
          <LazyImage
            src={image.src}
            alt={image.alt}
            aspectRatio={image.aspectRatio || 1}
            quality="auto"
            className="rounded-lg"
          />
        </div>
      ))}
    </div>
  );
}

// Hook for preloading images
export function useImagePreloader() {
  const { shouldReduceData, isFastConnection } = useNetworkStatus();
  const preloadedImages = useRef<Set<string>>(new Set());

  const preloadImage = useCallback((src: string, priority: 'low' | 'high' = 'low') => {
    // Skip preloading on slow connections unless high priority
    if (shouldReduceData() && priority !== 'high') {
      return Promise.resolve();
    }

    // Skip if already preloaded
    if (preloadedImages.current.has(src)) {
      return Promise.resolve();
    }

    return new Promise<void>((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        preloadedImages.current.add(src);
        resolve();
      };
      
      img.onerror = reject;
      
      // Use lower quality for preloading on slower connections
      const quality = isFastConnection() ? 80 : 60;
      img.src = `${src}?q=${quality}`;
    });
  }, [shouldReduceData, isFastConnection]);

  const preloadImages = useCallback((sources: string[], priority: 'low' | 'high' = 'low') => {
    return Promise.allSettled(
      sources.map(src => preloadImage(src, priority))
    );
  }, [preloadImage]);

  return {
    preloadImage,
    preloadImages,
    preloadedImages: preloadedImages.current,
  };
}