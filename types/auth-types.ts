import { Timestamp } from "firebase/firestore";
export interface AuthFormProps {
    confirmPassword?: string;
    displayName?: string;
    email: string;
    password: string;
}
export interface AuthContextType {
    isLoading: boolean;
    session?: string | null;
    signIn: (value: AuthFormProps) => void;
    signOut: () => void;
    signUp: (value: AuthFormProps) => void;
}

export interface User {
    uid: string;
    displayName: string;
    email: string;
    createdAt: Timestamp;
    profilePicture: string;
}

export type AuthInputValueKey = "confirmPassword" | "email" | "displayName" | "password";