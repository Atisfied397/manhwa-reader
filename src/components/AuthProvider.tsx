"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  updateProfile,
  User,
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";

const ADMIN_EMAIL = "satyamkamat4@gmail.com";

function isNativeApp(): boolean {
  try {
    // @ts-expect-error - Capacitor runtime check
    return typeof window !== "undefined" && window.Capacitor?.isNativePlatform?.() === true;
  } catch {
    return false;
  }
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (
    email: string,
    password: string,
    displayName?: string,
  ) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  isAdmin: false,
  signInWithGoogle: async () => {},
  signInWithEmail: async () => {},
  signUpWithEmail: async () => {},
  sendPasswordReset: async () => {},
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Handle redirect result from Firebase (native app flow)
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          const redirectTo = sessionStorage.getItem("authRedirectTo") || "/";
          sessionStorage.removeItem("authRedirectTo");
          window.location.replace(redirectTo);
        }
      })
      .catch(() => {});

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const session = JSON.stringify({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
        });
        document.cookie = `session=${encodeURIComponent(session)}; path=/; max-age=86400; SameSite=Lax`;
      } else {
        document.cookie = "session=; path=/; max-age=0";
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    if (isNativeApp()) {
      // Use redirect flow for native WebView (popup doesn't work)
      await signInWithRedirect(auth, googleProvider);
    } else {
      await signInWithPopup(auth, googleProvider);
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUpWithEmail = async (
    email: string,
    password: string,
    displayName?: string,
  ) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName) {
      await updateProfile(cred.user, { displayName });
    }
  };

  const sendPasswordReset = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const logout = async () => {
    document.cookie = "session=; path=/; max-age=0";
    await signOut(auth);
  };

  const isAdmin = user?.email === ADMIN_EMAIL;

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, signInWithGoogle, signInWithEmail, signUpWithEmail, sendPasswordReset, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
