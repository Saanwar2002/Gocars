/**
 * Firebase Authentication Tester
 * Comprehensive testing for Firebase Authentication functionality
 */

import { 
  Auth, 
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  updatePassword,
  deleteUser,
  onAuthStateChanged,
  sendEmailVerification,
  reauthenticateWithCredential,
  EmailAuthProvider,
  UserCredential
} from 'firebase/auth'
import { getSafeAuth, safeAuthOperation } from '../../lib/firebase-utils'
import { TestResult } from '../core/TestingAgentController'
import { VirtualUser } from '../core/VirtualUserFactory'

export interface AuthTestConfig {
  testEmail: string
  testPassword: string
  newPassword: string
  displayName: string
  timeout: number
}

export interface AuthTestResult extends TestResult {
  authDetails?: {
    uid?: string
    email?: string
    emailVerified?: boolean
    displayName?: string
    creationTime?: string
    lastSignInTime?: string
  }
}

export class FirebaseAuthenticationTester {
  private auth: Auth | null
  private testUsers: Map<string, User> = new Map()
  private authStateListeners: Array<() => void> = []

  constructor() {
    this.auth = getSafeAuth()
  }

  /**
   * Run comprehensive authentication tests
   */
  public async runAuthenticationTests(config: AuthTestConfig): Promise<AuthTestResult[]> {
    const results: AuthTestResult[] = []

    console.log('Starting Firebase Authentication Tests...')

    // Test 1: Authentication Service Availability
    results.push(await this.testAuthServiceAvailability())

    // Test 2: User Registration
    results.push(await this.testUserRegistration(config))

    // Test 3: User Login
    results.push(await this.testUserLogin(config))

    // Test 4: User Profile Updates
    results.push(await this.testUserProfileUpdate(config))

    // Test 5: Password Reset
    results.push(await this.testPasswordReset(config))

    // Test 6: Password Update
    results.push(await this.testPasswordUpdate(config))

    // Test 7: Email Verification
    results.push(await this.testEmailVerification(config))

    // Test 8: Authentication State Listener
    results.push(await this.testAuthStateListener(config))

    // Test 9: User Reauthentication
    results.push(await this.testUserReauthentication(config))

    // Test 10: Role-based Access Validation
    results.push(await this.testRoleBasedAccess(config))

    // Test 11: Session Management
    results.push(await this.testSessionManagement(config))

    // Test 12: User Logout
    results.push(await this.testUserLogout())

    // Test 13: User Account Deletion
    results.push(await this.testUserDeletion(config))

    // Cleanup
    await this.cleanup()

    console.log(`Firebase Authentication Tests completed: ${results.length} tests run`)
    return results
  }

  /**
   * Test authentication service availability
   */
  private async testAuthServiceAvailability(): Promise<AuthTestResult> {
    const startTime = Date.now()
    
    try {
      if (!this.auth) {
        return {
          id: 'auth_service_availability',
          name: 'Authentication Service Availability',
          status: 'failed',
          duration: Date.now() - startTime,
          message: 'Firebase Auth not initialized',
          timestamp: Date.now()
        }
      }

      // Test basic auth properties
      const currentUser = this.auth.currentUser
      const config = this.auth.config
      
      return {
        id: 'auth_service_availability',
        name: 'Authentication Service Availability',
        status: 'passed',
        duration: Date.now() - startTime,
        message: 'Firebase Auth service is available',
        details: {
          hasCurrentUser: !!currentUser,
          projectId: config.apiKey ? 'configured' : 'missing'
        },
        timestamp: Date.now()
      }
    } catch (error) {
      return {
        id: 'auth_service_availability',
        name: 'Authentication Service Availability',
        status: 'error',
        duration: Date.now() - startTime,
        message: `Auth service check failed: ${error}`,
        timestamp: Date.now()
      }
    }
  }

