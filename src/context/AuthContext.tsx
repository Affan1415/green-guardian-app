
"use client";
import type { ReactNode } from 'react';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '@/config/firebase'; // Using REAL Firebase
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
    // auth.onAuthStateChanged now directly provides UserProfile | null
    const unsubscribe = auth.onAuthStateChanged((userProfile) => {
      if (userProfile) {
        setCurrentUser(userProfile);
        setIsAdmin(userProfile.role === 'admin');
      } else {
        setCurrentUser(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const publicPaths = ['/', '/login', '/signup'];
    if (!loading && !currentUser && !publicPaths.some(p => pathname === p || (p !== '/' && pathname.startsWith(p)))) {
      router.push('/login');
    }
  }, [currentUser, loading, router, pathname]);

  const login = async (email: string, password?: string) => {
    setLoading(true);
    try {
      // auth.signInWithEmailAndPassword from firebase.ts now returns { user: UserProfile }
      const { user } = await auth.signInWithEmailAndPassword(email, password);
      // State updates (currentUser, isAdmin) will be handled by the onAuthStateChanged listener
      setLoading(false);
      return user; // Return the UserProfile
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const signup = async (email: string, password?: string) => {
    setLoading(true);
    try {
      // auth.createUserWithEmailAndPassword from firebase.ts now returns { user: UserProfile }
      const { user } = await auth.createUserWithEmailAndPassword(email, password);
      // State updates handled by onAuthStateChanged
      setLoading(false);
      return user; // Return the UserProfile
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    setLoading(true);
    await auth.signOut();
    // State updates (currentUser, isAdmin to null/false) handled by onAuthStateChanged
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
