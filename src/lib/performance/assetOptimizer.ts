// CDN integration and asset optimization for maximum performance

interface AssetConfig {
  type: 'image' | 'video' | 'audio' | 'document' | 'font' | 'css' | 'js';
  quality: 'low' | 'medium' | 'high' | 'lossless';
  format: string;
  maxSize: number;
  cacheTTL: number;
  cdnEnabled: boolean;
  compressionEnabled: boolean;
  lazyLoadEnabled: boolean;
}

interface OptimizationResult {
  originalSize: number;
  optimizedSize: number;
  compressionRatio: number;
  format: string;
  quality: string;
  optimizedUrl: string;
  cdnUrl?: string;
  webpUrl?: string;
  avifUrl?: string;
}

interface CDNConfig {
  provider: 'cloudflare' | 'aws' | 'azure' | 'gcp' | 'custom';
  baseUrl: string;
  apiKey?: string;
  regions: string[];
  cacheRules: CacheRule[];
  transformations: TransformationRule[];
}

interface CacheRule {
  pattern: string;
  ttl: number;
  browserCache: number;
  edgeCache: number;
  compression: boolean;
}

interface TransformationRule {
  pattern: string;
  transformations: {
    resize?: { width?: number; height?: number; fit?: 'cover' | 'contain' | 'fill' };
    format?: 'webp' | 'avif' | 'jpeg' | 'png';
    quality?: number;
    blur?: number;
    sharpen?: number;
  };
}

interface AssetMetrics {
  totalAssets: number;
  totalSize: number;
  optimizedSize: number;
  compressionRatio: number;
  cdnHitRate: number;
  averageLoadTime: number;
  bandwidthSaved: number;
  cacheEfficiency: number;
}

export class AssetOptimizer {
  private cdnConfig: CDNConfig | null = null;
  private assetConfigs: Map<string, AssetConfig> = new Map();
  private optimizationCache: Map<string, OptimizationResult> = new Map();
  private metrics: AssetMetrics = {
    totalAssets: 0,
    totalSize: 0,
    optimizedSize: 0,
    compressionRatio: 1,
    cdnHitRate: 0,
    averageLoadTime: 0,
    bandwidthSaved: 0,
    cacheEfficiency: 0,
  };

  constructor() {
    this.initializeDefaultConfigs();
    this.setupPerformanceMonitoring();
  }

  private initializeDefaultConfigs() {
    // Default asset configurations
    this.assetConfigs.set('image', {
      type: 'image',
      quality: 'high',
      format: 'webp',
      maxSize: 2 * 1024 * 1024, // 2MB
      cacheTTL: 24 * 60 * 60 * 1000, // 24 hours
      cdnEnabled: true,
      compressionEnabled: true,
      lazyLoadEnabled: true,
    });

    this.assetConfigs.set('video', {
      type: 'video',
      quality: 'medium',
      format: 'mp4',
      maxSize: 50 * 1024 * 1024, // 50MB
      cacheTTL: 7 * 24 * 60 * 60 * 1000, // 7 days
      cdnEnabled: true,
      compressionEnabled: true,
      lazyLoadEnabled: true,
    });

    this.assetConfigs.set('font', {
      type: 'font',
      quality: 'lossless',
      format: 'woff2',
      maxSize: 500 * 1024, // 500KB
      cacheTTL: 30 * 24 * 60 * 60 * 1000, // 30 days
      cdnEnabled: true,
      compressionEnabled: true,
      lazyLoadEnabled: false,
    });

    this.assetConfigs.set('css', {
      type: 'css',
      quality: 'lossless',
      format: 'css',
      maxSize: 1024 * 1024, // 1MB
      cacheTTL: 24 * 60 * 60 * 1000, // 24 hours
      cdnEnabled: true,
      compressionEnabled: true,
      lazyLoadEnabled: false,
    });

    this.assetConfigs.set('js', {
      type: 'js',
      quality: 'lossless',
      format: 'js',
      maxSize: 2 * 1024 * 1024, // 2MB
      cacheTTL: 24 * 60 * 60 * 1000, // 24 hours
      cdnEnabled: true,
      compressionEnabled: true,
      lazyLoadEnabled: false,
    });
  }

