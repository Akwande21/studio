
"use client";
import type { User, UserRole, AuthContextType } from '@/lib/types';
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
      setUser(null); 
    } finally {
      setLoading(false);
    }
  }, []);

  const signIn = useCallback(async (credentials: { email: string }) => { // Simplified credentials
    setLoading(true);
    try {
      // loginUser (from data.ts) is our mock API call to find a user
      const foundUser = await loginUser(credentials.email);

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
  
  const signUp = useCallback(async (details: { name: string; email: string; role: UserRole }) => {
    setLoading(true);
    try {
      // createUser (from data.ts) is our mock API call to create and "save" a user
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

