# TaxiNow/MyBase - Product Requirements Document

## Executive Summary

**Product Name:** TaxiNow (MyBase Platform)  
**Version:** 1.0  
**Document Date:** January 2025  
**Product Type:** Multi-sided Taxi Booking Platform  

TaxiNow is a comprehensive taxi booking platform that connects passengers, drivers, and taxi base operators in a seamless ecosystem. The platform emphasizes fair economics (0% commission to drivers), community focus, and advanced AI-powered features to revolutionize local transportation services.

## Product Vision & Mission

### Vision Statement
To become the leading community-focused taxi platform that empowers local drivers and operators while providing passengers with reliable, transparent, and efficient transportation services.

### Mission Statement
We connect communities through fair, transparent, and technology-enhanced transportation services that benefit all stakeholders - passengers get reliable rides, drivers keep 100% of their earnings, and operators efficiently manage their fleets.

## Business Objectives

### Primary Objectives
1. **Market Penetration:** Capture 25% of the Huddersfield taxi market within 18 months
2. **Driver Retention:** Achieve 90% driver satisfaction through commission-free model
3. **Operational Efficiency:** Reduce average pickup time to under 8 minutes
4. **Revenue Growth:** Generate sustainable revenue through operator subscriptions and premium features

### Success Metrics
- **User Acquisition:** 10,000+ registered passengers, 500+ active drivers, 50+ operator partners
- **Engagement:** 80% monthly active user rate, 4.5+ star average rating
- **Financial:** Break-even within 12 months, 30% month-over-month growth
- **Operational:** 95% ride completion rate, <2% cancellation rate

## Target Market & User Personas

### Primary Markets
- **Geographic:** Huddersfield and surrounding areas (initial launch)
- **Demographic:** Urban and suburban residents, business travelers, elderly population
- **Market Size:** 200,000+ potential passengers, 1,000+ potential drivers

### User Personas

#### Persona 1: Sarah - The Busy Professional (Passenger)
- **Age:** 28-45
- **Occupation:** Office worker, healthcare professional
- **Needs:** Reliable transportation for work commutes, airport trips
- **Pain Points:** Unreliable taxi services, hidden fees, long wait times
- **Goals:** Quick booking, transparent pricing, professional drivers

#### Persona 2: Mike - The Local Driver
- **Age:** 35-55
- **Background:** Experienced taxi driver, family breadwinner
- **Needs:** Steady income, fair compensation, flexible schedule
- **Pain Points:** High commission fees, inconsistent bookings, poor dispatch systems
- **Goals:** Maximize earnings, maintain regular customers, work-life balance

#### Persona 3: Janet - The Taxi Base Operator
- **Age:** 40-60
- **Role:** Fleet manager, business owner
- **Needs:** Efficient fleet management, driver retention, business growth
- **Pain Points:** Manual dispatch, driver turnover, operational inefficiencies
- **Goals:** Streamline operations, increase profitability, expand fleet

#### Persona 4: David - The Platform Administrator
- **Age:** 30-50
- **Role:** System administrator, business analyst
- **Needs:** System oversight, data analytics, user management
- **Pain Points:** System monitoring, user support, compliance management
- **Goals:** Platform stability, user satisfaction, business intelligence

## Core Features & Requirements

### 1. User Authentication & Management

#### 1.1 Multi-Role Registration System
**User Story:** As a new user, I want to register for the appropriate role so that I can access role-specific features.

**Acceptance Criteria:**
1. WHEN a user visits the registration page THEN the system SHALL display role selection options (Passenger, Driver, Operator, Admin)
2. WHEN a user selects "Driver" THEN the system SHALL require vehicle category and operator selection
3. WHEN a user selects "Operator" or "Admin" THEN the system SHALL set account status to "Pending Approval"
4. WHEN a user provides a phone number THEN the system SHALL send SMS verification code
5. WHEN phone verification is completed THEN the system SHALL activate the account

#### 1.2 Secure Authentication
**User Story:** As a user, I want secure login options so that my account remains protected.

