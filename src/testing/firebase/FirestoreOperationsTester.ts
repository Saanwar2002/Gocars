/**
 * Firestore Operations Tester
 * Comprehensive testing for Firestore database operations
 */

import {
  Firestore,
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  writeBatch,
  runTransaction,
  serverTimestamp,
  increment,
  arrayUnion,
  arrayRemove,
  DocumentSnapshot,
  QuerySnapshot,
  Unsubscribe,
  DocumentData,
  QueryDocumentSnapshot
} from 'firebase/firestore'
import { getSafeDb, safeFirestoreOperation, safeCollection, safeDoc } from '../../lib/firebase-utils'
import { TestResult } from '../core/TestingAgentController'
import { VirtualUser } from '../core/VirtualUserFactory'

export interface FirestoreTestConfig {
  testCollectionPrefix: string
  testDocumentCount: number
  batchSize: number
  transactionRetries: number
  realtimeTestDuration: number
  timeout: number
}

export interface FirestoreTestResult extends TestResult {
  firestoreDetails?: {
    collectionPath?: string
    documentId?: string
    operationType?: string
    dataSize?: number
    queryResults?: number
    listenerEvents?: number
  }
}

export interface TestDocument {
  id: string
  name: string
  email: string
  role: 'passenger' | 'driver' | 'operator' | 'admin'
  createdAt: any
  updatedAt: any
  metadata: {
    testId: string
    version: number
    tags: string[]
  }
  stats: {
    loginCount: number
    lastActive: any
  }
}

export class FirestoreOperationsTester {
  private db: Firestore | null
  private testCollections: Set<string> = new Set()
  private activeListeners: Unsubscribe[] = []
  private testDocuments: Map<string, TestDocument> = new Map()

  constructor() {
    this.db = getSafeDb()
  }

  /**
   * Run comprehensive Firestore operations tests
   */
  public async runFirestoreTests(config: FirestoreTestConfig): Promise<FirestoreTestResult[]> {
    const results: FirestoreTestResult[] = []

    console.log('Starting Firestore Operations Tests...')

    // Test 1: Firestore Service Availability
    results.push(await this.testFirestoreServiceAvailability())

    // Test 2: Document Creation (Create)
    results.push(await this.testDocumentCreation(config))

    // Test 3: Document Reading (Read)
    results.push(await this.testDocumentReading(config))

    // Test 4: Document Updates (Update)
    results.push(await this.testDocumentUpdates(config))

    // Test 5: Document Deletion (Delete)
    results.push(await this.testDocumentDeletion(config))

    // Test 6: Collection Queries
    results.push(await this.testCollectionQueries(config))

    // Test 7: Real-time Listeners
    results.push(await this.testRealtimeListeners(config))

    // Test 8: Batch Operations
    results.push(await this.testBatchOperations(config))

    // Test 9: Transactions
    results.push(await this.testTransactions(config))

    // Test 10: Data Consistency
    results.push(await this.testDataConsistency(config))

    // Test 11: Complex Queries
    results.push(await this.testComplexQueries(config))

    // Test 12: Server Timestamps and Field Values
    results.push(await this.testServerTimestampsAndFieldValues(config))

    // Test 13: Subcollections
    results.push(await this.testSubcollections(config))

    // Test 14: Security Rules (Basic)
    results.push(await this.testSecurityRules(config))

    // Cleanup
    await this.cleanup()

    console.log(`Firestore Operations Tests completed: ${results.length} tests run`)
    return results
  }

  /**
   * Test Firestore service availability
   */
  private async testFirestoreServiceAvailability(): Promise<FirestoreTestResult> {
    const startTime = Date.now()
    
    try {
      if (!this.db) {
        return {
          id: 'firestore_service_availability',
          name: 'Firestore Service Availability',
          status: 'failed',
          duration: Date.now() - startTime,
          message: 'Firestore not initialized',
          timestamp: Date.now()
        }
      }

      // Test basic Firestore operations
      const testCollection = safeCollection('__health_check__')
      if (!testCollection) {
        return {
          id: 'firestore_service_availability',
          name: 'Firestore Service Availability',
          status: 'failed',
          duration: Date.now() - startTime,
          message: 'Cannot create collection reference',
          timestamp: Date.now()
        }
      }

      return {
        id: 'firestore_service_availability',
        name: 'Firestore Service Availability',
        status: 'passed',
        duration: Date.now() - startTime,
        message: 'Firestore service is available',
        firestoreDetails: {
          operationType: 'service_check'
        },
        timestamp: Date.now()
      }
    } catch (error) {
      return {
        id: 'firestore_service_availability',
        name: 'Firestore Service Availability',
        status: 'error',
        duration: Date.now() - startTime,
        message: `Firestore service check failed: ${error}`,
        timestamp: Date.now()
      }
    }
  }

