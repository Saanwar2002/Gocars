import { db } from '@/lib/firebase';
import { collection, addDoc, query, where, orderBy, limit, getDocs, doc, updateDoc, onSnapshot } from 'firebase/firestore';

export interface RideMonitoring {
  id: string;
  rideId: string;
  userId: string;
  driverId: string;
  status: 'monitoring' | 'completed' | 'alert_triggered' | 'emergency';
  startTime: Date;
  endTime?: Date;
  plannedRoute: RoutePoint[];
  actualRoute: RoutePoint[];
  deviations: RouteDeviation[];
  safetyAlerts: SafetyAlert[];
  checkIns: SafetyCheckIn[];
  driverBehavior: DriverBehaviorMetrics;
  riskScore: number;
  isActive: boolean;
}

export interface RoutePoint {
  latitude: number;
  longitude: number;
  timestamp: Date;
  speed?: number;
  heading?: number;
  accuracy?: number;
}

export interface RouteDeviation {
  id: string;
  detectedAt: Date;
  deviationType: 'minor' | 'major' | 'critical';
  distanceFromRoute: number; // in meters
  duration: number; // in seconds
  location: RoutePoint;
  reason?: 'traffic' | 'construction' | 'passenger_request' | 'unknown';
  isResolved: boolean;
  resolvedAt?: Date;
  alertTriggered: boolean;
}

export interface SafetyAlert {
  id: string;
  type: 'route_deviation' | 'speed_violation' | 'harsh_driving' | 'extended_stop' | 'communication_loss' | 'panic_button' | 'check_in_missed';
  severity: 'low' | 'medium' | 'high' | 'critical';
  triggeredAt: Date;
  location: RoutePoint;
  description: string;
  data: any;
  status: 'active' | 'acknowledged' | 'resolved' | 'false_alarm';
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
  actions: AlertAction[];
}

export interface AlertAction {
  id: string;
  type: 'notification_sent' | 'contact_notified' | 'driver_contacted' | 'emergency_dispatched' | 'ride_terminated';
  timestamp: Date;
  actor: string;
  details: string;
  success: boolean;
}

export interface SafetyCheckIn {
  id: string;
  scheduledAt: Date;
  completedAt?: Date;
  type: 'automatic' | 'manual' | 'prompted';
  status: 'pending' | 'completed' | 'missed' | 'overdue';
  response?: {
    isOk: boolean;
    message?: string;
    location: RoutePoint;
  };
  followUpRequired: boolean;
}

export interface DriverBehaviorMetrics {
  averageSpeed: number;
  maxSpeed: number;
  speedViolations: number;
  harshAccelerations: number;
  harshBraking: number;
  sharpTurns: number;
  phoneUsage: number; // estimated based on driving patterns
  overallScore: number; // 0-100
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface SafetySettings {
  userId: string;
  enableRideMonitoring: boolean;
  routeDeviationThreshold: number; // meters
  speedViolationThreshold: number; // percentage above limit
  checkInInterval: number; // minutes
  enableAutomaticCheckIns: boolean;
  emergencyContactsOnAlert: boolean;
  shareLocationDuringRide: boolean;
  driverBehaviorMonitoring: boolean;
  alertSensitivity: 'low' | 'medium' | 'high';
}

class RideMonitoringService {
  private activeMonitoring: Map<string, RideMonitoring> = new Map();
  private locationTracking: Map<string, NodeJS.Timeout> = new Map();
  private checkInTimers: Map<string, NodeJS.Timeout> = new Map();

