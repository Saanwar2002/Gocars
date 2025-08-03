'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { Button } from './button';
import { Input } from './input';
import { Badge } from './badge';
import { Alert, AlertDescription, AlertTitle } from './alert';
import { 
  Heart, 
  Star, 
  Download, 
  Search, 
  User, 
  Mail, 
  Phone,
  MapPin,
  Calendar,
  Clock,
  Zap,
  Shield,
  Award,
  Trash2
} from 'lucide-react';

export function EnhancedComponentsShowcase() {
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [inputError, setInputError] = useState('');
  const [showAlert, setShowAlert] = useState(true);

  const handleLoadingDemo = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 3000);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    
    if (value.length > 0 && value.length < 3) {
      setInputError('Must be at least 3 characters');
    } else {
      setInputError('');
    }
  };

  return (
    <div className="space-y-8 p-6">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold font-display text-brand-secondary-900">
          Enhanced ShadCN Components
        </h1>
        <p className="text-lg text-brand-secondary-600">
          Modern, accessible, and beautifully designed components with GoCars branding
        </p>
      </div>

      {/* Enhanced Buttons */}
      <Card variant="elevated">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5" />
            <span>Enhanced Buttons</span>
          </CardTitle>
          <CardDescription>
            Buttons with loading states, animations, and improved accessibility
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Button Variants */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Variants</h3>
            <div className="flex flex-wrap gap-3">
              <Button variant="default">Default</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="accent">Accent</Button>
              <Button variant="success">Success</Button>
              <Button variant="warning">Warning</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="gradient">Gradient</Button>
            </div>
          </div>

          {/* Button Sizes */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Sizes</h3>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="xs">Extra Small</Button>
              <Button size="sm">Small</Button>
              <Button size="default">Default</Button>
              <Button size="lg">Large</Button>
              <Button size="xl">Extra Large</Button>
            </div>
          </div>

          {/* Button with Icons */}
          <div>
            <h3 className="text-lg font-semibold mb-3">With Icons</h3>
            <div className="flex flex-wrap gap-3">
              <Button leftIcon={<Download className="h-4 w-4" />}>
                Download
              </Button>
              <Button rightIcon={<Heart className="h-4 w-4" />} variant="secondary">
                Like
              </Button>
              <Button 
                leftIcon={<Star className="h-4 w-4" />} 
                rightIcon={<Award className="h-4 w-4" />}
                variant="accent"
              >
                Premium
              </Button>
            </div>
          </div>

          {/* Loading States */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Loading States</h3>
            <div className="flex flex-wrap gap-3">
              <Button 
                loading={loading} 
                loadingText="Processing..."
                onClick={handleLoadingDemo}
              >
                {loading ? 'Processing...' : 'Start Process'}
              </Button>
              <Button loading variant="secondary">
                Loading
              </Button>
              <Button loading variant="outline" loadingText="Saving...">
                Save
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Cards */}
      <Card variant="elevated">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Enhanced Cards</span>
          </CardTitle>
          <CardDescription>
            Cards with variants, loading states, and hover effects
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Default Card */}
            <Card variant="default" interactive>
              <CardHeader>
                <CardTitle>Default Card</CardTitle>
                <CardDescription>
                  Standard card with hover effects and smooth transitions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-brand-secondary-600">
                  This card demonstrates the default styling with interactive hover effects.
                </p>
              </CardContent>
            </Card>

            {/* Elevated Card */}
            <Card variant="elevated">
              <CardHeader>
                <CardTitle>Elevated Card</CardTitle>
                <CardDescription>
                  Card with prominent shadow and elevation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-brand-secondary-600">
                  This card has a more prominent shadow for important content.
                </p>
              </CardContent>
            </Card>

            {/* Gradient Card */}
            <Card variant="gradient">
              <CardHeader>
                <CardTitle>Gradient Card</CardTitle>
                <CardDescription>
                  Card with subtle gradient background
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-brand-secondary-600">
                  This card features a subtle brand gradient background.
                </p>
              </CardContent>
            </Card>

            {/* Loading Card */}
            <Card loading />

            {/* Ghost Card */}
            <Card variant="ghost" interactive>
              <CardHeader>
                <CardTitle>Ghost Card</CardTitle>
                <CardDescription>
                  Minimal card that appears on hover
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-brand-secondary-600">
                  This card has minimal styling until you hover over it.
                </p>
              </CardContent>
            </Card>

            {/* Flat Card */}
            <Card variant="flat">
              <CardHeader>
                <CardTitle>Flat Card</CardTitle>
                <CardDescription>
                  Simple card without shadows
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-brand-secondary-600">
                  This card has a flat design without elevation.
                </p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Inputs */}
      <Card variant="elevated">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Enhanced Inputs</span>
          </CardTitle>
          <CardDescription>
            Input fields with validation, icons, and improved UX
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Inputs */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Basic Inputs</h3>
              
              <Input 
                placeholder="Default input"
                value={inputValue}
                onChange={handleInputChange}
                error={inputError}
              />
              
              <Input 
                placeholder="Success state"
                success="Looks good!"
                defaultValue="Valid input"
              />
              
              <Input 
                placeholder="Loading state"
                loading
                defaultValue="Processing..."
              />
            </div>

            {/* Inputs with Icons */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">With Icons</h3>
              
              <Input 
                placeholder="Search..."
                leftIcon={<Search className="h-4 w-4" />}
              />
              
              <Input 
                placeholder="Email address"
                type="email"
                leftIcon={<Mail className="h-4 w-4" />}
              />
              
              <Input 
                placeholder="Phone number"
                type="tel"
                leftIcon={<Phone className="h-4 w-4" />}
              />
              
              <Input 
                placeholder="Location"
                leftIcon={<MapPin className="h-4 w-4" />}
                rightIcon={<Calendar className="h-4 w-4" />}
              />
            </div>

            {/* Password Input */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Password Input</h3>
              
              <Input 
                type="password"
                placeholder="Enter password"
              />
            </div>

            {/* Input Sizes */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Sizes</h3>
              
              <Input size="sm" placeholder="Small input" />
              <Input size="default" placeholder="Default input" />
              <Input size="lg" placeholder="Large input" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Badges */}
      <Card variant="elevated">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Award className="h-5 w-5" />
            <span>Enhanced Badges</span>
          </CardTitle>
          <CardDescription>
            Badges with variants, icons, and interactive features
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Badge Variants */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Variants</h3>
            <div className="flex flex-wrap gap-2">
              <Badge>Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="accent">Accent</Badge>
              <Badge variant="success">Success</Badge>
              <Badge variant="warning">Warning</Badge>
              <Badge variant="destructive">Error</Badge>
              <Badge variant="info">Info</Badge>
              <Badge variant="outline">Outline</Badge>
              <Badge variant="gradient">Gradient</Badge>
              <Badge variant="ghost">Ghost</Badge>
            </div>
          </div>

          {/* Badge Sizes */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Sizes</h3>
            <div className="flex flex-wrap items-center gap-2">
              <Badge size="xs">Extra Small</Badge>
              <Badge size="sm">Small</Badge>
              <Badge size="default">Default</Badge>
              <Badge size="lg">Large</Badge>
              <Badge size="xl">Extra Large</Badge>
            </div>
          </div>

          {/* Badges with Icons */}
          <div>
            <h3 className="text-lg font-semibold mb-3">With Icons</h3>
            <div className="flex flex-wrap gap-2">
              <Badge leftIcon={<Star className="h-3 w-3" />} variant="accent">
                Premium
              </Badge>
              <Badge rightIcon={<Clock className="h-3 w-3" />} variant="info">
                Pending
              </Badge>
              <Badge 
                leftIcon={<Shield className="h-3 w-3" />}
                rightIcon={<Award className="h-3 w-3" />}
                variant="success"
              >
                Verified
              </Badge>
            </div>
          </div>

          {/* Interactive Badges */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Interactive</h3>
            <div className="flex flex-wrap gap-2">
              <Badge pulse variant="destructive">
                Live
              </Badge>
              <Badge dot variant="warning">
                Notifications
              </Badge>
              <Badge 
                removable 
                onRemove={() => console.log('Badge removed')}
                variant="secondary"
              >
                Removable
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Alerts */}
      <Card variant="elevated">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Enhanced Alerts</span>
          </CardTitle>
          <CardDescription>
            Alerts with auto-dismiss, custom icons, and animations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {showAlert && (
            <Alert variant="info" dismissible onDismiss={() => setShowAlert(false)}>
              <AlertTitle>Information</AlertTitle>
              <AlertDescription>
                This is a dismissible alert with smooth animations and hover effects.
              </AlertDescription>
            </Alert>
          )}

          <Alert variant="success">
            <AlertTitle>Success!</AlertTitle>
            <AlertDescription>
              Your changes have been saved successfully. The system is now updated.
            </AlertDescription>
          </Alert>

          <Alert variant="warning">
            <AlertTitle>Warning</AlertTitle>
            <AlertDescription>
              Please review your settings before proceeding. Some changes may affect system performance.
            </AlertDescription>
          </Alert>

          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              An error occurred while processing your request. Please try again later.
            </AlertDescription>
          </Alert>

          <Alert variant="accent" icon={<Zap className="h-4 w-4" />}>
            <AlertTitle>New Feature Available!</AlertTitle>
            <AlertDescription>
              Check out our latest feature that will improve your workflow efficiency.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}