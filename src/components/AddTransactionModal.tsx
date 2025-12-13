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
  Platform,
  Switch,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors, spacing, borderRadius, typography } from '../theme';
import { TransactionType, Category, CategoryType, Account, RecurringFrequency } from '../types';

const FREQUENCY_OPTIONS: { value: RecurringFrequency; label: string }[] = [
  { value: RecurringFrequency.WEEKLY, label: 'Weekly' },
  { value: RecurringFrequency.BIWEEKLY, label: 'Every 2 weeks' },
  { value: RecurringFrequency.MONTHLY, label: 'Monthly' },
  { value: RecurringFrequency.YEARLY, label: 'Yearly' },
];

interface Props {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: {
    type: TransactionType;
    amount: number;
    description: string;
    categoryId?: string;
    date: Date;
    notes?: string;
    accountId?: string;
  }) => Promise<void>;
  onSubmitRecurring?: (data: {
    type: TransactionType;
    amount: number;
    description: string;
    categoryId: string;
    startDate: Date;
    frequency: RecurringFrequency;
    accountId: string;
  }) => Promise<void>;
  categories: Category[];
  initialType?: 'income' | 'expense';
  accounts?: Account[];
  selectedAccountId?: string | null;
  requireAccountSelection?: boolean;
}

export function AddTransactionModal({
  visible,
  onClose,
  onSubmit,
  onSubmitRecurring,
  categories,
  initialType,
  accounts = [],
  selectedAccountId,
  requireAccountSelection = false,
}: Props) {
  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState<string | undefined>();
  const [accountId, setAccountId] = useState<string | undefined>();
  const [date, setDate] = useState(new Date());
  const [notes, setNotes] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showAccountPicker, setShowAccountPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Recurring transaction state
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState<RecurringFrequency>(RecurringFrequency.MONTHLY);
  const [showFrequencyPicker, setShowFrequencyPicker] = useState(false);

  // Set initial type and account when modal opens
  useEffect(() => {
    if (visible) {
      if (initialType) {
        setType(initialType === 'income' ? TransactionType.INCOME : TransactionType.EXPENSE);
      }
      if (selectedAccountId) {
        setAccountId(selectedAccountId);
      } else if (accounts.length > 0 && requireAccountSelection) {
        setAccountId(accounts[0].id);
      }
    }
  }, [visible, initialType, selectedAccountId, accounts, requireAccountSelection]);

  const filteredCategories = categories.filter((c) =>
    type === TransactionType.INCOME ? c.type === CategoryType.INCOME : c.type === CategoryType.EXPENSE
  );

  const selectedCategory = categories.find((c) => c.id === categoryId);
  const selectedAccount = accounts.find((a) => a.id === accountId);

  const resetForm = () => {
    setType(initialType === 'income' ? TransactionType.INCOME : TransactionType.EXPENSE);
    setAmount('');
    setDescription('');
    setCategoryId(undefined);
    setAccountId(selectedAccountId || undefined);
    setDate(new Date());
    setNotes('');
    setIsRecurring(false);
    setFrequency(RecurringFrequency.MONTHLY);
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

    if (!description.trim()) {
      Alert.alert('Error', 'Please enter a description');
      return;
    }

    if (requireAccountSelection && !accountId) {
      Alert.alert('Error', 'Please select an account');
      return;
    }

    // For recurring transactions, category is required
    if (isRecurring && !categoryId) {
      Alert.alert('Error', 'Please select a category for recurring transactions');
      return;
    }

    // For recurring transactions, account is required
    if (isRecurring && !accountId) {
      Alert.alert('Error', 'Please select an account for recurring transactions');
      return;
    }

    setIsLoading(true);
    try {
      if (isRecurring && onSubmitRecurring && accountId && categoryId) {
        await onSubmitRecurring({
          type,
          amount: numAmount,
          description: description.trim(),
          categoryId,
          startDate: date,
          frequency,
          accountId,
        });
      } else {
        await onSubmit({
          type,
          amount: numAmount,
          description: description.trim(),
          categoryId,
          date,
          notes: notes.trim() || undefined,
          accountId: requireAccountSelection ? accountId : undefined,
        });
      }
      handleClose();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add transaction');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (d: Date) => {
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
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
            <Text style={styles.title}>Add Transaction</Text>
            <View style={styles.closeBtn} />
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Transaction Type Toggle */}
            <View style={styles.typeToggle}>
              <Pressable
                style={[
                  styles.typeBtn,
                  type === TransactionType.EXPENSE && styles.typeBtnActiveExpense,
                ]}
                onPress={() => {
                  setType(TransactionType.EXPENSE);
                  setCategoryId(undefined);
                }}
              >
                <MaterialIcons
                  name="arrow-upward"
                  size={18}
                  color={type === TransactionType.EXPENSE ? colors.error : colors.textMuted}
                />
                <Text style={[
                  styles.typeBtnText,
                  type === TransactionType.EXPENSE && styles.typeBtnTextActiveExpense
                ]}>
                  Expense
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.typeBtn,
                  type === TransactionType.INCOME && styles.typeBtnActiveIncome,
                ]}
                onPress={() => {
                  setType(TransactionType.INCOME);
                  setCategoryId(undefined);
                }}
              >
                <MaterialIcons
                  name="arrow-downward"
                  size={18}
                  color={type === TransactionType.INCOME ? colors.success : colors.textMuted}
                />
                <Text style={[
                  styles.typeBtnText,
                  type === TransactionType.INCOME && styles.typeBtnTextActiveIncome
                ]}>
                  Income
                </Text>
              </Pressable>
            </View>

            {/* Account Selector (only when required) */}
            {requireAccountSelection && accounts.length > 0 && (
              <View style={styles.field}>
                <Text style={styles.label}>Account</Text>
                <Pressable
                  style={styles.inputContainer}
                  onPress={() => setShowAccountPicker(true)}
                >
                  <View style={[
                    styles.accountDot,
                    { backgroundColor: selectedAccount?.color || colors.primary }
                  ]} />
                  <Text style={[
                    styles.inputText,
                    !selectedAccount && styles.inputPlaceholder
                  ]}>
                    {selectedAccount?.name || 'Select an account'}
                  </Text>
                  <MaterialIcons name="chevron-right" size={20} color={colors.textMuted} />
                </Pressable>
              </View>
            )}

            {/* Amount */}
            <View style={styles.amountContainer}>
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput
                style={styles.amountInput}
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                placeholderTextColor={colors.textMuted}
                keyboardType="decimal-pad"
                autoFocus
              />
            </View>

            {/* Description */}
            <View style={styles.field}>
              <Text style={styles.label}>Description</Text>
              <View style={styles.inputContainer}>
                <MaterialIcons name="description" size={20} color={colors.textMuted} />
                <TextInput
                  style={styles.input}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="What was this for?"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            </View>

            {/* Category */}
            <View style={styles.field}>
              <Text style={styles.label}>Category</Text>
              <Pressable
                style={styles.inputContainer}
                onPress={() => setShowCategoryPicker(true)}
              >
                <MaterialIcons
                  name={(selectedCategory?.icon || 'category') as any}
                  size={20}
                  color={selectedCategory?.color || colors.textMuted}
                />
                <Text style={[
                  styles.inputText,
                  !selectedCategory && styles.inputPlaceholder
                ]}>
                  {selectedCategory?.name || 'Select a category'}
                </Text>
                <MaterialIcons name="chevron-right" size={20} color={colors.textMuted} />
              </Pressable>
            </View>

            {/* Date */}
            <View style={styles.field}>
              <Text style={styles.label}>Date</Text>
              <Pressable
                style={styles.inputContainer}
                onPress={() => setShowDatePicker(true)}
              >
                <MaterialIcons name="calendar-today" size={20} color={colors.textMuted} />
                <Text style={styles.inputText}>{formatDate(date)}</Text>
                <MaterialIcons name="chevron-right" size={20} color={colors.textMuted} />
              </Pressable>
            </View>

            {/* Notes */}
            <View style={styles.field}>
              <Text style={styles.label}>Notes (Optional)</Text>
              <View style={[styles.inputContainer, styles.notesContainer]}>
                <TextInput
                  style={[styles.input, styles.notesInput]}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Add any additional notes..."
                  placeholderTextColor={colors.textMuted}
                  multiline
                  numberOfLines={3}
                />
              </View>
            </View>

            {/* Recurring Transaction Toggle */}
            {onSubmitRecurring && (
              <View style={styles.recurringSection}>
                <View style={styles.recurringToggle}>
                  <View style={styles.recurringInfo}>
                    <MaterialIcons name="repeat" size={20} color={colors.primary} />
                    <View style={styles.recurringText}>
                      <Text style={styles.recurringLabel}>Make this recurring</Text>
                      <Text style={styles.recurringDescription}>
                        Automatically add this transaction on schedule
                      </Text>
                    </View>
                  </View>
                  <Switch
                    value={isRecurring}
                    onValueChange={setIsRecurring}
                    trackColor={{ false: colors.border, true: colors.primary }}
                    thumbColor={colors.white}
                  />
                </View>

                {isRecurring && (
                  <>
                    {/* Account Selector for Recurring (always required) */}
                    {!requireAccountSelection && accounts.length > 0 && (
                      <View style={styles.field}>
                        <Text style={styles.label}>Account</Text>
                        <Pressable
                          style={styles.inputContainer}
                          onPress={() => setShowAccountPicker(true)}
                        >
                          <View style={[
                            styles.accountDot,
                            { backgroundColor: selectedAccount?.color || colors.primary }
                          ]} />
                          <Text style={[
                            styles.inputText,
                            !selectedAccount && styles.inputPlaceholder
                          ]}>
                            {selectedAccount?.name || 'Select an account'}
                          </Text>
                          <MaterialIcons name="chevron-right" size={20} color={colors.textMuted} />
                        </Pressable>
                      </View>
                    )}

                    {/* Frequency Picker */}
                    <View style={styles.field}>
                      <Text style={styles.label}>Frequency</Text>
                      <Pressable
                        style={styles.inputContainer}
                        onPress={() => setShowFrequencyPicker(true)}
                      >
                        <MaterialIcons name="schedule" size={20} color={colors.textMuted} />
                        <Text style={styles.inputText}>
                          {FREQUENCY_OPTIONS.find(f => f.value === frequency)?.label || 'Monthly'}
                        </Text>
                        <MaterialIcons name="chevron-right" size={20} color={colors.textMuted} />
                      </Pressable>
                    </View>

                    <View style={styles.recurringNote}>
                      <MaterialIcons name="info-outline" size={16} color={colors.info} />
                      <Text style={styles.recurringNoteText}>
                        First transaction will be created on {formatDate(date)}, then repeats {FREQUENCY_OPTIONS.find(f => f.value === frequency)?.label.toLowerCase()}
                      </Text>
                    </View>
                  </>
                )}
              </View>
            )}
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
                  <MaterialIcons name={isRecurring ? 'repeat' : 'add'} size={20} color={colors.text} />
                  <Text style={styles.submitBtnText}>
                    {isRecurring ? 'Create Recurring Transaction' : 'Add Transaction'}
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </View>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => {
            setShowDatePicker(Platform.OS === 'ios');
            if (selectedDate) setDate(selectedDate);
          }}
          maximumDate={new Date()}
        />
      )}

      {/* Category Picker Modal */}
      <Modal
        visible={showCategoryPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCategoryPicker(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setShowCategoryPicker(false)}>
          <Pressable style={styles.categoryPicker} onPress={(e) => e.stopPropagation()}>
            <View style={styles.categoryHeader}>
              <Text style={styles.categoryTitle}>Select Category</Text>
              <Pressable onPress={() => setShowCategoryPicker(false)}>
                <MaterialIcons name="close" size={24} color={colors.text} />
              </Pressable>
            </View>
            <ScrollView style={styles.categoryList}>
              {filteredCategories.map((cat) => (
                <Pressable
                  key={cat.id}
                  style={[
                    styles.categoryItem,
                    categoryId === cat.id && styles.categoryItemSelected,
                  ]}
                  onPress={() => {
                    setCategoryId(cat.id);
                    setShowCategoryPicker(false);
                  }}
                >
                  <View style={[styles.categoryIcon, { backgroundColor: cat.color + '20' }]}>
                    <MaterialIcons name={cat.icon as any} size={20} color={cat.color} />
                  </View>
                  <Text style={styles.categoryName}>{cat.name}</Text>
                  {categoryId === cat.id && (
                    <MaterialIcons name="check" size={20} color={colors.primary} />
                  )}
                </Pressable>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Account Picker Modal */}
      <Modal
        visible={showAccountPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAccountPicker(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setShowAccountPicker(false)}>
          <Pressable style={styles.categoryPicker} onPress={(e) => e.stopPropagation()}>
            <View style={styles.categoryHeader}>
              <Text style={styles.categoryTitle}>Select Account</Text>
              <Pressable onPress={() => setShowAccountPicker(false)}>
                <MaterialIcons name="close" size={24} color={colors.text} />
              </Pressable>
            </View>
            <ScrollView style={styles.categoryList}>
              {accounts.map((account) => (
                <Pressable
                  key={account.id}
                  style={[
                    styles.categoryItem,
                    accountId === account.id && styles.categoryItemSelected,
                  ]}
                  onPress={() => {
                    setAccountId(account.id);
                    setShowAccountPicker(false);
                  }}
                >
                  <View style={[
                    styles.accountColorDot,
                    { backgroundColor: account.color || colors.primary }
                  ]} />
                  <View style={styles.accountInfo}>
                    <Text style={styles.categoryName}>{account.name}</Text>
                    <Text style={styles.accountBalance}>
                      ${account.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </Text>
                  </View>
                  {accountId === account.id && (
                    <MaterialIcons name="check" size={20} color={colors.primary} />
                  )}
                </Pressable>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Frequency Picker Modal */}
      <Modal
        visible={showFrequencyPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFrequencyPicker(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setShowFrequencyPicker(false)}>
          <Pressable style={styles.categoryPicker} onPress={(e) => e.stopPropagation()}>
            <View style={styles.categoryHeader}>
              <Text style={styles.categoryTitle}>Select Frequency</Text>
              <Pressable onPress={() => setShowFrequencyPicker(false)}>
                <MaterialIcons name="close" size={24} color={colors.text} />
              </Pressable>
            </View>
            <ScrollView style={styles.categoryList}>
              {FREQUENCY_OPTIONS.map((option) => (
                <Pressable
                  key={option.value}
                  style={[
                    styles.categoryItem,
                    frequency === option.value && styles.categoryItemSelected,
                  ]}
                  onPress={() => {
                    setFrequency(option.value);
                    setShowFrequencyPicker(false);
                  }}
                >
                  <MaterialIcons name="schedule" size={20} color={colors.textMuted} />
                  <Text style={styles.categoryName}>{option.label}</Text>
                  {frequency === option.value && (
                    <MaterialIcons name="check" size={20} color={colors.primary} />
                  )}
                </Pressable>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
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
  typeToggle: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.xs,
    marginBottom: spacing.xl,
  },
  typeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    gap: spacing.xs,
  },
  typeBtnActiveExpense: {
    backgroundColor: colors.error + '20',
  },
  typeBtnActiveIncome: {
    backgroundColor: colors.success + '20',
  },
  typeBtnText: {
    ...typography.body,
    color: colors.textMuted,
  },
  typeBtnTextActiveExpense: {
    color: colors.error,
    fontWeight: '600',
  },
  typeBtnTextActiveIncome: {
    color: colors.success,
    fontWeight: '600',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  currencySymbol: {
    ...typography.h1,
    fontSize: 32,
    color: colors.textMuted,
  },
  amountInput: {
    ...typography.h1,
    fontSize: 48,
    color: colors.text,
    minWidth: 100,
    textAlign: 'center',
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
  inputText: {
    flex: 1,
    ...typography.body,
    color: colors.text,
  },
  inputPlaceholder: {
    color: colors.textMuted,
  },
  notesContainer: {
    height: 100,
    alignItems: 'flex-start',
    paddingVertical: spacing.sm,
  },
  notesInput: {
    height: '100%',
    textAlignVertical: 'top',
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
  categoryPicker: {
    backgroundColor: colors.background,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '60%',
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  categoryTitle: {
    ...typography.h3,
  },
  categoryList: {
    padding: spacing.md,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.md,
  },
  categoryItemSelected: {
    backgroundColor: colors.surface,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryName: {
    flex: 1,
    ...typography.body,
    color: colors.text,
  },
  accountDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  accountColorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  accountInfo: {
    flex: 1,
  },
  accountBalance: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
  recurringSection: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  recurringToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  recurringInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.sm,
  },
  recurringText: {
    flex: 1,
  },
  recurringLabel: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text,
  },
  recurringDescription: {
    ...typography.bodySmall,
    color: colors.textMuted,
    marginTop: 2,
  },
  recurringNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.info + '15',
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  recurringNoteText: {
    ...typography.bodySmall,
    color: colors.info,
    flex: 1,
  },
});
