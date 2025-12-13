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
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Account, AccountType } from '../types';

const COLLECTION = 'accounts';

export async function createAccount(
  userId: string,
  data: {
    name: string;
    type: AccountType;
    initialBalance?: number;
    color?: string;
    icon?: string;
  }
): Promise<Account> {
  const now = new Date();
  const accountData = {
    userId,
    name: data.name,
    type: data.type,
    balance: data.initialBalance || 0,
    color: data.color || '#4CAF50',
    icon: data.icon || 'account-balance',
    isActive: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, COLLECTION), accountData);

  return {
    id: docRef.id,
    ...accountData,
    createdAt: now,
    updatedAt: now,
  } as Account;
}

export async function updateAccount(
  accountId: string,
  data: Partial<Pick<Account, 'name' | 'type' | 'color' | 'icon' | 'isActive'>>
): Promise<void> {
  const docRef = doc(db, COLLECTION, accountId);
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function updateAccountBalance(
  accountId: string,
  newBalance: number
): Promise<void> {
  const docRef = doc(db, COLLECTION, accountId);
  await updateDoc(docRef, {
    balance: newBalance,
    updatedAt: serverTimestamp(),
  });
}

export async function adjustAccountBalance(
  accountId: string,
  amount: number,
  isAddition: boolean
): Promise<void> {
  const docRef = doc(db, COLLECTION, accountId);
  const { getDoc } = await import('firebase/firestore');
  const snapshot = await getDoc(docRef);

  if (snapshot.exists()) {
    const currentBalance = snapshot.data().balance || 0;
    const newBalance = isAddition ? currentBalance + amount : currentBalance - amount;
    await updateDoc(docRef, {
      balance: newBalance,
      updatedAt: serverTimestamp(),
    });
  }
}

export async function deleteAccount(accountId: string): Promise<void> {
  const docRef = doc(db, COLLECTION, accountId);
  await deleteDoc(docRef);
}

export async function getAccounts(userId: string): Promise<Account[]> {
  const q = query(
    collection(db, COLLECTION),
    where('userId', '==', userId),
    where('isActive', '==', true),
    orderBy('createdAt', 'asc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: (doc.data().createdAt as Timestamp)?.toDate() || new Date(),
    updatedAt: (doc.data().updatedAt as Timestamp)?.toDate() || new Date(),
  })) as Account[];
}

export function subscribeToAccounts(
  userId: string,
  callback: (accounts: Account[]) => void
): () => void {
  const q = query(
    collection(db, COLLECTION),
    where('userId', '==', userId),
    where('isActive', '==', true),
    orderBy('createdAt', 'asc')
  );

  return onSnapshot(q, (snapshot) => {
    const accounts = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: (doc.data().createdAt as Timestamp)?.toDate() || new Date(),
      updatedAt: (doc.data().updatedAt as Timestamp)?.toDate() || new Date(),
    })) as Account[];
    callback(accounts);
  });
}
