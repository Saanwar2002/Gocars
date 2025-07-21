# GoCars - Modern Taxi Booking Platform

This is a Next.js application for **GoCars** - a modern, feature-rich taxi booking platform.

**GoCars** is a comprehensive taxi booking platform connecting passengers, drivers, and taxi base operators with enhanced features, modern UI, and AI-powered intelligence.

## Getting Started

To explore the application, begin by looking at the main page component located at `src/app/page.tsx`.

## Key Features

### Core Features
- Multi-role User Authentication (Passengers, Drivers, Operators, Admins)
- Real-time Ride Booking & Tracking
- AI-Powered Taxi Search & Matching
- In-App Chat & Communication
- Comprehensive Ride History

### Enhanced Features
- Multi-stop and Recurring Bookings
- Group Bookings with Cost Splitting
- Advanced Safety Features (SOS, Route Monitoring)
- Fleet Management & Analytics
- Business Intelligence Dashboard
- Progressive Web App (PWA) Support
- Real-time WebSocket Communication

## Tech Stack
- **Frontend:** Next.js 14 (App Router), React 18, TypeScript
- **Styling:** Tailwind CSS, ShadCN UI Components, Framer Motion
- **Backend:** Firebase (Authentication, Firestore, Functions, Hosting)
- **AI/ML:** Genkit for AI features, Machine Learning algorithms
- **Real-time:** WebSocket integration, Firebase real-time updates
- **Maps:** Google Maps API, Location services
- **PWA:** Service Workers, Offline functionality
- **Testing:** Jest, React Testing Library, Playwright

## Project Structure

```
src/
├── app/                 # Next.js App Router pages
├── components/          # Reusable UI components
├── contexts/           # React contexts (Auth, etc.)
├── hooks/              # Custom React hooks
├── lib/                # Utility functions and configurations
└── types/              # TypeScript type definitions
```

## Development Phases

The GoCars enhancement is organized into 10 phases:

1. **Brand Identity & UI Foundation** (Weeks 1-6)
2. **Real-time Features & Communication** (Weeks 7-9)
3. **Advanced Booking Features** (Weeks 10-12)
4. **AI & Machine Learning Integration** (Weeks 13-15)
5. **Safety & Security Enhancements** (Weeks 16-18)
6. **Fleet Management & Operations** (Weeks 19-21)
7. **Business Intelligence & Analytics** (Weeks 22-24)
8. **Progressive Web App Optimization** (Weeks 25-27)
9. **Performance & Testing** (Weeks 28-30)

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Copy `.env.local.example` to `.env.local` and configure Firebase settings.

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking

## Contributing

Please refer to the GoCars enhancement specifications in `.kiro/specs/gocars-enhancement/` for detailed requirements, design, and implementation tasks.
