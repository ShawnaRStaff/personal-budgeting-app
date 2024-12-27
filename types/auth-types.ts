
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

export type AuthInputValueKey = "confirmPassword" | "email" | "displayName" | "password";