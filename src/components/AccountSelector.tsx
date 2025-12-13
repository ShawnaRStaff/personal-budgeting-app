import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  FlatList,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../theme';
import { Account, AccountType } from '../types';

interface Props {
  accounts: Account[];
  selectedAccount: Account | null;
  onSelect: (account: Account) => void;
  onAddAccount: () => void;
}

const ACCOUNT_TYPE_ICONS: Record<AccountType, string> = {
  [AccountType.CHECKING]: 'account-balance',
  [AccountType.SAVINGS]: 'savings',
  [AccountType.CREDIT_CARD]: 'credit-card',
  [AccountType.CASH]: 'payments',
  [AccountType.INVESTMENT]: 'trending-up',
  [AccountType.OTHER]: 'account-balance-wallet',
};

export function AccountSelector({ accounts, selectedAccount, onSelect, onAddAccount }: Props) {
  const [modalVisible, setModalVisible] = useState(false);

  const formatBalance = (balance: number) => {
    const formatted = Math.abs(balance).toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
    });
    return balance < 0 ? `-${formatted}` : formatted;
  };

  const renderAccount = ({ item }: { item: Account }) => {
    const isSelected = selectedAccount?.id === item.id;
    const iconName = ACCOUNT_TYPE_ICONS[item.type] || 'account-balance-wallet';

    return (
      <Pressable
        style={[styles.accountItem, isSelected && styles.accountItemSelected]}
        onPress={() => {
          onSelect(item);
          setModalVisible(false);
        }}
      >
        <View style={[styles.accountIcon, { backgroundColor: item.color + '20' }]}>
          <MaterialIcons name={iconName as any} size={24} color={item.color} />
        </View>
        <View style={styles.accountInfo}>
          <Text style={styles.accountName}>{item.name}</Text>
          <Text style={styles.accountType}>{item.type.replace('_', ' ')}</Text>
        </View>
        <Text style={[styles.accountBalance, item.balance < 0 && styles.negativeBalance]}>
          {formatBalance(item.balance)}
        </Text>
        {isSelected && (
          <MaterialIcons name="check-circle" size={20} color={colors.primary} />
        )}
      </Pressable>
    );
  };

  if (!selectedAccount && accounts.length === 0) {
    return (
      <Pressable style={styles.emptySelector} onPress={onAddAccount}>
        <MaterialIcons name="add-circle-outline" size={24} color={colors.primary} />
        <Text style={styles.emptySelectorText}>Add your first account</Text>
      </Pressable>
    );
  }

  return (
    <>
      <Pressable style={styles.selector} onPress={() => setModalVisible(true)}>
        {selectedAccount ? (
          <>
            <View style={[styles.selectorIcon, { backgroundColor: selectedAccount.color + '20' }]}>
              <MaterialIcons
                name={ACCOUNT_TYPE_ICONS[selectedAccount.type] as any}
                size={20}
                color={selectedAccount.color}
              />
            </View>
            <View style={styles.selectorInfo}>
              <Text style={styles.selectorName}>{selectedAccount.name}</Text>
              <Text style={[
                styles.selectorBalance,
                selectedAccount.balance < 0 && styles.negativeBalance
              ]}>
                {formatBalance(selectedAccount.balance)}
              </Text>
            </View>
          </>
        ) : (
          <Text style={styles.selectorPlaceholder}>Select an account</Text>
        )}
        <MaterialIcons name="expand-more" size={24} color={colors.textMuted} />
      </Pressable>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Account</Text>
              <Pressable onPress={() => setModalVisible(false)}>
                <MaterialIcons name="close" size={24} color={colors.text} />
              </Pressable>
            </View>

            <FlatList
              data={accounts}
              keyExtractor={(item) => item.id}
              renderItem={renderAccount}
              contentContainerStyle={styles.accountList}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />

            <Pressable style={styles.addAccountBtn} onPress={() => {
              setModalVisible(false);
              onAddAccount();
            }}>
              <MaterialIcons name="add" size={20} color={colors.primary} />
              <Text style={styles.addAccountText}>Add New Account</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  selectorIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectorInfo: {
    flex: 1,
  },
  selectorName: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text,
  },
  selectorBalance: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: '600',
  },
  selectorPlaceholder: {
    ...typography.body,
    color: colors.textMuted,
    flex: 1,
  },
  emptySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    gap: spacing.sm,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
  },
  emptySelectorText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    ...typography.h3,
  },
  accountList: {
    padding: spacing.md,
  },
  accountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.md,
  },
  accountItemSelected: {
    backgroundColor: colors.surface,
  },
  accountIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text,
  },
  accountType: {
    ...typography.bodySmall,
    color: colors.textMuted,
    textTransform: 'capitalize',
  },
  accountBalance: {
    ...typography.body,
    fontWeight: '600',
    color: colors.primary,
  },
  negativeBalance: {
    color: colors.error,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
  addAccountBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  addAccountText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
});
