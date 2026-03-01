'use client';

import { createContext, useContext, ReactNode } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Database } from 'firebase/database';
import { Auth } from 'firebase/auth';

interface FirebaseContextValue {
  app: FirebaseApp;
  rtdb: Database;
  auth: Auth;
}

const FirebaseContext = createContext<FirebaseContextValue | null>(null);

export function FirebaseProvider({ 
  children, 
  app, 
  rtdb, 
  auth 
}: FirebaseContextValue & { children: ReactNode }) {
  return (
    <FirebaseContext.Provider value={{ app, rtdb, auth }}>
      {children}
    </FirebaseContext.Provider>
  );
}

export function useFirebase() {
  const context = useContext(FirebaseContext);
  if (!context) throw new Error('useFirebase must be used within a FirebaseProvider');
  return context;
}

export const useFirebaseApp = () => useFirebase().app;
export const useRTDB = () => useFirebase().rtdb;
export const useAuth = () => useFirebase().auth;