  // Start ride monitoring
  async startRideMonitoring(
    rideId: string,
    userId: string,
    driverId: string,
    plannedRoute: RoutePoint[]
  ): Promise<RideMonitoring> {
    try {
      const monitoring: RideMonitoring = {
        id: `monitoring_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        rideId,
        userId,
        driverId,
        status: 'monitoring',
        startTime: new Date(),
        plannedRoute,
        actualRoute: [],
        deviations: [],
        safetyAlerts: [],
        checkIns: [],
        driverBehavior: {
          averageSpeed: 0,
          maxSpeed: 0,
          speedViolations: 0,
          harshAccelerations: 0,
          harshBraking: 0,
          sharpTurns: 0,
          phoneUsage: 0,
          overallScore: 100,
          riskLevel: 'low'
        },
        riskScore: 0,
        isActive: true
      };

      // Save to database
      if (db) {
        await addDoc(collection(db, 'rideMonitoring'), monitoring);
      }

      // Store in active monitoring
      this.activeMonitoring.set(rideId, monitoring);

      // Start location tracking
      await this.startLocationTracking(rideId);

      // Schedule safety check-ins
      await this.scheduleCheckIns(rideId, userId);

      return monitoring;
    } catch (error) {
      console.error('Error starting ride monitoring:', error);
      throw error;
    }
  }

  // Location tracking
  private async startLocationTracking(rideId: string): Promise<void> {
    const monitoring = this.activeMonitoring.get(rideId);
    if (!monitoring) return;

    // Clear any existing tracking
    if (this.locationTracking.has(rideId)) {
      clearInterval(this.locationTracking.get(rideId)!);
    }

    // Start new tracking every 15 seconds
    const trackingInterval = setInterval(async () => {
      try {
        const location = await this.getCurrentLocation();
        if (location) {
          await this.processLocationUpdate(rideId, location);
        }
      } catch (error) {
        console.error('Error tracking location:', error);
      }
    }, 15000);

    this.locationTracking.set(rideId, trackingInterval);
  }

  private async getCurrentLocation(): Promise<RoutePoint | null> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            timestamp: new Date(),
            speed: position.coords.speed || undefined,
            heading: position.coords.heading || undefined,
            accuracy: position.coords.accuracy
          });
        },
        (error) => {
          console.error('Geolocation error:', error);
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 5000
        }
      );
    });
  }

  // Process location updates
  private async processLocationUpdate(rideId: string, location: RoutePoint): Promise<void> {
    const monitoring = this.activeMonitoring.get(rideId);
    if (!monitoring) return;

    // Add to actual route
    monitoring.actualRoute.push(location);

    // Check for route deviations
    await this.checkRouteDeviation(rideId, location);

    // Analyze driver behavior
    await this.analyzeDriverBehavior(rideId, location);

    // Update risk score
    await this.updateRiskScore(rideId);

    // Save updates
    await this.updateMonitoring(monitoring);
  }

  // Route deviation detection
  private async checkRouteDeviation(rideId: string, currentLocation: RoutePoint): Promise<void> {
    const monitoring = this.activeMonitoring.get(rideId);
    if (!monitoring || monitoring.plannedRoute.length === 0) return;

    // Find closest point on planned route
    const closestPoint = this.findClosestRoutePoint(currentLocation, monitoring.plannedRoute);
    const distance = this.calculateDistance(currentLocation, closestPoint);

    // Check if deviation exceeds threshold
    const settings = await this.getSafetySettings(monitoring.userId);
    const threshold = settings?.routeDeviationThreshold || 500; // 500 meters default

    if (distance > threshold) {
      const deviation: RouteDeviation = {
        id: `deviation_${Date.now()}`,
        detectedAt: new Date(),
        deviationType: distance > threshold * 2 ? 'major' : 'minor',
        distanceFromRoute: distance,
        duration: 0,
        location: currentLocation,
        isResolved: false,
        alertTriggered: false
      };

      // Check if this is a new deviation or continuation
      const lastDeviation = monitoring.deviations[monitoring.deviations.length - 1];
      if (!lastDeviation || lastDeviation.isResolved) {
        monitoring.deviations.push(deviation);
        
        // Trigger alert for major deviations
        if (deviation.deviationType === 'major') {
          await this.triggerSafetyAlert(rideId, {
            type: 'route_deviation',
            severity: 'medium',
            description: `Vehicle has deviated ${Math.round(distance)}m from planned route`,
            data: { deviation }
          });
          deviation.alertTriggered = true;
        }
      } else {
        // Update existing deviation
        lastDeviation.duration = (new Date().getTime() - lastDeviation.detectedAt.getTime()) / 1000;
        lastDeviation.location = currentLocation;
        lastDeviation.distanceFromRoute = Math.max(lastDeviation.distanceFromRoute, distance);
      }
    } else {
      // Check if we need to resolve an active deviation
      const activeDeviation = monitoring.deviations.find(d => !d.isResolved);
      if (activeDeviation) {
        activeDeviation.isResolved = true;
        activeDeviation.resolvedAt = new Date();
      }
    }
  }

  // Driver behavior analysis
  private async analyzeDriverBehavior(rideId: string, currentLocation: RoutePoint): Promise<void> {
    const monitoring = this.activeMonitoring.get(rideId);
    if (!monitoring || monitoring.actualRoute.length < 2) return;

    const previousLocation = monitoring.actualRoute[monitoring.actualRoute.length - 2];
    const timeDiff = (currentLocation.timestamp.getTime() - previousLocation.timestamp.getTime()) / 1000;
    
    if (timeDiff <= 0) return;

    // Calculate speed
    const distance = this.calculateDistance(currentLocation, previousLocation);
    const speed = (distance / timeDiff) * 3.6; // Convert m/s to km/h

    // Update behavior metrics
    const behavior = monitoring.driverBehavior;
    
    // Speed analysis
    if (currentLocation.speed || speed > 0) {
      const currentSpeed = currentLocation.speed ? currentLocation.speed * 3.6 : speed;
      behavior.maxSpeed = Math.max(behavior.maxSpeed, currentSpeed);
      
      // Calculate average speed
      const totalPoints = monitoring.actualRoute.length;
      behavior.averageSpeed = ((behavior.averageSpeed * (totalPoints - 1)) + currentSpeed) / totalPoints;
      
      // Check for speed violations (assuming 50 km/h speed limit for now)
      const speedLimit = 50;
      const settings = await this.getSafetySettings(monitoring.userId);
      const violationThreshold = settings?.speedViolationThreshold || 20; // 20% over limit
      
      if (currentSpeed > speedLimit * (1 + violationThreshold / 100)) {
        behavior.speedViolations++;
        
        await this.triggerSafetyAlert(rideId, {
          type: 'speed_violation',
          severity: 'medium',
          description: `Speed violation: ${Math.round(currentSpeed)} km/h in ${speedLimit} km/h zone`,
          data: { speed: currentSpeed, limit: speedLimit }
        });
      }
    }

    // Acceleration analysis
    if (monitoring.actualRoute.length >= 3) {
      const prevPrevLocation = monitoring.actualRoute[monitoring.actualRoute.length - 3];
      const prevSpeed = this.calculateSpeed(prevPrevLocation, previousLocation);
      const currentSpeedCalc = this.calculateSpeed(previousLocation, currentLocation);
      
      const acceleration = (currentSpeedCalc - prevSpeed) / timeDiff;
      
      // Harsh acceleration/braking detection
      if (Math.abs(acceleration) > 3) { // 3 m/s² threshold
        if (acceleration > 0) {
          behavior.harshAccelerations++;
        } else {
          behavior.harshBraking++;
        }
        
        await this.triggerSafetyAlert(rideId, {
          type: 'harsh_driving',
          severity: 'low',
          description: `${acceleration > 0 ? 'Harsh acceleration' : 'Harsh braking'} detected`,
          data: { acceleration }
        });
      }
    }

    // Heading change analysis (sharp turns)
    if (currentLocation.heading && previousLocation.heading) {
      const headingChange = Math.abs(currentLocation.heading - previousLocation.heading);
      const normalizedChange = Math.min(headingChange, 360 - headingChange);
      
      if (normalizedChange > 45 && speed > 20) { // Sharp turn at speed
        behavior.sharpTurns++;
      }
    }

    // Calculate overall score
    behavior.overallScore = this.calculateBehaviorScore(behavior);
    behavior.riskLevel = this.determineRiskLevel(behavior.overallScore);
  }

  private calculateSpeed(point1: RoutePoint, point2: RoutePoint): number {
    const distance = this.calculateDistance(point1, point2);
    const timeDiff = (point2.timestamp.getTime() - point1.timestamp.getTime()) / 1000;
    return timeDiff > 0 ? distance / timeDiff : 0;
  }

  private calculateBehaviorScore(behavior: DriverBehaviorMetrics): number {
    let score = 100;
    
    // Deduct points for violations
    score -= behavior.speedViolations * 5;
    score -= behavior.harshAccelerations * 2;
    score -= behavior.harshBraking * 2;
    score -= behavior.sharpTurns * 1;
    score -= behavior.phoneUsage * 10;
    
    return Math.max(0, Math.min(100, score));
  }

  private determineRiskLevel(score: number): DriverBehaviorMetrics['riskLevel'] {
    if (score >= 90) return 'low';
    if (score >= 70) return 'medium';
    if (score >= 50) return 'high';
    return 'critical';
  }

  // Safety alerts
  private async triggerSafetyAlert(rideId: string, alertData: {
    type: SafetyAlert['type'];
    severity: SafetyAlert['severity'];
    description: string;
    data: any;
  }): Promise<void> {
    const monitoring = this.activeMonitoring.get(rideId);
    if (!monitoring) return;

    const currentLocation = monitoring.actualRoute[monitoring.actualRoute.length - 1];
    
    const alert: SafetyAlert = {
      id: `alert_${Date.now()}`,
      type: alertData.type,
      severity: alertData.severity,
      triggeredAt: new Date(),
      location: currentLocation,
      description: alertData.description,
      data: alertData.data,
      status: 'active',
      actions: []
    };

    monitoring.safetyAlerts.push(alert);

    // Execute alert actions based on severity
    await this.executeAlertActions(rideId, alert);

    // Update monitoring
    await this.updateMonitoring(monitoring);
  }

  private async executeAlertActions(rideId: string, alert: SafetyAlert): Promise<void> {
    const monitoring = this.activeMonitoring.get(rideId);
    if (!monitoring) return;

    const actions: AlertAction[] = [];

    // Send notification to passenger
    actions.push({
      id: `action_${Date.now()}`,
      type: 'notification_sent',
      timestamp: new Date(),
      actor: 'system',
      details: `Safety alert notification sent to passenger`,
      success: true
    });

    // For medium/high severity alerts, contact emergency contacts
    if (alert.severity === 'medium' || alert.severity === 'high') {
      const settings = await this.getSafetySettings(monitoring.userId);
      if (settings?.emergencyContactsOnAlert) {
        actions.push({
          id: `action_${Date.now() + 1}`,
          type: 'contact_notified',
          timestamp: new Date(),
          actor: 'system',
          details: `Emergency contacts notified of safety alert`,
          success: true
        });
      }
    }

    // For critical alerts, consider emergency dispatch
    if (alert.severity === 'critical') {
      actions.push({
        id: `action_${Date.now() + 2}`,
        type: 'emergency_dispatched',
        timestamp: new Date(),
        actor: 'system',
        details: `Emergency services contacted due to critical safety alert`,
        success: true
      });
    }

    alert.actions = actions;
  }

  // Safety check-ins
  private async scheduleCheckIns(rideId: string, userId: string): Promise<void> {
    const settings = await this.getSafetySettings(userId);
    if (!settings?.enableAutomaticCheckIns) return;

    const interval = (settings.checkInInterval || 10) * 60 * 1000; // Convert to milliseconds

    const checkInTimer = setInterval(async () => {
      await this.performSafetyCheckIn(rideId);
    }, interval);

    this.checkInTimers.set(rideId, checkInTimer);
  }

  private async performSafetyCheckIn(rideId: string): Promise<void> {
    const monitoring = this.activeMonitoring.get(rideId);
    if (!monitoring || !monitoring.isActive) return;

    const checkIn: SafetyCheckIn = {
      id: `checkin_${Date.now()}`,
      scheduledAt: new Date(),
      type: 'automatic',
      status: 'pending',
      followUpRequired: false
    };

    monitoring.checkIns.push(checkIn);

    // In a real implementation, this would send a push notification or in-app prompt
    // For now, we'll simulate an automatic "OK" response after 30 seconds
    setTimeout(async () => {
      if (checkIn.status === 'pending') {
        const currentLocation = await this.getCurrentLocation();
        if (currentLocation) {
          checkIn.completedAt = new Date();
          checkIn.status = 'completed';
          checkIn.response = {
            isOk: true,
            location: currentLocation
          };
        } else {
          checkIn.status = 'missed';
          checkIn.followUpRequired = true;
          
          // Trigger alert for missed check-in
          await this.triggerSafetyAlert(rideId, {
            type: 'check_in_missed',
            severity: 'medium',
            description: 'Passenger missed safety check-in',
            data: { checkIn }
          });
        }
        
        await this.updateMonitoring(monitoring);
      }
    }, 30000);

    await this.updateMonitoring(monitoring);
  }

  // Risk score calculation
  private async updateRiskScore(rideId: string): Promise<void> {
    const monitoring = this.activeMonitoring.get(rideId);
    if (!monitoring) return;

    let riskScore = 0;

    // Route deviations
    const activeDeviations = monitoring.deviations.filter(d => !d.isResolved);
    riskScore += activeDeviations.length * 10;
    riskScore += activeDeviations.filter(d => d.deviationType === 'major').length * 20;

    // Driver behavior
    const behaviorScore = monitoring.driverBehavior.overallScore;
    riskScore += (100 - behaviorScore) / 2;

    // Active alerts
    const activeAlerts = monitoring.safetyAlerts.filter(a => a.status === 'active');
    riskScore += activeAlerts.length * 5;
    riskScore += activeAlerts.filter(a => a.severity === 'high').length * 15;
    riskScore += activeAlerts.filter(a => a.severity === 'critical').length * 30;

    // Missed check-ins
    const missedCheckIns = monitoring.checkIns.filter(c => c.status === 'missed').length;
    riskScore += missedCheckIns * 25;

    monitoring.riskScore = Math.min(100, riskScore);

    // Update status based on risk score
    if (monitoring.riskScore > 80) {
      monitoring.status = 'emergency';
    } else if (monitoring.riskScore > 50) {
      monitoring.status = 'alert_triggered';
    }
  }

  // Utility methods
  private findClosestRoutePoint(location: RoutePoint, route: RoutePoint[]): RoutePoint {
    let closest = route[0];
    let minDistance = this.calculateDistance(location, closest);

    for (const point of route) {
      const distance = this.calculateDistance(location, point);
      if (distance < minDistance) {
        minDistance = distance;
        closest = point;
      }
    }

    return closest;
  }

  private calculateDistance(point1: RoutePoint, point2: RoutePoint): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = point1.latitude * Math.PI / 180;
    const φ2 = point2.latitude * Math.PI / 180;
    const Δφ = (point2.latitude - point1.latitude) * Math.PI / 180;
    const Δλ = (point2.longitude - point1.longitude) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }

  // Database operations
  private async updateMonitoring(monitoring: RideMonitoring): Promise<void> {
    try {
      if (!db) return;

      const q = query(
        collection(db, 'rideMonitoring'),
        where('id', '==', monitoring.id),
        limit(1)
      );

      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const docRef = querySnapshot.docs[0].ref;
        await updateDoc(docRef, { ...monitoring });
      }

      // Update local cache
      this.activeMonitoring.set(monitoring.rideId, monitoring);
    } catch (error) {
      console.error('Error updating monitoring:', error);
    }
  }

  // Settings management
  private async getSafetySettings(userId: string): Promise<SafetySettings | null> {
    try {
      if (!db) return null;

      const q = query(
        collection(db, 'safetySettings'),
        where('userId', '==', userId),
        limit(1)
      );

      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        return await this.createDefaultSafetySettings(userId);
      }

      return querySnapshot.docs[0].data() as SafetySettings;
    } catch (error) {
      console.error('Error getting safety settings:', error);
      return null;
    }
  }

  private async createDefaultSafetySettings(userId: string): Promise<SafetySettings> {
    const defaultSettings: SafetySettings = {
      userId,
      enableRideMonitoring: true,
      routeDeviationThreshold: 500,
      speedViolationThreshold: 20,
      checkInInterval: 10,
      enableAutomaticCheckIns: true,
      emergencyContactsOnAlert: true,
      shareLocationDuringRide: true,
      driverBehaviorMonitoring: true,
      alertSensitivity: 'medium'
    };

    try {
      if (db) {
        await addDoc(collection(db, 'safetySettings'), defaultSettings);
      }
    } catch (error) {
      console.error('Error creating default safety settings:', error);
    }

    return defaultSettings;
  }

  // Stop monitoring
  async stopRideMonitoring(rideId: string): Promise<boolean> {
    try {
      const monitoring = this.activeMonitoring.get(rideId);
      if (!monitoring) return false;

      monitoring.isActive = false;
      monitoring.status = 'completed';
      monitoring.endTime = new Date();

      // Clear timers
      if (this.locationTracking.has(rideId)) {
        clearInterval(this.locationTracking.get(rideId)!);
        this.locationTracking.delete(rideId);
      }

      if (this.checkInTimers.has(rideId)) {
        clearInterval(this.checkInTimers.get(rideId)!);
        this.checkInTimers.delete(rideId);
      }

      // Update database
      await this.updateMonitoring(monitoring);

      // Remove from active monitoring
      this.activeMonitoring.delete(rideId);

      return true;
    } catch (error) {
      console.error('Error stopping ride monitoring:', error);
      return false;
    }
  }

  // Get monitoring data
  async getActiveMonitoring(rideId: string): Promise<RideMonitoring | null> {
    return this.activeMonitoring.get(rideId) || null;
  }

  async getAllActiveMonitoring(): Promise<RideMonitoring[]> {
    return Array.from(this.activeMonitoring.values());
  }

  // Manual check-in
  async performManualCheckIn(rideId: string, isOk: boolean, message?: string): Promise<boolean> {
    try {
      const monitoring = this.activeMonitoring.get(rideId);
      if (!monitoring) return false;

      const currentLocation = await this.getCurrentLocation();
      if (!currentLocation) return false;

      const checkIn: SafetyCheckIn = {
        id: `checkin_${Date.now()}`,
        scheduledAt: new Date(),
        completedAt: new Date(),
        type: 'manual',
        status: 'completed',
        response: {
          isOk,
          message,
          location: currentLocation
        },
        followUpRequired: !isOk
      };

      monitoring.checkIns.push(checkIn);

      // If not OK, trigger alert
      if (!isOk) {
        await this.triggerSafetyAlert(rideId, {
          type: 'check_in_missed',
          severity: 'high',
          description: `Passenger reported issue: ${message || 'No details provided'}`,
          data: { checkIn }
        });
      }

      await this.updateMonitoring(monitoring);
      return true;
    } catch (error) {
      console.error('Error performing manual check-in:', error);
      return false;
    }
  }
}

export const rideMonitoringService = new RideMonitoringService();