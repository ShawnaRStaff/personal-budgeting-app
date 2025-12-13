/**
 * Financial literacy tips and educational content
 */

// ============================================
// TIP TYPES
// ============================================

export type TipCategory =
  | 'dashboard'
  | 'budgets'
  | 'goals'
  | 'transactions'
  | 'accounts'
  | 'analytics'
  | 'general';

export type ToastTrigger =
  | 'first_transaction'
  | 'first_budget'
  | 'first_goal'
  | 'first_contribution'
  | 'budget_created'
  | 'goal_created'
  | 'goal_25_percent'
  | 'goal_50_percent'
  | 'goal_75_percent'
  | 'goal_completed'
  | 'under_budget'
  | 'streak_7_days'
  | 'streak_30_days'
  | 'income_logged'
  | 'savings_logged'
  | 'large_expense_logged'
  | 'transaction_streak';

export interface Tip {
  id: string;
  category: TipCategory;
  title: string;
  content: string;
  icon?: string; // MaterialIcons name
}

export interface ToastMessage {
  id: string;
  trigger: ToastTrigger;
  title: string;
  message: string;
  icon?: string;
}

export interface EmptyStateContent {
  screen: 'budgets' | 'goals' | 'transactions' | 'accounts';
  title: string;
  subtitle: string;
  tip: string;
}

// ============================================
// INLINE TIPS (Cards shown on screens)
// ============================================