**Acceptance Criteria:**
1. WHEN a user attempts login THEN the system SHALL validate email and password
2. WHEN login fails 3 times THEN the system SHALL implement temporary lockout
3. WHEN a user requests password reset THEN the system SHALL send secure reset link
4. WHEN a user logs in THEN the system SHALL create secure session with appropriate role permissions

### 2. Passenger Features

#### 2.1 Ride Booking System
**User Story:** As a passenger, I want to book rides easily so that I can get transportation when needed.

**Acceptance Criteria:**
1. WHEN a passenger opens the booking interface THEN the system SHALL display map with current location
2. WHEN a passenger sets pickup and destination THEN the system SHALL calculate fare estimate
3. WHEN a passenger selects booking preference THEN the system SHALL offer "App Chooses" or "Specific Operator" options
4. WHEN a ride is booked THEN the system SHALL match with available drivers based on preferences
5. WHEN a driver accepts THEN the system SHALL provide real-time tracking and ETA

#### 2.2 AI-Powered Taxi Search
**User Story:** As a passenger, I want AI to suggest the best taxi options so that I get optimal service.

**Acceptance Criteria:**
1. WHEN a passenger uses AI search THEN the system SHALL analyze location, time, and preferences
2. WHEN AI processes request THEN the system SHALL suggest optimal driver matches
3. WHEN suggestions are provided THEN the system SHALL include reasoning and estimated metrics
4. WHEN passenger accepts AI suggestion THEN the system SHALL proceed with booking

#### 2.3 Real-Time Ride Tracking
**User Story:** As a passenger, I want to track my ride in real-time so that I know when my driver will arrive.

**Acceptance Criteria:**
1. WHEN a ride is active THEN the system SHALL display live driver location on map
2. WHEN driver location changes THEN the system SHALL update passenger view within 5 seconds
3. WHEN driver approaches pickup THEN the system SHALL send notification to passenger
4. WHEN ride is in progress THEN the system SHALL show route and estimated arrival time

#### 2.4 In-App Communication
**User Story:** As a passenger, I want to communicate with my driver so that we can coordinate pickup and delivery.

**Acceptance Criteria:**
1. WHEN a ride is matched THEN the system SHALL enable chat between passenger and driver
2. WHEN a message is sent THEN the system SHALL deliver it within 2 seconds
3. WHEN ride is completed THEN the system SHALL archive chat history
4. WHEN emergency occurs THEN the system SHALL provide quick access to emergency contacts

### 3. Driver Features

#### 3.1 Online/Offline Status Management
**User Story:** As a driver, I want to control my availability so that I only receive rides when I'm ready to work.

**Acceptance Criteria:**
1. WHEN a driver toggles online THEN the system SHALL request location permission and update status
2. WHEN a driver goes online THEN the system SHALL add driver to available pool for ride matching
3. WHEN a driver goes offline THEN the system SHALL remove driver from available pool
4. WHEN location permission is denied THEN the system SHALL prevent online status activation

#### 3.2 Ride Offer Management
**User Story:** As a driver, I want to receive and manage ride offers so that I can choose which rides to accept.

**Acceptance Criteria:**
1. WHEN a ride request matches driver criteria THEN the system SHALL send ride offer notification
2. WHEN a ride offer is received THEN the system SHALL display pickup location, destination, and fare
3. WHEN a driver accepts offer THEN the system SHALL confirm booking and provide navigation
4. WHEN a driver rejects offer THEN the system SHALL offer ride to next available driver
5. WHEN no response within 30 seconds THEN the system SHALL auto-decline and offer to next driver

#### 3.3 Earnings Tracking
**User Story:** As a driver, I want to track my earnings so that I can monitor my income and performance.

**Acceptance Criteria:**
1. WHEN a ride is completed THEN the system SHALL record full fare amount for driver
2. WHEN viewing earnings THEN the system SHALL display daily, weekly, and monthly totals
3. WHEN earnings are calculated THEN the system SHALL show 100% fare retention (0% commission)
4. WHEN account jobs are completed THEN the system SHALL track separate balance for operator accounts

