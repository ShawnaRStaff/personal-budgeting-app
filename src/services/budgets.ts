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
import { Budget, BudgetPeriod, BudgetProgress } from '../types';

const COLLECTION = 'budgets';

export async function createBudget(
  userId: string,
  data: {
    name: string;
    categoryId?: string | null;
    amount: number;
    period: BudgetPeriod;
    startDate?: Date;
    alertThreshold?: number;
  }
): Promise<Budget> {
  const now = new Date();
  const budgetData = {
    userId,
    name: data.name,
    categoryId: data.categoryId || null,
    amount: data.amount,
    period: data.period,
    startDate: Timestamp.fromDate(data.startDate || now),
    alertThreshold: data.alertThreshold ?? 80,
    isActive: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, COLLECTION), budgetData);

  return {
    id: docRef.id,
    ...budgetData,
    startDate: data.startDate || now,
    createdAt: now,
    updatedAt: now,
  } as Budget;
}

export async function updateBudget(
  budgetId: string,
  data: Partial<Pick<Budget, 'name' | 'categoryId' | 'amount' | 'period' | 'alertThreshold' | 'isActive'>>
): Promise<void> {
  const docRef = doc(db, COLLECTION, budgetId);
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteBudget(budgetId: string): Promise<void> {
  const docRef = doc(db, COLLECTION, budgetId);
  await deleteDoc(docRef);
}

export async function getBudgets(userId: string): Promise<Budget[]> {
  const q = query(
    collection(db, COLLECTION),
    where('userId', '==', userId),
    where('isActive', '==', true),
    orderBy('createdAt', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      startDate: (data.startDate as Timestamp)?.toDate() || new Date(),
      createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
      updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
    } as Budget;
  });
}

export function subscribeToBudgets(
  userId: string,
  callback: (budgets: Budget[]) => void
): () => void {
  const q = query(
    collection(db, COLLECTION),
    where('userId', '==', userId),
    where('isActive', '==', true),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const budgets = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        startDate: (data.startDate as Timestamp)?.toDate() || new Date(),
        createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
        updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
      } as Budget;
    });
    callback(budgets);
  });
}

// Get the current period's date range for a budget
export function getBudgetPeriodDates(budget: Budget): { start: Date; end: Date } {
  const now = new Date();
  let start: Date;
  let end: Date;

  switch (budget.period) {
    case BudgetPeriod.WEEKLY:
      // Start of current week (Sunday)
      start = new Date(now);
      start.setDate(now.getDate() - now.getDay());
      start.setHours(0, 0, 0, 0);
      end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      break;

    case BudgetPeriod.BIWEEKLY:
      // Two weeks from start date
      const weeksElapsed = Math.floor(
        (now.getTime() - budget.startDate.getTime()) / (14 * 24 * 60 * 60 * 1000)
      );
      start = new Date(budget.startDate);
      start.setDate(budget.startDate.getDate() + weeksElapsed * 14);
      start.setHours(0, 0, 0, 0);
      end = new Date(start);
      end.setDate(start.getDate() + 13);
      end.setHours(23, 59, 59, 999);
      break;

    case BudgetPeriod.MONTHLY:
      // Start of current month
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      break;

    case BudgetPeriod.YEARLY:
      // Start of current year
      start = new Date(now.getFullYear(), 0, 1);
      end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      break;

    default:
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  }

  return { start, end };
}

// Calculate days remaining in budget period
export function getDaysRemaining(budget: Budget): number {
  const { end } = getBudgetPeriodDates(budget);
  const now = new Date();
  const diff = end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

// Calculate budget progress
export function calculateBudgetProgress(
  budget: Budget,
  spent: number
): BudgetProgress {
  const remaining = budget.amount - spent;
  const percentUsed = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
  const daysRemaining = getDaysRemaining(budget);

  return {
    budget,
    spent,
    remaining,
    percentUsed: Math.min(100, percentUsed),
    isOverBudget: spent > budget.amount,
    daysRemaining,
  };
}
