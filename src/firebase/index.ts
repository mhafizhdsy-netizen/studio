
'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase() {
  const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
  return getSdks(firebaseApp);
}

export function getSdks(firebaseApp: FirebaseApp) {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp), // Kept for any legacy or other uses, but app logic will use Supabase
  };
}

export * from './provider';
export * from './client-provider';
// Removing Firestore-specific hooks
// export * from './firestore/use-collection';
// export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from '@/lib/errors';
export * from '@/lib/error-emitter';
