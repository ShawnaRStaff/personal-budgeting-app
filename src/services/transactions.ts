import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Transaction, TransactionType } from '../types';
import { updateAccountBalance } from './accounts';

const COLLECTION = 'transactions';

export async function createTransaction(
  userId: string,
  data: {
    accountId: string;
    type: TransactionType;
    amount: number;
    description: string;
    categoryId?: string;
    date: Date;
    isCleared?: boolean;
    notes?: string;
  }
): Promise<Transaction> {
  const now = new Date();
  const transactionData = {
    userId,
    accountId: data.accountId,
    type: data.type,
    amount: data.amount,
    description: data.description,
    categoryId: data.categoryId || null,
    date: Timestamp.fromDate(data.date),
    isCleared: data.isCleared ?? true,
    isReconciled: false,
    notes: data.notes || '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, COLLECTION), transactionData);

  return {
    id: docRef.id,
    ...transactionData,
    date: data.date,
    createdAt: now,
    updatedAt: now,
  } as Transaction;
}

export async function updateTransaction(
  transactionId: string,
  data: Partial<Pick<Transaction, 'type' | 'amount' | 'description' | 'categoryId' | 'date' | 'isCleared' | 'isReconciled' | 'notes'>>
): Promise<void> {
  const docRef = doc(db, COLLECTION, transactionId);

  // Build update object, filtering out undefined values (Firestore doesn't accept undefined)
  const updateData: Record<string, any> = {
    updatedAt: serverTimestamp(),
  };

  if (data.type !== undefined) updateData.type = data.type;
  if (data.amount !== undefined) updateData.amount = data.amount;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
  if (data.isCleared !== undefined) updateData.isCleared = data.isCleared;
  if (data.isReconciled !== undefined) updateData.isReconciled = data.isReconciled;
  if (data.notes !== undefined) updateData.notes = data.notes;

  // Convert date to Firestore Timestamp
  if (data.date) {
    updateData.date = Timestamp.fromDate(data.date);
  }

  await updateDoc(docRef, updateData);
}

export async function deleteTransaction(transactionId: string): Promise<void> {
  const docRef = doc(db, COLLECTION, transactionId);
  await deleteDoc(docRef);
}

export async function getTransaction(transactionId: string): Promise<Transaction | null> {
  const docRef = doc(db, COLLECTION, transactionId);
  const snapshot = await getDoc(docRef);

  if (!snapshot.exists()) return null;

  const data = snapshot.data();
  return {
    id: snapshot.id,
    ...data,
    date: (data.date as Timestamp)?.toDate() || new Date(),
    createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
    updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
  } as Transaction;
}

export async function getTransactionsByAccount(
  accountId: string,
  limitCount?: number
): Promise<Transaction[]> {
  let q = query(
    collection(db, COLLECTION),
    where('accountId', '==', accountId),
    orderBy('date', 'desc'),
    orderBy('createdAt', 'desc')
  );

  if (limitCount) {
    q = query(q, limit(limitCount));
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      date: (data.date as Timestamp)?.toDate() || new Date(),
      createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
      updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
    } as Transaction;
  });
}

export function subscribeToTransactions(
  accountId: string,
  callback: (transactions: Transaction[]) => void
): () => void {
  const q = query(
    collection(db, COLLECTION),
    where('accountId', '==', accountId),
    orderBy('date', 'desc'),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const transactions = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        date: (data.date as Timestamp)?.toDate() || new Date(),
        createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
        updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
      } as Transaction;
    });
    callback(transactions);
  });
}

export async function getTransactionsByDateRange(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<Transaction[]> {
  const q = query(
    collection(db, COLLECTION),
    where('userId', '==', userId),
    where('date', '>=', Timestamp.fromDate(startDate)),
    where('date', '<=', Timestamp.fromDate(endDate)),
    orderBy('date', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      date: (data.date as Timestamp)?.toDate() || new Date(),
      createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
      updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
    } as Transaction;
  });
}

// Calculate running balance for transactions (oldest to newest)
export function calculateRunningBalances(
  transactions: Transaction[],
  startingBalance: number
): (Transaction & { runningBalance: number })[] {
  // Sort by date ascending for balance calculation
  const sorted = [...transactions].sort((a, b) => a.date.getTime() - b.date.getTime());

  let balance = startingBalance;
  const withBalances = sorted.map((tx) => {
    if (tx.type === TransactionType.INCOME || tx.type === TransactionType.TRANSFER_IN) {
      balance += tx.amount;
    } else {
      balance -= tx.amount;
    }
    return { ...tx, runningBalance: balance };
  });

  // Return in reverse order (newest first) for display
  return withBalances.reverse();
}

// Recalculate account balance from all transactions
export async function recalculateAccountBalance(
  accountId: string,
  initialBalance: number = 0
): Promise<number> {
  const transactions = await getTransactionsByAccount(accountId);

  let balance = initialBalance;
  for (const tx of transactions) {
    if (tx.type === TransactionType.INCOME || tx.type === TransactionType.TRANSFER_IN) {
      balance += tx.amount;
    } else {
      balance -= tx.amount;
    }
  }

  await updateAccountBalance(accountId, balance);
  return balance;
}
