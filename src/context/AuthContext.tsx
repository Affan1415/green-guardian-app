
"use client";
import type { ReactNode } from 'react';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, database } from '@/config/firebase'; // Using mocked Firebase
import type { UserProfile } from '@/types';
import { useRouter, usePathname } from 'next/navigation';

interface AuthContextType {
  currentUser: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  login: (email: string, password?: string) => Promise<any>;
  signup: (email: string, password?: string) => Promise<any>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        // In a real app, fetch role from Firestore/RTDB after auth.
        // For mock, role is part of UserProfile from mockUsers
        const userRole = await database.getUserRole(user.uid);
        const profile: UserProfile = { ...user, role: userRole || 'user' };
        setCurrentUser(profile);
        setIsAdmin(profile.role === 'admin');
      } else {
        setCurrentUser(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!loading && !currentUser && !pathname.startsWith('/login') && !pathname.startsWith('/signup')) {
      router.push('/login');
    }
  }, [currentUser, loading, router, pathname]);

  const login = async (email: string, password?: string) => {
    setLoading(true);
    try {
      const { user: firebaseUser } = await auth.signInWithEmailAndPassword(email, password);
       // Role is set via onAuthStateChanged effect
      setLoading(false);
      return firebaseUser;
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const signup = async (email: string, password?: string) => {
    setLoading(true);
    try {
      const { user: firebaseUser } = await auth.createUserWithEmailAndPassword(email, password);
      // New users are 'user' by default, role set via onAuthStateChanged effect
      setLoading(false);
      return firebaseUser;
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    setLoading(true);
    await auth.signOut();
    setCurrentUser(null);
    setIsAdmin(false);
    setLoading(false);
    router.push('/login');
  };

  const value = {
    currentUser,
    loading,
    isAdmin,
    login,
    signup,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
