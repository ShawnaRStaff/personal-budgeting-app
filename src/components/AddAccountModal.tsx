import React, { useState } from 'react';
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
import { AccountType } from '../types';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    type: AccountType;
    initialBalance?: number;
    color?: string;
  }) => Promise<void>;
}

const ACCOUNT_TYPES = [
  { type: AccountType.CHECKING, label: 'Checking', icon: 'account-balance' },
  { type: AccountType.SAVINGS, label: 'Savings', icon: 'savings' },
  { type: AccountType.CREDIT_CARD, label: 'Credit Card', icon: 'credit-card' },
  { type: AccountType.CASH, label: 'Cash', icon: 'payments' },
  { type: AccountType.INVESTMENT, label: 'Investment', icon: 'trending-up' },
  { type: AccountType.OTHER, label: 'Other', icon: 'account-balance-wallet' },
];

const ACCOUNT_COLORS = [
  '#4CAF50', // Green
  '#2196F3', // Blue
  '#9C27B0', // Purple
  '#FF9800', // Orange
  '#E91E63', // Pink
  '#00BCD4', // Cyan
  '#FF5722', // Deep Orange
  '#607D8B', // Blue Grey
];

export function AddAccountModal({ visible, onClose, onSubmit }: Props) {
  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>(AccountType.CHECKING);
  const [initialBalance, setInitialBalance] = useState('');
  const [color, setColor] = useState(ACCOUNT_COLORS[0]);
  const [isLoading, setIsLoading] = useState(false);

  const resetForm = () => {
    setName('');
    setType(AccountType.CHECKING);
    setInitialBalance('');
    setColor(ACCOUNT_COLORS[0]);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter an account name');
      return;
    }

    const balance = initialBalance ? parseFloat(initialBalance) : 0;
    if (initialBalance && isNaN(balance)) {
      Alert.alert('Error', 'Please enter a valid balance');
      return;
    }

    setIsLoading(true);
    try {
      await onSubmit({
        name: name.trim(),
        type,
        initialBalance: balance,
        color,
      });
      handleClose();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create account');
    } finally {
      setIsLoading(false);
    }
  };

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
            <Text style={styles.title}>Add Account</Text>
            <View style={styles.closeBtn} />
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Account Name */}
            <View style={styles.field}>
              <Text style={styles.label}>Account Name</Text>
              <View style={styles.inputContainer}>
                <MaterialIcons name="edit" size={20} color={colors.textMuted} />
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g., Main Checking"
                  placeholderTextColor={colors.textMuted}
                  autoFocus
                />
              </View>
            </View>

            {/* Account Type */}
            <View style={styles.field}>
              <Text style={styles.label}>Account Type</Text>
              <View style={styles.typeGrid}>
                {ACCOUNT_TYPES.map((accountType) => (
                  <Pressable
                    key={accountType.type}
                    style={[
                      styles.typeItem,
                      type === accountType.type && styles.typeItemSelected,
                    ]}
                    onPress={() => setType(accountType.type)}
                  >
                    <MaterialIcons
                      name={accountType.icon as any}
                      size={24}
                      color={type === accountType.type ? colors.primary : colors.textMuted}
                    />
                    <Text style={[
                      styles.typeLabel,
                      type === accountType.type && styles.typeLabelSelected,
                    ]}>
                      {accountType.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Initial Balance */}
            <View style={styles.field}>
              <Text style={styles.label}>Current Balance</Text>
              <View style={styles.inputContainer}>
                <Text style={styles.currencySymbol}>$</Text>
                <TextInput
                  style={styles.input}
                  value={initialBalance}
                  onChangeText={setInitialBalance}
                  placeholder="0.00"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="decimal-pad"
                />
              </View>
              <Text style={styles.hint}>
                Enter your current account balance to start tracking
              </Text>
            </View>

            {/* Color */}
            <View style={styles.field}>
              <Text style={styles.label}>Color</Text>
              <View style={styles.colorGrid}>
                {ACCOUNT_COLORS.map((c) => (
                  <Pressable
                    key={c}
                    style={[
                      styles.colorItem,
                      { backgroundColor: c },
                      color === c && styles.colorItemSelected,
                    ]}
                    onPress={() => setColor(c)}
                  >
                    {color === c && (
                      <MaterialIcons name="check" size={20} color="#fff" />
                    )}
                  </Pressable>
                ))}
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
                  <MaterialIcons name="add" size={20} color={colors.text} />
                  <Text style={styles.submitBtnText}>Create Account</Text>
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
  hint: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  typeItem: {
    width: '31%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  typeItemSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  typeLabel: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
  },
  typeLabelSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  colorItem: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorItemSelected: {
    borderWidth: 3,
    borderColor: '#fff',
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
