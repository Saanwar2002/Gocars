# TaxiNow/MyBase - Implementation Guide

## Overview

This implementation guide provides detailed technical specifications, code examples, and best practices for rebuilding the TaxiNow/MyBase platform. It serves as a practical companion to the development plan, offering concrete implementation strategies.

## Project Structure & Architecture

### Recommended File Structure

```
taxinow-mybase/
├── .github/
│   └── workflows/
│       ├── ci.yml
│       ├── deploy.yml
│       └── quality-check.yml
├── .vscode/
│   ├── settings.json
│   └── extensions.json
├── docs/
│   ├── api/
│   ├── deployment/
│   └── user-guides/
├── public/
│   ├── icons/
│   ├── images/
│   └── manifest.json
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/
│   │   ├── (dashboard)/
│   │   ├── api/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/             # Shared UI components
│   │   ├── ui/                # Base components (shadcn/ui)
│   │   ├── forms/             # Form components
│   │   ├── layout/            # Layout components
│   │   └── feedback/          # Loading, error states
│   ├── features/              # Feature modules
│   │   ├── auth/
│   │   ├── booking/
│   │   ├── tracking/
│   │   ├── payments/
│   │   ├── messaging/
│   │   └── analytics/
│   ├── lib/                   # Utilities and configurations
│   │   ├── auth.ts
│   │   ├── firebase.ts
│   │   ├── utils.ts
│   │   └── validations.ts
│   ├── hooks/                 # Custom React hooks
│   ├── services/              # API services
│   ├── stores/                # State management
│   ├── types/                 # TypeScript definitions
│   └── constants/             # App constants
├── tests/
│   ├── __mocks__/
│   ├── e2e/
│   ├── integration/
│   └── unit/
├── .env.local
├── .env.example
├── .eslintrc.json
├── .gitignore
├── jest.config.js
├── next.config.js
├── package.json
├── playwright.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

## Core Implementation Patterns

### 1. Feature-Based Architecture

Each feature should be self-contained with its own components, hooks, services, and types:

```typescript
// features/booking/index.ts
export { BookingForm } from './components/BookingForm'
export { useBooking } from './hooks/useBooking'
export { bookingService } from './services/bookingService'
export type { Booking, BookingRequest } from './types'

// features/booking/types/index.ts
export interface Booking {
  id: string
  passengerId: string
  driverId?: string
  status: BookingStatus
  pickupLocation: Location
  destinationLocation: Location
  estimatedFare: number
  createdAt: Date
  scheduledTime?: Date
}

export interface BookingRequest {
  pickupLocation: Location
  destinationLocation: Location
  vehicleType?: VehicleType
  scheduledTime?: Date
  specialRequirements?: string[]
}

export type BookingStatus = 
  | 'pending'
  | 'confirmed'
  | 'driver_assigned'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
```

### 2. Service Layer Pattern

```typescript
// services/bookingService.ts
import { db } from '@/lib/firebase'
import { collection, addDoc, updateDoc, doc, onSnapshot } from 'firebase/firestore'
import type { Booking, BookingRequest } from '@/features/booking/types'

export class BookingService {
  private static instance: BookingService
  private readonly collection = 'bookings'

  static getInstance(): BookingService {
    if (!BookingService.instance) {
      BookingService.instance = new BookingService()
    }
    return BookingService.instance
  }

  async createBooking(request: BookingRequest): Promise<Booking> {
    try {
      const bookingData = {
        ...request,
        status: 'pending' as const,
        createdAt: new Date(),
        estimatedFare: await this.calculateFare(request)
      }

      const docRef = await addDoc(collection(db, this.collection), bookingData)
      
      return {
        id: docRef.id,
        ...bookingData
      }
    } catch (error) {
      throw new BookingError('Failed to create booking', error)
    }
  }

  async updateBookingStatus(bookingId: string, status: BookingStatus): Promise<void> {
    try {
      const bookingRef = doc(db, this.collection, bookingId)
      await updateDoc(bookingRef, { 
        status,
        updatedAt: new Date()
      })
    } catch (error) {
      throw new BookingError('Failed to update booking status', error)
    }
  }

