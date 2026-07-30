"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signInWithPopup, signOut, User } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";

const ADMIN_EMAIL = "satyamkamat4@gmail.com";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  isAdmin: false,
  signInWithGoogle: async () => {},
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
    await signInWithPopup(auth, googleProvider);
  };

  const logout = async () => {
    document.cookie = "session=; path=/; max-age=0";
    await signOut(auth);
  };

  const isAdmin = user?.email === ADMIN_EMAIL;

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, signInWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
