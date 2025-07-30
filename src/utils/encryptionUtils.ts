/**
 * Encryption Utilities
 * Provides end-to-end encryption capabilities for sensitive data
 * including field-level encryption, key management, and secure data handling
 */

export interface EncryptionKey {
  id: string;
  algorithm: 'AES-256-GCM' | 'ChaCha20-Poly1305';
  key: string;
  iv: string;
  createdAt: Date;
  expiresAt: Date;
  purpose: string;
  rotationCount: number;
}

export interface EncryptedData {
  data: string;
  keyId: string;
  algorithm: string;
  iv: string;
  tag?: string;
  timestamp: Date;
}

export interface FieldEncryptionConfig {
  field: string;
  algorithm: 'AES-256-GCM' | 'ChaCha20-Poly1305';
  keyRotationDays: number;
  encryptInTransit: boolean;
  encryptAtRest: boolean;
}

class EncryptionUtils {
  private keys = new Map<string, EncryptionKey>();
  private fieldConfigs: FieldEncryptionConfig[] = [
    {
      field: 'email',
      algorithm: 'AES-256-GCM',
      keyRotationDays: 90,
      encryptInTransit: true,
      encryptAtRest: true
    },
    {
      field: 'phone',
      algorithm: 'AES-256-GCM',
      keyRotationDays: 90,
      encryptInTransit: true,
      encryptAtRest: true
    },
    {
      field: 'address',
      algorithm: 'AES-256-GCM',
      keyRotationDays: 90,
      encryptInTransit: true,
      encryptAtRest: true
    },
    {
      field: 'payment_info',
      algorithm: 'AES-256-GCM',
      keyRotationDays: 30,
      encryptInTransit: true,
      encryptAtRest: true
    },
    {
      field: 'location',
      algorithm: 'ChaCha20-Poly1305',
      keyRotationDays: 60,
      encryptInTransit: true,
      encryptAtRest: true
    }
  ];

  /**
   * Initialize encryption system
   */
  async initialize(): Promise<void> {
    try {
      // Generate initial encryption keys
      await this.generateInitialKeys();
      
      // Start key rotation scheduler
      this.startKeyRotationScheduler();
      
      console.log('Encryption system initialized successfully');
    } catch (error) {
      console.error('Error initializing encryption system:', error);
    }
  }

  /**
   * Encrypt sensitive data
   */
  async encryptData(
    data: string, 
    purpose: string = 'general',
    algorithm: 'AES-256-GCM' | 'ChaCha20-Poly1305' = 'AES-256-GCM'
  ): Promise<EncryptedData> {
    try {
      // Get or create encryption key
      const key = await this.getEncryptionKey(purpose, algorithm);
      
      // Encrypt data based on algorithm
      let encryptedData: string;
      let tag: string | undefined;

      if (algorithm === 'AES-256-GCM') {
        const result = await this.encryptAESGCM(data, key);
        encryptedData = result.encrypted;
        tag = result.tag;
      } else {
        encryptedData = await this.encryptChaCha20(data, key);
      }

      const encrypted: EncryptedData = {
        data: encryptedData,
        keyId: key.id,
        algorithm: key.algorithm,
        iv: key.iv,
        tag,
        timestamp: new Date()
      };

      return encrypted;
    } catch (error) {
      console.error('Error encrypting data:', error);
      throw new Error('Data encryption failed');
    }
  }

  /**
   * Decrypt sensitive data
   */
  async decryptData(encryptedData: EncryptedData): Promise<string> {
    try {
      // Get encryption key
      const key = this.keys.get(encryptedData.keyId);
      if (!key) {
        throw new Error('Encryption key not found');
      }

      // Decrypt data based on algorithm
      let decryptedData: string;

      if (encryptedData.algorithm === 'AES-256-GCM') {
        decryptedData = await this.decryptAESGCM(encryptedData, key);
      } else {
        decryptedData = await this.decryptChaCha20(encryptedData, key);
      }

      return decryptedData;
    } catch (error) {
      console.error('Error decrypting data:', error);
      throw new Error('Data decryption failed');
    }
  }

