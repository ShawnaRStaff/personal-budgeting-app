import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { User, UserPreferences, Currency, DEFAULT_NOTIFICATION_PREFERENCES } from '../types';

const DEFAULT_PREFERENCES: UserPreferences = {
  currency: Currency.USD,
  dateFormat: 'MM/DD/YYYY',
  theme: 'dark',
  notifications: DEFAULT_NOTIFICATION_PREFERENCES,
};

/**
 * Sign up a new user with email and password
 */
export async function signUp(
  email: string,
  password: string,
  displayName: string
): Promise<User> {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const firebaseUser = userCredential.user;

  // Update display name in Firebase Auth
  await updateProfile(firebaseUser, { displayName });

  // Create user document in Firestore
  const user: Omit<User, 'id'> = {
    email: firebaseUser.email!,
    displayName,
    createdAt: new Date(),
    updatedAt: new Date(),
    preferences: DEFAULT_PREFERENCES,
  };

  await setDoc(doc(db, 'users', firebaseUser.uid), {
    ...user,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return { id: firebaseUser.uid, ...user };
}

/**
 * Sign in an existing user
 */
export async function signIn(email: string, password: string): Promise<User> {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const firebaseUser = userCredential.user;

  // Get user document from Firestore
  const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));

  if (userDoc.exists()) {
    const data = userDoc.data();
    return {
      id: firebaseUser.uid,
      email: data.email,
      displayName: data.displayName,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      preferences: data.preferences || DEFAULT_PREFERENCES,
    };
  }

  // Fallback if no Firestore document exists
  return {
    id: firebaseUser.uid,
    email: firebaseUser.email!,
    displayName: firebaseUser.displayName || 'User',
    createdAt: new Date(),
    updatedAt: new Date(),
    preferences: DEFAULT_PREFERENCES,
  };
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

/**
 * Send password reset email
 */
export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

/**
 * Get the current Firebase user
 */
export function getCurrentUser(): FirebaseUser | null {
  return auth.currentUser;
}

/**
 * Subscribe to auth state changes
 */
export function subscribeToAuthChanges(
  callback: (user: FirebaseUser | null) => void
): () => void {
  return onAuthStateChanged(auth, callback);
}

/**
 * Get user profile from Firestore
 */
export async function getUserProfile(userId: string): Promise<User | null> {
  const userDoc = await getDoc(doc(db, 'users', userId));

  if (!userDoc.exists()) {
    return null;
  }

  const data = userDoc.data();
  return {
    id: userId,
    email: data.email,
    displayName: data.displayName,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
    preferences: data.preferences || DEFAULT_PREFERENCES,
  };
}

/**
 * Update user preferences
 */
export async function updateUserPreferences(
  userId: string,
  preferences: Partial<UserPreferences>
): Promise<void> {
  await setDoc(
    doc(db, 'users', userId),
    {
      preferences,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}
