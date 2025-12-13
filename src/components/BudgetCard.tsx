import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../theme';
import { BudgetProgress, Category, BudgetPeriod } from '../types';

interface Props {
  progress: BudgetProgress;
  category?: Category;
  onPress?: () => void;
}

const PERIOD_LABELS: Record<BudgetPeriod, string> = {
  [BudgetPeriod.WEEKLY]: 'Weekly',
  [BudgetPeriod.BIWEEKLY]: 'Bi-weekly',
  [BudgetPeriod.MONTHLY]: 'Monthly',
  [BudgetPeriod.YEARLY]: 'Yearly',
};

export function BudgetCard({ progress, category, onPress }: Props) {
  const { budget, spent, remaining, percentUsed, isOverBudget, daysRemaining } = progress;

  const formatCurrency = (amount: number) => {
    return Math.abs(amount).toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  // Determine progress bar color
  const getProgressColor = () => {
    if (isOverBudget) return colors.error;
    if (percentUsed >= budget.alertThreshold) return colors.warning;
    return colors.primary;
  };

  const progressColor = getProgressColor();

  return (
    <Pressable style={styles.container} onPress={onPress}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          {category ? (
            <View style={[styles.categoryIcon, { backgroundColor: category.color + '20' }]}>
              <MaterialIcons name={category.icon as any} size={18} color={category.color} />
            </View>
          ) : (
            <View style={[styles.categoryIcon, { backgroundColor: colors.primary + '20' }]}>
              <MaterialIcons name="account-balance-wallet" size={18} color={colors.primary} />
            </View>
          )}
          <View style={styles.titleInfo}>
            <Text style={styles.budgetName}>{budget.name}</Text>
            <Text style={styles.periodLabel}>{PERIOD_LABELS[budget.period]}</Text>
          </View>
        </View>
        <View style={styles.daysContainer}>
          <Text style={styles.daysRemaining}>{daysRemaining}</Text>
          <Text style={styles.daysLabel}>days left</Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.min(100, percentUsed)}%`,
                backgroundColor: progressColor,
              },
            ]}
          />
        </View>
      </View>

      {/* Stats */}
      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Spent</Text>
          <Text style={[styles.statValue, isOverBudget && styles.overBudgetText]}>
            {formatCurrency(spent)}
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Budget</Text>
          <Text style={styles.statValue}>{formatCurrency(budget.amount)}</Text>
        </View>
        <View style={[styles.statItem, styles.statItemLast]}>
          <Text style={styles.statLabel}>{isOverBudget ? 'Over' : 'Left'}</Text>
          <Text style={[styles.statValue, isOverBudget ? styles.overBudgetText : styles.remainingText]}>
            {isOverBudget ? `-${formatCurrency(Math.abs(remaining))}` : formatCurrency(remaining)}
          </Text>
        </View>
      </View>

      {/* Warning */}
      {isOverBudget && (
        <View style={styles.warningBanner}>
          <MaterialIcons name="warning" size={16} color={colors.error} />
          <Text style={styles.warningText}>
            Over budget by {formatCurrency(Math.abs(remaining))}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.sm,
  },
  categoryIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleInfo: {
    flex: 1,
  },
  budgetName: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text,
  },
  periodLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  daysContainer: {
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  daysRemaining: {
    ...typography.body,
    fontWeight: '700',
    color: colors.text,
  },
  daysLabel: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 10,
  },
  progressContainer: {
    marginBottom: spacing.md,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.background,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
  stats: {
    flexDirection: 'row',
  },
  statItem: {
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    paddingRight: spacing.sm,
  },
  statItemLast: {
    borderRightWidth: 0,
    paddingRight: 0,
    paddingLeft: spacing.sm,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: 2,
  },
  statValue: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text,
  },
  overBudgetText: {
    color: colors.error,
  },
  remainingText: {
    color: colors.success,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.error + '15',
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  warningText: {
    ...typography.caption,
    color: colors.error,
    fontWeight: '500',
  },
});
