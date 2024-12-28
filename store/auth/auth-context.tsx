import { useContext, createContext, type PropsWithChildren } from "react";
import { useStorageState } from "../../hooks/useStorageState";
import { AuthContextType, User } from "@/types/auth-types";
import { auth, app } from "@/firebaseConfig";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "firebase/auth";
import {
  addDoc,
  collection,
  getFirestore,
  Timestamp,
} from "firebase/firestore";
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
  const [[isLoading, session], setSession] = useStorageState("session");

  return (
    <AuthContext.Provider
      value={{
        // #TODO: correct error handling, pop toast with error message?
        // #TODO: add google sign in integration
        signIn: async(value) => {
          try{
            const credential = await signInWithEmailAndPassword(auth, value.email, value.password);
            if(credential){
              const token = await credential.user.getIdToken();
              setSession(token);
            }

          }catch(error){
            console.error("Error signing in", error);
          }
        },
        signOut: async () => {
          try {
            await signOut(auth);
            setSession(null);
          } catch (error) {
            console.error("Error signing out", error);
          }
        },
        signUp: async (value) => {
          try {
            const credential: any = await createUserWithEmailAndPassword(
              auth,
              value.email,
              value.password
            );
            if (credential) {
              const userData: User = {
                uid: credential.user.uid,
                displayName: value?.displayName ?? "",
                email: credential.user.email,
                createdAt: Timestamp.now(),
                profilePicture: "",
              };
              await addDoc(collection(getFirestore(app), "users"), {
                ...userData,
              });
              const token = await credential.user.getIdToken();
              setSession(token);
            }
          } catch (error) {
            console.error("Error creating user", error);
          }
        },
        session,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