  subscribeToBooking(bookingId: string, callback: (booking: Booking) => void): () => void {
    const bookingRef = doc(db, this.collection, bookingId)
    
    return onSnapshot(bookingRef, (doc) => {
      if (doc.exists()) {
        callback({ id: doc.id, ...doc.data() } as Booking)
      }
    })
  }

  private async calculateFare(request: BookingRequest): Promise<number> {
    // Implement fare calculation logic
    const distance = await this.calculateDistance(
      request.pickupLocation,
      request.destinationLocation
    )
    
    const baseFare = 3.50
    const perKmRate = 1.20
    
    return baseFare + (distance * perKmRate)
  }

  private async calculateDistance(from: Location, to: Location): Promise<number> {
    // Use Google Maps Distance Matrix API
    // Implementation details...
    return 0
  }
}

// Custom error classes
export class BookingError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message)
    this.name = 'BookingError'
  }
}
```

### 3. Custom Hooks Pattern

```typescript
// features/booking/hooks/useBooking.ts
import { useState, useCallback } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { BookingService } from '../services/bookingService'
import type { Booking, BookingRequest } from '../types'

export function useBooking() {
  const queryClient = useQueryClient()
  const bookingService = BookingService.getInstance()

  const createBookingMutation = useMutation({
    mutationFn: (request: BookingRequest) => bookingService.createBooking(request),
    onSuccess: (booking) => {
      queryClient.setQueryData(['booking', booking.id], booking)
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
    },
    onError: (error) => {
      console.error('Failed to create booking:', error)
    }
  })

  const updateBookingMutation = useMutation({
    mutationFn: ({ bookingId, status }: { bookingId: string; status: BookingStatus }) =>
      bookingService.updateBookingStatus(bookingId, status),
    onSuccess: (_, { bookingId }) => {
      queryClient.invalidateQueries({ queryKey: ['booking', bookingId] })
    }
  })

  return {
    createBooking: createBookingMutation.mutate,
    updateBookingStatus: updateBookingMutation.mutate,
    isCreating: createBookingMutation.isPending,
    isUpdating: updateBookingMutation.isPending,
    error: createBookingMutation.error || updateBookingMutation.error
  }
}

// Real-time booking hook
export function useBookingRealtime(bookingId: string) {
  const [booking, setBooking] = useState<Booking | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const bookingService = BookingService.getInstance()

  useEffect(() => {
    if (!bookingId) return

    const unsubscribe = bookingService.subscribeToBooking(bookingId, (updatedBooking) => {
      setBooking(updatedBooking)
      setIsLoading(false)
    })

    return unsubscribe
  }, [bookingId, bookingService])

  return { booking, isLoading }
}
```

### 4. Component Architecture

```typescript
// components/forms/BookingForm.tsx
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { LocationPicker } from './LocationPicker'
import { VehicleSelector } from './VehicleSelector'
import { useBooking } from '@/features/booking/hooks/useBooking'
import type { BookingRequest } from '@/features/booking/types'

const bookingSchema = z.object({
  pickupLocation: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    address: z.string().min(1, 'Pickup location is required')
  }),
  destinationLocation: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    address: z.string().min(1, 'Destination is required')
  }),
  vehicleType: z.enum(['standard', 'premium', 'xl']).optional(),
  scheduledTime: z.date().optional(),
  specialRequirements: z.string().optional()
})

type BookingFormData = z.infer<typeof bookingSchema>

interface BookingFormProps {
  onSuccess?: (booking: Booking) => void
  onError?: (error: Error) => void
}