export const INLINE_TIPS: Tip[] = [
  // Dashboard Tips
  {
    id: 'dash_1',
    category: 'dashboard',
    title: 'The 50/30/20 Rule',
    content: '50% of income for needs, 30% for wants, and 20% for savings. A simple framework for balanced spending.',
    icon: 'pie-chart',
  },
  {
    id: 'dash_2',
    category: 'dashboard',
    title: 'Track Everything',
    content: 'The average person has no idea where 30% of their money goes. Tracking every expense reveals hidden spending patterns.',
    icon: 'search',
  },
  {
    id: 'dash_3',
    category: 'dashboard',
    title: 'Pay Yourself First',
    content: 'Treat savings like a bill. Move money to savings immediately when you get paid, not after expenses.',
    icon: 'savings',
  },
  {
    id: 'dash_4',
    category: 'dashboard',
    title: 'Small Leaks Sink Ships',
    content: 'That daily $5 coffee adds up to $1,825 per year. Small, regular expenses often have the biggest impact.',
    icon: 'local-cafe',
  },
  {
    id: 'dash_5',
    category: 'dashboard',
    title: 'Review Weekly',
    content: 'Spend 10 minutes each week reviewing your transactions. Awareness is the first step to better habits.',
    icon: 'schedule',
  },
  {
    id: 'dash_6',
    category: 'dashboard',
    title: 'Automate Good Habits',
    content: 'Set up automatic transfers to savings. What you don\'t see, you don\'t spend.',
    icon: 'autorenew',
  },
  {
    id: 'dash_7',
    category: 'dashboard',
    title: 'Net Worth Matters',
    content: 'Focus on increasing the gap between what you own and what you owe. That\'s how wealth is built.',
    icon: 'trending-up',
  },
  {
    id: 'dash_8',
    category: 'dashboard',
    title: 'Cash Flow is King',
    content: 'More money flowing in than out is the foundation of financial stability. Track both sides.',
    icon: 'swap-horiz',
  },
  {
    id: 'dash_9',
    category: 'dashboard',
    title: 'The Power of Compound Interest',
    content: 'Money saved early grows exponentially. $100/month at 7% becomes $120,000 in 30 years.',
    icon: 'show-chart',
  },
  {
    id: 'dash_10',
    category: 'dashboard',
    title: 'Lifestyle Inflation',
    content: 'When income rises, expenses often follow. Resist the urge to upgrade everything at once.',
    icon: 'warning',
  },

  // Budget Tips
  {
    id: 'budget_1',
    category: 'budgets',
    title: 'Budgets = Permission',
    content: 'A budget isn\'t a restriction—it\'s permission to spend guilt-free on what you\'ve planned for.',
    icon: 'check-circle',
  },
  {
    id: 'budget_2',
    category: 'budgets',
    title: 'The Envelope Method',
    content: 'Allocate specific amounts to categories. When an envelope is empty, that category is done for the period.',
    icon: 'mail',
  },
  {
    id: 'budget_3',
    category: 'budgets',
    title: 'Budget for Fun',
    content: 'Include entertainment and treats in your budget. Deprivation leads to splurging.',
    icon: 'celebration',
  },
  {
    id: 'budget_4',
    category: 'budgets',
    title: 'Zero-Based Budgeting',
    content: 'Give every dollar a job. Income minus expenses should equal zero—unassigned money gets spent.',
    icon: 'calculate',
  },
  {
    id: 'budget_5',
    category: 'budgets',
    title: 'Review and Adjust',
    content: 'Budgets aren\'t set in stone. Review monthly and adjust based on what you learned.',
    icon: 'tune',
  },
  {
    id: 'budget_6',
    category: 'budgets',
    title: 'Start with Needs',
    content: 'Budget essentials first: housing, utilities, food, transportation. Then allocate what remains.',
    icon: 'home',
  },
  {
    id: 'budget_7',
    category: 'budgets',
    title: 'Expect the Unexpected',
    content: 'Budget for irregular expenses like car repairs, medical costs, and gifts. They happen every year.',
    icon: 'event-note',
  },
  {
    id: 'budget_8',
    category: 'budgets',
    title: 'Track Before You Budget',
    content: 'Spend a month tracking without budgeting first. You\'ll discover where your money actually goes.',
    icon: 'visibility',
  },
  {
    id: 'budget_9',
    category: 'budgets',
    title: 'The 24-Hour Rule',
    content: 'Wait 24 hours before making any unplanned purchase over $50. Many impulse buys fade overnight.',
    icon: 'access-time',
  },
  {
    id: 'budget_10',
    category: 'budgets',
    title: 'Sinking Funds',
    content: 'Set aside money monthly for annual expenses. $100/month is easier than $1,200 at once.',
    icon: 'water-drop',
  },
  {
    id: 'budget_11',
    category: 'budgets',
    title: 'Budget by Priority',
    content: 'Rank your spending categories. When money is tight, cut from the bottom of your list.',
    icon: 'format-list-numbered',
  },
  {
    id: 'budget_12',
    category: 'budgets',
    title: 'The 80/20 Rule',
    content: '80% of overspending typically comes from 20% of categories. Identify and focus on your problem areas.',
    icon: 'donut-large',
  },

  // Goals Tips
  {
    id: 'goals_1',
    category: 'goals',
    title: 'Write It Down',
    content: 'People with written goals are 42% more likely to achieve them. Your goals page is your commitment.',
    icon: 'create',
  },
  {
    id: 'goals_2',
    category: 'goals',
    title: 'Break It Down',
    content: 'A $10,000 goal is $833/month, $192/week, or $27/day. Small chunks feel achievable.',
    icon: 'view-module',
  },
  {
    id: 'goals_3',
    category: 'goals',
    title: 'Celebrate Milestones',
    content: 'Acknowledge 25%, 50%, 75%. Progress celebrations fuel motivation for the journey ahead.',
    icon: 'emoji-events',
  },
  {
    id: 'goals_4',
    category: 'goals',
    title: 'Emergency Fund First',
    content: 'Before other goals, aim for 3-6 months of expenses saved. It\'s the foundation of financial security.',
    icon: 'security',
  },
  {
    id: 'goals_5',
    category: 'goals',
    title: 'Visualize the End',
    content: 'Picture yourself achieving the goal. Emotional connection to outcomes strengthens commitment.',
    icon: 'visibility',
  },
  {
    id: 'goals_6',
    category: 'goals',
    title: 'One Goal at a Time',
    content: 'Focus creates momentum. Complete one goal before spreading yourself thin across many.',
    icon: 'filter-1',
  },
  {
    id: 'goals_7',
    category: 'goals',
    title: 'Make It Automatic',
    content: 'Set up automatic transfers to your goal. Remove the decision-making from saving.',
    icon: 'autorenew',
  },
  {
    id: 'goals_8',
    category: 'goals',
    title: 'Time-Bound Goals',
    content: 'Goals without deadlines are just wishes. Set a target date to create urgency.',
    icon: 'event',
  },
  {
    id: 'goals_9',
    category: 'goals',
    title: 'Increase Contributions',
    content: 'When you get a raise or bonus, increase your goal contribution before lifestyle inflation kicks in.',
    icon: 'trending-up',
  },
  {
    id: 'goals_10',
    category: 'goals',
    title: 'Track Progress Publicly',
    content: 'Share goals with someone you trust. Accountability increases follow-through by 65%.',
    icon: 'people',
  },
  {
    id: 'goals_11',
    category: 'goals',
    title: 'The Marshmallow Effect',
    content: 'Delayed gratification is a skill. Every time you save instead of spend, you strengthen it.',
    icon: 'psychology',
  },
  {
    id: 'goals_12',
    category: 'goals',
    title: 'Separate Accounts',
    content: 'Keep goal money in a separate account. Out of sight, out of mind—and out of spending.',
    icon: 'account-balance',
  },

  // Transactions Tips
  {
    id: 'trans_1',
    category: 'transactions',
    title: 'Log Immediately',
    content: 'Record transactions when they happen. Memory fades, and untracked expenses add up.',
    icon: 'bolt',
  },
  {
    id: 'trans_2',
    category: 'transactions',
    title: 'Use Notes Wisely',
    content: 'Add context to transactions. "Coffee with Sarah - networking" tells a different story than just "coffee."',
    icon: 'note-add',
  },
  {
    id: 'trans_3',
    category: 'transactions',
    title: 'Review Weekly',
    content: 'A weekly transaction review catches mistakes early and keeps you aware of spending patterns.',
    icon: 'event-repeat',
  },
  {
    id: 'trans_4',
    category: 'transactions',
    title: 'Categorize Consistently',
    content: 'Use the same categories for similar expenses. Consistency reveals true spending patterns.',
    icon: 'folder',
  },
  {
    id: 'trans_5',
    category: 'transactions',
    title: 'Separate Wants and Needs',
    content: 'Be honest when categorizing. That restaurant meal is a want, not a need, even if you were hungry.',
    icon: 'balance',
  },
  {
    id: 'trans_6',
    category: 'transactions',
    title: 'Track Cash Too',
    content: 'Cash spending often goes untracked. It\'s still money—log it like any other expense.',
    icon: 'payments',
  },
  {
    id: 'trans_7',
    category: 'transactions',
    title: 'Question Subscriptions',
    content: 'Review recurring charges monthly. Cancel anything you haven\'t used in 30 days.',
    icon: 'subscriptions',
  },
  {
    id: 'trans_8',
    category: 'transactions',
    title: 'The Latte Factor',
    content: 'Small daily purchases add up. $10/day in misc expenses is $3,650/year.',
    icon: 'local-cafe',
  },

  // Analytics Tips
  {
    id: 'analytics_1',
    category: 'analytics',
    title: 'Trends Over Time',
    content: 'One month\'s data is a snapshot. Three months shows patterns. Look for trends, not just totals.',
    icon: 'timeline',
  },
  {
    id: 'analytics_2',
    category: 'analytics',
    title: 'Compare Periods',
    content: 'Compare this month to last month, or this quarter to last. Growth and change reveal progress.',
    icon: 'compare-arrows',
  },
  {
    id: 'analytics_3',
    category: 'analytics',
    title: 'Your Savings Rate',
    content: 'Savings rate = (Income - Expenses) / Income. Aim for at least 20%. Track it monthly.',
    icon: 'percent',
  },
  {
    id: 'analytics_4',
    category: 'analytics',
    title: 'Identify Patterns',
    content: 'Do you overspend on weekends? Before payday? In certain moods? Data reveals habits.',
    icon: 'insights',
  },
  {
    id: 'analytics_5',
    category: 'analytics',
    title: 'Category Deep Dives',
    content: 'When a category is over budget, look at individual transactions. The culprit is often one or two items.',
    icon: 'zoom-in',
  },
  {
    id: 'analytics_6',
    category: 'analytics',
    title: 'Set Benchmarks',
    content: 'Know your averages. When spending deviates, investigate why.',
    icon: 'straighten',
  },

  // General Financial Tips
  {
    id: 'gen_1',
    category: 'general',
    title: 'Financial Independence',
    content: 'It\'s not about being rich—it\'s about having options. Every dollar saved is a step toward freedom.',
    icon: 'flight-takeoff',
  },
  {
    id: 'gen_2',
    category: 'general',
    title: 'Debt Snowball',
    content: 'Pay minimums on all debts, then attack the smallest balance first. Quick wins build momentum.',
    icon: 'ac-unit',
  },
  {
    id: 'gen_3',
    category: 'general',
    title: 'Debt Avalanche',
    content: 'Pay minimums on all debts, then attack the highest interest rate first. Mathematically optimal.',
    icon: 'landscape',
  },
  {
    id: 'gen_4',
    category: 'general',
    title: 'Good Debt vs Bad Debt',
    content: 'Debt for appreciating assets (education, property) differs from debt for depreciating items (cars, electronics).',
    icon: 'thumbs-up-down',
  },
  {
    id: 'gen_5',
    category: 'general',
    title: 'Opportunity Cost',
    content: 'Every purchase has a hidden cost: what else could that money have done? A $500 impulse buy could be a flight.',
    icon: 'flight',
  },
  {
    id: 'gen_6',
    category: 'general',
    title: 'Time is Money',
    content: 'Calculate purchases in hours worked. Is that $100 item worth 5 hours of your labor?',
    icon: 'hourglass-empty',
  },
  {
    id: 'gen_7',
    category: 'general',
    title: 'Invest in Yourself',
    content: 'Skills and education pay dividends forever. They\'re investments, not expenses.',
    icon: 'school',
  },
  {
    id: 'gen_8',
    category: 'general',
    title: 'Don\'t Compare',
    content: 'Others\' spending is irrelevant. Focus on your goals, your values, your progress.',
    icon: 'visibility-off',
  },
  {
    id: 'gen_9',
    category: 'general',
    title: 'Financial Stress',
    content: 'Money worries affect health and relationships. Taking control of finances is self-care.',
    icon: 'self-improvement',
  },
  {
    id: 'gen_10',
    category: 'general',
    title: 'Progress Over Perfection',
    content: 'You won\'t budget perfectly. You\'ll slip up. What matters is getting back on track.',
    icon: 'refresh',
  },
];

