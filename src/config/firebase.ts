import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { initializeAuth, Auth, getAuth, Persistence } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Firebase Auth for React Native requires this persistence helper
// eslint-disable-next-line @typescript-eslint/no-var-requires
const getReactNativePersistence = (storage: typeof AsyncStorage): Persistence => {
  return require('firebase/auth').getReactNativePersistence(storage);
};

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

if (getApps().length === 0) {
  // First initialization
  app = initializeApp(firebaseConfig);
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
  db = getFirestore(app);
} else {
  // Already initialized (hot reload)
  app = getApp();
  // Try to get existing auth, fallback to getAuth if initializeAuth already called
  try {
    auth = getAuth(app);
  } catch {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  }
  db = getFirestore(app);
}

export { auth, db };
export default app;
