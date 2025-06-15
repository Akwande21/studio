
"use client";
import type { User, UserRole, AuthContextType } from '@/lib/types';
import { createUser, loginUser, mockUsers } from '@/lib/data'; // Added mockUsers import
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
      const storedUserString = localStorage.getItem(MOCK_USER_STORAGE_KEY);
      if (storedUserString) {
        const loadedUserFromStorage: User = JSON.parse(storedUserString);
        
        // Ensure user from localStorage exists in the current mockUsers array.
        // This handles cases where mockUsers is reset (e.g., dev server restart)
        // but the user session persists in localStorage.
        const userInMockData = mockUsers.find(u => u.id === loadedUserFromStorage.id);
        if (!userInMockData) {
          // If user is not in mockUsers, add them back.
          // This makes the mock system behave more like a persistent DB for dev purposes.
          // Check if user with same email already exists to avoid duplicates if ID generation was different
          const existingUserByEmail = mockUsers.find(u => u.email === loadedUserFromStorage.email);
          if (!existingUserByEmail) {
            mockUsers.push(loadedUserFromStorage);
          } else {
            // If user with same email but different ID exists, update the stored user to use existing ID to avoid conflicts.
            // This is an edge case for mock environments.
            localStorage.setItem(MOCK_USER_STORAGE_KEY, JSON.stringify(existingUserByEmail));
            setUser(existingUserByEmail);
            setLoading(false);
            return;
          }
        }
        setUser(loadedUserFromStorage);
      }
    } catch (error) {
      console.error("Failed to load user from localStorage or sync with mock data", error);
      // If there's an error (e.g., malformed JSON), clear the problematic item
      localStorage.removeItem(MOCK_USER_STORAGE_KEY);
      setUser(null); 
    } finally {
      setLoading(false);
    }
  }, []);

  const signIn = useCallback(async (credentials: { email: string }) => { 
    setLoading(true);
    try {
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
