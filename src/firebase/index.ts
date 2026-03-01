'use client';

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import { firebaseConfig } from './config';

export function initializeFirebase() {
  const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  const rtdb = getDatabase(app);
  const auth = getAuth(app);
  return { app, rtdb, auth };
}

export * from './provider';
export * from './client-provider';
export * from './auth/use-user';
export * from './database/use-rtdb';
