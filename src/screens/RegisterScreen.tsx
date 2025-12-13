import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../theme';
import { useData } from '../contexts';
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

export function RegisterScreen() {
  const insets = useSafeAreaInsets();
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

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    if (filter === 'all') return transactions;
    if (filter === 'income') {
      return transactions.filter(
        (t) => t.type === TransactionType.INCOME || t.type === TransactionType.TRANSFER_IN
      );
    }
    return transactions.filter(
      (t) => t.type === TransactionType.EXPENSE || t.type === TransactionType.TRANSFER_OUT
    );
  }, [transactions, filter]);

  // Get category for a transaction
  const getCategory = (categoryId?: string | null) => {
    if (!categoryId) return undefined;
    return categories.find((c) => c.id === categoryId);
  };

  const handleAddTransaction = async (data: any) => {
    await addTransaction(data);
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
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
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
    </View>
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
});
