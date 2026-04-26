import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';

let _app: FirebaseApp | null = null;
let _db: Firestore | null = null;

function getApp(): FirebaseApp {
  if (_app) return _app;
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey) {
    throw new Error(
      'Firebase not configured. Set NEXT_PUBLIC_FIREBASE_API_KEY in .env.local'
    );
  }
  if (getApps().length > 0) {
    _app = getApps()[0];
  } else {
    _app = initializeApp({
      apiKey,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    });
  }
  return _app;
}

export function getDb(): Firestore {
  if (_db) return _db;
  _db = getFirestore(getApp());
  return _db;
}
