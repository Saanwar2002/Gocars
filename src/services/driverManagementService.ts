/**
 * Driver Management Service
 * Comprehensive driver management system with onboarding, profile management,
 * performance tracking, and certification management
 */

import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    startAfter,
    Timestamp,
    writeBatch
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Types and Interfaces
export interface DriverProfile {
    id: string;
    personalInfo: {
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
        dateOfBirth: Date;
        address: {
            street: string;
            city: string;
            state: string;
            zipCode: string;
            country: string;
        };
        emergencyContact: {
            name: string;
            phone: string;
            relationship: string;
        };
    };
    documents: {
        driverLicense: DocumentInfo;
        vehicleRegistration: DocumentInfo;
        insurance: DocumentInfo;
        backgroundCheck: DocumentInfo;
        medicalCertificate?: DocumentInfo;
        profilePhoto: DocumentInfo;
    };
    vehicle: {
        make: string;
        model: string;
        year: number;
        color: string;
        licensePlate: string;
        vin: string;
        type: 'sedan' | 'suv' | 'van' | 'luxury' | 'electric';
        capacity: number;
        features: string[];
    };
    onboardingStatus: {
        currentStep: OnboardingStep;
        completedSteps: OnboardingStep[];
        startedAt: Date;
        completedAt?: Date;
        approvedAt?: Date;
        approvedBy?: string;
        rejectionReason?: string;
    };
    performance: DriverPerformance;
    certifications: Certification[];
    training: TrainingRecord[];
    status: 'pending' | 'approved' | 'active' | 'inactive' | 'suspended' | 'rejected';
    createdAt: Date;
    updatedAt: Date;
}

export interface DocumentInfo {
    url: string;
    fileName: string;
    uploadedAt: Date;
    verified: boolean;
    verifiedAt?: Date;
    verifiedBy?: string;
    expiryDate?: Date;
    notes?: string;
}

export interface DriverPerformance {
    rating: number;
    totalRides: number;
    completedRides: number;
    cancelledRides: number;
    acceptanceRate: number;
    averageResponseTime: number;
    earnings: {
        total: number;
        thisMonth: number;
        lastMonth: number;
    };
    safetyScore: number;
    punctualityScore: number;
    customerSatisfaction: number;
    lastUpdated: Date;
}

export interface Certification {
    id: string;
    name: string;
    type: 'safety' | 'customer_service' | 'vehicle_maintenance' | 'first_aid' | 'defensive_driving';
    issuedBy: string;
    issuedAt: Date;
    expiresAt?: Date;
    certificateUrl: string;
    status: 'active' | 'expired' | 'revoked';
}

export interface TrainingRecord {
    id: string;
    title: string;
    type: 'online' | 'in_person' | 'video' | 'assessment';
    description: string;
    duration: number; // in minutes
    completedAt?: Date;
    score?: number;
    passed: boolean;
    certificateUrl?: string;
    requiredForOnboarding: boolean;
}

export type OnboardingStep =
    | 'personal_info'
    | 'documents_upload'
    | 'vehicle_info'
    | 'background_check'
    | 'training_completion'
    | 'vehicle_inspection'
    | 'final_approval';

export interface OnboardingWorkflow {
    steps: {
        step: OnboardingStep;
        title: string;
        description: string;
        required: boolean;
        estimatedTime: number; // in minutes
        dependencies: OnboardingStep[];
    }[];
}

export interface DriverSearchFilters {
    status?: string[];
    rating?: { min: number; max: number };
    location?: string;
    vehicleType?: string[];
    dateRange?: { start: Date; end: Date };
    sortBy?: 'name' | 'rating' | 'earnings' | 'joinDate';
    sortOrder?: 'asc' | 'desc';
}

class DriverManagementService {
    private readonly COLLECTION_NAME = 'drivers';
    private readonly ONBOARDING_COLLECTION = 'driver_onboarding';
    private readonly TRAINING_COLLECTION = 'driver_training';

