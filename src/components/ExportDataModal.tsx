import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../theme';
import { useData } from '../contexts';
import { exportTransactionsToCSV, getTransactionCountInRange } from '../services/export';

interface Props {
  visible: boolean;
  onClose: () => void;
}

type QuickRange = 'thisMonth' | 'lastMonth' | 'last3Months' | 'allTime';

export function ExportDataModal({ visible, onClose }: Props) {
  const { transactions, categories, accounts } = useData();

  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedRange, setSelectedRange] = useState<QuickRange>('allTime');

  // Calculate transaction count for preview
  const transactionCount = useMemo(() => {
    return getTransactionCountInRange(
      transactions,
      startDate || undefined,
      endDate || undefined
    );
  }, [transactions, startDate, endDate]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const setQuickRange = (range: QuickRange) => {
    setSelectedRange(range);
    const now = new Date();

    switch (range) {
      case 'thisMonth':
        setStartDate(new Date(now.getFullYear(), now.getMonth(), 1));
        setEndDate(now);
        break;
      case 'lastMonth':
        setStartDate(new Date(now.getFullYear(), now.getMonth() - 1, 1));
        setEndDate(new Date(now.getFullYear(), now.getMonth(), 0));
        break;
      case 'last3Months':
        setStartDate(new Date(now.getFullYear(), now.getMonth() - 3, 1));
        setEndDate(now);
        break;
      case 'allTime':
        setStartDate(null);
        setEndDate(null);
        break;
    }
  };

  const handleStartDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowStartPicker(Platform.OS === 'ios');
    if (selectedDate) {
      setStartDate(selectedDate);
      setSelectedRange('allTime'); // Clear quick select when custom date is chosen
    }
  };

  const handleEndDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowEndPicker(Platform.OS === 'ios');
    if (selectedDate) {
      setEndDate(selectedDate);
      setSelectedRange('allTime'); // Clear quick select when custom date is chosen
    }
  };

  const handleExport = async () => {
    if (transactionCount === 0) {
      Alert.alert('No Data', 'There are no transactions to export in the selected date range.');
      return;
    }

    setIsExporting(true);
    try {
      await exportTransactionsToCSV(
        transactions,
        categories,
        accounts,
        {
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        }
      );
      onClose();
    } catch (error: any) {
      Alert.alert('Export Failed', error.message || 'Unable to export data');
    } finally {
      setIsExporting(false);
    }
  };

  const quickRanges: { key: QuickRange; label: string }[] = [
    { key: 'thisMonth', label: 'This Month' },
    { key: 'lastMonth', label: 'Last Month' },
    { key: 'last3Months', label: 'Last 3 Months' },
    { key: 'allTime', label: 'All Time' },
  ];

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
            <Text style={styles.title}>Export Data</Text>
            <View style={styles.closeBtn} />
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Quick Range Selection */}
            <View style={styles.section}>
              <Text style={styles.label}>Date Range</Text>
              <View style={styles.quickRanges}>
                {quickRanges.map((range) => (
                  <Pressable
                    key={range.key}
                    style={[
                      styles.quickRangeBtn,
                      selectedRange === range.key && styles.quickRangeBtnActive,
                    ]}
                    onPress={() => setQuickRange(range.key)}
                  >
                    <Text
                      style={[
                        styles.quickRangeText,
                        selectedRange === range.key && styles.quickRangeTextActive,
                      ]}
                    >
                      {range.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Custom Date Range */}
            <View style={styles.section}>
              <Text style={styles.label}>Custom Range</Text>
              <View style={styles.dateRow}>
                <Pressable
                  style={styles.dateInput}
                  onPress={() => setShowStartPicker(true)}
                >
                  <MaterialIcons name="event" size={20} color={colors.textMuted} />
                  <Text style={startDate ? styles.dateText : styles.datePlaceholder}>
                    {startDate ? formatDate(startDate) : 'Start Date'}
                  </Text>
                </Pressable>

                <MaterialIcons name="arrow-forward" size={20} color={colors.textMuted} />

                <Pressable
                  style={styles.dateInput}
                  onPress={() => setShowEndPicker(true)}
                >
                  <MaterialIcons name="event" size={20} color={colors.textMuted} />
                  <Text style={endDate ? styles.dateText : styles.datePlaceholder}>
                    {endDate ? formatDate(endDate) : 'End Date'}
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Preview */}
            <View style={styles.preview}>
              <MaterialIcons name="description" size={24} color={colors.primary} />
              <View style={styles.previewInfo}>
                <Text style={styles.previewTitle}>
                  {transactionCount} transaction{transactionCount !== 1 ? 's' : ''}
                </Text>
                <Text style={styles.previewSubtitle}>
                  Will be exported to CSV
                </Text>
              </View>
            </View>

            {/* Export Format Info */}
            <View style={styles.formatInfo}>
              <Text style={styles.formatTitle}>Export Format</Text>
              <Text style={styles.formatText}>
                CSV file with: Date, Description, Category, Amount, Account, Type, Notes
              </Text>
            </View>
          </ScrollView>

          {/* Date Pickers */}
          {showStartPicker && (
            <DateTimePicker
              value={startDate || new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleStartDateChange}
              maximumDate={endDate || new Date()}
              themeVariant="dark"
            />
          )}

          {showEndPicker && (
            <DateTimePicker
              value={endDate || new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleEndDateChange}
              minimumDate={startDate || undefined}
              maximumDate={new Date()}
              themeVariant="dark"
            />
          )}

          {/* Export Button */}
          <View style={styles.footer}>
            <Pressable
              style={[
                styles.exportBtn,
                (isExporting || transactionCount === 0) && styles.exportBtnDisabled,
              ]}
              onPress={handleExport}
              disabled={isExporting || transactionCount === 0}
            >
              {isExporting ? (
                <ActivityIndicator color={colors.text} />
              ) : (
                <>
                  <MaterialIcons name="file-download" size={20} color={colors.text} />
                  <Text style={styles.exportBtnText}>Export CSV</Text>
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
    maxHeight: '85%',
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
  section: {
    marginBottom: spacing.xl,
  },
  label: {
    ...typography.bodySmall,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  quickRanges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  quickRangeBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  quickRangeBtnActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '15',
  },
  quickRangeText: {
    ...typography.body,
    color: colors.textMuted,
  },
  quickRangeTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dateInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  dateText: {
    ...typography.body,
    color: colors.text,
  },
  datePlaceholder: {
    ...typography.body,
    color: colors.textMuted,
  },
  preview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  previewInfo: {
    flex: 1,
  },
  previewTitle: {
    ...typography.h3,
    color: colors.text,
  },
  previewSubtitle: {
    ...typography.caption,
    color: colors.textMuted,
  },
  formatInfo: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  formatTitle: {
    ...typography.bodySmall,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  formatText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    height: 56,
    gap: spacing.sm,
  },
  exportBtnDisabled: {
    opacity: 0.5,
  },
  exportBtnText: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text,
  },
});
