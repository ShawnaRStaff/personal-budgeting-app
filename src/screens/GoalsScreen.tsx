import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../theme';
import { useData, useTips } from '../contexts';
import { SavingsGoal } from '../types';
import { GoalCard, AddGoalModal, ContributeModal, SwipeableRow, EditGoalModal, TipCard } from '../components';

type FilterType = 'active' | 'completed' | 'all';

export function GoalsScreen() {
  const { goals, goalProgress, addGoal, editGoal, removeGoal, contributeToGoal } = useData();

  const [showAddGoal, setShowAddGoal] = useState(false);
  const [showContribute, setShowContribute] = useState(false);
  const [showEditGoal, setShowEditGoal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoal | null>(null);
  const [filter, setFilter] = useState<FilterType>('active');

  // Tips
  const { getCurrentTip, dismissTip, nextTip, recordGoalCreated, recordContribution } = useTips();
  const currentTip = getCurrentTip('goals');

  // Calculate counts for tabs
  const goalCounts = useMemo(() => {
    const activeGoals = goals.filter((g) => !g.isCompleted);
    const completedGoals = goals.filter((g) => g.isCompleted);
    return { activeCount: activeGoals.length, completedCount: completedGoals.length };
  }, [goals]);

  // Filter goals based on selection
  const filteredGoals = useMemo(() => {
    const goalsWithProgress = goals.map((goal) => ({
      goal,
      progress: goalProgress.find((p) => p.goal.id === goal.id) || {
        goal,
        percentComplete: 0,
        amountRemaining: goal.targetAmount,
        daysUntilDeadline: null,
        isOnTrack: true,
        recentContribution: null,
      },
    }));

    switch (filter) {
      case 'active':
        return goalsWithProgress.filter((g) => !g.goal.isCompleted);
      case 'completed':
        return goalsWithProgress.filter((g) => g.goal.isCompleted);
      default:
        return goalsWithProgress;
    }
  }, [goals, goalProgress, filter]);

  // Calculate totals based on filtered goals
  const totals = useMemo(() => {
    const goalsToSum = filteredGoals.map((g) => g.goal);
    const totalSaved = goalsToSum.reduce((sum, g) => sum + g.currentAmount, 0);
    const totalTarget = goalsToSum.reduce((sum, g) => sum + g.targetAmount, 0);
    return { totalSaved, totalTarget };
  }, [filteredGoals]);

  const overallProgress = totals.totalTarget > 0
    ? (totals.totalSaved / totals.totalTarget) * 100
    : 0;

  // Dynamic label based on filter
  const totalLabel = useMemo(() => {
    switch (filter) {
      case 'active':
        return 'ACTIVE GOALS';
      case 'completed':
        return 'COMPLETED GOALS';
      default:
        return 'ALL GOALS';
    }
  }, [filter]);

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const handleAddGoal = async (data: any) => {
    await addGoal(data);
    recordGoalCreated();
  };

  const handleContribute = (goal: SavingsGoal) => {
    setSelectedGoal(goal);
    setShowContribute(true);
  };

  const handleContributeSubmit = async (amount: number, note?: string) => {
    if (!selectedGoal) return;
    await contributeToGoal(selectedGoal.id, amount, note);

    // Calculate new percentage and trigger milestone toast
    const newAmount = selectedGoal.currentAmount + amount;
    const newPercent = (newAmount / selectedGoal.targetAmount) * 100;
    recordContribution(newPercent);
  };

  const handleEditGoal = (goal: SavingsGoal) => {
    setSelectedGoal(goal);
    setShowEditGoal(true);
  };

  const handleEditSubmit = async (data: Partial<SavingsGoal>) => {
    if (!selectedGoal) return;
    await editGoal(selectedGoal.id, data);
  };

  const handleDeleteGoal = (goal: SavingsGoal) => {
    Alert.alert(
      'Delete Goal',
      `Are you sure you want to delete "${goal.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeGoal(goal.id);
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete goal');
            }
          },
        },
      ]
    );
  };

  const handleGoalPress = (goal: SavingsGoal) => {
    // For now, just open contribute modal. Could expand to full detail view later.
    if (!goal.isCompleted) {
      handleContribute(goal);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Savings Goals</Text>
          <Pressable style={styles.addBtn} onPress={() => setShowAddGoal(true)}>
            <MaterialIcons name="add" size={24} color={colors.text} />
          </Pressable>
        </View>

        {/* Tip Card */}
        {currentTip && (
          <TipCard
            tip={currentTip}
            onDismiss={dismissTip}
            onNext={() => nextTip('goals')}
          />
        )}

        {/* Total Saved Card */}
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>{totalLabel}</Text>
          <Text style={styles.totalAmount}>{formatCurrency(totals.totalSaved)}</Text>
          {totals.totalTarget > 0 && (
            <>
              <View style={styles.totalProgressContainer}>
                <View style={styles.totalProgressBg}>
                  <View
                    style={[
                      styles.totalProgressFill,
                      { width: `${Math.min(overallProgress, 100)}%` },
                    ]}
                  />
                </View>
                <Text style={styles.totalProgressText}>
                  {Math.round(overallProgress)}% of {formatCurrency(totals.totalTarget)}
                </Text>
              </View>
            </>
          )}
          <Text style={styles.totalSubtext}>
            {filteredGoals.length} goal{filteredGoals.length !== 1 ? 's' : ''}
          </Text>
        </View>

        {/* Filter Tabs */}
        {goals.length > 0 && (
          <View style={styles.filterTabs}>
            <Pressable
              style={[styles.filterTab, filter === 'active' && styles.filterTabActive]}
              onPress={() => setFilter('active')}
            >
              <Text style={[styles.filterTabText, filter === 'active' && styles.filterTabTextActive]}>
                Active ({goalCounts.activeCount})
              </Text>
            </Pressable>
            <Pressable
              style={[styles.filterTab, filter === 'completed' && styles.filterTabActive]}
              onPress={() => setFilter('completed')}
            >
              <Text style={[styles.filterTabText, filter === 'completed' && styles.filterTabTextActive]}>
                Completed ({goalCounts.completedCount})
              </Text>
            </Pressable>
            <Pressable
              style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
              onPress={() => setFilter('all')}
            >
              <Text style={[styles.filterTabText, filter === 'all' && styles.filterTabTextActive]}>
                All ({goals.length})
              </Text>
            </Pressable>
          </View>
        )}

        {/* Goals List */}
        {filteredGoals.length > 0 ? (
          <View style={styles.goalsList}>
            {filteredGoals.map(({ goal, progress }) => (
              <SwipeableRow
                key={goal.id}
                onEdit={() => handleEditGoal(goal)}
                onDelete={() => handleDeleteGoal(goal)}
              >
                <GoalCard
                  goal={goal}
                  progress={progress}
                  onPress={() => handleGoalPress(goal)}
                  onContribute={() => handleContribute(goal)}
                />
              </SwipeableRow>
            ))}
          </View>
        ) : goals.length === 0 ? (
          /* Empty State - No Goals */
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <MaterialIcons name="flag" size={56} color={colors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>No savings goals yet</Text>
            <Text style={styles.emptySubtitle}>
              Set goals for things you want to save for - vacation, emergency fund, or that new gadget
            </Text>
            <View style={styles.emptyTip}>
              <MaterialIcons name="lightbulb" size={16} color={colors.info} />
              <Text style={styles.emptyTipText}>
                People with written financial goals are 42% more likely to achieve them than those without.
              </Text>
            </View>
            <Pressable style={styles.ctaBtn} onPress={() => setShowAddGoal(true)}>
              <MaterialIcons name="add" size={20} color={colors.text} />
              <Text style={styles.ctaBtnText}>Create Goal</Text>
            </Pressable>
          </View>
        ) : (
          /* Empty State - Filter has no results */
          <View style={styles.emptyState}>
            <MaterialIcons
              name={filter === 'completed' ? 'emoji-events' : 'flag'}
              size={48}
              color={colors.textMuted}
            />
            <Text style={styles.emptyTitle}>
              {filter === 'completed' ? 'No completed goals yet' : 'No active goals'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {filter === 'completed'
                ? 'Keep saving and you\'ll see your accomplishments here!'
                : 'All your goals have been completed. Create a new one!'}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Add Goal Modal */}
      <AddGoalModal
        visible={showAddGoal}
        onClose={() => setShowAddGoal(false)}
        onSubmit={handleAddGoal}
      />

      {/* Contribute Modal */}
      <ContributeModal
        visible={showContribute}
        onClose={() => {
          setShowContribute(false);
          setSelectedGoal(null);
        }}
        onSubmit={handleContributeSubmit}
        goal={selectedGoal}
      />

      {/* Edit Goal Modal */}
      <EditGoalModal
        visible={showEditGoal}
        onClose={() => {
          setShowEditGoal(false);
          setSelectedGoal(null);
        }}
        onSubmit={handleEditSubmit}
        goal={selectedGoal}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
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
  totalCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  totalLabel: {
    ...typography.label,
    marginBottom: spacing.sm,
  },
  totalAmount: {
    ...typography.displayLarge,
    color: colors.primary,
    marginBottom: spacing.md,
  },
  totalProgressContainer: {
    width: '100%',
    marginBottom: spacing.sm,
  },
  totalProgressBg: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  totalProgressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  totalProgressText: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
  },
  totalSubtext: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
  filterTabs: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.xs,
    marginBottom: spacing.lg,
  },
  filterTab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: borderRadius.sm,
  },
  filterTabActive: {
    backgroundColor: colors.primary,
  },
  filterTabText: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
  filterTabTextActive: {
    color: colors.text,
    fontWeight: '600',
  },
  goalsList: {
    gap: spacing.sm,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
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
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  emptyTip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: `${colors.info}10`,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  emptyTipText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    flex: 1,
    fontStyle: 'italic',
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
