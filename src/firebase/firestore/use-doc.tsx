'use client';

import { useCollection } from './use-collection';
import { DocumentReference } from 'firebase/firestore';

export function useDoc<T>(ref: DocumentReference | null) {
  return useCollection<T>(ref);
}
