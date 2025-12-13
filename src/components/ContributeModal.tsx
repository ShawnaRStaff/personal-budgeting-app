import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../theme';
import { SavingsGoal } from '../types';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSubmit: (amount: number, note?: string) => Promise<void>;
  goal: SavingsGoal | null;
}

export function ContributeModal({ visible, onClose, onSubmit, goal }: Props) {
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const resetForm = () => {
    setAmount('');
    setNote('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    setIsLoading(true);
    try {
      await onSubmit(numAmount, note.trim() || undefined);
      handleClose();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add contribution');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (num: number) => {
    return `$${num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  if (!goal) return null;

  const remaining = goal.targetAmount - goal.currentAmount;
  const percentComplete = goal.targetAmount > 0
    ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
    : 0;

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
            <Text style={styles.title}>Add to Goal</Text>
            <View style={styles.closeBtn} />
          </View>

          {/* Goal Info */}
          <View style={styles.goalInfo}>
            <View style={[styles.goalIcon, { backgroundColor: (goal.color || colors.primary) + '20' }]}>
              <MaterialIcons
                name={(goal.icon as any) || 'flag'}
                size={28}
                color={goal.color || colors.primary}
              />
            </View>
            <Text style={styles.goalName}>{goal.name}</Text>
            <View style={styles.goalProgress}>
              <Text style={styles.goalCurrent}>{formatCurrency(goal.currentAmount)}</Text>
              <Text style={styles.goalTarget}> / {formatCurrency(goal.targetAmount)}</Text>
            </View>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${percentComplete}%`,
                    backgroundColor: goal.color || colors.primary,
                  },
                ]}
              />
            </View>
            <Text style={styles.remaining}>
              {formatCurrency(remaining)} remaining
            </Text>
          </View>

          {/* Amount Input */}
          <View style={styles.content}>
            <View style={styles.field}>
              <Text style={styles.label}>Amount to Add *</Text>
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

            {/* Quick Amount Buttons */}
            <View style={styles.quickAmounts}>
              {[25, 50, 100, remaining > 0 ? Math.min(remaining, 500) : 200].map((quickAmount, idx) => (
                <Pressable
                  key={idx}
                  style={styles.quickAmountBtn}
                  onPress={() => setAmount(quickAmount.toFixed(2))}
                >
                  <Text style={styles.quickAmountText}>
                    {idx === 3 && remaining > 0 && remaining <= 500 ? 'Finish' : `$${quickAmount}`}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Note Input */}
            <View style={styles.field}>
              <Text style={styles.label}>Note (Optional)</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  value={note}
                  onChangeText={setNote}
                  placeholder="e.g., Birthday money"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            </View>
          </View>

          {/* Submit Button */}
          <View style={styles.footer}>
            <Pressable
              style={[styles.submitBtn, { backgroundColor: goal.color || colors.primary }, isLoading && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.text} />
              ) : (
                <>
                  <MaterialIcons name="savings" size={20} color={colors.text} />
                  <Text style={styles.submitBtnText}>Add Contribution</Text>
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
  goalInfo: {
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.surface,
  },
  goalIcon: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  goalName: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  goalProgress: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: spacing.sm,
  },
  goalCurrent: {
    ...typography.h3,
    color: colors.text,
  },
  goalTarget: {
    ...typography.body,
    color: colors.textMuted,
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  remaining: {
    ...typography.caption,
    color: colors.textMuted,
  },
  content: {
    padding: spacing.lg,
  },
  field: {
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.bodySmall,
    color: colors.textMuted,
    marginBottom: spacing.sm,
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
  quickAmounts: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  quickAmountBtn: {
    flex: 1,
    backgroundColor: colors.surface,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  quickAmountText: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: colors.text,
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
