import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Account,
  Transaction,
  Category,
  Budget,
  BudgetProgress,
  SavingsGoal,
  GoalContribution,
  CreateSavingsGoalInput,
  AccountType,
  TransactionType,
  CategoryType,
  BudgetPeriod,
  RecurringTransaction,
  RecurringFrequency,
} from '../types';

const SELECTED_ACCOUNT_KEY = '@selected_account_id';
import {
  subscribeToAccounts,
  createAccount,
  updateAccount,
  deleteAccount,
  adjustAccountBalance,
} from '../services/accounts';
import {
  subscribeToTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  calculateRunningBalances,
  getTransactionsByDateRange,
} from '../services/transactions';
import {
  subscribeToCategories,
  initializeDefaultCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../services/categories';
import {
  subscribeToBudgets,
  createBudget,
  updateBudget,
  deleteBudget,
  getBudgetPeriodDates,
  calculateBudgetProgress,
} from '../services/budgets';
import {
  subscribeToGoals,
  createGoal,
  updateGoal,
  deleteGoal,
  addContribution,
  GoalProgress,
  calculateGoalProgress,
} from '../services/goals';
import {
  subscribeToRecurringTransactions,
  createRecurringTransaction,
  updateRecurringTransaction,
  deleteRecurringTransaction,
  processRecurringTransactions,
} from '../services/recurring';
import { useAuth } from './AuthContext';

interface DataContextType {
  // Accounts
  accounts: Account[];
  selectedAccount: Account | null;
  setSelectedAccount: (account: Account | null) => void;
  addAccount: (data: { name: string; type: AccountType; initialBalance?: number; color?: string }) => Promise<Account>;
  editAccount: (id: string, data: Partial<Account>) => Promise<void>;
  removeAccount: (id: string) => Promise<void>;

  // Transactions
  transactions: (Transaction & { runningBalance: number })[];
  addTransaction: (data: {
    type: TransactionType;
    amount: number;
    description: string;
    categoryId?: string;
    date: Date;
    notes?: string;
    accountId?: string;
  }) => Promise<Transaction>;
  editTransaction: (id: string, data: Partial<Transaction>) => Promise<void>;
  removeTransaction: (id: string) => Promise<void>;

  // Categories
  categories: Category[];
  expenseCategories: Category[];
  incomeCategories: Category[];
  addCategory: (data: { name: string; type: CategoryType; icon: string; color: string }) => Promise<Category>;
  editCategory: (id: string, data: Partial<Pick<Category, 'name' | 'icon' | 'color'>>) => Promise<void>;
  removeCategory: (id: string) => Promise<void>;

  // Budgets
  budgets: Budget[];
  budgetProgress: BudgetProgress[];
  addBudget: (data: {
    name: string;
    categoryId?: string | null;
    amount: number;
    period: BudgetPeriod;
  }) => Promise<Budget>;
  editBudget: (id: string, data: Partial<Budget>) => Promise<void>;
  removeBudget: (id: string) => Promise<void>;
  refreshBudgetProgress: () => Promise<void>;

  // Goals
  goals: SavingsGoal[];
  goalProgress: GoalProgress[];
  addGoal: (data: CreateSavingsGoalInput) => Promise<SavingsGoal>;
  editGoal: (id: string, data: Partial<SavingsGoal>) => Promise<void>;
  removeGoal: (id: string) => Promise<void>;
  contributeToGoal: (goalId: string, amount: number, note?: string) => Promise<GoalContribution>;

  // Recurring Transactions
  recurringTransactions: RecurringTransaction[];
  addRecurringTransaction: (data: {
    accountId: string;
    type: TransactionType;
    amount: number;
    description: string;
    categoryId: string;
    frequency: RecurringFrequency;
    startDate: Date;
    endDate?: Date;
  }) => Promise<RecurringTransaction>;
  editRecurringTransaction: (id: string, data: Partial<Pick<RecurringTransaction, 'amount' | 'description' | 'categoryId' | 'frequency' | 'endDate' | 'isActive'>>) => Promise<void>;
  removeRecurringTransaction: (id: string) => Promise<void>;
  processRecurring: () => Promise<number>;

  // Loading states
  isLoading: boolean;
  isInitialized: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccountState] = useState<Account | null>(null);
  const [rawTransactions, setRawTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [budgetProgress, setBudgetProgress] = useState<BudgetProgress[]>([]);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [goalProgress, setGoalProgress] = useState<GoalProgress[]>([]);
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const hasProcessedRecurringRef = useRef(false);

  // Refs to track current selection without closure issues
  const selectedAccountIdRef = useRef<string | null>(null);
  const hasInitializedSelectionRef = useRef(false);

  // Wrapper to persist selected account
  const setSelectedAccount = useCallback((account: Account | null) => {
    selectedAccountIdRef.current = account?.id || null;
    setSelectedAccountState(account);
    if (account) {
      AsyncStorage.setItem(SELECTED_ACCOUNT_KEY, account.id).catch(console.error);
    } else {
      AsyncStorage.removeItem(SELECTED_ACCOUNT_KEY).catch(console.error);
    }
  }, []);

  // Load saved account ID on mount
  useEffect(() => {
    AsyncStorage.getItem(SELECTED_ACCOUNT_KEY).then((id) => {
      if (id) {
        selectedAccountIdRef.current = id;
      }
    }).catch(console.error);
  }, []);

  // Subscribe to accounts
  useEffect(() => {
    if (!user?.id) {
      setAccounts([]);
      setSelectedAccountState(null);
      selectedAccountIdRef.current = null;
      hasInitializedSelectionRef.current = false;
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const unsubscribe = subscribeToAccounts(user.id, (accts) => {
      setAccounts(accts);

      if (accts.length > 0) {
        // Use ref to get current selection (avoids stale closure)
        const currentSelectedId = selectedAccountIdRef.current;

        if (!hasInitializedSelectionRef.current) {
          // First load - try to restore saved account or use first
          hasInitializedSelectionRef.current = true;
          const savedAccount = currentSelectedId ? accts.find(a => a.id === currentSelectedId) : null;
          const accountToSelect = savedAccount || accts[0];
          selectedAccountIdRef.current = accountToSelect.id;
          setSelectedAccountState(accountToSelect);
        } else if (currentSelectedId) {
          // Subsequent updates - keep current selection but update the account object
          // (in case balance or other fields changed)
          const updatedAccount = accts.find(a => a.id === currentSelectedId);
          if (updatedAccount) {
            setSelectedAccountState(updatedAccount);
          }
        }
      }

      setIsLoading(false);
    });

    return unsubscribe;
  }, [user?.id]);

  // Subscribe to transactions for selected account
  useEffect(() => {
    if (!selectedAccount?.id) {
      setRawTransactions([]);
      return;
    }

    const unsubscribe = subscribeToTransactions(selectedAccount.id, (txns) => {
      setRawTransactions(txns);
    });

    return unsubscribe;
  }, [selectedAccount?.id]);

  // Subscribe to categories
  useEffect(() => {
    if (!user?.id) {
      setCategories([]);
      return;
    }

    // Initialize default categories if needed
    initializeDefaultCategories(user.id).catch(console.error);

    const unsubscribe = subscribeToCategories(user.id, (cats) => {
      setCategories(cats);
      setIsInitialized(true);
    });

    return unsubscribe;
  }, [user?.id]);

  // Subscribe to budgets
  useEffect(() => {
    if (!user?.id) {
      setBudgets([]);
      setBudgetProgress([]);
      return;
    }

    const unsubscribe = subscribeToBudgets(user.id, (newBudgets) => {
      setBudgets(newBudgets);
    });

    return unsubscribe;
  }, [user?.id]);

  // Subscribe to goals
  useEffect(() => {
    if (!user?.id) {
      setGoals([]);
      setGoalProgress([]);
      return;
    }

    const unsubscribe = subscribeToGoals(user.id, (newGoals) => {
      setGoals(newGoals);
      // Calculate progress for all goals
      const progress = newGoals.map((goal) => calculateGoalProgress(goal));
      setGoalProgress(progress);
    });

    return unsubscribe;
  }, [user?.id]);

  // Subscribe to recurring transactions
  useEffect(() => {
    if (!user?.id) {
      setRecurringTransactions([]);
      return;
    }

    const unsubscribe = subscribeToRecurringTransactions(user.id, (recurring) => {
      setRecurringTransactions(recurring);
    });

    return unsubscribe;
  }, [user?.id]);

  // Process recurring transactions on first load
  useEffect(() => {
    if (!user?.id || hasProcessedRecurringRef.current) return;

    const processRecurring = async () => {
      try {
        hasProcessedRecurringRef.current = true;
        const count = await processRecurringTransactions(user.id);
        if (count > 0) {
          console.log(`Processed ${count} recurring transactions`);
          // Refresh budget progress since new transactions were created
          refreshBudgetProgress();
        }
      } catch (error) {
        console.error('Error processing recurring transactions:', error);
      }
    };

    // Wait a short time to ensure categories and accounts are loaded
    const timer = setTimeout(processRecurring, 1000);
    return () => clearTimeout(timer);
  }, [user?.id, refreshBudgetProgress]);

  // Calculate budget progress when budgets change
  const refreshBudgetProgress = useCallback(async () => {
    if (!user?.id || budgets.length === 0) {
      setBudgetProgress([]);
      return;
    }

    const progressList: BudgetProgress[] = [];

    for (const budget of budgets) {
      const { start, end } = getBudgetPeriodDates(budget);

      try {
        // Get all transactions in the budget period
        const periodTransactions = await getTransactionsByDateRange(user.id, start, end);

        // Calculate spent amount for this budget
        let spent = 0;
        for (const tx of periodTransactions) {
          // Only count expenses
          if (tx.type === TransactionType.EXPENSE || tx.type === TransactionType.TRANSFER_OUT) {
            // If budget has a category, only count matching transactions
            if (budget.categoryId) {
              if (tx.categoryId === budget.categoryId) {
                spent += tx.amount;
              }
            } else {
              // Overall budget - count all expenses
              spent += tx.amount;
            }
          }
        }

        progressList.push(calculateBudgetProgress(budget, spent));
      } catch (error) {
        console.error('Error calculating budget progress:', error);
        progressList.push(calculateBudgetProgress(budget, 0));
      }
    }

    setBudgetProgress(progressList);
  }, [user?.id, budgets]);

  // Refresh budget progress when budgets change
  useEffect(() => {
    refreshBudgetProgress();
  }, [refreshBudgetProgress]);

  // Calculate transactions with running balance
  const transactions = React.useMemo(() => {
    if (!selectedAccount || rawTransactions.length === 0) return [];

    // For running balance, we need the starting balance (account balance minus all transactions)
    let startingBalance = selectedAccount.balance;
    for (const tx of rawTransactions) {
      if (tx.type === TransactionType.INCOME || tx.type === TransactionType.TRANSFER_IN) {
        startingBalance -= tx.amount;
      } else {
        startingBalance += tx.amount;
      }
    }

    return calculateRunningBalances(rawTransactions, startingBalance);
  }, [rawTransactions, selectedAccount]);

  // Filter categories by type
  const expenseCategories = React.useMemo(
    () => categories.filter((c) => c.type === CategoryType.EXPENSE),
    [categories]
  );

  const incomeCategories = React.useMemo(
    () => categories.filter((c) => c.type === CategoryType.INCOME),
    [categories]
  );

  // Account operations
  const addAccount = useCallback(
    async (data: { name: string; type: AccountType; initialBalance?: number; color?: string }) => {
      if (!user?.id) throw new Error('User not authenticated');
      return createAccount(user.id, data);
    },
    [user?.id]
  );

  const editAccount = useCallback(async (id: string, data: Partial<Account>) => {
    await updateAccount(id, data);
  }, []);

  const removeAccount = useCallback(async (id: string) => {
    await deleteAccount(id);
    if (selectedAccount?.id === id) {
      setSelectedAccount(accounts.find((a) => a.id !== id) || null);
    }
  }, [selectedAccount, accounts]);

  // Transaction operations
  const addTransaction = useCallback(
    async (data: {
      type: TransactionType;
      amount: number;
      description: string;
      categoryId?: string;
      date: Date;
      notes?: string;
      accountId?: string;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');

      // Use provided accountId or fall back to selectedAccount
      const targetAccountId = data.accountId || selectedAccount?.id;
      if (!targetAccountId) throw new Error('No account selected');

      const tx = await createTransaction(user.id, {
        ...data,
        accountId: targetAccountId,
      });

      // Adjust account balance based on transaction type
      const isAddition = data.type === TransactionType.INCOME || data.type === TransactionType.TRANSFER_IN;
      await adjustAccountBalance(targetAccountId, data.amount, isAddition);

      // Refresh budget progress
      refreshBudgetProgress();

      return tx;
    },
    [user?.id, selectedAccount?.id, refreshBudgetProgress]
  );

  const editTransaction = useCallback(
    async (id: string, data: Partial<Transaction>) => {
      // Find the old transaction to reverse its balance effect
      const oldTx = rawTransactions.find(t => t.id === id);

      if (oldTx && selectedAccount?.id) {
        // Reverse the old transaction's effect
        const wasAddition = oldTx.type === TransactionType.INCOME || oldTx.type === TransactionType.TRANSFER_IN;
        await adjustAccountBalance(selectedAccount.id, oldTx.amount, !wasAddition);

        // Apply the new transaction's effect
        const newType = data.type || oldTx.type;
        const newAmount = data.amount || oldTx.amount;
        const isAddition = newType === TransactionType.INCOME || newType === TransactionType.TRANSFER_IN;
        await adjustAccountBalance(selectedAccount.id, newAmount, isAddition);
      }

      await updateTransaction(id, data);
      refreshBudgetProgress();
    },
    [selectedAccount?.id, rawTransactions, refreshBudgetProgress]
  );

  const removeTransaction = useCallback(
    async (id: string) => {
      // Find the transaction to get its details before deleting
      const txToDelete = rawTransactions.find(t => t.id === id);
      await deleteTransaction(id);

      // Reverse the balance adjustment
      if (selectedAccount?.id && txToDelete) {
        const wasAddition = txToDelete.type === TransactionType.INCOME || txToDelete.type === TransactionType.TRANSFER_IN;
        // If it was an addition, we subtract; if it was a subtraction, we add back
        await adjustAccountBalance(selectedAccount.id, txToDelete.amount, !wasAddition);
      }

      refreshBudgetProgress();
    },
    [selectedAccount?.id, rawTransactions, refreshBudgetProgress]
  );

  // Budget operations
  const addBudget = useCallback(
    async (data: {
      name: string;
      categoryId?: string | null;
      amount: number;
      period: BudgetPeriod;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');
      const budget = await createBudget(user.id, data);
      return budget;
    },
    [user?.id]
  );

  const editBudget = useCallback(async (id: string, data: Partial<Budget>) => {
    await updateBudget(id, data);
  }, []);

  const removeBudget = useCallback(async (id: string) => {
    await deleteBudget(id);
  }, []);

  // Goal operations
  const addGoal = useCallback(
    async (data: CreateSavingsGoalInput) => {
      if (!user?.id) throw new Error('User not authenticated');
      return createGoal(user.id, data);
    },
    [user?.id]
  );

  const editGoal = useCallback(async (id: string, data: Partial<SavingsGoal>) => {
    await updateGoal(id, data);
  }, []);

  const removeGoal = useCallback(async (id: string) => {
    await deleteGoal(id);
  }, []);

  const contributeToGoal = useCallback(
    async (goalId: string, amount: number, note?: string) => {
      if (!user?.id) throw new Error('User not authenticated');
      return addContribution(user.id, goalId, amount, note);
    },
    [user?.id]
  );

  // Category operations
  const addCategory = useCallback(
    async (data: { name: string; type: CategoryType; icon: string; color: string }) => {
      if (!user?.id) throw new Error('User not authenticated');
      return createCategory(user.id, data);
    },
    [user?.id]
  );

  const editCategory = useCallback(
    async (id: string, data: Partial<Pick<Category, 'name' | 'icon' | 'color'>>) => {
      await updateCategory(id, data);
    },
    []
  );

  const removeCategory = useCallback(
    async (id: string) => {
      // Check if category is used in transactions or budgets
      const usedInTransactions = rawTransactions.some((t) => t.categoryId === id);
      const usedInBudgets = budgets.some((b) => b.categoryId === id);

      if (usedInTransactions || usedInBudgets) {
        throw new Error('Cannot delete category that is in use by transactions or budgets');
      }

      await deleteCategory(id);
    },
    [rawTransactions, budgets]
  );

  // Recurring transaction operations
  const addRecurringTransaction = useCallback(
    async (data: {
      accountId: string;
      type: TransactionType;
      amount: number;
      description: string;
      categoryId: string;
      frequency: RecurringFrequency;
      startDate: Date;
      endDate?: Date;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');
      return createRecurringTransaction(user.id, data);
    },
    [user?.id]
  );

  const editRecurringTransaction = useCallback(
    async (id: string, data: Partial<Pick<RecurringTransaction, 'amount' | 'description' | 'categoryId' | 'frequency' | 'endDate' | 'isActive'>>) => {
      await updateRecurringTransaction(id, data);
    },
    []
  );

  const removeRecurringTransaction = useCallback(
    async (id: string) => {
      await deleteRecurringTransaction(id);
    },
    []
  );

  const processRecurring = useCallback(async () => {
    if (!user?.id) return 0;
    const count = await processRecurringTransactions(user.id);
    if (count > 0) {
      refreshBudgetProgress();
    }
    return count;
  }, [user?.id, refreshBudgetProgress]);

  const value: DataContextType = {
    accounts,
    selectedAccount,
    setSelectedAccount,
    addAccount,
    editAccount,
    removeAccount,
    transactions,
    addTransaction,
    editTransaction,
    removeTransaction,
    categories,
    expenseCategories,
    incomeCategories,
    addCategory,
    editCategory,
    removeCategory,
    budgets,
    budgetProgress,
    addBudget,
    editBudget,
    removeBudget,
    refreshBudgetProgress,
    goals,
    goalProgress,
    addGoal,
    editGoal,
    removeGoal,
    contributeToGoal,
    recurringTransactions,
    addRecurringTransaction,
    editRecurringTransaction,
    removeRecurringTransaction,
    processRecurring,
    isLoading,
    isInitialized,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
