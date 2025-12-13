import { BudgetProgress, SavingsGoal } from '../types';
import { GoalProgress } from './goals';

// ============================================================
// NOTIFICATION TYPES
// ============================================================

export type NotificationType =
  | 'budget_warning'      // Budget at 80-99%
  | 'budget_exceeded'     // Budget over 100%
  | 'budget_on_track'     // Finished month under budget
  | 'goal_milestone'      // Goal hit 25/50/75%
  | 'goal_completed'      // Goal reached 100%
  | 'goal_contribution'   // Recent contribution made
  | 'goal_deadline'       // Deadline approaching
  | 'goal_behind';        // Behind schedule on goal

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  icon: string;
  color: string;
  priority: 'low' | 'medium' | 'high';
  timestamp: Date;
  data: {
    budgetId?: string;
    goalId?: string;
    percentUsed?: number;
    percentComplete?: number;
    amount?: number;
    daysRemaining?: number;
  };
}

// ============================================================
// NOTIFICATION GENERATORS
// ============================================================

export function generateBudgetNotifications(
  budgetProgress: BudgetProgress[]
): AppNotification[] {
  const notifications: AppNotification[] = [];
  const now = new Date();

  for (const bp of budgetProgress) {
    const { budget, percentUsed, spent, remaining } = bp;

    // Budget exceeded (100%+)
    if (percentUsed >= 100) {
      notifications.push({
        id: `budget-exceeded-${budget.id}`,
        type: 'budget_exceeded',
        title: 'Over Budget',
        message: `${budget.name} is at ${Math.round(percentUsed)}%`,
        icon: 'error',
        color: '#F44336', // error red
        priority: 'high',
        timestamp: now,
        data: {
          budgetId: budget.id,
          percentUsed,
          amount: Math.abs(remaining),
        },
      });
    }
    // Budget warning (80-99%)
    else if (percentUsed >= 80) {
      notifications.push({
        id: `budget-warning-${budget.id}`,
        type: 'budget_warning',
        title: 'Budget Warning',
        message: `${budget.name} is at ${Math.round(percentUsed)}%`,
        icon: 'warning',
        color: '#FF9800', // warning orange
        priority: 'medium',
        timestamp: now,
        data: {
          budgetId: budget.id,
          percentUsed,
          amount: remaining,
        },
      });
    }
  }

  return notifications;
}

