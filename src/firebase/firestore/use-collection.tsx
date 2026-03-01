'use client';

import { useEffect, useState } from 'react';
import { 
  Query, 
  DocumentReference, 
  onSnapshot, 
  QuerySnapshot, 
  DocumentSnapshot,
  FirestoreError 
} from 'firebase/firestore';

export function useCollection<T>(ref: Query | DocumentReference | null) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);

  useEffect(() => {
    if (!ref) {
      setData(null);
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      ref as any,
      (snapshot: QuerySnapshot | DocumentSnapshot) => {
        if ('docs' in snapshot) {
          setData(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } else {
          setData(snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null);
        }
        setLoading(false);
      },
      (err) => {
        console.error('Firestore error:', err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [ref]);

  return { data, loading, error };
}
