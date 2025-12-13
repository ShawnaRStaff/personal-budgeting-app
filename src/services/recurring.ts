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
import { RecurringTransaction, RecurringFrequency, TransactionType } from '../types';
import { createTransaction } from './transactions';
import { adjustAccountBalance } from './accounts';

const COLLECTION = 'recurringTransactions';

// ============================================
// CRUD OPERATIONS
// ============================================

export async function createRecurringTransaction(
  userId: string,
  data: {
    accountId: string;
    type: TransactionType;
    amount: number;
    description: string;
    categoryId: string;
    frequency: RecurringFrequency;
    startDate: Date;
    endDate?: Date;
  }
): Promise<RecurringTransaction> {
  const now = new Date();
  const nextDate = calculateNextDate(data.startDate, data.frequency);

  const recurringData = {
    userId,
    accountId: data.accountId,
    type: data.type,
    amount: data.amount,
    categoryId: data.categoryId,
    description: data.description,
    frequency: data.frequency,
    startDate: Timestamp.fromDate(data.startDate),
    nextDate: Timestamp.fromDate(nextDate),
    endDate: data.endDate ? Timestamp.fromDate(data.endDate) : null,
    isActive: true,
    lastGeneratedDate: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, COLLECTION), recurringData);

  return {
    id: docRef.id,
    ...recurringData,
    startDate: data.startDate,
    nextDate,
    endDate: data.endDate,
    createdAt: now,
    updatedAt: now,
  } as RecurringTransaction;
}

export async function updateRecurringTransaction(
  id: string,
  data: Partial<Pick<RecurringTransaction, 'amount' | 'description' | 'categoryId' | 'frequency' | 'endDate' | 'isActive'>>
): Promise<void> {
  const docRef = doc(db, COLLECTION, id);

  const updateData: Record<string, any> = {
    updatedAt: serverTimestamp(),
  };

  if (data.amount !== undefined) updateData.amount = data.amount;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
  if (data.frequency !== undefined) updateData.frequency = data.frequency;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;
  if (data.endDate !== undefined) {
    updateData.endDate = data.endDate ? Timestamp.fromDate(data.endDate) : null;
  }

  await updateDoc(docRef, updateData);
}

export async function deleteRecurringTransaction(id: string): Promise<void> {
  const docRef = doc(db, COLLECTION, id);
  await deleteDoc(docRef);
}

export function subscribeToRecurringTransactions(
  userId: string,
  callback: (recurring: RecurringTransaction[]) => void
): () => void {
  const q = query(
    collection(db, COLLECTION),
    where('userId', '==', userId),
    where('isActive', '==', true),
    orderBy('nextDate', 'asc')
  );

  return onSnapshot(q, (snapshot) => {
    const recurring = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        startDate: (data.startDate as Timestamp)?.toDate() || new Date(),
        nextDate: (data.nextDate as Timestamp)?.toDate() || new Date(),
        endDate: data.endDate ? (data.endDate as Timestamp)?.toDate() : undefined,
        lastGeneratedDate: data.lastGeneratedDate
          ? (data.lastGeneratedDate as Timestamp)?.toDate()
          : undefined,
        createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
        updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
      } as RecurringTransaction;
    });
    callback(recurring);
  });
}

export async function getRecurringTransactions(userId: string): Promise<RecurringTransaction[]> {
  const q = query(
    collection(db, COLLECTION),
    where('userId', '==', userId),
    where('isActive', '==', true),
    orderBy('nextDate', 'asc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      startDate: (data.startDate as Timestamp)?.toDate() || new Date(),
      nextDate: (data.nextDate as Timestamp)?.toDate() || new Date(),
      endDate: data.endDate ? (data.endDate as Timestamp)?.toDate() : undefined,
      lastGeneratedDate: data.lastGeneratedDate
        ? (data.lastGeneratedDate as Timestamp)?.toDate()
        : undefined,
      createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
      updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
    } as RecurringTransaction;
  });
}

// ============================================
// DATE CALCULATION HELPERS
// ============================================

export function calculateNextDate(fromDate: Date, frequency: RecurringFrequency): Date {
  const next = new Date(fromDate);

  switch (frequency) {
    case RecurringFrequency.DAILY:
      next.setDate(next.getDate() + 1);
      break;
    case RecurringFrequency.WEEKLY:
      next.setDate(next.getDate() + 7);
      break;
    case RecurringFrequency.BIWEEKLY:
      next.setDate(next.getDate() + 14);
      break;
    case RecurringFrequency.MONTHLY:
      next.setMonth(next.getMonth() + 1);
      break;
    case RecurringFrequency.YEARLY:
      next.setFullYear(next.getFullYear() + 1);
      break;
  }

  return next;
}

export function getFrequencyLabel(frequency: RecurringFrequency): string {
  switch (frequency) {
    case RecurringFrequency.DAILY:
      return 'Daily';
    case RecurringFrequency.WEEKLY:
      return 'Weekly';
    case RecurringFrequency.BIWEEKLY:
      return 'Every 2 weeks';
    case RecurringFrequency.MONTHLY:
      return 'Monthly';
    case RecurringFrequency.YEARLY:
      return 'Yearly';
    default:
      return frequency;
  }
}

// ============================================
// AUTO-GENERATION LOGIC
// ============================================

/**
 * Process all due recurring transactions for a user.
 * Creates actual transactions for any recurring items that are past due.
 * Returns the number of transactions generated.
 */
export async function processRecurringTransactions(userId: string): Promise<number> {
  const recurring = await getRecurringTransactions(userId);
  const today = new Date();
  today.setHours(23, 59, 59, 999); // End of today

  let generatedCount = 0;

  for (const item of recurring) {
    // Skip if end date has passed
    if (item.endDate && item.endDate < today) {
      await updateRecurringTransaction(item.id, { isActive: false });
      continue;
    }

    // Generate transactions for all due dates
    let nextDate = new Date(item.nextDate);

    while (nextDate <= today) {
      // Create the actual transaction
      const tx = await createTransaction(userId, {
        accountId: item.accountId,
        type: item.type,
        amount: item.amount,
        description: item.description,
        categoryId: item.categoryId,
        date: nextDate,
        notes: `Auto-generated from recurring: ${item.description}`,
      });

      // Adjust account balance
      const isAddition =
        item.type === TransactionType.INCOME ||
        item.type === TransactionType.TRANSFER_IN;
      await adjustAccountBalance(item.accountId, item.amount, isAddition);

      generatedCount++;

      // Calculate the new next date
      nextDate = calculateNextDate(nextDate, item.frequency);

      // Check if we've passed the end date
      if (item.endDate && nextDate > item.endDate) {
        await updateRecurringTransaction(item.id, { isActive: false });
        break;
      }
    }

    // Update the recurring transaction with the new next date
    if (nextDate > today) {
      const docRef = doc(db, COLLECTION, item.id);
      await updateDoc(docRef, {
        nextDate: Timestamp.fromDate(nextDate),
        lastGeneratedDate: Timestamp.fromDate(today),
        updatedAt: serverTimestamp(),
      });
    }
  }

  return generatedCount;
}

/**
 * Get upcoming recurring transactions (next 30 days)
 */
export async function getUpcomingRecurring(userId: string): Promise<RecurringTransaction[]> {
  const recurring = await getRecurringTransactions(userId);
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  return recurring.filter((item) => item.nextDate <= thirtyDaysFromNow);
}
