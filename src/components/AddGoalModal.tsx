import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../theme';
import { CreateSavingsGoalInput } from '../types';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: CreateSavingsGoalInput) => Promise<void>;
}

const GOAL_ICONS = [
  { name: 'flag', label: 'Flag' },
  { name: 'savings', label: 'Savings' },
  { name: 'flight', label: 'Travel' },
  { name: 'home', label: 'Home' },
  { name: 'directions-car', label: 'Car' },
  { name: 'school', label: 'Education' },
  { name: 'laptop', label: 'Tech' },
  { name: 'celebration', label: 'Event' },
  { name: 'favorite', label: 'Health' },
  { name: 'shopping-bag', label: 'Shopping' },
  { name: 'account-balance', label: 'Emergency' },
  { name: 'star', label: 'Other' },
];

const GOAL_COLORS = [
  '#4CAF50', // Green
  '#2196F3', // Blue
  '#9C27B0', // Purple
  '#FF9800', // Orange
  '#E91E63', // Pink
  '#00BCD4', // Cyan
  '#FF5722', // Deep Orange
  '#607D8B', // Blue Grey
];

export function AddGoalModal({ visible, onClose, onSubmit }: Props) {
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [initialAmount, setInitialAmount] = useState('');
  const [deadline, setDeadline] = useState<Date | undefined>(undefined);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [icon, setIcon] = useState('flag');
  const [color, setColor] = useState('#4CAF50');
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const resetForm = () => {
    setName('');
    setTargetAmount('');
    setInitialAmount('');
    setDeadline(undefined);
    setIcon('flag');
    setColor('#4CAF50');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDeadline(selectedDate);
    }
  };

  const clearDeadline = () => {
    setDeadline(undefined);
  };

  // Minimum date is tomorrow
  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a goal name');
      return;
    }

    const target = parseFloat(targetAmount);
    if (isNaN(target) || target <= 0) {
      Alert.alert('Error', 'Please enter a valid target amount');
      return;
    }

    const initial = initialAmount ? parseFloat(initialAmount) : 0;
    if (isNaN(initial) || initial < 0) {
      Alert.alert('Error', 'Please enter a valid initial amount');
      return;
    }

    setIsLoading(true);
    try {
      await onSubmit({
        name: name.trim(),
        targetAmount: target,
        initialAmount: initial,
        deadline: deadline,
        icon,
        color,
      });
      handleClose();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create goal');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Pressable onPress={handleClose} style={styles.closeBtn}>
              <MaterialIcons name="close" size={24} color={colors.text} />
            </Pressable>
            <Text style={styles.title}>New Savings Goal</Text>
            <View style={styles.closeBtn} />
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Icon & Color Selector */}
            <View style={styles.iconColorRow}>
              <Pressable
                style={[styles.iconPreview, { backgroundColor: color + '20' }]}
                onPress={() => setShowIconPicker(true)}
              >
                <MaterialIcons name={icon as any} size={32} color={color} />
              </Pressable>
              <View style={styles.colorPicker}>
                {GOAL_COLORS.map((c) => (
                  <Pressable
                    key={c}
                    style={[
                      styles.colorOption,
                      { backgroundColor: c },
                      color === c && styles.colorOptionSelected,
                    ]}
                    onPress={() => setColor(c)}
                  >
                    {color === c && (
                      <MaterialIcons name="check" size={14} color="#fff" />
                    )}
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Goal Name */}
            <View style={styles.field}>
              <Text style={styles.label}>Goal Name *</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g., Emergency Fund, Vacation"
                  placeholderTextColor={colors.textMuted}
                  autoFocus
                />
              </View>
            </View>

            {/* Target Amount */}
            <View style={styles.field}>
              <Text style={styles.label}>Target Amount *</Text>
              <View style={styles.inputContainer}>
                <Text style={styles.currencySymbol}>$</Text>
                <TextInput
                  style={styles.input}
                  value={targetAmount}
                  onChangeText={setTargetAmount}
                  placeholder="0.00"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            {/* Initial Amount */}
            <View style={styles.field}>
              <Text style={styles.label}>Starting Amount (Optional)</Text>
              <Text style={styles.hint}>Already have some saved toward this goal?</Text>
              <View style={styles.inputContainer}>
                <Text style={styles.currencySymbol}>$</Text>
                <TextInput
                  style={styles.input}
                  value={initialAmount}
                  onChangeText={setInitialAmount}
                  placeholder="0.00"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            {/* Deadline */}
            <View style={styles.field}>
              <Text style={styles.label}>Target Date (Optional)</Text>
              <Text style={styles.hint}>When do you want to reach this goal?</Text>
              <Pressable
                style={styles.inputContainer}
                onPress={() => setShowDatePicker(true)}
              >
                <MaterialIcons name="event" size={20} color={colors.textMuted} />
                <Text style={deadline ? styles.inputText : styles.inputPlaceholder}>
                  {deadline ? formatDate(deadline) : 'Select a date'}
                </Text>
                {deadline && (
                  <Pressable onPress={clearDeadline} hitSlop={8}>
                    <MaterialIcons name="close" size={20} color={colors.textMuted} />
                  </Pressable>
                )}
              </Pressable>
            </View>
          </ScrollView>

          {/* Date Picker */}
          {showDatePicker && (
            <DateTimePicker
              value={deadline || minDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              minimumDate={minDate}
              onChange={handleDateChange}
              themeVariant="dark"
            />
          )}

          {/* Submit Button */}
          <View style={styles.footer}>
            <Pressable
              style={[styles.submitBtn, isLoading && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.text} />
              ) : (
                <>
                  <MaterialIcons name="flag" size={20} color={colors.text} />
                  <Text style={styles.submitBtnText}>Create Goal</Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </View>

      {/* Icon Picker Modal */}
      <Modal
        visible={showIconPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowIconPicker(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setShowIconPicker(false)}>
          <Pressable style={styles.iconPickerContainer} onPress={(e) => e.stopPropagation()}>
            <View style={styles.iconPickerHeader}>
              <Text style={styles.iconPickerTitle}>Choose Icon</Text>
              <Pressable onPress={() => setShowIconPicker(false)}>
                <MaterialIcons name="close" size={24} color={colors.text} />
              </Pressable>
            </View>
            <View style={styles.iconGrid}>
              {GOAL_ICONS.map((item) => (
                <Pressable
                  key={item.name}
                  style={[
                    styles.iconOption,
                    icon === item.name && styles.iconOptionSelected,
                  ]}
                  onPress={() => {
                    setIcon(item.name);
                    setShowIconPicker(false);
                  }}
                >
                  <MaterialIcons
                    name={item.name as any}
                    size={28}
                    color={icon === item.name ? color : colors.textMuted}
                  />
                  <Text style={[
                    styles.iconLabel,
                    icon === item.name && { color: color }
                  ]}>
                    {item.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
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
    maxHeight: '90%',
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
  iconColorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  iconPreview: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorPicker: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  colorOption: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorOptionSelected: {
    borderWidth: 2,
    borderColor: colors.text,
  },
  field: {
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.bodySmall,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  hint: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    height: 56,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.text,
  },
  currencySymbol: {
    ...typography.body,
    color: colors.textMuted,
  },
  inputText: {
    flex: 1,
    ...typography.body,
    color: colors.text,
  },
  inputPlaceholder: {
    flex: 1,
    ...typography.body,
    color: colors.textMuted,
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    height: 56,
    gap: spacing.sm,
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitBtnText: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text,
  },
  iconPickerContainer: {
    backgroundColor: colors.background,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '50%',
  },
  iconPickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  iconPickerTitle: {
    ...typography.h3,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: spacing.md,
  },
  iconOption: {
    width: '25%',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  iconOptionSelected: {
    backgroundColor: colors.surface,
  },
  iconLabel: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
});
