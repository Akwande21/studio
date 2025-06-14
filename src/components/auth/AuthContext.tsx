"use client";
import type { User, PaperLevel, AuthContextType } from '@/lib/types';
import { createUser, loginUser } from '@/lib/data';
import React, { createContext, useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

const MOCK_USER_STORAGE_KEY = 'papertrail_mock_user';

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem(MOCK_USER_STORAGE_KEY);
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Failed to load user from localStorage", error);
      // If parsing fails or localStorage is unavailable, ensure user is null
      setUser(null); 
    } finally {
      setLoading(false);
    }
  }, []);

  const signIn = useCallback(async (credentials: { email: string; name?: string; role?: PaperLevel }) => {
    setLoading(true);
    try {
      // In a real app, name and role might not be passed for sign-in, only email/password.
      // For mock, we'll use loginUser if it exists, or create a simple user if details are provided.
      let foundUser = await loginUser(credentials.email);
      if (!foundUser && credentials.name && credentials.role) {
         // This path is more like a quick sign-up/sign-in combo for mock
         foundUser = { id: Date.now().toString(), email: credentials.email, name: credentials.name, role: credentials.role, avatarUrl: 'https://placehold.co/100x100' };
      }

      if (foundUser) {
        setUser(foundUser);
        localStorage.setItem(MOCK_USER_STORAGE_KEY, JSON.stringify(foundUser));
        toast({ title: "Signed In", description: `Welcome back, ${foundUser.name}!` });
      } else {
        toast({ title: "Sign In Failed", description: "User not found. Please check your email or sign up.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Sign In Error", description: (error as Error).message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);
  
  const signUp = useCallback(async (details: { name: string; email: string; role: PaperLevel }) => {
    setLoading(true);
    try {
      const newUser = await createUser(details.name, details.email, details.role);
      setUser(newUser);
      localStorage.setItem(MOCK_USER_STORAGE_KEY, JSON.stringify(newUser));
      toast({ title: "Sign Up Successful", description: `Welcome, ${newUser.name}!` });
    } catch (error) {
      toast({ title: "Sign Up Error", description: (error as Error).message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const signOut = useCallback(() => {
    setUser(null);
    localStorage.removeItem(MOCK_USER_STORAGE_KEY);
    toast({ title: "Signed Out", description: "You have been successfully signed out." });
  }, [toast]);

  return (
    <AuthContext.Provider value={{ user, signIn, signUp, signOut, loading, isAuthenticated: !!user && !loading }}>
      {children}
    </AuthContext.Provider>
  );
};
