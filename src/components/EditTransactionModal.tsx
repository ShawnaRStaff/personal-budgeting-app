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
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors, spacing, borderRadius, typography } from '../theme';
import { Transaction, TransactionType, Category, CategoryType } from '../types';

interface Props {
  visible: boolean;
  transaction: (Transaction & { runningBalance: number }) | null;
  onClose: () => void;
  onSave: (id: string, data: Partial<Transaction>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  categories: Category[];
}

export function EditTransactionModal({
  visible,
  transaction,
  onClose,
  onSave,
  onDelete,
  categories,
}: Props) {
  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState<string | undefined>();
  const [date, setDate] = useState(new Date());
  const [notes, setNotes] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Populate form when transaction changes
  useEffect(() => {
    if (transaction) {
      setType(transaction.type);
      setAmount(transaction.amount.toString());
      setDescription(transaction.description);
      setCategoryId(transaction.categoryId || undefined);
      setDate(transaction.date);
      setNotes(transaction.notes || '');
    }
  }, [transaction]);

  const filteredCategories = categories.filter((c) =>
    type === TransactionType.INCOME ? c.type === CategoryType.INCOME : c.type === CategoryType.EXPENSE
  );

  const selectedCategory = categories.find((c) => c.id === categoryId);

  const handleSave = async () => {
    if (!transaction) return;

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Error', 'Please enter a description');
      return;
    }

    setIsLoading(true);
    try {
      const updateData: any = {
        type,
        amount: numAmount,
        description: description.trim(),
        categoryId: categoryId || null,
        date,
      };

      // Only include notes if it has a value (Firestore doesn't accept undefined)
      if (notes.trim()) {
        updateData.notes = notes.trim();
      }

      await onSave(transaction.id, updateData);
      onClose();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update transaction');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = () => {
    if (!transaction) return;

    Alert.alert(
      'Delete Transaction',
      'Are you sure you want to delete this transaction? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              await onDelete(transaction.id);
              onClose();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete transaction');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const formatDate = (d: Date) => {
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (!transaction) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <MaterialIcons name="close" size={24} color={colors.text} />
            </Pressable>
            <Text style={styles.title}>Edit Transaction</Text>
            <Pressable onPress={handleDelete} style={styles.closeBtn}>
              <MaterialIcons name="delete-outline" size={24} color={colors.error} />
            </Pressable>
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
          </ScrollView>

          {/* Save Button */}
          <View style={styles.footer}>
            <Pressable
              style={[styles.submitBtn, isLoading && styles.submitBtnDisabled]}
              onPress={handleSave}
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
});
