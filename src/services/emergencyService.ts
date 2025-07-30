import { db } from '@/lib/firebase';
import { collection, addDoc, query, where, orderBy, limit, getDocs, doc, updateDoc } from 'firebase/firestore';

export interface EmergencyContact {
  id: string;
  name: string;
  phoneNumber: string;
  relationship: string;
  isPrimary: boolean;
  isActive: boolean;
  notificationPreferences: {
    sms: boolean;
    call: boolean;
    email: boolean;
  };
}

export interface EmergencyIncident {
  id: string;
  userId: string;
  rideId?: string;
  type: 'sos' | 'panic' | 'medical' | 'accident' | 'harassment' | 'vehicle_issue' | 'other';
  status: 'active' | 'responding' | 'resolved' | 'false_alarm';
  priority: 'low' | 'medium' | 'high' | 'critical';
  location: {
    latitude: number;
    longitude: number;
    address?: string;
    accuracy?: number;
  };
  timestamp: Date;
  description?: string;
  audioRecording?: string;
  photos?: string[];
  emergencyContacts: string[];
  responders: EmergencyResponder[];
  timeline: EmergencyTimelineEvent[];
  resolution?: {
    resolvedAt: Date;
    resolvedBy: string;
    resolution: string;
    followUpRequired: boolean;
  };
}

export interface EmergencyResponder {
  id: string;
  type: 'emergency_services' | 'security_team' | 'support_agent' | 'driver';
  name: string;
  phoneNumber?: string;
  status: 'notified' | 'responding' | 'on_scene' | 'completed';
  estimatedArrival?: Date;
  location?: { latitude: number; longitude: number };
}

export interface EmergencyTimelineEvent {
  id: string;
  timestamp: Date;
  type: 'incident_created' | 'contacts_notified' | 'services_contacted' | 'responder_assigned' | 'status_update' | 'resolved';
  description: string;
  actor: string;
  data?: any;
}

export interface EmergencySettings {
  userId: string;
  emergencyContacts: EmergencyContact[];
  autoCallEmergencyServices: boolean;
  shareLocationWithContacts: boolean;
  enablePanicMode: boolean;
  panicModeActivation: 'triple_tap' | 'long_press' | 'shake' | 'voice_command';
  discreteMode: boolean;
  autoRecordAudio: boolean;
  autoTakePhotos: boolean;
  medicalInfo?: {
    bloodType?: string;
    allergies?: string[];
    medications?: string[];
    medicalConditions?: string[];
    emergencyMedicalContact?: string;
  };
}

export interface LocationUpdate {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: Date;
  speed?: number;
  heading?: number;
}

class EmergencyService {
  private activeIncidents: Map<string, EmergencyIncident> = new Map();
  private locationTracking: Map<string, NodeJS.Timeout> = new Map();