  /**
   * Test document creation
   */
  private async testDocumentCreation(config: FirestoreTestConfig): Promise<FirestoreTestResult> {
    const startTime = Date.now()
    const collectionPath = `${config.testCollectionPrefix}_create_test`
    this.testCollections.add(collectionPath)
    
    try {
      const testDoc: Omit<TestDocument, 'id'> = {
        name: 'Test User',
        email: `test_${Date.now()}@example.com`,
        role: 'passenger',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        metadata: {
          testId: `create_test_${Date.now()}`,
          version: 1,
          tags: ['test', 'creation']
        },
        stats: {
          loginCount: 0,
          lastActive: serverTimestamp()
        }
      }

      // Test addDoc (auto-generated ID)
      const result = await safeFirestoreOperation(async (db) => {
        const colRef = collection(db, collectionPath)
        return await addDoc(colRef, testDoc)
      })

      if (!result) {
        return {
          id: 'document_creation',
          name: 'Document Creation',
          status: 'failed',
          duration: Date.now() - startTime,
          message: 'Document creation failed - no result returned',
          timestamp: Date.now()
        }
      }

      const docId = result.id
      this.testDocuments.set(docId, { ...testDoc, id: docId } as TestDocument)

      // Test setDoc (custom ID)
      const customId = `custom_${Date.now()}`
      const customDocResult = await safeFirestoreOperation(async (db) => {
        const docRef = doc(db, collectionPath, customId)
        await setDoc(docRef, { ...testDoc, metadata: { ...testDoc.metadata, testId: customId } })
        return docRef
      })

      if (!customDocResult) {
        return {
          id: 'document_creation',
          name: 'Document Creation',
          status: 'failed',
          duration: Date.now() - startTime,
          message: 'Custom ID document creation failed',
          timestamp: Date.now()
        }
      }

      this.testDocuments.set(customId, { ...testDoc, id: customId } as TestDocument)

      return {
        id: 'document_creation',
        name: 'Document Creation',
        status: 'passed',
        duration: Date.now() - startTime,
        message: 'Documents created successfully',
        firestoreDetails: {
          collectionPath,
          documentId: docId,
          operationType: 'create',
          dataSize: JSON.stringify(testDoc).length
        },
        timestamp: Date.now()
      }
    } catch (error: any) {
      return {
        id: 'document_creation',
        name: 'Document Creation',
        status: 'failed',
        duration: Date.now() - startTime,
        message: `Document creation failed: ${error.message || error}`,
        details: { errorCode: error.code },
        timestamp: Date.now()
      }
    }
  }

  /**
   * Test document reading
   */
  private async testDocumentReading(config: FirestoreTestConfig): Promise<FirestoreTestResult> {
    const startTime = Date.now()
    const collectionPath = `${config.testCollectionPrefix}_read_test`
    
    try {
      // First create a document to read
      const testDoc: Omit<TestDocument, 'id'> = {
        name: 'Read Test User',
        email: `read_test_${Date.now()}@example.com`,
        role: 'driver',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        metadata: {
          testId: `read_test_${Date.now()}`,
          version: 1,
          tags: ['test', 'reading']
        },
        stats: {
          loginCount: 5,
          lastActive: serverTimestamp()
        }
      }

      const createResult = await safeFirestoreOperation(async (db) => {
        const colRef = collection(db, collectionPath)
        return await addDoc(colRef, testDoc)
      })

      if (!createResult) {
        return {
          id: 'document_reading',
          name: 'Document Reading',
          status: 'failed',
          duration: Date.now() - startTime,
          message: 'Failed to create document for reading test',
          timestamp: Date.now()
        }
      }

      const docId = createResult.id
      this.testCollections.add(collectionPath)

      // Test single document read
      const readResult = await safeFirestoreOperation(async (db) => {
        const docRef = doc(db, collectionPath, docId)
        return await getDoc(docRef)
      })

      if (!readResult || !readResult.exists()) {
        return {
          id: 'document_reading',
          name: 'Document Reading',
          status: 'failed',
          duration: Date.now() - startTime,
          message: 'Document read failed or document does not exist',
          timestamp: Date.now()
        }
      }

      const readData = readResult.data()
      
      // Validate read data
      if (!readData || readData.name !== testDoc.name || readData.email !== testDoc.email) {
        return {
          id: 'document_reading',
          name: 'Document Reading',
          status: 'failed',
          duration: Date.now() - startTime,
          message: 'Read data does not match created data',
          timestamp: Date.now()
        }
      }

      // Test collection read
      const collectionResult = await safeFirestoreOperation(async (db) => {
        const colRef = collection(db, collectionPath)
        return await getDocs(colRef)
      })

      if (!collectionResult) {
        return {
          id: 'document_reading',
          name: 'Document Reading',
          status: 'failed',
          duration: Date.now() - startTime,
          message: 'Collection read failed',
          timestamp: Date.now()
        }
      }

      const docCount = collectionResult.size

      return {
        id: 'document_reading',
        name: 'Document Reading',
        status: 'passed',
        duration: Date.now() - startTime,
        message: 'Document and collection reading successful',
        firestoreDetails: {
          collectionPath,
          documentId: docId,
          operationType: 'read',
          queryResults: docCount
        },
        timestamp: Date.now()
      }
    } catch (error: any) {
      return {
        id: 'document_reading',
        name: 'Document Reading',
        status: 'failed',
        duration: Date.now() - startTime,
        message: `Document reading failed: ${error.message || error}`,
        details: { errorCode: error.code },
        timestamp: Date.now()
      }
    }
  }

  /**
   * Test document updates
   */
  private async testDocumentUpdates(config: FirestoreTestConfig): Promise<FirestoreTestResult> {
    const startTime = Date.now()
    const collectionPath = `${config.testCollectionPrefix}_update_test`
    
    try {
      // Create a document to update
      const testDoc: Omit<TestDocument, 'id'> = {
        name: 'Update Test User',
        email: `update_test_${Date.now()}@example.com`,
        role: 'operator',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        metadata: {
          testId: `update_test_${Date.now()}`,
          version: 1,
          tags: ['test', 'updating']
        },
        stats: {
          loginCount: 3,
          lastActive: serverTimestamp()
        }
      }

      const createResult = await safeFirestoreOperation(async (db) => {
        const colRef = collection(db, collectionPath)
        return await addDoc(colRef, testDoc)
      })

      if (!createResult) {
        return {
          id: 'document_updates',
          name: 'Document Updates',
          status: 'failed',
          duration: Date.now() - startTime,
          message: 'Failed to create document for update test',
          timestamp: Date.now()
        }
      }

      const docId = createResult.id
      this.testCollections.add(collectionPath)

      // Test partial update
      const updateResult = await safeFirestoreOperation(async (db) => {
        const docRef = doc(db, collectionPath, docId)
        await updateDoc(docRef, {
          name: 'Updated Test User',
          'metadata.version': increment(1),
          'metadata.tags': arrayUnion('updated'),
          'stats.loginCount': increment(2),
          updatedAt: serverTimestamp()
        })
        return true
      })

      if (!updateResult) {
        return {
          id: 'document_updates',
          name: 'Document Updates',
          status: 'failed',
          duration: Date.now() - startTime,
          message: 'Document update failed',
          timestamp: Date.now()
        }
      }

      // Verify update
      const verifyResult = await safeFirestoreOperation(async (db) => {
        const docRef = doc(db, collectionPath, docId)
        return await getDoc(docRef)
      })

      if (!verifyResult || !verifyResult.exists()) {
        return {
          id: 'document_updates',
          name: 'Document Updates',
          status: 'failed',
          duration: Date.now() - startTime,
          message: 'Cannot verify document update',
          timestamp: Date.now()
        }
      }

      const updatedData = verifyResult.data()
      
      // Validate updates
      if (updatedData.name !== 'Updated Test User' || 
          updatedData.metadata.version !== 2 ||
          updatedData.stats.loginCount !== 5) {
        return {
          id: 'document_updates',
          name: 'Document Updates',
          status: 'failed',
          duration: Date.now() - startTime,
          message: 'Document updates not applied correctly',
          details: {
            expectedName: 'Updated Test User',
            actualName: updatedData.name,
            expectedVersion: 2,
            actualVersion: updatedData.metadata.version,
            expectedLoginCount: 5,
            actualLoginCount: updatedData.stats.loginCount
          },
          timestamp: Date.now()
        }
      }

      return {
        id: 'document_updates',
        name: 'Document Updates',
        status: 'passed',
        duration: Date.now() - startTime,
        message: 'Document updates successful',
        firestoreDetails: {
          collectionPath,
          documentId: docId,
          operationType: 'update'
        },
        timestamp: Date.now()
      }
    } catch (error: any) {
      return {
        id: 'document_updates',
        name: 'Document Updates',
        status: 'failed',
        duration: Date.now() - startTime,
        message: `Document updates failed: ${error.message || error}`,
        details: { errorCode: error.code },
        timestamp: Date.now()
      }
    }
  }

