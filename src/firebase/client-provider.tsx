'use client';

import { ReactNode, useEffect, useState } from 'react';
import { initializeFirebase } from './index';
import { FirebaseProvider } from './provider';
import { FirebaseApp } from 'firebase/app';
import { Database } from 'firebase/database';
import { Auth } from 'firebase/auth';

export function FirebaseClientProvider({ children }: { children: ReactNode }) {
  const [instances, setInstances] = useState<{
    app: FirebaseApp;
    rtdb: Database;
    auth: Auth;
  } | null>(null);

  useEffect(() => {
    const { app, rtdb, auth } = initializeFirebase();
    setInstances({ app, rtdb, auth });
  }, []);

  if (!instances) return null;

  return (
    <FirebaseProvider app={instances.app} rtdb={instances.rtdb} auth={instances.auth}>
      {children}
    </FirebaseProvider>
  );
}