// ============================================
// TOAST MESSAGES (Action-based feedback)
// ============================================

export const TOAST_MESSAGES: ToastMessage[] = [
  // First-time achievements
  {
    id: 'toast_first_tx',
    trigger: 'first_transaction',
    title: 'First Transaction!',
    message: 'You just took the first step. Awareness is the foundation of financial control.',
    icon: 'star',
  },
  {
    id: 'toast_first_budget',
    trigger: 'first_budget',
    title: 'Budget Created!',
    message: 'You just gave your money a job. Every dollar now has a purpose.',
    icon: 'check-circle',
  },
  {
    id: 'toast_first_goal',
    trigger: 'first_goal',
    title: 'Goal Set!',
    message: 'A goal written down is 42% more likely to happen. You\'re already ahead.',
    icon: 'flag',
  },
  {
    id: 'toast_first_contrib',
    trigger: 'first_contribution',
    title: 'First Contribution!',
    message: 'The journey of a thousand dollars begins with a single contribution.',
    icon: 'savings',
  },

  // Ongoing positive actions
  {
    id: 'toast_budget_created',
    trigger: 'budget_created',
    title: 'New Budget',
    message: 'Another category under control. You\'re building a spending plan that works.',
    icon: 'add-circle',
  },
  {
    id: 'toast_goal_created',
    trigger: 'goal_created',
    title: 'New Goal',
    message: 'Dreams with deadlines become reality. You\'ve got this.',
    icon: 'emoji-objects',
  },

  // Goal milestones
  {
    id: 'toast_25_pct',
    trigger: 'goal_25_percent',
    title: 'Quarter Way There!',
    message: 'You\'ve reached 25%. The hardest part—starting—is behind you.',
    icon: 'looks-one',
  },
  {
    id: 'toast_50_pct',
    trigger: 'goal_50_percent',
    title: 'Halfway!',
    message: 'You\'re at 50%. The momentum you\'ve built is real. Keep going.',
    icon: 'looks-two',
  },
  {
    id: 'toast_75_pct',
    trigger: 'goal_75_percent',
    title: 'Almost There!',
    message: '75% complete. The finish line is in sight. Don\'t slow down now.',
    icon: 'looks-3',
  },
  {
    id: 'toast_goal_done',
    trigger: 'goal_completed',
    title: 'Goal Complete!',
    message: 'You did it! This proves what you\'re capable of. What\'s next?',
    icon: 'emoji-events',
  },

  // Positive behaviors
  {
    id: 'toast_under_budget',
    trigger: 'under_budget',
    title: 'Under Budget!',
    message: 'You spent less than planned. That discipline is wealth-building.',
    icon: 'thumb-up',
  },
  {
    id: 'toast_streak_7',
    trigger: 'streak_7_days',
    title: '7-Day Streak!',
    message: 'A week of consistent tracking. Habits are forming.',
    icon: 'local-fire-department',
  },
  {
    id: 'toast_streak_30',
    trigger: 'streak_30_days',
    title: '30-Day Streak!',
    message: 'A full month! You\'ve built a tracking habit. This changes everything.',
    icon: 'whatshot',
  },
  {
    id: 'toast_income',
    trigger: 'income_logged',
    title: 'Income Logged',
    message: 'Money in. Now make it work for you—budget, save, invest.',
    icon: 'attach-money',
  },
  {
    id: 'toast_savings',
    trigger: 'savings_logged',
    title: 'Savings Added',
    message: 'You just paid your future self. That\'s real wealth-building.',
    icon: 'trending-up',
  },
  {
    id: 'toast_large_expense',
    trigger: 'large_expense_logged',
    title: 'Large Expense Noted',
    message: 'Big purchases tracked are big purchases controlled. Awareness prevents surprises.',
    icon: 'remove-circle',
  },
  {
    id: 'toast_tx_streak',
    trigger: 'transaction_streak',
    title: 'Tracking Streak!',
    message: 'Consistency is key. Every transaction logged is clarity gained.',
    icon: 'timeline',
  },
];

