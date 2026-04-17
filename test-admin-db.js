require('dotenv').config({ path: '.env.local' });
const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

async function testAdminConnection() {
  try {
    console.log("Initializing Firebase Admin SDK...");
    const app = initializeApp({
      credential: applicationDefault()
    });
    const db = getFirestore(app);
    console.log("Testing Firestore Admin read access...");
    
    // Read a dummy collection
    const snapshot = await db.collection('_test_admin_connection_').limit(1).get();
    console.log("Admin database connection successful! Found", snapshot.size, "documents.");
  } catch (error) {
    console.error("Admin database connection failed:", error.message);
  }
}

testAdminConnection();
