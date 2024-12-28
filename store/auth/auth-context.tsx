import { useContext, createContext, type PropsWithChildren } from "react";
import { useStorageState } from "../../hooks/useStorageState";
import { AuthContextType } from "@/types/auth-types";
import { auth, app } from "@/firebaseConfig";
import { createUserWithEmailAndPassword } from "firebase/auth";
const AuthContext = createContext<AuthContextType>({
  signIn: (value) => null,
  signOut: () => null,
  signUp: (value) => null,
  session: null,
  isLoading: false,
});

// This hook can be used to access the user info.
export function useSession() {
  const value = useContext(AuthContext);
   if (!value) {
      throw new Error("useSession must be wrapped in a <SessionProvider />");
    }

  return value;
}

export function SessionProvider({ children }: PropsWithChildren) {
  const [[isLoading, session], setSession] = useStorageState('session');

  return (
    <AuthContext.Provider
      value={{
        signIn: (value) => {
          // #TODO: Perform sign-in logic here firebase and google options
          // if firebase success 
          setSession('xxx'); 
          //else return error
        },
        signOut: () => {
          // #TODO Perform sign-out logic here
          setSession(null);
        },
        signUp: (value) => {
              console.log('Firebase auth initialized', auth);
          // #TODO Perform sign-up logic and then sign in here firebase ? google ?
          
          const user: any = createUserWithEmailAndPassword(auth, value.email, value.password);
          console.log('User created', user);
          // firebase success -> signIn()
          setSession('xxx');
          //else return error
        },
        session,
        isLoading,
      }}>
      {children}
    </AuthContext.Provider>
  );
}
