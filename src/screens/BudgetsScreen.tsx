import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../theme';
import { useData, useTips } from '../contexts';
import { Budget, BudgetProgress } from '../types';
import { BudgetCard, AddBudgetModal, EditBudgetModal, SwipeableRow, TipCard } from '../components';

export function BudgetsScreen() {
  const {
    budgets,
    budgetProgress,
    expenseCategories,
    categories,
    addBudget,
    editBudget,
    removeBudget,
    refreshBudgetProgress,
  } = useData();

  const [showAddBudget, setShowAddBudget] = useState(false);
  const [showEditBudget, setShowEditBudget] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Tips
  const { getCurrentTip, dismissTip, nextTip, recordBudgetCreated } = useTips();
  const currentTip = getCurrentTip('budgets');

  // Calculate totals
  const totals = useMemo(() => {
    let totalBudgeted = 0;
    let totalSpent = 0;

    for (const progress of budgetProgress) {
      totalBudgeted += progress.budget.amount;
      totalSpent += progress.spent;
    }

    const totalRemaining = totalBudgeted - totalSpent;
    const percentUsed = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;

    return { totalBudgeted, totalSpent, totalRemaining, percentUsed };
  }, [budgetProgress]);

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    });
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshBudgetProgress();
    setRefreshing(false);
  };

  const handleAddBudget = async (data: any) => {
    await addBudget(data);
    recordBudgetCreated();
  };

  const handleEditBudget = (budget: Budget) => {
    setSelectedBudget(budget);
    setShowEditBudget(true);
  };

  const handleEditSubmit = async (data: { name: string; amount: number; period: any }) => {
    if (!selectedBudget) return;
    await editBudget(selectedBudget.id, data);
  };

  const handleDeleteBudget = (budget: Budget) => {
    Alert.alert(
      'Delete Budget',
      `Are you sure you want to delete "${budget.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeBudget(budget.id);
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete budget');
            }
          },
        },
      ]
    );
  };

  // Get category for a budget
  const getCategory = (categoryId?: string | null) => {
    if (!categoryId) return undefined;
    return categories.find((c) => c.id === categoryId);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Budgets</Text>
          <Pressable style={styles.addBtn} onPress={() => setShowAddBudget(true)}>
            <MaterialIcons name="add" size={24} color={colors.text} />
          </Pressable>
        </View>

        {/* Tip Card */}
        {currentTip && (
          <TipCard
            tip={currentTip}
            onDismiss={dismissTip}
            onNext={() => nextTip('budgets')}
          />
        )}

        {budgetProgress.length > 0 ? (
          <>
            {/* Summary Card */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <View>
                  <Text style={styles.summaryLabel}>TOTAL BUDGETED</Text>
                  <Text style={styles.summaryAmount}>{formatCurrency(totals.totalBudgeted)}</Text>
                </View>
                <View style={styles.summaryRight}>
                  <Text style={styles.summaryLabel}>SPENT</Text>
                  <Text style={[styles.summaryAmount, styles.spentAmount]}>
                    {formatCurrency(totals.totalSpent)}
                  </Text>
                </View>
              </View>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.min(100, totals.percentUsed)}%`,
                      backgroundColor: totals.percentUsed > 100 ? colors.error : colors.primary,
                    },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {totals.totalRemaining >= 0
                  ? `${formatCurrency(totals.totalRemaining)} remaining`
                  : `${formatCurrency(Math.abs(totals.totalRemaining))} over budget`}
              </Text>
            </View>

            {/* Budget List */}
            <View style={styles.budgetList}>
              {budgetProgress.map((progress) => (
                <SwipeableRow
                  key={progress.budget.id}
                  onEdit={() => handleEditBudget(progress.budget)}
                  onDelete={() => handleDeleteBudget(progress.budget)}
                >
                  <BudgetCard
                    progress={progress}
                    category={getCategory(progress.budget.categoryId)}
                    onPress={() => handleEditBudget(progress.budget)}
                  />
                </SwipeableRow>
              ))}
            </View>
          </>
        ) : (
          /* Empty State */
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <MaterialIcons name="pie-chart" size={56} color={colors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>No budgets yet</Text>
            <Text style={styles.emptySubtitle}>
              Create spending limits for your categories to stay on track with your financial goals
            </Text>
            <View style={styles.emptyTip}>
              <MaterialIcons name="lightbulb" size={16} color={colors.info} />
              <Text style={styles.emptyTipText}>
                A budget isn't a restriction—it's permission to spend guilt-free on what matters to you.
              </Text>
            </View>
            <Pressable style={styles.ctaBtn} onPress={() => setShowAddBudget(true)}>
              <MaterialIcons name="add" size={20} color={colors.text} />
              <Text style={styles.ctaBtnText}>Create Budget</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

      {/* Add Budget Modal */}
      <AddBudgetModal
        visible={showAddBudget}
        onClose={() => setShowAddBudget(false)}
        onSubmit={handleAddBudget}
        categories={expenseCategories}
      />

      {/* Edit Budget Modal */}
      <EditBudgetModal
        visible={showEditBudget}
        onClose={() => {
          setShowEditBudget(false);
          setSelectedBudget(null);
        }}
        onSubmit={handleEditSubmit}
        budget={selectedBudget}
        category={selectedBudget ? getCategory(selectedBudget.categoryId) : undefined}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h1,
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  summaryRight: {
    alignItems: 'flex-end',
  },
  summaryLabel: {
    ...typography.label,
    marginBottom: spacing.xs,
  },
  summaryAmount: {
    ...typography.h2,
  },
  spentAmount: {
    color: colors.textSecondary,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.background,
    borderRadius: borderRadius.full,
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
  progressText: {
    ...typography.bodySmall,
    color: colors.textMuted,
    textAlign: 'center',
  },
  budgetList: {
    gap: spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    ...typography.bodySmall,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  emptyTip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: `${colors.info}10`,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  emptyTipText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    flex: 1,
    fontStyle: 'italic',
  },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  ctaBtnText: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text,
  },
});