  // Emergency incident creation and management
  async createEmergencyIncident(
    userId: string,
    type: EmergencyIncident['type'],
    location: LocationUpdate,
    options?: {
      rideId?: string;
      description?: string;
      discreteMode?: boolean;
    }
  ): Promise<EmergencyIncident> {
    try {
      const settings = await this.getEmergencySettings(userId);
      
      const incident: EmergencyIncident = {
        id: `emergency_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        rideId: options?.rideId,
        type,
        status: 'active',
        priority: this.determinePriority(type),
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
          address: await this.reverseGeocode(location.latitude, location.longitude)
        },
        timestamp: new Date(),
        description: options?.description,
        emergencyContacts: settings?.emergencyContacts.filter(c => c.isActive).map(c => c.id) || [],
        responders: [],
        timeline: [{
          id: `timeline_${Date.now()}`,
          timestamp: new Date(),
          type: 'incident_created',
          description: `Emergency incident created: ${type}`,
          actor: userId
        }]
      };

      // Save to database
      if (db) {
        await addDoc(collection(db, 'emergencyIncidents'), incident);
      }

      // Store in active incidents
      this.activeIncidents.set(incident.id, incident);

      // Start emergency response workflow
      await this.initiateEmergencyResponse(incident, settings, options?.discreteMode);

      return incident;
    } catch (error) {
      console.error('Error creating emergency incident:', error);
      throw error;
    }
  }

  // Emergency response workflow
  private async initiateEmergencyResponse(
    incident: EmergencyIncident,
    settings: EmergencySettings | null,
    discreteMode: boolean = false
  ): Promise<void> {
    try {
      // 1. Start location tracking
      await this.startLocationTracking(incident.userId, incident.id);

      // 2. Notify emergency contacts
      if (settings?.emergencyContacts && !discreteMode) {
        await this.notifyEmergencyContacts(incident, settings.emergencyContacts);
      }

      // 3. Contact emergency services if enabled and high priority
      if (settings?.autoCallEmergencyServices && incident.priority === 'critical') {
        await this.contactEmergencyServices(incident);
      }

      // 4. Assign internal responders
      await this.assignInternalResponders(incident);

      // 5. Start audio recording if enabled
      if (settings?.autoRecordAudio && !discreteMode) {
        await this.startAudioRecording(incident.id);
      }

      // 6. Take photos if enabled
      if (settings?.autoTakePhotos && !discreteMode) {
        await this.takeEmergencyPhotos(incident.id);
      }

      // 7. Notify driver if in active ride
      if (incident.rideId) {
        await this.notifyDriver(incident);
      }

    } catch (error) {
      console.error('Error initiating emergency response:', error);
    }
  }

  // Location tracking
  private async startLocationTracking(userId: string, incidentId: string): Promise<void> {
    // Clear any existing tracking
    if (this.locationTracking.has(userId)) {
      clearInterval(this.locationTracking.get(userId)!);
    }

    // Start new tracking every 10 seconds
    const trackingInterval = setInterval(async () => {
      try {
        const location = await this.getCurrentLocation();
        if (location) {
          await this.updateIncidentLocation(incidentId, location);
        }
      } catch (error) {
        console.error('Error tracking location:', error);
      }
    }, 10000);

    this.locationTracking.set(userId, trackingInterval);
  }

  private async getCurrentLocation(): Promise<LocationUpdate | null> {
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
            accuracy: position.coords.accuracy,
            timestamp: new Date(),
            speed: position.coords.speed || undefined,
            heading: position.coords.heading || undefined
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

  // Emergency contacts notification
  private async notifyEmergencyContacts(
    incident: EmergencyIncident,
    contacts: EmergencyContact[]
  ): Promise<void> {
    const activeContacts = contacts.filter(c => c.isActive);
    
    for (const contact of activeContacts) {
      try {
        const message = this.generateEmergencyMessage(incident, contact);
        
        // Send SMS if enabled
        if (contact.notificationPreferences.sms) {
          await this.sendSMS(contact.phoneNumber, message);
        }

        // Make call if enabled and primary contact
        if (contact.notificationPreferences.call && contact.isPrimary) {
          await this.makeEmergencyCall(contact.phoneNumber, incident);
        }

        // Send email if enabled
        if (contact.notificationPreferences.email) {
          await this.sendEmergencyEmail(contact, incident);
        }

        // Add to timeline
        incident.timeline.push({
          id: `timeline_${Date.now()}`,
          timestamp: new Date(),
          type: 'contacts_notified',
          description: `Notified emergency contact: ${contact.name}`,
          actor: 'system'
        });

      } catch (error) {
        console.error(`Error notifying contact ${contact.name}:`, error);
      }
    }
  }

  // Emergency services integration
  private async contactEmergencyServices(incident: EmergencyIncident): Promise<void> {
    try {
      // In a real implementation, this would integrate with local emergency services APIs
      // For now, we'll simulate the process
      
      const responder: EmergencyResponder = {
        id: `responder_${Date.now()}`,
        type: 'emergency_services',
        name: 'Emergency Services',
        phoneNumber: '911',
        status: 'notified',
        estimatedArrival: new Date(Date.now() + 8 * 60 * 1000) // 8 minutes
      };

      incident.responders.push(responder);

      // Add to timeline
      incident.timeline.push({
        id: `timeline_${Date.now()}`,
        timestamp: new Date(),
        type: 'services_contacted',
        description: 'Emergency services have been contacted',
        actor: 'system'
      });

      // Update incident in database
      await this.updateIncident(incident);

    } catch (error) {
      console.error('Error contacting emergency services:', error);
    }
  }

  // Internal responder assignment
  private async assignInternalResponders(incident: EmergencyIncident): Promise<void> {
    try {
      // Assign security team for high/critical priority incidents
      if (incident.priority === 'high' || incident.priority === 'critical') {
        const securityResponder: EmergencyResponder = {
          id: `responder_${Date.now()}`,
          type: 'security_team',
          name: 'GoCars Security Team',
          phoneNumber: '+1-800-GOCARS-911',
          status: 'notified',
          estimatedArrival: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
        };

        incident.responders.push(securityResponder);
      }

      // Always assign support agent
      const supportResponder: EmergencyResponder = {
        id: `responder_${Date.now()}`,
        type: 'support_agent',
        name: 'Emergency Support Agent',
        status: 'notified'
      };

      incident.responders.push(supportResponder);

      // Add to timeline
      incident.timeline.push({
        id: `timeline_${Date.now()}`,
        timestamp: new Date(),
        type: 'responder_assigned',
        description: 'Internal responders have been assigned',
        actor: 'system'
      });

      await this.updateIncident(incident);

    } catch (error) {
      console.error('Error assigning internal responders:', error);
    }
  }

  // Audio recording
  private async startAudioRecording(incidentId: string): Promise<void> {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.warn('Audio recording not supported');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const audioChunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        await this.saveAudioRecording(incidentId, audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();

      // Stop recording after 5 minutes
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
        }
      }, 5 * 60 * 1000);

    } catch (error) {
      console.error('Error starting audio recording:', error);
    }
  }

  // Photo capture
  private async takeEmergencyPhotos(incidentId: string): Promise<void> {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.warn('Camera not supported');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');

      video.srcObject = stream;
      video.play();

      video.onloadedmetadata = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Take photo after 2 seconds
        setTimeout(() => {
          if (context) {
            context.drawImage(video, 0, 0);
            canvas.toBlob(async (blob) => {
              if (blob) {
                await this.saveEmergencyPhoto(incidentId, blob);
              }
              stream.getTracks().forEach(track => track.stop());
            }, 'image/jpeg', 0.8);
          }
        }, 2000);
      };

    } catch (error) {
      console.error('Error taking emergency photos:', error);
    }
  }

  // Utility methods
  private determinePriority(type: EmergencyIncident['type']): EmergencyIncident['priority'] {
    switch (type) {
      case 'sos':
      case 'medical':
      case 'accident':
        return 'critical';
      case 'panic':
      case 'harassment':
        return 'high';
      case 'vehicle_issue':
        return 'medium';
      default:
        return 'low';
    }
  }

  private generateEmergencyMessage(incident: EmergencyIncident, contact: EmergencyContact): string {
    return `EMERGENCY ALERT: ${contact.name}, this is an automated message from GoCars. Your emergency contact has activated an emergency alert. Type: ${incident.type}. Location: ${incident.location.address || 'Location unavailable'}. Time: ${incident.timestamp.toLocaleString()}. Please contact them immediately or call emergency services if needed.`;
  }

  private async reverseGeocode(latitude: number, longitude: number): Promise<string> {
    try {
      // In a real implementation, this would use a geocoding service
      return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
    }
  }

  // Database operations
  private async updateIncident(incident: EmergencyIncident): Promise<void> {
    try {
      if (!db) return;

      const q = query(
        collection(db, 'emergencyIncidents'),
        where('id', '==', incident.id),
        limit(1)
      );

      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const docRef = querySnapshot.docs[0].ref;
        await updateDoc(docRef, { ...incident });
      }

      // Update local cache
      this.activeIncidents.set(incident.id, incident);
    } catch (error) {
      console.error('Error updating incident:', error);
    }
  }

  private async updateIncidentLocation(incidentId: string, location: LocationUpdate): Promise<void> {
    const incident = this.activeIncidents.get(incidentId);
    if (incident) {
      incident.location = {
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        address: await this.reverseGeocode(location.latitude, location.longitude)
      };

      await this.updateIncident(incident);
    }
  }

  // Settings management
  async getEmergencySettings(userId: string): Promise<EmergencySettings | null> {
    try {
      if (!db) return null;

      const q = query(
        collection(db, 'emergencySettings'),
        where('userId', '==', userId),
        limit(1)
      );

      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        return await this.createDefaultEmergencySettings(userId);
      }

      return querySnapshot.docs[0].data() as EmergencySettings;
    } catch (error) {
      console.error('Error getting emergency settings:', error);
      return null;
    }
  }

  async updateEmergencySettings(settings: EmergencySettings): Promise<boolean> {
    try {
      if (!db) return false;

      const q = query(
        collection(db, 'emergencySettings'),
        where('userId', '==', settings.userId),
        limit(1)
      );

      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        await addDoc(collection(db, 'emergencySettings'), settings);
      } else {
        const docRef = querySnapshot.docs[0].ref;
        await updateDoc(docRef, { ...settings });
      }

      return true;
    } catch (error) {
      console.error('Error updating emergency settings:', error);
      return false;
    }
  }

  private async createDefaultEmergencySettings(userId: string): Promise<EmergencySettings> {
    const defaultSettings: EmergencySettings = {
      userId,
      emergencyContacts: [],
      autoCallEmergencyServices: false,
      shareLocationWithContacts: true,
      enablePanicMode: true,
      panicModeActivation: 'triple_tap',
      discreteMode: false,
      autoRecordAudio: false,
      autoTakePhotos: false
    };

    try {
      if (db) {
        await addDoc(collection(db, 'emergencySettings'), defaultSettings);
      }
    } catch (error) {
      console.error('Error creating default emergency settings:', error);
    }

    return defaultSettings;
  }

  // Incident resolution
  async resolveIncident(
    incidentId: string,
    resolvedBy: string,
    resolution: string,
    followUpRequired: boolean = false
  ): Promise<boolean> {
    try {
      const incident = this.activeIncidents.get(incidentId);
      if (!incident) return false;

      incident.status = 'resolved';
      incident.resolution = {
        resolvedAt: new Date(),
        resolvedBy,
        resolution,
        followUpRequired
      };

      incident.timeline.push({
        id: `timeline_${Date.now()}`,
        timestamp: new Date(),
        type: 'resolved',
        description: `Incident resolved: ${resolution}`,
        actor: resolvedBy
      });

      await this.updateIncident(incident);

      // Stop location tracking
      if (this.locationTracking.has(incident.userId)) {
        clearInterval(this.locationTracking.get(incident.userId)!);
        this.locationTracking.delete(incident.userId);
      }

      // Remove from active incidents
      this.activeIncidents.delete(incidentId);

      return true;
    } catch (error) {
      console.error('Error resolving incident:', error);
      return false;
    }
  }

  // Get active incidents
  async getActiveIncidents(userId?: string): Promise<EmergencyIncident[]> {
    try {
      if (!db) return [];

      let q = query(
        collection(db, 'emergencyIncidents'),
        where('status', 'in', ['active', 'responding']),
        orderBy('timestamp', 'desc')
      );

      if (userId) {
        q = query(q, where('userId', '==', userId));
      }

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        ...doc.data(),
        timestamp: doc.data().timestamp.toDate()
      })) as EmergencyIncident[];
    } catch (error) {
      console.error('Error getting active incidents:', error);
      return [];
    }
  }

  // Mock external service methods (would be replaced with real integrations)
  private async sendSMS(phoneNumber: string, message: string): Promise<void> {
    console.log(`SMS sent to ${phoneNumber}: ${message}`);
  }

  private async makeEmergencyCall(phoneNumber: string, incident: EmergencyIncident): Promise<void> {
    console.log(`Emergency call initiated to ${phoneNumber} for incident ${incident.id}`);
  }

  private async sendEmergencyEmail(contact: EmergencyContact, incident: EmergencyIncident): Promise<void> {
    console.log(`Emergency email sent to ${contact.name} for incident ${incident.id}`);
  }

  private async notifyDriver(incident: EmergencyIncident): Promise<void> {
    console.log(`Driver notified of emergency incident ${incident.id} for ride ${incident.rideId}`);
  }

  private async saveAudioRecording(incidentId: string, audioBlob: Blob): Promise<void> {
    console.log(`Audio recording saved for incident ${incidentId}, size: ${audioBlob.size} bytes`);
  }

  private async saveEmergencyPhoto(incidentId: string, photoBlob: Blob): Promise<void> {
    console.log(`Emergency photo saved for incident ${incidentId}, size: ${photoBlob.size} bytes`);
  }
}

export const emergencyService = new EmergencyService();