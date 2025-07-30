/**
 * Advanced Authentication Service
 * Provides enhanced security features including biometric authentication,
 * multi-factor authentication, and identity verification
 */

import { auth } from '@/lib/firebase';
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  PhoneAuthProvider,
  linkWithCredential,
  User
} from 'firebase/auth';

export interface BiometricAuthOptions {
  allowedAuthenticators?: string[];
  userVerification?: 'required' | 'preferred' | 'discouraged';
  timeout?: number;
}

export interface MFASetupData {
  phoneNumber: string;
  backupCodes: string[];
  totpSecret?: string;
}

export interface VerificationResult {
  success: boolean;
  verified: boolean;
  verificationLevel: 'basic' | 'enhanced' | 'premium';
  verifiedFields: string[];
  expiresAt?: Date;
}

export interface IdentityVerificationData {
  documentType: 'passport' | 'drivers_license' | 'national_id';
  documentNumber: string;
  documentImages: string[];
  selfieImage: string;
  fullName: string;
  dateOfBirth: string;
  address?: string;
}

class AdvancedAuthService {
  private recaptchaVerifier: RecaptchaVerifier | null = null;

  /**
   * Initialize biometric authentication
   */
  async initializeBiometricAuth(): Promise<boolean> {
    try {
      // Check if WebAuthn is supported
      if (!window.PublicKeyCredential) {
        console.warn('WebAuthn not supported in this browser');
        return false;
      }

      // Check if biometric authentication is available
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      return available;
    } catch (error) {
      console.error('Error initializing biometric auth:', error);
      return false;
    }
  }

  /**
   * Register biometric authentication for user
   */
  async registerBiometric(userId: string): Promise<{ success: boolean; credentialId?: string }> {
    try {
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);

      const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
        challenge,
        rp: {
          name: 'GoCars',
          id: window.location.hostname,
        },
        user: {
          id: new TextEncoder().encode(userId),
          name: userId,
          displayName: 'GoCars User',
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' }, // ES256
          { alg: -257, type: 'public-key' }, // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
          requireResidentKey: false,
        },
        timeout: 60000,
        attestation: 'direct',
      };