    // Onboarding Workflow Configuration
    private readonly ONBOARDING_WORKFLOW: OnboardingWorkflow = {
        steps: [
            {
                step: 'personal_info',
                title: 'Personal Information',
                description: 'Complete your personal details and contact information',
                required: true,
                estimatedTime: 10,
                dependencies: []
            },
            {
                step: 'documents_upload',
                title: 'Document Upload',
                description: 'Upload required documents (license, insurance, etc.)',
                required: true,
                estimatedTime: 15,
                dependencies: ['personal_info']
            },
            {
                step: 'vehicle_info',
                title: 'Vehicle Information',
                description: 'Provide details about your vehicle',
                required: true,
                estimatedTime: 10,
                dependencies: ['personal_info']
            },
            {
                step: 'background_check',
                title: 'Background Check',
                description: 'Complete background verification process',
                required: true,
                estimatedTime: 1440, // 24 hours
                dependencies: ['documents_upload']
            },
            {
                step: 'training_completion',
                title: 'Training Modules',
                description: 'Complete required training courses',
                required: true,
                estimatedTime: 120,
                dependencies: ['personal_info']
            },
            {
                step: 'vehicle_inspection',
                title: 'Vehicle Inspection',
                description: 'Schedule and complete vehicle inspection',
                required: true,
                estimatedTime: 60,
                dependencies: ['vehicle_info', 'documents_upload']
            },
            {
                step: 'final_approval',
                title: 'Final Approval',
                description: 'Administrative review and approval',
                required: true,
                estimatedTime: 1440, // 24 hours
                dependencies: ['background_check', 'training_completion', 'vehicle_inspection']
            }
        ]
    };

    /**
     * Create a new driver profile and start onboarding process
     */
    async createDriverProfile(driverData: Partial<DriverProfile>): Promise<string> {
        try {
            const driverId = doc(collection(db, this.COLLECTION_NAME)).id;

            const newDriver: DriverProfile = {
                id: driverId,
                personalInfo: driverData.personalInfo!,
                documents: {
                    driverLicense: { url: '', fileName: '', uploadedAt: new Date(), verified: false },
                    vehicleRegistration: { url: '', fileName: '', uploadedAt: new Date(), verified: false },
                    insurance: { url: '', fileName: '', uploadedAt: new Date(), verified: false },
                    backgroundCheck: { url: '', fileName: '', uploadedAt: new Date(), verified: false },
                    profilePhoto: { url: '', fileName: '', uploadedAt: new Date(), verified: false }
                },
                vehicle: driverData.vehicle || {
                    make: '',
                    model: '',
                    year: 0,
                    color: '',
                    licensePlate: '',
                    vin: '',
                    type: 'sedan',
                    capacity: 4,
                    features: []
                },
                onboardingStatus: {
                    currentStep: 'personal_info',
                    completedSteps: [],
                    startedAt: new Date()
                },
                performance: {
                    rating: 0,
                    totalRides: 0,
                    completedRides: 0,
                    cancelledRides: 0,
                    acceptanceRate: 0,
                    averageResponseTime: 0,
                    earnings: { total: 0, thisMonth: 0, lastMonth: 0 },
                    safetyScore: 0,
                    punctualityScore: 0,
                    customerSatisfaction: 0,
                    lastUpdated: new Date()
                },
                certifications: [],
                training: [],
                status: 'pending',
                createdAt: new Date(),
                updatedAt: new Date()
            };

            await setDoc(doc(db, this.COLLECTION_NAME, driverId), {
                ...newDriver,
                createdAt: Timestamp.fromDate(newDriver.createdAt),
                updatedAt: Timestamp.fromDate(newDriver.updatedAt),
                'personalInfo.dateOfBirth': Timestamp.fromDate(newDriver.personalInfo.dateOfBirth),
                'onboardingStatus.startedAt': Timestamp.fromDate(newDriver.onboardingStatus.startedAt),
                'performance.lastUpdated': Timestamp.fromDate(newDriver.performance.lastUpdated)
            });

            return driverId;
        } catch (error) {
            console.error('Error creating driver profile:', error);
            throw new Error('Failed to create driver profile');
        }
    }

