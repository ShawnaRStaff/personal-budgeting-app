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
import { SavingsGoal, GoalContribution, CreateSavingsGoalInput } from '../types';

const GOALS_COLLECTION = 'savingsGoals';
const CONTRIBUTIONS_COLLECTION = 'goalContributions';

// ============================================================
// SAVINGS GOALS
// ============================================================

export async function createGoal(
  userId: string,
  data: CreateSavingsGoalInput
): Promise<SavingsGoal> {
  const now = new Date();
  const goalData = {
    userId,
    name: data.name,
    targetAmount: data.targetAmount,
    currentAmount: data.initialAmount || 0,
    deadline: data.deadline ? Timestamp.fromDate(data.deadline) : null,
    icon: data.icon || 'flag',
    color: data.color || '#4CAF50',
    isCompleted: false,
    completedAt: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, GOALS_COLLECTION), goalData);

  return {
    id: docRef.id,
    userId,
    name: data.name,
    targetAmount: data.targetAmount,
    currentAmount: data.initialAmount || 0,
    deadline: data.deadline,
    icon: data.icon || 'flag',
    color: data.color || '#4CAF50',
    isCompleted: false,
    completedAt: undefined,
    createdAt: now,
    updatedAt: now,
  } as SavingsGoal;
}

export async function updateGoal(
  goalId: string,
  data: Partial<Pick<SavingsGoal, 'name' | 'targetAmount' | 'deadline' | 'icon' | 'color'>>
): Promise<void> {
  const docRef = doc(db, GOALS_COLLECTION, goalId);
  const updateData: any = {
    ...data,
    updatedAt: serverTimestamp(),
  };

  // Convert deadline to Timestamp if provided
  if (data.deadline !== undefined) {
    updateData.deadline = data.deadline ? Timestamp.fromDate(data.deadline) : null;
  }

  await updateDoc(docRef, updateData);
}

export async function deleteGoal(goalId: string): Promise<void> {
  const docRef = doc(db, GOALS_COLLECTION, goalId);
  await deleteDoc(docRef);

  // Also delete all contributions for this goal
  const contributionsQuery = query(
    collection(db, CONTRIBUTIONS_COLLECTION),
    where('goalId', '==', goalId)
  );
  const snapshot = await getDocs(contributionsQuery);
  const deletePromises = snapshot.docs.map((doc) => deleteDoc(doc.ref));
  await Promise.all(deletePromises);
}

export async function getGoals(userId: string): Promise<SavingsGoal[]> {
  const q = query(
    collection(db, GOALS_COLLECTION),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    deadline: (doc.data().deadline as Timestamp)?.toDate() || undefined,
    completedAt: (doc.data().completedAt as Timestamp)?.toDate() || undefined,
    createdAt: (doc.data().createdAt as Timestamp)?.toDate() || new Date(),
    updatedAt: (doc.data().updatedAt as Timestamp)?.toDate() || new Date(),
  })) as SavingsGoal[];
}

export function subscribeToGoals(
  userId: string,
  callback: (goals: SavingsGoal[]) => void
): () => void {
  const q = query(
    collection(db, GOALS_COLLECTION),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const goals = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      deadline: (doc.data().deadline as Timestamp)?.toDate() || undefined,
      completedAt: (doc.data().completedAt as Timestamp)?.toDate() || undefined,
      createdAt: (doc.data().createdAt as Timestamp)?.toDate() || new Date(),
      updatedAt: (doc.data().updatedAt as Timestamp)?.toDate() || new Date(),
    })) as SavingsGoal[];
    callback(goals);
  });
}

// ============================================================
// GOAL CONTRIBUTIONS
// ============================================================

export async function addContribution(
  userId: string,
  goalId: string,
  amount: number,
  note?: string
): Promise<GoalContribution> {
  const now = new Date();
  const contributionData = {
    goalId,
    userId,
    amount,
    note: note || null,
    date: serverTimestamp(),
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, CONTRIBUTIONS_COLLECTION), contributionData);

  // Update the goal's current amount
  const goalRef = doc(db, GOALS_COLLECTION, goalId);
  const { getDoc } = await import('firebase/firestore');
  const goalSnapshot = await getDoc(goalRef);

  if (goalSnapshot.exists()) {
    const goalData = goalSnapshot.data();
    const newAmount = (goalData.currentAmount || 0) + amount;
    const isNowComplete = newAmount >= goalData.targetAmount;

    await updateDoc(goalRef, {
      currentAmount: newAmount,
      isCompleted: isNowComplete,
      completedAt: isNowComplete ? serverTimestamp() : null,
      updatedAt: serverTimestamp(),
    });
  }

  return {
    id: docRef.id,
    goalId,
    userId,
    amount,
    note,
    date: now,
    createdAt: now,
  } as GoalContribution;
}

export async function getContributions(goalId: string): Promise<GoalContribution[]> {
  const q = query(
    collection(db, CONTRIBUTIONS_COLLECTION),
    where('goalId', '==', goalId),
    orderBy('createdAt', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    date: (doc.data().date as Timestamp)?.toDate() || new Date(),
    createdAt: (doc.data().createdAt as Timestamp)?.toDate() || new Date(),
  })) as GoalContribution[];
}

export function subscribeToContributions(
  goalId: string,
  callback: (contributions: GoalContribution[]) => void
): () => void {
  const q = query(
    collection(db, CONTRIBUTIONS_COLLECTION),
    where('goalId', '==', goalId),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const contributions = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      date: (doc.data().date as Timestamp)?.toDate() || new Date(),
      createdAt: (doc.data().createdAt as Timestamp)?.toDate() || new Date(),
    })) as GoalContribution[];
    callback(contributions);
  });
}

// ============================================================
// GOAL PROGRESS HELPERS
// ============================================================

export interface GoalProgress {
  goal: SavingsGoal;
  percentComplete: number;
  amountRemaining: number;
  daysUntilDeadline: number | null;
  isOnTrack: boolean; // Based on deadline pace
  recentContribution: GoalContribution | null;
}

export function calculateGoalProgress(
  goal: SavingsGoal,
  recentContribution?: GoalContribution | null
): GoalProgress {
  const percentComplete = goal.targetAmount > 0
    ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
    : 0;

  const amountRemaining = Math.max(goal.targetAmount - goal.currentAmount, 0);

  let daysUntilDeadline: number | null = null;
  let isOnTrack = true;

  if (goal.deadline) {
    const now = new Date();
    const deadlineDate = goal.deadline instanceof Date ? goal.deadline : new Date(goal.deadline);
    const msPerDay = 1000 * 60 * 60 * 24;
    daysUntilDeadline = Math.ceil((deadlineDate.getTime() - now.getTime()) / msPerDay);

    // Calculate if on track based on time elapsed vs progress made
    const createdDate = goal.createdAt instanceof Date ? goal.createdAt : new Date(goal.createdAt);
    const totalDays = Math.ceil((deadlineDate.getTime() - createdDate.getTime()) / msPerDay);
    const daysElapsed = totalDays - daysUntilDeadline;
    const expectedProgress = totalDays > 0 ? (daysElapsed / totalDays) * 100 : 0;

    // On track if actual progress >= expected progress (with 10% buffer)
    isOnTrack = percentComplete >= expectedProgress - 10;
  }

  return {
    goal,
    percentComplete,
    amountRemaining,
    daysUntilDeadline,
    isOnTrack,
    recentContribution: recentContribution || null,
  };
}
