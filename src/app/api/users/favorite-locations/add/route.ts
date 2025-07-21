import { NextResponse } from 'next/server';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { initializeApp, applicationDefault, getApps } from 'firebase-admin/app';

if (!getApps().length) {
  initializeApp({ credential: applicationDefault() });
}
const db = getFirestore();

interface AddFavoriteLocationPayload {
  userId: string;
  label: string;
  address: string;
  latitude: number;
  longitude: number;
}

export async function POST(req: Request) {
  try {
    const data: AddFavoriteLocationPayload = await req.json();
    
    // Validate required fields
    if (!data.userId || !data.label || !data.address || typeof data.latitude !== 'number' || typeof data.longitude !== 'number') {
      return NextResponse.json({ error: 'Missing required fields: userId, label, address, latitude, longitude' }, { status: 400 });
    }
    
    const favoriteLocationData = {
      ...data,
      createdAt: Timestamp.now()
    };
    
    const docRef = await db.collection('favoriteLocations').add(favoriteLocationData);
    const docSnap = await docRef.get();
    return NextResponse.json({
      id: docRef.id,
      data: docSnap.data()
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add favorite location', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