    /**
     * Get driver profile by ID
     */
    async getDriverProfile(driverId: string): Promise<DriverProfile | null> {
        try {
            const driverDoc = await getDoc(doc(db, this.COLLECTION_NAME, driverId));

            if (!driverDoc.exists()) {
                return null;
            }

            const data = driverDoc.data();
            return {
                ...data,
                personalInfo: {
                    ...data.personalInfo,
                    dateOfBirth: data.personalInfo.dateOfBirth.toDate()
                },
                onboardingStatus: {
                    ...data.onboardingStatus,
                    startedAt: data.onboardingStatus.startedAt.toDate(),
                    completedAt: data.onboardingStatus.completedAt?.toDate(),
                    approvedAt: data.onboardingStatus.approvedAt?.toDate()
                },
                performance: {
                    ...data.performance,
                    lastUpdated: data.performance.lastUpdated.toDate()
                },
                createdAt: data.createdAt.toDate(),
                updatedAt: data.updatedAt.toDate()
            } as DriverProfile;
        } catch (error) {
            console.error('Error getting driver profile:', error);
            throw new Error('Failed to get driver profile');
        }
    }

    /**
     * Update driver profile
     */
    async updateDriverProfile(driverId: string, updates: Partial<DriverProfile>): Promise<void> {
        try {
            const updateData = {
                ...updates,
                updatedAt: Timestamp.fromDate(new Date())
            };

            // Handle nested date fields
            if (updates.personalInfo?.dateOfBirth) {
                updateData['personalInfo.dateOfBirth'] = Timestamp.fromDate(updates.personalInfo.dateOfBirth);
            }

            if (updates.onboardingStatus?.completedAt) {
                updateData['onboardingStatus.completedAt'] = Timestamp.fromDate(updates.onboardingStatus.completedAt);
            }

            if (updates.onboardingStatus?.approvedAt) {
                updateData['onboardingStatus.approvedAt'] = Timestamp.fromDate(updates.onboardingStatus.approvedAt);
            }

            if (updates.performance?.lastUpdated) {
                updateData['performance.lastUpdated'] = Timestamp.fromDate(updates.performance.lastUpdated);
            }

            await updateDoc(doc(db, this.COLLECTION_NAME, driverId), updateData);
        } catch (error) {
            console.error('Error updating driver profile:', error);
            throw new Error('Failed to update driver profile');
        }
    }

    /**
     * Get onboarding workflow configuration
     */
    getOnboardingWorkflow(): OnboardingWorkflow {
        return this.ONBOARDING_WORKFLOW;
    }

    /**
     * Update onboarding step
     */
    async updateOnboardingStep(driverId: string, step: OnboardingStep, completed: boolean = true): Promise<void> {
        try {
            const driver = await this.getDriverProfile(driverId);
            if (!driver) {
                throw new Error('Driver not found');
            }

            const completedSteps = completed
                ? [...driver.onboardingStatus.completedSteps, step]
                : driver.onboardingStatus.completedSteps.filter(s => s !== step);

            // Determine next step
            const workflow = this.ONBOARDING_WORKFLOW;
            const currentStepIndex = workflow.steps.findIndex(s => s.step === step);
            const nextStep = currentStepIndex < workflow.steps.length - 1
                ? workflow.steps[currentStepIndex + 1].step
                : step;

            const updates: Partial<DriverProfile> = {
                onboardingStatus: {
                    ...driver.onboardingStatus,
                    currentStep: completed ? nextStep : step,
                    completedSteps: [...new Set(completedSteps)], // Remove duplicates
                    completedAt: completedSteps.length === workflow.steps.length ? new Date() : undefined
                }
            };

            // Auto-approve if all steps completed
            if (completedSteps.length === workflow.steps.length) {
                updates.status = 'approved';
                updates.onboardingStatus!.approvedAt = new Date();
            }

            await this.updateDriverProfile(driverId, updates);
        } catch (error) {
            console.error('Error updating onboarding step:', error);
            throw new Error('Failed to update onboarding step');
        }
    }