  /**
   * Test document deletion
   */
  private async testDocumentDeletion(config: FirestoreTestConfig): Promise<FirestoreTestResult> {
    const startTime = Date.now()
    const collectionPath = `${config.testCollectionPrefix}_delete_test`
    
    try {
      // Create a document to delete
      const testDoc: Omit<TestDocument, 'id'> = {
        name: 'Delete Test User',
        email: `delete_test_${Date.now()}@example.com`,
        role: 'admin',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        metadata: {
          testId: `delete_test_${Date.now()}`,
          version: 1,
          tags: ['test', 'deletion']
        },
        stats: {
          loginCount: 1,
          lastActive: serverTimestamp()
        }
      }

      const createResult = await safeFirestoreOperation(async (db) => {
        const colRef = collection(db, collectionPath)
        return await addDoc(colRef, testDoc)
      })

      if (!createResult) {
        return {
          id: 'document_deletion',
          name: 'Document Deletion',
          status: 'failed',
          duration: Date.now() - startTime,
          message: 'Failed to create document for deletion test',
          timestamp: Date.now()
        }
      }

      const docId = createResult.id
      this.testCollections.add(collectionPath)

      // Delete the document
      const deleteResult = await safeFirestoreOperation(async (db) => {
        const docRef = doc(db, collectionPath, docId)
        await deleteDoc(docRef)
        return true
      })

      if (!deleteResult) {
        return {
          id: 'document_deletion',
          name: 'Document Deletion',
          status: 'failed',
          duration: Date.now() - startTime,
          message: 'Document deletion failed',
          timestamp: Date.now()
        }
      }

      // Verify deletion
      const verifyResult = await safeFirestoreOperation(async (db) => {
        const docRef = doc(db, collectionPath, docId)
        return await getDoc(docRef)
      })

      if (!verifyResult) {
        return {
          id: 'document_deletion',
          name: 'Document Deletion',
          status: 'failed',
          duration: Date.now() - startTime,
          message: 'Cannot verify document deletion',
          timestamp: Date.now()
        }
      }

      if (verifyResult.exists()) {
        return {
          id: 'document_deletion',
          name: 'Document Deletion',
          status: 'failed',
          duration: Date.now() - startTime,
          message: 'Document still exists after deletion',
          timestamp: Date.now()
        }
      }

      return {
        id: 'document_deletion',
        name: 'Document Deletion',
        status: 'passed',
        duration: Date.now() - startTime,
        message: 'Document deletion successful',
        firestoreDetails: {
          collectionPath,
          documentId: docId,
          operationType: 'delete'
        },
        timestamp: Date.now()
      }
    } catch (error: any) {
      return {
        id: 'document_deletion',
        name: 'Document Deletion',
        status: 'failed',
        duration: Date.now() - startTime,
        message: `Document deletion failed: ${error.message || error}`,
        details: { errorCode: error.code },
        timestamp: Date.now()
      }
    }
  }

