/**
 * GoCars Brand Assets Configuration
 * Centralized configuration for all brand assets and their usage
 */

// Brand Asset Paths
export const brandAssets = {
  logos: {
    primary: '/brand/logo-primary.svg',
    white: '/brand/logo-white.svg',
    monochrome: '/brand/logo-monochrome.svg',
    icon: '/brand/logo-icon.svg',
    iconRound: '/brand/logo-icon-round.svg'
  },
  
  favicons: {
    svg: '/brand/favicon.svg',
    ico: '/brand/favicon.ico',
    png16: '/brand/favicon-16x16.png',
    png32: '/brand/favicon-32x32.png'
  },
  
  appIcons: {
    android192: '/brand/android-chrome-192x192.png',
    android512: '/brand/android-chrome-512x512.png',
    apple180: '/brand/apple-touch-icon.png',
    msIcon144: '/brand/mstile-144x144.png',
    msIcon150: '/brand/mstile-150x150.png'
  },
  
  socialMedia: {
    ogImage: '/brand/og-image.png',
    twitterCard: '/brand/twitter-card.png',
    linkedinBanner: '/brand/linkedin-banner.png'
  },
  
  marketing: {
    hero: '/brand/hero-illustration.svg',
    features: '/brand/features-illustration.svg',
    testimonials: '/brand/testimonials-bg.svg'
  }
} as const;

// Brand Metadata
export const brandMetadata = {
  name: 'GoCars',
  tagline: 'Your Journey, Our Priority',
  description: 'Modern, reliable taxi booking platform with intelligent features',
  keywords: ['taxi', 'ride booking', 'transportation', 'mobility', 'gocars'],
  
  // SEO and Social Media
  seo: {
    title: 'GoCars - Your Journey, Our Priority',
    description: 'Book reliable rides with GoCars. Modern taxi booking platform with real-time tracking, multiple payment options, and 24/7 support.',
    keywords: 'taxi booking, ride sharing, transportation, mobile app, gocars',
    author: 'GoCars Team',
    robots: 'index, follow',
    language: 'en-US'
  },
  
  // Open Graph / Social Media
  openGraph: {
    title: 'GoCars - Modern Taxi Booking Platform',
    description: 'Experience seamless transportation with GoCars. Book rides, track in real-time, and enjoy reliable service.',
    type: 'website',
    locale: 'en_US',
    siteName: 'GoCars'
  },
  
  // Twitter Card
  twitter: {
    card: 'summary_large_image',
    site: '@gocars',
    creator: '@gocars',
    title: 'GoCars - Your Journey, Our Priority',
    description: 'Modern taxi booking platform with intelligent features and reliable service.'
  },
  
  // PWA Manifest
  pwa: {
    name: 'GoCars',
    shortName: 'GoCars',
    description: 'Modern taxi booking platform',
    startUrl: '/',
    display: 'standalone',
    orientation: 'portrait',
    themeColor: '#2563eb',
    backgroundColor: '#ffffff',
    categories: ['travel', 'transportation', 'lifestyle']
  }
} as const;

// Brand Colors (matching design system)
export const brandColorTokens = {
  primary: '#2563eb',
  primaryDark: '#1d4ed8',
  primaryLight: '#3b82f6',
  
  secondary: '#059669',
  secondaryDark: '#047857',
  secondaryLight: '#10b981',
  
  accent: '#7c3aed',
  accentDark: '#6d28d9',
  accentLight: '#8b5cf6',
  
  warning: '#d97706',
  danger: '#dc2626',
  
  neutral: '#64748b',
  neutralDark: '#334155',
  neutralLight: '#94a3b8',
  
  background: '#ffffff',
  backgroundDark: '#0f172a',
  
  text: '#1e293b',
  textLight: '#64748b',
  textInverse: '#ffffff'
} as const;

