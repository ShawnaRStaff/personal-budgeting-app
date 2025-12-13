import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../theme';
import { Budget, BudgetPeriod, Category } from '../types';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    amount: number;
    period: BudgetPeriod;
  }) => Promise<void>;
  budget: Budget | null;
  category?: Category;
}

const PERIODS = [
  { value: BudgetPeriod.WEEKLY, label: 'Weekly', icon: 'view-week' },
  { value: BudgetPeriod.BIWEEKLY, label: 'Bi-weekly', icon: 'date-range' },
  { value: BudgetPeriod.MONTHLY, label: 'Monthly', icon: 'calendar-today' },
  { value: BudgetPeriod.YEARLY, label: 'Yearly', icon: 'event' },
];

export function EditBudgetModal({ visible, onClose, onSubmit, budget, category }: Props) {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [period, setPeriod] = useState<BudgetPeriod>(BudgetPeriod.MONTHLY);
  const [isLoading, setIsLoading] = useState(false);

  // Populate form when budget changes
  useEffect(() => {
    if (budget) {
      setName(budget.name);
      setAmount(budget.amount.toString());
      setPeriod(budget.period);
    }
  }, [budget]);

  const handleClose = () => {
    onClose();
  };

  const handleSubmit = async () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    const budgetName = name.trim() || category?.name || 'Budget';

    setIsLoading(true);
    try {
      await onSubmit({
        name: budgetName,
        amount: numAmount,
        period,
      });
      handleClose();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update budget');
    } finally {
      setIsLoading(false);
    }
  };

  if (!budget) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Pressable onPress={handleClose} style={styles.closeBtn}>
              <MaterialIcons name="close" size={24} color={colors.text} />
            </Pressable>
            <Text style={styles.title}>Edit Budget</Text>
            <View style={styles.closeBtn} />
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Category (Read-only) */}
            {category && (
              <View style={styles.field}>
                <Text style={styles.label}>Category</Text>
                <View style={styles.categoryDisplay}>
                  <View style={[styles.categoryIcon, { backgroundColor: category.color + '20' }]}>
                    <MaterialIcons name={category.icon as any} size={20} color={category.color} />
                  </View>
                  <Text style={styles.categoryName}>{category.name}</Text>
                </View>
              </View>
            )}

            {/* Amount */}
            <View style={styles.field}>
              <Text style={styles.label}>Budget Amount *</Text>
              <View style={styles.inputContainer}>
                <Text style={styles.currencySymbol}>$</Text>
                <TextInput
                  style={styles.input}
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="0.00"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="decimal-pad"
                  autoFocus
                />
              </View>
            </View>

            {/* Period */}
            <View style={styles.field}>
              <Text style={styles.label}>Budget Period</Text>
              <View style={styles.periodGrid}>
                {PERIODS.map((p) => (
                  <Pressable
                    key={p.value}
                    style={[
                      styles.periodItem,
                      period === p.value && styles.periodItemSelected,
                    ]}
                    onPress={() => setPeriod(p.value)}
                  >
                    <MaterialIcons
                      name={p.icon as any}
                      size={20}
                      color={period === p.value ? colors.primary : colors.textMuted}
                    />
                    <Text
                      style={[
                        styles.periodLabel,
                        period === p.value && styles.periodLabelSelected,
                      ]}
                    >
                      {p.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Budget Name (Optional) */}
            <View style={styles.field}>
              <Text style={styles.label}>Custom Name (Optional)</Text>
              <Text style={styles.hint}>
                Leave empty to use the category name
              </Text>
              <View style={styles.inputContainer}>
                <MaterialIcons name="label" size={20} color={colors.textMuted} />
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder={category?.name || "Budget name"}
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            </View>
          </ScrollView>

          {/* Submit Button */}
          <View style={styles.footer}>
            <Pressable
              style={[styles.submitBtn, isLoading && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.text} />
              ) : (
                <>
                  <MaterialIcons name="check" size={20} color={colors.text} />
                  <Text style={styles.submitBtnText}>Save Changes</Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: colors.background,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.h3,
  },
  content: {
    padding: spacing.lg,
  },
  field: {
    marginBottom: spacing.xl,
  },
  label: {
    ...typography.bodySmall,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  hint: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  categoryDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryName: {
    ...typography.body,
    color: colors.text,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    height: 56,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.text,
  },
  currencySymbol: {
    ...typography.body,
    color: colors.textMuted,
  },
  periodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  periodItem: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    gap: spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  periodItemSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  periodLabel: {
    ...typography.body,
    color: colors.textMuted,
  },
  periodLabelSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    height: 56,
    gap: spacing.sm,
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitBtnText: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text,
  },
});
