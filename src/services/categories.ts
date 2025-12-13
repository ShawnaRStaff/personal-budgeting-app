import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Category, CategoryType, DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES } from '../types';

const COLLECTION = 'categories';

export async function createCategory(
  userId: string,
  data: {
    name: string;
    type: CategoryType;
    icon: string;
    color: string;
    parentId?: string;
  }
): Promise<Category> {
  const now = new Date();
  const categoryData = {
    userId,
    name: data.name,
    type: data.type,
    icon: data.icon,
    color: data.color,
    parentId: data.parentId || null,
    isDefault: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, COLLECTION), categoryData);

  return {
    id: docRef.id,
    ...categoryData,
    createdAt: now,
    updatedAt: now,
  } as Category;
}

export async function updateCategory(
  categoryId: string,
  data: Partial<Pick<Category, 'name' | 'icon' | 'color' | 'parentId'>>
): Promise<void> {
  const docRef = doc(db, COLLECTION, categoryId);
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteCategory(categoryId: string): Promise<void> {
  const docRef = doc(db, COLLECTION, categoryId);
  await deleteDoc(docRef);
}

export async function getCategories(userId: string): Promise<Category[]> {
  const q = query(
    collection(db, COLLECTION),
    where('userId', '==', userId),
    orderBy('type'),
    orderBy('name')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: (doc.data().createdAt as Timestamp)?.toDate() || new Date(),
    updatedAt: (doc.data().updatedAt as Timestamp)?.toDate() || new Date(),
  })) as Category[];
}

export async function getCategoriesByType(
  userId: string,
  type: CategoryType
): Promise<Category[]> {
  const q = query(
    collection(db, COLLECTION),
    where('userId', '==', userId),
    where('type', '==', type),
    orderBy('name')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: (doc.data().createdAt as Timestamp)?.toDate() || new Date(),
    updatedAt: (doc.data().updatedAt as Timestamp)?.toDate() || new Date(),
  })) as Category[];
}

export function subscribeToCategories(
  userId: string,
  callback: (categories: Category[]) => void
): () => void {
  const q = query(
    collection(db, COLLECTION),
    where('userId', '==', userId),
    orderBy('type'),
    orderBy('name')
  );

  return onSnapshot(q, (snapshot) => {
    const categories = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: (doc.data().createdAt as Timestamp)?.toDate() || new Date(),
      updatedAt: (doc.data().updatedAt as Timestamp)?.toDate() || new Date(),
    })) as Category[];
    callback(categories);
  });
}

// Initialize default categories for a new user (or add missing defaults for existing users)
export async function initializeDefaultCategories(userId: string): Promise<void> {
  const batch = writeBatch(db);
  const now = serverTimestamp();

  // Get existing categories for this user
  const existing = await getCategories(userId);
  const existingNames = new Set(existing.map(cat => cat.name.toLowerCase()));

  let hasNewCategories = false;

  // Add missing expense categories
  for (const cat of DEFAULT_EXPENSE_CATEGORIES) {
    if (!existingNames.has(cat.name.toLowerCase())) {
      const docRef = doc(collection(db, COLLECTION));
      batch.set(docRef, {
        userId,
        name: cat.name,
        type: CategoryType.EXPENSE,
        icon: cat.icon,
        color: cat.color,
        parentId: null,
        isDefault: true,
        createdAt: now,
        updatedAt: now,
      });
      hasNewCategories = true;
    }
  }

  // Add missing income categories
  for (const cat of DEFAULT_INCOME_CATEGORIES) {
    if (!existingNames.has(cat.name.toLowerCase())) {
      const docRef = doc(collection(db, COLLECTION));
      batch.set(docRef, {
        userId,
        name: cat.name,
        type: CategoryType.INCOME,
        icon: cat.icon,
        color: cat.color,
        parentId: null,
        isDefault: true,
        createdAt: now,
        updatedAt: now,
      });
      hasNewCategories = true;
    }
  }

  if (hasNewCategories) {
    await batch.commit();
  }
}
