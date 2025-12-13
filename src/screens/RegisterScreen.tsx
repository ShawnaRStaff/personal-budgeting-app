import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator, Alert, TextInput, Modal, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors, spacing, borderRadius, typography } from '../theme';
import { useData, useTips } from '../contexts';
import { Transaction, TransactionType } from '../types';
import {
  AccountSelector,
  TransactionItem,
  AddTransactionModal,
  AddAccountModal,
  SwipeableRow,
  EditTransactionModal,
} from '../components';

type FilterType = 'all' | 'income' | 'expense';
type DateRangeType = 'all' | 'today' | 'week' | 'month' | 'year' | 'custom';

export function RegisterScreen() {
  const {
    accounts,
    selectedAccount,
    setSelectedAccount,
    transactions,
    categories,
    expenseCategories,
    incomeCategories,
    addAccount,
    addTransaction,
    editTransaction,
    removeTransaction,
    isLoading,
  } = useData();

  const [filter, setFilter] = useState<FilterType>('all');
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<(Transaction & { runningBalance: number }) | null>(null);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<DateRangeType>('all');
  const [customStartDate, setCustomStartDate] = useState<Date | null>(null);
  const [customEndDate, setCustomEndDate] = useState<Date | null>(null);
  const [showDateRangePicker, setShowDateRangePicker] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const { recordTransaction } = useTips();

  // Get date range boundaries
  const getDateRangeBounds = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (dateRange) {
      case 'today':
        return { start: today, end: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1) };
      case 'week':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);
        return { start: weekStart, end: weekEnd };
      case 'month':
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        return { start: monthStart, end: monthEnd };
      case 'year':
        const yearStart = new Date(now.getFullYear(), 0, 1);
        const yearEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        return { start: yearStart, end: yearEnd };
      case 'custom':
        if (customStartDate && customEndDate) {
          const endOfDay = new Date(customEndDate);
          endOfDay.setHours(23, 59, 59, 999);
          return { start: customStartDate, end: endOfDay };
        }
        return null;
      default:
        return null;
    }
  }, [dateRange, customStartDate, customEndDate]);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    let result = transactions;

    // Filter by type
    if (filter === 'income') {
      result = result.filter(
        (t) => t.type === TransactionType.INCOME || t.type === TransactionType.TRANSFER_IN
      );
    } else if (filter === 'expense') {
      result = result.filter(
        (t) => t.type === TransactionType.EXPENSE || t.type === TransactionType.TRANSFER_OUT
      );
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter((t) => {
        const description = t.description.toLowerCase();
        const category = t.categoryId ? categories.find((c) => c.id === t.categoryId) : undefined;
        const categoryName = category?.name.toLowerCase() || '';
        const notes = t.notes?.toLowerCase() || '';
        return description.includes(query) || categoryName.includes(query) || notes.includes(query);
      });
    }

    // Filter by date range
    if (getDateRangeBounds) {
      result = result.filter((t) => {
        const txDate = t.date;
        return txDate >= getDateRangeBounds.start && txDate <= getDateRangeBounds.end;
      });
    }

    return result;
  }, [transactions, filter, searchQuery, getDateRangeBounds, categories]);

  // Check if any filters are active
  const hasActiveFilters = searchQuery.trim() !== '' || dateRange !== 'all' || filter !== 'all';

  // Get date range label
  const getDateRangeLabel = (range: DateRangeType) => {
    switch (range) {
      case 'today': return 'Today';
      case 'week': return 'This\u00A0Week';
      case 'month': return 'This Month';
      case 'year': return 'This Year';
      case 'custom': return 'Custom';
      default: return 'All Time';
    }
  };

  // Format date for display
  const formatDateShort = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setDateRange('all');
    setFilter('all');
    setCustomStartDate(null);
    setCustomEndDate(null);
  };

  // Get category for a transaction
  const getCategory = (categoryId?: string | null) => {
    if (!categoryId) return undefined;
    return categories.find((c) => c.id === categoryId);
  };

  const handleAddTransaction = async (data: any) => {
    await addTransaction(data);
    recordTransaction();
  };

  const handleAddAccount = async (data: any) => {
    const newAccount = await addAccount(data);
    setSelectedAccount(newAccount);
  };

  const handleDeleteTransaction = (transaction: Transaction & { runningBalance: number }) => {
    Alert.alert(
      'Delete Transaction',
      `Delete "${transaction.description}" for $${transaction.amount.toFixed(2)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => removeTransaction(transaction.id),
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Register</Text>
        <Pressable
          style={styles.addBtn}
          onPress={() => {
            if (selectedAccount) {
              setShowAddTransaction(true);
            } else {
              setShowAddAccount(true);
            }
          }}
        >
          <MaterialIcons name="add" size={24} color={colors.text} />
        </Pressable>
      </View>

      {/* Account Selector */}
      <View style={styles.accountSection}>
        <AccountSelector
          accounts={accounts}
          selectedAccount={selectedAccount}
          onSelect={setSelectedAccount}
          onAddAccount={() => setShowAddAccount(true)}
        />
      </View>

      {selectedAccount && (
        <>
          {/* Search Bar */}
          <View style={styles.searchSection}>
            <View style={styles.searchContainer}>
              <MaterialIcons name="search" size={20} color={colors.textMuted} />
              <TextInput
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search transactions..."
                placeholderTextColor={colors.textMuted}
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery('')}>
                  <MaterialIcons name="close" size={20} color={colors.textMuted} />
                </Pressable>
              )}
            </View>
            <Pressable
              style={[styles.filterButton, showFilters && styles.filterButtonActive]}
              onPress={() => setShowFilters(!showFilters)}
            >
              <MaterialIcons
                name="tune"
                size={20}
                color={showFilters || dateRange !== 'all' ? colors.primary : colors.textMuted}
              />
              {dateRange !== 'all' && <View style={styles.filterBadge} />}
            </Pressable>
          </View>

          {/* Expanded Filters */}
          {showFilters && (
            <View style={styles.expandedFilters}>
              {/* Date Range Options */}
              <Text style={styles.filterLabel}>Date Range</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.dateRangeScroll}
                contentContainerStyle={styles.dateRangeScrollContent}
              >
                {(['all', 'today', 'week', 'month', 'year', 'custom'] as DateRangeType[]).map((range) => (
                  <Pressable
                    key={range}
                    style={[styles.dateRangeChip, dateRange === range && styles.dateRangeChipActive]}
                    onPress={() => {
                      setDateRange(range);
                      if (range === 'custom') {
                        setShowDateRangePicker(true);
                      }
                    }}
                  >
                    <Text style={[styles.dateRangeChipText, dateRange === range && styles.dateRangeChipTextActive]}>
                      {getDateRangeLabel(range)}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>

              {/* Custom Date Range Display */}
              {dateRange === 'custom' && customStartDate && customEndDate && (
                <Pressable
                  style={styles.customDateDisplay}
                  onPress={() => setShowDateRangePicker(true)}
                >
                  <MaterialIcons name="date-range" size={16} color={colors.primary} />
                  <Text style={styles.customDateText}>
                    {formatDateShort(customStartDate)} - {formatDateShort(customEndDate)}
                  </Text>
                  <MaterialIcons name="edit" size={14} color={colors.textMuted} />
                </Pressable>
              )}
            </View>
          )}

          {/* Active Filters Summary */}
          {hasActiveFilters && (
            <View style={styles.activeFiltersRow}>
              <Text style={styles.activeFiltersText}>
                {filteredTransactions.length} result{filteredTransactions.length !== 1 ? 's' : ''}
              </Text>
              <Pressable style={styles.clearFiltersBtn} onPress={clearFilters}>
                <Text style={styles.clearFiltersText}>Clear filters</Text>
              </Pressable>
            </View>
          )}

          {/* Filter Tabs */}
          <View style={styles.filterRow}>
            <Pressable
              style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
              onPress={() => setFilter('all')}
            >
              <Text style={filter === 'all' ? styles.filterTextActive : styles.filterText}>
                All
              </Text>
            </Pressable>
            <Pressable
              style={[styles.filterTab, filter === 'income' && styles.filterTabActive]}
              onPress={() => setFilter('income')}
            >
              <Text style={filter === 'income' ? styles.filterTextActive : styles.filterText}>
                Income
              </Text>
            </Pressable>
            <Pressable
              style={[styles.filterTab, filter === 'expense' && styles.filterTabActive]}
              onPress={() => setFilter('expense')}
            >
              <Text style={filter === 'expense' ? styles.filterTextActive : styles.filterText}>
                Expenses
              </Text>
            </Pressable>
          </View>

          {/* Transaction List */}
          {filteredTransactions.length > 0 ? (
            <FlatList
              data={filteredTransactions}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <SwipeableRow
                  onEdit={() => setEditingTransaction(item)}
                  onDelete={() => handleDeleteTransaction(item)}
                >
                  <TransactionItem
                    transaction={item}
                    category={getCategory(item.categoryId)}
                    onPress={() => setEditingTransaction(item)}
                  />
                </SwipeableRow>
              )}
              contentContainerStyle={styles.listContent}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <MaterialIcons name="receipt-long" size={56} color={colors.textMuted} />
              </View>
              <Text style={styles.emptyTitle}>No transactions yet</Text>
              <Text style={styles.emptySubtitle}>
                Tap the + button to add your first transaction and start tracking your spending
              </Text>
              <Pressable
                style={styles.ctaBtn}
                onPress={() => setShowAddTransaction(true)}
              >
                <MaterialIcons name="add" size={20} color={colors.text} />
                <Text style={styles.ctaBtnText}>Add Transaction</Text>
              </Pressable>
            </View>
          )}
        </>
      )}

      {!selectedAccount && accounts.length === 0 && (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <MaterialIcons name="account-balance-wallet" size={56} color={colors.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>No accounts yet</Text>
          <Text style={styles.emptySubtitle}>
            Create your first account to start tracking transactions. Add your checking, savings, or credit card accounts.
          </Text>
          <Pressable
            style={styles.ctaBtn}
            onPress={() => setShowAddAccount(true)}
          >
            <MaterialIcons name="add" size={20} color={colors.text} />
            <Text style={styles.ctaBtnText}>Add Account</Text>
          </Pressable>
        </View>
      )}

      {/* Add Transaction Modal */}
      <AddTransactionModal
        visible={showAddTransaction}
        onClose={() => setShowAddTransaction(false)}
        onSubmit={handleAddTransaction}
        categories={[...expenseCategories, ...incomeCategories]}
      />

      {/* Add Account Modal */}
      <AddAccountModal
        visible={showAddAccount}
        onClose={() => setShowAddAccount(false)}
        onSubmit={handleAddAccount}
      />

      {/* Edit Transaction Modal */}
      <EditTransactionModal
        visible={!!editingTransaction}
        transaction={editingTransaction}
        onClose={() => setEditingTransaction(null)}
        onSave={editTransaction}
        onDelete={removeTransaction}
        categories={[...expenseCategories, ...incomeCategories]}
      />

      {/* Custom Date Range Picker Modal */}
      <Modal
        visible={showDateRangePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDateRangePicker(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowDateRangePicker(false)}>
          <Pressable style={styles.dateRangeModal} onPress={(e) => e.stopPropagation()}>
            <View style={styles.dateRangeModalHeader}>
              <Text style={styles.dateRangeModalTitle}>Select Date Range</Text>
              <Pressable onPress={() => setShowDateRangePicker(false)}>
                <MaterialIcons name="close" size={24} color={colors.text} />
              </Pressable>
            </View>

            <View style={styles.dateRangeModalContent}>
              {/* Start Date */}
              <View style={styles.datePickerSection}>
                <Text style={styles.datePickerLabel}>Start Date</Text>
                <Pressable
                  style={styles.datePickerButton}
                  onPress={() => setShowStartDatePicker(true)}
                >
                  <MaterialIcons name="calendar-today" size={18} color={colors.primary} />
                  <Text style={styles.datePickerButtonText}>
                    {customStartDate ? formatDateShort(customStartDate) : 'Select start date'}
                  </Text>
                </Pressable>
              </View>

              {/* End Date */}
              <View style={styles.datePickerSection}>
                <Text style={styles.datePickerLabel}>End Date</Text>
                <Pressable
                  style={styles.datePickerButton}
                  onPress={() => setShowEndDatePicker(true)}
                >
                  <MaterialIcons name="calendar-today" size={18} color={colors.primary} />
                  <Text style={styles.datePickerButtonText}>
                    {customEndDate ? formatDateShort(customEndDate) : 'Select end date'}
                  </Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.dateRangeModalFooter}>
              <Pressable
                style={styles.dateRangeCancelBtn}
                onPress={() => {
                  setDateRange('all');
                  setCustomStartDate(null);
                  setCustomEndDate(null);
                  setShowDateRangePicker(false);
                }}
              >
                <Text style={styles.dateRangeCancelText}>Clear</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.dateRangeApplyBtn,
                  (!customStartDate || !customEndDate) && styles.dateRangeApplyBtnDisabled
                ]}
                onPress={() => {
                  if (customStartDate && customEndDate) {
                    setDateRange('custom');
                    setShowDateRangePicker(false);
                  }
                }}
                disabled={!customStartDate || !customEndDate}
              >
                <Text style={styles.dateRangeApplyText}>Apply</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Start Date Picker */}
      {showStartDatePicker && (
        <DateTimePicker
          value={customStartDate || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => {
            setShowStartDatePicker(Platform.OS === 'ios');
            if (selectedDate) {
              setCustomStartDate(selectedDate);
              // If end date is before start date, reset it
              if (customEndDate && selectedDate > customEndDate) {
                setCustomEndDate(null);
              }
            }
          }}
          maximumDate={new Date()}
        />
      )}

      {/* End Date Picker */}
      {showEndDatePicker && (
        <DateTimePicker
          value={customEndDate || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => {
            setShowEndDatePicker(Platform.OS === 'ios');
            if (selectedDate) setCustomEndDate(selectedDate);
          }}
          minimumDate={customStartDate || undefined}
          maximumDate={new Date()}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
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
  accountSection: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  filterTab: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
  },
  filterTabActive: {
    backgroundColor: colors.primary,
  },
  filterText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  filterTextActive: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxl,
  },
  separator: {
    height: spacing.sm,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
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
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xl,
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
  searchSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    height: 44,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: colors.text,
    height: '100%',
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterButtonActive: {
    backgroundColor: colors.primary + '20',
  },
  filterBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  expandedFilters: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  filterLabel: {
    ...typography.bodySmall,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  dateRangeScroll: {
    marginBottom: spacing.sm,
  },
  dateRangeScrollContent: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingRight: spacing.md,
  },
  dateRangeChip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    alignSelf: 'flex-start',
  },
  dateRangeChipActive: {
    backgroundColor: colors.primary,
  },
  dateRangeChipText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  dateRangeChipTextActive: {
    color: colors.text,
    fontWeight: '600',
  },
  customDateDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '15',
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  customDateText: {
    ...typography.bodySmall,
    color: colors.primary,
    flex: 1,
  },
  activeFiltersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  activeFiltersText: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
  clearFiltersBtn: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  clearFiltersText: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  dateRangeModal: {
    backgroundColor: colors.background,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
  },
  dateRangeModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dateRangeModalTitle: {
    ...typography.h3,
  },
  dateRangeModalContent: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  datePickerSection: {
    gap: spacing.sm,
  },
  datePickerLabel: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  datePickerButtonText: {
    ...typography.body,
    color: colors.text,
    flex: 1,
  },
  dateRangeModalFooter: {
    flexDirection: 'row',
    padding: spacing.lg,
    gap: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  dateRangeCancelBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
  },
  dateRangeCancelText: {
    ...typography.body,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  dateRangeApplyBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
  },
  dateRangeApplyBtnDisabled: {
    opacity: 0.5,
  },
  dateRangeApplyText: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
});
