'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GoCarsLogo, GoCarsIcon } from './GoCarsLogo';
import { useBrand, useTheme } from '@/hooks/useBrand';
import { 
  Palette, 
  Type, 
  Layout, 
  Zap,
  Copy,
  CheckCircle,
  Eye,
  Smartphone,
  Monitor,
  Tablet
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function BrandShowcase() {
  const brand = useBrand();
  const theme = useTheme();
  const { toast } = useToast();
  const [copiedColor, setCopiedColor] = useState<string | null>(null);

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedColor(text);
      setTimeout(() => setCopiedColor(null), 2000);
      
      toast({
        title: 'Copied!',
        description: `${label} copied to clipboard`,
      });
    } catch (error) {
      toast({
        title: 'Copy Failed',
        description: 'Could not copy to clipboard',
        variant: 'destructive'
      });
    }
  };

  const ColorSwatch = ({ color, name, value }: { color: string; name: string; value: string }) => (
    <div 
      className="group cursor-pointer rounded-lg overflow-hidden border border-gray-200 hover:shadow-md transition-all"
      onClick={() => copyToClipboard(value, name)}
    >
      <div 
        className="h-16 w-full relative"
        style={{ backgroundColor: value }}
      >
        {copiedColor === value && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <CheckCircle className="h-6 w-6 text-white" />
          </div>
        )}
      </div>
      <div className="p-3">
        <div className="font-medium text-sm">{name}</div>
        <div className="text-xs text-gray-500 font-mono">{value}</div>
      </div>
    </div>
  );

  const TypographyExample = ({ 
    size, 
    weight, 
    children 
  }: { 
    size: string; 
    weight: string; 
    children: React.ReactNode 
  }) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600">{size} - {weight}</span>
        <span className="text-xs text-gray-400 font-mono">{size}</span>
      </div>
      <div className={`${size} font-${weight}`}>
        {children}
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <GoCarsLogo size="2xl" className="justify-center" />
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">GoCars Brand System</h1>
          <p className="text-xl text-gray-600">Comprehensive design system and brand guidelines</p>
        </div>
      </div>

      <Tabs defaultValue="logos" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="logos">Logos</TabsTrigger>
          <TabsTrigger value="colors">Colors</TabsTrigger>
          <TabsTrigger value="typography">Typography</TabsTrigger>
          <TabsTrigger value="components">Components</TabsTrigger>
          <TabsTrigger value="spacing">Spacing</TabsTrigger>
          <TabsTrigger value="examples">Examples</TabsTrigger>
        </TabsList>

        {/* Logo Variations */}
        <TabsContent value="logos" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="h-5 w-5" />
                <span>Logo Variations</span>
              </CardTitle>
              <CardDescription>
                Different logo variants for various use cases and backgrounds
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Primary Logo */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Primary Logo</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="p-6 bg-white border rounded-lg text-center">
                    <GoCarsLogo size="lg" className="justify-center mb-2" />
                    <p className="text-sm text-gray-600">Large</p>
                  </div>
                  <div className="p-6 bg-white border rounded-lg text-center">
                    <GoCarsLogo size="md" className="justify-center mb-2" />
                    <p className="text-sm text-gray-600">Medium</p>
                  </div>
                  <div className="p-6 bg-white border rounded-lg text-center">
                    <GoCarsLogo size="sm" className="justify-center mb-2" />
                    <p className="text-sm text-gray-600">Small</p>
                  </div>
                  <div className="p-6 bg-white border rounded-lg text-center">
                    <GoCarsIcon size="lg" className="justify-center mb-2" />
                    <p className="text-sm text-gray-600">Icon Only</p>
                  </div>
                </div>
              </div>

              {/* Logo on Different Backgrounds */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Background Variations</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-6 bg-white border rounded-lg text-center">
                    <GoCarsLogo variant="primary" size="lg" className="justify-center mb-2" />
                    <p className="text-sm text-gray-600">Light Background</p>
                  </div>
                  <div className="p-6 bg-gray-900 rounded-lg text-center">
                    <GoCarsLogo variant="white" size="lg" className="justify-center mb-2" />
                    <p className="text-sm text-gray-300">Dark Background</p>
                  </div>
                  <div className="p-6 bg-primary-500 rounded-lg text-center">
                    <GoCarsLogo variant="white" size="lg" className="justify-center mb-2" />
                    <p className="text-sm text-white">Brand Background</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Colors */}
        <TabsContent value="colors" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Palette className="h-5 w-5" />
                <span>Color Palette</span>
              </CardTitle>
              <CardDescription>
                Click any color to copy its hex value to clipboard
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Primary Colors */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Primary Colors</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-11 gap-3">
                  {Object.entries(brand.colors.primary).map(([shade, color]) => (
                    <ColorSwatch
                      key={shade}
                      color={color}
                      name={`Primary ${shade}`}
                      value={color}
                    />
                  ))}
                </div>
              </div>

              {/* Secondary Colors */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Secondary Colors</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-11 gap-3">
                  {Object.entries(brand.colors.secondary).map(([shade, color]) => (
                    <ColorSwatch
                      key={shade}
                      color={color}
                      name={`Secondary ${shade}`}
                      value={color}
                    />
                  ))}
                </div>
              </div>

              {/* Accent Colors */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Accent Colors</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Yellow (Taxi)</h4>
                    <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-9 gap-3">
                      {Object.entries(brand.colors.accent.yellow).map(([shade, color]) => (
                        <ColorSwatch
                          key={shade}
                          color={color}
                          name={`Yellow ${shade}`}
                          value={color}
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Green (Success)</h4>
                    <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-9 gap-3">
                      {Object.entries(brand.colors.accent.green).map(([shade, color]) => (
                        <ColorSwatch
                          key={shade}
                          color={color}
                          name={`Green ${shade}`}
                          value={color}
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Red (Error)</h4>
                    <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-9 gap-3">
                      {Object.entries(brand.colors.accent.red).map(([shade, color]) => (
                        <ColorSwatch
                          key={shade}
                          color={color}
                          name={`Red ${shade}`}
                          value={color}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Typography */}
        <TabsContent value="typography" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Type className="h-5 w-5" />
                <span>Typography System</span>
              </CardTitle>
              <CardDescription>
                Font families, sizes, and weights used throughout the application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Font Families */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Font Families</h3>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <div className="font-sans text-2xl mb-2">Inter (Sans-serif)</div>
                    <p className="font-sans text-gray-600">Used for body text, UI elements, and general content. Clean and readable.</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="font-display text-2xl mb-2">Poppins (Display)</div>
                    <p className="font-display text-gray-600">Used for headlines, hero text, and marketing materials. Bold and impactful.</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="font-mono text-2xl mb-2">JetBrains Mono</div>
                    <p className="font-mono text-gray-600">Used for code, technical content, and data display. Monospaced and clear.</p>
                  </div>
                </div>
              </div>

              {/* Typography Scale */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Typography Scale</h3>
                <div className="space-y-6">
                  <TypographyExample size="text-6xl" weight="bold">
                    Hero Headline (6xl)
                  </TypographyExample>
                  <TypographyExample size="text-4xl" weight="bold">
                    Page Title (4xl)
                  </TypographyExample>
                  <TypographyExample size="text-3xl" weight="semibold">
                    Section Header (3xl)
                  </TypographyExample>
                  <TypographyExample size="text-2xl" weight="semibold">
                    Subsection Header (2xl)
                  </TypographyExample>
                  <TypographyExample size="text-xl" weight="medium">
                    Card Title (xl)
                  </TypographyExample>
                  <TypographyExample size="text-lg" weight="medium">
                    Large Text (lg)
                  </TypographyExample>
                  <TypographyExample size="text-base" weight="normal">
                    Body Text (base)
                  </TypographyExample>
                  <TypographyExample size="text-sm" weight="normal">
                    Small Text (sm)
                  </TypographyExample>
                  <TypographyExample size="text-xs" weight="normal">
                    Caption Text (xs)
                  </TypographyExample>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Components */}
        <TabsContent value="components" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Layout className="h-5 w-5" />
                <span>Component Examples</span>
              </CardTitle>
              <CardDescription>
                Branded components using the design system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Buttons */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Buttons</h3>
                <div className="flex flex-wrap gap-4">
                  <Button className="btn-brand">Primary Button</Button>
                  <Button className="btn-brand-secondary">Secondary Button</Button>
                  <Button className="btn-brand-accent">Accent Button</Button>
                  <Button variant="outline">Outline Button</Button>
                  <Button variant="ghost">Ghost Button</Button>
                </div>
              </div>

              {/* Cards */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Cards</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="card-brand">
                    <h4 className="font-semibold mb-2">Standard Card</h4>
                    <p className="text-gray-600">This is a standard card with subtle shadow and border.</p>
                  </div>
                  <div className="card-brand-elevated">
                    <h4 className="font-semibold mb-2">Elevated Card</h4>
                    <p className="text-gray-600">This is an elevated card with more prominent shadow.</p>
                  </div>
                </div>
              </div>

              {/* Badges */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Badges</h3>
                <div className="flex flex-wrap gap-2">
                  <Badge>Default</Badge>
                  <Badge variant="secondary">Secondary</Badge>
                  <Badge variant="destructive">Error</Badge>
                  <Badge variant="outline">Outline</Badge>
                  <Badge className="bg-accent-yellow-500 text-gray-900">Success</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Spacing */}
        <TabsContent value="spacing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Spacing System</CardTitle>
              <CardDescription>
                Consistent spacing scale based on 0.25rem (4px) increments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(brand.spacing).slice(0, 20).map(([key, value]) => (
                  <div key={key} className="flex items-center space-x-4">
                    <div className="w-16 text-sm font-mono">{key}</div>
                    <div className="w-20 text-sm text-gray-600">{value}</div>
                    <div 
                      className="bg-primary-500 h-4"
                      style={{ width: value }}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Examples */}
        <TabsContent value="examples" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Eye className="h-5 w-5" />
                <span>Real-world Examples</span>
              </CardTitle>
              <CardDescription>
                How the brand system looks in actual application contexts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Mobile App Preview */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                  <Smartphone className="h-5 w-5" />
                  <span>Mobile App Interface</span>
                </h3>
                <div className="max-w-sm mx-auto bg-gray-100 p-4 rounded-2xl">
                  <div className="bg-white rounded-xl p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <GoCarsLogo size="sm" />
                      <Badge>Online</Badge>
                    </div>
                    <div className="space-y-3">
                      <div className="text-lg font-semibold">Book a Ride</div>
                      <div className="space-y-2">
                        <input 
                          className="w-full p-3 border border-gray-200 rounded-lg focus-brand" 
                          placeholder="Pickup location"
                        />
                        <input 
                          className="w-full p-3 border border-gray-200 rounded-lg focus-brand" 
                          placeholder="Destination"
                        />
                      </div>
                      <Button className="w-full btn-brand">Find Rides</Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Desktop Dashboard Preview */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                  <Monitor className="h-5 w-5" />
                  <span>Desktop Dashboard</span>
                </h3>
                <div className="border rounded-lg p-6 bg-gray-50">
                  <div className="flex items-center justify-between mb-6">
                    <GoCarsLogo size="md" />
                    <div className="flex items-center space-x-4">
                      <Badge variant="outline">Driver Mode</Badge>
                      <Button className="btn-brand-secondary">Profile</Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="card-brand">
                      <h4 className="font-semibold text-primary-600 mb-2">Today's Earnings</h4>
                      <div className="text-2xl font-bold">$127.50</div>
                      <div className="text-sm text-gray-500">+12% from yesterday</div>
                    </div>
                    <div className="card-brand">
                      <h4 className="font-semibold text-accent-green-600 mb-2">Completed Rides</h4>
                      <div className="text-2xl font-bold">8</div>
                      <div className="text-sm text-gray-500">2 hours online</div>
                    </div>
                    <div className="card-brand">
                      <h4 className="font-semibold text-accent-yellow-600 mb-2">Rating</h4>
                      <div className="text-2xl font-bold">4.9</div>
                      <div className="text-sm text-gray-500">Based on 156 rides</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}