export default {
  expo: {
    name: "Personal Budget",
    slug: "personal-budgeting-app",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#0D0D0D"
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.staff.budgeting"
    },
    android: {
      package: "com.staff.budgeting",
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#0D0D0D"
      },
      edgeToEdgeEnabled: true,
      googleServicesFile: process.env.GOOGLE_SERVICES_JSON || "./google-services.json"
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    extra: {
      eas: {
        projectId: "1e4cc392-7cc2-4b2f-91a4-b676d99b8cd4"
      }
    },
    plugins: [
      "expo-font",
      [
        "@sentry/react-native/expo",
        {
          "url": "https://sentry.io/",
          "project": "budgeting-app",
          "organization": "msi-industries"
        }
      ]
    ]
  }
};