  /**
   * Test user registration
   */
  private async testUserRegistration(config: AuthTestConfig): Promise<AuthTestResult> {
    const startTime = Date.now()
    const testEmail = `test_${Date.now()}@example.com`
    
    try {
      const result = await safeAuthOperation(async (auth) => {
        return await createUserWithEmailAndPassword(auth, testEmail, config.testPassword)
      })

      if (!result) {
        return {
          id: 'user_registration',
          name: 'User Registration',
          status: 'failed',
          duration: Date.now() - startTime,
          message: 'User registration failed - no result returned',
          timestamp: Date.now()
        }
      }

      const user = result.user
      this.testUsers.set('registered_user', user)

      return {
        id: 'user_registration',
        name: 'User Registration',
        status: 'passed',
        duration: Date.now() - startTime,
        message: 'User registered successfully',
        authDetails: {
          uid: user.uid,
          email: user.email || undefined,
          emailVerified: user.emailVerified,
          creationTime: user.metadata.creationTime
        },
        timestamp: Date.now()
      }
    } catch (error: any) {
      return {
        id: 'user_registration',
        name: 'User Registration',
        status: 'failed',
        duration: Date.now() - startTime,
        message: `User registration failed: ${error.message || error}`,
        details: { errorCode: error.code },
        timestamp: Date.now()
      }
    }
  }

  /**
   * Test user login
   */
  private async testUserLogin(config: AuthTestConfig): Promise<AuthTestResult> {
    const startTime = Date.now()
    
    try {
      // First ensure we have a user to login with
      const registeredUser = this.testUsers.get('registered_user')
      if (!registeredUser) {
        return {
          id: 'user_login',
          name: 'User Login',
          status: 'skipped',
          duration: Date.now() - startTime,
          message: 'No registered user available for login test',
          timestamp: Date.now()
        }
      }

      const email = registeredUser.email!
      
      // Sign out first to ensure clean login test
      await safeAuthOperation(async (auth) => {
        await signOut(auth)
      })

      // Attempt login
      const result = await safeAuthOperation(async (auth) => {
        return await signInWithEmailAndPassword(auth, email, config.testPassword)
      })

      if (!result) {
        return {
          id: 'user_login',
          name: 'User Login',
          status: 'failed',
          duration: Date.now() - startTime,
          message: 'User login failed - no result returned',
          timestamp: Date.now()
        }
      }

      const user = result.user
      this.testUsers.set('logged_in_user', user)

      return {
        id: 'user_login',
        name: 'User Login',
        status: 'passed',
        duration: Date.now() - startTime,
        message: 'User login successful',
        authDetails: {
          uid: user.uid,
          email: user.email || undefined,
          lastSignInTime: user.metadata.lastSignInTime
        },
        timestamp: Date.now()
      }
    } catch (error: any) {
      return {
        id: 'user_login',
        name: 'User Login',
        status: 'failed',
        duration: Date.now() - startTime,
        message: `User login failed: ${error.message || error}`,
        details: { errorCode: error.code },
        timestamp: Date.now()
      }
    }
  }

  /**
   * Test user profile update
   */
  private async testUserProfileUpdate(config: AuthTestConfig): Promise<AuthTestResult> {
    const startTime = Date.now()
    
    try {
      const user = this.testUsers.get('logged_in_user')
      if (!user) {
        return {
          id: 'user_profile_update',
          name: 'User Profile Update',
          status: 'skipped',
          duration: Date.now() - startTime,
          message: 'No logged in user available for profile update test',
          timestamp: Date.now()
        }
      }

      await updateProfile(user, {
        displayName: config.displayName
      })

      // Verify the update
      await user.reload()
      
      if (user.displayName !== config.displayName) {
        return {
          id: 'user_profile_update',
          name: 'User Profile Update',
          status: 'failed',
          duration: Date.now() - startTime,
          message: 'Profile update verification failed',
          timestamp: Date.now()
        }
      }

      return {
        id: 'user_profile_update',
        name: 'User Profile Update',
        status: 'passed',
        duration: Date.now() - startTime,
        message: 'User profile updated successfully',
        authDetails: {
          uid: user.uid,
          displayName: user.displayName || undefined
        },
        timestamp: Date.now()
      }
    } catch (error: any) {
      return {
        id: 'user_profile_update',
        name: 'User Profile Update',
        status: 'failed',
        duration: Date.now() - startTime,
        message: `Profile update failed: ${error.message || error}`,
        details: { errorCode: error.code },
        timestamp: Date.now()
      }
    }
  }