    /**
     * Get drivers with filters and pagination
     */
    async getDrivers(
        filters: DriverSearchFilters = {},
        pageSize: number = 20,
        lastDoc?: any
    ): Promise<{ drivers: DriverProfile[]; hasMore: boolean; lastDoc: any }> {
        try {
            let q = query(collection(db, this.COLLECTION_NAME));

            // Apply filters
            if (filters.status && filters.status.length > 0) {
                q = query(q, where('status', 'in', filters.status));
            }

            if (filters.vehicleType && filters.vehicleType.length > 0) {
                q = query(q, where('vehicle.type', 'in', filters.vehicleType));
            }

            // Apply sorting
            const sortField = filters.sortBy || 'createdAt';
            const sortDirection = filters.sortOrder || 'desc';
            q = query(q, orderBy(sortField, sortDirection));

            // Apply pagination
            q = query(q, limit(pageSize + 1));
            if (lastDoc) {
                q = query(q, startAfter(lastDoc));
            }

            const snapshot = await getDocs(q);
            const drivers: DriverProfile[] = [];
            let newLastDoc = null;

            snapshot.docs.forEach((doc, index) => {
                if (index < pageSize) {
                    const data = doc.data();
                    drivers.push({
                        ...data,
                        personalInfo: {
                            ...data.personalInfo,
                            dateOfBirth: data.personalInfo.dateOfBirth.toDate()
                        },
                        onboardingStatus: {
                            ...data.onboardingStatus,
                            startedAt: data.onboardingStatus.startedAt.toDate(),
                            completedAt: data.onboardingStatus.completedAt?.toDate(),
                            approvedAt: data.onboardingStatus.approvedAt?.toDate()
                        },
                        performance: {
                            ...data.performance,
                            lastUpdated: data.performance.lastUpdated.toDate()
                        },
                        createdAt: data.createdAt.toDate(),
                        updatedAt: data.updatedAt.toDate()
                    } as DriverProfile);
                } else {
                    newLastDoc = doc;
                }
            });

            return {
                drivers,
                hasMore: snapshot.docs.length > pageSize,
                lastDoc: newLastDoc
            };
        } catch (error) {
            console.error('Error getting drivers:', error);
            throw new Error('Failed to get drivers');
        }
    }

    /**
     * Approve driver application
     */
    async approveDriver(driverId: string, approvedBy: string): Promise<void> {
        try {
            const updates: Partial<DriverProfile> = {
                status: 'approved',
                onboardingStatus: {
                    approvedAt: new Date(),
                    approvedBy
                } as any
            };

            await this.updateDriverProfile(driverId, updates);
        } catch (error) {
            console.error('Error approving driver:', error);
            throw new Error('Failed to approve driver');
        }
    }

    /**
     * Reject driver application
     */
    async rejectDriver(driverId: string, reason: string): Promise<void> {
        try {
            const updates: Partial<DriverProfile> = {
                status: 'rejected',
                onboardingStatus: {
                    rejectionReason: reason
                } as any
            };

            await this.updateDriverProfile(driverId, updates);
        } catch (error) {
            console.error('Error rejecting driver:', error);
            throw new Error('Failed to reject driver');
        }
    }

    /**
     * Suspend driver
     */
    async suspendDriver(driverId: string, reason: string): Promise<void> {
        try {
            await this.updateDriverProfile(driverId, {
                status: 'suspended',
                onboardingStatus: {
                    rejectionReason: reason
                } as any
            });
        } catch (error) {
            console.error('Error suspending driver:', error);
            throw new Error('Failed to suspend driver');
        }
    }

    /**
     * Reactivate driver
     */
    async reactivateDriver(driverId: string): Promise<void> {
        try {
            await this.updateDriverProfile(driverId, {
                status: 'active'
            });
        } catch (error) {
            console.error('Error reactivating driver:', error);
            throw new Error('Failed to reactivate driver');
        }
    }

