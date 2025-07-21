import { NextResponse } from 'next/server';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { initializeApp, applicationDefault, getApps } from 'firebase-admin/app';

if (!getApps().length) {
  initializeApp({ credential: applicationDefault() });
}
const db = getFirestore();

interface LocationPoint {
  address: string;
  latitude: number;
  longitude: number;
  doorOrFlat?: string;
}

interface AddSavedRoutePayload {
  userId: string;
  label: string;
  pickupLocation: LocationPoint;
  dropoffLocation: LocationPoint;
  stops?: LocationPoint[];
}

export async function POST(req: Request) {
  try {
    const data: AddSavedRoutePayload = await req.json();
    
    // Validate required fields
    if (!data.userId || !data.label || !data.pickupLocation || !data.dropoffLocation) {
      return NextResponse.json({ error: 'Missing required fields: userId, label, pickupLocation, dropoffLocation' }, { status: 400 });
    }
    
    // Validate location objects
    if (!data.pickupLocation.address || typeof data.pickupLocation.latitude !== 'number' || typeof data.pickupLocation.longitude !== 'number') {
      return NextResponse.json({ error: 'Invalid pickupLocation: address, latitude, and longitude are required' }, { status: 400 });
    }
    
    if (!data.dropoffLocation.address || typeof data.dropoffLocation.latitude !== 'number' || typeof data.dropoffLocation.longitude !== 'number') {
      return NextResponse.json({ error: 'Invalid dropoffLocation: address, latitude, and longitude are required' }, { status: 400 });
    }
    
    const savedRouteData = {
      ...data,
      createdAt: Timestamp.now()
    };
    
    const docRef = await db.collection('savedRoutes').add(savedRouteData);
    return NextResponse.json({ message: 'Saved route added successfully', id: docRef.id });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add saved route', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
