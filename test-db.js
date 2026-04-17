require('dotenv').config({ path: '.env.local' });
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, limit, query } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

async function testConnection() {
  try {
    console.log("Initializing Firebase Client SDK...");
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    console.log("Testing Firestore read access...");
    
    // Try to read a dummy collection just to see if connection works
    // Note: Due to the new security rules, an unauthenticated read might fail if the rules are strict.
    // However, our new rules allow unauthenticated reads? Wait, the new rules are:
    // match /settings/{settingId} { allow read: if isAuthenticated(); }
    // Let's try reading a nonexistent collection to test if we get a permission denied (which proves connection works)
    
    const q = query(collection(db, '_test_connection_'), limit(1));
    await getDocs(q);
    
    console.log("Database connection successful!");
  } catch (error) {
    if (error.code === 'permission-denied') {
      console.log("Database connection successful! (Received expected permission-denied due to security rules)");
    } else {
      console.error("Database connection failed:", error.message);
    }
  }
}

testConnection();
