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
import { BudgetPeriod, Category } from '../types';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    categoryId: string;
    amount: number;
    period: BudgetPeriod;
  }) => Promise<void>;
  categories: Category[];
}

const PERIODS = [
  { value: BudgetPeriod.WEEKLY, label: 'Weekly', icon: 'view-week' },
  { value: BudgetPeriod.BIWEEKLY, label: 'Bi-weekly', icon: 'date-range' },
  { value: BudgetPeriod.MONTHLY, label: 'Monthly', icon: 'calendar-today' },
  { value: BudgetPeriod.YEARLY, label: 'Yearly', icon: 'event' },
];

export function AddBudgetModal({ visible, onClose, onSubmit, categories }: Props) {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [period, setPeriod] = useState<BudgetPeriod>(BudgetPeriod.MONTHLY);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const selectedCategory = categories.find((c) => c.id === categoryId);

  const resetForm = () => {
    setName('');
    setAmount('');
    setPeriod(BudgetPeriod.MONTHLY);
    setCategoryId(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    if (!categoryId) {
      Alert.alert('Error', 'Please select a category for this budget');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    // Use category name as budget name if not provided
    const budgetName = name.trim() || selectedCategory?.name || 'Budget';

    setIsLoading(true);
    try {
      await onSubmit({
        name: budgetName,
        categoryId,
        amount: numAmount,
        period,
      });
      handleClose();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create budget');
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
            <Text style={styles.title}>Create Budget</Text>
            <View style={styles.closeBtn} />
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Category (Required) */}
            <View style={styles.field}>
              <Text style={styles.label}>Category *</Text>
              <Text style={styles.hint}>
                Select which spending category this budget tracks
              </Text>
              <Pressable
                style={[
                  styles.inputContainer,
                  !selectedCategory && styles.inputContainerRequired
                ]}
                onPress={() => setShowCategoryPicker(true)}
              >
                {selectedCategory ? (
                  <>
                    <View style={[styles.categoryIcon, { backgroundColor: selectedCategory.color + '20' }]}>
                      <MaterialIcons name={selectedCategory.icon as any} size={20} color={selectedCategory.color} />
                    </View>
                    <Text style={styles.inputText}>{selectedCategory.name}</Text>
                  </>
                ) : (
                  <>
                    <MaterialIcons name="category" size={20} color={colors.textMuted} />
                    <Text style={styles.inputPlaceholder}>Select a category</Text>
                  </>
                )}
                <MaterialIcons name="chevron-right" size={20} color={colors.textMuted} />
              </Pressable>
            </View>

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
                  placeholder={selectedCategory?.name || "Budget name"}
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
                  <MaterialIcons name="add" size={20} color={colors.text} />
                  <Text style={styles.submitBtnText}>Create Budget</Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </View>

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
              {categories.map((cat) => (
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    height: 56,
    gap: spacing.sm,
  },
  inputContainerRequired: {
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
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
    flex: 1,
    ...typography.body,
    color: colors.textMuted,
  },
  currencySymbol: {
    ...typography.body,
    color: colors.textMuted,
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
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
