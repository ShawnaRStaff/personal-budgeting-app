import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../theme';
import { SavingsGoal } from '../types';
import { GoalProgress } from '../services/goals';

interface Props {
  goal: SavingsGoal;
  progress: GoalProgress;
  onPress: () => void;
  onContribute: () => void;
}

export function GoalCard({ goal, progress, onPress, onContribute }: Props) {
  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDate = (date?: Date) => {
    if (!date) return null;
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getStatusColor = () => {
    if (goal.isCompleted) return colors.primary;
    if (progress.daysUntilDeadline !== null && progress.daysUntilDeadline < 0) return colors.error;
    if (!progress.isOnTrack && progress.daysUntilDeadline !== null) return colors.warning;
    return goal.color || colors.primary;
  };

  const getStatusMessage = () => {
    if (goal.isCompleted) return 'Completed!';
    if (progress.daysUntilDeadline !== null) {
      if (progress.daysUntilDeadline < 0) {
        return `${Math.abs(progress.daysUntilDeadline)} days overdue`;
      }
      if (progress.daysUntilDeadline === 0) return 'Due today';
      if (progress.daysUntilDeadline === 1) return '1 day left';
      if (progress.daysUntilDeadline <= 30) return `${progress.daysUntilDeadline} days left`;
      return formatDate(goal.deadline);
    }
    return null;
  };

  const statusColor = getStatusColor();
  const statusMessage = getStatusMessage();

  return (
    <Pressable style={styles.container} onPress={onPress}>
      {/* Icon and Info */}
      <View style={styles.topRow}>
        <View style={[styles.iconContainer, { backgroundColor: (goal.color || colors.primary) + '20' }]}>
          <MaterialIcons
            name={(goal.icon as any) || 'flag'}
            size={24}
            color={goal.color || colors.primary}
          />
        </View>
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>{goal.name}</Text>
          <Text style={styles.amounts}>
            <Text style={{ color: statusColor, fontWeight: '600' }}>
              {formatCurrency(goal.currentAmount)}
            </Text>
            <Text style={styles.amountDivider}> / </Text>
            {formatCurrency(goal.targetAmount)}
          </Text>
        </View>
        <View style={styles.percentContainer}>
          <Text style={[styles.percent, { color: statusColor }]}>
            {Math.round(progress.percentComplete)}%
          </Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBg}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.min(progress.percentComplete, 100)}%`,
                backgroundColor: statusColor,
              },
            ]}
          />
        </View>
      </View>

      {/* Bottom Row - Status and Contribute Button */}
      <View style={styles.bottomRow}>
        <View style={styles.statusContainer}>
          {statusMessage && (
            <>
              {goal.isCompleted ? (
                <MaterialIcons name="check-circle" size={14} color={colors.primary} />
              ) : progress.daysUntilDeadline !== null && (
                <MaterialIcons
                  name={progress.daysUntilDeadline < 0 ? 'warning' : 'schedule'}
                  size={14}
                  color={statusColor}
                />
              )}
              <Text style={[styles.statusText, { color: statusColor }]}>
                {statusMessage}
              </Text>
            </>
          )}
          {!goal.isCompleted && progress.amountRemaining > 0 && (
            <Text style={styles.remaining}>
              {formatCurrency(progress.amountRemaining)} to go
            </Text>
          )}
        </View>

        {!goal.isCompleted && (
          <Pressable
            style={[styles.contributeBtn, { backgroundColor: (goal.color || colors.primary) + '20' }]}
            onPress={(e) => {
              e.stopPropagation();
              onContribute();
            }}
          >
            <MaterialIcons name="add" size={18} color={goal.color || colors.primary} />
            <Text style={[styles.contributeBtnText, { color: goal.color || colors.primary }]}>
              Add
            </Text>
          </Pressable>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
  },
  name: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  amounts: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
  amountDivider: {
    color: colors.textMuted,
  },
  percentContainer: {
    alignItems: 'flex-end',
  },
  percent: {
    ...typography.h3,
    fontWeight: '700',
  },
  progressContainer: {
    marginVertical: spacing.md,
  },
  progressBg: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
  },
  statusText: {
    ...typography.caption,
    fontWeight: '500',
  },
  remaining: {
    ...typography.caption,
    color: colors.textMuted,
    marginLeft: spacing.sm,
  },
  contributeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  contributeBtnText: {
    ...typography.bodySmall,
    fontWeight: '600',
  },
});
