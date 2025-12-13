import {
  TransactionType,
  AccountType,
  CategoryType,
  BudgetPeriod,
  RecurringFrequency,
  Currency,
} from './enums';

// ============================================================
// USER
// ============================================================

export interface User {
  id: string;
  email: string;
  displayName: string;
  createdAt: Date;
  updatedAt: Date;
  preferences: UserPreferences;
}

export interface NotificationPreferences {
  budgetWarnings: boolean;     // When budget reaches 80%
  budgetExceeded: boolean;     // When budget exceeds 100%
  goalMilestones: boolean;     // When goals hit 25/50/75%
  goalDeadlines: boolean;      // When deadline is approaching
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  budgetWarnings: true,
  budgetExceeded: true,
  goalMilestones: true,
  goalDeadlines: true,
};

export interface UserPreferences {
  currency: Currency;
  dateFormat: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
  theme: 'light' | 'dark' | 'system';
  notifications?: NotificationPreferences;
}

// ============================================================
// ACCOUNT
// ============================================================

export interface Account {
  id: string;
  userId: string;
  name: string;
  type: AccountType;
  balance: number;
  currency?: Currency;
  icon?: string;
  color?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAccountInput {
  name: string;
  type: AccountType;
  balance: number;
  currency?: Currency;
  icon?: string;
  color?: string;
}

// ============================================================
// CATEGORY
// ============================================================

export interface Category {
  id: string;
  userId: string;
  name: string;
  type: CategoryType;
  icon: string;
  color: string;
  parentId?: string | null;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCategoryInput {
  name: string;
  type: CategoryType;
  icon: string;
  color: string;
}

// ============================================================
// TRANSACTION
// ============================================================

export interface Transaction {
  id: string;
  userId: string;
  accountId: string;
  type: TransactionType;
  amount: number;
  categoryId?: string | null;
  description: string;
  date: Date;
  isCleared: boolean;
  isReconciled: boolean;
  notes?: string;
  isRecurring?: boolean;
  recurringId?: string;
  toAccountId?: string; // For transfers
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTransactionInput {
  accountId: string;
  type: TransactionType;
  amount: number;
  categoryId: string;
  description?: string;
  date?: Date;
  toAccountId?: string;
}

// ============================================================
// RECURRING TRANSACTION
// ============================================================

export interface RecurringTransaction {
  id: string;
  userId: string;
  accountId: string;
  type: TransactionType;
  amount: number;
  categoryId: string;
  description: string;
  frequency: RecurringFrequency;
  startDate: Date;
  nextDate: Date;
  endDate?: Date;
  isActive: boolean;
  lastGeneratedDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================
// BUDGET
// ============================================================

export interface Budget {
  id: string;
  userId: string;
  categoryId: string | null; // null = overall budget
  name: string;
  amount: number;
  period: BudgetPeriod;
  startDate: Date;
  alertThreshold: number; // 0-100 percentage
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface BudgetProgress {
  budget: Budget;
  spent: number;
  remaining: number;
  percentUsed: number;
  isOverBudget: boolean;
  daysRemaining: number;
}

export interface CreateBudgetInput {
  categoryId?: string | null;
  name: string;
  amount: number;
  period: BudgetPeriod;
  startDate?: Date;
  alertThreshold?: number;
}

// ============================================================
// SAVINGS GOAL
// ============================================================

export interface SavingsGoal {
  id: string;
  userId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: Date;
  icon?: string;
  color?: string;
  isCompleted: boolean;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface GoalContribution {
  id: string;
  goalId: string;
  userId: string;
  amount: number;
  note?: string;
  date: Date;
  createdAt: Date;
}

export interface CreateSavingsGoalInput {
  name: string;
  targetAmount: number;
  deadline?: Date;
  icon?: string;
  color?: string;
  initialAmount?: number;
}

// ============================================================
// DEFAULT CATEGORIES
// ============================================================

export const DEFAULT_EXPENSE_CATEGORIES = [
  { name: 'Groceries', icon: 'local-grocery-store', color: '#4CAF50' },
  { name: 'Food & Dining', icon: 'restaurant', color: '#FF6B6B' },
  { name: 'Gas', icon: 'local-gas-station', color: '#FF9800' },
  { name: 'Transportation', icon: 'directions-car', color: '#4ECDC4' },
  { name: 'Housing', icon: 'home', color: '#45B7D1' },
  { name: 'Utilities', icon: 'flash-on', color: '#96CEB4' },
  { name: 'Entertainment', icon: 'movie', color: '#DDA0DD' },
  { name: 'Shopping', icon: 'shopping-bag', color: '#F7DC6F' },
  { name: 'Health', icon: 'favorite', color: '#FF69B4' },
  { name: 'Personal', icon: 'person', color: '#87CEEB' },
  { name: 'Education', icon: 'school', color: '#98D8C8' },
  { name: 'Subscriptions', icon: 'subscriptions', color: '#C9B1FF' },
  { name: 'Other', icon: 'more-horiz', color: '#BDC3C7' },
] as const;

export const DEFAULT_INCOME_CATEGORIES = [
  { name: 'Salary', icon: 'work', color: '#2ECC71' },
  { name: 'Freelance', icon: 'laptop', color: '#3498DB' },
  { name: 'Investment', icon: 'trending-up', color: '#9B59B6' },
  { name: 'Gift', icon: 'card-giftcard', color: '#E74C3C' },
  { name: 'Refund', icon: 'replay', color: '#1ABC9C' },
  { name: 'Other', icon: 'more-horiz', color: '#95A5A6' },
] as const;