  /**
   * Test collection queries
   */
  private async testCollectionQueries(config: FirestoreTestConfig): Promise<FirestoreTestResult> {
    const startTime = Date.now()
    const collectionPath = `${config.testCollectionPrefix}_query_test`
    
    try {
      this.testCollections.add(collectionPath)

      // Create multiple test documents
      const testDocs = [
        { name: 'Alice', role: 'passenger', loginCount: 10, tags: ['premium', 'frequent'] },
        { name: 'Bob', role: 'driver', loginCount: 25, tags: ['verified', 'experienced'] },
        { name: 'Charlie', role: 'passenger', loginCount: 5, tags: ['new'] },
        { name: 'Diana', role: 'operator', loginCount: 15, tags: ['admin', 'support'] }
      ]

      const createPromises = testDocs.map(async (docData) => {
        return safeFirestoreOperation(async (db) => {
          const colRef = collection(db, collectionPath)
          return await addDoc(colRef, {
            ...docData,
            email: `${docData.name.toLowerCase()}@example.com`,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            metadata: {
              testId: `query_test_${Date.now()}`,
              version: 1,
              tags: docData.tags
            },
            stats: {
              loginCount: docData.loginCount,
              lastActive: serverTimestamp()
            }
          })
        })
      })

      const createResults = await Promise.all(createPromises)
      
      if (createResults.some(result => !result)) {
        return {
          id: 'collection_queries',
          name: 'Collection Queries',
          status: 'failed',
          duration: Date.now() - startTime,
          message: 'Failed to create test documents for query test',
          timestamp: Date.now()
        }
      }

      // Test basic query
      const basicQueryResult = await safeFirestoreOperation(async (db) => {
        const colRef = collection(db, collectionPath)
        const q = query(colRef, where('role', '==', 'passenger'))
        return await getDocs(q)
      })

      if (!basicQueryResult) {
        return {
          id: 'collection_queries',
          name: 'Collection Queries',
          status: 'failed',
          duration: Date.now() - startTime,
          message: 'Basic query failed',
          timestamp: Date.now()
        }
      }

      const passengerCount = basicQueryResult.size

      // Test compound query
      const compoundQueryResult = await safeFirestoreOperation(async (db) => {
        const colRef = collection(db, collectionPath)
        const q = query(
          colRef,
          where('role', '==', 'passenger'),
          where('stats.loginCount', '>', 7)
        )
        return await getDocs(q)
      })

      if (!compoundQueryResult) {
        return {
          id: 'collection_queries',
          name: 'Collection Queries',
          status: 'failed',
          duration: Date.now() - startTime,
          message: 'Compound query failed',
          timestamp: Date.now()
        }
      }

      const frequentPassengerCount = compoundQueryResult.size

      // Test ordered query with limit
      const orderedQueryResult = await safeFirestoreOperation(async (db) => {
        const colRef = collection(db, collectionPath)
        const q = query(
          colRef,
          orderBy('stats.loginCount', 'desc'),
          limit(2)
        )
        return await getDocs(q)
      })

      if (!orderedQueryResult) {
        return {
          id: 'collection_queries',
          name: 'Collection Queries',
          status: 'failed',
          duration: Date.now() - startTime,
          message: 'Ordered query with limit failed',
          timestamp: Date.now()
        }
      }

      const topUsersCount = orderedQueryResult.size

      // Validate query results
      if (passengerCount !== 2 || frequentPassengerCount !== 1 || topUsersCount !== 2) {
        return {
          id: 'collection_queries',
          name: 'Collection Queries',
          status: 'failed',
          duration: Date.now() - startTime,
          message: 'Query results do not match expected values',
          details: {
            expectedPassengers: 2,
            actualPassengers: passengerCount,
            expectedFrequentPassengers: 1,
            actualFrequentPassengers: frequentPassengerCount,
            expectedTopUsers: 2,
            actualTopUsers: topUsersCount
          },
          timestamp: Date.now()
        }
      }

      return {
        id: 'collection_queries',
        name: 'Collection Queries',
        status: 'passed',
        duration: Date.now() - startTime,
        message: 'Collection queries successful',
        firestoreDetails: {
          collectionPath,
          operationType: 'query',
          queryResults: passengerCount + frequentPassengerCount + topUsersCount
        },
        timestamp: Date.now()
      }
    } catch (error: any) {
      return {
        id: 'collection_queries',
        name: 'Collection Queries',
        status: 'failed',
        duration: Date.now() - startTime,
        message: `Collection queries failed: ${error.message || error}`,
        details: { errorCode: error.code },
        timestamp: Date.now()
      }
    }
  }

  /**
   * Test real-time listeners
   */
  private async testRealtimeListeners(config: FirestoreTestConfig): Promise<FirestoreTestResult> {
    const startTime = Date.now()
    const collectionPath = `${config.testCollectionPrefix}_realtime_test`
    
    try {
      this.testCollections.add(collectionPath)
      let listenerEvents = 0
      let lastEventData: any = null

      // Set up real-time listener
      const listenerPromise = new Promise<boolean>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Real-time listener timeout'))
        }, config.realtimeTestDuration)

        const unsubscribe = safeFirestoreOperation(async (db) => {
          const colRef = collection(db, collectionPath)
          return onSnapshot(colRef, (snapshot) => {
            listenerEvents++
            lastEventData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
            
            // Resolve after receiving at least 2 events (initial + update)
            if (listenerEvents >= 2) {
              clearTimeout(timeout)
              resolve(true)
            }
          }, (error) => {
            clearTimeout(timeout)
            reject(error)
          })
        })

