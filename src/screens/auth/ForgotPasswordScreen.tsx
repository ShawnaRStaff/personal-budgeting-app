import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../../theme';
import { useAuth } from '../../contexts';

interface Props {
  onNavigateToSignIn: () => void;
}

export function ForgotPasswordScreen({ onNavigateToSignIn }: Props) {
  const insets = useSafeAreaInsets();
  const { resetPassword } = useAuth();

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    setIsLoading(true);
    try {
      await resetPassword(email);
      setEmailSent(true);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send reset email');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + spacing.lg },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Back Button */}
        <Pressable style={styles.backBtn} onPress={onNavigateToSignIn}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </Pressable>

        {emailSent ? (
          /* Success State */
          <View style={styles.successContainer}>
            <View style={styles.successIcon}>
              <MaterialIcons name="mark-email-read" size={64} color={colors.primary} />
            </View>
            <Text style={styles.successTitle}>Check your email</Text>
            <Text style={styles.successText}>
              We've sent password reset instructions to {email}
            </Text>
            <Pressable style={styles.primaryBtn} onPress={onNavigateToSignIn}>
              <Text style={styles.primaryBtnText}>Back to Sign In</Text>
            </Pressable>
          </View>
        ) : (
          /* Form */
          <View style={styles.form}>
            <View style={styles.iconContainer}>
              <MaterialIcons name="lock-reset" size={48} color={colors.primary} />
            </View>
            <Text style={styles.formTitle}>Reset Password</Text>
            <Text style={styles.formSubtitle}>
              Enter your email address and we'll send you instructions to reset your password
            </Text>

            {/* Email */}
            <View style={styles.inputContainer}>
              <MaterialIcons name="email" size={20} color={colors.textMuted} />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor={colors.textMuted}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
              />
            </View>

            {/* Reset Button */}
            <Pressable
              style={[styles.primaryBtn, isLoading && styles.primaryBtnDisabled]}
              onPress={handleResetPassword}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.text} />
              ) : (
                <Text style={styles.primaryBtnText}>Send Reset Link</Text>
              )}
            </Pressable>

            {/* Back to Sign In */}
            <Pressable style={styles.backToSignIn} onPress={onNavigateToSignIn}>
              <MaterialIcons name="arrow-back" size={16} color={colors.primary} />
              <Text style={styles.backToSignInText}>Back to Sign In</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  form: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  formTitle: {
    ...typography.h1,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  formSubtitle: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    height: 56,
    gap: spacing.sm,
    width: '100%',
  },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.text,
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginTop: spacing.md,
  },
  primaryBtnDisabled: {
    opacity: 0.7,
  },
  primaryBtnText: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text,
  },
  backToSignIn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xl,
    gap: spacing.xs,
  },
  backToSignInText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '500',
  },
  successContainer: {
    alignItems: 'center',
    paddingTop: spacing.xxl,
  },
  successIcon: {
    width: 120,
    height: 120,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  successTitle: {
    ...typography.h1,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  successText: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.md,
  },
});