// Usage Guidelines
export const brandUsageGuidelines = {
  logo: {
    minSize: {
      digital: '120px',
      print: '1inch'
    },
    clearSpace: 'Equal to the height of the "G" on all sides',
    backgrounds: {
      light: 'Use primary or monochrome variants',
      dark: 'Use white variant',
      colored: 'Use white or monochrome variants'
    },
    restrictions: [
      'Never stretch or skew the logo',
      'Never change the logo colors',
      'Never add effects or filters',
      'Never place on busy backgrounds without proper contrast',
      'Never use low-resolution versions'
    ]
  },
  
  colors: {
    primary: 'Use for main CTAs, links, and brand elements',
    secondary: 'Use for success states and positive actions',
    accent: 'Use sparingly for highlights and premium features',
    neutral: 'Use for text and subtle UI elements',
    restrictions: [
      'Maintain 4.5:1 contrast ratio for text',
      'Use maximum 3-4 colors per interface',
      'Reserve bright colors for important actions',
      'Test colors for accessibility compliance'
    ]
  },
  
  typography: {
    primary: 'Inter for all UI text and headings',
    monospace: 'JetBrains Mono for code and technical content',
    restrictions: [
      'Minimum 16px for body text on mobile',
      'Maintain consistent line heights',
      'Use sentence case for UI elements',
      'Limit to 2-3 font weights per interface'
    ]
  }
} as const;

// Asset Generation Configuration
export const assetGeneration = {
  favicons: [
    { size: '16x16', format: 'png' },
    { size: '32x32', format: 'png' },
    { size: '48x48', format: 'png' },
    { size: 'any', format: 'svg' }
  ],
  
  appIcons: [
    { size: '192x192', format: 'png', purpose: 'android' },
    { size: '512x512', format: 'png', purpose: 'android' },
    { size: '180x180', format: 'png', purpose: 'apple' },
    { size: '144x144', format: 'png', purpose: 'mstile' },
    { size: '150x150', format: 'png', purpose: 'mstile' }
  ],
  
  socialMedia: [
    { size: '1200x630', format: 'png', purpose: 'og-image' },
    { size: '1200x600', format: 'png', purpose: 'twitter-card' },
    { size: '1584x396', format: 'png', purpose: 'linkedin-banner' }
  ]
} as const;

// Utility functions
export const getBrandAsset = (category: keyof typeof brandAssets, asset: string) => {
  const categoryAssets = brandAssets[category] as Record<string, string>;
  return categoryAssets[asset] || '';
};

export const getBrandColor = (color: keyof typeof brandColorTokens) => {
  return brandColorTokens[color];
};

export const generateMetaTags = () => {
  const { seo, openGraph, twitter } = brandMetadata;
  
  return {
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords,
    author: seo.author,
    robots: seo.robots,
    'og:title': openGraph.title,
    'og:description': openGraph.description,
    'og:type': openGraph.type,
    'og:locale': openGraph.locale,
    'og:site_name': openGraph.siteName,
    'og:image': getBrandAsset('socialMedia', 'ogImage'),
    'twitter:card': twitter.card,
    'twitter:site': twitter.site,
    'twitter:creator': twitter.creator,
    'twitter:title': twitter.title,
    'twitter:description': twitter.description,
    'twitter:image': getBrandAsset('socialMedia', 'twitterCard')
  };
};

export const generatePWAManifest = () => {
  const { pwa } = brandMetadata;
  
  return {
    name: pwa.name,
    short_name: pwa.shortName,
    description: pwa.description,
    start_url: pwa.startUrl,
    display: pwa.display,
    orientation: pwa.orientation,
    theme_color: pwa.themeColor,
    background_color: pwa.backgroundColor,
    categories: pwa.categories,
    icons: [
      {
        src: getBrandAsset('appIcons', 'android192'),
        sizes: '192x192',
        type: 'image/png'
      },
      {
        src: getBrandAsset('appIcons', 'android512'),
        sizes: '512x512',
        type: 'image/png'
      },
      {
        src: getBrandAsset('favicons', 'svg'),
        sizes: 'any',
        type: 'image/svg+xml'
      }
    ]
  };
};

export default {
  assets: brandAssets,
  metadata: brandMetadata,
  colors: brandColorTokens,
  guidelines: brandUsageGuidelines,
  generation: assetGeneration,
  getBrandAsset,
  getBrandColor,
  generateMetaTags,
  generatePWAManifest
};