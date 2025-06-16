
"use client";
import type { User, UserRole, AuthContextType } from '@/lib/types';
import { auth, db } from '@/lib/firebaseConfig'; // Import Firebase auth and db
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  type User as FirebaseUser 
} from 'firebase/auth';
import { addUserProfileToFirestore, getUserProfileFromFirestore } from '@/lib/data';
import React, { createContext, useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        // User is signed in, see docs for a list of available properties
        // https://firebase.google.com/docs/reference/js/firebase.User
        const userProfile = await getUserProfileFromFirestore(firebaseUser.uid);
        if (userProfile) {
          setUser(userProfile);
        } else {
          // This case might happen if Firestore profile creation failed or for an admin user
          // who needs their profile bootstrapped.
          // For simplicity, if an admin logs in and has no Firestore profile, we can try to create one.
          // This is a basic way to handle it; more robust solutions exist.
          if (firebaseUser.email === "ndlovunkosy21@gmail.com") {
            try {
              console.log("Admin user logged in, attempting to ensure Firestore profile exists.");
              await addUserProfileToFirestore(firebaseUser.uid, "Admin User", firebaseUser.email!, "Admin");
              const newProfile = await getUserProfileFromFirestore(firebaseUser.uid);
              setUser(newProfile);
            } catch (e) {
               console.error("Failed to create Firestore profile for admin:", e);
               setUser(null); // Or handle error appropriately
            }
          } else {
            console.warn(`User ${firebaseUser.uid} authenticated with Firebase, but no profile found in Firestore.`);
            // Potentially sign them out or prompt for profile creation.
            // For now, treat as not fully logged in to our app context.
            setUser(null); 
          }
        }
      } else {
        // User is signed out
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe(); // Cleanup subscription on unmount
  }, []);

  const signIn = useCallback(async (credentials: { email: string; password?: string }) => {
    if (!credentials.password) {
        toast({ title: "Sign In Failed", description: "Password is required.", variant: "destructive" });
        return;
    }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, credentials.email, credentials.password);
      // onAuthStateChanged will handle setting the user state
      // toast({ title: "Signed In", description: `Welcome back!` }); // Toast can be shown here or after user state is set
    } catch (error: any) {
      console.error("Firebase Sign In Error:", error);
      toast({ title: "Sign In Failed", description: error.message || "Invalid credentials.", variant: "destructive" });
    } finally {
      // setLoading(false); // onAuthStateChanged handles final loading state
    }
  }, [toast]);
  
  const signUp = useCallback(async (details: { name: string; email: string; password?: string; role: UserRole }) => {
    if (!details.password) {
        toast({ title: "Sign Up Failed", description: "Password is required.", variant: "destructive" });
        return;
    }
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, details.email, details.password);
      const firebaseUser = userCredential.user;
      // Store additional user details (name, role) in Firestore
      await addUserProfileToFirestore(firebaseUser.uid, details.name, details.email, details.role);
      // onAuthStateChanged will handle setting the user state
      // toast({ title: "Sign Up Successful", description: `Welcome, ${details.name}!` });
    } catch (error: any) {
      console.error("Firebase Sign Up Error:", error);
      toast({ title: "Sign Up Error", description: error.message || "Could not create account.", variant: "destructive" });
    } finally {
      // setLoading(false); // onAuthStateChanged handles final loading state
    }
  }, [toast]);

  const signOut = useCallback(async () => {
    setLoading(true);
    try {
      await firebaseSignOut(auth);
      // onAuthStateChanged will handle setting user to null
      toast({ title: "Signed Out", description: "You have been successfully signed out." });
    } catch (error: any) {
      toast({ title: "Sign Out Error", description: error.message, variant: "destructive" });
    } finally {
       // setLoading(false); // onAuthStateChanged handles final loading state
    }
  }, [toast]);

  const sendPasswordResetEmail = useCallback(async (email: string) => {
    setLoading(true);
    try {
        await firebaseSendPasswordResetEmail(auth, email);
        toast({ title: "Password Reset Email Sent", description: "Check your email for instructions to reset your password." });
    } catch (error: any) {
        toast({ title: "Password Reset Error", description: error.message, variant: "destructive"});
    } finally {
        setLoading(false);
    }
  }, [toast]);


  return (
    <AuthContext.Provider value={{ user, signIn, signUp, signOut, sendPasswordResetEmail, loading, isAuthenticated: !!user && !loading }}>
      {children}
    </AuthContext.Provider>
  );
};
