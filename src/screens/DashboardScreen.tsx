import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../theme';
import { useData, useTips } from '../contexts';
import { TransactionType, Account } from '../types';
import { TransactionItem, AddTransactionModal, AddAccountModal, NotificationsDropdown, AnalyticsView, TipCard } from '../components';

type ViewMode = 'all' | 'single';
type DashboardTab = 'overview' | 'analytics';

export function DashboardScreen() {
  const navigation = useNavigation<any>();
  const {
    accounts,
    selectedAccount,
    setSelectedAccount,
    transactions,
    categories,
    expenseCategories,
    incomeCategories,
    budgetProgress,
    goalProgress,
    addTransaction,
    addRecurringTransaction,
    addAccount,
    isLoading,
  } = useData();

  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [dashboardTab, setDashboardTab] = useState<DashboardTab>('overview');
  const [showAccountPicker, setShowAccountPicker] = useState(false);
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [quickAddType, setQuickAddType] = useState<'income' | 'expense'>('expense');
  const [dismissedAlertIds, setDismissedAlertIds] = useState<Set<string>>(new Set());
  const [alertsSeen, setAlertsSeen] = useState(false);

  // Tips
  const { getCurrentTip, dismissTip, nextTip, recordTransaction } = useTips();
  const currentTip = getCurrentTip(dashboardTab === 'overview' ? 'dashboard' : 'analytics');

  // Get greeting based on time of day
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  // Calculate totals for all accounts
  const allAccountsTotals = useMemo(() => {
    const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
    return { totalBalance };
  }, [accounts]);

  // Calculate income/expenses for current month (for selected account or all)
  const monthlyStats = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // Filter transactions for current month
    const monthTransactions = transactions.filter(
      (t) => t.date >= startOfMonth && t.date <= endOfMonth
    );

    let income = 0;
    let expenses = 0;

    for (const tx of monthTransactions) {
      if (tx.type === TransactionType.INCOME || tx.type === TransactionType.TRANSFER_IN) {
        income += tx.amount;
      } else if (tx.type === TransactionType.EXPENSE || tx.type === TransactionType.TRANSFER_OUT) {
        expenses += tx.amount;
      }
    }

    return { income, expenses };
  }, [transactions]);

  // Get recent transactions (last 5)
  const recentTransactions = useMemo(() => {
    return transactions.slice(0, 5);
  }, [transactions]);

  // Get category by ID
  const getCategory = (categoryId?: string | null) => {
    if (!categoryId) return undefined;
    return categories.find((c) => c.id === categoryId);
  };

  // Get category for a budget
  const getBudgetCategory = (budgetCategoryId?: string | null) => {
    if (!budgetCategoryId) return undefined;
    return categories.find((c) => c.id === budgetCategoryId);
  };

  // Get display balance based on view mode
  const displayBalance = viewMode === 'all'
    ? allAccountsTotals.totalBalance
    : (selectedAccount?.balance || 0);

  const displayAccountName = viewMode === 'all'
    ? 'All Accounts'
    : (selectedAccount?.name || 'No Account');

  const handleQuickAdd = (type: 'income' | 'expense') => {
    if (accounts.length === 0) {
      setShowAddAccount(true);
      return;
    }
    // If in single account mode and no account selected, select first one
    if (viewMode === 'single' && !selectedAccount && accounts.length > 0) {
      setSelectedAccount(accounts[0]);
    }
    setQuickAddType(type);
    setShowAddTransaction(true);
  };

  const handleAddTransaction = async (data: any) => {
    await addTransaction(data);
    recordTransaction();
  };

  const handleAddRecurringTransaction = async (data: any) => {
    await addRecurringTransaction(data);
  };

  const handleAddAccount = async (data: any) => {
    const newAccount = await addAccount(data);
    setSelectedAccount(newAccount);
    setViewMode('single');
  };

  const handleSelectAccount = (account: Account | null) => {
    if (account) {
      setSelectedAccount(account);
      setViewMode('single');
    } else {
      setViewMode('all');
    }
    setShowAccountPicker(false);
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return `$${Math.abs(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Generate notification count using the unified system
  const notificationCount = useMemo(() => {
    // Count budget alerts (80%+)
    const budgetAlertCount = budgetProgress.filter((bp) => bp.percentUsed >= 80).length;
    // Count goal alerts (deadlines, behind schedule, milestones)
    const goalAlertCount = goalProgress.filter((gp) =>
      !gp.goal.isCompleted && (
        (gp.daysUntilDeadline !== null && gp.daysUntilDeadline <= 14) ||
        !gp.isOnTrack ||
        (gp.percentComplete >= 25 && gp.percentComplete < 30) ||
        (gp.percentComplete >= 50 && gp.percentComplete < 55) ||
        (gp.percentComplete >= 75 && gp.percentComplete < 80)
      )
    ).length;
    return budgetAlertCount + goalAlertCount;
  }, [budgetProgress, goalProgress]);

  // Reset seen state when notification count changes
  useEffect(() => {
    if (notificationCount > 0) {
      setAlertsSeen(false);
    }
  }, [notificationCount]);

  // Badge count (only show if not seen)
  const badgeCount = alertsSeen ? 0 : Math.max(notificationCount - dismissedAlertIds.size, 0);

  // Handle dismissing an alert
  const handleDismissAlert = useCallback((notificationId: string) => {
    setDismissedAlertIds((prev) => {
      const next = new Set(prev);
      next.add(notificationId);
      return next;
    });
  }, []);

  // Handle opening notifications (marks as seen)
  const handleOpenNotifications = useCallback(() => {
    setShowNotifications(true);
    setAlertsSeen(true);
  }, []);

  // Calculate total budget summary
  const totalBudgetSummary = useMemo(() => {
    if (budgetProgress.length === 0) return null;

    const totalBudgeted = budgetProgress.reduce((sum, bp) => sum + bp.budget.amount, 0);
    const totalSpent = budgetProgress.reduce((sum, bp) => sum + bp.spent, 0);
    const totalRemaining = totalBudgeted - totalSpent;
    const percentUsed = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;

    return {
      totalBudgeted,
      totalSpent,
      totalRemaining,
      percentUsed,
      isOverBudget: totalSpent > totalBudgeted,
    };
  }, [budgetProgress]);

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting}</Text>
            <Text style={styles.name}>Welcome back</Text>
          </View>
          <Pressable
            style={styles.notificationBtn}
            onPress={handleOpenNotifications}
          >
            <MaterialIcons
              name="notifications-none"
              size={24}
              color={colors.text}
            />
            {badgeCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {badgeCount > 9 ? '9+' : badgeCount}
                </Text>
              </View>
            )}
          </Pressable>
        </View>

        {/* Dashboard Tab Selector */}
        <View style={styles.tabSelector}>
          <Pressable
            style={[styles.tabOption, dashboardTab === 'overview' && styles.tabOptionActive]}
            onPress={() => setDashboardTab('overview')}
          >
            <MaterialIcons
              name="dashboard"
              size={18}
              color={dashboardTab === 'overview' ? colors.text : colors.textMuted}
            />
            <Text style={[styles.tabOptionText, dashboardTab === 'overview' && styles.tabOptionTextActive]}>
              Overview
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tabOption, dashboardTab === 'analytics' && styles.tabOptionActive]}
            onPress={() => setDashboardTab('analytics')}
          >
            <MaterialIcons
              name="insert-chart"
              size={18}
              color={dashboardTab === 'analytics' ? colors.text : colors.textMuted}
            />
            <Text style={[styles.tabOptionText, dashboardTab === 'analytics' && styles.tabOptionTextActive]}>
              Analytics
            </Text>
          </Pressable>
        </View>

        {/* Tip Card */}
        {currentTip && (
          <TipCard
            tip={currentTip}
            onDismiss={dismissTip}
            onNext={() => nextTip(dashboardTab === 'overview' ? 'dashboard' : 'analytics')}
          />
        )}

        {/* Account Selector */}
        <Pressable
          style={styles.accountSelector}
          onPress={() => setShowAccountPicker(!showAccountPicker)}
        >
          <View style={styles.accountInfo}>
            <MaterialIcons
              name={viewMode === 'all' ? 'account-balance-wallet' : 'account-balance'}
              size={20}
              color={colors.primary}
            />
            <Text style={styles.accountName}>{displayAccountName}</Text>
          </View>
          <MaterialIcons
            name={showAccountPicker ? 'expand-less' : 'expand-more'}
            size={24}
            color={colors.textMuted}
          />
        </Pressable>

        {/* Account Picker Dropdown */}
        {showAccountPicker && (
          <View style={styles.accountPicker}>
            <Pressable
              style={[styles.accountOption, viewMode === 'all' && styles.accountOptionSelected]}
              onPress={() => handleSelectAccount(null)}
            >
              <MaterialIcons name="account-balance-wallet" size={20} color={colors.primary} />
              <Text style={styles.accountOptionText}>All Accounts</Text>
              <Text style={styles.accountOptionBalance}>{formatCurrency(allAccountsTotals.totalBalance)}</Text>
              {viewMode === 'all' && (
                <MaterialIcons name="check" size={20} color={colors.primary} />
              )}
            </Pressable>
            {accounts.map((account) => (
              <Pressable
                key={account.id}
                style={[
                  styles.accountOption,
                  viewMode === 'single' && selectedAccount?.id === account.id && styles.accountOptionSelected,
                ]}
                onPress={() => handleSelectAccount(account)}
              >
                <View style={[styles.accountDot, { backgroundColor: account.color || colors.primary }]} />
                <Text style={styles.accountOptionText}>{account.name}</Text>
                <Text style={styles.accountOptionBalance}>{formatCurrency(account.balance)}</Text>
                {viewMode === 'single' && selectedAccount?.id === account.id && (
                  <MaterialIcons name="check" size={20} color={colors.primary} />
                )}
              </Pressable>
            ))}
            {accounts.length === 0 && (
              <Pressable
                style={styles.accountOption}
                onPress={() => {
                  setShowAccountPicker(false);
                  setShowAddAccount(true);
                }}
              >
                <MaterialIcons name="add" size={20} color={colors.primary} />
                <Text style={[styles.accountOptionText, { color: colors.primary }]}>Add Account</Text>
              </Pressable>
            )}
          </View>
        )}

        {/* Overview Tab Content */}
        {dashboardTab === 'overview' && (
          <>
            {/* Balance Card */}
            <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>
            {viewMode === 'all' ? 'TOTAL BALANCE' : 'ACCOUNT BALANCE'}
          </Text>
          <Text style={[
            styles.balanceAmount,
            displayBalance < 0 && { color: colors.expense }
          ]}>
            {displayBalance < 0 ? '-' : ''}{formatCurrency(displayBalance)}
          </Text>
          <View style={styles.balanceStats}>
            <View style={styles.stat}>
              <View style={styles.statIcon}>
                <MaterialIcons name="arrow-downward" size={16} color={colors.income} />
              </View>
              <View>
                <Text style={styles.statLabel}>Income</Text>
                <Text style={[styles.statValue, { color: colors.income }]}>
                  +{formatCurrency(monthlyStats.income)}
                </Text>
              </View>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <View style={[styles.statIcon, { backgroundColor: `${colors.expense}15` }]}>
                <MaterialIcons name="arrow-upward" size={16} color={colors.expense} />
              </View>
              <View>
                <Text style={styles.statLabel}>Expenses</Text>
                <Text style={[styles.statValue, { color: colors.expense }]}>
                  -{formatCurrency(monthlyStats.expenses)}
                </Text>
              </View>
            </View>
          </View>
          <Text style={styles.periodLabel}>This Month</Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Pressable style={styles.actionBtn} onPress={() => handleQuickAdd('income')}>
            <View style={[styles.actionIcon, { backgroundColor: `${colors.income}20` }]}>
              <MaterialIcons name="add" size={24} color={colors.income} />
            </View>
            <Text style={styles.actionLabel}>Add Income</Text>
          </Pressable>
          <Pressable style={styles.actionBtn} onPress={() => handleQuickAdd('expense')}>
            <View style={[styles.actionIcon, { backgroundColor: `${colors.expense}20` }]}>
              <MaterialIcons name="remove" size={24} color={colors.expense} />
            </View>
            <Text style={styles.actionLabel}>Add Expense</Text>
          </Pressable>
          <Pressable
            style={styles.actionBtn}
            onPress={() => accounts.length > 0 ? setShowAddAccount(true) : setShowAddAccount(true)}
          >
            <View style={[styles.actionIcon, { backgroundColor: `${colors.primary}20` }]}>
              <MaterialIcons name="account-balance" size={24} color={colors.primary} />
            </View>
            <Text style={styles.actionLabel}>Add Account</Text>
          </Pressable>
        </View>

        {/* Recent Transactions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            {recentTransactions.length > 0 && (
              <Pressable onPress={() => navigation.navigate('Register')}>
                <Text style={styles.seeAll}>See all</Text>
              </Pressable>
            )}
          </View>
          {recentTransactions.length > 0 ? (
            <View style={styles.transactionsList}>
              {recentTransactions.map((tx, index) => (
                <View key={tx.id}>
                  <TransactionItem
                    transaction={tx}
                    category={getCategory(tx.categoryId)}
                  />
                  {index < recentTransactions.length - 1 && (
                    <View style={styles.transactionSeparator} />
                  )}
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <MaterialIcons name="receipt-long" size={48} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>No transactions yet</Text>
              <Text style={styles.emptySubtitle}>
                Start tracking your finances by adding your first transaction
              </Text>
              <View style={styles.emptyTip}>
                <MaterialIcons name="lightbulb" size={16} color={colors.info} />
                <Text style={styles.emptyTipText}>
                  The average person has no idea where 30% of their money goes. You're about to change that.
                </Text>
              </View>
              <Pressable
                style={styles.emptyBtn}
                onPress={() => handleQuickAdd('expense')}
              >
                <MaterialIcons name="add" size={18} color={colors.text} />
                <Text style={styles.emptyBtnText}>Add Transaction</Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* Budget Overview */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Budget Overview</Text>
            {budgetProgress.length > 0 && (
              <Pressable onPress={() => navigation.navigate('Budgets')}>
                <Text style={styles.seeAll}>See all</Text>
              </Pressable>
            )}
          </View>
          {budgetProgress.length > 0 && totalBudgetSummary ? (
            <View style={styles.budgetOverview}>
              {/* Total Budget Summary Card */}
              <View style={styles.totalBudgetCard}>
                <View style={styles.totalBudgetHeader}>
                  <View style={styles.totalBudgetIcon}>
                    <MaterialIcons name="account-balance-wallet" size={20} color={colors.primary} />
                  </View>
                  <View style={styles.totalBudgetInfo}>
                    <Text style={styles.totalBudgetLabel}>Total Budget</Text>
                    <Text style={styles.totalBudgetAmount}>
                      {formatCurrency(totalBudgetSummary.totalSpent)} / {formatCurrency(totalBudgetSummary.totalBudgeted)}
                    </Text>
                  </View>
                  <Text style={[
                    styles.totalBudgetPercent,
                    totalBudgetSummary.isOverBudget && { color: colors.error }
                  ]}>
                    {Math.round(totalBudgetSummary.percentUsed)}%
                  </Text>
                </View>
                <View style={styles.budgetProgressBg}>
                  <View
                    style={[
                      styles.budgetProgressFill,
                      {
                        width: `${Math.min(totalBudgetSummary.percentUsed, 100)}%`,
                        backgroundColor: totalBudgetSummary.isOverBudget
                          ? colors.error
                          : totalBudgetSummary.percentUsed >= 80
                            ? colors.warning
                            : colors.primary,
                      }
                    ]}
                  />
                </View>
                <Text style={[
                  styles.totalBudgetRemaining,
                  totalBudgetSummary.isOverBudget && { color: colors.error }
                ]}>
                  {totalBudgetSummary.isOverBudget
                    ? `${formatCurrency(Math.abs(totalBudgetSummary.totalRemaining))} over budget`
                    : `${formatCurrency(totalBudgetSummary.totalRemaining)} remaining`
                  }
                </Text>
              </View>

              {/* Individual Category Budgets */}
              {budgetProgress.slice(0, 3).map((bp) => {
                const budgetCategory = getBudgetCategory(bp.budget.categoryId);
                return (
                  <View key={bp.budget.id} style={styles.budgetItem}>
                    <View style={styles.budgetHeader}>
                      <View style={styles.budgetNameRow}>
                        {budgetCategory && (
                          <View style={[styles.budgetCategoryIcon, { backgroundColor: budgetCategory.color + '20' }]}>
                            <MaterialIcons name={budgetCategory.icon as any} size={14} color={budgetCategory.color} />
                          </View>
                        )}
                        <Text style={styles.budgetName}>{bp.budget.name}</Text>
                      </View>
                      <Text style={[
                        styles.budgetAmount,
                        bp.remaining < 0 && { color: colors.error }
                      ]}>
                        {bp.remaining < 0 ? `-${formatCurrency(Math.abs(bp.remaining))}` : formatCurrency(bp.remaining)} left
                      </Text>
                    </View>
                    <View style={styles.budgetProgressBg}>
                      <View
                        style={[
                          styles.budgetProgressFill,
                          {
                            width: `${Math.min(bp.percentUsed, 100)}%`,
                            backgroundColor: bp.percentUsed >= 100
                              ? colors.error
                              : bp.percentUsed >= 80
                                ? colors.warning
                                : budgetCategory?.color || colors.primary,
                          }
                        ]}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <MaterialIcons name="pie-chart-outline" size={48} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>No budgets set</Text>
              <Text style={styles.emptySubtitle}>
                Create a budget to keep your spending on track
              </Text>
              <View style={styles.emptyTip}>
                <MaterialIcons name="lightbulb" size={16} color={colors.info} />
                <Text style={styles.emptyTipText}>
                  A budget isn't a restriction—it's permission to spend guilt-free on what matters to you.
                </Text>
              </View>
            </View>
          )}
        </View>
          </>
        )}

        {/* Analytics Tab Content */}
        {dashboardTab === 'analytics' && (
          <AnalyticsView
            transactions={transactions}
            categories={categories}
            budgetProgress={budgetProgress}
            selectedAccountId={viewMode === 'single' ? selectedAccount?.id : null}
          />
        )}
      </ScrollView>

      {/* Add Transaction Modal */}
      <AddTransactionModal
        visible={showAddTransaction}
        onClose={() => setShowAddTransaction(false)}
        onSubmit={handleAddTransaction}
        onSubmitRecurring={handleAddRecurringTransaction}
        categories={[...expenseCategories, ...incomeCategories]}
        initialType={quickAddType}
        accounts={accounts}
        selectedAccountId={viewMode === 'single' ? selectedAccount?.id : null}
        requireAccountSelection={viewMode === 'all'}
      />

      {/* Add Account Modal */}
      <AddAccountModal
        visible={showAddAccount}
        onClose={() => setShowAddAccount(false)}
        onSubmit={handleAddAccount}
      />

      {/* Notifications Dropdown */}
      <NotificationsDropdown
        visible={showNotifications}
        onClose={() => setShowNotifications(false)}
        budgetAlerts={budgetProgress}
        goalProgress={goalProgress}
        categories={categories}
        onDismissAlert={handleDismissAlert}
        dismissedIds={dismissedAlertIds}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  greeting: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  name: {
    ...typography.h2,
    marginTop: 2,
  },
  notificationBtn: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: colors.error,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    ...typography.caption,
    fontSize: 10,
    color: colors.text,
    fontWeight: '700',
  },
  tabSelector: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.xs,
    marginBottom: spacing.md,
  },
  tabOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    gap: spacing.xs,
  },
  tabOptionActive: {
    backgroundColor: colors.primary,
  },
  tabOptionText: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
  tabOptionTextActive: {
    color: colors.text,
    fontWeight: '600',
  },
  accountSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  accountInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  accountName: {
    ...typography.body,
    fontWeight: '600',
  },
  accountPicker: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  accountOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  accountOptionSelected: {
    backgroundColor: `${colors.primary}10`,
  },
  accountOptionText: {
    ...typography.body,
    flex: 1,
  },
  accountOptionBalance: {
    ...typography.body,
    color: colors.textSecondary,
  },
  accountDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  balanceCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  balanceLabel: {
    ...typography.label,
    marginBottom: spacing.xs,
  },
  balanceAmount: {
    ...typography.displayLarge,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  balanceStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stat: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.sm,
    backgroundColor: `${colors.income}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  statLabel: {
    ...typography.bodySmall,
    fontSize: 12,
    color: colors.textMuted,
  },
  statValue: {
    ...typography.currencySmall,
    fontSize: 16,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
  },
  periodLabel: {
    ...typography.bodySmall,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: spacing.xs,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  actionLabel: {
    ...typography.bodySmall,
    fontSize: 12,
    color: colors.textSecondary,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
  },
  seeAll: {
    ...typography.bodySmall,
    color: colors.primary,
  },
  transactionsList: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  transactionSeparator: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
  },
  emptyState: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyTitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  emptySubtitle: {
    ...typography.bodySmall,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  emptyBtnText: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: colors.text,
  },
  emptyTip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: `${colors.info}10`,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  emptyTipText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    flex: 1,
    fontStyle: 'italic',
  },
  budgetOverview: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  budgetItem: {
    marginBottom: spacing.md,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  budgetNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  budgetCategoryIcon: {
    width: 22,
    height: 22,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  budgetName: {
    ...typography.body,
    fontWeight: '500',
  },
  budgetAmount: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  budgetProgressBg: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  budgetProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  totalBudgetCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  totalBudgetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  totalBudgetIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  totalBudgetInfo: {
    flex: 1,
  },
  totalBudgetLabel: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
  totalBudgetAmount: {
    ...typography.body,
    fontWeight: '600',
  },
  totalBudgetPercent: {
    ...typography.h3,
    color: colors.primary,
  },
  totalBudgetRemaining: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
