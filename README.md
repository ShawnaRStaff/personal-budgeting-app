# Personal Budget

A modern, intuitive personal finance app built with React Native and Expo. Track expenses, manage budgets, and achieve your savings goals.

![Platform](https://img.shields.io/badge/platform-Android-green)
![Built with](https://img.shields.io/badge/built%20with-React%20Native-blue)
![Expo](https://img.shields.io/badge/Expo-SDK%2052-black)

## Features

### Expense Tracking
- Log transactions with categories, amounts, and notes
- View spending history by day, week, month, or custom date range
- Support for multiple accounts (checking, savings, cash, credit cards)
- Categorize expenses to understand where your money goes

### Budget Management
- Create monthly budgets for any spending category
- Visual progress bars show spending vs. limits
- Get notified when approaching budget thresholds
- Track multiple budgets simultaneously

### Savings Goals
- Set savings goals with target amounts and deadlines
- Track progress with visual indicators
- Log contributions toward each goal
- Stay motivated as you watch your savings grow

### Dashboard & Insights
- Financial snapshot at a glance
- Recent transactions and budget status
- Track net worth across all accounts
- Understand your spending patterns

## Tech Stack

- **Framework:** React Native with Expo
- **Language:** TypeScript
- **Backend:** Firebase (Firestore, Authentication)
- **Navigation:** React Navigation
- **UI:** Custom components with React Native

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI
- Android Studio (for Android development)
- Firebase project

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/ShawnaRStaff/personal-budgeting-app.git
   cd personal-budgeting-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```

   Add your Firebase configuration to `.env.local`:
   ```
   EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
   EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

4. Start the development server:
   ```bash
   npx expo start
   ```

### Running on Device

```bash
# Android
npx expo run:android

# iOS
npx expo run:ios
```

## Project Structure

```
src/
├── components/     # Reusable UI components
├── contexts/       # React Context providers
├── screens/        # App screens
├── services/       # Firebase and API services
├── theme/          # Colors, typography, styles
└── types/          # TypeScript type definitions
```

## Building for Production

```bash
# Build for Android
eas build --platform android --profile production

# Submit to Play Store
eas submit --platform android --latest
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the [MIT License](LICENSE).

## Acknowledgments

- Built with [Expo](https://expo.dev)
- Icons from [Material Design Icons](https://materialdesignicons.com)
- Backend powered by [Firebase](https://firebase.google.com)