export function BookingForm({ onSuccess, onError }: BookingFormProps) {
  const { createBooking, isCreating, error } = useBooking()
  
  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      vehicleType: 'standard'
    }
  })

  const onSubmit = async (data: BookingFormData) => {
    try {
      const booking = await createBooking(data)
      onSuccess?.(booking)
      form.reset()
    } catch (err) {
      onError?.(err as Error)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="pickupLocation"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Pickup Location</FormLabel>
              <FormControl>
                <LocationPicker
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Enter pickup location"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="destinationLocation"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Destination</FormLabel>
              <FormControl>
                <LocationPicker
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Enter destination"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="vehicleType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Vehicle Type</FormLabel>
              <FormControl>
                <VehicleSelector
                  value={field.value}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button 
          type="submit" 
          disabled={isCreating}
          className="w-full"
        >
          {isCreating ? 'Creating Booking...' : 'Book Ride'}
        </Button>

        {error && (
          <div className="text-sm text-destructive">
            {error.message}
          </div>
        )}
      </form>
    </Form>
  )
}
```

## State Management Strategy

### 1. Global State with Zustand

```typescript
// stores/authStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/types/user'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (user: User) => void
  logout: () => void
  updateUser: (updates: Partial<User>) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      login: (user) => set({ 
        user, 
        isAuthenticated: true,
        isLoading: false 
      }),

      logout: () => set({ 
        user: null, 
        isAuthenticated: false,
        isLoading: false 
      }),

      updateUser: (updates) => {
        const currentUser = get().user
        if (currentUser) {
          set({ user: { ...currentUser, ...updates } })
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user,
        isAuthenticated: state.isAuthenticated 
      })
    }
  )
)
```

### 2. Feature-Specific State

```typescript
// stores/bookingStore.ts
import { create } from 'zustand'
import type { Booking } from '@/features/booking/types'

interface BookingState {
  currentBooking: Booking | null
  bookingHistory: Booking[]
  setCurrentBooking: (booking: Booking | null) => void
  addToHistory: (booking: Booking) => void
  updateBooking: (bookingId: string, updates: Partial<Booking>) => void
}

export const useBookingStore = create<BookingState>((set, get) => ({
  currentBooking: null,
  bookingHistory: [],

  setCurrentBooking: (booking) => set({ currentBooking: booking }),

  addToHistory: (booking) => set((state) => ({
    bookingHistory: [booking, ...state.bookingHistory]
  })),

  updateBooking: (bookingId, updates) => set((state) => {
    const updatedHistory = state.bookingHistory.map(booking =>
      booking.id === bookingId ? { ...booking, ...updates } : booking
    )
    
    const updatedCurrent = state.currentBooking?.id === bookingId
      ? { ...state.currentBooking, ...updates }
      : state.currentBooking

    return {
      bookingHistory: updatedHistory,
      currentBooking: updatedCurrent
    }
  })
}))
```

## Error Handling & User Feedback

### 1. Error Boundary Implementation

```typescript
// components/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
    
    // Send to error reporting service
    if (typeof window !== 'undefined') {
      // Sentry.captureException(error, { extra: errorInfo })
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-6">
          <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
          <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
          <p className="text-muted-foreground text-center mb-4">
            We're sorry, but something unexpected happened. Please try refreshing the page.
          </p>
          <Button 
            onClick={() => window.location.reload()}
            variant="outline"
          >
            Refresh Page
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}
```

### 2. Toast Notification System

```typescript
// hooks/useToast.ts
import { create } from 'zustand'

interface Toast {
  id: string
  title: string
  description?: string
  type: 'success' | 'error' | 'warning' | 'info'
  duration?: number
}

interface ToastState {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
  clearToasts: () => void
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],

  addToast: (toast) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast = { ...toast, id }
    
    set((state) => ({
      toasts: [...state.toasts, newToast]
    }))

    // Auto remove after duration
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter(t => t.id !== id)
      }))
    }, toast.duration || 5000)
  },

  removeToast: (id) => set((state) => ({
    toasts: state.toasts.filter(t => t.id !== id)
  })),

  clearToasts: () => set({ toasts: [] })
}))