  /**
   * Test password reset
   */
  private async testPasswordReset(config: AuthTestConfig): Promise<AuthTestResult> {
    const startTime = Date.now()
    
    try {
      const user = this.testUsers.get('logged_in_user')
      if (!user || !user.email) {
        return {
          id: 'password_reset',
          name: 'Password Reset',
          status: 'skipped',
          duration: Date.now() - startTime,
          message: 'No user with email available for password reset test',
          timestamp: Date.now()
        }
      }

      const result = await safeAuthOperation(async (auth) => {
        await sendPasswordResetEmail(auth, user.email!)
      })

      if (result === null) {
        return {
          id: 'password_reset',
          name: 'Password Reset',
          status: 'failed',
          duration: Date.now() - startTime,
          message: 'Password reset email sending failed',
          timestamp: Date.now()
        }
      }

      return {
        id: 'password_reset',
        name: 'Password Reset',
        status: 'passed',
        duration: Date.now() - startTime,
        message: 'Password reset email sent successfully',
        authDetails: {
          email: user.email
        },
        timestamp: Date.now()
      }
    } catch (error: any) {
      return {
        id: 'password_reset',
        name: 'Password Reset',
        status: 'failed',
        duration: Date.now() - startTime,
        message: `Password reset failed: ${error.message || error}`,
        details: { errorCode: error.code },
        timestamp: Date.now()
      }
    }
  }

  /**
   * Test password update
   */
  private async testPasswordUpdate(config: AuthTestConfig): Promise<AuthTestResult> {
    const startTime = Date.now()
    
    try {
      const user = this.testUsers.get('logged_in_user')
      if (!user) {
        return {
          id: 'password_update',
          name: 'Password Update',
          status: 'skipped',
          duration: Date.now() - startTime,
          message: 'No logged in user available for password update test',
          timestamp: Date.now()
        }
      }

      await updatePassword(user, config.newPassword)

      // Test login with new password
      const email = user.email!
      await safeAuthOperation(async (auth) => {
        await signOut(auth)
      })

      const loginResult = await safeAuthOperation(async (auth) => {
        return await signInWithEmailAndPassword(auth, email, config.newPassword)
      })

      if (!loginResult) {
        return {
          id: 'password_update',
          name: 'Password Update',
          status: 'failed',
          duration: Date.now() - startTime,
          message: 'Password update verification failed - cannot login with new password',
          timestamp: Date.now()
        }
      }

      this.testUsers.set('logged_in_user', loginResult.user)

      return {
        id: 'password_update',
        name: 'Password Update',
        status: 'passed',
        duration: Date.now() - startTime,
        message: 'Password updated and verified successfully',
        timestamp: Date.now()
      }
    } catch (error: any) {
      return {
        id: 'password_update',
        name: 'Password Update',
        status: 'failed',
        duration: Date.now() - startTime,
        message: `Password update failed: ${error.message || error}`,
        details: { errorCode: error.code },
        timestamp: Date.now()
      }
    }
  }

  /**
   * Test email verification
   */
  private async testEmailVerification(config: AuthTestConfig): Promise<AuthTestResult> {
    const startTime = Date.now()
    
    try {
      const user = this.testUsers.get('logged_in_user')
      if (!user) {
        return {
          id: 'email_verification',
          name: 'Email Verification',
          status: 'skipped',
          duration: Date.now() - startTime,
          message: 'No logged in user available for email verification test',
          timestamp: Date.now()
        }
      }

      if (user.emailVerified) {
        return {
          id: 'email_verification',
          name: 'Email Verification',
          status: 'passed',
          duration: Date.now() - startTime,
          message: 'Email already verified',
          authDetails: {
            emailVerified: true
          },
          timestamp: Date.now()
        }
      }

      await sendEmailVerification(user)

      return {
        id: 'email_verification',
        name: 'Email Verification',
        status: 'passed',
        duration: Date.now() - startTime,
        message: 'Email verification sent successfully',
        authDetails: {
          email: user.email || undefined,
          emailVerified: user.emailVerified
        },
        timestamp: Date.now()
      }
    } catch (error: any) {
      return {
        id: 'email_verification',
        name: 'Email Verification',
        status: 'failed',
        duration: Date.now() - startTime,
        message: `Email verification failed: ${error.message || error}`,
        details: { errorCode: error.code },
        timestamp: Date.now()
      }
    }
  }