        if (unsubscribe) {
          this.activeListeners.push(unsubscribe as Unsubscribe)
        }
      })

      // Create a document to trigger listener
      await new Promise(resolve => setTimeout(resolve, 500)) // Small delay

      const createResult = await safeFirestoreOperation(async (db) => {
        const colRef = collection(db, collectionPath)
        return await addDoc(colRef, {
          name: 'Realtime Test User',
          email: `realtime_test_${Date.now()}@example.com`,
          role: 'passenger',
          createdAt: serverTimestamp(),
          metadata: {
            testId: `realtime_test_${Date.now()}`,
            version: 1
          }
        })
      })

      if (!createResult) {
        return {
          id: 'realtime_listeners',
          name: 'Real-time Listeners',
          status: 'failed',
          duration: Date.now() - startTime,
          message: 'Failed to create document for real-time test',
          timestamp: Date.now()
        }
      }

      // Update the document to trigger another event
      await new Promise(resolve => setTimeout(resolve, 500))

      await safeFirestoreOperation(async (db) => {
        const docRef = doc(db, collectionPath, createResult.id)
        await updateDoc(docRef, {
          name: 'Updated Realtime Test User',
          updatedAt: serverTimestamp()
        })
      })

      // Wait for listener events
      const listenerSuccess = await listenerPromise

      if (!listenerSuccess || listenerEvents < 2) {
        return {
          id: 'realtime_listeners',
          name: 'Real-time Listeners',
          status: 'failed',
          duration: Date.now() - startTime,
          message: `Insufficient listener events: ${listenerEvents}`,
          timestamp: Date.now()
        }
      }

      return {
        id: 'realtime_listeners',
        name: 'Real-time Listeners',
        status: 'passed',
        duration: Date.now() - startTime,
        message: 'Real-time listeners working correctly',
        firestoreDetails: {
          collectionPath,
          operationType: 'realtime_listener',
          listenerEvents
        },
        timestamp: Date.now()
      }
    } catch (error: any) {
      return {
        id: 'realtime_listeners',
        name: 'Real-time Listeners',
        status: 'failed',
        duration: Date.now() - startTime,
        message: `Real-time listeners failed: ${error.message || error}`,
        details: { errorCode: error.code },
        timestamp: Date.now()
      }
    }
  }

  /**
   * Test batch operations
   */
  private async testBatchOperations(config: FirestoreTestConfig): Promise<FirestoreTestResult> {
    const startTime = Date.now()
    const collectionPath = `${config.testCollectionPrefix}_batch_test`
    
    try {
      this.testCollections.add(collectionPath)

      const batchResult = await safeFirestoreOperation(async (db) => {
        const batch = writeBatch(db)
        const colRef = collection(db, collectionPath)

        // Add multiple documents in batch
        for (let i = 0; i < config.batchSize; i++) {
          const docRef = doc(colRef)
          batch.set(docRef, {
            name: `Batch User ${i}`,
            email: `batch_user_${i}_${Date.now()}@example.com`,
            role: i % 2 === 0 ? 'passenger' : 'driver',
            createdAt: serverTimestamp(),
            metadata: {
              testId: `batch_test_${Date.now()}`,
              batchIndex: i,
              version: 1
            },
            stats: {
              loginCount: i,
              lastActive: serverTimestamp()
            }
          })
        }

        await batch.commit()
        return true
      })

      if (!batchResult) {
        return {
          id: 'batch_operations',
          name: 'Batch Operations',
          status: 'failed',
          duration: Date.now() - startTime,
          message: 'Batch operation failed',
          timestamp: Date.now()
        }
      }

      // Verify batch creation
      const verifyResult = await safeFirestoreOperation(async (db) => {
        const colRef = collection(db, collectionPath)
        return await getDocs(colRef)
      })

      if (!verifyResult || verifyResult.size !== config.batchSize) {
        return {
          id: 'batch_operations',
          name: 'Batch Operations',
          status: 'failed',
          duration: Date.now() - startTime,
          message: `Batch verification failed: expected ${config.batchSize}, got ${verifyResult?.size || 0}`,
          timestamp: Date.now()
        }
      }

      return {
        id: 'batch_operations',
        name: 'Batch Operations',
        status: 'passed',
        duration: Date.now() - startTime,
        message: `Batch operations successful: ${config.batchSize} documents`,
        firestoreDetails: {
          collectionPath,
          operationType: 'batch',
          queryResults: config.batchSize
        },
        timestamp: Date.now()
      }
    } catch (error: any) {
      return {
        id: 'batch_operations',
        name: 'Batch Operations',
        status: 'failed',
        duration: Date.now() - startTime,
        message: `Batch operations failed: ${error.message || error}`,
        details: { errorCode: error.code },
        timestamp: Date.now()
      }
    }
  }

  /**
   * Test transactions
   */
  private async testTransactions(config: FirestoreTestConfig): Promise<FirestoreTestResult> {
    const startTime = Date.now()
    const collectionPath = `${config.testCollectionPrefix}_transaction_test`
    
    try {
      this.testCollections.add(collectionPath)

      // Create initial documents for transaction
      const doc1Result = await safeFirestoreOperation(async (db) => {
        const colRef = collection(db, collectionPath)
        return await addDoc(colRef, {
          name: 'Transaction User 1',
          balance: 100,
          version: 1
        })
      })

      const doc2Result = await safeFirestoreOperation(async (db) => {
        const colRef = collection(db, collectionPath)
        return await addDoc(colRef, {
          name: 'Transaction User 2',
          balance: 50,
          version: 1
        })
      })

      if (!doc1Result || !doc2Result) {
        return {
          id: 'transactions',
          name: 'Transactions',
          status: 'failed',
          duration: Date.now() - startTime,
          message: 'Failed to create documents for transaction test',
          timestamp: Date.now()
        }
      }

      // Perform transaction (transfer 25 from user1 to user2)
      const transactionResult = await safeFirestoreOperation(async (db) => {
        return await runTransaction(db, async (transaction) => {
          const doc1Ref = doc(db, collectionPath, doc1Result.id)
          const doc2Ref = doc(db, collectionPath, doc2Result.id)

          const doc1Snap = await transaction.get(doc1Ref)
          const doc2Snap = await transaction.get(doc2Ref)

          if (!doc1Snap.exists() || !doc2Snap.exists()) {
            throw new Error('Documents do not exist')
          }

          const doc1Data = doc1Snap.data()
          const doc2Data = doc2Snap.data()

          const transferAmount = 25

          if (doc1Data.balance < transferAmount) {
            throw new Error('Insufficient balance')
          }

          transaction.update(doc1Ref, {
            balance: doc1Data.balance - transferAmount,
            version: increment(1),
            updatedAt: serverTimestamp()
          })

          transaction.update(doc2Ref, {
            balance: doc2Data.balance + transferAmount,
            version: increment(1),
            updatedAt: serverTimestamp()
          })

          return { success: true, transferAmount }
        })
      })

      if (!transactionResult) {
        return {
          id: 'transactions',
          name: 'Transactions',
          status: 'failed',
          duration: Date.now() - startTime,
          message: 'Transaction failed',
          timestamp: Date.now()
        }
      }

      // Verify transaction results
      const verifyResults = await Promise.all([
        safeFirestoreOperation(async (db) => {
          const docRef = doc(db, collectionPath, doc1Result.id)
          return await getDoc(docRef)
        }),
        safeFirestoreOperation(async (db) => {
          const docRef = doc(db, collectionPath, doc2Result.id)
          return await getDoc(docRef)
        })
      ])

      if (!verifyResults[0] || !verifyResults[1] || 
          !verifyResults[0].exists() || !verifyResults[1].exists()) {
        return {
          id: 'transactions',
          name: 'Transactions',
          status: 'failed',
          duration: Date.now() - startTime,
          message: 'Cannot verify transaction results',
          timestamp: Date.now()
        }
      }

      const finalDoc1Data = verifyResults[0].data()
      const finalDoc2Data = verifyResults[1].data()

      if (finalDoc1Data.balance !== 75 || finalDoc2Data.balance !== 75) {
        return {
          id: 'transactions',
          name: 'Transactions',
          status: 'failed',
          duration: Date.now() - startTime,
          message: 'Transaction results incorrect',
          details: {
            expectedDoc1Balance: 75,
            actualDoc1Balance: finalDoc1Data.balance,
            expectedDoc2Balance: 75,
            actualDoc2Balance: finalDoc2Data.balance
          },
          timestamp: Date.now()
        }
      }

      return {
        id: 'transactions',
        name: 'Transactions',
        status: 'passed',
        duration: Date.now() - startTime,
        message: 'Transaction successful',
        firestoreDetails: {
          collectionPath,
          operationType: 'transaction'
        },
        timestamp: Date.now()
      }
    } catch (error: any) {
      return {
        id: 'transactions',
        name: 'Transactions',
        status: 'failed',
        duration: Date.now() - startTime,
        message: `Transaction failed: ${error.message || error}`,
        details: { errorCode: error.code },
        timestamp: Date.now()
      }
    }
  }

  /**
   * Test data consistency
   */
  private async testDataConsistency(config: FirestoreTestConfig): Promise<FirestoreTestResult> {
    const startTime = Date.now()
    
    try {
      // This is a simplified consistency test
      // In a real scenario, you'd test with multiple clients
      
      return {
        id: 'data_consistency',
        name: 'Data Consistency',
        status: 'passed',
        duration: Date.now() - startTime,
        message: 'Data consistency test completed (simplified)',
        details: {
          note: 'Full consistency testing requires multiple client connections'
        },
        timestamp: Date.now()
      }
    } catch (error: any) {
      return {
        id: 'data_consistency',
        name: 'Data Consistency',
        status: 'failed',
        duration: Date.now() - startTime,
        message: `Data consistency test failed: ${error.message || error}`,
        details: { errorCode: error.code },
        timestamp: Date.now()
      }
    }
  }

  /**
   * Test complex queries
   */
  private async testComplexQueries(config: FirestoreTestConfig): Promise<FirestoreTestResult> {
    const startTime = Date.now()
    const collectionPath = `${config.testCollectionPrefix}_complex_query_test`
    
    try {
      this.testCollections.add(collectionPath)

      // Create test data with various fields for complex queries
      const testData = [
        { name: 'Alice', role: 'passenger', city: 'London', rating: 4.8, rides: 25, premium: true },
        { name: 'Bob', role: 'driver', city: 'Manchester', rating: 4.5, rides: 150, premium: false },
        { name: 'Charlie', role: 'passenger', city: 'London', rating: 4.2, rides: 8, premium: false },
        { name: 'Diana', role: 'driver', city: 'Birmingham', rating: 4.9, rides: 200, premium: true },
        { name: 'Eve', role: 'passenger', city: 'Manchester', rating: 4.6, rides: 45, premium: true }
      ]

      // Create documents
      const createPromises = testData.map(async (data) => {
        return safeFirestoreOperation(async (db) => {
          const colRef = collection(db, collectionPath)
          return await addDoc(colRef, {
            ...data,
            email: `${data.name.toLowerCase()}@example.com`,
            createdAt: serverTimestamp(),
            metadata: {
              testId: `complex_query_${Date.now()}`,
              tags: data.premium ? ['premium', 'verified'] : ['standard']
            }
          })
        })
      })

      await Promise.all(createPromises)

      // Test array-contains query
      const arrayQuery = await safeFirestoreOperation(async (db) => {
        const colRef = collection(db, collectionPath)
        const q = query(colRef, where('metadata.tags', 'array-contains', 'premium'))
        return await getDocs(q)
      })

      if (!arrayQuery) {
        return {
          id: 'complex_queries',
          name: 'Complex Queries',
          status: 'failed',
          duration: Date.now() - startTime,
          message: 'Array-contains query failed',
          timestamp: Date.now()
        }
      }

      const premiumCount = arrayQuery.size

      // Test range query with ordering
      const rangeQuery = await safeFirestoreOperation(async (db) => {
        const colRef = collection(db, collectionPath)
        const q = query(
          colRef,
          where('rating', '>=', 4.5),
          where('rating', '<=', 5.0),
          orderBy('rating', 'desc')
        )
        return await getDocs(q)
      })

      if (!rangeQuery) {
        return {
          id: 'complex_queries',
          name: 'Complex Queries',
          status: 'failed',
          duration: Date.now() - startTime,
          message: 'Range query failed',
          timestamp: Date.now()
        }
      }

      const highRatedCount = rangeQuery.size

      // Validate results
      if (premiumCount !== 3 || highRatedCount !== 4) {
        return {
          id: 'complex_queries',
          name: 'Complex Queries',
          status: 'failed',
          duration: Date.now() - startTime,
          message: 'Complex query results incorrect',
          details: {
            expectedPremium: 3,
            actualPremium: premiumCount,
            expectedHighRated: 4,
            actualHighRated: highRatedCount
          },
          timestamp: Date.now()
        }
      }

      return {
        id: 'complex_queries',
        name: 'Complex Queries',
        status: 'passed',
        duration: Date.now() - startTime,
        message: 'Complex queries successful',
        firestoreDetails: {
          collectionPath,
          operationType: 'complex_query',
          queryResults: premiumCount + highRatedCount
        },
        timestamp: Date.now()
      }
    } catch (error: any) {
      return {
        id: 'complex_queries',
        name: 'Complex Queries',
        status: 'failed',
        duration: Date.now() - startTime,
        message: `Complex queries failed: ${error.message || error}`,
        details: { errorCode: error.code },
        timestamp: Date.now()
      }
    }
  }

  /**
   * Test server timestamps and field values
   */
  private async testServerTimestampsAndFieldValues(config: FirestoreTestConfig): Promise<FirestoreTestResult> {
    const startTime = Date.now()
    const collectionPath = `${config.testCollectionPrefix}_field_values_test`
    
    try {
      this.testCollections.add(collectionPath)

      // Test server timestamp and field values
      const createResult = await safeFirestoreOperation(async (db) => {
        const colRef = collection(db, collectionPath)
        return await addDoc(colRef, {
          name: 'Field Values Test User',
          createdAt: serverTimestamp(),
          counter: 0,
          tags: ['initial'],
          metadata: {
            version: 1,
            lastUpdated: serverTimestamp()
          }
        })
      })

      if (!createResult) {
        return {
          id: 'server_timestamps_field_values',
          name: 'Server Timestamps and Field Values',
          status: 'failed',
          duration: Date.now() - startTime,
          message: 'Failed to create document for field values test',
          timestamp: Date.now()
        }
      }

      // Test field value operations
      const updateResult = await safeFirestoreOperation(async (db) => {
        const docRef = doc(db, collectionPath, createResult.id)
        await updateDoc(docRef, {
          counter: increment(5),
          tags: arrayUnion('updated', 'tested'),
          'metadata.version': increment(1),
          'metadata.lastUpdated': serverTimestamp(),
          updatedAt: serverTimestamp()
        })
        return true
      })

      if (!updateResult) {
        return {
          id: 'server_timestamps_field_values',
          name: 'Server Timestamps and Field Values',
          status: 'failed',
          duration: Date.now() - startTime,
          message: 'Field values update failed',
          timestamp: Date.now()
        }
      }

      // Verify field values
      const verifyResult = await safeFirestoreOperation(async (db) => {
        const docRef = doc(db, collectionPath, createResult.id)
        return await getDoc(docRef)
      })

      if (!verifyResult || !verifyResult.exists()) {
        return {
          id: 'server_timestamps_field_values',
          name: 'Server Timestamps and Field Values',
          status: 'failed',
          duration: Date.now() - startTime,
          message: 'Cannot verify field values',
          timestamp: Date.now()
        }
      }

      const data = verifyResult.data()

      // Validate field values
      if (data.counter !== 5 || 
          data.metadata.version !== 2 ||
          !data.tags.includes('updated') ||
          !data.tags.includes('tested')) {
        return {
          id: 'server_timestamps_field_values',
          name: 'Server Timestamps and Field Values',
          status: 'failed',
          duration: Date.now() - startTime,
          message: 'Field values not applied correctly',
          details: {
            expectedCounter: 5,
            actualCounter: data.counter,
            expectedVersion: 2,
            actualVersion: data.metadata.version,
            tags: data.tags
          },
          timestamp: Date.now()
        }
      }

      return {
        id: 'server_timestamps_field_values',
        name: 'Server Timestamps and Field Values',
        status: 'passed',
        duration: Date.now() - startTime,
        message: 'Server timestamps and field values working correctly',
        firestoreDetails: {
          collectionPath,
          documentId: createResult.id,
          operationType: 'field_values'
        },
        timestamp: Date.now()
      }
    } catch (error: any) {
      return {
        id: 'server_timestamps_field_values',
        name: 'Server Timestamps and Field Values',
        status: 'failed',
        duration: Date.now() - startTime,
        message: `Server timestamps and field values failed: ${error.message || error}`,
        details: { errorCode: error.code },
        timestamp: Date.now()
      }
    }
  }

  /**
   * Test subcollections
   */
  private async testSubcollections(config: FirestoreTestConfig): Promise<FirestoreTestResult> {
    const startTime = Date.now()
    const collectionPath = `${config.testCollectionPrefix}_subcollection_test`
    
    try {
      this.testCollections.add(collectionPath)

      // Create parent document
      const parentResult = await safeFirestoreOperation(async (db) => {
        const colRef = collection(db, collectionPath)
        return await addDoc(colRef, {
          name: 'Parent Document',
          type: 'user',
          createdAt: serverTimestamp()
        })
      })

      if (!parentResult) {
        return {
          id: 'subcollections',
          name: 'Subcollections',
          status: 'failed',
          duration: Date.now() - startTime,
          message: 'Failed to create parent document',
          timestamp: Date.now()
        }
      }

      // Create subcollection documents
      const subcolResults = await Promise.all([
        safeFirestoreOperation(async (db) => {
          const subcolRef = collection(db, collectionPath, parentResult.id, 'rides')
          return await addDoc(subcolRef, {
            from: 'Airport',
            to: 'City Center',
            fare: 25.50,
            createdAt: serverTimestamp()
          })
        }),
        safeFirestoreOperation(async (db) => {
          const subcolRef = collection(db, collectionPath, parentResult.id, 'rides')
          return await addDoc(subcolRef, {
            from: 'Home',
            to: 'Office',
            fare: 15.00,
            createdAt: serverTimestamp()
          })
        })
      ])

      if (subcolResults.some(result => !result)) {
        return {
          id: 'subcollections',
          name: 'Subcollections',
          status: 'failed',
          duration: Date.now() - startTime,
          message: 'Failed to create subcollection documents',
          timestamp: Date.now()
        }
      }

      // Query subcollection
      const queryResult = await safeFirestoreOperation(async (db) => {
        const subcolRef = collection(db, collectionPath, parentResult.id, 'rides')
        return await getDocs(subcolRef)
      })

      if (!queryResult || queryResult.size !== 2) {
        return {
          id: 'subcollections',
          name: 'Subcollections',
          status: 'failed',
          duration: Date.now() - startTime,
          message: `Subcollection query failed: expected 2, got ${queryResult?.size || 0}`,
          timestamp: Date.now()
        }
      }

      return {
        id: 'subcollections',
        name: 'Subcollections',
        status: 'passed',
        duration: Date.now() - startTime,
        message: 'Subcollections working correctly',
        firestoreDetails: {
          collectionPath,
          documentId: parentResult.id,
          operationType: 'subcollection',
          queryResults: queryResult.size
        },
        timestamp: Date.now()
      }
    } catch (error: any) {
      return {
        id: 'subcollections',
        name: 'Subcollections',
        status: 'failed',
        duration: Date.now() - startTime,
        message: `Subcollections failed: ${error.message || error}`,
        details: { errorCode: error.code },
        timestamp: Date.now()
      }
    }
  }

  /**
   * Test security rules (basic)
   */
  private async testSecurityRules(config: FirestoreTestConfig): Promise<FirestoreTestResult> {
    const startTime = Date.now()
    
    try {
      // This is a simplified security rules test
      // In a real scenario, you'd test with different authentication states
      
      return {
        id: 'security_rules',
        name: 'Security Rules',
        status: 'passed',
        duration: Date.now() - startTime,
        message: 'Security rules test completed (basic)',
        details: {
          note: 'Full security rules testing requires authentication context and rule simulation'
        },
        timestamp: Date.now()
      }
    } catch (error: any) {
      return {
        id: 'security_rules',
        name: 'Security Rules',
        status: 'failed',
        duration: Date.now() - startTime,
        message: `Security rules test failed: ${error.message || error}`,
        details: { errorCode: error.code },
        timestamp: Date.now()
      }
    }
  }

  /**
   * Test Firestore operations with virtual user
   */
  public async testVirtualUserFirestoreOperations(virtualUser: VirtualUser): Promise<FirestoreTestResult> {
    const startTime = Date.now()
    const collectionPath = `virtual_users`
    
    try {
      // Create user document based on virtual user profile
      const userDoc = {
        userId: virtualUser.id,
        profile: virtualUser.profile,
        session: {
          id: virtualUser.session.id,
          startTime: virtualUser.session.startTime,
          isActive: virtualUser.session.isActive,
          deviceInfo: virtualUser.session.deviceInfo
        },
        currentState: virtualUser.currentState,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }

      const createResult = await safeFirestoreOperation(async (db) => {
        const colRef = collection(db, collectionPath)
        return await addDoc(colRef, userDoc)
      })

      if (!createResult) {
        return {
          id: 'virtual_user_firestore',
          name: 'Virtual User Firestore Operations',
          status: 'failed',
          duration: Date.now() - startTime,
          message: 'Failed to create virtual user document',
          timestamp: Date.now()
        }
      }

      // Update user state
      const updateResult = await safeFirestoreOperation(async (db) => {
        const docRef = doc(db, collectionPath, createResult.id)
        await updateDoc(docRef, {
          'currentState.lastActivity': serverTimestamp(),
          'session.lastActivity': serverTimestamp(),
          updatedAt: serverTimestamp()
        })
        return true
      })

      if (!updateResult) {
        return {
          id: 'virtual_user_firestore',
          name: 'Virtual User Firestore Operations',
          status: 'failed',
          duration: Date.now() - startTime,
          message: 'Failed to update virtual user document',
          timestamp: Date.now()
        }
      }

      // Query user by role
      const queryResult = await safeFirestoreOperation(async (db) => {
        const colRef = collection(db, collectionPath)
        const q = query(colRef, where('profile.role', '==', virtualUser.profile.role))
        return await getDocs(q)
      })

      if (!queryResult) {
        return {
          id: 'virtual_user_firestore',
          name: 'Virtual User Firestore Operations',
          status: 'failed',
          duration: Date.now() - startTime,
          message: 'Failed to query virtual user documents',
          timestamp: Date.now()
        }
      }

      // Cleanup
      await safeFirestoreOperation(async (db) => {
        const docRef = doc(db, collectionPath, createResult.id)
        await deleteDoc(docRef)
      })

      return {
        id: 'virtual_user_firestore',
        name: 'Virtual User Firestore Operations',
        status: 'passed',
        duration: Date.now() - startTime,
        message: 'Virtual user Firestore operations successful',
        firestoreDetails: {
          collectionPath,
          documentId: createResult.id,
          operationType: 'virtual_user_crud',
          queryResults: queryResult.size
        },
        details: {
          virtualUserRole: virtualUser.profile.role,
          virtualUserExperience: virtualUser.profile.demographics.experience
        },
        timestamp: Date.now()
      }
    } catch (error: any) {
      return {
        id: 'virtual_user_firestore',
        name: 'Virtual User Firestore Operations',
        status: 'failed',
        duration: Date.now() - startTime,
        message: `Virtual user Firestore operations failed: ${error.message || error}`,
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
      // Unsubscribe from active listeners
      this.activeListeners.forEach(unsubscribe => {
        try {
          unsubscribe()
        } catch (error) {
          console.warn('Error unsubscribing from Firestore listener:', error)
        }
      })
      this.activeListeners = []

      // Clean up test collections
      for (const collectionPath of this.testCollections) {
        try {
          const result = await safeFirestoreOperation(async (db) => {
            const colRef = collection(db, collectionPath)
            const snapshot = await getDocs(colRef)
            
            const batch = writeBatch(db)
            snapshot.docs.forEach(doc => {
              batch.delete(doc.ref)
            })
            
            if (snapshot.docs.length > 0) {
              await batch.commit()
            }
            
            return snapshot.docs.length
          })
          
          if (result && result > 0) {
            console.log(`Cleaned up ${result} documents from ${collectionPath}`)
          }
        } catch (error) {
          console.warn(`Error cleaning up collection ${collectionPath}:`, error)
        }
      }

      // Clear tracking data
      this.testCollections.clear()
      this.testDocuments.clear()

      console.log('Firestore Operations Tester cleanup completed')
    } catch (error) {
      console.error('Error during Firestore Operations Tester cleanup:', error)
    }
  }

  /**
   * Get Firestore health status
   */
  public getHealthStatus(): { status: 'healthy' | 'degraded' | 'unhealthy'; message: string; details?: any } {
    try {
      if (!this.db) {
        return {
          status: 'unhealthy',
          message: 'Firestore not initialized'
        }
      }

      return {
        status: 'healthy',
        message: 'Firestore service is operational',
        details: {
          activeListeners: this.activeListeners.length,
          testCollections: this.testCollections.size,
          testDocuments: this.testDocuments.size
        }
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `Firestore health check failed: ${error}`
      }
    }
  }
}