    /**
     * Update driver performance metrics
     */
    async updatePerformanceMetrics(driverId: string, metrics: Partial<DriverPerformance>): Promise<void> {
        try {
            const driver = await this.getDriverProfile(driverId);
            if (!driver) {
                throw new Error('Driver not found');
            }

            const updatedPerformance: DriverPerformance = {
                ...driver.performance,
                ...metrics,
                lastUpdated: new Date()
            };

            await this.updateDriverProfile(driverId, {
                performance: updatedPerformance
            });
        } catch (error) {
            console.error('Error updating performance metrics:', error);
            throw new Error('Failed to update performance metrics');
        }
    }

    /**
     * Add certification to driver
     */
    async addCertification(driverId: string, certification: Omit<Certification, 'id'>): Promise<void> {
        try {
            const driver = await this.getDriverProfile(driverId);
            if (!driver) {
                throw new Error('Driver not found');
            }

            const newCertification: Certification = {
                ...certification,
                id: doc(collection(db, 'certifications')).id
            };

            const updatedCertifications = [...driver.certifications, newCertification];

            await this.updateDriverProfile(driverId, {
                certifications: updatedCertifications
            });
        } catch (error) {
            console.error('Error adding certification:', error);
            throw new Error('Failed to add certification');
        }
    }

    /**
     * Add training record to driver
     */
    async addTrainingRecord(driverId: string, training: Omit<TrainingRecord, 'id'>): Promise<void> {
        try {
            const driver = await this.getDriverProfile(driverId);
            if (!driver) {
                throw new Error('Driver not found');
            }

            const newTraining: TrainingRecord = {
                ...training,
                id: doc(collection(db, 'training')).id
            };

            const updatedTraining = [...driver.training, newTraining];

            await this.updateDriverProfile(driverId, {
                training: updatedTraining
            });
        } catch (error) {
            console.error('Error adding training record:', error);
            throw new Error('Failed to add training record');
        }
    }

    /**
     * Get driver statistics
     */
    async getDriverStatistics(): Promise<{
        total: number;
        pending: number;
        approved: number;
        active: number;
        suspended: number;
        rejected: number;
        averageRating: number;
        averageOnboardingTime: number;
    }> {
        try {
            const snapshot = await getDocs(collection(db, this.COLLECTION_NAME));
            const drivers = snapshot.docs.map(doc => doc.data());

            const stats = {
                total: drivers.length,
                pending: drivers.filter(d => d.status === 'pending').length,
                approved: drivers.filter(d => d.status === 'approved').length,
                active: drivers.filter(d => d.status === 'active').length,
                suspended: drivers.filter(d => d.status === 'suspended').length,
                rejected: drivers.filter(d => d.status === 'rejected').length,
                averageRating: drivers.reduce((sum, d) => sum + (d.performance?.rating || 0), 0) / drivers.length || 0,
                averageOnboardingTime: 0 // Calculate based on completed onboarding
            };

            // Calculate average onboarding time
            const completedDrivers = drivers.filter(d =>
                d.onboardingStatus?.completedAt && d.onboardingStatus?.startedAt
            );

            if (completedDrivers.length > 0) {
                const totalTime = completedDrivers.reduce((sum, d) => {
                    const start = d.onboardingStatus.startedAt.toDate();
                    const end = d.onboardingStatus.completedAt.toDate();
                    return sum + (end.getTime() - start.getTime());
                }, 0);

                stats.averageOnboardingTime = totalTime / completedDrivers.length / (1000 * 60 * 60 * 24); // in days
            }

            return stats;
        } catch (error) {
            console.error('Error getting driver statistics:', error);
            throw new Error('Failed to get driver statistics');
        }
    }

    /**
     * Delete driver profile
     */
    async deleteDriver(driverId: string): Promise<void> {
        try {
            await deleteDoc(doc(db, this.COLLECTION_NAME, driverId));
        } catch (error) {
            console.error('Error deleting driver:', error);
            throw new Error('Failed to delete driver');
        }
    }
}

export const driverManagementService = new DriverManagementService();
export default driverManagementService;