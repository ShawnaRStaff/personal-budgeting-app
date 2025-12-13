import React from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../theme';
import { Tip } from '../services/tips';

interface TipCardProps {
  tip: Tip;
  onDismiss: (tipId: string) => void;
  onNext?: () => void;
}

export function TipCard({ tip, onDismiss, onNext }: TipCardProps) {
  const fadeAnim = React.useRef(new Animated.Value(1)).current;

  const handleDismiss = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onDismiss(tip.id);
    });
  };

  const handleNext = () => {
    if (onNext) {
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onNext();
      });
    }
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <MaterialIcons
            name={(tip.icon as keyof typeof MaterialIcons.glyphMap) || 'lightbulb'}
            size={20}
            color={colors.info}
          />
        </View>
        <Text style={styles.label}>TIP</Text>
        <View style={styles.actions}>
          {onNext && (
            <Pressable
              onPress={handleNext}
              style={styles.actionButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialIcons name="refresh" size={18} color={colors.textMuted} />
            </Pressable>
          )}
          <Pressable
            onPress={handleDismiss}
            style={styles.actionButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialIcons name="close" size={18} color={colors.textMuted} />
          </Pressable>
        </View>
      </View>
      <Text style={styles.title}>{tip.title}</Text>
      <Text style={styles.content}>{tip.content}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.info,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.full,
    backgroundColor: `${colors.info}20`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  label: {
    ...typography.label,
    color: colors.info,
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  actionButton: {
    padding: spacing.xs,
  },
  title: {
    ...typography.h3,
    marginBottom: spacing.xs,
  },
  content: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});