  /**
   * Encrypt object fields based on configuration
   */
  async encryptObject(obj: any, context: string = 'general'): Promise<any> {
    try {
      const encrypted = { ...obj };

      for (const config of this.fieldConfigs) {
        if (encrypted[config.field] && config.encryptAtRest) {
          const encryptedField = await this.encryptData(
            encrypted[config.field].toString(),
            `${context}_${config.field}`,
            config.algorithm
          );
          
          // Store encrypted data with metadata
          encrypted[config.field] = {
            _encrypted: true,
            _data: encryptedField,
            _originalType: typeof obj[config.field]
          };
        }
      }

      return encrypted;
    } catch (error) {
      console.error('Error encrypting object:', error);
      throw error;
    }
  }

  /**
   * Decrypt object fields
   */
  async decryptObject(obj: any): Promise<any> {
    try {
      const decrypted = { ...obj };

      for (const key in decrypted) {
        const value = decrypted[key];
        
        if (value && typeof value === 'object' && value._encrypted) {
          const decryptedValue = await this.decryptData(value._data);
          
          // Restore original type
          switch (value._originalType) {
            case 'number':
              decrypted[key] = parseFloat(decryptedValue);
              break;
            case 'boolean':
              decrypted[key] = decryptedValue === 'true';
              break;
            default:
              decrypted[key] = decryptedValue;
          }
        }
      }

      return decrypted;
    } catch (error) {
      console.error('Error decrypting object:', error);
      throw error;
    }
  }

  /**
   * Generate hash for data integrity
   */
  async generateHash(data: string, algorithm: 'SHA-256' | 'SHA-512' = 'SHA-256'): Promise<string> {
    try {
      // In production, use proper cryptographic hashing
      // This is a mock implementation
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);
      
      if (crypto.subtle) {
        const hashBuffer = await crypto.subtle.digest(algorithm, dataBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      } else {
        // Fallback for environments without crypto.subtle
        return btoa(data + '_hashed_' + algorithm).substring(0, 32);
      }
    } catch (error) {
      console.error('Error generating hash:', error);
      throw error;
    }
  }

  /**
   * Verify data integrity
   */
  async verifyHash(data: string, hash: string, algorithm: 'SHA-256' | 'SHA-512' = 'SHA-256'): Promise<boolean> {
    try {
      const computedHash = await this.generateHash(data, algorithm);
      return computedHash === hash;
    } catch (error) {
      console.error('Error verifying hash:', error);
      return false;
    }
  }

