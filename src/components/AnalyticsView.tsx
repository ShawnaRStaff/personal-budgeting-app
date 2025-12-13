import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import { PieChart, BarChart, LineChart } from 'react-native-gifted-charts';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../theme';
import { Transaction, Category, BudgetProgress } from '../types';
import { TransactionType } from '../types';

const screenWidth = Dimensions.get('window').width;

interface Props {
  transactions: Transaction[];
  categories: Category[];
  budgetProgress: BudgetProgress[];
  selectedAccountId?: string | null; // null = all accounts
}

type TimePeriod = 'thisMonth' | 'last3Months' | 'last6Months' | 'year';

export function AnalyticsView({ transactions, categories, budgetProgress, selectedAccountId }: Props) {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('thisMonth');

  // Filter transactions by selected account
  const accountTransactions = useMemo(() => {
    if (!selectedAccountId) return transactions; // All accounts
    return transactions.filter((t) => t.accountId === selectedAccountId);
  }, [transactions, selectedAccountId]);

  // Get date range based on selected period
  const dateRange = useMemo(() => {
    const now = new Date();
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    let start: Date;

    switch (timePeriod) {
      case 'thisMonth':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'last3Months':
        start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        break;
      case 'last6Months':
        start = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        break;
      case 'year':
        start = new Date(now.getFullYear(), 0, 1);
        break;
    }

    return { start, end };
  }, [timePeriod]);

  // Filter transactions by date range
  const filteredTransactions = useMemo(() => {
    return accountTransactions.filter(
      (t) => t.date >= dateRange.start && t.date <= dateRange.end
    );
  }, [accountTransactions, dateRange]);

  // Calculate spending by category for pie chart
  const categorySpending = useMemo(() => {
    const spending: Record<string, { amount: number; category: Category }> = {};

    for (const tx of filteredTransactions) {
      if (tx.type === TransactionType.EXPENSE || tx.type === TransactionType.TRANSFER_OUT) {
        const category = categories.find((c) => c.id === tx.categoryId);
        if (category) {
          if (!spending[category.id]) {
            spending[category.id] = { amount: 0, category };
          }
          spending[category.id].amount += tx.amount;
        }
      }
    }

    // Sort by amount and take top 6
    const sorted = Object.values(spending)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 6);

    // Calculate total for percentages
    const total = sorted.reduce((sum, item) => sum + item.amount, 0);

    return sorted.map((item) => ({
      value: item.amount,
      color: item.category.color,
      text: `${Math.round((item.amount / total) * 100)}%`,
      label: item.category.name,
    }));
  }, [filteredTransactions, categories]);

  // Calculate monthly income vs expenses for bar chart
  const monthlyComparison = useMemo(() => {
    const months: Record<string, { income: number; expenses: number; label: string }> = {};
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    for (const tx of filteredTransactions) {
      const monthKey = `${tx.date.getFullYear()}-${tx.date.getMonth()}`;
      const monthLabel = monthNames[tx.date.getMonth()];

      if (!months[monthKey]) {
        months[monthKey] = { income: 0, expenses: 0, label: monthLabel };
      }

      if (tx.type === TransactionType.INCOME || tx.type === TransactionType.TRANSFER_IN) {
        months[monthKey].income += tx.amount;
      } else if (tx.type === TransactionType.EXPENSE || tx.type === TransactionType.TRANSFER_OUT) {
        months[monthKey].expenses += tx.amount;
      }
    }

    // Sort by date and convert to bar chart format
    const sortedMonths = Object.entries(months)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, data]) => data);

    // Create paired bar data
    const barData: any[] = [];
    sortedMonths.forEach((month) => {
      barData.push({
        value: month.income,
        label: month.label,
        frontColor: colors.income,
        spacing: 2,
      });
      barData.push({
        value: month.expenses,
        frontColor: colors.expense,
        spacing: 20,
      });
    });

    return barData;
  }, [filteredTransactions]);

  // Calculate spending trend (daily totals) for line chart
  const spendingTrend = useMemo(() => {
    const dailyTotals: Record<string, number> = {};

    for (const tx of filteredTransactions) {
      if (tx.type === TransactionType.EXPENSE || tx.type === TransactionType.TRANSFER_OUT) {
        const dateKey = tx.date.toISOString().split('T')[0];
        dailyTotals[dateKey] = (dailyTotals[dateKey] || 0) + tx.amount;
      }
    }

    // Get sorted dates and create cumulative sum
    const sortedDates = Object.keys(dailyTotals).sort();
    let cumulative = 0;

    // Sample data points (max 15 for readability)
    const step = Math.max(1, Math.floor(sortedDates.length / 15));
    const lineData: any[] = [];

    sortedDates.forEach((date, index) => {
      cumulative += dailyTotals[date];
      if (index % step === 0 || index === sortedDates.length - 1) {
        const d = new Date(date);
        lineData.push({
          value: cumulative,
          label: `${d.getMonth() + 1}/${d.getDate()}`,
          dataPointText: '',
        });
      }
    });

    return lineData;
  }, [filteredTransactions]);

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    let totalIncome = 0;
    let totalExpenses = 0;

    for (const tx of filteredTransactions) {
      if (tx.type === TransactionType.INCOME || tx.type === TransactionType.TRANSFER_IN) {
        totalIncome += tx.amount;
      } else if (tx.type === TransactionType.EXPENSE || tx.type === TransactionType.TRANSFER_OUT) {
        totalExpenses += tx.amount;
      }
    }

    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;
    const avgDailySpend = filteredTransactions.length > 0
      ? totalExpenses / Math.max(1, Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24)))
      : 0;

    return {
      totalIncome,
      totalExpenses,
      netSavings: totalIncome - totalExpenses,
      savingsRate,
      avgDailySpend,
      transactionCount: filteredTransactions.length,
    };
  }, [filteredTransactions, dateRange]);

  const formatCurrency = (amount: number) => {
    return `$${Math.abs(amount).toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  };

  const timePeriodOptions: { key: TimePeriod; label: string }[] = [
    { key: 'thisMonth', label: 'This Month' },
    { key: 'last3Months', label: '3 Months' },
    { key: 'last6Months', label: '6 Months' },
    { key: 'year', label: 'Year' },
  ];

  return (
    <View style={styles.container}>
      {/* Time Period Selector */}
      <View style={styles.periodSelector}>
        {timePeriodOptions.map((option) => (
          <Pressable
            key={option.key}
            style={[
              styles.periodOption,
              timePeriod === option.key && styles.periodOptionActive,
            ]}
            onPress={() => setTimePeriod(option.key)}
          >
            <Text
              style={[
                styles.periodOptionText,
                timePeriod === option.key && styles.periodOptionTextActive,
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Summary Stats */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Income</Text>
            <Text style={[styles.summaryValue, { color: colors.income }]}>
              +{formatCurrency(summaryStats.totalIncome)}
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Expenses</Text>
            <Text style={[styles.summaryValue, { color: colors.expense }]}>
              -{formatCurrency(summaryStats.totalExpenses)}
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Net</Text>
            <Text style={[
              styles.summaryValue,
              { color: summaryStats.netSavings >= 0 ? colors.income : colors.expense }
            ]}>
              {summaryStats.netSavings >= 0 ? '+' : '-'}{formatCurrency(summaryStats.netSavings)}
            </Text>
          </View>
        </View>
        <View style={styles.summaryFooter}>
          <View style={styles.summaryFooterItem}>
            <MaterialIcons name="trending-up" size={16} color={colors.textMuted} />
            <Text style={styles.summaryFooterText}>
              {summaryStats.savingsRate.toFixed(0)}% savings rate
            </Text>
          </View>
          <View style={styles.summaryFooterItem}>
            <MaterialIcons name="today" size={16} color={colors.textMuted} />
            <Text style={styles.summaryFooterText}>
              {formatCurrency(summaryStats.avgDailySpend)}/day avg
            </Text>
          </View>
        </View>
      </View>

      {/* Spending by Category */}
      {categorySpending.length > 0 && (
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Spending by Category</Text>
          <View style={styles.pieChartContainer}>
            <PieChart
              data={categorySpending}
              donut
              radius={80}
              innerRadius={50}
              innerCircleColor={colors.surface}
              centerLabelComponent={() => (
                <View style={styles.pieCenter}>
                  <Text style={styles.pieCenterAmount}>
                    {formatCurrency(categorySpending.reduce((sum, item) => sum + item.value, 0))}
                  </Text>
                  <Text style={styles.pieCenterLabel}>Total</Text>
                </View>
              )}
            />
            <View style={styles.legendContainer}>
              {categorySpending.map((item, index) => (
                <View key={index} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                  <Text style={styles.legendText} numberOfLines={1}>
                    {item.label}
                  </Text>
                  <Text style={styles.legendValue}>{formatCurrency(item.value)}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      )}

      {/* Income vs Expenses */}
      {monthlyComparison.length > 0 && (
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Income vs Expenses</Text>
          <View style={styles.legendRow}>
            <View style={styles.legendRowItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.income }]} />
              <Text style={styles.legendRowText}>Income</Text>
            </View>
            <View style={styles.legendRowItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.expense }]} />
              <Text style={styles.legendRowText}>Expenses</Text>
            </View>
          </View>
          <BarChart
            data={monthlyComparison}
            barWidth={16}
            spacing={2}
            roundedTop
            roundedBottom
            xAxisThickness={0}
            yAxisThickness={0}
            yAxisTextStyle={{ color: colors.textMuted, fontSize: 10 }}
            xAxisLabelTextStyle={{ color: colors.textMuted, fontSize: 10 }}
            noOfSections={4}
            maxValue={Math.max(...monthlyComparison.map((d) => d.value)) * 1.2}
            width={screenWidth - spacing.md * 4 - 40}
            height={150}
            hideRules
          />
        </View>
      )}

      {/* Spending Trend */}
      {spendingTrend.length > 1 && (
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Cumulative Spending</Text>
          <LineChart
            data={spendingTrend}
            color={colors.expense}
            thickness={2}
            dataPointsColor={colors.expense}
            dataPointsRadius={4}
            xAxisThickness={0}
            yAxisThickness={0}
            yAxisTextStyle={{ color: colors.textMuted, fontSize: 10 }}
            xAxisLabelTextStyle={{ color: colors.textMuted, fontSize: 9 }}
            noOfSections={4}
            width={screenWidth - spacing.md * 4 - 40}
            height={150}
            hideRules
            curved
            areaChart
            startFillColor={colors.expense}
            startOpacity={0.2}
            endOpacity={0}
          />
        </View>
      )}

      {/* Empty State */}
      {filteredTransactions.length === 0 && (
        <View style={styles.emptyState}>
          <MaterialIcons name="insert-chart" size={64} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>No data for this period</Text>
          <Text style={styles.emptySubtitle}>
            Add some transactions to see your analytics
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.xs,
    marginBottom: spacing.lg,
  },
  periodOption: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: borderRadius.sm,
  },
  periodOptionActive: {
    backgroundColor: colors.primary,
  },
  periodOptionText: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
  periodOptionTextActive: {
    color: colors.text,
    fontWeight: '600',
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
  },
  summaryLabel: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  summaryValue: {
    ...typography.h3,
    fontWeight: '700',
  },
  summaryFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.lg,
  },
  summaryFooterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  summaryFooterText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  chartCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  chartTitle: {
    ...typography.h3,
    marginBottom: spacing.md,
  },
  pieChartContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pieCenter: {
    alignItems: 'center',
  },
  pieCenterAmount: {
    ...typography.body,
    fontWeight: '700',
    color: colors.text,
  },
  pieCenterLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  legendContainer: {
    flex: 1,
    marginLeft: spacing.lg,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: spacing.sm,
  },
  legendText: {
    ...typography.caption,
    color: colors.textSecondary,
    flex: 1,
  },
  legendValue: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '500',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.lg,
    marginBottom: spacing.md,
  },
  legendRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendRowText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.textSecondary,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    ...typography.bodySmall,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