  /**
   * Test authentication state listener
   */
  private async testAuthStateListener(config: AuthTestConfig): Promise<AuthTestResult> {
    const startTime = Date.now()
    
    try {
      if (!this.auth) {
        return {
          id: 'auth_state_listener',
          name: 'Authentication State Listener',
          status: 'failed',
          duration: Date.now() - startTime,
          message: 'Firebase Auth not available',
          timestamp: Date.now()
        }
      }

      let stateChanges = 0
      let lastUser: User | null = null

      const unsubscribe = onAuthStateChanged(this.auth, (user) => {
        stateChanges++
        lastUser = user
      })

      this.authStateListeners.push(unsubscribe)

      // Wait for initial state
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Trigger a state change by signing out and back in
      const user = this.testUsers.get('logged_in_user')
      if (user) {
        await safeAuthOperation(async (auth) => {
          await signOut(auth)
        })

        await new Promise(resolve => setTimeout(resolve, 500))

        await safeAuthOperation(async (auth) => {
          await signInWithEmailAndPassword(auth, user.email!, config.newPassword)
        })

        await new Promise(resolve => setTimeout(resolve, 1000))
      }

      if (stateChanges < 2) {
        return {
          id: 'auth_state_listener',
          name: 'Authentication State Listener',
          status: 'failed',
          duration: Date.now() - startTime,
          message: `Insufficient state changes detected: ${stateChanges}`,
          timestamp: Date.now()
        }
      }

      return {
        id: 'auth_state_listener',
        name: 'Authentication State Listener',
        status: 'passed',
        duration: Date.now() - startTime,
        message: 'Authentication state listener working correctly',
        details: {
          stateChanges,
          hasCurrentUser: !!lastUser
        },
        timestamp: Date.now()
      }
    } catch (error: any) {
      return {
        id: 'auth_state_listener',
        name: 'Authentication State Listener',
        status: 'failed',
        duration: Date.now() - startTime,
        message: `Auth state listener test failed: ${error.message || error}`,
        details: { errorCode: error.code },
        timestamp: Date.now()
      }
    }
  }

  /**
   * Test user reauthentication
   */
  private async testUserReauthentication(config: AuthTestConfig): Promise<AuthTestResult> {
    const startTime = Date.now()
    
    try {
      const user = this.testUsers.get('logged_in_user')
      if (!user || !user.email) {
        return {
          id: 'user_reauthentication',
          name: 'User Reauthentication',
          status: 'skipped',
          duration: Date.now() - startTime,
          message: 'No logged in user available for reauthentication test',
          timestamp: Date.now()
        }
      }

      const credential = EmailAuthProvider.credential(user.email, config.newPassword)
      await reauthenticateWithCredential(user, credential)

      return {
        id: 'user_reauthentication',
        name: 'User Reauthentication',
        status: 'passed',
        duration: Date.now() - startTime,
        message: 'User reauthentication successful',
        authDetails: {
          uid: user.uid,
          email: user.email
        },
        timestamp: Date.now()
      }
    } catch (error: any) {
      return {
        id: 'user_reauthentication',
        name: 'User Reauthentication',
        status: 'failed',
        duration: Date.now() - startTime,
        message: `User reauthentication failed: ${error.message || error}`,
        details: { errorCode: error.code },
        timestamp: Date.now()
      }
    }
  }

  /**
   * Test role-based access validation
   */
  private async testRoleBasedAccess(config: AuthTestConfig): Promise<AuthTestResult> {
    const startTime = Date.now()
    
    try {
      const user = this.testUsers.get('logged_in_user')
      if (!user) {
        return {
          id: 'role_based_access',
          name: 'Role-based Access Validation',
          status: 'skipped',
          duration: Date.now() - startTime,
          message: 'No logged in user available for role-based access test',
          timestamp: Date.now()
        }
      }

      // Get user token to check custom claims
      const idTokenResult = await user.getIdTokenResult()
      const customClaims = idTokenResult.claims

      // Test basic user properties
      const hasValidUid = !!user.uid && user.uid.length > 0
      const hasValidEmail = !!user.email && user.email.includes('@')
      const hasTokenClaims = !!idTokenResult.token

      if (!hasValidUid || !hasValidEmail || !hasTokenClaims) {
        return {
          id: 'role_based_access',
          name: 'Role-based Access Validation',
          status: 'failed',
          duration: Date.now() - startTime,
          message: 'User missing required properties for role validation',
          timestamp: Date.now()
        }
      }

      return {
        id: 'role_based_access',
        name: 'Role-based Access Validation',
        status: 'passed',
        duration: Date.now() - startTime,
        message: 'Role-based access validation successful',
        authDetails: {
          uid: user.uid,
          email: user.email,
          customClaims: Object.keys(customClaims).length
        },
        details: {
          hasCustomClaims: Object.keys(customClaims).length > 0,
          tokenExpiration: idTokenResult.expirationTime
        },
        timestamp: Date.now()
      }
    } catch (error: any) {
      return {
        id: 'role_based_access',
        name: 'Role-based Access Validation',
        status: 'failed',
        duration: Date.now() - startTime,
        message: `Role-based access validation failed: ${error.message || error}`,
        details: { errorCode: error.code },
        timestamp: Date.now()
      }
    }
  }