// ============================================
// EMPTY STATE CONTENT
// ============================================

export const EMPTY_STATE_TIPS: EmptyStateContent[] = [
  {
    screen: 'transactions',
    title: 'No transactions yet',
    subtitle: 'Start tracking your spending to see where your money goes.',
    tip: 'The average person has no idea where 30% of their money goes. You\'re about to change that.',
  },
  {
    screen: 'budgets',
    title: 'No budgets yet',
    subtitle: 'Create budgets to take control of your spending.',
    tip: 'A budget isn\'t a restriction—it\'s permission to spend guilt-free on what matters to you.',
  },
  {
    screen: 'goals',
    title: 'No savings goals yet',
    subtitle: 'Set goals for things you want to save for.',
    tip: 'People with written financial goals are 42% more likely to achieve them than those without.',
  },
  {
    screen: 'accounts',
    title: 'No accounts yet',
    subtitle: 'Add your bank accounts and credit cards to get started.',
    tip: 'Seeing all your accounts in one place is the first step to understanding your full financial picture.',
  },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get a random tip for a specific category
 */
export function getRandomTip(category: TipCategory): Tip {
  const categoryTips = INLINE_TIPS.filter(t => t.category === category);
  const randomIndex = Math.floor(Math.random() * categoryTips.length);
  return categoryTips[randomIndex];
}

/**
 * Get tips for a category, excluding already dismissed ones
 */
export function getAvailableTips(category: TipCategory, dismissedIds: string[]): Tip[] {
  return INLINE_TIPS.filter(
    t => t.category === category && !dismissedIds.includes(t.id)
  );
}

/**
 * Get toast message for a specific trigger
 */
export function getToastForTrigger(trigger: ToastTrigger): ToastMessage | undefined {
  return TOAST_MESSAGES.find(t => t.trigger === trigger);
}

/**
 * Get empty state content for a screen
 */
export function getEmptyStateContent(screen: EmptyStateContent['screen']): EmptyStateContent | undefined {
  return EMPTY_STATE_TIPS.find(e => e.screen === screen);
}

/**
 * Get the next tip in rotation for a category
 * Uses last shown tip ID to determine next
 */
export function getNextTip(
  category: TipCategory,
  lastShownId: string | null,
  dismissedIds: string[]
): Tip | null {
  const availableTips = getAvailableTips(category, dismissedIds);

  if (availableTips.length === 0) return null;

  if (!lastShownId) {
    return availableTips[0];
  }

  const lastIndex = availableTips.findIndex(t => t.id === lastShownId);
  const nextIndex = (lastIndex + 1) % availableTips.length;

  return availableTips[nextIndex];
}
