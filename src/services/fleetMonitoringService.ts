/**
 * Fleet Monitoring Service
 * Comprehensive fleet monitoring system with real-time vehicle tracking,
 * driver performance analytics, fleet utilization optimization, and predictive maintenance
 */

export interface Vehicle {
  id: string;
  licensePlate: string;
  make: string;
  model: string;
  year: number;
  vin: string;
  color: string;
  type: 'sedan' | 'suv' | 'van' | 'luxury' | 'electric' | 'hybrid';
  capacity: number;
  status: 'active' | 'inactive' | 'maintenance' | 'out_of_service';
  location: {
    lat: number;
    lng: number;
    address: string;
    timestamp: Date;
  };
  currentDriverId?: string;
  batteryLevel?: number; // For electric vehicles
  fuelLevel?: number; // For gas vehicles
  mileage: number;
  lastServiceDate: Date;
  nextServiceDue: Date;
  insuranceExpiry: Date;
  registrationExpiry: Date;
  features: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface VehicleStatus {
  vehicleId: string;
  status: 'available' | 'in_ride' | 'offline' | 'maintenance' | 'charging';
  location: {
    lat: number;
    lng: number;
    heading: number;
    speed: number;
    accuracy: number;
  };
  driverId?: string;
  currentRideId?: string;
  batteryLevel?: number;
  fuelLevel?: number;
  engineStatus: 'on' | 'off' | 'idle';
  lastUpdate: Date;
  diagnostics: VehicleDiagnostics;
}

export interface VehicleDiagnostics {
  engineHealth: 'good' | 'warning' | 'critical';
  brakeHealth: 'good' | 'warning' | 'critical';
  tireHealth: 'good' | 'warning' | 'critical';
  batteryHealth: 'good' | 'warning' | 'critical';
  transmissionHealth: 'good' | 'warning' | 'critical';
  alerts: DiagnosticAlert[];
  lastDiagnosticCheck: Date;
}

export interface DiagnosticAlert {
  id: string;
  type: 'engine' | 'brake' | 'tire' | 'battery' | 'transmission' | 'general';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  code?: string;
  detectedAt: Date;
  resolved: boolean;
  resolvedAt?: Date;
}

export interface DriverPerformance {
  driverId: string;
  period: {
    start: Date;
    end: Date;
  };
  metrics: {
    totalRides: number;
    totalDistance: number;
    totalEarnings: number;
    averageRating: number;
    completionRate: number;
    cancellationRate: number;
    responseTime: number; // Average time to accept rides
    onTimePerformance: number; // Percentage of on-time arrivals
    fuelEfficiency: number;
    safetyScore: number;
    customerSatisfaction: number;
  };
  trends: {
    ridesPerDay: number[];
    earningsPerDay: number[];
    ratingTrend: number[];
    efficiencyTrend: number[];
  };
  violations: PerformanceViolation[];
  achievements: PerformanceAchievement[];
  recommendations: string[];
}

export interface PerformanceViolation {
  id: string;
  type: 'speeding' | 'harsh_braking' | 'harsh_acceleration' | 'idle_time' | 'route_deviation';
  severity: 'minor' | 'moderate' | 'severe';
  description: string;
  timestamp: Date;
  location: { lat: number; lng: number };
  resolved: boolean;
  penalty?: number;
}

export interface PerformanceAchievement {
  id: string;
  type: 'safety' | 'efficiency' | 'customer_service' | 'reliability';
  title: string;
  description: string;
  earnedAt: Date;
  reward?: number;
}

export interface FleetUtilization {
  totalVehicles: number;
  activeVehicles: number;
  utilizationRate: number; // Percentage of time vehicles are in use
  averageIdleTime: number; // Minutes per day
  peakHours: Array<{ hour: number; utilization: number }>;
  lowUtilizationVehicles: string[];
  recommendations: UtilizationRecommendation[];
}

export interface UtilizationRecommendation {
  type: 'reposition' | 'maintenance' | 'retire' | 'add_vehicle';
  vehicleId?: string;
  location?: { lat: number; lng: number };
  reason: string;
  expectedImprovement: number;
  priority: 'low' | 'medium' | 'high';
}

export interface MaintenanceSchedule {
  vehicleId: string;
  type: 'routine' | 'preventive' | 'corrective' | 'emergency';
  description: string;
  scheduledDate: Date;
  estimatedDuration: number; // hours
  estimatedCost: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  assignedTechnician?: string;
  parts: MaintenancePart[];
  notes?: string;
}

export interface MaintenancePart {
  partNumber: string;
  description: string;
  quantity: number;
  cost: number;
  supplier: string;
  availability: 'in_stock' | 'order_required' | 'backordered';
}

export interface FleetAlert {
  id: string;
  type: 'vehicle_breakdown' | 'maintenance_due' | 'low_fuel' | 'battery_low' | 'driver_violation' | 'utilization_low';
  severity: 'info' | 'warning' | 'critical' | 'emergency';
  vehicleId?: string;
  driverId?: string;
  title: string;
  message: string;
  timestamp: Date;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolved: boolean;
  resolvedAt?: Date;
  actions: AlertAction[];
}

export interface AlertAction {
  id: string;
  type: 'dispatch_technician' | 'notify_driver' | 'reassign_rides' | 'schedule_maintenance';
  description: string;
  automated: boolean;
  executedAt?: Date;
  result?: string;
}

class FleetMonitoringService {
  private vehicles = new Map<string, Vehicle>();
  private vehicleStatuses = new Map<string, VehicleStatus>();
  private driverPerformances = new Map<string, DriverPerformance>();
  private maintenanceSchedules = new Map<string, MaintenanceSchedule[]>();
  private fleetAlerts: FleetAlert[] = [];
  private monitoringInterval: NodeJS.Timeout | null = null;

