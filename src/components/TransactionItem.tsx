import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../theme';
import { Transaction, TransactionType, Category } from '../types';

interface Props {
  transaction: Transaction & { runningBalance: number };
  category?: Category;
  onPress?: () => void;
}

export function TransactionItem({ transaction, category, onPress }: Props) {
  const isIncome = transaction.type === TransactionType.INCOME ||
    transaction.type === TransactionType.TRANSFER_IN;

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
    });
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    }
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Pressable style={styles.container} onPress={onPress}>
      <View style={styles.leftSection}>
        <View style={[
          styles.iconContainer,
          { backgroundColor: category?.color ? category.color + '20' : colors.surface }
        ]}>
          <MaterialIcons
            name={(category?.icon || (isIncome ? 'arrow-downward' : 'arrow-upward')) as any}
            size={20}
            color={category?.color || (isIncome ? colors.success : colors.error)}
          />
        </View>
        <View style={styles.details}>
          <Text style={styles.description} numberOfLines={1}>
            {transaction.description}
          </Text>
          <View style={styles.metaRow}>
            <Text style={styles.category}>
              {category?.name || (isIncome ? 'Income' : 'Expense')}
            </Text>
            <View style={styles.dateDot} />
            <Text style={styles.date}>{formatDate(transaction.date)}</Text>
            {!transaction.isCleared && (
              <>
                <View style={styles.dateDot} />
                <Text style={styles.pendingBadge}>Pending</Text>
              </>
            )}
          </View>
        </View>
      </View>

      <View style={styles.rightSection}>
        <Text style={[styles.amount, isIncome ? styles.incomeAmount : styles.expenseAmount]}>
          {isIncome ? '+' : '-'}{formatCurrency(transaction.amount)}
        </Text>
        <Text style={[
          styles.balance,
          transaction.runningBalance < 0 && styles.negativeBalance
        ]}>
          {formatCurrency(transaction.runningBalance)}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.sm,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  details: {
    flex: 1,
  },
  description: {
    ...typography.body,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  category: {
    ...typography.caption,
    color: colors.textMuted,
  },
  dateDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.textMuted,
    marginHorizontal: spacing.xs,
  },
  date: {
    ...typography.caption,
    color: colors.textMuted,
  },
  pendingBadge: {
    ...typography.caption,
    color: colors.warning,
    fontWeight: '600',
  },
  rightSection: {
    alignItems: 'flex-end',
  },
  amount: {
    ...typography.body,
    fontWeight: '600',
  },
  incomeAmount: {
    color: colors.success,
  },
  expenseAmount: {
    color: colors.text,
  },
  balance: {
    ...typography.caption,
    color: colors.textMuted,
  },
  negativeBalance: {
    color: colors.error,
  },
});