  private setupPerformanceMonitoring() {
    if (typeof window === 'undefined') return;

    // Monitor resource loading performance
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.entryType === 'resource') {
          this.analyzeResourcePerformance(entry as PerformanceResourceTiming);
        }
      });
    });

    observer.observe({ entryTypes: ['resource'] });

    // Update metrics periodically
    setInterval(() => {
      this.updateMetrics();
    }, 30000); // Every 30 seconds
  }

  private analyzeResourcePerformance(entry: PerformanceResourceTiming) {
    const url = entry.name;
    const loadTime = entry.responseEnd - entry.requestStart;
    const size = entry.transferSize || 0;
    const cached = entry.transferSize === 0 && entry.decodedBodySize > 0;

    // Update metrics
    this.metrics.totalAssets++;
    this.metrics.totalSize += size;
    this.metrics.averageLoadTime = 
      (this.metrics.averageLoadTime * (this.metrics.totalAssets - 1) + loadTime) / this.metrics.totalAssets;

    if (cached) {
      this.metrics.cdnHitRate = 
        (this.metrics.cdnHitRate * (this.metrics.totalAssets - 1) + 1) / this.metrics.totalAssets;
    }
  }

  // CDN Configuration
  public configureCDN(config: CDNConfig): void {
    this.cdnConfig = config;
  }

  public getCDNUrl(assetUrl: string, transformations?: any): string {
    if (!this.cdnConfig) return assetUrl;

    const baseUrl = this.cdnConfig.baseUrl.replace(/\/$/, '');
    const cleanUrl = assetUrl.replace(/^https?:\/\/[^\/]+/, '');
    
    let cdnUrl = `${baseUrl}${cleanUrl}`;

    // Apply transformations
    if (transformations && this.cdnConfig.provider === 'cloudflare') {
      const params = new URLSearchParams();
      
      if (transformations.width) params.set('width', transformations.width.toString());
      if (transformations.height) params.set('height', transformations.height.toString());
      if (transformations.quality) params.set('quality', transformations.quality.toString());
      if (transformations.format) params.set('format', transformations.format);
      if (transformations.fit) params.set('fit', transformations.fit);

      if (params.toString()) {
        cdnUrl += `?${params.toString()}`;
      }
    }

    return cdnUrl;
  }

  // Image Optimization
  public async optimizeImage(
    imageUrl: string, 
    options: {
      width?: number;
      height?: number;
      quality?: number;
      format?: 'webp' | 'avif' | 'jpeg' | 'png';
      fit?: 'cover' | 'contain' | 'fill';
    } = {}
  ): Promise<OptimizationResult> {
    const cacheKey = `${imageUrl}:${JSON.stringify(options)}`;
    
    // Check cache first
    if (this.optimizationCache.has(cacheKey)) {
      return this.optimizationCache.get(cacheKey)!;
    }

    try {
      // Get original image info
      const originalInfo = await this.getImageInfo(imageUrl);
      
      // Generate optimized versions
      const optimizedUrl = this.generateOptimizedUrl(imageUrl, options);
      const webpUrl = this.generateOptimizedUrl(imageUrl, { ...options, format: 'webp' });
      const avifUrl = this.generateOptimizedUrl(imageUrl, { ...options, format: 'avif' });
      
      // Estimate compression
      const estimatedSize = this.estimateOptimizedSize(originalInfo.size, options);
      
      const result: OptimizationResult = {
        originalSize: originalInfo.size,
        optimizedSize: estimatedSize,
        compressionRatio: originalInfo.size / estimatedSize,
        format: options.format || 'webp',
        quality: options.quality?.toString() || 'auto',
        optimizedUrl,
        cdnUrl: this.cdnConfig ? this.getCDNUrl(optimizedUrl) : undefined,
        webpUrl,
        avifUrl,
      };

      // Cache result
      this.optimizationCache.set(cacheKey, result);
      
      return result;
    } catch (error) {
      console.error('Image optimization failed:', error);
      
      // Return fallback result
      return {
        originalSize: 0,
        optimizedSize: 0,
        compressionRatio: 1,
        format: 'original',
        quality: 'original',
        optimizedUrl: imageUrl,
      };
    }
  }

  private async getImageInfo(imageUrl: string): Promise<{ width: number; height: number; size: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        // Estimate size based on dimensions (rough approximation)
        const estimatedSize = img.width * img.height * 3; // 3 bytes per pixel (RGB)
        
        resolve({
          width: img.width,
          height: img.height,
          size: estimatedSize,
        });
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      
      img.src = imageUrl;
    });
  }

  private generateOptimizedUrl(imageUrl: string, options: any): string {
    if (this.cdnConfig) {
      return this.getCDNUrl(imageUrl, options);
    }

    // Fallback: append optimization parameters
    const url = new URL(imageUrl);
    
    if (options.width) url.searchParams.set('w', options.width.toString());
    if (options.height) url.searchParams.set('h', options.height.toString());
    if (options.quality) url.searchParams.set('q', options.quality.toString());
    if (options.format) url.searchParams.set('f', options.format);
    if (options.fit) url.searchParams.set('fit', options.fit);

    return url.toString();
  }

  private estimateOptimizedSize(originalSize: number, options: any): number {
    let compressionRatio = 1;

    // Format-based compression
    switch (options.format) {
      case 'webp':
        compressionRatio *= 0.7; // WebP is ~30% smaller
        break;
      case 'avif':
        compressionRatio *= 0.5; // AVIF is ~50% smaller
        break;
      case 'jpeg':
        compressionRatio *= 0.8;
        break;
    }

    // Quality-based compression
    if (options.quality) {
      compressionRatio *= options.quality / 100;
    }

    // Resize-based compression
    if (options.width || options.height) {
      compressionRatio *= 0.6; // Assume 40% size reduction from resizing
    }

    return Math.round(originalSize * compressionRatio);
  }

  // Font Optimization
  public optimizeFont(fontUrl: string): string {
    const config = this.assetConfigs.get('font')!;
    
    if (config.cdnEnabled && this.cdnConfig) {
      return this.getCDNUrl(fontUrl);
    }

    return fontUrl;
  }

  public generateFontPreloadLinks(fonts: string[]): string[] {
    return fonts.map(font => {
      const optimizedUrl = this.optimizeFont(font);
      return `<link rel="preload" href="${optimizedUrl}" as="font" type="font/woff2" crossorigin>`;
    });
  }

  // CSS/JS Optimization
  public optimizeCSS(cssUrl: string): string {
    const config = this.assetConfigs.get('css')!;
    
    if (config.cdnEnabled && this.cdnConfig) {
      return this.getCDNUrl(cssUrl);
    }

    return cssUrl;
  }

  public optimizeJS(jsUrl: string): string {
    const config = this.assetConfigs.get('js')!;
    
    if (config.cdnEnabled && this.cdnConfig) {
      return this.getCDNUrl(jsUrl);
    }

    return jsUrl;
  }

  // Critical Resource Optimization
  public generateCriticalResourceHints(resources: { url: string; type: string; priority: 'high' | 'low' }[]): string[] {
    const hints: string[] = [];

    resources.forEach(resource => {
      const optimizedUrl = this.optimizeAssetUrl(resource.url, resource.type);
      
      if (resource.priority === 'high') {
        hints.push(`<link rel="preload" href="${optimizedUrl}" as="${resource.type}">`);
      } else {
        hints.push(`<link rel="prefetch" href="${optimizedUrl}">`);
      }
    });

    return hints;
  }

  private optimizeAssetUrl(url: string, type: string): string {
    switch (type) {
      case 'image':
        return this.generateOptimizedUrl(url, { format: 'webp', quality: 80 });
      case 'font':
        return this.optimizeFont(url);
      case 'style':
        return this.optimizeCSS(url);
      case 'script':
        return this.optimizeJS(url);
      default:
        return this.cdnConfig ? this.getCDNUrl(url) : url;
    }
  }

  // Responsive Images
  public generateResponsiveImageSet(
    imageUrl: string,
    breakpoints: { width: number; descriptor?: string }[]
  ): { srcset: string; sizes: string } {
    const srcsetEntries = breakpoints.map(bp => {
      const optimizedUrl = this.generateOptimizedUrl(imageUrl, {
        width: bp.width,
        format: 'webp',
        quality: 80,
      });
      
      const descriptor = bp.descriptor || `${bp.width}w`;
      return `${optimizedUrl} ${descriptor}`;
    });

    const sizes = breakpoints
      .map((bp, index) => {
        if (index === breakpoints.length - 1) {
          return `${bp.width}px`;
        }
        return `(max-width: ${bp.width}px) ${bp.width}px`;
      })
      .join(', ');

    return {
      srcset: srcsetEntries.join(', '),
      sizes,
    };
  }

  // Progressive Enhancement
  public generatePictureElement(
    imageUrl: string,
    options: {
      breakpoints: { width: number; media?: string }[];
      formats: ('avif' | 'webp' | 'jpeg')[];
      alt: string;
      loading?: 'lazy' | 'eager';
    }
  ): string {
    const sources: string[] = [];

    // Generate sources for each format
    options.formats.forEach(format => {
      options.breakpoints.forEach(bp => {
        const optimizedUrl = this.generateOptimizedUrl(imageUrl, {
          width: bp.width,
          format,
          quality: 80,
        });

        const media = bp.media || `(max-width: ${bp.width}px)`;
        sources.push(`<source srcset="${optimizedUrl}" type="image/${format}" media="${media}">`);
      });
    });

    // Fallback img element
    const fallbackUrl = this.generateOptimizedUrl(imageUrl, {
      width: options.breakpoints[0].width,
      format: 'jpeg',
      quality: 80,
    });

    const imgElement = `<img src="${fallbackUrl}" alt="${options.alt}" ${
      options.loading ? `loading="${options.loading}"` : ''
    }>`;

    return `<picture>${sources.join('')}${imgElement}</picture>`;
  }

  // Performance Monitoring
  private updateMetrics(): void {
    // Calculate compression ratio
    if (this.metrics.totalSize > 0) {
      this.metrics.compressionRatio = this.metrics.totalSize / this.metrics.optimizedSize;
      this.metrics.bandwidthSaved = this.metrics.totalSize - this.metrics.optimizedSize;
    }

    // Calculate cache efficiency
    const cacheableAssets = this.metrics.totalAssets * 0.8; // Assume 80% are cacheable
    this.metrics.cacheEfficiency = this.metrics.cdnHitRate * cacheableAssets / this.metrics.totalAssets;
  }

  // Asset Preloading Strategy
  public generatePreloadStrategy(
    criticalAssets: string[],
    importantAssets: string[],
    deferredAssets: string[]
  ): {
    preload: string[];
    prefetch: string[];
    defer: string[];
  } {
    return {
      preload: criticalAssets.map(asset => this.optimizeAssetUrl(asset, this.getAssetType(asset))),
      prefetch: importantAssets.map(asset => this.optimizeAssetUrl(asset, this.getAssetType(asset))),
      defer: deferredAssets.map(asset => this.optimizeAssetUrl(asset, this.getAssetType(asset))),
    };
  }

  private getAssetType(url: string): string {
    const extension = url.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'webp':
      case 'avif':
        return 'image';
      case 'woff':
      case 'woff2':
      case 'ttf':
      case 'otf':
        return 'font';
      case 'css':
        return 'style';
      case 'js':
        return 'script';
      case 'mp4':
      case 'webm':
        return 'video';
      default:
        return 'document';
    }
  }

  // Public API
  public getMetrics(): AssetMetrics {
    return { ...this.metrics };
  }

  public generateOptimizationReport(): {
    metrics: AssetMetrics;
    recommendations: string[];
    optimizedAssets: OptimizationResult[];
  } {
    const recommendations: string[] = [];
    
    if (this.metrics.compressionRatio < 2) {
      recommendations.push('Enable better image compression to reduce bandwidth usage');
    }
    
    if (this.metrics.cdnHitRate < 0.8) {
      recommendations.push('Improve CDN cache hit rate by optimizing cache headers');
    }
    
    if (this.metrics.averageLoadTime > 1000) {
      recommendations.push('Optimize asset loading times by implementing preloading strategies');
    }

    return {
      metrics: this.getMetrics(),
      recommendations,
      optimizedAssets: Array.from(this.optimizationCache.values()),
    };
  }

  public clearCache(): void {
    this.optimizationCache.clear();
  }
}

