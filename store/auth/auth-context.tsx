import { useContext, createContext, type PropsWithChildren } from "react";
import { useStorageState } from "../../hooks/useStorageState";
import { AuthContextType, CreateUser, User } from "@/types/auth-types";
import { auth, app } from "@/firebaseConfig";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateCurrentUser, updateProfile } from "firebase/auth";
import {
  addDoc,
  collection,
  getFirestore,
  Timestamp,
} from "firebase/firestore";
import { popToast } from "@/utilities/toast-utilities";

const AuthContext = createContext<AuthContextType>({
  signIn: (value) => null,
  signOut: () => null,
  signUp: (value) => null,
  session: {
    token: "",
    user: {
      uid: "",
      displayName: "",
      email: "",
    },
  },
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
  const [[isLoading, session], setSession] = useStorageState<AuthContextType["session"]>("session");

  return (
    <AuthContext.Provider
      value={{
        signIn: async (value) => {
          try {
            const credential = await signInWithEmailAndPassword(auth, value.email, value.password);
            if (credential) {
              const token = await credential.user.getIdToken();
              setSession({
                token,
                user: {
                  uid: credential.user.uid,
                  displayName: credential.user.displayName ?? "",
                  email: credential.user.email ?? "",
                },
              });
            }
          } catch (error) {
            let errorMessage = "";
            if (error instanceof Error) {
              errorMessage = error.message;
            }else if (typeof error === "string") {
              errorMessage = error;
            }else{
              errorMessage = "An unknown error occurred";
            }
            popToast({ type: "error", text1: "Error signing in", text2: errorMessage });
          }
          
        },
        signOut: async () => {
          try {
            await signOut(auth);
            setSession(null);
          } catch (error) {
            let errorMessage = "";
            if (error instanceof Error) {
              errorMessage = error.message;
            } else if (typeof error === "string") {
              errorMessage = error;
            }else{
              errorMessage = "An unknown error occurred";
            }
            popToast({ type: "error", text1: "Error signing out", text2: errorMessage });
          }
        },
        signUp: async (value) => {
          try {
            const credential = await createUserWithEmailAndPassword(auth, value.email, value.password);
            if (credential) {
              const userData: CreateUser = {
                uid: credential.user.uid,
                displayName: value?.displayName ?? "",
                email: credential.user?.email ?? "",
                createdAt: Timestamp.now(),
                profilePicture: "", // implement later after adding a settings modal 
              };
              await updateProfile(credential.user, { displayName: value.displayName });
              await addDoc(collection(getFirestore(app), "users"), userData);

              const token = await credential.user.getIdToken();
              console.log("User created successfully", credential.user);
              setSession({
                token,
                user: {
                  uid: credential.user.uid,
                  displayName: credential.user.displayName ?? "",
                  email: credential.user.email ?? "",
                },
              });
            }
          } catch (error) {
            let errorMessage = "";
            if (error instanceof Error) {
              errorMessage = error.message;
            } else if (typeof error === "string") {
              errorMessage = error;
            }else{
              errorMessage = "An unknown error occurred";
            }
            popToast({ type: "error", text1: "Error signing up", text2: errorMessage });
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
