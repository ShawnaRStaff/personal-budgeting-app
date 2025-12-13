import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { MaterialIcons } from '@expo/vector-icons';

import {
  DashboardScreen,
  RegisterScreen,
  BudgetsScreen,
  GoalsScreen,
  SettingsScreen,
  SignInScreen,
  SignUpScreen,
  ForgotPasswordScreen,
} from './src/screens';
import { AuthProvider, useAuth, DataProvider, TipsProvider, useTips } from './src/contexts';
import { Toast, OnboardingModal } from './src/components';
import { colors } from './src/theme';

const Tab = createBottomTabNavigator();

type AuthScreen = 'signIn' | 'signUp' | 'forgotPassword';

function AuthNavigator() {
  const [currentScreen, setCurrentScreen] = useState<AuthScreen>('signIn');

  switch (currentScreen) {
    case 'signUp':
      return (
        <SignUpScreen
          onNavigateToSignIn={() => setCurrentScreen('signIn')}
        />
      );
    case 'forgotPassword':
      return (
        <ForgotPasswordScreen
          onNavigateToSignIn={() => setCurrentScreen('signIn')}
        />
      );
    case 'signIn':
    default:
      return (
        <SignInScreen
          onNavigateToSignUp={() => setCurrentScreen('signUp')}
          onNavigateToForgotPassword={() => setCurrentScreen('forgotPassword')}
        />
      );
  }
}

function GlobalToast() {
  const { toast, hideToast, showOnboarding, completeOnboarding } = useTips();

  return (
    <>
      <Toast
        visible={toast.visible}
        title={toast.title}
        message={toast.message}
        icon={toast.icon}
        onHide={hideToast}
      />
      <OnboardingModal
        visible={showOnboarding}
        onComplete={completeOnboarding}
      />
    </>
  );
}

function MainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="dashboard" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Register"
        component={RegisterScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="receipt-long" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Budgets"
        component={BudgetsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="pie-chart" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Goals"
        component={GoalsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="flag" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="settings" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

function RootNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return isAuthenticated ? (
    <DataProvider>
      <TipsProvider>
        <MainNavigator />
        <GlobalToast />
      </TipsProvider>
    </DataProvider>
  ) : (
    <AuthNavigator />
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <NavigationContainer>
            <StatusBar style="light" />
            <RootNavigator />
          </NavigationContainer>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