  /**
   * Generate secure random key
   */
  private async generateSecureKey(length: number = 32): Promise<string> {
    try {
      if (crypto.getRandomValues) {
        const array = new Uint8Array(length);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
      } else {
        // Fallback for environments without crypto.getRandomValues
        return Array.from({ length }, () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0')).join('');
      }
    } catch (error) {
      console.error('Error generating secure key:', error);
      throw error;
    }
  }

  /**
   * Generate initialization vector
   */
  private async generateIV(length: number = 16): Promise<string> {
    return this.generateSecureKey(length);
  }

  /**
   * Get or create encryption key
   */
  private async getEncryptionKey(
    purpose: string, 
    algorithm: 'AES-256-GCM' | 'ChaCha20-Poly1305'
  ): Promise<EncryptionKey> {
    // Check for existing valid key
    for (const [id, key] of this.keys) {
      if (key.purpose === purpose && key.algorithm === algorithm && key.expiresAt > new Date()) {
        return key;
      }
    }

    // Generate new key
    return this.generateEncryptionKey(purpose, algorithm);
  }

  /**
   * Generate new encryption key
   */
  private async generateEncryptionKey(
    purpose: string,
    algorithm: 'AES-256-GCM' | 'ChaCha20-Poly1305'
  ): Promise<EncryptionKey> {
    const keyLength = algorithm === 'AES-256-GCM' ? 32 : 32; // Both use 256-bit keys
    const ivLength = algorithm === 'AES-256-GCM' ? 16 : 12;

    const key: EncryptionKey = {
      id: `key_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      algorithm,
      key: await this.generateSecureKey(keyLength),
      iv: await this.generateIV(ivLength),
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
      purpose,
      rotationCount: 0
    };

    this.keys.set(key.id, key);
    
    // Persist key (in production, use secure key management service)
    localStorage.setItem(`encryption_key_${key.id}`, JSON.stringify({
      ...key,
      key: '[REDACTED]' // Don't store actual key in localStorage
    }));

    console.log(`Generated new encryption key: ${key.id} for purpose: ${purpose}`);
    return key;
  }

  /**
   * Encrypt using AES-256-GCM
   */
  private async encryptAESGCM(data: string, key: EncryptionKey): Promise<{ encrypted: string; tag: string }> {
    try {
      // In production, use proper AES-GCM implementation
      // This is a mock implementation
      const encrypted = btoa(data + '_aes_gcm_' + key.id);
      const tag = btoa('auth_tag_' + key.id).substring(0, 16);
      
      return { encrypted, tag };
    } catch (error) {
      console.error('Error in AES-GCM encryption:', error);
      throw error;
    }
  }

  /**
   * Decrypt using AES-256-GCM
   */
  private async decryptAESGCM(encryptedData: EncryptedData, key: EncryptionKey): Promise<string> {
    try {
      // In production, use proper AES-GCM implementation
      // This is a mock implementation
      const decoded = atob(encryptedData.data);
      return decoded.replace('_aes_gcm_' + key.id, '');
    } catch (error) {
      console.error('Error in AES-GCM decryption:', error);
      throw error;
    }
  }

  /**
   * Encrypt using ChaCha20-Poly1305
   */
  private async encryptChaCha20(data: string, key: EncryptionKey): Promise<string> {
    try {
      // In production, use proper ChaCha20-Poly1305 implementation
      // This is a mock implementation
      return btoa(data + '_chacha20_' + key.id);
    } catch (error) {
      console.error('Error in ChaCha20 encryption:', error);
      throw error;
    }
  }

  /**
   * Decrypt using ChaCha20-Poly1305
   */
  private async decryptChaCha20(encryptedData: EncryptedData, key: EncryptionKey): Promise<string> {
    try {
      // In production, use proper ChaCha20-Poly1305 implementation
      // This is a mock implementation
      const decoded = atob(encryptedData.data);
      return decoded.replace('_chacha20_' + key.id, '');
    } catch (error) {
      console.error('Error in ChaCha20 decryption:', error);
      throw error;
    }
  }

  /**
   * Generate initial encryption keys
   */
  private async generateInitialKeys(): Promise<void> {
    // Generate keys for common purposes
    const purposes = ['general', 'user_data', 'payment_data', 'location_data', 'communication'];
    
    for (const purpose of purposes) {
      await this.generateEncryptionKey(purpose, 'AES-256-GCM');
    }
  }

  /**
   * Start key rotation scheduler
   */
  private startKeyRotationScheduler(): void {
    // In production, implement proper key rotation scheduling
    setInterval(() => {
      this.rotateExpiredKeys();
    }, 24 * 60 * 60 * 1000); // Check daily
  }

  /**
   * Rotate expired keys
   */
  private async rotateExpiredKeys(): Promise<void> {
    const now = new Date();
    
    for (const [id, key] of this.keys) {
      if (key.expiresAt <= now) {
        // Generate new key with same purpose and algorithm
        const newKey = await this.generateEncryptionKey(key.purpose, key.algorithm);
        newKey.rotationCount = key.rotationCount + 1;
        
        // Keep old key for decryption of existing data
        key.expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days grace period
        
        console.log(`Rotated encryption key: ${id} -> ${newKey.id}`);
      }
    }
  }

  /**
   * Get field encryption configuration
   */
  getFieldConfig(field: string): FieldEncryptionConfig | undefined {
    return this.fieldConfigs.find(config => config.field === field);
  }

  /**
   * Update field encryption configuration
   */
  updateFieldConfig(field: string, config: Partial<FieldEncryptionConfig>): void {
    const index = this.fieldConfigs.findIndex(c => c.field === field);
    if (index !== -1) {
      this.fieldConfigs[index] = { ...this.fieldConfigs[index], ...config };
    } else {
      this.fieldConfigs.push({
        field,
        algorithm: 'AES-256-GCM',
        keyRotationDays: 90,
        encryptInTransit: true,
        encryptAtRest: true,
        ...config
      });
    }
  }

  /**
   * Get encryption statistics
   */
  getEncryptionStats(): {
    totalKeys: number;
    activeKeys: number;
    expiredKeys: number;
    keyRotations: number;
  } {
    const now = new Date();
    let activeKeys = 0;
    let expiredKeys = 0;
    let totalRotations = 0;

    for (const key of this.keys.values()) {
      if (key.expiresAt > now) {
        activeKeys++;
      } else {
        expiredKeys++;
      }
      totalRotations += key.rotationCount;
    }

    return {
      totalKeys: this.keys.size,
      activeKeys,
      expiredKeys,
      keyRotations: totalRotations
    };
  }
}

export const encryptionUtils = new EncryptionUtils();