      const credential = await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions,
      }) as PublicKeyCredential;

      if (credential) {
        const credentialId = Array.from(new Uint8Array(credential.rawId))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');

        // Store credential in user profile
        await this.storeBiometricCredential(userId, credentialId, credential);

        return { success: true, credentialId };
      }

      return { success: false };
    } catch (error) {
      console.error('Error registering biometric:', error);
      return { success: false };
    }
  }

  /**
   * Authenticate using biometrics
   */
  async authenticateWithBiometric(userId: string): Promise<{ success: boolean; verified: boolean }> {
    try {
      const storedCredentials = await this.getBiometricCredentials(userId);
      if (!storedCredentials.length) {
        return { success: false, verified: false };
      }

      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);

      const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
        challenge,
        allowCredentials: storedCredentials.map(cred => ({
          id: new Uint8Array(cred.credentialId.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))),
          type: 'public-key',
        })),
        timeout: 60000,
        userVerification: 'required',
      };

      const assertion = await navigator.credentials.get({
        publicKey: publicKeyCredentialRequestOptions,
      }) as PublicKeyCredential;

      if (assertion) {
        // Verify the assertion (in production, this should be done server-side)
        const verified = await this.verifyBiometricAssertion(assertion, userId);
        return { success: true, verified };
      }

      return { success: false, verified: false };
    } catch (error) {
      console.error('Error authenticating with biometric:', error);
      return { success: false, verified: false };
    }
  }

  /**
   * Setup multi-factor authentication
   */
  async setupMFA(user: User, phoneNumber: string): Promise<MFASetupData> {
    try {
      // Initialize reCAPTCHA verifier
      if (!this.recaptchaVerifier) {
        this.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
          callback: () => {
            console.log('reCAPTCHA solved');
          },
        });
      }

      // Send SMS verification
      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, this.recaptchaVerifier);
      
      // Generate backup codes
      const backupCodes = this.generateBackupCodes();

      // Store MFA setup data
      const mfaData: MFASetupData = {
        phoneNumber,
        backupCodes,
      };

      await this.storeMFAData(user.uid, mfaData);

      return mfaData;
    } catch (error) {
      console.error('Error setting up MFA:', error);
      throw error;
    }
  }

  /**
   * Verify MFA code
   */
  async verifyMFACode(userId: string, code: string, type: 'sms' | 'backup' = 'sms'): Promise<boolean> {
    try {
      if (type === 'backup') {
        return await this.verifyBackupCode(userId, code);
      }

      // For SMS verification, this would typically be handled by Firebase Auth
      // In a real implementation, you'd verify the SMS code here
      return code.length === 6 && /^\d+$/.test(code);
    } catch (error) {
      console.error('Error verifying MFA code:', error);
      return false;
    }
  }

  /**
   * Perform identity verification for drivers and high-value passengers
   */
  async performIdentityVerification(
    userId: string, 
    verificationData: IdentityVerificationData,
    userType: 'driver' | 'passenger' = 'passenger'
  ): Promise<VerificationResult> {
    try {
      // Validate document images and selfie
      const documentValidation = await this.validateDocumentImages(verificationData.documentImages);
      const selfieValidation = await this.validateSelfieImage(verificationData.selfieImage);
      
      if (!documentValidation.valid || !selfieValidation.valid) {
        return {
          success: false,
          verified: false,
          verificationLevel: 'basic',
          verifiedFields: [],
        };
      }

      // Perform document verification (in production, use a service like Jumio or Onfido)
      const documentVerification = await this.verifyDocument(verificationData);
      
      // Perform facial recognition match
      const faceMatch = await this.performFaceMatch(
        verificationData.selfieImage,
        verificationData.documentImages[0]
      );

      const verifiedFields: string[] = [];
      let verificationLevel: 'basic' | 'enhanced' | 'premium' = 'basic';

      if (documentVerification.success) {
        verifiedFields.push('identity', 'document');
        verificationLevel = 'enhanced';
      }

      if (faceMatch.success && faceMatch.confidence > 0.8) {
        verifiedFields.push('face_match');
        verificationLevel = 'premium';
      }

      // For drivers, perform additional checks
      if (userType === 'driver') {
        const backgroundCheck = await this.performBackgroundCheck(verificationData);
        if (backgroundCheck.passed) {
          verifiedFields.push('background_check');
        }
      }

      const result: VerificationResult = {
        success: true,
        verified: verifiedFields.length >= 2,
        verificationLevel,
        verifiedFields,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      };

      // Store verification result
      await this.storeVerificationResult(userId, result);

      return result;
    } catch (error) {
      console.error('Error performing identity verification:', error);
      return {
        success: false,
        verified: false,
        verificationLevel: 'basic',
        verifiedFields: [],
      };
    }
  }

  /**
   * Check if user requires enhanced verification for high-value rides
   */
  async requiresEnhancedVerification(userId: string, rideValue: number): Promise<boolean> {
    try {
      const verificationResult = await this.getVerificationResult(userId);
      
      // Require enhanced verification for rides over $100 or premium rides
      if (rideValue > 100) {
        return verificationResult?.verificationLevel !== 'premium';
      }

      // Require basic verification for rides over $50
      if (rideValue > 50) {
        return verificationResult?.verificationLevel === 'basic' || !verificationResult?.verified;
      }

      return false;
    } catch (error) {
      console.error('Error checking verification requirements:', error);
      return false;
    }
  }

  // Private helper methods

  private async storeBiometricCredential(userId: string, credentialId: string, credential: PublicKeyCredential): Promise<void> {
    // In production, store this securely in your database
    const credentialData = {
      credentialId,
      publicKey: Array.from(new Uint8Array(credential.response.publicKey!)),
      createdAt: new Date(),
    };
    
    localStorage.setItem(`biometric_${userId}`, JSON.stringify(credentialData));
  }

  private async getBiometricCredentials(userId: string): Promise<any[]> {
    // In production, retrieve from your secure database
    const stored = localStorage.getItem(`biometric_${userId}`);
    return stored ? [JSON.parse(stored)] : [];
  }

  private async verifyBiometricAssertion(assertion: PublicKeyCredential, userId: string): Promise<boolean> {
    // In production, verify the assertion signature server-side
    // This is a simplified client-side check for demo purposes
    return assertion.response.signature !== null;
  }

  private generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < 10; i++) {
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      codes.push(code);
    }
    return codes;
  }

  private async storeMFAData(userId: string, mfaData: MFASetupData): Promise<void> {
    // In production, store this securely in your database
    localStorage.setItem(`mfa_${userId}`, JSON.stringify(mfaData));
  }

  private async verifyBackupCode(userId: string, code: string): Promise<boolean> {
    // In production, verify against stored backup codes
    const stored = localStorage.getItem(`mfa_${userId}`);
    if (!stored) return false;
    
    const mfaData: MFASetupData = JSON.parse(stored);
    return mfaData.backupCodes.includes(code.toUpperCase());
  }

  private async validateDocumentImages(images: string[]): Promise<{ valid: boolean; issues?: string[] }> {
    // Basic validation - in production, use ML-based document validation
    if (!images.length) {
      return { valid: false, issues: ['No document images provided'] };
    }

    // Check image format and size
    const issues: string[] = [];
    for (const image of images) {
      if (!image.startsWith('data:image/')) {
        issues.push('Invalid image format');
      }
    }

    return { valid: issues.length === 0, issues };
  }

  private async validateSelfieImage(image: string): Promise<{ valid: boolean; issues?: string[] }> {
    // Basic validation - in production, use ML-based face detection
    if (!image || !image.startsWith('data:image/')) {
      return { valid: false, issues: ['Invalid selfie image'] };
    }

    return { valid: true };
  }

  private async verifyDocument(data: IdentityVerificationData): Promise<{ success: boolean; confidence?: number }> {
    // In production, integrate with document verification service (Jumio, Onfido, etc.)
    // This is a mock implementation
    const hasRequiredFields = data.fullName && data.dateOfBirth && data.documentNumber;
    return { 
      success: hasRequiredFields, 
      confidence: hasRequiredFields ? 0.95 : 0.1 
    };
  }

  private async performFaceMatch(selfie: string, documentPhoto: string): Promise<{ success: boolean; confidence: number }> {
    // In production, use facial recognition service (AWS Rekognition, Azure Face API, etc.)
    // This is a mock implementation
    return { success: true, confidence: 0.85 };
  }

  private async performBackgroundCheck(data: IdentityVerificationData): Promise<{ passed: boolean; issues?: string[] }> {
    // In production, integrate with background check service
    // This is a mock implementation
    return { passed: true };
  }

  private async storeVerificationResult(userId: string, result: VerificationResult): Promise<void> {
    // In production, store in secure database
    localStorage.setItem(`verification_${userId}`, JSON.stringify(result));
  }

  private async getVerificationResult(userId: string): Promise<VerificationResult | null> {
    // In production, retrieve from secure database
    const stored = localStorage.getItem(`verification_${userId}`);
    return stored ? JSON.parse(stored) : null;
  }
}

export const advancedAuthService = new AdvancedAuthService();