import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Tip,
  ToastMessage,
  ToastTrigger,
  TipCategory,
  getNextTip,
  getToastForTrigger,
  INLINE_TIPS,
} from '../services/tips';
import { useAuth } from './AuthContext';

// Storage keys
const DISMISSED_TIPS_KEY = '@dismissed_tips';
const SHOWN_TOASTS_KEY = '@shown_toasts';
const LAST_SHOWN_TIPS_KEY = '@last_shown_tips';
const USER_MILESTONES_KEY = '@user_milestones';
const TIPS_ENABLED_KEY = '@tips_enabled';
const ONBOARDING_COMPLETED_KEY = '@onboarding_completed';

interface UserMilestones {
  firstTransaction: boolean;
  firstBudget: boolean;
  firstGoal: boolean;
  firstContribution: boolean;
  transactionCount: number;
  lastTransactionDate: string | null;
  trackingStreak: number;
}

const DEFAULT_MILESTONES: UserMilestones = {
  firstTransaction: false,
  firstBudget: false,
  firstGoal: false,
  firstContribution: false,
  transactionCount: 0,
  lastTransactionDate: null,
  trackingStreak: 0,
};

interface ToastState {
  visible: boolean;
  title: string;
  message: string;
  icon?: string;
}

interface TipsContextType {
  // Inline tips
  tipsEnabled: boolean;
  setTipsEnabled: (enabled: boolean) => void;
  getCurrentTip: (category: TipCategory) => Tip | null;
  dismissTip: (tipId: string) => void;
  nextTip: (category: TipCategory) => void;
  resetTips: () => void;

  // Toast messages
  toast: ToastState;
  showToast: (trigger: ToastTrigger) => void;
  showCustomToast: (title: string, message: string, icon?: string) => void;
  hideToast: () => void;

  // Milestone tracking
  milestones: UserMilestones;
  recordTransaction: () => void;
  recordBudgetCreated: () => void;
  recordGoalCreated: () => void;
  recordContribution: (goalPercentComplete: number) => void;
  checkBudgetStatus: (isUnderBudget: boolean) => void;

  // Onboarding
  showOnboarding: boolean;
  completeOnboarding: () => void;
  resetOnboarding: () => void;

  // State
  isLoaded: boolean;
}

const TipsContext = createContext<TipsContextType | undefined>(undefined);