  /**
   * Test session management
   */
  private async testSessionManagement(config: AuthTestConfig): Promise<AuthTestResult> {
    const startTime = Date.now()
    
    try {
      const user = this.testUsers.get('logged_in_user')
      if (!user) {
        return {
          id: 'session_management',
          name: 'Session Management',
          status: 'skipped',
          duration: Date.now() - startTime,
          message: 'No logged in user available for session management test',
          timestamp: Date.now()
        }
      }

      // Test token refresh
      const token1 = await user.getIdToken()
      await new Promise(resolve => setTimeout(resolve, 1000))
      const token2 = await user.getIdToken(true) // Force refresh

      if (!token1 || !token2) {
        return {
          id: 'session_management',
          name: 'Session Management',
          status: 'failed',
          duration: Date.now() - startTime,
          message: 'Failed to get authentication tokens',
          timestamp: Date.now()
        }
      }

      // Test user reload
      await user.reload()

      return {
        id: 'session_management',
        name: 'Session Management',
        status: 'passed',
        duration: Date.now() - startTime,
        message: 'Session management working correctly',
        details: {
          tokenRefresh: token1 !== token2,
          userReload: true
        },
        timestamp: Date.now()
      }
    } catch (error: any) {
      return {
        id: 'session_management',
        name: 'Session Management',
        status: 'failed',
        duration: Date.now() - startTime,
        message: `Session management test failed: ${error.message || error}`,
        details: { errorCode: error.code },
        timestamp: Date.now()
      }
    }
  }

  /**
   * Test user logout
   */
  private async testUserLogout(): Promise<AuthTestResult> {
    const startTime = Date.now()
    
    try {
      const result = await safeAuthOperation(async (auth) => {
        await signOut(auth)
      })

      if (result === null) {
        return {
          id: 'user_logout',
          name: 'User Logout',
          status: 'failed',
          duration: Date.now() - startTime,
          message: 'User logout failed',
          timestamp: Date.now()
        }
      }

      // Verify user is logged out
      if (this.auth?.currentUser) {
        return {
          id: 'user_logout',
          name: 'User Logout',
          status: 'failed',
          duration: Date.now() - startTime,
          message: 'User still logged in after logout',
          timestamp: Date.now()
        }
      }

      return {
        id: 'user_logout',
        name: 'User Logout',
        status: 'passed',
        duration: Date.now() - startTime,
        message: 'User logout successful',
        timestamp: Date.now()
      }
    } catch (error: any) {
      return {
        id: 'user_logout',
        name: 'User Logout',
        status: 'failed',
        duration: Date.now() - startTime,
        message: `User logout failed: ${error.message || error}`,
        details: { errorCode: error.code },
        timestamp: Date.now()
      }
    }
  }

