import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../theme';
import { useAuth } from '../contexts';
import { CategoriesModal, NotificationSettingsModal, ExportDataModal } from '../components';
import { Currency } from '../types';

type SettingItemProps = {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  value?: string;
  danger?: boolean;
  onPress?: () => void;
};

function SettingItem({ icon, label, value, danger, onPress }: SettingItemProps) {
  return (
    <Pressable style={styles.settingItem} onPress={onPress}>
      <View style={[styles.settingIcon, danger && styles.settingIconDanger]}>
        <MaterialIcons
          name={icon}
          size={20}
          color={danger ? colors.expense : colors.primary}
        />
      </View>
      <View style={styles.settingContent}>
        <Text style={[styles.settingLabel, danger && styles.settingLabelDanger]}>
          {label}
        </Text>
        {value && <Text style={styles.settingValue}>{value}</Text>}
      </View>
      <MaterialIcons name="chevron-right" size={24} color={colors.textMuted} />
    </Pressable>
  );
}

const CURRENCY_OPTIONS: { value: Currency; label: string; symbol: string }[] = [
  { value: Currency.USD, label: 'US Dollar', symbol: '$' },
  { value: Currency.EUR, label: 'Euro', symbol: '€' },
  { value: Currency.GBP, label: 'British Pound', symbol: '£' },
  { value: Currency.CAD, label: 'Canadian Dollar', symbol: 'C$' },
];

const DATE_FORMAT_OPTIONS: { value: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD'; label: string }[] = [
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
];

export function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { user, signOut, updatePreferences } = useAuth();

  // Modal states
  const [showCategories, setShowCategories] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [showDateFormatPicker, setShowDateFormatPicker] = useState(false);

  // Format member since date
  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      })
    : '';

  // Get current preference values with display formatting
  const currentCurrency = CURRENCY_OPTIONS.find((c) => c.value === user?.preferences?.currency) || CURRENCY_OPTIONS[0];
  const currentDateFormat = user?.preferences?.dateFormat || 'MM/DD/YYYY';

  const handleCurrencyChange = async (currency: Currency) => {
    try {
      await updatePreferences({ currency });
      setShowCurrencyPicker(false);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update currency');
    }
  };

  const handleDateFormatChange = async (dateFormat: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD') => {
    try {
      await updatePreferences({ dateFormat });
      setShowDateFormatPicker(false);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update date format');
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to sign out');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + spacing.md },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Text style={styles.title}>Settings</Text>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <MaterialIcons name="person" size={32} color={colors.primary} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.displayName || 'User'}</Text>
            <Text style={styles.profileEmail}>{user?.email}</Text>
            {memberSince && (
              <Text style={styles.memberSince}>Member since {memberSince}</Text>
            )}
          </View>
        </View>

        {/* General Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>GENERAL</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon="attach-money"
              label="Currency"
              value={`${currentCurrency.value} (${currentCurrency.symbol})`}
              onPress={() => setShowCurrencyPicker(true)}
            />
            <SettingItem
              icon="event"
              label="Date Format"
              value={currentDateFormat}
              onPress={() => setShowDateFormatPicker(true)}
            />
          </View>
        </View>

        {/* Data Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DATA</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon="category"
              label="Categories"
              onPress={() => setShowCategories(true)}
            />
            <SettingItem
              icon="file-download"
              label="Export Data"
              onPress={() => setShowExport(true)}
            />
          </View>
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>NOTIFICATIONS</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon="notifications"
              label="Notification Settings"
              onPress={() => setShowNotifications(true)}
            />
          </View>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ABOUT</Text>
          <View style={styles.sectionContent}>
            <SettingItem icon="info" label="Version" value="1.0.0" />
            <SettingItem icon="help" label="Help & Support" />
          </View>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <View style={styles.sectionContent}>
            <SettingItem icon="logout" label="Sign Out" danger onPress={handleSignOut} />
          </View>
        </View>

        <Text style={styles.footer}>Personal Budget v1.0.0</Text>
      </ScrollView>

      {/* Categories Modal */}
      <CategoriesModal
        visible={showCategories}
        onClose={() => setShowCategories(false)}
      />

      {/* Notification Settings Modal */}
      <NotificationSettingsModal
        visible={showNotifications}
        onClose={() => setShowNotifications(false)}
      />

      {/* Export Data Modal */}
      <ExportDataModal
        visible={showExport}
        onClose={() => setShowExport(false)}
      />

      {/* Currency Picker Modal */}
      <Modal
        visible={showCurrencyPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCurrencyPicker(false)}
      >
        <Pressable style={styles.pickerOverlay} onPress={() => setShowCurrencyPicker(false)}>
          <View style={styles.pickerContainer}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Select Currency</Text>
              <Pressable onPress={() => setShowCurrencyPicker(false)}>
                <MaterialIcons name="close" size={24} color={colors.text} />
              </Pressable>
            </View>
            {CURRENCY_OPTIONS.map((option) => (
              <Pressable
                key={option.value}
                style={styles.pickerOption}
                onPress={() => handleCurrencyChange(option.value)}
              >
                <Text style={styles.pickerOptionText}>
                  {option.label} ({option.symbol})
                </Text>
                {currentCurrency.value === option.value && (
                  <MaterialIcons name="check" size={24} color={colors.primary} />
                )}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>

      {/* Date Format Picker Modal */}
      <Modal
        visible={showDateFormatPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDateFormatPicker(false)}
      >
        <Pressable style={styles.pickerOverlay} onPress={() => setShowDateFormatPicker(false)}>
          <View style={styles.pickerContainer}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Select Date Format</Text>
              <Pressable onPress={() => setShowDateFormatPicker(false)}>
                <MaterialIcons name="close" size={24} color={colors.text} />
              </Pressable>
            </View>
            {DATE_FORMAT_OPTIONS.map((option) => (
              <Pressable
                key={option.value}
                style={styles.pickerOption}
                onPress={() => handleDateFormatChange(option.value)}
              >
                <Text style={styles.pickerOptionText}>{option.label}</Text>
                {currentDateFormat === option.value && (
                  <MaterialIcons name="check" size={24} color={colors.primary} />
                )}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
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
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxl,
  },
  title: {
    ...typography.h1,
    marginBottom: spacing.lg,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    ...typography.h3,
    marginBottom: 2,
  },
  profileEmail: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
  memberSince: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  section: {
    marginBottom: spacing.lg,
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
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.sm,
    backgroundColor: `${colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  settingIconDanger: {
    backgroundColor: `${colors.expense}15`,
  },
  settingContent: {
    flex: 1,
  },
  settingLabel: {
    ...typography.body,
  },
  settingLabelDanger: {
    color: colors.expense,
  },
  settingValue: {
    ...typography.bodySmall,
    color: colors.textMuted,
    marginTop: 2,
  },
  footer: {
    ...typography.bodySmall,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  pickerContainer: {
    backgroundColor: colors.background,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingBottom: spacing.xl,
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pickerTitle: {
    ...typography.h3,
  },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  pickerOptionText: {
    ...typography.body,
    color: colors.text,
  },
});