### 4. Operator Features

#### 4.1 Fleet Management Dashboard
**User Story:** As an operator, I want a comprehensive dashboard so that I can monitor and manage my fleet effectively.

**Acceptance Criteria:**
1. WHEN an operator accesses dashboard THEN the system SHALL display active rides, available drivers, and fleet statistics
2. WHEN viewing fleet map THEN the system SHALL show real-time driver locations with status indicators
3. WHEN system detects issues THEN the system SHALL display alerts and actionable items
4. WHEN dispatch mode is set THEN the system SHALL operate in automatic or manual assignment mode

#### 4.2 Driver Management
**User Story:** As an operator, I want to manage my drivers so that I can maintain service quality and fleet efficiency.

**Acceptance Criteria:**
1. WHEN new drivers apply THEN the system SHALL queue applications for operator approval
2. WHEN reviewing driver applications THEN the system SHALL display driver details, documents, and verification status
3. WHEN approving drivers THEN the system SHALL activate driver accounts and send welcome notifications
4. WHEN monitoring performance THEN the system SHALL provide driver analytics and ratings

#### 4.3 Ride Assignment Control
**User Story:** As an operator, I want to control ride assignments so that I can optimize fleet utilization.

**Acceptance Criteria:**
1. WHEN in automatic mode THEN the system SHALL assign rides based on proximity and availability algorithms
2. WHEN in manual mode THEN the system SHALL allow operator to manually assign rides to specific drivers
3. WHEN wait times exceed threshold THEN the system SHALL alert operator and suggest interventions
4. WHEN emergency situations occur THEN the system SHALL allow operator to override automatic assignments

### 5. Admin Features

#### 5.1 Platform Administration
**User Story:** As an admin, I want comprehensive platform control so that I can ensure system stability and user satisfaction.

**Acceptance Criteria:**
1. WHEN accessing admin dashboard THEN the system SHALL display system health, user metrics, and platform statistics
2. WHEN monitoring users THEN the system SHALL provide user management tools for all roles
3. WHEN reviewing operators THEN the system SHALL manage operator approvals and platform access
4. WHEN system issues occur THEN the system SHALL provide diagnostic tools and resolution capabilities

#### 5.2 Analytics & Reporting
**User Story:** As an admin, I want detailed analytics so that I can make data-driven decisions about platform improvements.

**Acceptance Criteria:**
1. WHEN generating reports THEN the system SHALL provide user engagement, financial, and operational metrics
2. WHEN analyzing trends THEN the system SHALL display historical data with visualization tools
3. WHEN identifying issues THEN the system SHALL highlight anomalies and suggest corrective actions
4. WHEN exporting data THEN the system SHALL provide multiple format options (CSV, PDF, JSON)

### 6. Cross-Platform Features

#### 6.1 Real-Time Communication System
**User Story:** As any user, I want real-time updates so that I stay informed about relevant activities.

**Acceptance Criteria:**
1. WHEN status changes occur THEN the system SHALL push notifications to relevant users within 2 seconds
2. WHEN location updates happen THEN the system SHALL synchronize across all connected devices
3. WHEN messages are sent THEN the system SHALL ensure delivery and provide read receipts
4. WHEN system maintenance occurs THEN the system SHALL notify all users in advance

#### 6.2 AI Integration
**User Story:** As a user, I want AI-enhanced features so that I get intelligent recommendations and optimizations.

**Acceptance Criteria:**
1. WHEN requesting rides THEN the AI system SHALL optimize driver-passenger matching
2. WHEN analyzing patterns THEN the AI system SHALL provide predictive insights for demand and supply
3. WHEN detecting anomalies THEN the AI system SHALL alert administrators and suggest actions
4. WHEN generating recommendations THEN the AI system SHALL explain reasoning and confidence levels

## Technical Requirements

