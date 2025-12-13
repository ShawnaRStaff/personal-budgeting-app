import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../theme';
import { useAuth } from '../contexts';
import { NotificationPreferences, DEFAULT_NOTIFICATION_PREFERENCES } from '../types';

interface Props {
  visible: boolean;
  onClose: () => void;
}

interface ToggleRowProps {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  hint: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}

function ToggleRow({ icon, label, hint, value, onValueChange }: ToggleRowProps) {
  return (
    <View style={styles.toggleRow}>
      <View style={styles.toggleIcon}>
        <MaterialIcons name={icon} size={20} color={colors.primary} />
      </View>
      <View style={styles.toggleInfo}>
        <Text style={styles.toggleLabel}>{label}</Text>
        <Text style={styles.toggleHint}>{hint}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.border, true: colors.primary + '50' }}
        thumbColor={value ? colors.primary : colors.textMuted}
      />
    </View>
  );
}

export function NotificationSettingsModal({ visible, onClose }: Props) {
  const { user, updatePreferences } = useAuth();

  // Get current notification preferences with defaults
  const notifications: NotificationPreferences = {
    ...DEFAULT_NOTIFICATION_PREFERENCES,
    ...user?.preferences?.notifications,
  };

  const handleToggle = async (key: keyof NotificationPreferences, value: boolean) => {
    try {
      await updatePreferences({
        notifications: {
          ...notifications,
          [key]: value,
        },
      });
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update preferences');
    }
  };

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
            <Text style={styles.title}>Notifications</Text>
            <View style={styles.closeBtn} />
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Budget Notifications */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>BUDGET ALERTS</Text>
              <View style={styles.sectionContent}>
                <ToggleRow
                  icon="warning"
                  label="Budget warnings"
                  hint="Alert when spending reaches 80% of budget"
                  value={notifications.budgetWarnings}
                  onValueChange={(value) => handleToggle('budgetWarnings', value)}
                />
                <ToggleRow
                  icon="error"
                  label="Over budget"
                  hint="Alert when spending exceeds budget"
                  value={notifications.budgetExceeded}
                  onValueChange={(value) => handleToggle('budgetExceeded', value)}
                />
              </View>
            </View>

            {/* Goal Notifications */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>GOAL ALERTS</Text>
              <View style={styles.sectionContent}>
                <ToggleRow
                  icon="flag"
                  label="Milestones"
                  hint="Celebrate when goals hit 25%, 50%, 75%"
                  value={notifications.goalMilestones}
                  onValueChange={(value) => handleToggle('goalMilestones', value)}
                />
                <ToggleRow
                  icon="event"
                  label="Deadline reminders"
                  hint="Remind when goal deadlines are approaching"
                  value={notifications.goalDeadlines}
                  onValueChange={(value) => handleToggle('goalDeadlines', value)}
                />
              </View>
            </View>

            <Text style={styles.disclaimer}>
              These settings control in-app notification badges and alerts. Push notifications are not currently supported.
            </Text>
          </ScrollView>
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
    maxHeight: '80%',
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
  sectionTitle: {
    ...typography.label,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  sectionContent: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  toggleIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.sm,
    backgroundColor: `${colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  toggleInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  toggleLabel: {
    ...typography.body,
    color: colors.text,
  },
  toggleHint: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  disclaimer: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
  },
});