export function TipsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  const [dismissedTips, setDismissedTips] = useState<string[]>([]);
  const [shownToasts, setShownToasts] = useState<string[]>([]);
  const [lastShownTips, setLastShownTips] = useState<Record<string, string>>({});
  const [milestones, setMilestones] = useState<UserMilestones>(DEFAULT_MILESTONES);
  const [hiddenCategories, setHiddenCategories] = useState<Set<string>>(new Set());
  const [tipsEnabled, setTipsEnabledState] = useState(true);
  const [onboardingCompleted, setOnboardingCompleted] = useState(true); // Default to true to prevent flash
  const [isLoaded, setIsLoaded] = useState(false);

  const [toast, setToast] = useState<ToastState>({
    visible: false,
    title: '',
    message: '',
    icon: undefined,
  });

  // Queue for toasts to prevent overlapping
  const toastQueue = useRef<ToastMessage[]>([]);
  const isShowingToast = useRef(false);

  // Load persisted state
  useEffect(() => {
    const loadState = async () => {
      try {
        const [dismissed, shown, lastTips, savedMilestones, savedTipsEnabled, savedOnboarding] = await Promise.all([
          AsyncStorage.getItem(DISMISSED_TIPS_KEY),
          AsyncStorage.getItem(SHOWN_TOASTS_KEY),
          AsyncStorage.getItem(LAST_SHOWN_TIPS_KEY),
          AsyncStorage.getItem(USER_MILESTONES_KEY),
          AsyncStorage.getItem(TIPS_ENABLED_KEY),
          AsyncStorage.getItem(ONBOARDING_COMPLETED_KEY),
        ]);

        if (dismissed) setDismissedTips(JSON.parse(dismissed));
        if (shown) setShownToasts(JSON.parse(shown));
        if (lastTips) setLastShownTips(JSON.parse(lastTips));
        if (savedMilestones) setMilestones(JSON.parse(savedMilestones));
        if (savedTipsEnabled !== null) setTipsEnabledState(JSON.parse(savedTipsEnabled));
        // If onboarding state is not saved, it's a new user - show onboarding
        setOnboardingCompleted(savedOnboarding === 'true');

        setIsLoaded(true);
      } catch (error) {
        console.error('Error loading tips state:', error);
        setIsLoaded(true);
      }
    };

    loadState();
  }, []);

  // Save dismissed tips
  useEffect(() => {
    if (isLoaded) {
      AsyncStorage.setItem(DISMISSED_TIPS_KEY, JSON.stringify(dismissedTips)).catch(console.error);
    }
  }, [dismissedTips, isLoaded]);

  // Save shown toasts
  useEffect(() => {
    if (isLoaded) {
      AsyncStorage.setItem(SHOWN_TOASTS_KEY, JSON.stringify(shownToasts)).catch(console.error);
    }
  }, [shownToasts, isLoaded]);

  // Save last shown tips
  useEffect(() => {
    if (isLoaded) {
      AsyncStorage.setItem(LAST_SHOWN_TIPS_KEY, JSON.stringify(lastShownTips)).catch(console.error);
    }
  }, [lastShownTips, isLoaded]);

  // Save milestones
  useEffect(() => {
    if (isLoaded) {
      AsyncStorage.setItem(USER_MILESTONES_KEY, JSON.stringify(milestones)).catch(console.error);
    }
  }, [milestones, isLoaded]);

  // Set tips enabled and persist
  const setTipsEnabled = useCallback((enabled: boolean) => {
    setTipsEnabledState(enabled);
    AsyncStorage.setItem(TIPS_ENABLED_KEY, JSON.stringify(enabled)).catch(console.error);
  }, []);

  // Get current tip for a category
  const getCurrentTip = useCallback(
    (category: TipCategory): Tip | null => {
      if (!isLoaded) return null;

      // If tips are disabled globally, return null
      if (!tipsEnabled) return null;

      // If category is hidden for this session, return null
      if (hiddenCategories.has(category)) return null;

      const lastShownId = lastShownTips[category] || null;
      return getNextTip(category, lastShownId, dismissedTips);
    },
    [isLoaded, tipsEnabled, lastShownTips, dismissedTips, hiddenCategories]
  );

  // Dismiss a tip - hides tips for this category until next session
  const dismissTip = useCallback((tipId: string) => {
    // Find the tip to get its category
    const tip = INLINE_TIPS.find(t => t.id === tipId);
    if (tip) {
      // Hide this category for the session
      setHiddenCategories(prev => new Set([...prev, tip.category]));
      // Also mark the tip as dismissed so it won't show again
      setDismissedTips((prev) => [...prev, tipId]);
    }
  }, []);

  // Move to next tip in a category
  const nextTip = useCallback(
    (category: TipCategory) => {
      const currentTip = getCurrentTip(category);
      if (currentTip) {
        setLastShownTips((prev) => ({
          ...prev,
          [category]: currentTip.id,
        }));
      }
    },
    [getCurrentTip]
  );

  // Reset all tips (for testing or user preference)
  const resetTips = useCallback(async () => {
    setDismissedTips([]);
    setShownToasts([]);
    setLastShownTips({});
    await Promise.all([
      AsyncStorage.removeItem(DISMISSED_TIPS_KEY),
      AsyncStorage.removeItem(SHOWN_TOASTS_KEY),
      AsyncStorage.removeItem(LAST_SHOWN_TIPS_KEY),
    ]);
  }, []);

  // Process toast queue
  const processToastQueue = useCallback(() => {
    if (isShowingToast.current || toastQueue.current.length === 0) return;

    const nextToast = toastQueue.current.shift();
    if (nextToast) {
      isShowingToast.current = true;
      setToast({
        visible: true,
        title: nextToast.title,
        message: nextToast.message,
        icon: nextToast.icon,
      });
    }
  }, []);

  // Show toast for a trigger (only if not shown before for one-time triggers)
  const showToast = useCallback(
    (trigger: ToastTrigger) => {
      // Check if this is a one-time toast that's already been shown
      const oneTimeTriggers: ToastTrigger[] = [
        'first_transaction',
        'first_budget',
        'first_goal',
        'first_contribution',
        'goal_25_percent',
        'goal_50_percent',
        'goal_75_percent',
        'goal_completed',
        'streak_7_days',
        'streak_30_days',
      ];

      if (oneTimeTriggers.includes(trigger) && shownToasts.includes(trigger)) {
        return;
      }

      const toastMessage = getToastForTrigger(trigger);
      if (toastMessage) {
        // Add to shown toasts
        if (oneTimeTriggers.includes(trigger)) {
          setShownToasts((prev) => [...prev, trigger]);
        }

        // Add to queue and process
        toastQueue.current.push(toastMessage);
        processToastQueue();
      }
    },
    [shownToasts, processToastQueue]
  );

  // Show custom toast (for non-trigger-based messages)
  const showCustomToast = useCallback(
    (title: string, message: string, icon?: string) => {
      const customToast: ToastMessage = {
        id: `custom_${Date.now()}`,
        trigger: 'first_transaction', // Not used for custom
        title,
        message,
        icon,
      };
      toastQueue.current.push(customToast);
      processToastQueue();
    },
    [processToastQueue]
  );

  // Hide current toast
  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, visible: false }));
    isShowingToast.current = false;

    // Process next toast in queue after a short delay
    setTimeout(() => {
      processToastQueue();
    }, 300);
  }, [processToastQueue]);

  // Record a transaction and check for milestones
  const recordTransaction = useCallback(() => {
    const today = new Date().toDateString();

    setMilestones((prev) => {
      const newCount = prev.transactionCount + 1;
      const isNewDay = prev.lastTransactionDate !== today;
      const isConsecutiveDay =
        prev.lastTransactionDate &&
        new Date(prev.lastTransactionDate).getTime() >=
          new Date().getTime() - 2 * 24 * 60 * 60 * 1000;

      let newStreak = prev.trackingStreak;
      if (isNewDay) {
        newStreak = isConsecutiveDay ? prev.trackingStreak + 1 : 1;
      }

      // Check for first transaction
      if (!prev.firstTransaction) {
        setTimeout(() => showToast('first_transaction'), 500);
      }

      // Check for streaks
      if (newStreak === 7 && prev.trackingStreak < 7) {
        setTimeout(() => showToast('streak_7_days'), 500);
      } else if (newStreak === 30 && prev.trackingStreak < 30) {
        setTimeout(() => showToast('streak_30_days'), 500);
      }

      return {
        ...prev,
        firstTransaction: true,
        transactionCount: newCount,
        lastTransactionDate: today,
        trackingStreak: newStreak,
      };
    });
  }, [showToast]);

  // Record budget created
  const recordBudgetCreated = useCallback(() => {
    setMilestones((prev) => {
      if (!prev.firstBudget) {
        setTimeout(() => showToast('first_budget'), 500);
        return { ...prev, firstBudget: true };
      }
      setTimeout(() => showToast('budget_created'), 500);
      return prev;
    });
  }, [showToast]);

  // Record goal created
  const recordGoalCreated = useCallback(() => {
    setMilestones((prev) => {
      if (!prev.firstGoal) {
        setTimeout(() => showToast('first_goal'), 500);
        return { ...prev, firstGoal: true };
      }
      setTimeout(() => showToast('goal_created'), 500);
      return prev;
    });
  }, [showToast]);

  // Record contribution and check for milestones
  const recordContribution = useCallback(
    (goalPercentComplete: number) => {
      setMilestones((prev) => {
        if (!prev.firstContribution) {
          setTimeout(() => showToast('first_contribution'), 500);
          return { ...prev, firstContribution: true };
        }
        return prev;
      });

      // Check goal percentage milestones
      // These are tracked per-goal in the caller, we just trigger the toast
      if (goalPercentComplete >= 100) {
        setTimeout(() => showToast('goal_completed'), 500);
      } else if (goalPercentComplete >= 75) {
        showToast('goal_75_percent');
      } else if (goalPercentComplete >= 50) {
        showToast('goal_50_percent');
      } else if (goalPercentComplete >= 25) {
        showToast('goal_25_percent');
      }
    },
    [showToast]
  );

  // Check if user is under budget
  const checkBudgetStatus = useCallback(
    (isUnderBudget: boolean) => {
      if (isUnderBudget) {
        showToast('under_budget');
      }
    },
    [showToast]
  );

  // Onboarding functions
  const completeOnboarding = useCallback(async () => {
    setOnboardingCompleted(true);
    await AsyncStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
  }, []);

  const resetOnboarding = useCallback(async () => {
    setOnboardingCompleted(false);
    await AsyncStorage.removeItem(ONBOARDING_COMPLETED_KEY);
  }, []);

  // Compute whether to show onboarding (only when loaded and not completed)
  const showOnboarding = isLoaded && !onboardingCompleted;

  const value: TipsContextType = {
    tipsEnabled,
    setTipsEnabled,
    getCurrentTip,
    dismissTip,
    nextTip,
    resetTips,
    toast,
    showToast,
    showCustomToast,
    hideToast,
    milestones,
    recordTransaction,
    recordBudgetCreated,
    recordGoalCreated,
    recordContribution,
    checkBudgetStatus,
    showOnboarding,
    completeOnboarding,
    resetOnboarding,
    isLoaded,
  };

  return <TipsContext.Provider value={value}>{children}</TipsContext.Provider>;
}

export function useTips() {
  const context = useContext(TipsContext);
  if (context === undefined) {
    throw new Error('useTips must be used within a TipsProvider');
  }
  return context;
}
