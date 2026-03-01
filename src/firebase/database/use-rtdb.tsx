'use client';

import { useEffect, useState } from 'react';
import { ref, onValue, DatabaseError } from 'firebase/database';
import { useRTDB } from '../provider';

export function useRTDBData<T>(path: string | null) {
  const rtdb = useRTDB();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<DatabaseError | null>(null);

  useEffect(() => {
    if (!path) {
      setData(null);
      setLoading(false);
      return;
    }

    const dataRef = ref(rtdb, path);
    const unsubscribe = onValue(
      dataRef,
      (snapshot) => {
        const val = snapshot.val();
        if (val && typeof val === 'object' && !Array.isArray(val)) {
          // Convert object of objects to array if it looks like a collection
          // But keep single objects as is.
          // This is a common pattern in RTDB.
          setData(val);
        } else {
          setData(val);
        }
        setLoading(false);
      },
      (err) => {
        console.error('RTDB error:', err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [rtdb, path]);

  return { data, loading, error };
}