### Performance Requirements
- **Response Time:** API responses < 200ms, UI interactions < 100ms
- **Availability:** 99.9% uptime, maximum 8.76 hours downtime per year
- **Scalability:** Support 10,000 concurrent users, 1,000 simultaneous rides
- **Data Processing:** Real-time location updates every 5 seconds

### Security Requirements
- **Authentication:** Multi-factor authentication for sensitive operations
- **Data Encryption:** End-to-end encryption for all communications
- **Privacy:** GDPR compliance, data anonymization for analytics
- **Access Control:** Role-based permissions with principle of least privilege

### Integration Requirements
- **Maps:** Google Maps API for location services and navigation
- **Payments:** Stripe integration for secure payment processing
- **SMS:** Twilio or similar for phone verification and notifications
- **Push Notifications:** Firebase Cloud Messaging for real-time alerts

### Platform Requirements
- **Web Application:** Responsive design supporting desktop and mobile browsers
- **Mobile Optimization:** Progressive Web App (PWA) capabilities
- **Database:** Firebase Firestore for real-time data synchronization
- **Hosting:** Firebase Hosting with CDN for global performance

## Business Model & Monetization

### Revenue Streams
1. **Operator Subscriptions:** Monthly/annual fees for fleet management tools
2. **Premium Features:** Advanced analytics, priority support, custom integrations
3. **Transaction Fees:** Small percentage on payment processing (not driver commission)
4. **Advertising:** Local business promotions within the app

### Cost Structure
- **Technology Infrastructure:** Cloud hosting, API costs, development tools
- **Operations:** Customer support, marketing, business development
- **Compliance:** Legal, insurance, regulatory compliance costs

## Risk Assessment & Mitigation

### Technical Risks
- **Risk:** System downtime during peak hours
- **Mitigation:** Redundant infrastructure, automated failover, comprehensive monitoring

### Business Risks
- **Risk:** Driver adoption challenges
- **Mitigation:** Competitive commission structure, comprehensive onboarding, ongoing support

### Regulatory Risks
- **Risk:** Local transportation regulations
- **Mitigation:** Legal compliance review, operator partnerships, regulatory engagement

### Competitive Risks
- **Risk:** Established competitors with market presence
- **Mitigation:** Unique value proposition (0% commission), superior user experience, community focus

## Success Criteria & KPIs

### User Acquisition Metrics
- Monthly Active Users (MAU): Target 8,000+ within 12 months
- User Retention Rate: 70% monthly retention, 40% annual retention
- Net Promoter Score (NPS): Target score of 50+

### Operational Metrics
- Average Pickup Time: <8 minutes
- Ride Completion Rate: >95%
- Driver Utilization Rate: >60%
- Customer Support Response Time: <2 hours

### Financial Metrics
- Monthly Recurring Revenue (MRR): $50,000+ within 18 months
- Customer Acquisition Cost (CAC): <$25 per user
- Lifetime Value (LTV): >$200 per active user
- Break-even Timeline: 12-15 months

## Implementation Roadmap

### Phase 1: MVP Launch (Months 1-3)
- Core booking functionality
- Basic driver and passenger apps
- Essential operator tools
- Payment integration

### Phase 2: Enhanced Features (Months 4-6)
- AI-powered matching
- Advanced analytics
- In-app communication
- Mobile optimization

### Phase 3: Scale & Optimize (Months 7-12)
- Multi-city expansion
- Advanced operator tools
- Premium features
- Performance optimization

### Phase 4: Innovation & Growth (Months 13+)
- Machine learning enhancements
- IoT integrations
- Partnership expansions
- International markets

## Conclusion

TaxiNow/MyBase represents a significant opportunity to transform the local transportation market through technology, fair economics, and community focus. The platform's unique value proposition of 0% driver commission, combined with advanced AI features and comprehensive multi-sided marketplace functionality, positions it for strong market adoption and sustainable growth.

The success of this platform depends on careful execution of the technical requirements, strong user acquisition strategies, and maintaining the delicate balance between passenger convenience, driver satisfaction, and operator efficiency.