// Singleton instance
export const assetOptimizer = new AssetOptimizer();

// Configure default CDN (example)
assetOptimizer.configureCDN({
  provider: 'cloudflare',
  baseUrl: 'https://cdn.gocars.com',
  regions: ['us-east-1', 'eu-west-1', 'ap-southeast-1'],
  cacheRules: [
    {
      pattern: '*.{jpg,jpeg,png,webp,avif}',
      ttl: 24 * 60 * 60, // 24 hours
      browserCache: 7 * 24 * 60 * 60, // 7 days
      edgeCache: 30 * 24 * 60 * 60, // 30 days
      compression: true,
    },
    {
      pattern: '*.{css,js}',
      ttl: 60 * 60, // 1 hour
      browserCache: 24 * 60 * 60, // 24 hours
      edgeCache: 7 * 24 * 60 * 60, // 7 days
      compression: true,
    },
    {
      pattern: '*.{woff,woff2}',
      ttl: 30 * 24 * 60 * 60, // 30 days
      browserCache: 365 * 24 * 60 * 60, // 1 year
      edgeCache: 365 * 24 * 60 * 60, // 1 year
      compression: true,
    },
  ],
  transformations: [
    {
      pattern: '/images/*',
      transformations: {
        format: 'webp',
        quality: 80,
      },
    },
  ],
});