export function useToast() {
  const { addToast, removeToast, clearToasts } = useToastStore()

  return {
    toast: addToast,
    dismiss: removeToast,
    clear: clearToasts,
    success: (title: string, description?: string) => 
      addToast({ title, description, type: 'success' }),
    error: (title: string, description?: string) => 
      addToast({ title, description, type: 'error' }),
    warning: (title: string, description?: string) => 
      addToast({ title, description, type: 'warning' }),
    info: (title: string, description?: string) => 
      addToast({ title, description, type: 'info' })
  }
}
```

## Performance Optimization

### 1. Component Optimization

```typescript
// components/optimized/LazyMap.tsx
import { lazy, Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

const MapComponent = lazy(() => import('./MapComponent'))

interface LazyMapProps {
  center: { lat: number; lng: number }
  markers: Array<{ lat: number; lng: number; title: string }>
}

export function LazyMap(props: LazyMapProps) {
  return (
    <Suspense fallback={<MapSkeleton />}>
      <MapComponent {...props} />
    </Suspense>
  )
}

function MapSkeleton() {
  return (
    <div className="w-full h-[400px] rounded-lg overflow-hidden">
      <Skeleton className="w-full h-full" />
    </div>
  )
}
```

### 2. Data Fetching Optimization

```typescript
// hooks/useOptimizedQuery.ts
import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'

export function useOptimizedDrivers(location: { lat: number; lng: number }) {
  const queryKey = useMemo(() => 
    ['drivers', 'nearby', Math.round(location.lat * 1000), Math.round(location.lng * 1000)], 
    [location.lat, location.lng]
  )

  return useQuery({
    queryKey,
    queryFn: () => fetchNearbyDrivers(location),
    staleTime: 30 * 1000, // 30 seconds
    cacheTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 15 * 1000, // Refetch every 15 seconds
    enabled: Boolean(location.lat && location.lng)
  })
}
```

## Testing Strategy

### 1. Unit Testing

```typescript
// __tests__/services/bookingService.test.ts
import { BookingService } from '@/services/bookingService'
import { mockFirestore } from '@/__mocks__/firebase'

jest.mock('@/lib/firebase', () => mockFirestore)

describe('BookingService', () => {
  let bookingService: BookingService

  beforeEach(() => {
    bookingService = BookingService.getInstance()
    jest.clearAllMocks()
  })

  describe('createBooking', () => {
    it('should create a booking successfully', async () => {
      const mockRequest = {
        pickupLocation: { lat: 53.6450, lng: -1.7830, address: 'Test Pickup' },
        destinationLocation: { lat: 53.6500, lng: -1.7800, address: 'Test Destination' }
      }

      const booking = await bookingService.createBooking(mockRequest)

      expect(booking).toMatchObject({
        id: expect.any(String),
        status: 'pending',
        pickupLocation: mockRequest.pickupLocation,
        destinationLocation: mockRequest.destinationLocation,
        estimatedFare: expect.any(Number)
      })
    })

    it('should handle errors gracefully', async () => {
      const invalidRequest = {} as any

      await expect(bookingService.createBooking(invalidRequest))
        .rejects.toThrow('Failed to create booking')
    })
  })
})
```

### 2. Component Testing

```typescript
// __tests__/components/BookingForm.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BookingForm } from '@/components/forms/BookingForm'

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  })
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe('BookingForm', () => {
  it('should render form fields correctly', () => {
    render(<BookingForm />, { wrapper: createWrapper() })

    expect(screen.getByLabelText(/pickup location/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/destination/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /book ride/i })).toBeInTheDocument()
  })

  it('should validate required fields', async () => {
    render(<BookingForm />, { wrapper: createWrapper() })

    fireEvent.click(screen.getByRole('button', { name: /book ride/i }))

    await waitFor(() => {
      expect(screen.getByText(/pickup location is required/i)).toBeInTheDocument()
      expect(screen.getByText(/destination is required/i)).toBeInTheDocument()
    })
  })
})
```

### 3. E2E Testing

```typescript
// tests/e2e/booking-flow.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Booking Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('[data-testid=email]', 'test@example.com')
    await page.fill('[data-testid=password]', 'password123')
    await page.click('[data-testid=login-button]')
    await page.waitForURL('/dashboard')
  })

  test('should complete booking flow successfully', async ({ page }) => {
    // Navigate to booking
    await page.click('[data-testid=book-ride-button]')
    
    // Fill pickup location
    await page.fill('[data-testid=pickup-input]', 'Huddersfield Train Station')
    await page.waitForSelector('[data-testid=pickup-suggestion]')
    await page.click('[data-testid=pickup-suggestion]')
    
    // Fill destination
    await page.fill('[data-testid=destination-input]', 'University of Huddersfield')
    await page.waitForSelector('[data-testid=destination-suggestion]')
    await page.click('[data-testid=destination-suggestion]')
    
    // Submit booking
    await page.click('[data-testid=submit-booking]')
    
    // Verify booking creation
    await expect(page.locator('[data-testid=booking-confirmation]')).toBeVisible()
    await expect(page.locator('[data-testid=booking-id]')).toContainText(/BK-/)
  })
})
```

## Security Implementation

### 1. Input Validation

```typescript
// lib/validations.ts
import { z } from 'zod'