  /**
   * Initialize fleet monitoring service
   */
  async initialize(): Promise<void> {
    try {
      // Load fleet data
      await this.loadFleetData();
      
      // Start real-time monitoring
      this.startRealTimeMonitoring();
      
      // Initialize predictive maintenance
      this.initializePredictiveMaintenance();
      
      console.log('Fleet monitoring service initialized successfully');
    } catch (error) {
      console.error('Error initializing fleet monitoring service:', error);
    }
  }

  /**
   * Add vehicle to fleet
   */
  async addVehicle(vehicleData: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>): Promise<Vehicle> {
    try {
      const vehicle: Vehicle = {
        ...vehicleData,
        id: `vehicle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.vehicles.set(vehicle.id, vehicle);
      
      // Initialize vehicle status
      const status: VehicleStatus = {
        vehicleId: vehicle.id,
        status: 'available',
        location: {
          lat: vehicle.location.lat,
          lng: vehicle.location.lng,
          heading: 0,
          speed: 0,
          accuracy: 10
        },
        engineStatus: 'off',
        lastUpdate: new Date(),
        diagnostics: {
          engineHealth: 'good',
          brakeHealth: 'good',
          tireHealth: 'good',
          batteryHealth: 'good',
          transmissionHealth: 'good',
          alerts: [],
          lastDiagnosticCheck: new Date()
        }
      };

      this.vehicleStatuses.set(vehicle.id, status);

      // Persist to storage
      await this.saveFleetData();

      console.log(`Vehicle added to fleet: ${vehicle.licensePlate}`);
      return vehicle;
    } catch (error) {
      console.error('Error adding vehicle:', error);
      throw error;
    }
  }

  /**
   * Update vehicle status
   */
  async updateVehicleStatus(vehicleId: string, statusUpdate: Partial<VehicleStatus>): Promise<void> {
    try {
      const currentStatus = this.vehicleStatuses.get(vehicleId);
      if (!currentStatus) {
        throw new Error('Vehicle not found');
      }

      const updatedStatus: VehicleStatus = {
        ...currentStatus,
        ...statusUpdate,
        lastUpdate: new Date()
      };

      this.vehicleStatuses.set(vehicleId, updatedStatus);

      // Check for alerts
      await this.checkVehicleAlerts(vehicleId, updatedStatus);

      console.log(`Vehicle status updated: ${vehicleId}`);
    } catch (error) {
      console.error('Error updating vehicle status:', error);
      throw error;
    }
  }

  /**
   * Get real-time fleet overview
   */
  async getFleetOverview(): Promise<{
    totalVehicles: number;
    activeVehicles: number;
    availableVehicles: number;
    inRideVehicles: number;
    maintenanceVehicles: number;
    offlineVehicles: number;
    averageUtilization: number;
    totalAlerts: number;
    criticalAlerts: number;
  }> {
    try {
      const statuses = Array.from(this.vehicleStatuses.values());
      
      const overview = {
        totalVehicles: this.vehicles.size,
        activeVehicles: statuses.filter(s => s.status !== 'offline').length,
        availableVehicles: statuses.filter(s => s.status === 'available').length,
        inRideVehicles: statuses.filter(s => s.status === 'in_ride').length,
        maintenanceVehicles: statuses.filter(s => s.status === 'maintenance').length,
        offlineVehicles: statuses.filter(s => s.status === 'offline').length,
        averageUtilization: await this.calculateAverageUtilization(),
        totalAlerts: this.fleetAlerts.filter(a => !a.resolved).length,
        criticalAlerts: this.fleetAlerts.filter(a => !a.resolved && a.severity === 'critical').length
      };

      return overview;
    } catch (error) {
      console.error('Error getting fleet overview:', error);
      throw error;
    }
  }

  /**
   * Get vehicle tracking data
   */
  async getVehicleTracking(vehicleId?: string): Promise<VehicleStatus[]> {
    try {
      if (vehicleId) {
        const status = this.vehicleStatuses.get(vehicleId);
        return status ? [status] : [];
      }

      return Array.from(this.vehicleStatuses.values());
    } catch (error) {
      console.error('Error getting vehicle tracking:', error);
      return [];
    }
  }

  /**
   * Calculate driver performance
   */
  async calculateDriverPerformance(
    driverId: string,
    startDate: Date,
    endDate: Date
  ): Promise<DriverPerformance> {
    try {
      // In production, this would query actual ride and performance data
      // This is mock data for demonstration
      const performance: DriverPerformance = {
        driverId,
        period: { start: startDate, end: endDate },
        metrics: {
          totalRides: 45,
          totalDistance: 1250.5,
          totalEarnings: 1875.25,
          averageRating: 4.7,
          completionRate: 0.96,
          cancellationRate: 0.04,
          responseTime: 45, // seconds
          onTimePerformance: 0.92,
          fuelEfficiency: 28.5, // mpg
          safetyScore: 85,
          customerSatisfaction: 4.6
        },
        trends: {
          ridesPerDay: [8, 12, 10, 15, 9, 11, 13],
          earningsPerDay: [320, 480, 400, 600, 360, 440, 520],
          ratingTrend: [4.5, 4.6, 4.7, 4.8, 4.6, 4.7, 4.7],
          efficiencyTrend: [27.2, 28.1, 28.5, 29.0, 28.3, 28.7, 28.9]
        },
        violations: [],
        achievements: [
          {
            id: 'safety_week',
            type: 'safety',
            title: 'Safety Champion',
            description: 'No safety violations for 7 consecutive days',
            earnedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            reward: 50
          }
        ],
        recommendations: [
          'Continue maintaining excellent safety record',
          'Consider working during peak hours to increase earnings'
        ]
      };

      this.driverPerformances.set(driverId, performance);
      return performance;
    } catch (error) {
      console.error('Error calculating driver performance:', error);
      throw error;
    }
  }

  /**
   * Analyze fleet utilization
   */
  async analyzeFleetUtilization(): Promise<FleetUtilization> {
    try {
      const totalVehicles = this.vehicles.size;
      const activeVehicles = Array.from(this.vehicleStatuses.values())
        .filter(s => s.status !== 'offline').length;

      // Mock utilization data - in production, calculate from actual usage
      const utilization: FleetUtilization = {
        totalVehicles,
        activeVehicles,
        utilizationRate: 0.72, // 72% utilization
        averageIdleTime: 180, // 3 hours per day
        peakHours: [
          { hour: 7, utilization: 0.85 },
          { hour: 8, utilization: 0.92 },
          { hour: 17, utilization: 0.88 },
          { hour: 18, utilization: 0.95 },
          { hour: 19, utilization: 0.82 }
        ],
        lowUtilizationVehicles: Array.from(this.vehicles.keys()).slice(0, 3),
        recommendations: [
          {
            type: 'reposition',
            vehicleId: Array.from(this.vehicles.keys())[0],
            location: { lat: 40.7589, lng: -73.9851 },
            reason: 'High demand area with low vehicle availability',
            expectedImprovement: 0.15,
            priority: 'high'
          },
          {
            type: 'maintenance',
            vehicleId: Array.from(this.vehicles.keys())[1],
            reason: 'Vehicle showing low utilization due to performance issues',
            expectedImprovement: 0.08,
            priority: 'medium'
          }
        ]
      };

      return utilization;
    } catch (error) {
      console.error('Error analyzing fleet utilization:', error);
      throw error;
    }
  }

  /**
   * Schedule predictive maintenance
   */
  async schedulePredictiveMaintenance(vehicleId: string): Promise<MaintenanceSchedule[]> {
    try {
      const vehicle = this.vehicles.get(vehicleId);
      if (!vehicle) {
        throw new Error('Vehicle not found');
      }

      const status = this.vehicleStatuses.get(vehicleId);
      const schedules: MaintenanceSchedule[] = [];

      // Analyze vehicle condition and schedule maintenance
      if (vehicle.mileage > 50000 && vehicle.mileage % 5000 < 100) {
        schedules.push({
          vehicleId,
          type: 'routine',
          description: 'Regular service - oil change, filter replacement, inspection',
          scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week
          estimatedDuration: 2,
          estimatedCost: 150,
          priority: 'medium',
          status: 'scheduled',
          parts: [
            {
              partNumber: 'OIL-001',
              description: 'Engine Oil (5W-30)',
              quantity: 5,
              cost: 25,
              supplier: 'AutoParts Inc',
              availability: 'in_stock'
            },
            {
              partNumber: 'FILTER-001',
              description: 'Oil Filter',
              quantity: 1,
              cost: 15,
              supplier: 'AutoParts Inc',
              availability: 'in_stock'
            }
          ]
        });
      }

      // Check diagnostics for predictive maintenance
      if (status?.diagnostics.brakeHealth === 'warning') {
        schedules.push({
          vehicleId,
          type: 'preventive',
          description: 'Brake system inspection and potential replacement',
          scheduledDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
          estimatedDuration: 4,
          estimatedCost: 350,
          priority: 'high',
          status: 'scheduled',
          parts: [
            {
              partNumber: 'BRAKE-001',
              description: 'Brake Pads (Front)',
              quantity: 1,
              cost: 80,
              supplier: 'BrakePro',
              availability: 'in_stock'
            },
            {
              partNumber: 'BRAKE-002',
              description: 'Brake Rotors (Front)',
              quantity: 2,
              cost: 120,
              supplier: 'BrakePro',
              availability: 'order_required'
            }
          ]
        });
      }

      // Store schedules
      this.maintenanceSchedules.set(vehicleId, schedules);

      console.log(`Scheduled ${schedules.length} maintenance items for vehicle ${vehicleId}`);
      return schedules;
    } catch (error) {
      console.error('Error scheduling predictive maintenance:', error);
      throw error;
    }
  }

  /**
   * Get fleet alerts
   */
  async getFleetAlerts(severity?: FleetAlert['severity']): Promise<FleetAlert[]> {
    try {
      let alerts = this.fleetAlerts.filter(a => !a.resolved);
      
      if (severity) {
        alerts = alerts.filter(a => a.severity === severity);
      }

      return alerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    } catch (error) {
      console.error('Error getting fleet alerts:', error);
      return [];
    }
  }

  /**
   * Acknowledge fleet alert
   */
  async acknowledgeAlert(alertId: string, acknowledgedBy: string): Promise<void> {
    try {
      const alert = this.fleetAlerts.find(a => a.id === alertId);
      if (!alert) {
        throw new Error('Alert not found');
      }

      alert.acknowledged = true;
      alert.acknowledgedBy = acknowledgedBy;
      alert.acknowledgedAt = new Date();

      console.log(`Alert acknowledged: ${alertId} by ${acknowledgedBy}`);
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      throw error;
    }
  }

  /**
   * Resolve fleet alert
   */
  async resolveAlert(alertId: string, resolution: string): Promise<void> {
    try {
      const alert = this.fleetAlerts.find(a => a.id === alertId);
      if (!alert) {
        throw new Error('Alert not found');
      }

      alert.resolved = true;
      alert.resolvedAt = new Date();

      // Add resolution action
      alert.actions.push({
        id: `action_${Date.now()}`,
        type: 'dispatch_technician',
        description: resolution,
        automated: false,
        executedAt: new Date(),
        result: 'resolved'
      });

      console.log(`Alert resolved: ${alertId}`);
    } catch (error) {
      console.error('Error resolving alert:', error);
      throw error;
    }
  }

  // Private helper methods

  private async loadFleetData(): Promise<void> {
    try {
      // Load vehicles
      const vehiclesData = localStorage.getItem('fleet_vehicles');
      if (vehiclesData) {
        const vehicles = JSON.parse(vehiclesData);
        vehicles.forEach((vehicle: Vehicle) => {
          this.vehicles.set(vehicle.id, vehicle);
        });
      }

      // Load vehicle statuses
      const statusesData = localStorage.getItem('vehicle_statuses');
      if (statusesData) {
        const statuses = JSON.parse(statusesData);
        statuses.forEach((status: VehicleStatus) => {
          this.vehicleStatuses.set(status.vehicleId, status);
        });
      }

      // Initialize with mock data if empty
      if (this.vehicles.size === 0) {
        await this.initializeMockFleet();
      }
    } catch (error) {
      console.error('Error loading fleet data:', error);
    }
  }

  private async saveFleetData(): Promise<void> {
    try {
      localStorage.setItem('fleet_vehicles', JSON.stringify(Array.from(this.vehicles.values())));
      localStorage.setItem('vehicle_statuses', JSON.stringify(Array.from(this.vehicleStatuses.values())));
    } catch (error) {
      console.error('Error saving fleet data:', error);
    }
  }

  private async initializeMockFleet(): Promise<void> {
    const mockVehicles = [
      {
        licensePlate: 'GC001',
        make: 'Toyota',
        model: 'Camry',
        year: 2022,
        vin: '1HGBH41JXMN109186',
        color: 'White',
        type: 'sedan' as const,
        capacity: 4,
        status: 'active' as const,
        location: {
          lat: 40.7589,
          lng: -73.9851,
          address: 'Times Square, New York, NY',
          timestamp: new Date()
        },
        mileage: 25000,
        lastServiceDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        nextServiceDue: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        insuranceExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        registrationExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        features: ['GPS', 'Bluetooth', 'AC', 'USB Charging']
      },
      {
        licensePlate: 'GC002',
        make: 'Honda',
        model: 'Accord',
        year: 2023,
        vin: '1HGCV1F30JA123456',
        color: 'Black',
        type: 'sedan' as const,
        capacity: 4,
        status: 'active' as const,
        location: {
          lat: 40.7505,
          lng: -73.9934,
          address: 'Penn Station, New York, NY',
          timestamp: new Date()
        },
        mileage: 15000,
        lastServiceDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        nextServiceDue: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
        insuranceExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        registrationExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        features: ['GPS', 'Bluetooth', 'AC', 'USB Charging', 'Heated Seats']
      }
    ];

    for (const vehicleData of mockVehicles) {
      await this.addVehicle(vehicleData);
    }
  }

  private startRealTimeMonitoring(): void {
    this.monitoringInterval = setInterval(async () => {
      // Simulate real-time updates
      for (const [vehicleId, status] of this.vehicleStatuses) {
        // Simulate location updates
        if (status.status === 'in_ride') {
          status.location.lat += (Math.random() - 0.5) * 0.001;
          status.location.lng += (Math.random() - 0.5) * 0.001;
          status.location.speed = Math.random() * 60; // 0-60 mph
          status.lastUpdate = new Date();
        }

        // Simulate battery/fuel level changes
        if (status.batteryLevel !== undefined) {
          status.batteryLevel = Math.max(0, status.batteryLevel - Math.random() * 2);
        }
        if (status.fuelLevel !== undefined) {
          status.fuelLevel = Math.max(0, status.fuelLevel - Math.random() * 1);
        }

        // Check for alerts
        await this.checkVehicleAlerts(vehicleId, status);
      }
    }, 30000); // Update every 30 seconds
  }

  private async checkVehicleAlerts(vehicleId: string, status: VehicleStatus): Promise<void> {
    // Check for low battery/fuel
    if (status.batteryLevel !== undefined && status.batteryLevel < 20) {
      await this.createAlert(
        'battery_low',
        'warning',
        vehicleId,
        undefined,
        'Low Battery Alert',
        `Vehicle ${vehicleId} battery level is at ${status.batteryLevel}%`
      );
    }

    if (status.fuelLevel !== undefined && status.fuelLevel < 15) {
      await this.createAlert(
        'low_fuel',
        'warning',
        vehicleId,
        undefined,
        'Low Fuel Alert',
        `Vehicle ${vehicleId} fuel level is at ${status.fuelLevel}%`
      );
    }

    // Check diagnostic alerts
    const diagnostics = status.diagnostics;
    if (diagnostics.engineHealth === 'critical') {
      await this.createAlert(
        'vehicle_breakdown',
        'critical',
        vehicleId,
        undefined,
        'Engine Critical Alert',
        `Vehicle ${vehicleId} engine requires immediate attention`
      );
    }
  }

  private async createAlert(
    type: FleetAlert['type'],
    severity: FleetAlert['severity'],
    vehicleId?: string,
    driverId?: string,
    title?: string,
    message?: string
  ): Promise<void> {
    // Check if similar alert already exists
    const existingAlert = this.fleetAlerts.find(a => 
      !a.resolved && 
      a.type === type && 
      a.vehicleId === vehicleId && 
      a.driverId === driverId
    );

    if (existingAlert) {
      return; // Don't create duplicate alerts
    }

    const alert: FleetAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      severity,
      vehicleId,
      driverId,
      title: title || `${type} Alert`,
      message: message || `${type} detected`,
      timestamp: new Date(),
      acknowledged: false,
      resolved: false,
      actions: []
    };

    this.fleetAlerts.push(alert);
    console.log(`Fleet alert created: ${alert.title}`);
  }

  private async calculateAverageUtilization(): Promise<number> {
    // Mock calculation - in production, calculate from actual usage data
    return 0.72; // 72% average utilization
  }

  private initializePredictiveMaintenance(): void {
    // Schedule predictive maintenance checks
    setInterval(async () => {
      for (const vehicleId of this.vehicles.keys()) {
        await this.schedulePredictiveMaintenance(vehicleId);
      }
    }, 24 * 60 * 60 * 1000); // Check daily
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }
}

export const fleetMonitoringService = new FleetMonitoringService();