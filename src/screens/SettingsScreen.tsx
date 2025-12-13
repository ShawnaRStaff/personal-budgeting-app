import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, Modal, Linking, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../theme';
import { useAuth, useTips } from '../contexts';
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
  const { user, signOut, updatePreferences } = useAuth();
  const { tipsEnabled, setTipsEnabled, resetOnboarding } = useTips();

  // Modal states
  const [showCategories, setShowCategories] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [showDateFormatPicker, setShowDateFormatPicker] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

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
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
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
            <View style={styles.settingItem}>
              <View style={styles.settingIcon}>
                <MaterialIcons name="lightbulb" size={20} color={colors.primary} />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingLabel}>Financial Tips</Text>
                <Text style={styles.settingDescription}>Show helpful tips on screens</Text>
              </View>
              <Switch
                value={tipsEnabled}
                onValueChange={setTipsEnabled}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.white}
              />
            </View>
            <SettingItem
              icon="play-circle-outline"
              label="Replay Onboarding"
              value="View the app introduction again"
              onPress={() => {
                Alert.alert(
                  'Replay Onboarding',
                  'Would you like to see the app introduction again?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Show',
                      onPress: resetOnboarding,
                    },
                  ]
                );
              }}
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
            <SettingItem
              icon="description"
              label="Terms of Service"
              onPress={() => setShowTerms(true)}
            />
            <SettingItem
              icon="privacy-tip"
              label="Privacy Policy"
              onPress={() => setShowPrivacy(true)}
            />
            <SettingItem
              icon="help"
              label="Help & Support"
              onPress={() => setShowHelp(true)}
            />
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

      {/* Terms of Service Modal */}
      <Modal
        visible={showTerms}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTerms(false)}
      >
        <View style={styles.legalModalOverlay}>
          <View style={styles.legalModalContainer}>
            <View style={styles.legalModalHeader}>
              <Text style={styles.legalModalTitle}>Terms of Service</Text>
              <Pressable onPress={() => setShowTerms(false)}>
                <MaterialIcons name="close" size={24} color={colors.text} />
              </Pressable>
            </View>
            <ScrollView style={styles.legalContent} contentContainerStyle={styles.legalContentContainer} showsVerticalScrollIndicator={false}>
              <Text style={styles.legalDate}>Last Updated: December 2024</Text>

              <Text style={styles.legalHeading}>1. Acceptance of Terms</Text>
              <Text style={styles.legalText}>
                By downloading, installing, or using Personal Budget ("the App"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the App.
              </Text>

              <Text style={styles.legalHeading}>2. Description of Service</Text>
              <Text style={styles.legalText}>
                Personal Budget is a personal finance management application that allows users to track income, expenses, budgets, and savings goals. The App is provided for personal, non-commercial use only.
              </Text>

              <Text style={styles.legalHeading}>3. User Accounts</Text>
              <Text style={styles.legalText}>
                You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account.
              </Text>

              <Text style={styles.legalHeading}>4. User Data</Text>
              <Text style={styles.legalText}>
                You retain ownership of all financial data you enter into the App. We do not sell or share your personal financial information with third parties for marketing purposes.
              </Text>

              <Text style={styles.legalHeading}>5. Acceptable Use</Text>
              <Text style={styles.legalText}>
                You agree not to use the App for any unlawful purpose or in any way that could damage, disable, or impair the service. You agree not to attempt to gain unauthorized access to any part of the App.
              </Text>

              <Text style={styles.legalHeading}>6. Disclaimer of Warranties</Text>
              <Text style={styles.legalText}>
                The App is provided "as is" without warranties of any kind. We do not guarantee that the App will be error-free or uninterrupted. The App is not intended to provide financial advice.
              </Text>

              <Text style={styles.legalHeading}>7. Limitation of Liability</Text>
              <Text style={styles.legalText}>
                To the maximum extent permitted by law, we shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the App.
              </Text>

              <Text style={styles.legalHeading}>8. Changes to Terms</Text>
              <Text style={styles.legalText}>
                We reserve the right to modify these terms at any time. Continued use of the App after changes constitutes acceptance of the new terms.
              </Text>

              <Text style={styles.legalHeading}>9. Contact</Text>
              <Text style={styles.legalText}>
                If you have questions about these Terms, please contact us through the Help & Support section of the App.
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Privacy Policy Modal */}
      <Modal
        visible={showPrivacy}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPrivacy(false)}
      >
        <View style={styles.legalModalOverlay}>
          <View style={styles.legalModalContainer}>
            <View style={styles.legalModalHeader}>
              <Text style={styles.legalModalTitle}>Privacy Policy</Text>
              <Pressable onPress={() => setShowPrivacy(false)}>
                <MaterialIcons name="close" size={24} color={colors.text} />
              </Pressable>
            </View>
            <ScrollView style={styles.legalContent} contentContainerStyle={styles.legalContentContainer} showsVerticalScrollIndicator={false}>
              <Text style={styles.legalDate}>Last Updated: December 2024</Text>

              <Text style={styles.legalHeading}>1. Information We Collect</Text>
              <Text style={styles.legalText}>
                We collect information you provide directly, including:{'\n'}
                • Account information (email, display name){'\n'}
                • Financial data you enter (transactions, budgets, goals){'\n'}
                • App preferences and settings
              </Text>

              <Text style={styles.legalHeading}>2. How We Use Your Information</Text>
              <Text style={styles.legalText}>
                We use your information to:{'\n'}
                • Provide and maintain the App{'\n'}
                • Sync your data across devices{'\n'}
                • Send important notifications about your budgets and goals{'\n'}
                • Improve and develop new features
              </Text>

              <Text style={styles.legalHeading}>3. Data Storage</Text>
              <Text style={styles.legalText}>
                Your data is securely stored using Google Firebase services. We implement industry-standard security measures to protect your information from unauthorized access.
              </Text>

              <Text style={styles.legalHeading}>4. Data Sharing</Text>
              <Text style={styles.legalText}>
                We do not sell, trade, or rent your personal financial information to third parties. We may share data only:{'\n'}
                • With your consent{'\n'}
                • To comply with legal obligations{'\n'}
                • To protect our rights and safety
              </Text>

              <Text style={styles.legalHeading}>5. Data Export & Deletion</Text>
              <Text style={styles.legalText}>
                You can export your data at any time using the Export feature in Settings. To delete your account and all associated data, please contact us through Help & Support.
              </Text>

              <Text style={styles.legalHeading}>6. Third-Party Services</Text>
              <Text style={styles.legalText}>
                The App uses the following third-party services:{'\n'}
                • Google Firebase (authentication, database){'\n'}
                Each service has its own privacy policy governing their use of data.
              </Text>

              <Text style={styles.legalHeading}>7. Children's Privacy</Text>
              <Text style={styles.legalText}>
                The App is not intended for children under 13. We do not knowingly collect personal information from children under 13.
              </Text>

              <Text style={styles.legalHeading}>8. Changes to This Policy</Text>
              <Text style={styles.legalText}>
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy in the App.
              </Text>

              <Text style={styles.legalHeading}>9. Contact Us</Text>
              <Text style={styles.legalText}>
                If you have questions about this Privacy Policy, please contact us through the Help & Support section of the App.
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Help & Support Modal */}
      <Modal
        visible={showHelp}
        transparent
        animationType="slide"
        onRequestClose={() => setShowHelp(false)}
      >
        <View style={styles.legalModalOverlay}>
          <View style={styles.legalModalContainer}>
            <View style={styles.legalModalHeader}>
              <Text style={styles.legalModalTitle}>Help & Support</Text>
              <Pressable onPress={() => setShowHelp(false)}>
                <MaterialIcons name="close" size={24} color={colors.text} />
              </Pressable>
            </View>
            <ScrollView style={styles.legalContent} contentContainerStyle={styles.legalContentContainer} showsVerticalScrollIndicator={false}>
              {/* FAQs */}
              <Text style={styles.helpSectionTitle}>Frequently Asked Questions</Text>

              {[
                {
                  q: 'How do I add a transaction?',
                  a: 'From the Dashboard, tap "Add Expense" or "Add Income" in the quick actions. You can also tap the + button on the Register screen. Fill in the details and tap Save.',
                },
                {
                  q: 'How do I set up a budget?',
                  a: 'Go to the Budgets tab and tap the + button. Select a category, set your monthly limit, and give it a name. You\'ll get notifications when you reach 80% and 100% of your budget.',
                },
                {
                  q: 'How do I create a savings goal?',
                  a: 'Go to the Goals tab and tap the + button. Enter your goal name, target amount, and optionally set a deadline. You can contribute to your goal anytime by tapping on it.',
                },
                {
                  q: 'How do I export my data?',
                  a: 'Go to Settings > Export Data. Choose a date range and tap Export CSV. Your transactions will be exported to a file you can open in any spreadsheet app.',
                },
                {
                  q: 'How do I add multiple accounts?',
                  a: 'On the Dashboard, tap the account selector at the top and choose "Add Account". You can track checking, savings, credit cards, and cash accounts separately.',
                },
                {
                  q: 'Can I edit or delete a transaction?',
                  a: 'Yes! On the Register screen, swipe left on any transaction to reveal Edit and Delete options. You can also tap on a transaction to view details.',
                },
                {
                  q: 'How do I change my currency?',
                  a: 'Go to Settings > Currency and select your preferred currency. This will update how amounts are displayed throughout the app.',
                },
              ].map((faq, index) => (
                <View key={index} style={styles.faqItem}>
                  <Pressable
                    style={styles.faqQuestion}
                    onPress={() => setExpandedFaq(expandedFaq === index ? null : index)}
                  >
                    <Text style={styles.faqQuestionText}>{faq.q}</Text>
                    <MaterialIcons
                      name={expandedFaq === index ? 'expand-less' : 'expand-more'}
                      size={24}
                      color={colors.textMuted}
                    />
                  </Pressable>
                  {expandedFaq === index && (
                    <Text style={styles.faqAnswer}>{faq.a}</Text>
                  )}
                </View>
              ))}

              {/* Contact Section */}
              <Text style={[styles.helpSectionTitle, { marginTop: spacing.xl }]}>Contact Us</Text>

              <Pressable
                style={styles.helpButton}
                onPress={() => {
                  Linking.openURL('mailto:shawnastaff@gmail.com?subject=Personal%20Budget%20Support');
                }}
              >
                <View style={[styles.helpButtonIcon, { backgroundColor: `${colors.primary}20` }]}>
                  <MaterialIcons name="email" size={24} color={colors.primary} />
                </View>
                <View style={styles.helpButtonContent}>
                  <Text style={styles.helpButtonTitle}>Email Support</Text>
                  <Text style={styles.helpButtonSubtitle}>Get help with any issues</Text>
                </View>
                <MaterialIcons name="chevron-right" size={24} color={colors.textMuted} />
              </Pressable>

              <Pressable
                style={styles.helpButton}
                onPress={() => {
                  // Replace with actual app store URL when published
                  Alert.alert(
                    'Rate Us',
                    'Thank you for your support! Rating will be available once the app is published to the store.',
                    [{ text: 'OK' }]
                  );
                }}
              >
                <View style={[styles.helpButtonIcon, { backgroundColor: `${colors.income}20` }]}>
                  <MaterialIcons name="star" size={24} color={colors.income} />
                </View>
                <View style={styles.helpButtonContent}>
                  <Text style={styles.helpButtonTitle}>Rate the App</Text>
                  <Text style={styles.helpButtonSubtitle}>Love the app? Let us know!</Text>
                </View>
                <MaterialIcons name="chevron-right" size={24} color={colors.textMuted} />
              </Pressable>

              <Pressable
                style={styles.helpButton}
                onPress={() => {
                  Linking.openURL('mailto:shawnastaff@gmail.com?subject=Personal%20Budget%20Feedback');
                }}
              >
                <View style={[styles.helpButtonIcon, { backgroundColor: `${colors.warning}20` }]}>
                  <MaterialIcons name="feedback" size={24} color={colors.warning} />
                </View>
                <View style={styles.helpButtonContent}>
                  <Text style={styles.helpButtonTitle}>Send Feedback</Text>
                  <Text style={styles.helpButtonSubtitle}>Suggest features or report bugs</Text>
                </View>
                <MaterialIcons name="chevron-right" size={24} color={colors.textMuted} />
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  settingDescription: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
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
  legalModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  legalModalContainer: {
    backgroundColor: colors.background,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '90%',
  },
  legalModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  legalModalTitle: {
    ...typography.h3,
  },
  legalContent: {
    padding: spacing.lg,
  },
  legalContentContainer: {
    paddingBottom: 150,
  },
  legalDate: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },
  legalHeading: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  legalText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  helpSectionTitle: {
    ...typography.label,
    marginBottom: spacing.md,
  },
  faqItem: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  faqQuestion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  faqQuestionText: {
    ...typography.body,
    flex: 1,
    marginRight: spacing.sm,
  },
  faqAnswer: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    lineHeight: 22,
  },
  helpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  helpButtonIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  helpButtonContent: {
    flex: 1,
  },
  helpButtonTitle: {
    ...typography.body,
    fontWeight: '600',
  },
  helpButtonSubtitle: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
});