export const locationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  address: z.string().min(1).max(200)
})

export const bookingRequestSchema = z.object({
  pickupLocation: locationSchema,
  destinationLocation: locationSchema,
  vehicleType: z.enum(['standard', 'premium', 'xl']).optional(),
  scheduledTime: z.date().min(new Date()).optional(),
  specialRequirements: z.string().max(500).optional()
})

export const userRegistrationSchema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email(),
  password: z.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
  role: z.enum(['passenger', 'driver', 'operator']),
  phoneNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional()
})
```

### 2. API Route Protection

```typescript
// lib/auth-middleware.ts
import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'

export async function withAuth(
  handler: (req: NextRequest, user: User) => Promise<NextResponse>,
  requiredRole?: UserRole
) {
  return async (req: NextRequest) => {
    try {
      const token = req.headers.get('authorization')?.replace('Bearer ', '')
      
      if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const user = await verifyToken(token)
      
      if (requiredRole && user.role !== requiredRole) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      return handler(req, user)
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }
  }
}

// Usage in API routes
// app/api/bookings/route.ts
import { withAuth } from '@/lib/auth-middleware'

export const POST = withAuth(async (req, user) => {
  const body = await req.json()
  
  // Validate input
  const validatedData = bookingRequestSchema.parse(body)
  
  // Create booking
  const booking = await createBooking({
    ...validatedData,
    passengerId: user.id
  })
  
  return NextResponse.json(booking)
}, 'passenger')
```

## Deployment & DevOps

### 1. CI/CD Pipeline

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm run test
      - run: npm run test:e2e
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  build:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run build
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

### 2. Environment Configuration

```typescript
// lib/config.ts
import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']),
  NEXT_PUBLIC_FIREBASE_API_KEY: z.string(),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string(),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string(),
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: z.string(),
  STRIPE_SECRET_KEY: z.string(),
  STRIPE_WEBHOOK_SECRET: z.string(),
  SENTRY_DSN: z.string().optional()
})

export const env = envSchema.parse(process.env)

export const config = {
  app: {
    name: 'TaxiNow MyBase',
    version: process.env.npm_package_version || '1.0.0',
    url: env.NODE_ENV === 'production' 
      ? 'https://mybase.app' 
      : 'http://localhost:3000'
  },
  firebase: {
    apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  },
  maps: {
    apiKey: env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  },
  stripe: {
    secretKey: env.STRIPE_SECRET_KEY,
    webhookSecret: env.STRIPE_WEBHOOK_SECRET
  }
}
```

This implementation guide provides a solid foundation for rebuilding the TaxiNow/MyBase platform with modern best practices, improved architecture, and comprehensive error handling. The patterns and examples shown here should be adapted and extended based on specific requirements and constraints.