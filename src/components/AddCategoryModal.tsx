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
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../theme';
import { useData } from '../contexts';
import { CategoryType } from '../types';

interface Props {
  visible: boolean;
  onClose: () => void;
  categoryType: CategoryType;
}

const CATEGORY_ICONS = [
  { name: 'local-grocery-store', label: 'Groceries' },
  { name: 'restaurant', label: 'Dining' },
  { name: 'local-gas-station', label: 'Gas' },
  { name: 'directions-car', label: 'Transport' },
  { name: 'home', label: 'Home' },
  { name: 'flash-on', label: 'Utilities' },
  { name: 'movie', label: 'Entertainment' },
  { name: 'shopping-bag', label: 'Shopping' },
  { name: 'favorite', label: 'Health' },
  { name: 'work', label: 'Work' },
  { name: 'school', label: 'Education' },
  { name: 'card-giftcard', label: 'Gift' },
  { name: 'trending-up', label: 'Investment' },
  { name: 'attach-money', label: 'Money' },
  { name: 'savings', label: 'Savings' },
  { name: 'more-horiz', label: 'Other' },
];

const CATEGORY_COLORS = [
  '#4CAF50', // Green
  '#2196F3', // Blue
  '#9C27B0', // Purple
  '#FF9800', // Orange
  '#E91E63', // Pink
  '#00BCD4', // Cyan
  '#FF5722', // Deep Orange
  '#607D8B', // Blue Grey
  '#795548', // Brown
  '#F44336', // Red
  '#3F51B5', // Indigo
  '#009688', // Teal
];

export function AddCategoryModal({ visible, onClose, categoryType }: Props) {
  const { addCategory } = useData();

  const [name, setName] = useState('');
  const [icon, setIcon] = useState('local-grocery-store');
  const [color, setColor] = useState('#4CAF50');
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const resetForm = () => {
    setName('');
    setIcon('local-grocery-store');
    setColor('#4CAF50');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a category name');
      return;
    }

    setIsLoading(true);
    try {
      await addCategory({
        name: name.trim(),
        type: categoryType,
        icon,
        color,
      });
      handleClose();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create category');
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
            <Text style={styles.title}>
              New {categoryType === CategoryType.EXPENSE ? 'Expense' : 'Income'} Category
            </Text>
            <View style={styles.closeBtn} />
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Icon & Color Preview */}
            <View style={styles.previewRow}>
              <Pressable
                style={[styles.iconPreview, { backgroundColor: color + '20' }]}
                onPress={() => setShowIconPicker(true)}
              >
                <MaterialIcons name={icon as any} size={32} color={color} />
              </Pressable>
              <View style={styles.colorPicker}>
                {CATEGORY_COLORS.map((c) => (
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

            {/* Category Name */}
            <View style={styles.field}>
              <Text style={styles.label}>Category Name *</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g., Coffee, Freelance"
                  placeholderTextColor={colors.textMuted}
                  autoFocus
                />
              </View>
            </View>
          </ScrollView>

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
                  <MaterialIcons name="add" size={20} color={colors.text} />
                  <Text style={styles.submitBtnText}>Create Category</Text>
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
            <ScrollView>
              <View style={styles.iconGrid}>
                {CATEGORY_ICONS.map((item) => (
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
                    <Text
                      style={[
                        styles.iconLabel,
                        icon === item.name && { color: color },
                      ]}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
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
  previewRow: {
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    height: 56,
  },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.text,
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
    maxHeight: '60%',
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
