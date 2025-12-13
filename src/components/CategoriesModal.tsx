import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../theme';
import { useData } from '../contexts';
import { Category, CategoryType } from '../types';
import { SwipeableRow } from './SwipeableRow';
import { AddCategoryModal } from './AddCategoryModal';
import { EditCategoryModal } from './EditCategoryModal';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function CategoriesModal({ visible, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const { categories, transactions, budgets, removeCategory } = useData();

  const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense');
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showEditCategory, setShowEditCategory] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  // Filter categories by type
  const filteredCategories = useMemo(() => {
    const type = activeTab === 'expense' ? CategoryType.EXPENSE : CategoryType.INCOME;
    return categories.filter((c) => c.type === type);
  }, [categories, activeTab]);

  // Count usage for each category
  const getCategoryUsage = (categoryId: string) => {
    const txCount = transactions.filter((t) => t.categoryId === categoryId).length;
    const budgetCount = budgets.filter((b) => b.categoryId === categoryId).length;
    return { txCount, budgetCount };
  };

  const handleEditCategory = (category: Category) => {
    setSelectedCategory(category);
    setShowEditCategory(true);
  };

  const handleDeleteCategory = (category: Category) => {
    if (category.isDefault) {
      Alert.alert('Cannot Delete', 'Default categories cannot be deleted.');
      return;
    }

    const { txCount, budgetCount } = getCategoryUsage(category.id);

    let warningMessage = `Are you sure you want to delete "${category.name}"?`;
    if (txCount > 0 || budgetCount > 0) {
      warningMessage += `\n\nThis category is used in:`;
      if (txCount > 0) warningMessage += `\n- ${txCount} transaction(s)`;
      if (budgetCount > 0) warningMessage += `\n- ${budgetCount} budget(s)`;
      warningMessage += `\n\nYou must reassign or delete these items first.`;

      Alert.alert('Cannot Delete', warningMessage);
      return;
    }

    Alert.alert(
      'Delete Category',
      warningMessage,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeCategory(category.id);
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete category');
            }
          },
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <MaterialIcons name="close" size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.title}>Categories</Text>
          <Pressable
            style={styles.addBtn}
            onPress={() => setShowAddCategory(true)}
          >
            <MaterialIcons name="add" size={24} color={colors.text} />
          </Pressable>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <Pressable
            style={[styles.tab, activeTab === 'expense' && styles.tabActive]}
            onPress={() => setActiveTab('expense')}
          >
            <Text style={[styles.tabText, activeTab === 'expense' && styles.tabTextActive]}>
              Expenses
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tab, activeTab === 'income' && styles.tabActive]}
            onPress={() => setActiveTab('income')}
          >
            <Text style={[styles.tabText, activeTab === 'income' && styles.tabTextActive]}>
              Income
            </Text>
          </Pressable>
        </View>

        {/* Categories List */}
        <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
          {filteredCategories.map((category) => {
            const { txCount, budgetCount } = getCategoryUsage(category.id);
            const isInUse = txCount > 0 || budgetCount > 0;

            return (
              <SwipeableRow
                key={category.id}
                onEdit={category.isDefault ? undefined : () => handleEditCategory(category)}
                onDelete={category.isDefault ? undefined : () => handleDeleteCategory(category)}
              >
                <Pressable
                  style={styles.categoryItem}
                  onPress={() => !category.isDefault && handleEditCategory(category)}
                >
                  <View style={[styles.categoryIcon, { backgroundColor: category.color + '20' }]}>
                    <MaterialIcons
                      name={category.icon as any}
                      size={24}
                      color={category.color}
                    />
                  </View>
                  <View style={styles.categoryInfo}>
                    <View style={styles.categoryNameRow}>
                      <Text style={styles.categoryName}>{category.name}</Text>
                      {category.isDefault && (
                        <View style={styles.defaultBadge}>
                          <Text style={styles.defaultBadgeText}>Default</Text>
                        </View>
                      )}
                    </View>
                    {isInUse && (
                      <Text style={styles.categoryUsage}>
                        {txCount > 0 && `${txCount} transaction${txCount !== 1 ? 's' : ''}`}
                        {txCount > 0 && budgetCount > 0 && ' · '}
                        {budgetCount > 0 && `${budgetCount} budget${budgetCount !== 1 ? 's' : ''}`}
                      </Text>
                    )}
                  </View>
                  {!category.isDefault && (
                    <MaterialIcons name="chevron-right" size={24} color={colors.textMuted} />
                  )}
                </Pressable>
              </SwipeableRow>
            );
          })}

          {filteredCategories.length === 0 && (
            <View style={styles.emptyState}>
              <MaterialIcons
                name={activeTab === 'expense' ? 'remove-shopping-cart' : 'money-off'}
                size={48}
                color={colors.textMuted}
              />
              <Text style={styles.emptyText}>
                No {activeTab} categories yet
              </Text>
            </View>
          )}

          <View style={{ height: spacing.xxl }} />
        </ScrollView>
      </View>

      {/* Add Category Modal */}
      <AddCategoryModal
        visible={showAddCategory}
        onClose={() => setShowAddCategory(false)}
        categoryType={activeTab === 'expense' ? CategoryType.EXPENSE : CategoryType.INCOME}
      />

      {/* Edit Category Modal */}
      <EditCategoryModal
        visible={showEditCategory}
        onClose={() => {
          setShowEditCategory(false);
          setSelectedCategory(null);
        }}
        category={selectedCategory}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
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
  addBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
  },
  tabs: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    ...typography.body,
    color: colors.textMuted,
  },
  tabTextActive: {
    color: colors.text,
    fontWeight: '600',
  },
  list: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  categoryName: {
    ...typography.body,
    color: colors.text,
  },
  defaultBadge: {
    backgroundColor: colors.primary + '30',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  defaultBadgeText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  categoryUsage: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyText: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: spacing.md,
  },
});
