import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  onSnapshot,
  doc,
  deleteDoc,
  getDoc,
  updateDoc,
  Timestamp,
  orderBy
} from 'firebase/firestore';
import { db } from './config';

export interface Material {
  name: string;
  cost: number;
  qty: number;
}

export interface Calculation {
  id: string;
  productName: string;
  materials: Material[];
  laborCost: number;
  overhead: number;
  packaging: number;
  totalHPP: number;
  suggestedPrice: number;
  margin: number;
  createdAt: Timestamp;
  userId: string;
  isPublic?: boolean;
}

// Add a new calculation for a user
export const addCalculation = async (userId: string, data: Omit<Calculation, 'id' | 'createdAt' | 'userId'>) => {
  try {
    const docRef = await addDoc(collection(db, 'users', userId, 'calculations'), {
      ...data,
      userId,
      createdAt: serverTimestamp(),
    });
    return { id: docRef.id, error: null };
  } catch (error) {
    console.error("Error adding document: ", error);
    return { id: null, error };
  }
};

// Update an existing calculation
export const updateCalculation = async (userId: string, calcId: string, data: Partial<Omit<Calculation, 'id' | 'createdAt' | 'userId'>>) => {
  try {
    const docRef = doc(db, 'users', userId, 'calculations', calcId);
    await updateDoc(docRef, data);
    return { error: null };
  } catch (error) {
    console.error("Error updating document: ", error);
    return { error };
  }
};

// Get all calculations for a user with real-time updates
export const getCalculations = (
  userId: string,
  callback: (data: Calculation[], error: Error | null) => void
) => {
  const q = query(collection(db, 'users', userId, 'calculations'), orderBy('createdAt', 'desc'));

  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const calculations: Calculation[] = [];
    querySnapshot.forEach((doc) => {
      calculations.push({ id: doc.id, ...doc.data() } as Calculation);
    });
    callback(calculations, null);
  }, (error) => {
    console.error("Error getting documents: ", error);
    callback([], error);
  });

  return unsubscribe;
};

// Get a single calculation by ID
export const getCalculationById = async (userId: string, calcId: string) => {
  try {
    const docRef = doc(db, 'users', userId, 'calculations', calcId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { data: { id: docSnap.id, ...docSnap.data() } as Calculation, error: null };
    } else {
      return { data: null, error: new Error("No such document!") };
    }
  } catch (error) {
    return { data: null, error };
  }
};


// Delete a calculation
export const deleteCalculation = async (userId: string, calcId: string) => {
  try {
    await deleteDoc(doc(db, 'users', userId, 'calculations', calcId));
    return { error: null };
  } catch (error) {
    console.error("Error deleting document: ", error);
    return { error };
  }
};

// Add a calculation to the public pool
export const addPublicCalculation = async (data: Omit<Calculation, 'id' | 'userId'>, userName: string) => {
    try {
      const docRef = await addDoc(collection(db, 'publicCalculations'), {
        ...data,
        userName, // Don't store userId, just the display name
        createdAt: serverTimestamp(),
      });
      return { id: docRef.id, error: null };
    } catch (error) {
      console.error("Error adding public document: ", error);
      return { id: null, error };
    }
  };

// Get all public calculations
export const getPublicCalculations = (
    callback: (data: any[], error: Error | null) => void
) => {
    const q = query(collection(db, 'publicCalculations'), orderBy('createdAt', 'desc'));
  
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const calculations: any[] = [];
      querySnapshot.forEach((doc) => {
        calculations.push({ id: doc.id, ...doc.data() });
      });
      callback(calculations, null);
    }, (error) => {
      console.error("Error getting public documents: ", error);
      callback([], error);
    });
  
    return unsubscribe;
  };