export function generateGoalNotifications(
  goalProgress: GoalProgress[]
): AppNotification[] {
  const notifications: AppNotification[] = [];
  const now = new Date();

  for (const gp of goalProgress) {
    const { goal, percentComplete, daysUntilDeadline, isOnTrack, amountRemaining } = gp;

    // Skip completed goals for most notifications
    if (goal.isCompleted) {
      // Recently completed (within last 7 days)
      if (goal.completedAt) {
        const completedDate = goal.completedAt instanceof Date ? goal.completedAt : new Date(goal.completedAt);
        const daysSinceComplete = Math.floor((now.getTime() - completedDate.getTime()) / (1000 * 60 * 60 * 24));
        if (daysSinceComplete <= 7) {
          notifications.push({
            id: `goal-completed-${goal.id}`,
            type: 'goal_completed',
            title: 'Goal Achieved',
            message: `${goal.name} - $${goal.targetAmount.toLocaleString()} saved`,
            icon: 'emoji-events',
            color: '#4CAF50', // success green
            priority: 'low',
            timestamp: completedDate,
            data: {
              goalId: goal.id,
              percentComplete: 100,
              amount: goal.targetAmount,
            },
          });
        }
      }
      continue;
    }

    // Goal milestones (25%, 50%, 75%)
    const milestones = [75, 50, 25];
    for (const milestone of milestones) {
      if (percentComplete >= milestone && percentComplete < milestone + 5) {
        notifications.push({
          id: `goal-milestone-${goal.id}-${milestone}`,
          type: 'goal_milestone',
          title: `${milestone}% Complete`,
          message: `${goal.name} - $${amountRemaining.toLocaleString()} to go`,
          icon: 'trending-up',
          color: goal.color || '#4CAF50',
          priority: 'low',
          timestamp: now,
          data: {
            goalId: goal.id,
            percentComplete,
            amount: amountRemaining,
          },
        });
        break; // Only show one milestone notification per goal
      }
    }

    // Deadline approaching (within 14 days)
    if (daysUntilDeadline !== null && daysUntilDeadline > 0 && daysUntilDeadline <= 14) {
      const urgency = daysUntilDeadline <= 3 ? 'high' : daysUntilDeadline <= 7 ? 'medium' : 'low';
      notifications.push({
        id: `goal-deadline-${goal.id}`,
        type: 'goal_deadline',
        title: daysUntilDeadline === 1 ? 'Due Tomorrow' : `${daysUntilDeadline} Days Left`,
        message: `${goal.name} - ${Math.round(percentComplete)}% complete`,
        icon: 'schedule',
        color: urgency === 'high' ? '#F44336' : urgency === 'medium' ? '#FF9800' : goal.color || '#4CAF50',
        priority: urgency,
        timestamp: now,
        data: {
          goalId: goal.id,
          percentComplete,
          daysRemaining: daysUntilDeadline,
        },
      });
    }

    // Behind schedule warning
    if (!isOnTrack && daysUntilDeadline !== null && daysUntilDeadline > 0) {
      notifications.push({
        id: `goal-behind-${goal.id}`,
        type: 'goal_behind',
        title: 'Behind Schedule',
        message: `${goal.name} needs attention to meet deadline`,
        icon: 'trending-down',
        color: '#FF9800',
        priority: 'medium',
        timestamp: now,
        data: {
          goalId: goal.id,
          percentComplete,
          daysRemaining: daysUntilDeadline,
        },
      });
    }

    // Overdue (deadline passed)
    if (daysUntilDeadline !== null && daysUntilDeadline < 0) {
      notifications.push({
        id: `goal-overdue-${goal.id}`,
        type: 'goal_deadline',
        title: 'Deadline Passed',
        message: `${goal.name} is ${Math.abs(daysUntilDeadline)} days overdue`,
        icon: 'event-busy',
        color: '#F44336',
        priority: 'high',
        timestamp: now,
        data: {
          goalId: goal.id,
          percentComplete,
          daysRemaining: daysUntilDeadline,
        },
      });
    }
  }

  return notifications;
}

// ============================================================
// COMBINED NOTIFICATION HELPER
// ============================================================

export function generateAllNotifications(
  budgetProgress: BudgetProgress[],
  goalProgress: GoalProgress[]
): AppNotification[] {
  const budgetNotifs = generateBudgetNotifications(budgetProgress);
  const goalNotifs = generateGoalNotifications(goalProgress);

  // Combine and sort by priority then timestamp
  const allNotifs = [...budgetNotifs, ...goalNotifs];

  const priorityOrder = { high: 0, medium: 1, low: 2 };
  allNotifs.sort((a, b) => {
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return b.timestamp.getTime() - a.timestamp.getTime();
  });

  return allNotifs;
}

// ============================================================
// POSITIVE NOTIFICATION GENERATORS (for achievements)
// ============================================================

export function generatePositiveNotifications(
  budgetProgress: BudgetProgress[],
  goalProgress: GoalProgress[]
): AppNotification[] {
  const notifications: AppNotification[] = [];
  const now = new Date();

  // Budgets that are well under control (<60% used)
  const healthyBudgets = budgetProgress.filter(bp => bp.percentUsed < 60 && bp.percentUsed > 0);
  if (healthyBudgets.length > 0 && healthyBudgets.length >= budgetProgress.length / 2) {
    notifications.push({
      id: 'budgets-healthy',
      type: 'budget_on_track',
      title: 'Budgets on Track',
      message: `${healthyBudgets.length} of ${budgetProgress.length} budgets under 60%`,
      icon: 'thumb-up',
      color: '#4CAF50',
      priority: 'low',
      timestamp: now,
      data: {},
    });
  }

  // Goals making good progress (on track with deadline)
  const onTrackGoals = goalProgress.filter(
    gp => !gp.goal.isCompleted && gp.isOnTrack && gp.daysUntilDeadline !== null
  );
  if (onTrackGoals.length > 0) {
    notifications.push({
      id: 'goals-on-track',
      type: 'goal_milestone',
      title: 'Goals on Track',
      message: `${onTrackGoals.length} goal${onTrackGoals.length > 1 ? 's' : ''} progressing well`,
      icon: 'trending-up',
      color: '#4CAF50',
      priority: 'low',
      timestamp: now,
      data: {},
    });
  }

  return notifications;
}