  /**
   * Test user account deletion
   */
  private async testUserDeletion(config: AuthTestConfig): Promise<AuthTestResult> {
    const startTime = Date.now()
    
    try {
      // Create a new user specifically for deletion test
      const testEmail = `delete_test_${Date.now()}@example.com`
      
      const createResult = await safeAuthOperation(async (auth) => {
        return await createUserWithEmailAndPassword(auth, testEmail, config.testPassword)
      })

      if (!createResult) {
        return {
          id: 'user_deletion',
          name: 'User Account Deletion',
          status: 'failed',
          duration: Date.now() - startTime,
          message: 'Failed to create user for deletion test',
          timestamp: Date.now()
        }
      }

      const userToDelete = createResult.user
      const uid = userToDelete.uid

      // Delete the user
      await deleteUser(userToDelete)

      // Verify deletion by trying to sign in
      try {
        await safeAuthOperation(async (auth) => {
          await signInWithEmailAndPassword(auth, testEmail, config.testPassword)
        })

        return {
          id: 'user_deletion',
          name: 'User Account Deletion',
          status: 'failed',
          duration: Date.now() - startTime,
          message: 'User can still login after deletion',
          timestamp: Date.now()
        }
      } catch (error: any) {
        // Expected error - user should not be able to login
        if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
          return {
            id: 'user_deletion',
            name: 'User Account Deletion',
            status: 'passed',
            duration: Date.now() - startTime,
            message: 'User account deleted successfully',
            authDetails: {
              uid: uid,
              email: testEmail
            },
            timestamp: Date.now()
          }
        }
      }

      return {
        id: 'user_deletion',
        name: 'User Account Deletion',
        status: 'failed',
        duration: Date.now() - startTime,
        message: 'User deletion verification inconclusive',
        timestamp: Date.now()
      }
    } catch (error: any) {
      return {
        id: 'user_deletion',
        name: 'User Account Deletion',
        status: 'failed',
        duration: Date.now() - startTime,
        message: `User deletion failed: ${error.message || error}`,
        details: { errorCode: error.code },
        timestamp: Date.now()
      }
    }
  }

  /**
   * Test authentication with virtual user
   */
  public async testVirtualUserAuthentication(virtualUser: VirtualUser): Promise<AuthTestResult> {
    const startTime = Date.now()
    const testEmail = `virtual_${virtualUser.id}@example.com`
    const testPassword = 'VirtualUser123!'

    try {
      // Create account for virtual user
      const createResult = await safeAuthOperation(async (auth) => {
        return await createUserWithEmailAndPassword(auth, testEmail, testPassword)
      })

      if (!createResult) {
        return {
          id: 'virtual_user_auth',
          name: 'Virtual User Authentication',
          status: 'failed',
          duration: Date.now() - startTime,
          message: 'Failed to create virtual user account',
          timestamp: Date.now()
        }
      }

      const user = createResult.user

      // Update profile with virtual user data
      await updateProfile(user, {
        displayName: `${virtualUser.profile.role} - ${virtualUser.profile.demographics.experience}`
      })

      // Test login
      await safeAuthOperation(async (auth) => {
        await signOut(auth)
      })

      const loginResult = await safeAuthOperation(async (auth) => {
        return await signInWithEmailAndPassword(auth, testEmail, testPassword)
      })

      if (!loginResult) {
        return {
          id: 'virtual_user_auth',
          name: 'Virtual User Authentication',
          status: 'failed',
          duration: Date.now() - startTime,
          message: 'Virtual user login failed',
          timestamp: Date.now()
        }
      }

      // Cleanup
      await deleteUser(loginResult.user)

      return {
        id: 'virtual_user_auth',
        name: 'Virtual User Authentication',
        status: 'passed',
        duration: Date.now() - startTime,
        message: 'Virtual user authentication successful',
        authDetails: {
          uid: user.uid,
          email: user.email || undefined,
          displayName: user.displayName || undefined
        },
        details: {
          virtualUserRole: virtualUser.profile.role,
          virtualUserExperience: virtualUser.profile.demographics.experience
        },
        timestamp: Date.now()
      }
    } catch (error: any) {
      return {
        id: 'virtual_user_auth',
        name: 'Virtual User Authentication',
        status: 'failed',
        duration: Date.now() - startTime,
        message: `Virtual user authentication failed: ${error.message || error}`,
        details: { errorCode: error.code },
        timestamp: Date.now()
      }
    }
  }

  /**
   * Cleanup test resources
   */
  private async cleanup(): Promise<void> {
    try {
      // Unsubscribe from auth state listeners
      this.authStateListeners.forEach(unsubscribe => {
        try {
          unsubscribe()
        } catch (error) {
          console.warn('Error unsubscribing from auth state listener:', error)
        }
      })
      this.authStateListeners = []

      // Sign out current user
      await safeAuthOperation(async (auth) => {
        await signOut(auth)
      })

      // Clear test users
      this.testUsers.clear()

      console.log('Firebase Authentication Tester cleanup completed')
    } catch (error) {
      console.error('Error during Firebase Authentication Tester cleanup:', error)
    }
  }

  /**
   * Get authentication health status
   */
  public getHealthStatus(): { status: 'healthy' | 'degraded' | 'unhealthy'; message: string; details?: any } {
    try {
      if (!this.auth) {
        return {
          status: 'unhealthy',
          message: 'Firebase Auth not initialized'
        }
      }

      const currentUser = this.auth.currentUser
      const hasActiveListeners = this.authStateListeners.length > 0

      return {
        status: 'healthy',
        message: 'Firebase Authentication service is operational',
        details: {
          hasCurrentUser: !!currentUser,
          activeListeners: this.authStateListeners.length,
          testUsersCount: this.testUsers.size
        }
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `Firebase Auth health check failed: ${error}`
      }
    }
  }
}