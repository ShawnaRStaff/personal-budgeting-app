import React, { useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Animated,
} from 'react-native';
import { Swipeable, ScrollView } from 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../theme';
import { BudgetProgress, Category } from '../types';
import { GoalProgress } from '../services/goals';
import {
  AppNotification,
  generateAllNotifications,
  generatePositiveNotifications,
} from '../services/notifications';

interface Props {
  visible: boolean;
  onClose: () => void;
  budgetAlerts: BudgetProgress[];
  goalProgress: GoalProgress[];
  categories: Category[];
  onDismissAlert: (notificationId: string) => void;
  dismissedIds: Set<string>;
}

export function NotificationsDropdown({
  visible,
  onClose,
  budgetAlerts,
  goalProgress,
  categories,
  onDismissAlert,
  dismissedIds,
}: Props) {
  const swipeableRefs = useRef<Map<string, Swipeable | null>>(new Map());

  // Generate all notifications
  const allNotifications = useMemo(() => {
    const alerts = generateAllNotifications(budgetAlerts, goalProgress);
    const positive = generatePositiveNotifications(budgetAlerts, goalProgress);
    return [...alerts, ...positive].filter(n => !dismissedIds.has(n.id));
  }, [budgetAlerts, goalProgress, dismissedIds]);

  // Separate by priority for display
  const { urgent, normal, positive } = useMemo(() => {
    return {
      urgent: allNotifications.filter(n => n.priority === 'high'),
      normal: allNotifications.filter(n => n.priority === 'medium'),
      positive: allNotifications.filter(n => n.priority === 'low'),
    };
  }, [allNotifications]);

  const getCategory = (categoryId?: string | null) => {
    if (!categoryId) return undefined;
    return categories.find((c) => c.id === categoryId);
  };

  const formatCurrency = (amount: number) => {
    return `$${Math.abs(amount).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const renderRightActions = (
    notificationId: string,
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    const translateX = dragX.interpolate({
      inputRange: [-80, 0],
      outputRange: [0, 80],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View style={[styles.dismissAction, { transform: [{ translateX }] }]}>
        <Pressable
          style={styles.dismissButton}
          onPress={() => {
            swipeableRefs.current.get(notificationId)?.close();
            onDismissAlert(notificationId);
          }}
        >
          <MaterialIcons name="close" size={20} color="#fff" />
          <Text style={styles.dismissText}>Dismiss</Text>
        </Pressable>
      </Animated.View>
    );
  };

  const renderNotification = (notification: AppNotification) => {
    const isUrgent = notification.priority === 'high';
    const isPositive = notification.priority === 'low' &&
      (notification.type === 'budget_on_track' || notification.type === 'goal_completed' || notification.type === 'goal_milestone');

    return (
      <Swipeable
        key={notification.id}
        ref={(ref) => {
          swipeableRefs.current.set(notification.id, ref);
        }}
        renderRightActions={(progress, dragX) =>
          renderRightActions(notification.id, progress, dragX)
        }
        rightThreshold={40}
        friction={2}
        overshootRight={false}
      >
        <View
          style={[
            styles.notificationItem,
            isUrgent && styles.notificationItemUrgent,
            isPositive && styles.notificationItemPositive,
          ]}
        >
          <View style={[styles.notificationIcon, { backgroundColor: notification.color + '20' }]}>
            <MaterialIcons
              name={notification.icon as any}
              size={20}
              color={notification.color}
            />
          </View>
          <View style={styles.notificationContent}>
            <Text style={styles.notificationTitle}>{notification.title}</Text>
            <Text style={styles.notificationMessage}>{notification.message}</Text>
            {notification.data.amount !== undefined && (
              <Text style={styles.notificationSubtext}>
                {notification.type.includes('budget')
                  ? `${formatCurrency(notification.data.amount)} ${notification.data.percentUsed && notification.data.percentUsed >= 100 ? 'over' : 'remaining'}`
                  : `${formatCurrency(notification.data.amount)} to go`
                }
              </Text>
            )}
          </View>
          <View
            style={[
              styles.notificationIndicator,
              { backgroundColor: notification.color },
            ]}
          />
        </View>
      </Swipeable>
    );
  };

  const hasNotifications = allNotifications.length > 0;
  const urgentCount = urgent.length;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <GestureHandlerRootView style={styles.gestureRoot}>
        <Pressable style={styles.overlay} onPress={onClose}>
          <Pressable style={styles.dropdown} onPress={(e) => e.stopPropagation()}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Notifications</Text>
              {hasNotifications && (
                <View style={[styles.badge, urgentCount > 0 && styles.badgeUrgent]}>
                  <Text style={styles.badgeText}>{allNotifications.length}</Text>
                </View>
              )}
            </View>

            {/* Content */}
            {hasNotifications ? (
              <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Urgent Section */}
                {urgent.length > 0 && (
                  <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                      <MaterialIcons name="error" size={14} color={colors.error} />
                      <Text style={[styles.sectionTitle, { color: colors.error }]}>
                        Needs Attention
                      </Text>
                    </View>
                    {urgent.map(renderNotification)}
                  </View>
                )}

                {/* Normal Section */}
                {normal.length > 0 && (
                  <View style={styles.section}>
                    {urgent.length > 0 && (
                      <View style={styles.sectionHeader}>
                        <MaterialIcons name="info" size={14} color={colors.warning} />
                        <Text style={[styles.sectionTitle, { color: colors.warning }]}>
                          Warnings
                        </Text>
                      </View>
                    )}
                    {normal.map(renderNotification)}
                  </View>
                )}

                {/* Positive Section */}
                {positive.length > 0 && (
                  <View style={styles.section}>
                    {(urgent.length > 0 || normal.length > 0) && (
                      <View style={styles.sectionHeader}>
                        <MaterialIcons name="check-circle" size={14} color={colors.primary} />
                        <Text style={[styles.sectionTitle, { color: colors.primary }]}>
                          Good News
                        </Text>
                      </View>
                    )}
                    {positive.map(renderNotification)}
                  </View>
                )}

                <Text style={styles.swipeHint}>Swipe left to dismiss</Text>
              </ScrollView>
            ) : (
              <View style={styles.emptyState}>
                <MaterialIcons name="notifications-none" size={48} color={colors.textMuted} />
                <Text style={styles.emptyTitle}>All caught up!</Text>
                <Text style={styles.emptySubtitle}>
                  No alerts at this time. Keep up the good financial habits!
                </Text>
              </View>
            )}
          </Pressable>
        </Pressable>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  gestureRoot: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  dropdown: {
    position: 'absolute',
    top: 100,
    right: spacing.md,
    left: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    maxHeight: 450,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    ...typography.h3,
  },
  badge: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    minWidth: 24,
    alignItems: 'center',
  },
  badgeUrgent: {
    backgroundColor: colors.error,
  },
  badgeText: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '700',
  },
  content: {
    maxHeight: 350,
  },
  section: {
    paddingTop: spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xs,
  },
  sectionTitle: {
    ...typography.caption,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  notificationItem: {
    flexDirection: 'row',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
  },
  notificationItemUrgent: {
    backgroundColor: colors.error + '08',
  },
  notificationItemPositive: {
    backgroundColor: colors.primary + '08',
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  notificationMessage: {
    ...typography.body,
    color: colors.text,
  },
  notificationSubtext: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  notificationIndicator: {
    width: 4,
    height: '80%',
    borderRadius: 2,
  },
  emptyState: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyTitle: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text,
    marginTop: spacing.md,
  },
  emptySubtitle: {
    ...typography.bodySmall,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  dismissAction: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dismissButton: {
    width: 80,
    height: '100%',
    backgroundColor: colors.textMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dismissText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  swipeHint: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: spacing.sm,
  },
});
